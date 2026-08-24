import {
  UserBadge,
  UserBadgeAssignment,
  BadgeAwardNotification,
  BadgeFilters,
  BadgeVisibility,
  BadgeAssignmentSource,
  BadgeAuditLog,
  BadgeNotification,
  BadgeEventDefinition,
  BadgeEventInput,
} from '../../types/badges';
import { apiRequest } from '../apiClient';

export { LocalBadgeRepository, LOCAL_STORAGE_KEYS } from './LocalBadgeRepository';

export interface BadgeRepository {
  getBadges(filters?: BadgeFilters): Promise<UserBadge[]>;
  getBadgeById(badgeId: string): Promise<UserBadge | null>;
  getUserBadges(userId: string): Promise<UserBadgeAssignment[]>;
  getPublicUserBadges(userId: string): Promise<UserBadgeAssignment[]>;
  assignBadge(
    userId: string,
    badgeId: string,
    source?: BadgeAssignmentSource,
    assignedBy?: string,
    internalNote?: string
  ): Promise<UserBadgeAssignment>;
  revokeBadge(userId: string, badgeId: string, revokeReason?: string): Promise<void>;
  updateVisibility(
    assignmentId: string,
    visibility: BadgeVisibility
  ): Promise<void>;
  setFeaturedBadge(
    userId: string,
    assignmentId: string | null
  ): Promise<void>;
  markAwardAsSeen(assignmentId: string): Promise<void>;
  getUserNotifications(userId: string): Promise<BadgeNotification[]>;
  getUnseenBadgeNotifications(userId: string): Promise<BadgeAwardNotification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  markToastShown(notificationId: string): Promise<void>;
  recordEvent(eventType: string, incrementValue?: number): Promise<UserBadgeAssignment[]>;

  // Admin CRUD for Badge definitions & events
  createBadge(badgeData: Omit<UserBadge, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserBadge>;
  updateBadge(id: string, updates: Partial<UserBadge>): Promise<UserBadge>;
  deleteBadge(id: string): Promise<void>;
  getEventDefinitions(): Promise<BadgeEventDefinition[]>;
  createEventDefinition(data: Omit<BadgeEventDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<BadgeEventDefinition>;
  updateEventDefinition(id: string, updates: Partial<BadgeEventDefinition>): Promise<BadgeEventDefinition>;
  getAuditLogs(userId?: string): Promise<BadgeAuditLog[]>;
}

export class RestBadgeRepository implements BadgeRepository {
  private getHeaders(): Record<string, string> {
    const currentUserId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return {
      'Content-Type': 'application/json',
      'x-user-id': currentUserId,
      'x-admin-id': 'admin-1',
    };
  }

  async getBadges(filters?: BadgeFilters): Promise<UserBadge[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/admin/badges');
      if (response?.data && Array.isArray(response.data)) {
        let badges: UserBadge[] = response.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          isActive: b.isActive,
          effects: b.effects || [],
          createdAt: b.createdAt,
        }));
        
        if (filters) {
          if (filters.search) {
            const query = filters.search.toLowerCase();
            badges = badges.filter(
              (b) =>
                b.name.toLowerCase().includes(query) ||
                b.description.toLowerCase().includes(query)
            );
          }
          if (filters.status === 'ACTIVE') {
            badges = badges.filter((b) => b.isActive);
          } else if (filters.status === 'HIDDEN') {
            badges = badges.filter((b) => !b.isActive);
          }
        }
        return badges;
      }
    } catch (e) {
      console.warn('[RestBadgeRepository] REST API error, falling back:', e);
    }
    return [];
  }

  async getBadgeById(badgeId: string): Promise<UserBadge | null> {
    const badges = await this.getBadges();
    return badges.find((b) => b.id === badgeId || b.code.toUpperCase() === badgeId.toUpperCase()) || null;
  }

  async getUserBadges(userId: string): Promise<UserBadgeAssignment[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: UserBadgeAssignment[] }>(`/admin/users/${userId}/badges`);
      return response?.data || [];
    } catch (e) {
      console.warn('[RestBadgeRepository] Error fetching user badges:', e);
    }
    return [];
  }

  async getPublicUserBadges(userId: string): Promise<UserBadgeAssignment[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: UserBadgeAssignment[] }>(`/users/${userId}/badges`);
      return response?.data || [];
    } catch (e) {
      console.warn('[RestBadgeRepository] Error fetching public badges:', e);
    }
    return [];
  }

  async assignBadge(
    userId: string,
    badgeId: string,
    source: BadgeAssignmentSource = 'ADMIN',
    assignedBy: string = 'Admin',
    internalNote?: string
  ): Promise<UserBadgeAssignment> {
    const response = await apiRequest<{ success: boolean; data: UserBadgeAssignment }>(`/admin/badges/${badgeId}/assign/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ internalNote }),
    });

    if (!response?.success) {
      throw new Error('Gán danh hiệu thất bại');
    }
    return response.data;
  }

  async revokeBadge(userId: string, badgeId: string, revokeReason: string = 'Thu hồi bởi Admin'): Promise<void> {
    const response = await apiRequest<{ success: boolean }>(`/admin/badges/${badgeId}/revoke/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ revokeReason }),
    });

    if (!response?.success) {
      throw new Error('Thu hồi danh hiệu thất bại');
    }
  }

  async updateVisibility(assignmentId: string, visibility: BadgeVisibility): Promise<void> {
    // Not implemented in backend yet
    console.warn('updateVisibility not implemented');
  }

  async setFeaturedBadge(userId: string, assignmentId: string | null): Promise<void> {
    // Not implemented in backend yet
    console.warn('setFeaturedBadge not implemented');
  }

  async markAwardAsSeen(assignmentId: string): Promise<void> {
    // Not implemented
  }

  async getUserNotifications(userId: string): Promise<BadgeNotification[]> {
    // Not implemented in backend yet
    return [];
  }

  async getUnseenBadgeNotifications(userId: string): Promise<BadgeAwardNotification[]> {
    // Not implemented in backend yet
    return [];
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    // Not implemented
  }

  async markToastShown(notificationId: string): Promise<void> {
    // Not implemented
  }

  async recordEvent(eventType: string, incrementValue: number = 1): Promise<UserBadgeAssignment[]> {
    // Not implemented in backend yet
    return [];
  }

  async createBadge(badgeData: Omit<UserBadge, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserBadge> {
    const response = await apiRequest<{ success: boolean; data: UserBadge }>('/admin/badges', {
      method: 'POST',
      body: JSON.stringify(badgeData),
    });

    if (!response?.success) {
      throw new Error('Tạo danh hiệu thất bại');
    }
    return response.data;
  }

  async updateBadge(id: string, updates: Partial<UserBadge>): Promise<UserBadge> {
    const response = await apiRequest<{ success: boolean; data: UserBadge }>(`/admin/badges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!response?.success) {
      throw new Error('Cập nhật danh hiệu thất bại');
    }
    return response.data;
  }

  async deleteBadge(id: string): Promise<void> {
    const response = await apiRequest<{ success: boolean }>(`/admin/badges/${id}`, {
      method: 'DELETE',
    });

    if (!response?.success) {
      throw new Error('Xóa danh hiệu thất bại');
    }
  }

  async getEventDefinitions(): Promise<BadgeEventDefinition[]> {
    // Not implemented in backend yet
    return [];
  }

  async createEventDefinition(data: Omit<BadgeEventDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<BadgeEventDefinition> {
    // Not implemented in backend yet
    throw new Error('Not implemented');
  }

  async updateEventDefinition(id: string, updates: Partial<BadgeEventDefinition>): Promise<BadgeEventDefinition> {
    // Not implemented in backend yet
    throw new Error('Not implemented');
  }

  async getAuditLogs(userId?: string): Promise<BadgeAuditLog[]> {
    // Not implemented in backend yet
    return [];
  }
}

export const badgeRepository = new RestBadgeRepository();
