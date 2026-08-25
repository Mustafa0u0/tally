/**
 * Time is held in whole seconds. Durations are added and rounded here and
 * nowhere else.
 */

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;

/**
 * How a freelancer bills: in blocks, not to the second.
 *
 * Six minutes is a tenth of an hour and the convention in law and consulting;
 * fifteen is the common one elsewhere. "Exact" bills what the clock says,
 * which is honest but produces line items like 1.37 hours that clients query.
 */
export const INCREMENTS = [
  { seconds: 1, label: 'Exact' },
  { seconds: 6 * MINUTE, label: '6 min' },
  { seconds: 15 * MINUTE, label: '15 min' },
  { seconds: 30 * MINUTE, label: '30 min' },
] as const;

/**
 * Rounds a duration up to the next whole increment.
 *
 * Up, not nearest - that is the convention, and it is also the part worth
 * being deliberate about. Rounding *each entry* up to fifteen minutes turns
 * eight two-minute phone calls into two billed hours. Rounding the *total* for
 * a task turns the same eight calls into fifteen minutes.
 *
 * `toInvoiceLines` bills on the group total for that reason. This function
 * exists for entry-level display too, where showing 0:02 as "15 min" would
 * misrepresent what happened.
 */
export function roundUp(seconds: number, increment: number): number {
  if (increment <= 1) return Math.max(0, Math.round(seconds));
  return Math.ceil(Math.max(0, seconds) / increment) * increment;
}

/** `1:05:30` for a running clock. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const parts = [Math.floor(s / HOUR), Math.floor((s % HOUR) / MINUTE), s % MINUTE];
  return parts
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
    .join(':');
}

/** `2h 15m` for a summary, where seconds are noise. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / HOUR);
  const minutes = Math.round((s % HOUR) / MINUTE);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Decimal hours, for an invoice line.
 *
 * Two places, which is what an invoice carries. 1.5 rather than "1h 30m",
 * because a rate is per hour and a client multiplying it should arrive at the
 * number printed on the invoice.
 */
export function billableHours(seconds: number): number {
  return Math.round((seconds / HOUR) * 100) / 100;
}
