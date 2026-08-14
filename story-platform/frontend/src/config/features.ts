export const FEATURES = {
  referral: false,
  affiliate: false,
  referralCommission: false,
  referralRanking: false,
} as const;

// Safe cleanup of legacy referral local storage keys (DEFERRED_PHASE_2)
export function cleanupLegacyReferralStorage(): void {
  try {
    const legacyKeys = [
      'storyflow:referral-profile:v1',
      'storyflow:referral-conversions:v1',
      'storyflow:ranking-referral:v1',
    ];
    legacyKeys.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('[StorageCleanup] Non-fatal error cleaning legacy storage', e);
  }
}
