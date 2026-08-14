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
      const res = await fetch('/api/admin/badges', { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        let badges: UserBadge[] = data.badges || [];
        
        if (filters) {
          if (filters.search) {
            const query = filters.search.toLowerCase();
            badges = badges.filter(
              (b) =>
                b.name.toLowerCase().includes(query) ||
                b.code.toLowerCase().includes(query) ||
                b.description.toLowerCase().includes(query)
            );
          }
          if (filters.level && filters.level !== 'ALL') {
            badges = badges.filter((b) => b.level === filters.level);
          }
          if (filters.awardMode && filters.awardMode !== 'ALL') {
            badges = badges.filter((b) => b.awardMode === filters.awardMode);
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
      const res = await fetch(`/api/me/badges?userId=${encodeURIComponent(userId)}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return data.badges || [];
      }
    } catch (e) {
      console.warn('[RestBadgeRepository] Error fetching user badges:', e);
    }
    return [];
  }

  async getPublicUserBadges(userId: string): Promise<UserBadgeAssignment[]> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/badges`);
      if (res.ok) {
        const data = await res.json();
        return data.badges || [];
      }
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
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/badges`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ badgeId, internalNote }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gán danh hiệu thất bại');
    }
    return data.assignment;
  }

  async revokeBadge(userId: string, badgeId: string, revokeReason: string = 'Thu hồi bởi Admin'): Promise<void> {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/badges/${encodeURIComponent(badgeId)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ revokeReason }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Thu hồi danh hiệu thất bại');
    }
  }

  async updateVisibility(assignmentId: string, visibility: BadgeVisibility): Promise<void> {
    const res = await fetch(`/api/me/badges/${encodeURIComponent(assignmentId)}/visibility`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ visibility }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Cập nhật trạng thái hiển thị thất bại');
    }
  }

  async setFeaturedBadge(userId: string, assignmentId: string | null): Promise<void> {
    const res = await fetch(`/api/me/badges/${encodeURIComponent(assignmentId || 'none')}/featured`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ isFeatured: !!assignmentId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Cập nhật danh hiệu nổi bật thất bại');
    }
  }

  async markAwardAsSeen(assignmentId: string): Promise<void> {
    // Convenience wrapper
  }

  async getUserNotifications(userId: string): Promise<BadgeNotification[]> {
    try {
      const res = await fetch(`/api/me/badge-notifications?userId=${encodeURIComponent(userId)}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return data.notifications || [];
      }
    } catch (e) {
      console.warn('[RestBadgeRepository] Error fetching notifications:', e);
    }
    return [];
  }

  async getUnseenBadgeNotifications(userId: string): Promise<BadgeAwardNotification[]> {
    const notifications = await this.getUserNotifications(userId);
    const unshown = notifications.filter((n) => !n.toastShownAt);
    const badges = await this.getBadges();
    
    return unshown.map((n) => {
      const badge = n.badge || badges.find((b) => b.id === n.badgeId) || {
        id: n.badgeId,
        code: 'UNKNOWN',
        name: n.title,
        description: n.message,
        icon: 'Award',
        level: 'COMMON',
        awardMode: 'AUTOMATIC',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        assignmentId: n.assignmentId,
        badge,
        awardedAt: n.createdAt,
      };
    });
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await fetch(`/api/me/badge-notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
  }

  async markToastShown(notificationId: string): Promise<void> {
    await fetch(`/api/me/badge-notifications/${encodeURIComponent(notificationId)}/toast-shown`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
  }

  async recordEvent(eventType: string, incrementValue: number = 1): Promise<UserBadgeAssignment[]> {
    try {
      const res = await fetch('/api/me/badge-events/record', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ eventType, incrementValue }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.newlyAwarded || [];
      }
    } catch (e) {
      console.warn('[RestBadgeRepository] Error recording event:', e);
    }
    return [];
  }

  async createBadge(badgeData: Omit<UserBadge, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserBadge> {
    const res = await fetch('/api/admin/badges', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(badgeData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Tạo danh hiệu thất bại');
    }
    return data.badge;
  }

  async updateBadge(id: string, updates: Partial<UserBadge>): Promise<UserBadge> {
    const res = await fetch(`/api/admin/badges/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Cập nhật danh hiệu thất bại');
    }
    return data.badge;
  }

  async deleteBadge(id: string): Promise<void> {
    const res = await fetch(`/api/admin/badges/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Xóa danh hiệu thất bại');
    }
  }

  async getEventDefinitions(): Promise<BadgeEventDefinition[]> {
    try {
      const res = await fetch('/api/admin/badge-events', { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.events || [];
      }
    } catch (e) {
      console.warn('[RestBadgeRepository] Error fetching event definitions:', e);
    }
    return [];
  }

  async createEventDefinition(data: Omit<BadgeEventDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<BadgeEventDefinition> {
    const res = await fetch('/api/admin/badge-events', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    const respData = await res.json();
    if (!res.ok || !respData.success) {
      throw new Error(respData.error || 'Tạo sự kiện thất bại');
    }
    return respData.event;
  }

  async updateEventDefinition(id: string, updates: Partial<BadgeEventDefinition>): Promise<BadgeEventDefinition> {
    const res = await fetch(`/api/admin/badge-events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    const respData = await res.json();
    if (!res.ok || !respData.success) {
      throw new Error(respData.error || 'Cập nhật sự kiện thất bại');
    }
    return respData.event;
  }

  async getAuditLogs(userId?: string): Promise<BadgeAuditLog[]> {
    try {
      const url = userId ? `/api/admin/badge-audit-logs?userId=${encodeURIComponent(userId)}` : '/api/admin/badge-audit-logs';
      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch (e) {
      console.warn('[RestBadgeRepository] Error fetching audit logs:', e);
    }
    return [];
  }
}

export const badgeRepository = new RestBadgeRepository();
