import { apiRequest } from '../apiClient';

export class ApiSubscriptionRepository {
  async getPlans() {
    return apiRequest('/subscription-plans', { method: 'GET' });
  }

  async getMySubscription() {
    return apiRequest('/subscriptions/me', { method: 'GET' });
  }

  async grantPremium(userId: string, planId: string, reason: string, idempotencyKey?: string, expectedVersion?: number) {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    return apiRequest(`/admin/users/${userId}/subscription/grant`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId, reason, expectedVersion }),
    });
  }

  async revokePremium(userId: string, reason: string, idempotencyKey?: string) {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    return apiRequest(`/admin/users/${userId}/subscription/revoke`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });
  }

  async getGrantLedger(userId: string) {
    return apiRequest(`/admin/users/${userId}/subscription/ledger`, { method: 'GET' });
  }
}

export const apiSubscriptionRepository = new ApiSubscriptionRepository();
