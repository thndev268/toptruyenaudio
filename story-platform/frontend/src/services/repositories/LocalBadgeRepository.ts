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
  BadgeEventProgress,
} from '../../types/badges';
import type { BadgeRepository } from './BadgeRepository';

export const LOCAL_STORAGE_KEYS = {
  BADGES: 'toptruyenaudio:badges',
  USER_BADGES: 'toptruyenaudio:user-badges',
  NOTIFICATIONS: 'toptruyenaudio:badge-notifications',
  EVENT_DEFS: 'toptruyenaudio:badge-events',
  AUDIT_LOGS: 'toptruyenaudio:badge-audit-logs',
  EVENT_PROGRESS: 'toptruyenaudio:badge-event-progress',
} as const;

const DEFAULT_EVENT_DEFINITIONS: BadgeEventDefinition[] = [
  {
    id: 'evt-1',
    eventKey: 'LISTENING_MINUTES_REACHED',
    name: 'Số phút nghe audio',
    description: 'Tích lũy tổng thời gian nghe câu chuyện audio.',
    metricType: 'DURATION',
    unit: 'phút',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    eventKey: 'CHAPTERS_COMPLETED',
    name: 'Số tập đã hoàn thành',
    description: 'Số lượng tập audio đã nghe hoàn chỉnh.',
    metricType: 'COUNT',
    unit: 'tập',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    eventKey: 'STORIES_COMPLETED',
    name: 'Số bộ truyện hoàn thành',
    description: 'Số bộ truyện đã nghe từ tập đầu đến tập cuối.',
    metricType: 'COUNT',
    unit: 'bộ',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-4',
    eventKey: 'COMMENTS_POSTED',
    name: 'Số bình luận đã đăng',
    description: 'Số lượt bình luận hợp lệ trên các chương truyện.',
    metricType: 'COUNT',
    unit: 'bình luận',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-5',
    eventKey: 'VALID_REVIEWS_POSTED',
    name: 'Số bình luận chất lượng',
    description: 'Bình luận chi tiết và hữu ích cho tác phẩm.',
    metricType: 'COUNT',
    unit: 'bình luận',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_BADGES: UserBadge[] = [
  {
    id: 'badge-1',
    code: 'FIRST_LISTEN',
    name: 'Khởi đầu hành trình',
    description: 'Bắt đầu nghe câu chuyện audio đầu tiên trên hệ thống.',
    icon: 'Headphones',
    level: 'COMMON',
    requirementText: 'Nghe ít nhất 1 phút audio',
    awardMode: 'AUTOMATIC',
    condition: {
      id: 'cond-1',
      badgeId: 'badge-1',
      eventType: 'LISTENING_MINUTES_REACHED',
      operator: 'GREATER_THAN_OR_EQUAL',
      targetValue: 1,
      isActive: true,
      description: 'Tổng thời gian nghe đạt từ 1 phút',
    },
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'badge-2',
    code: 'LISTEN_10_HOURS',
    name: 'Người nghe chăm chỉ',
    description: 'Dành trên 10 giờ đồng hồ đắm chìm trong thế giới audio.',
    icon: 'Clock',
    level: 'RARE',
    requirementText: 'Tích lũy tổng thời gian nghe đạt 600 phút (10 giờ)',
    awardMode: 'AUTOMATIC',
    condition: {
      id: 'cond-2',
      badgeId: 'badge-2',
      eventType: 'LISTENING_MINUTES_REACHED',
      operator: 'GREATER_THAN_OR_EQUAL',
      targetValue: 600,
      isActive: true,
      description: 'Tổng thời gian nghe đạt từ 600 phút',
    },
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'badge-3',
    code: 'FINISH_10_CHAPTERS',
    name: 'Chăm chỉ hoàn thành tập',
    description: 'Lắng nghe trọn vẹn 10 chương truyện audio.',
    icon: 'BookOpen',
    level: 'RARE',
    requirementText: 'Hoàn thành 10 chương truyện',
    awardMode: 'AUTOMATIC',
    condition: {
      id: 'cond-3',
      badgeId: 'badge-3',
      eventType: 'CHAPTERS_COMPLETED',
      operator: 'GREATER_THAN_OR_EQUAL',
      targetValue: 10,
      isActive: true,
      description: 'Hoàn thành từ 10 tập truyện',
    },
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'badge-4',
    code: 'TOP_DONOR',
    name: 'Nhà Tài Trợ Vàng',
    description: 'Danh hiệu vinh danh độc quyền do Admin cấp trực tiếp cho nhà tài trợ.',
    icon: 'Crown',
    level: 'LEGENDARY',
    requirementText: 'Được Admin trực tiếp cấp tặng',
    awardMode: 'MANUAL',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'badge-5',
    code: 'EARLY_MEMBER',
    name: 'Thành viên tiên phong',
    description: 'Đồng hành cùng Top Truyện Audio từ những ngày đầu ra mắt.',
    icon: 'Sparkles',
    level: 'EPIC',
    requirementText: 'Đồng hành từ giai đoạn thử nghiệm',
    awardMode: 'MANUAL',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const DEFAULT_USER_BADGES: UserBadgeAssignment[] = [
  {
    id: 'assign-seed-1',
    userId: 'user-1',
    badgeId: 'badge-5',
    source: 'ADMIN',
    assignedBy: 'admin-1',
    assignedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    visibility: 'PUBLIC',
    isFeatured: true,
  },
];

export class LocalBadgeRepository implements BadgeRepository {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.setItem(key, defaultValue);
        return defaultValue;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[LocalBadgeRepository] Failed to read ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[LocalBadgeRepository] Failed to write ${key} to localStorage:`, e);
    }
  }

  // --- BADGES ('toptruyenaudio:badges') ---
  async getBadges(filters?: BadgeFilters): Promise<UserBadge[]> {
    let badges = this.getItem<UserBadge[]>(LOCAL_STORAGE_KEYS.BADGES, DEFAULT_BADGES);

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        badges = badges.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.code.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q)
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

  async getBadgeById(badgeId: string): Promise<UserBadge | null> {
    const badges = await this.getBadges();
    return (
      badges.find((b) => b.id === badgeId || b.code.toUpperCase() === badgeId.toUpperCase()) || null
    );
  }

  // --- USER BADGES ('toptruyenaudio:user-badges') ---
  async getUserBadges(userId: string): Promise<UserBadgeAssignment[]> {
    const userBadges = this.getItem<UserBadgeAssignment[]>(
      LOCAL_STORAGE_KEYS.USER_BADGES,
      DEFAULT_USER_BADGES
    );
    const badges = await this.getBadges();

    return userBadges
      .filter((a) => a.userId === userId && !a.revokedAt)
      .map((a) => ({
        ...a,
        badge: badges.find((b) => b.id === a.badgeId),
      }));
  }

  async getPublicUserBadges(userId: string): Promise<UserBadgeAssignment[]> {
    const assignments = await this.getUserBadges(userId);
    return assignments
      .filter((a) => a.visibility === 'PUBLIC' && a.badge?.isActive)
      .slice(0, 6);
  }

  async assignBadge(
    userId: string,
    badgeId: string,
    source: BadgeAssignmentSource = 'ADMIN',
    assignedBy: string = 'Admin',
    internalNote?: string
  ): Promise<UserBadgeAssignment> {
    const badge = await this.getBadgeById(badgeId);
    if (!badge) {
      throw new Error(`Danh hiệu không tồn tại: ${badgeId}`);
    }

    const userBadges = this.getItem<UserBadgeAssignment[]>(
      LOCAL_STORAGE_KEYS.USER_BADGES,
      DEFAULT_USER_BADGES
    );

    const existing = userBadges.find(
      (a) => a.userId === userId && a.badgeId === badge.id && !a.revokedAt
    );
    if (existing) {
      throw new Error(`Người dùng đã sở hữu danh hiệu "${badge.name}".`);
    }

    const assignmentId = `assign-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const newAssignment: UserBadgeAssignment = {
      id: assignmentId,
      userId,
      badgeId: badge.id,
      source,
      assignedBy,
      assignedAt: now,
      visibility: 'PUBLIC',
      isFeatured: false,
      internalNote,
      badge,
    };

    userBadges.push(newAssignment);
    this.setItem(LOCAL_STORAGE_KEYS.USER_BADGES, userBadges);

    // Create Notification ('toptruyenaudio:badge-notifications')
    const notifications = this.getItem<BadgeNotification[]>(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS,
      []
    );

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const notification: BadgeNotification = {
      id: notifId,
      userId,
      assignmentId,
      badgeId: badge.id,
      title: 'Bạn vừa nhận được danh hiệu mới!',
      message: `Chúc mừng! Bạn vừa nhận được danh hiệu "${badge.name}".`,
      createdAt: now,
      badge,
    };

    notifications.push(notification);
    this.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, notifications);

    // Audit log
    this.addAuditLog({
      id: `audit-${Date.now()}`,
      userId,
      badgeId: badge.id,
      action: 'ASSIGNED',
      performedBy: assignedBy,
      timestamp: now,
      note: internalNote,
    });

    return newAssignment;
  }

  async revokeBadge(
    userId: string,
    badgeId: string,
    revokeReason: string = 'Thu hồi bởi Admin'
  ): Promise<void> {
    const userBadges = this.getItem<UserBadgeAssignment[]>(
      LOCAL_STORAGE_KEYS.USER_BADGES,
      DEFAULT_USER_BADGES
    );

    const assignment = userBadges.find(
      (a) => a.userId === userId && a.badgeId === badgeId && !a.revokedAt
    );

    if (!assignment) {
      throw new Error('Không tìm thấy danh hiệu cần thu hồi.');
    }

    const now = new Date().toISOString();
    assignment.revokedAt = now;
    assignment.revokedBy = 'Admin';
    assignment.revokeReason = revokeReason;
    assignment.isFeatured = false;

    this.setItem(LOCAL_STORAGE_KEYS.USER_BADGES, userBadges);

    this.addAuditLog({
      id: `audit-${Date.now()}`,
      userId,
      badgeId,
      action: 'REVOKED',
      performedBy: 'Admin',
      timestamp: now,
      note: revokeReason,
      revokeReason,
    });
  }

  async updateVisibility(
    assignmentId: string,
    visibility: BadgeVisibility
  ): Promise<void> {
    const userBadges = this.getItem<UserBadgeAssignment[]>(
      LOCAL_STORAGE_KEYS.USER_BADGES,
      DEFAULT_USER_BADGES
    );

    const assignment = userBadges.find((a) => a.id === assignmentId && !a.revokedAt);
    if (!assignment) {
      throw new Error('Không tìm thấy danh hiệu.');
    }

    assignment.visibility = visibility;
    this.setItem(LOCAL_STORAGE_KEYS.USER_BADGES, userBadges);
  }

  async setFeaturedBadge(userId: string, assignmentId: string | null): Promise<void> {
    const userBadges = this.getItem<UserBadgeAssignment[]>(
      LOCAL_STORAGE_KEYS.USER_BADGES,
      DEFAULT_USER_BADGES
    );

    userBadges.forEach((a) => {
      if (a.userId === userId) {
        a.isFeatured = a.id === assignmentId && !a.revokedAt;
      }
    });

    this.setItem(LOCAL_STORAGE_KEYS.USER_BADGES, userBadges);
  }

  async markAwardAsSeen(assignmentId: string): Promise<void> {
    const userBadges = this.getItem<UserBadgeAssignment[]>(
      LOCAL_STORAGE_KEYS.USER_BADGES,
      DEFAULT_USER_BADGES
    );

    const assignment = userBadges.find((a) => a.id === assignmentId);
    if (assignment) {
      assignment.seenAt = new Date().toISOString();
      this.setItem(LOCAL_STORAGE_KEYS.USER_BADGES, userBadges);
    }
  }

  // --- NOTIFICATIONS ('toptruyenaudio:badge-notifications') ---
  async getUserNotifications(userId: string): Promise<BadgeNotification[]> {
    const notifications = this.getItem<BadgeNotification[]>(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS,
      []
    );
    const badges = await this.getBadges();

    return notifications
      .filter((n) => n.userId === userId)
      .map((n) => ({
        ...n,
        badge: badges.find((b) => b.id === n.badgeId),
      }));
  }

  async getUnseenBadgeNotifications(userId: string): Promise<BadgeAwardNotification[]> {
    const notifications = await this.getUserNotifications(userId);
    const unshown = notifications.filter((n) => !n.toastShownAt);

    return unshown.map((n) => ({
      assignmentId: n.assignmentId,
      badge: n.badge || {
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
      },
      awardedAt: n.createdAt,
    }));
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notifications = this.getItem<BadgeNotification[]>(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS,
      []
    );

    const notif = notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.readAt = new Date().toISOString();
      this.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  }

  async markToastShown(notificationId: string): Promise<void> {
    const notifications = this.getItem<BadgeNotification[]>(
      LOCAL_STORAGE_KEYS.NOTIFICATIONS,
      []
    );

    const notif = notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.toastShownAt = new Date().toISOString();
      this.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  }

  // --- EVENT RECORDING & EVALUATION ---
  async recordEvent(
    eventType: string,
    incrementValue: number = 1
  ): Promise<UserBadgeAssignment[]> {
    const currentUserId =
      localStorage.getItem('toptruyen_current_user_id') || 'user-1';

    const progressList = this.getItem<BadgeEventProgress[]>(
      LOCAL_STORAGE_KEYS.EVENT_PROGRESS,
      []
    );

    let progress = progressList.find(
      (p) => p.userId === currentUserId && p.eventType === eventType
    );

    if (!progress) {
      progress = {
        id: `prog-${Date.now()}`,
        userId: currentUserId,
        eventType,
        currentValue: 0,
        updatedAt: new Date().toISOString(),
      };
      progressList.push(progress);
    }

    progress.currentValue += incrementValue;
    progress.updatedAt = new Date().toISOString();
    this.setItem(LOCAL_STORAGE_KEYS.EVENT_PROGRESS, progressList);

    // Evaluate automatic badges
    const badges = await this.getBadges();
    const automaticBadges = badges.filter(
      (b) =>
        b.isActive &&
        b.awardMode === 'AUTOMATIC' &&
        b.condition?.isActive &&
        b.condition?.eventType === eventType
    );

    const newlyAwarded: UserBadgeAssignment[] = [];

    for (const badge of automaticBadges) {
      const cond = badge.condition!;
      let isMet = false;

      switch (cond.operator) {
        case 'EQUALS':
          isMet = progress.currentValue === cond.targetValue;
          break;
        case 'GREATER_THAN_OR_EQUAL':
          isMet = progress.currentValue >= cond.targetValue;
          break;
        case 'GREATER_THAN':
          isMet = progress.currentValue > cond.targetValue;
          break;
        case 'LESS_THAN_OR_EQUAL':
          isMet = progress.currentValue <= cond.targetValue;
          break;
      }

      if (isMet) {
        try {
          const assignment = await this.assignBadge(
            currentUserId,
            badge.id,
            'SYSTEM',
            'System Engine',
            `Tự động đạt điều kiện: ${cond.description}`
          );
          newlyAwarded.push(assignment);
        } catch (e) {
          // Already assigned or invalid
        }
      }
    }

    return newlyAwarded;
  }

  // --- ADMIN CRUD FOR BADGES & EVENTS ---
  async createBadge(
    badgeData: Omit<UserBadge, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserBadge> {
    const badges = this.getItem<UserBadge[]>(
      LOCAL_STORAGE_KEYS.BADGES,
      DEFAULT_BADGES
    );

    const existing = badges.find(
      (b) => b.code.toUpperCase() === badgeData.code.toUpperCase()
    );
    if (existing) {
      throw new Error(`Mã danh hiệu "${badgeData.code}" đã tồn tại.`);
    }

    const now = new Date().toISOString();
    const newBadge: UserBadge = {
      ...badgeData,
      id: `badge-${Date.now()}`,
      code: badgeData.code.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };

    badges.push(newBadge);
    this.setItem(LOCAL_STORAGE_KEYS.BADGES, badges);

    this.addAuditLog({
      id: `audit-${Date.now()}`,
      userId: 'system',
      badgeId: newBadge.id,
      action: 'CREATED',
      performedBy: 'Admin',
      timestamp: now,
      note: `Tạo danh hiệu mới ${newBadge.name}`,
    });

    return newBadge;
  }

  async updateBadge(id: string, updates: Partial<UserBadge>): Promise<UserBadge> {
    const badges = this.getItem<UserBadge[]>(
      LOCAL_STORAGE_KEYS.BADGES,
      DEFAULT_BADGES
    );

    const idx = badges.findIndex((b) => b.id === id);
    if (idx === -1) {
      throw new Error(`Không tìm thấy danh hiệu id="${id}"`);
    }

    if (updates.code) {
      const dupe = badges.find(
        (b) => b.id !== id && b.code.toUpperCase() === updates.code!.toUpperCase()
      );
      if (dupe) {
        throw new Error(`Mã danh hiệu "${updates.code}" đã tồn tại.`);
      }
      updates.code = updates.code.toUpperCase();
    }

    const now = new Date().toISOString();
    const updatedBadge: UserBadge = {
      ...badges[idx],
      ...updates,
      updatedAt: now,
    };

    badges[idx] = updatedBadge;
    this.setItem(LOCAL_STORAGE_KEYS.BADGES, badges);

    this.addAuditLog({
      id: `audit-${Date.now()}`,
      userId: 'system',
      badgeId: id,
      action: 'UPDATED',
      performedBy: 'Admin',
      timestamp: now,
      note: `Cập nhật danh hiệu ${updatedBadge.name}`,
    });

    return updatedBadge;
  }

  async deleteBadge(id: string): Promise<void> {
    let badges = this.getItem<UserBadge[]>(
      LOCAL_STORAGE_KEYS.BADGES,
      DEFAULT_BADGES
    );

    const badge = badges.find((b) => b.id === id);
    badges = badges.filter((b) => b.id !== id);
    this.setItem(LOCAL_STORAGE_KEYS.BADGES, badges);

    this.addAuditLog({
      id: `audit-${Date.now()}`,
      userId: 'system',
      badgeId: id,
      action: 'DELETED',
      performedBy: 'Admin',
      timestamp: new Date().toISOString(),
      note: `Xóa danh hiệu ${badge?.name || id}`,
    });
  }

  async getEventDefinitions(): Promise<BadgeEventDefinition[]> {
    return this.getItem<BadgeEventDefinition[]>(
      LOCAL_STORAGE_KEYS.EVENT_DEFS,
      DEFAULT_EVENT_DEFINITIONS
    );
  }

  async createEventDefinition(
    data: Omit<BadgeEventDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BadgeEventDefinition> {
    const eventDefs = await this.getEventDefinitions();
    const key = data.eventKey.trim().toUpperCase();

    if (!/^[A-Z0-9_]+$/.test(key)) {
      throw new Error('mã eventKey chỉ được chứa chữ cái in hoa, số và dấu gạch dưới (_).');
    }

    const existing = eventDefs.find((e) => e.eventKey === key);
    if (existing) {
      throw new Error(`Sự kiện với eventKey "${key}" đã tồn tại.`);
    }

    const now = new Date().toISOString();
    const newDef: BadgeEventDefinition = {
      ...data,
      id: `evt-${Date.now()}`,
      eventKey: key,
      createdAt: now,
      updatedAt: now,
    };

    eventDefs.push(newDef);
    this.setItem(LOCAL_STORAGE_KEYS.EVENT_DEFS, eventDefs);
    return newDef;
  }

  async updateEventDefinition(
    id: string,
    updates: Partial<BadgeEventDefinition>
  ): Promise<BadgeEventDefinition> {
    const eventDefs = await this.getEventDefinitions();
    const idx = eventDefs.findIndex((e) => e.id === id);

    if (idx === -1) {
      throw new Error(`Không tìm thấy định nghĩa sự kiện id="${id}"`);
    }

    const now = new Date().toISOString();
    const updatedDef: BadgeEventDefinition = {
      ...eventDefs[idx],
      ...updates,
      updatedAt: now,
    };

    eventDefs[idx] = updatedDef;
    this.setItem(LOCAL_STORAGE_KEYS.EVENT_DEFS, eventDefs);
    return updatedDef;
  }

  async getAuditLogs(userId?: string): Promise<BadgeAuditLog[]> {
    const logs = this.getItem<BadgeAuditLog[]>(LOCAL_STORAGE_KEYS.AUDIT_LOGS, []);
    if (userId) {
      return logs.filter((l) => l.userId === userId);
    }
    return logs;
  }

  private addAuditLog(log: BadgeAuditLog): void {
    const logs = this.getItem<BadgeAuditLog[]>(LOCAL_STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift(log);
    this.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOGS, logs);
  }
}
