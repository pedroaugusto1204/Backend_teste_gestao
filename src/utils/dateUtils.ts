/**
 * Calculate days remaining until a date.
 * Returns negative number if date is in the past.
 */
export function daysUntil(date: Date): number {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a contract is expiring soon (< 30 days).
 */
export function isExpiringSoon(endDate: Date | null): boolean {
  if (!endDate) return false;
  const days = daysUntil(endDate);
  return days >= 0 && days < 30;
}

/**
 * Check if a contract is expired.
 */
export function isExpired(endDate: Date | null): boolean {
  if (!endDate) return false;
  return daysUntil(endDate) < 0;
}

/**
 * Add N days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a date as ISO date string (YYYY-MM-DD).
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate a PurchaseOrder number.
 * Format: OC-{YEAR}-{SEQUENCE padded to 4 digits}
 */
export function generatePONumber(year: number, sequence: number): string {
  const seq = String(sequence).padStart(4, '0');
  return `OC-${year}-${seq}`;
}
