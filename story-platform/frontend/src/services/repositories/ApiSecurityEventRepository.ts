import { apiRequest } from '../apiClient';

export class ApiSecurityEventRepository {
  async getEvents(status?: string, severity?: string) {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (severity) query.set('severity', severity);

    return apiRequest(`/admin/security-events?${query.toString()}`, { method: 'GET' });
  }

  async getEventById(id: string) {
    return apiRequest(`/admin/security-events/${id}`, { method: 'GET' });
  }

  async startInvestigation(id: string) {
    return apiRequest(`/admin/security-events/${id}/start`, { method: 'POST' });
  }

  async executeAction(id: string, actionTaken: string, reason: string) {
    return apiRequest(`/admin/security-events/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ actionTaken, reason }),
    });
  }

  async resolveEvent(id: string, status: string, resolutionNote: string, actionTaken: string, reason: string) {
    return apiRequest(`/admin/security-events/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, resolutionNote, actionTaken, reason }),
    });
  }

  async reopenEvent(id: string, reason: string) {
    return apiRequest(`/admin/security-events/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export const apiSecurityEventRepository = new ApiSecurityEventRepository();
