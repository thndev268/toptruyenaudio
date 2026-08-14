/**
 * Calculates the exact expiry date in UTC given a base date and duration in months (1, 3, 6, 12).
 *
 * Rules:
 * - Uses pure UTC.
 * - Preserves day of month if valid in target month.
 * - If target month has fewer days than base date's day of month (e.g. Jan 31 + 1m -> Feb 28/29),
 *   sets to the last day of that target month.
 * - Prevents client timezone or DST from distorting expiration times.
 */
export function calculateSubscriptionExpiry(
  baseDate: Date,
  durationMonths: 1 | 3 | 6 | 12,
): Date {
  const baseTime = baseDate instanceof Date ? baseDate : new Date(baseDate);

  const utcYear = baseTime.getUTCFullYear();
  const utcMonth = baseTime.getUTCMonth(); // 0-indexed
  const utcDate = baseTime.getUTCDate();
  const utcHours = baseTime.getUTCHours();
  const utcMinutes = baseTime.getUTCMinutes();
  const utcSeconds = baseTime.getUTCSeconds();
  const utcMilliseconds = baseTime.getUTCMilliseconds();

  const totalMonths = utcMonth + durationMonths;
  const targetYear = utcYear + Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;

  // Day 0 of next month in UTC gives the last day of targetMonth
  const maxDaysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  const targetDate = Math.min(utcDate, maxDaysInTargetMonth);

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDate,
      utcHours,
      utcMinutes,
      utcSeconds,
      utcMilliseconds,
    ),
  );
}

export const PLAN_DURATION_MONTHS_MAP: Record<string, 1 | 3 | 6 | 12> = {
  PREMIUM_MONTHLY: 1,
  PREMIUM_QUARTERLY: 3,
  PREMIUM_SEMIANNUAL: 6,
  PREMIUM_ANNUAL: 12,
};
