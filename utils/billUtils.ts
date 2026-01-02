/**
 * Calculate days until a bill is due
 * Returns negative number if overdue
 */
export function getDaysUntilDue(dueDateISO: string, now: Date = new Date()): number {
  const due = new Date(dueDateISO);

  // Normalize to date boundaries to avoid time-of-day issues
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((startOfDue.getTime() - startOfToday.getTime()) / msPerDay);
}

/**
 * Calculate bill status based on due date and paid status
 * Thresholds:
 * - danger: due in <= 3 days OR overdue
 * - warning: due in <= 7 days
 * - safe: otherwise
 */
export function getBillStatus(
  dueDateISO: string,
  isPaid?: boolean
): 'safe' | 'warning' | 'danger' {
  if (isPaid) return 'safe';

  const days = getDaysUntilDue(dueDateISO);

  if (days <= 3) return 'danger';
  if (days <= 7) return 'warning';

  return 'safe';
}
