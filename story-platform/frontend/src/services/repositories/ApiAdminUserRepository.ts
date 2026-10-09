import { apiRequest } from '../apiClient';

export interface QueryUsersParams {
  search?: string;
  status?: string;
  membershipTier?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class ApiAdminUserRepository {
  async getUsers(params: QueryUsersParams = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.membershipTier) query.set('membershipTier', params.membershipTier);
    if (params.role) query.set('role', params.role);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return apiRequest(`/admin/users?${query.toString()}`, { method: 'GET' });
  }

  async getUserById(userId: string) {
    return apiRequest(`/admin/users/${userId}`, { method: 'GET' });
  }

  async suspendUser(userId: string, reason: string, expectedVersion?: number) {
    return apiRequest(`/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason, expectedVersion }),
    });
  }

  async unsuspendUser(userId: string, reason: string, expectedVersion?: number) {
    return apiRequest(`/admin/users/${userId}/unsuspend`, {
      method: 'POST',
      body: JSON.stringify({ reason, expectedVersion }),
    });
  }

  async revokeSessions(userId: string, reason: string) {
    return apiRequest(`/admin/users/${userId}/revoke-sessions`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export const apiAdminUserRepository = new ApiAdminUserRepository();
