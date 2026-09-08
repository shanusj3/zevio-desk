// Central display helpers for ticket statuses — keeps UI labels consistent everywhere.
// Backend enum values are unchanged; only the displayed text changes.

export type TicketStatus =
  | 'RECEIVED'
  | 'DIAGNOSING'
  | 'WAITING_FOR_PARTS'
  | 'IN_PROGRESS'
  | 'REPAIR_COMPLETED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  RECEIVED: 'New',
  DIAGNOSING: 'Diagnosis',
  WAITING_FOR_PARTS: 'Waiting for Parts',
  IN_PROGRESS: 'Repair in Progress',
  REPAIR_COMPLETED: 'Repair Completed',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Delivered',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as TicketStatus] ?? status;
}

/** Badge color classes per status for use in table cells, chips etc. */
export const STATUS_BADGE: Record<TicketStatus, string> = {
  RECEIVED: 'bg-blue-50 text-blue-700 border border-blue-200',
  DIAGNOSING: 'bg-purple-50 text-purple-700 border border-purple-200',
  WAITING_FOR_PARTS: 'bg-amber-50 text-amber-700 border border-amber-200',
  IN_PROGRESS: 'bg-orange-50 text-orange-700 border border-orange-200',
  REPAIR_COMPLETED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  READY_FOR_PICKUP: 'bg-teal-50 text-teal-700 border border-teal-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export function getStatusBadge(status: string): string {
  return STATUS_BADGE[status as TicketStatus] ?? 'bg-gray-50 text-gray-700 border border-gray-200';
}

// ─── Role-based default statuses ─────────────────────────────────────────────
// These are sent to the backend as query params so only relevant tickets come back.

export const ROLE_DEFAULT_STATUSES: Record<string, TicketStatus[]> = {
  TECHNICIAN: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'REPAIR_COMPLETED'],
  ADVISOR: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'REPAIR_COMPLETED', 'READY_FOR_PICKUP', 'DELIVERED'],
  TENANT_ADMIN: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'REPAIR_COMPLETED', 'READY_FOR_PICKUP', 'DELIVERED'],
  MANAGER: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'REPAIR_COMPLETED', 'READY_FOR_PICKUP', 'DELIVERED'],
};

export function getRoleDefaultStatuses(role: string | undefined): TicketStatus[] | undefined {
  if (!role) return undefined;
  return ROLE_DEFAULT_STATUSES[role];
}

/** Format a ticket reference number (e.g. for display as #JOB-2024-0001) */
export function formatTicketReference(ticket: { jobNumber?: string }): string {
  return ticket.jobNumber || 'N/A';
}

// ─── Priority & Warranty Display Helpers ─────────────────────────────────────
export type TicketPriority = 'NORMAL' | 'URGENT';

export const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
};

export function getPriorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] || 'Normal';
}

export function getPriorityBadge(priority: string): string {
  if (priority === 'URGENT') {
    return 'bg-red-100 text-red-700 border border-red-300 font-semibold';
  }
  return 'bg-[#78350F] text-[#ffedd5] border border-[#D97706]/40';
}

export function getPriorityTextStyle(priority: string): string {
  if (priority === 'URGENT') {
    return 'text-[#C62828] font-bold uppercase tracking-wider text-xs';
  }
  return 'text-[#8A4B08] font-medium uppercase tracking-wider text-xs';
}

export function getWarrantyDisplay(warrantyStatus?: string | null): { label: string; badgeClass: string; isactive: boolean } {
  if (!warrantyStatus || warrantyStatus.toLowerCase() === 'none' || warrantyStatus.toLowerCase() === 'no warranty') {
    return { label: '—', badgeClass: 'text-[#94a3b8]', isactive: false };
  }
  if (warrantyStatus.toLowerCase().includes('expired')) {
    return { label: '⚠ Expired', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200', isactive: false };
  }
  return { label: '🛡 Active', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold', isactive: true };
}

/**
 * Safely formats device title from brand and model, preventing duplicate brand prefixing.
 * Handles cases where model already starts with the brand name or contains duplicated brand words.
 */
export function formatDeviceTitle(
  brand?: string | null,
  model?: string | null,
  fallbackTitle?: string | null
): string {
  const b = (brand || '').trim();
  let m = (model || '').trim();
  const fallback = (fallbackTitle || '').trim();

  // If model is missing, sanitize brand or fallback
  if (!m) {
    return sanitizeDuplicateBrandString(b || fallback);
  }

  // Sanitize any existing double-brand prefix inside model string
  m = sanitizeDuplicateBrandString(m, b);

  if (!b) {
    return sanitizeDuplicateBrandString(m);
  }

  // If model already starts with brand (case-insensitive)
  const bLower = b.toLowerCase();
  const mLower = m.toLowerCase();

  if (mLower.startsWith(bLower)) {
    const remainder = m.slice(b.length);
    // Check if remainder is empty or starts with non-alphanumeric or space (e.g., "Apple iPhone")
    if (remainder.length === 0 || /^\s|^[^\w]/.test(remainder)) {
      return sanitizeDuplicateBrandString(m, b);
    }
  }

  return sanitizeDuplicateBrandString(`${b} ${m}`, b);
}

function sanitizeDuplicateBrandString(str: string, knownBrand?: string): string {
  if (!str) return str;
  let result = str.trim();

  if (knownBrand && knownBrand.trim()) {
    const kb = knownBrand.trim();
    const escapedKb = kb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const doubleKnownRegex = new RegExp(`^(${escapedKb})\\s+\\1(\\s+|$)`, 'i');
    while (doubleKnownRegex.test(result)) {
      result = result.replace(doubleKnownRegex, '$1$2').trim();
    }
  }

  // Generic double leading word check e.g. "Apple Apple iPhone" -> "Apple iPhone"
  const genericDoubleRegex = /^([A-Za-z0-9]+)\s+\1(\s+|$)/i;
  while (genericDoubleRegex.test(result)) {
    result = result.replace(genericDoubleRegex, '$1$2').trim();
  }

  return result;
}
