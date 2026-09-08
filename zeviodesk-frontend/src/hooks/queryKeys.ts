/**
 * Centralized Query Keys Factory
 * Provides type-safe and consistent query key arrays for React Query.
 */

export const queryKeys = {
  tickets: {
    all: ['tickets'] as const,
    list: (params?: unknown) => (params ? (['tickets', params] as const) : (['tickets'] as const)),
    paginated: (params?: unknown) => ['tickets-paginated', params] as const,
    infinite: (params?: unknown) => ['tickets-infinite', params] as const,
    detail: (id?: string) => ['ticket', id] as const,
    repairCompleted: ['repair-completed'] as const,
  },
  payments: {
    all: ['payments'] as const,
    byTicket: (ticketId?: string) => ['payments', ticketId] as const,
  },
  lineItems: {
    all: ['line-items'] as const,
    byTicket: (ticketId?: string) => ['line-items', ticketId] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (params?: unknown) => ['invoices', params] as const,
    byTicket: (ticketId?: string) => ['invoice', ticketId] as const,
    settings: (paramSlug?: string | null) => ['invoicingSettings', paramSlug] as const,
  },
  customers: {
    all: ['customers'] as const,
    infinite: (search?: string, alphabet?: string) =>
      search || alphabet ? (['customers-infinite', search, alphabet] as const) : (['customers-infinite'] as const),
    search: (search?: string) => ['customers', 'search', search] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    list: (params?: unknown) => ['inventory', params] as const,
    categories: ['inventory-categories'] as const,
    item: (id?: string) => ['inventory-item', id] as const,
    movements: (id?: string, skip?: number, take?: number) =>
      id ? (['inventory-movements', id, skip, take] as const) : (['inventory-movements'] as const),
  },
  tenants: {
    all: ['tenants'] as const,
    list: (params?: unknown) => ['tenants', params] as const,
    infinite: (search?: string, status?: string, alphabet?: string) =>
      ['tenants-infinite', search, status, alphabet] as const,
    detail: (id?: string) => ['tenant', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (staffOnly = true) => ['users', { staffOnly }] as const,
  },
  reports: {
    all: ['reports'] as const,
    platform: ['reports', 'platform'] as const,
  },
} as const;
