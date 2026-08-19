export type TenantStatus = 'Active' | 'Inactive' | 'Pending';

export interface Tenant {
  id: string;
  name: string;
  description: string;
  subdomain: string;
  businessEmail: string;
  phone: string;
  gstNumber?: string;
  address: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  usersCount: number;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  plan?: 'Pro' | 'Enterprise' | 'Starter';
  monthlyRevenue?: string;
}

export type ActiveTab = 'dashboard' | 'tenants' | 'reports' | 'tickets' | 'customers' | 'staff' | 'settings' | 'profile' | 'invoices' | 'billing' | 'sales';

export type InvoiceSourceType = 'ticket' | 'sale' | 'custom';

export interface InvoiceSource {
  sourceType: InvoiceSourceType;
  sourceId: string;
}

export interface FilterOptions {
  search: string;
  status: 'All' | 'Active' | 'Inactive';
  alphabet: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: 'tenant_created' | 'status_change' | 'alert';
}
