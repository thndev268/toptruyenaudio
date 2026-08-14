export const MAX_FEATURED_BADGES = 1;
export const MAX_PUBLIC_PROFILE_BADGES = 6;

export type BadgeLevel = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface BadgeLevelMetadata {
  level: BadgeLevel;
  displayName: 'THÔNG THƯỜNG' | 'HIẾM' | 'KINH ĐIỂN' | 'HUYỀN THOẠI';
  colorName: 'Xám' | 'Xanh lá' | 'Vàng' | 'Đỏ';
  hexColor: string;
  badgeTagClass: string;
  borderClass: string;
}

export const BADGE_LEVEL_METADATA: Record<BadgeLevel, BadgeLevelMetadata> = {
  COMMON: {
    level: 'COMMON',
    displayName: 'THÔNG THƯỜNG',
    colorName: 'Xám',
    hexColor: '#64748b',
    badgeTagClass: 'bg-slate-200 text-slate-700 border-slate-300',
    borderClass: 'border-slate-300 dark:border-slate-700',
  },
  RARE: {
    level: 'RARE',
    displayName: 'HIẾM',
    colorName: 'Xanh lá',
    hexColor: '#10b981',
    badgeTagClass: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    borderClass: 'border-emerald-400 dark:border-emerald-500/60',
  },
  EPIC: {
    level: 'EPIC',
    displayName: 'KINH ĐIỂN',
    colorName: 'Vàng',
    hexColor: '#f59e0b',
    badgeTagClass: 'bg-amber-100 text-amber-900 border-amber-400',
    borderClass: 'border-amber-400 dark:border-amber-500/80',
  },
  LEGENDARY: {
    level: 'LEGENDARY',
    displayName: 'HUYỀN THOẠI',
    colorName: 'Đỏ',
    hexColor: '#f43f5e',
    badgeTagClass: 'bg-rose-100 text-rose-900 border-rose-500',
    borderClass: 'border-rose-500 dark:border-red-500/80',
  },
};

export type BadgeAssignmentSource = 'SYSTEM' | 'ADMIN';

export type BadgeVisibility = 'PUBLIC' | 'PRIVATE';

export type BadgeAwardMode = 'MANUAL' | 'AUTOMATIC';

export type BadgeEventType =
  | 'LISTENING_MINUTES_REACHED'
  | 'CHAPTERS_COMPLETED'
  | 'STORIES_COMPLETED'
  | 'CONSECUTIVE_LISTENING_DAYS'
  | 'COMMENTS_POSTED'
  | 'VALID_REVIEWS_POSTED'
  | 'PLAYLISTS_CREATED'
  | 'FAVORITES_ADDED'
  | 'ACCOUNT_AGE_DAYS'
  | 'PREMIUM_ACTIVATED'
  | 'CREATOR_CONTENT_PUBLISHED'
  | 'CUSTOM_EVENT';

export type BadgeConditionOperator =
  | 'EQUALS'
  | 'GREATER_THAN_OR_EQUAL'
  | 'GREATER_THAN'
  | 'LESS_THAN_OR_EQUAL';

export interface BadgeCondition {
  id: string;
  badgeId: string;
  eventType: BadgeEventType | string;
  operator: BadgeConditionOperator;
  targetValue: number;
  timeWindowDays?: number;
  isRepeatable?: boolean;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  description: string;
}

export interface UserBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  level: BadgeLevel;
  requirementText?: string;
  awardMode: BadgeAwardMode;
  condition?: BadgeCondition;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadgeAssignment {
  id: string;
  userId: string;
  badgeId: string;
  source: BadgeAssignmentSource;
  assignedBy?: string;
  assignedAt: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  visibility: BadgeVisibility;
  isFeatured: boolean;
  seenAt?: string;
  toastShownAt?: string;
  internalNote?: string;
  badge?: UserBadge;
}

export interface BadgeNotification {
  id: string;
  userId: string;
  assignmentId: string;
  badgeId: string;
  title: string;
  message: string;
  readAt?: string;
  toastShownAt?: string;
  createdAt: string;
  badge?: UserBadge;
}

export interface BadgeAwardNotification {
  assignmentId: string;
  badge: UserBadge;
  awardedAt: string;
}

export interface BadgeFilters {
  search?: string;
  level?: BadgeLevel | 'ALL';
  awardMode?: BadgeAwardMode | 'ALL';
  isActive?: boolean;
  status?: 'ACTIVE' | 'HIDDEN' | 'ALL';
}

export interface BadgeEventDefinition {
  id: string;
  eventKey: string;
  name: string;
  description: string;
  metricType: 'COUNT' | 'DURATION' | 'BOOLEAN';
  unit?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BadgeEventInput {
  userId: string;
  eventType: BadgeEventType | string;
  incrementValue?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface BadgeEventProgress {
  id: string;
  userId: string;
  eventType: string;
  currentValue: number;
  updatedAt: string;
}

export interface BadgeAuditLog {
  id: string;
  userId: string;
  badgeId: string;
  action: 'ASSIGNED' | 'REVOKED' | 'VISIBILITY_CHANGED' | 'FEATURED_SET' | 'CREATED' | 'UPDATED' | 'DELETED';
  performedBy: string;
  timestamp: string;
  note?: string;
  revokeReason?: string;
}

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
