export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString();
}

export function isExpired(expiryDate: Date | string): boolean {
  return new Date() > new Date(expiryDate);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
