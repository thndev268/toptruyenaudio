// Domain types for TOP TRUYỆN AUDIO Admin Portal (Single Owner Admin System)
import { Genre } from './index';

export type AdminType = 'OWNER_ADMIN';

export interface OwnerAdminProfile {
  id: string;
  name: string;
  email: string;
  adminType: AdminType;
  title: string;
  avatarUrl: string;
  joinedAt: string;
  lastLoginAt: string;
  security2FAEnabled: boolean;
  systemPermissions: string[];
}

export type AdminScreenId =
  | 'dashboard'
  | 'users'
  | 'user-detail'
  | 'creators'
  | 'premium'
  | 'badges'
  | 'stories'
  | 'story-detail'
  | 'genres'
  | 'comments'
  | 'reports'
  | 'copyright'
  | 'tickets'
  | 'notifications'
  | 'maintenance'
  | 'incidents'
  | 'service-health'
  | 'security-alerts'
  | 'alert-detail'
  | 'audit-logs'
  | 'feature-flags'
  | 'admin-profile';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'CREATOR' | 'PARTNER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  membershipTier: 'FREE' | 'PREMIUM';
  tier?: 'FREE' | 'PREMIUM';
  avatar?: string;
  avatarUrl?: string;
  joinedAt?: string;
  createdAt: string;
  lastLoginAt: string;
  totalListens: number;
  isOwnerAdmin?: boolean;
  banReason?: string;
  premiumExpiresAt?: string;
  listenHistoryCount: number;
  favoritesCount: number;
  honoraryTitles?: import('./index').UserTitle[];
}

export interface AdminCreatorApplication {
  id: string;
  creatorName: string;
  email: string;
  phone: string;
  experience: string;
  sampleAudioUrl: string;
  storyTitle: string;
  sampleChaptersCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewNotes?: string;
}

export interface AdminSubscriptionRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amountVnd: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startedAt: string;
  expiresAt: string;
  paymentMethod: string;
  autoRenew: boolean;
}

export interface AdminStoryItem {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  authorId?: string;
  narratorName: string;
  genres?: Genre[];
  genreIds?: string[]; // Array of genre IDs for API
  totalChapters: number;
  storyStatus: 'ONGOING' | 'COMPLETED' | 'PAUSED';
  publishStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED';
  accessLevel: 'FREE' | 'PREMIUM';
  listenCount: number;
  rating: number;
  createdAt: string;
  summary: string;
  storyline?: string; // Cốt truyện
  audioContent?: string; // Nội dung âm thanh
  coverUrl: string;
  isVideoStory?: boolean;
  iframeCode?: string;
  iframeUrl?: string;
}

export interface AdminChapterItem {
  id: string;
  storyId: string;
  number: number;
  title: string;
  durationSeconds: number;
  audioUrl: string;
  accessLevel: 'FREE' | 'PREMIUM';
  authorId?: string;
  narrator: string;
  publishStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED';
  publishedAt: string;
}

export interface AdminGenreItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  storyCount: number;
  iconName?: string;
}

export interface AdminCommentItem {
  id: string;
  storyId: string;
  storyTitle: string;
  userName: string;
  userEmail: string;
  content: string;
  rating: number;
  createdAt: string;
  reportCount: number;
  status: 'ACTIVE' | 'HIDDEN' | 'FLAGGED';
  isPinned?: boolean;
}

export interface AdminViolationReport {
  id: string;
  targetType: 'STORY' | 'COMMENT' | 'USER' | 'CREATOR';
  targetId: string;
  targetTitle: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolutionNote?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AdminCopyrightClaim {
  id: string;
  workTitle: string;
  claimantName: string;
  claimantEmail: string;
  organization: string;
  infringingStoryId: string;
  infringingStoryTitle: string;
  proofUrl: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  submittedAt: string;
  actionTaken?: string;
}

export interface AdminSupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'ACCOUNT' | 'PREMIUM' | 'AUDIO_PLAYBACK' | 'BUG' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'RESOLVED' | 'CLOSED';
  message: string;
  adminReply?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminBroadcastNotification {
  id: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER';
  sentAt: string;
  sentBy: AdminType;
  reachCount: number;
  status: 'SENT' | 'DRAFT';
}

export interface AdminMaintenanceConfig {
  isEnabled: boolean;
  bannerMessage: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  allowAdminBypass: boolean;
  lastUpdatedBy: AdminType;
  lastUpdatedAt: string;
}

export interface AdminSystemIncident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  affectedServices: string[];
  description: string;
  startedAt: string;
  resolvedAt?: string;
  timeline: {
    timestamp: string;
    message: string;
    status: string;
  }[];
}

export interface AdminServiceHealthItem {
  id: string;
  name: string;
  category: 'CDN' | 'DATABASE' | 'AUTH' | 'STORAGE' | 'QUEUE' | string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE';
  latencyMs: number;
  uptimePercent: number;
  endpoint: string;
  lastChecked: string;
  statusNote?: string;
  nodeRegion?: string;
  httpStatus?: number;
  latencyHistory?: number[];
  cpuLoadPercent?: number;
  memoryUsagePercent?: number;
  activeConnections?: number;
  errorRatePercent?: number;
}

export interface AdminSecurityAlert {
  id: string;
  title: string;
  type: 'RATE_LIMIT' | 'SUSPICIOUS_LOGIN' | 'BRUTE_FORCE' | 'DDoS_SPIKE' | 'UNUSUAL_AUDIO_SCRAPING';
  ipAddress: string;
  location: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'RESOLVED' | 'FALSE_POSITIVE';
  impactScope: string;
  description: string;
  detectedAt: string;
  actionTaken?: string;
}

export interface AdminAuditLogEntry {
  id: string;
  timestamp: string;
  performedBy: AdminType;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  reason: string;
  impactScope: string;
  metadata?: Record<string, any>;
}

export interface AdminFeatureFlag {
  key: string;
  name: string;
  description: string;
  category: 'AUDIO' | 'PREMIUM' | 'SYSTEM' | 'SECURITY' | 'CREATOR';
  isEnabled: boolean;
  isProtected?: boolean;
  lastModified: string;
}

export interface DangerousActionConfirmation {
  isOpen: boolean;
  title: string;
  description: string;
  impactScope: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning' | 'primary';
  requiresReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => Promise<void> | void;
}
