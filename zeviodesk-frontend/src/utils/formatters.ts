/**
 * Centralized formatting utilities for ZevioDesk.
 * Preserves existing locale, currency (INR ₹), and date/time display behaviors across all application views.
 */

export interface FormatCurrencyOptions {
  /** Minimum fraction digits (decimals). Defaults to 2 if not specified (or 0 for zero-decimal modes). */
  minimumFractionDigits?: number;
  /** Maximum fraction digits (decimals). Defaults to 2. */
  maximumFractionDigits?: number;
  /** Currency code, default 'INR'. */
  currency?: string;
  /** Formatting style: 'symbol' (e.g. ₹1,250.00), 'currency' (Intl style), or 'decimal' (1,250.00). */
  style?: 'symbol' | 'currency' | 'decimal';
}

/**
 * Format a number or numeric string as currency (default Indian Rupee ₹).
 * Output examples: ₹1,250.00, ₹1,250
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  if (value === null || value === undefined || value === '') {
    const minDecs = options.minimumFractionDigits ?? 2;
    return options.style === 'currency'
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: options.currency || 'INR', maximumFractionDigits: options.maximumFractionDigits ?? 0 }).format(0)
      : `₹${(0).toFixed(minDecs)}`;
  }

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const safeValue = isNaN(numericValue) ? 0 : numericValue;

  const {
    minimumFractionDigits,
    maximumFractionDigits,
    currency = 'INR',
    style = 'symbol'
  } = options;

  if (style === 'currency') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: maximumFractionDigits ?? 0,
      minimumFractionDigits
    }).format(safeValue);
  }

  const minDecs = minimumFractionDigits ?? (maximumFractionDigits !== undefined ? minimumFractionDigits : 2);
  const maxDecs = maximumFractionDigits ?? 2;

  const formatted = safeValue.toLocaleString('en-IN', {
    minimumFractionDigits: minDecs,
    maximumFractionDigits: maxDecs
  });

  if (style === 'decimal') {
    return formatted;
  }

  return `₹${formatted}`;
}

export interface FormatDateOptions {
  /** Preset formatting style */
  formatStyle?: 'short' | 'medium' | 'long' | 'iso' | 'numeric-slash' | 'day-month-year';
  locale?: string;
  month?: 'numeric' | '2-digit' | 'short' | 'long';
  day?: 'numeric' | '2-digit';
  year?: 'numeric' | '2-digit';
}

/**
 * Format a date object, timestamp, or ISO string into a human-readable date string.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options?: FormatDateOptions | Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  if (options && 'formatStyle' in options && options.formatStyle) {
    if (options.formatStyle === 'iso') {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    if (options.formatStyle === 'numeric-slash') {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    if (options.formatStyle === 'day-month-year') {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }

  const defaultOptions: Intl.DateTimeFormatOptions = (options && !('formatStyle' in options))
    ? (options as Intl.DateTimeFormatOptions)
    : { month: 'short', day: 'numeric', year: 'numeric' };

  const locale = (options && 'locale' in options && options.locale) ? options.locale : undefined;
  return d.toLocaleDateString(locale, defaultOptions);
}

/**
 * Format a date range (e.g. "Sep 1 - Sep 30, 2026").
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

/**
 * Format a date/time string or Date object into a 12-hour or 24-hour time string (e.g., "05:30 PM").
 */
export function formatTime(
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  if (!date) return '';
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], options);
}

export interface FormatDateTimeOptions {
  /** Separator between date and time for compact style. Default is ' · '. */
  separator?: string;
  /** Display style */
  style?: 'default' | 'compact' | 'full';
  locale?: string;
}

/**
 * Format a date into full or compact date-time (e.g., "Sep 8 · 05:30 PM" or "08 Sep 2026, 05:30 PM").
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  options?: FormatDateTimeOptions
): string {
  if (!date) return '-';
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  if (options?.style === 'compact') {
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const separator = options.separator ?? ' · ';
    return `${dateStr}${separator}${timeStr}`;
  }

  if (options?.style === 'full') {
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return d.toLocaleString(options?.locale);
}

/**
 * Smart relative time formatter for chat/inbox/headers (e.g. "Just now", "5m ago", "Yesterday", "Sep 8").
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'object' && date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
