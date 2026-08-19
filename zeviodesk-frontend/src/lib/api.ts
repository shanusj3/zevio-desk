// Central API client - all backend calls go through here
const BASE_URL = 'http://localhost:3001/api';

// ── Token storage ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'zevio_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || json.error || 'Request failed');
  }

  return json.data as T;
}


// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string | null;
  };
  accessToken?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const result = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.accessToken) {
      tokenStore.set(result.accessToken);
    }
    return result;
  },

  logout: async () => {
    tokenStore.clear();
    return request<void>('/auth/logout', { method: 'POST' });
  },

  me: () => request<LoginResponse['user']>('/auth/me'),

  setupPassword: async (token: string, password: string): Promise<void> => {
    const result = await request<{ accessToken?: string }>('/auth/setup-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    if (result?.accessToken) {
      tokenStore.set(result.accessToken);
    }
  },

  verifySetupToken: (token: string) =>
    request<{ valid: boolean; reason?: 'expired' | 'already_used' | 'invalid' }>(
      `/auth/verify-setup-token?token=${encodeURIComponent(token)}`

    ),
};

// ─── Tenants ─────────────────────────────────────────────────────────────────
import { Tenant } from '../types';

export interface FetchTenantsParams {
  search?: string;
  status?: string;
  alphabet?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTenants {
  tenants: Tenant[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export const tenantsApi = {
  fetchAll: async (params: FetchTenantsParams = {}): Promise<PaginatedTenants> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.status && params.status !== 'All') searchParams.append('status', params.status);
    if (params.alphabet && params.alphabet !== 'All') searchParams.append('alphabet', params.alphabet);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const queryStr = searchParams.toString();
    const url = queryStr ? `/tenants?${queryStr}` : '/tenants';

    const raw = await request<PaginatedTenants | Tenant[]>(url);

    // Normalize: backend may return a plain array or a paginated object
    if (Array.isArray(raw)) {
      return {
        tenants: raw,
        total: raw.length,
        hasMore: false,
        page: params.page ?? 1,
        limit: params.limit ?? raw.length,
      };
    }

    return raw;
  },

  getPresignedUrl: (id: string, contentType: string) =>
    request<{ url: string; fields: Record<string, string>; fileUrl: string }>(`/tenants/${id}/logo/presign`, {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    }),

  uploadToS3: async (url: string, fields: Record<string, string>, file: File) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to upload file to S3');
    }
  },

  fetchOne: (id: string) => request<Tenant>(`/tenants/${id}`),

  create: (data: Partial<Tenant>) =>
    request<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Tenant>) =>
    request<Tenant>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: string) =>
    request<Tenant>(`/tenants/${id}/status`, {
      method: 'PATCH',
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/tenants/${id}`, {
      method: 'DELETE',
    }),
};

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'MANAGER' | 'ADVISOR' | 'TECHNICIAN' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tenantId: string | null;
  phone?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  maxConcurrentJobs?: number | null;
  createdAt: string;
}

export const usersApi = {
  fetchByTenant: (tenantId: string) =>
    request<TenantUser[]>(`/users?tenantId=${tenantId}`),

  fetchAll: (staffOnly = true) =>
    request<TenantUser[]>(`/users?staffOnly=${staffOnly}`),

  create: (data: Partial<TenantUser> & { password?: string }) =>
    request<TenantUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<TenantUser> & { password?: string }) =>
    request<TenantUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface PlatformReports {
  estimatedMonthlyRevenue: number;
  averageUsersPerTenant: number;
  activeCount: number;
  inactiveCount: number;
  totalTenants: number;
  totalUsers: number;
  churnRate: number;
  tenantGrowthTrend: { month: string; value: number }[];
}

export interface TenantReports {
  overview: {
    invoicedAmount: number;
    collectedAmount: number;
    refundedAmount: number;
    netCollected: number;
    periodOutstanding: number;
    cumulativeOutstanding: number;
    overdueAmount: number;
    numTickets: number;
    completedTickets: number;
    readyForPickupTickets: number;
    avgRepairValue: number;
    avgCompletionTimeDays: number;
    totalPartsCost: number;
    totalLaborCost: number;
    invoiceSubtotal: number;
    estimatedGrossProfit: number;
    grossMarginPercent: number;
    profitabilityStatus: 'FULL' | 'CONTRIBUTION' | 'UNAVAILABLE';
  };
  revenue: {
    totalInvoiced: number;
    totalCollected: number;
    outstanding: number;
    refunded: number;
    revenueByPeriod: { date: string; amount: number }[];
    revenueByServiceType: { name: string; value: number }[];
    revenueByTechnician: { name: string; value: number }[];
    revenueByPaymentMethod: { name: string; value: number }[];
  };
  tickets: {
    totalTickets: number;
    statusBreakdown: { name: string; value: number }[];
    averageResolutionTime: number;
    ticketsByPriority: { name: string; value: number }[];
    ticketsByCategory: { name: string; value: number }[];
    ticketsByBrand: { name: string; value: number }[];
    ticketsByTechnician: { name: string; value: number }[];
  };
  payments: {
    totalCollected: number;
    refunds: number;
    netCollected: number;
    byMethod: { name: string; value: number }[];
    outstanding: number;
    overdue: number;
    outstandingList: {
      id: string;
      invoiceNumber: string;
      customerName: string;
      dueAmount: number;
      dueDate: string;
      status: string;
    }[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  technicians: {
    id: string;
    name: string;
    assigned: number;
    completed: number;
    avgCompletionTime: number;
    pending: number;
    serviceRevenue: number;
    partsValue: number;
    totalValue: number;
  }[];
  inventory: {
    partsConsumed: number;
    partsCost: number;
    mostUsedParts: { name: string; quantity: number; totalCost: number }[];
    lowStock: { name: string; stock: number; minStock: number }[];
    totalInventoryValue: number;
  };
  profitability: {
    totalInvoiced: number;
    taxCollected: number;
    invoiceSubtotal: number;
    partsRevenue: number;
    serviceRevenue: number;
    partsCost: number;
    laborCost: number;
    grossProfit: number;
    grossMarginPercent: number;
    estimatedContribution: number;
    profitabilityStatus: 'FULL' | 'CONTRIBUTION' | 'UNAVAILABLE';
    profitabilityByBrand: { name: string; revenue: number; profit: number; margin: number }[];
    profitabilityByCategory: { name: string; revenue: number; profit: number; margin: number }[];
  };
}

export const reportsApi = {
  fetchPlatformMetrics: () => request<PlatformReports>('/reports'),
  fetchTenantMetrics: (startDate: string, endDate: string, page = 1, limit = 10, timezone = 'Asia/Kolkata') =>
    request<TenantReports>(`/reports/tenant?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}&timezone=${timezone}`),
};

// ─── Payments ────────────────────────────────────────────────────────────────
export type PaymentType = 'ADVANCE' | 'PARTS' | 'PARTIAL' | 'FINAL' | 'REFUND';

export interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  type: PaymentType;
  method?: string | null;
  notes?: string | null;
  reference?: string | null;
  paidAt: string;
  recordedBy?: { name: string } | null;
}

export const paymentsApi = {
  list: (ticketId: string) => request<Payment[]>(`/tickets/${ticketId}/payments`),
  create: (ticketId: string, data: Partial<Payment>) =>
    request<Payment>(`/tickets/${ticketId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Tickets ─────────────────────────────────────────────────────────────────
export interface Ticket {
  id: string;
  tenantId: string;
  customerId: string;
  assignedToId: string | null;
  /** Human-facing ticket reference (random per tenant). */
  jobNumber?: string;
  title: string;
  description: string;
  status: 'RECEIVED' | 'DIAGNOSING' | 'WAITING_FOR_PARTS' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  priority: 'NORMAL' | 'URGENT' | 'WARRANTY';
  itemCategory?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  itemCondition?: string | null;
  accessories?: string | null;
  reportedIssue?: string | null;
  estimatedCost?: number | null;
  totalAmount?: number | null;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  partsRequired?: { id: string; name: string; price: number; quantity: number }[] | null;
  attachments?: any[] | null;
  internalNotes?: string | null;
  payments?: Payment[];
  amountPaid?: number;
  balanceDue?: number;
  advanceAmount?: number;
  paymentMethod?: string;
  advanceNotes?: string;
  advanceDeposit?: number;
  tax?: number | null;
  discount?: number | null;
  estimatedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  pickupDate?: string | null;
  followUpDate?: string | null;
  warrantyStatus?: string | null;
  approvedByCustomer?: boolean;
  approvalMethod?: string | null;
  approvalDate?: string | null;
  pickupSignatureUrl?: string | null;
  feedbackRating?: number | null;
  techDiagnosis?: string | null;
  diagnosisNotes?: string | null;
  rootCause?: string | null;
  laborDescription?: string | null;
  timeSpent?: string | null;
  partsSourcedFrom?: string | null;
  partsCost?: number | null;
  laborCost?: number | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface FetchTicketsParams {
  status?: string;
  statusIn?: string[];  // multiple status filter — sent as ?statusIn=RECEIVED,DIAGNOSING
  startDate?: string;
  endDate?: string;
}

/** Typed payload for creating a new ticket — replaces `Partial<Ticket> as any` at call sites. */
export interface CreateTicketPayload {
  id?: string;
  customerId: string;
  title: string;
  description: string;
  priority: 'NORMAL' | 'URGENT' | 'WARRANTY';
  status: 'RECEIVED';
  assignedToId?: string;
  itemCategory?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  itemCondition?: string;
  accessories?: string;
  reportedIssue?: string;
  estimatedCost?: number;
  advanceAmount?: number;
  paymentMethod?: string;
  advanceNotes?: string;
  attachments?: {
    id: string;
    url: string;
    type: 'photo' | 'video';
    stage: string;
    uploadedAt: string;
    fileName: string;
  }[];
}

/** Typed payload for updating a ticket. All fields are optional. */
export type UpdateTicketPayload = Partial<Omit<Ticket, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'customer' | 'assignedTo' | 'payments'>>;

export const ticketsApi = {
  readyForPickup: () => request<ReadyForPickupTicket[]>('/tickets/ready-for-pickup'),

  deliver: (id: string) => request<Ticket>(`/tickets/${id}/deliver`, { method: 'POST' }),
  fetchAll: async (params: FetchTicketsParams = {}): Promise<Ticket[]> => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'All') {
      searchParams.append('status', params.status);
    }
    if (params.statusIn && params.statusIn.length > 0) {
      searchParams.append('statusIn', params.statusIn.join(','));
    }
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    const queryStr = searchParams.toString();
    const url = queryStr ? `/tickets?${queryStr}` : '/tickets';
    return request<Ticket[]>(url);
  },

  fetchOne: (id: string) => request<Ticket>(`/tickets/${id}`),

  create: (data: CreateTicketPayload) =>
    request<Ticket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTicketPayload) =>
    request<Ticket>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/tickets/${id}`, {
      method: 'DELETE',
    }),

  getAttachmentPresign: (
    ticketId: string,
    contentType: string,
    fileType: 'photo' | 'video'
  ) =>
    request<{ url: string; fields: Record<string, string>; fileUrl: string }>(
      `/tickets/${ticketId}/attachments/presign`,
      {
        method: 'POST',
        body: JSON.stringify({ contentType, fileType }),
      }
    ),

  uploadAttachment: async (
    url: string,
    fields: Record<string, string>,
    file: File
  ) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to upload file to S3');
    }
    return res;
  },
};

export interface ReadyForPickupTicket extends Ticket {
  ticketNumber?: string;
  invoice?: {
    id: string;
    invoiceNumber: string | null;
    status: string;
    paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
    total: string;
    amountPaid: string;
    balanceDue: string;
  } | null;
}

// ─── Customers ───────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsappId?: string | null;
  address: string | null;
  customerType: 'WALK_IN' | 'RETURNING' | 'BUSINESS';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FetchCustomersParams { search?: string; alphabet?: string; page?: number; limit?: number; }
export interface PaginatedCustomers { customers: Customer[]; total: number; hasMore: boolean; page: number; limit: number; }

// ─── Catalog ──────────────────────────────────────────────────────────────────

export interface CatalogItem {
  id: string;
  name: string;
  manufacturer: string | null;
  itemType: string;
  category: string;
  source: 'GLOBAL' | 'TENANT';
  usageCount: number | null;
  globalCatalogItemId: string | null;
  tenantCatalogItemId: string | null;
  createdAt: string;
}

export interface CatalogItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: 'GLOBAL' | 'TENANT';
  itemType?: string;
  category?: string;
}

export interface PaginatedCatalogItems {
  items: CatalogItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export const catalogApi = {
  search: (q: string, limit = 15): Promise<CatalogItem[]> => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return request<CatalogItem[]>(`/catalog/search?${params}`);
  },

  getItems: async (params: CatalogItemsParams = {}): Promise<PaginatedCatalogItems> => {
    const qp = new URLSearchParams();
    if (params.page) qp.set('page', String(params.page));
    if (params.limit) qp.set('limit', String(params.limit));
    if (params.search) qp.set('search', params.search);
    if (params.source) qp.set('source', params.source);
    if (params.itemType) qp.set('itemType', params.itemType);
    if (params.category) qp.set('category', params.category);
    const qs = qp.toString();
    const raw = await request<CatalogItem[]>(`/catalog/items${qs ? `?${qs}` : ''}`);
    return {
      items: raw,
      total: raw.length,
      totalPages: 1,
      page: params.page || 1,
      limit: params.limit || raw.length,
    };
  },
};

export const customersApi = {
  fetchAll: (params: FetchCustomersParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.set('search', params.search);
    if (params.alphabet && params.alphabet !== 'All') queryParams.set('alphabet', params.alphabet);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    const query = queryParams.toString();
    return request<PaginatedCustomers | Customer[]>('/customers' + (query ? `?${query}` : '')).then((result) => {
      if (!Array.isArray(result)) return result;
      return {
        customers: result,
        total: result.length,
        hasMore: false,
        page: params.page || 1,
        limit: params.limit || result.length,
      };
    });
  },
  fetchOne: (id: string) => request<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ id: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Line Items & Invoices ───────────────────────────────────────────────────
export interface TicketLineItem {
  id: string;
  ticketId: string;
  type: 'PART' | 'LABOR' | 'SERVICE' | 'PRODUCT' | 'OTHER';
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  taxMode: 'EXCLUSIVE' | 'INCLUSIVE' | 'NONE';
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  // Warranty
  warrantyEnabled: boolean;
  warrantyDuration?: number | null;
  warrantyUnit?: 'DAYS' | 'MONTHS' | 'YEARS' | null;
  warrantyCoverage?: string | null;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  ticketId: string;
  invoiceNumber: string | null;
  status: 'DRAFT' | 'FINALIZED' | 'VOID';
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  detailLevel: 'SIMPLE' | 'STANDARD' | 'DETAILED';
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string | null;
  lineItemsSnapshot?: any;
  invoiceDate: string;
  dueDate?: string | null;
  finalizedAt?: string | null;
  finalizedById?: string | null;
  voidedAt?: string | null;
  voidedById?: string | null;
  voidReason?: string | null;
  createdAt: string;
}

export interface InvoiceDraftSummary {
  ticket: { id: string; status: string };
  lineItems: TicketLineItem[];
  totals: {
    subtotal: string;
    discount: string;
    taxableAmount: string;
    tax: string;
    total: string;
    amountPaid: string;
    balanceDue: string;
  };
}

export const lineItemsApi = {
  list: (ticketId: string) =>
    request<TicketLineItem[]>(`/tickets/${ticketId}/line-items`),

  add: (ticketId: string, data: Partial<TicketLineItem>) =>
    request<TicketLineItem>(`/tickets/${ticketId}/line-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (ticketId: string, lineItemId: string, data: Partial<TicketLineItem>) =>
    request<TicketLineItem>(`/tickets/${ticketId}/line-items/${lineItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (ticketId: string, lineItemId: string) =>
    request<{ id: string }>(`/tickets/${ticketId}/line-items/${lineItemId}`, {
      method: 'DELETE',
    }),
};

export const invoiceApi = {
  get: (ticketId: string) =>
    request<Invoice | InvoiceDraftSummary>(`/tickets/${ticketId}/invoice`),

  getDraft: (ticketId: string) =>
    request<InvoiceDraftSummary>(`/tickets/${ticketId}/invoice/draft`),

  finalize: (ticketId: string, data: { notes?: string; dueDate?: string }) =>
    request<Invoice>(`/tickets/${ticketId}/invoice/finalize`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  void: (ticketId: string, data: { reason: string }) =>
    request<Invoice>(`/tickets/${ticketId}/invoice/void`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};






// ── Invoice List & Settings APIs ─────────────────────────────────────────────
export interface InvoiceListItem {
  id: string;
  invoiceNumber: string | null;
  status: string;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  total: string;
  balanceDue: string;
  amountPaid: string;
  detailLevel: string;
  createdAt: string;
  ticket: {
    id: string;
    jobNumber: string | null;
    status: string;
    deviceModel: string | null;
    customer: { id: string; name: string; phone: string | null } | null;
  } | null;
}

export const invoicesListApi = {
  list: (params?: { paymentStatus?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.paymentStatus && params.paymentStatus !== 'ALL') qs.set('paymentStatus', params.paymentStatus);
    if (params?.q) qs.set('q', params.q);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<InvoiceListItem[]>(`/invoices${query}`);
  },
};

export interface InvoicingSettings {
  defaultInvoiceDetailLevel?: 'MINIMAL' | 'STANDARD' | 'DETAILED';
  name?: string | null;
  businessEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  logoUrl?: string | null;
  description?: string | null;
}

export const invoiceSettingsApi = {
  get: () => request<InvoicingSettings>('/settings/invoicing'),
  update: (data: InvoicingSettings) =>
    request<InvoicingSettings>('/settings/invoicing', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
