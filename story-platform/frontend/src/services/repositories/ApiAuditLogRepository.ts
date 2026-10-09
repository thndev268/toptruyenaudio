import { apiRequest } from '../apiClient';

export interface QueryAuditLogsParams {
  action?: string;
  resource?: string;
  resourceId?: string;
  performedByAdminId?: string;
  startDate?: string;
  endDate?: string;
  requestId?: string;
  page?: number;
  limit?: number;
}

export class ApiAuditLogRepository {
  async getLogs(params: QueryAuditLogsParams = {}) {
    const query = new URLSearchParams();
    if (params.action) query.set('action', params.action);
    if (params.resource) query.set('resource', params.resource);
    if (params.resourceId) query.set('resourceId', params.resourceId);
    if (params.performedByAdminId) query.set('performedByAdminId', params.performedByAdminId);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.requestId) query.set('requestId', params.requestId);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    return apiRequest(`/admin/audit-logs?${query.toString()}`, { method: 'GET' });
  }
}

export const apiAuditLogRepository = new ApiAuditLogRepository();
