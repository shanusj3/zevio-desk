// filterUtils.ts — computes ISO date range strings to send as API query params.
// All filtering (date + role + status) is done server-side.

export type DateFilterOption = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Compute the { startDate, endDate } ISO strings to pass as API query params.
 */
export function getDateRangeParams(
  option: DateFilterOption,
  customRange: DateRange
): { startDate?: string; endDate?: string } {
  const now = new Date();
  
  // Stable end date for today (end of the current day)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (option === 'TODAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startDate: start.toISOString(), endDate: endOfToday.toISOString() };
  }

  if (option === 'THIS_WEEK') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: endOfToday.toISOString() };
  }

  if (option === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: start.toISOString(), endDate: endOfToday.toISOString() };
  }

  if (option === 'CUSTOM' && customRange.startDate && customRange.endDate) {
    const end = new Date(customRange.endDate);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: customRange.startDate.toISOString(),
      endDate: end.toISOString(),
    };
  }

  return {};
}
