import { storage, STORAGE_KEYS } from '../storage';
import { SubscriptionPlan, SubscriptionPlanId, UserSubscription, MembershipTier } from '../../types';

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'PREMIUM_MONTHLY',
    name: 'Premium Tháng',
    durationDays: 30,
    priceVnd: 59000,
    benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
  },
  {
    id: 'PREMIUM_QUARTERLY',
    name: 'Premium 3 Tháng',
    durationDays: 90,
    priceVnd: 150000,
    originalPriceVnd: 177000,
    benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
  },
  {
    id: 'PREMIUM_SEMI_ANNUAL',
    name: 'Premium 6 Tháng',
    durationDays: 180,
    priceVnd: 270000,
    originalPriceVnd: 354000,
    isRecommended: true,
    benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
  },
  {
    id: 'PREMIUM_ANNUAL',
    name: 'Premium 12 Tháng',
    durationDays: 365,
    priceVnd: 480000,
    originalPriceVnd: 708000,
    benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
  }
];

class LocalSubscriptionRepository {
  getPlans(): SubscriptionPlan[] {
    return MOCK_PLANS;
  }

  getCurrentSubscription(userId: string): UserSubscription {
    const defaultSub: UserSubscription = {
      userId,
      membershipTier: 'FREE',
      status: 'NONE',
      autoRenew: false,
    };
    const stored = storage.getItem<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTION, {});
    return stored[userId] || defaultSub;
  }

  activateMockSubscription(userId: string, planId: SubscriptionPlanId): UserSubscription {
    const plan = MOCK_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Invalid plan');

    const startedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    const sub: UserSubscription = {
      userId,
      membershipTier: 'PREMIUM',
      planId,
      status: 'ACTIVE',
      startedAt,
      expiresAt: expiresAt.toISOString(),
      autoRenew: true,
      lastBilledAt: startedAt,
    };

    const stored = storage.getItem<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTION, {});
    stored[userId] = sub;
    storage.setItem(STORAGE_KEYS.SUBSCRIPTION, stored);
    return sub;
  }

  cancelMockRenewal(userId: string): UserSubscription {
    const sub = this.getCurrentSubscription(userId);
    if (sub.status === 'ACTIVE') {
      sub.autoRenew = false;
      sub.cancelledAt = new Date().toISOString();
      const stored = storage.getItem<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTION, {});
      stored[userId] = sub;
      storage.setItem(STORAGE_KEYS.SUBSCRIPTION, stored);
    }
    return sub;
  }
  
  // Dev tools
  setDevMockSubscriptionState(userId: string, tier: MembershipTier, status: 'ACTIVE'|'EXPIRED'|'CANCELLED'|'NONE'): void {
    const sub: UserSubscription = {
      userId,
      membershipTier: tier,
      planId: tier === 'PREMIUM' ? 'PREMIUM_MONTHLY' : undefined,
      status: status,
      autoRenew: status === 'ACTIVE',
      startedAt: tier === 'PREMIUM' ? new Date().toISOString() : undefined,
      expiresAt: tier === 'PREMIUM' && status !== 'EXPIRED' ? new Date(Date.now() + 86400000 * 30).toISOString() : (status === 'EXPIRED' ? new Date(Date.now() - 86400000).toISOString() : undefined)
    };
    const stored = storage.getItem<Record<string, UserSubscription>>(STORAGE_KEYS.SUBSCRIPTION, {});
    stored[userId] = sub;
    storage.setItem(STORAGE_KEYS.SUBSCRIPTION, stored);
  }
}

export const subscriptionRepository = new LocalSubscriptionRepository();
