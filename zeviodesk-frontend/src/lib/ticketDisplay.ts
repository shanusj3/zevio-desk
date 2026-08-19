// Central display helpers for ticket statuses — keeps UI labels consistent everywhere.
// Backend enum values are unchanged; only the displayed text changes.

export type TicketStatus =
  | 'RECEIVED'
  | 'DIAGNOSING'
  | 'WAITING_FOR_PARTS'
  | 'IN_PROGRESS'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  RECEIVED: 'New',
  DIAGNOSING: 'Diagnosis',
  WAITING_FOR_PARTS: 'Waiting for Parts',
  IN_PROGRESS: 'Repair in Progress',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as TicketStatus] ?? status;
}

/** Badge color classes per status for use in table cells, chips etc. */
export const STATUS_BADGE: Record<TicketStatus, string> = {
  RECEIVED: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  DIAGNOSING: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  WAITING_FOR_PARTS: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  IN_PROGRESS: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  READY_FOR_PICKUP: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
};

export function getStatusBadge(status: string): string {
  return STATUS_BADGE[status as TicketStatus] ?? 'bg-gray-500/15 text-gray-300 border border-gray-500/30';
}

// ─── Role-based default statuses ─────────────────────────────────────────────
// These are sent to the backend as query params so only relevant tickets come back.

export const ROLE_DEFAULT_STATUSES: Record<string, TicketStatus[]> = {
  TECHNICIAN: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS'],
  ADVISOR: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
  TENANT_ADMIN: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
  MANAGER: ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
};

export function getRoleDefaultStatuses(role: string | undefined): TicketStatus[] | undefined {
  if (!role) return undefined;
  return ROLE_DEFAULT_STATUSES[role];
}

/** Format a ticket reference number (e.g. for display as #JOB-2024-0001) */
export function formatTicketReference(ticket: { jobNumber?: string }): string {
  return ticket.jobNumber || 'N/A';
}
