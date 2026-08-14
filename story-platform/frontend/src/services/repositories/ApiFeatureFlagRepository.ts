import { apiRequest } from '../apiClient';

export class ApiFeatureFlagRepository {
  async getFlags() {
    return apiRequest('/admin/feature-flags', { method: 'GET' });
  }

  async updateFlag(key: string, isEnabled: boolean, expectedVersion?: number) {
    return apiRequest(`/admin/feature-flags/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ isEnabled, expectedVersion }),
    });
  }
}

export const apiFeatureFlagRepository = new ApiFeatureFlagRepository();
