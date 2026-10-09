import { calculateSubscriptionExpiry } from './subscription-expiry.calculator';

describe('calculateSubscriptionExpiry (UTC Month Calculation)', () => {
  it('1 month from Jan 15, 2026 -> Feb 15, 2026', () => {
    const base = new Date(Date.UTC(2026, 0, 15, 10, 0, 0));
    const result = calculateSubscriptionExpiry(base, 1);

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(1); // Feb
    expect(result.getUTCDate()).toBe(15);
    expect(result.getUTCHours()).toBe(10);
  });

  it('1 month from Jan 31, 2026 (non-leap year) -> Feb 28, 2026', () => {
    const base = new Date(Date.UTC(2026, 0, 31, 14, 30, 0));
    const result = calculateSubscriptionExpiry(base, 1);

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(1); // Feb
    expect(result.getUTCDate()).toBe(28); // Clamped to Feb 28
    expect(result.getUTCHours()).toBe(14);
  });

  it('1 month from Jan 31, 2024 (leap year) -> Feb 29, 2024', () => {
    const base = new Date(Date.UTC(2024, 0, 31, 12, 0, 0));
    const result = calculateSubscriptionExpiry(base, 1);

    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCMonth()).toBe(1); // Feb
    expect(result.getUTCDate()).toBe(29); // Clamped to Feb 29
  });

  it('1 month from Feb 29, 2024 (leap year) -> Mar 29, 2024', () => {
    const base = new Date(Date.UTC(2024, 1, 29, 8, 15, 0));
    const result = calculateSubscriptionExpiry(base, 1);

    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCMonth()).toBe(2); // Mar
    expect(result.getUTCDate()).toBe(29);
  });

  it('3 months from Oct 31, 2026 -> Jan 31, 2027', () => {
    const base = new Date(Date.UTC(2026, 9, 31, 0, 0, 0)); // Oct 31
    const result = calculateSubscriptionExpiry(base, 3);

    expect(result.getUTCFullYear()).toBe(2027);
    expect(result.getUTCMonth()).toBe(0); // Jan
    expect(result.getUTCDate()).toBe(31);
  });

  it('6 months from Aug 31, 2026 -> Feb 28, 2027', () => {
    const base = new Date(Date.UTC(2026, 7, 31, 12, 0, 0)); // Aug 31
    const result = calculateSubscriptionExpiry(base, 6);

    expect(result.getUTCFullYear()).toBe(2027);
    expect(result.getUTCMonth()).toBe(1); // Feb
    expect(result.getUTCDate()).toBe(28);
  });

  it('12 months from Feb 29, 2024 -> Feb 28, 2025', () => {
    const base = new Date(Date.UTC(2024, 1, 29, 12, 0, 0)); // Feb 29 2024
    const result = calculateSubscriptionExpiry(base, 12);

    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(1); // Feb
    expect(result.getUTCDate()).toBe(28); // 2025 is non-leap
  });

  it('Active subscription extension extends from currentExpiresAt', () => {
    const serverNow = new Date(Date.UTC(2026, 5, 1, 12, 0, 0)); // June 1, 2026
    const currentExpiresAt = new Date(Date.UTC(2026, 6, 15, 12, 0, 0)); // July 15, 2026 (still active)

    const baseTime = currentExpiresAt > serverNow ? currentExpiresAt : serverNow;
    const result = calculateSubscriptionExpiry(baseTime, 1);

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(7); // Aug
    expect(result.getUTCDate()).toBe(15);
  });

  it('Expired subscription renewal starts from serverNow', () => {
    const serverNow = new Date(Date.UTC(2026, 5, 1, 12, 0, 0)); // June 1, 2026
    const currentExpiresAt = new Date(Date.UTC(2026, 3, 15, 12, 0, 0)); // April 15, 2026 (expired)

    const baseTime = currentExpiresAt > serverNow ? currentExpiresAt : serverNow;
    const result = calculateSubscriptionExpiry(baseTime, 1);

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(6); // July
    expect(result.getUTCDate()).toBe(1);
  });
});
