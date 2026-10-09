import fs from 'fs';
import path from 'path';
import {
  UserBadge,
  UserBadgeAssignment,
  BadgeNotification,
  BadgeEventDefinition,
  BadgeEventProgress,
  BadgeAuditLog,
  BadgeEventType,
  BadgeConditionOperator,
  BadgeAwardMode,
  BadgeVisibility,
  BadgeCondition,
} from '../story-platform/frontend/src/types/badges';

const DB_FILE = path.join(process.cwd(), 'badge_database.json');

interface BadgeDatabaseSchema {
  badges: UserBadge[];
  userBadges: UserBadgeAssignment[];
  badgeNotifications: BadgeNotification[];
  badgeEventDefinitions: BadgeEventDefinition[];
  badgeEventProgress: BadgeEventProgress[];
  badgeAuditLogs: BadgeAuditLog[];
}

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
    name: 'Số đánh giá chất lượng',
    description: 'Đánh giá chi tiết và hữu ích cho tác phẩm.',
    metricType: 'COUNT',
    unit: 'đánh giá',
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

class BadgeServerStore {
  private data: BadgeDatabaseSchema;
  private locks: Set<string> = new Set();

  constructor() {
    this.data = this.loadFromFile();
  }

  private loadFromFile(): BadgeDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          badges: parsed.badges || DEFAULT_BADGES,
          userBadges: parsed.userBadges || [],
          badgeNotifications: parsed.badgeNotifications || [],
          badgeEventDefinitions: parsed.badgeEventDefinitions || DEFAULT_EVENT_DEFINITIONS,
          badgeEventProgress: parsed.badgeEventProgress || [],
          badgeAuditLogs: parsed.badgeAuditLogs || [],
        };
      }
    } catch (e) {
      console.error('[BadgeServerStore] Error loading DB file:', e);
    }

    const initial: BadgeDatabaseSchema = {
      badges: DEFAULT_BADGES,
      userBadges: [
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
      ],
      badgeNotifications: [],
      badgeEventDefinitions: DEFAULT_EVENT_DEFINITIONS,
      badgeEventProgress: [],
      badgeAuditLogs: [],
    };
    this.saveToFile(initial);
    return initial;
  }

  private saveToFile(db: BadgeDatabaseSchema = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error('[BadgeServerStore] Error saving DB file:', e);
    }
  }

  // --- BADGE DEFINITIONS ---
  public getBadges(status?: 'ACTIVE' | 'HIDDEN' | 'ALL'): UserBadge[] {
    if (status === 'ACTIVE') {
      return this.data.badges.filter((b) => b.isActive);
    }
    if (status === 'HIDDEN') {
      return this.data.badges.filter((b) => !b.isActive);
    }
    return this.data.badges;
  }

  public getBadgeById(id: string): UserBadge | undefined {
    return this.data.badges.find((b) => b.id === id || b.code.toUpperCase() === id.toUpperCase());
  }

  public createBadge(badgeData: Omit<UserBadge, 'id' | 'createdAt' | 'updatedAt'>): UserBadge {
    const existing = this.data.badges.find((b) => b.code.toUpperCase() === badgeData.code.toUpperCase());
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

    this.data.badges.push(newBadge);
    this.saveToFile();
    return newBadge;
  }

  public updateBadge(id: string, updates: Partial<UserBadge>): UserBadge {
    const idx = this.data.badges.findIndex((b) => b.id === id);
    if (idx === -1) {
      throw new Error(`Không tìm thấy danh hiệu id="${id}"`);
    }

    if (updates.code) {
      const dupe = this.data.badges.find((b) => b.id !== id && b.code.toUpperCase() === updates.code!.toUpperCase());
      if (dupe) {
        throw new Error(`Mã danh hiệu "${updates.code}" đã tồn tại.`);
      }
      updates.code = updates.code.toUpperCase();
    }

    const updated: UserBadge = {
      ...this.data.badges[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.data.badges[idx] = updated;
    this.saveToFile();
    return updated;
  }

  public deleteBadge(id: string): void {
    this.data.badges = this.data.badges.filter((b) => b.id !== id);
    this.saveToFile();
  }

  // --- USER BADGES ---
  public getUserBadges(userId: string): UserBadgeAssignment[] {
    const assignments = this.data.userBadges.filter((a) => a.userId === userId && !a.revokedAt);
    return assignments.map((a) => ({
      ...a,
      badge: this.getBadgeById(a.badgeId),
    }));
  }

  public getPublicUserBadges(userId: string): UserBadgeAssignment[] {
    const assignments = this.getUserBadges(userId);
    const publicAssignments = assignments.filter((a) => a.visibility === 'PUBLIC' && a.badge?.isActive);
    // Limit max 6 public profile badges
    return publicAssignments.slice(0, 6);
  }

  public getFeaturedBadge(userId: string): UserBadgeAssignment | undefined {
    const assignments = this.getUserBadges(userId);
    return assignments.find((a) => a.isFeatured && a.visibility === 'PUBLIC' && a.badge?.isActive);
  }

  // --- ASSIGN & REVOKE (With atomic lock) ---
  public assignBadge(
    userId: string,
    badgeId: string,
    source: 'ADMIN' | 'SYSTEM' = 'ADMIN',
    assignedBy: string = 'System',
    internalNote?: string
  ): UserBadgeAssignment {
    const lockKey = `${userId}:${badgeId}`;
    if (this.locks.has(lockKey)) {
      throw new Error('Đang xử lý cấp danh hiệu cho người dùng này, vui lòng thử lại.');
    }

    try {
      this.locks.add(lockKey);

      const badge = this.getBadgeById(badgeId);
      if (!badge) {
        throw new Error(`Danh hiệu không tồn tại: ${badgeId}`);
      }

      // Check duplicate assignment
      const existing = this.data.userBadges.find(
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

      this.data.userBadges.push(newAssignment);

      // Create Notification
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

      this.data.badgeNotifications.push(notification);

      // Log Audit
      this.data.badgeAuditLogs.unshift({
        id: `audit-${Date.now()}`,
        userId,
        badgeId: badge.id,
        action: 'ASSIGNED',
        performedBy: assignedBy,
        timestamp: now,
        note: internalNote,
      });

      this.saveToFile();
      return newAssignment;
    } finally {
      this.locks.delete(lockKey);
    }
  }

  public revokeBadge(userId: string, badgeId: string, revokedBy: string = 'Admin', revokeReason: string = ''): void {
    const assignment = this.data.userBadges.find(
      (a) => a.userId === userId && a.badgeId === badgeId && !a.revokedAt
    );

    if (!assignment) {
      throw new Error('Không tìm thấy danh hiệu cần thu hồi.');
    }

    const now = new Date().toISOString();
    assignment.revokedAt = now;
    assignment.revokedBy = revokedBy;
    assignment.revokeReason = revokeReason;
    assignment.isFeatured = false; // Auto un-feature

    // Log Audit
    this.data.badgeAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      userId,
      badgeId,
      action: 'REVOKED',
      performedBy: revokedBy,
      timestamp: now,
      note: revokeReason,
      revokeReason,
    });

    this.saveToFile();
  }

  public setVisibility(userId: string, assignmentId: string, visibility: BadgeVisibility): UserBadgeAssignment {
    const assignment = this.data.userBadges.find((a) => a.id === assignmentId && a.userId === userId && !a.revokedAt);
    if (!assignment) {
      throw new Error('Không tìm thấy danh hiệu.');
    }

    assignment.visibility = visibility;
    this.saveToFile();
    return assignment;
  }

  public setFeatured(userId: string, assignmentId: string | null): void {
    // Un-feature all user badges
    this.data.userBadges.forEach((a) => {
      if (a.userId === userId) {
        a.isFeatured = a.id === assignmentId && !a.revokedAt;
      }
    });

    this.saveToFile();
  }

  // --- NOTIFICATIONS ---
  public getUserNotifications(userId: string): BadgeNotification[] {
    return this.data.badgeNotifications
      .filter((n) => n.userId === userId)
      .map((n) => ({
        ...n,
        badge: this.getBadgeById(n.badgeId),
      }));
  }

  public markNotificationRead(userId: string, notificationId: string): void {
    const notif = this.data.badgeNotifications.find((n) => n.id === notificationId && n.userId === userId);
    if (notif) {
      notif.readAt = new Date().toISOString();
      this.saveToFile();
    }
  }

  public markToastShown(userId: string, notificationId: string): void {
    const notif = this.data.badgeNotifications.find((n) => n.id === notificationId && n.userId === userId);
    if (notif) {
      notif.toastShownAt = new Date().toISOString();
      this.saveToFile();
    }
  }

  // --- EVENT RECORDING & EVALUATION ENGINE ---
  public async recordEvent(userId: string, eventType: string, incrementValue: number = 1): Promise<UserBadgeAssignment[]> {
    // Update progress
    let progress = this.data.badgeEventProgress.find((p) => p.userId === userId && p.eventType === eventType);
    if (!progress) {
      progress = {
        id: `prog-${Date.now()}`,
        userId,
        eventType,
        currentValue: 0,
        updatedAt: new Date().toISOString(),
      };
      this.data.badgeEventProgress.push(progress);
    }

    progress.currentValue += incrementValue;
    progress.updatedAt = new Date().toISOString();
    this.saveToFile();

    // Evaluate automatic badges
    return this.evaluateUserBadges(userId, eventType, progress.currentValue);
  }

  private evaluateUserBadges(userId: string, eventType: string, currentValue: number): UserBadgeAssignment[] {
    const automaticBadges = this.data.badges.filter(
      (b) => b.isActive && b.awardMode === 'AUTOMATIC' && b.condition?.isActive && b.condition?.eventType === eventType
    );

    const newlyAwarded: UserBadgeAssignment[] = [];

    for (const badge of automaticBadges) {
      const cond = badge.condition!;
      let isMet = false;

      switch (cond.operator) {
        case 'EQUALS':
          isMet = currentValue === cond.targetValue;
          break;
        case 'GREATER_THAN_OR_EQUAL':
          isMet = currentValue >= cond.targetValue;
          break;
        case 'GREATER_THAN':
          isMet = currentValue > cond.targetValue;
          break;
        case 'LESS_THAN_OR_EQUAL':
          isMet = currentValue <= cond.targetValue;
          break;
      }

      if (isMet) {
        try {
          const assignment = this.assignBadge(userId, badge.id, 'SYSTEM', 'System Engine', `Tự động đạt điều kiện: ${cond.description}`);
          newlyAwarded.push(assignment);
        } catch (e) {
          // Already owned or locked
        }
      }
    }

    return newlyAwarded;
  }

  // --- EVENT DEFINITIONS ---
  public getEventDefinitions(): BadgeEventDefinition[] {
    return this.data.badgeEventDefinitions;
  }

  public createEventDefinition(data: Omit<BadgeEventDefinition, 'id' | 'createdAt' | 'updatedAt'>): BadgeEventDefinition {
    const key = data.eventKey.trim().toUpperCase();
    if (!/^[A-Z0-9_]+$/.test(key)) {
      throw new Error('mã eventKey chỉ được chứa chữ cái in hoa, số và dấu gạch dưới (_).');
    }

    const existing = this.data.badgeEventDefinitions.find((e) => e.eventKey === key);
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

    this.data.badgeEventDefinitions.push(newDef);
    this.saveToFile();
    return newDef;
  }

  public updateEventDefinition(id: string, updates: Partial<BadgeEventDefinition>): BadgeEventDefinition {
    const idx = this.data.badgeEventDefinitions.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new Error(`Không tìm thấy định nghĩa sự kiện id="${id}"`);
    }

    if (updates.eventKey) {
      const key = updates.eventKey.trim().toUpperCase();
      // Check if badges are using this key
      const isUsed = this.data.badges.some((b) => b.condition?.eventType === this.data.badgeEventDefinitions[idx].eventKey);
      if (isUsed && key !== this.data.badgeEventDefinitions[idx].eventKey) {
        throw new Error('Không thể thay đổi eventKey vì đang được sử dụng bởi ít nhất một danh hiệu.');
      }
      updates.eventKey = key;
    }

    const updated: BadgeEventDefinition = {
      ...this.data.badgeEventDefinitions[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.data.badgeEventDefinitions[idx] = updated;
    this.saveToFile();
    return updated;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(userId?: string): BadgeAuditLog[] {
    if (userId) {
      return this.data.badgeAuditLogs.filter((l) => l.userId === userId);
    }
    return this.data.badgeAuditLogs;
  }
}

export const badgeServerStore = new BadgeServerStore();
