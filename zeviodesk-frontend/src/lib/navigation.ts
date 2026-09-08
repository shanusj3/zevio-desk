export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export type TicketRoute =
  | { view: 'new' }
  | { view: 'ready-for-pickup' }
  | { view: 'detail'; ticketId: string }
  | { view: 'edit'; ticketId: string }
  | { view: 'billing'; ticketId: string };

export function parseTicketRoute(pathname: string): TicketRoute | null {
  if (pathname === '/tickets/new') {
    return { view: 'new' };
  }
  if (pathname === '/tickets/ready-for-pickup' || pathname === '/tickets/ready-for-pickup/') {
    return { view: 'ready-for-pickup' };
  }

  const editMatch = pathname.match(/^\/tickets\/([^/]+)\/edit\/?$/);
  if (editMatch?.[1]) {
    return { view: 'edit', ticketId: decodeURIComponent(editMatch[1]) };
  }

  const billingMatch = pathname.match(/^\/tickets\/([^/]+)\/billing\/?$/);
  if (billingMatch?.[1]) {
    return { view: 'billing', ticketId: decodeURIComponent(billingMatch[1]) };
  }

  const detailMatch = pathname.match(/^\/tickets\/([^/]+)\/?$/);
  if (detailMatch?.[1] && detailMatch[1] !== 'new') {
    return { view: 'detail', ticketId: decodeURIComponent(detailMatch[1]) };
  }

  return null;
}

export type BillingRoute =
  | { section: 'invoices'; view: 'list' }
  | { section: 'invoices'; view: 'new' }
  | { section: 'invoices'; view: 'detail'; invoiceId: string }
  | { section: 'payments'; view: 'list' }
  | { section: 'outstanding'; view: 'list' }
  | { section: 'refunds'; view: 'list' }
  | { section: 'overview' };

export function parseBillingRoute(pathname: string): BillingRoute | null {
  if (pathname === '/billing' || pathname === '/billing/' || pathname === '/invoices' || pathname === '/invoices/') {
    return { section: 'invoices', view: 'list' };
  }
  if (pathname === '/billing/invoices/new') {
    return { section: 'invoices', view: 'new' };
  }
  const invoiceDetailMatch = pathname.match(/^\/billing\/invoices\/([^/]+)\/?$/);
  if (invoiceDetailMatch?.[1] && invoiceDetailMatch[1] !== 'new') {
    return { section: 'invoices', view: 'detail', invoiceId: decodeURIComponent(invoiceDetailMatch[1]) };
  }
  if (pathname === '/billing/invoices' || pathname === '/billing/invoices/') {
    return { section: 'invoices', view: 'list' };
  }
  if (pathname === '/billing/payments' || pathname === '/billing/payments/') {
    return { section: 'payments', view: 'list' };
  }
  if (pathname === '/billing/outstanding' || pathname === '/billing/outstanding/') {
    return { section: 'outstanding', view: 'list' };
  }
  if (pathname === '/billing/refunds' || pathname === '/billing/refunds/') {
    return { section: 'refunds', view: 'list' };
  }
  return null;
}

export type SalesRoute =
  | { view: 'list' }
  | { view: 'detail'; saleId: string };

export function parseSalesRoute(pathname: string): SalesRoute | null {
  if (pathname === '/sales' || pathname === '/sales/') {
    return { view: 'list' };
  }
  const saleMatch = pathname.match(/^\/sales\/([^/]+)\/?$/);
  if (saleMatch?.[1]) {
    return { view: 'detail', saleId: decodeURIComponent(saleMatch[1]) };
  }
  return null;
}

export function ticketDetailPath(ticketId: string) {
  return `/tickets/${ticketId}`;
}

export function ticketEditPath(ticketId: string) {
  return `/tickets/${ticketId}/edit`;
}

export function ticketBillingPath(ticketId: string) {
  return `/tickets/${ticketId}/billing`;
}

export function readyForPickupPath() {
  return '/tickets/ready-for-pickup';
}

export function billingPath() {
  return `/billing/invoices`;
}

export function billingInvoicesPath() {
  return `/billing/invoices`;
}

export function invoiceDetailPath(invoiceId: string) {
  return `/billing/invoices/${invoiceId}`;
}

export function billingPaymentsPath() {
  return `/billing/payments`;
}

export function billingRefundsPath() {
  return `/billing/refunds`;
}

export function billingOutstandingPath() {
  return '/billing/outstanding';
}

export function saleDetailPath(saleId: string) {
  return `/sales/${saleId}`;
}

export type CategoryRoute =
  | { view: 'list' }
  | { view: 'detail'; categoryId: string };

export function parseCategoryRoute(pathname: string): CategoryRoute | null {
  if (pathname === '/catalog/categories' || pathname === '/catalog/categories/') {
    return { view: 'list' };
  }
  const categoryMatch = pathname.match(/^\/catalog\/categories\/([^/]+)\/?$/);
  if (categoryMatch?.[1]) {
    return { view: 'detail', categoryId: decodeURIComponent(categoryMatch[1]) };
  }
  return null;
}

export function categoryDetailPath(categoryId: string) {
  return `/catalog/categories/${encodeURIComponent(categoryId)}`;
}

export function categoryListPath() {
  return '/catalog/categories';
}

export function createProductPath(categoryId?: string) {
  return categoryId ? `/catalog/products/new?category=${encodeURIComponent(categoryId)}` : '/catalog/products/new';
}
