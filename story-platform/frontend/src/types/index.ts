// Domain types for Audio Story Platform (Phase 1)

export * from './reviews';
export * from './badges';

export enum UserRole {
  USER = 'USER',
  CREATOR = 'CREATOR',
  PARTNER = 'PARTNER',
  REVIEWER = 'REVIEWER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum StoryStatus {
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

export enum PublishStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export type ContentAccessLevel = 'FREE' | 'PREMIUM';

export interface AudioChapter {
  id: string;
  storyId: string;
  number: number;
  title: string;
  slug: string;
  audioUrl?: string;
  videoUrl?: string;
  videoIframeUrl?: string;
  iframeCode?: string;
  iframeUrl?: string;
  allowVideoDisplay?: boolean;
  isVideoEnabled?: boolean;
  audioContent?: string;
  durationSeconds: number;
  accessLevel: ContentAccessLevel;
  isEarlyAccess: boolean;
  earlyAccessUntil?: string;
  authorId?: string;
  narrator: string; // Giọng đọc / MC
  publishStatus: PublishStatus;
  publishedAt: string;
  canListen?: boolean;
  requiresAuthentication?: boolean;
  requiresPremium?: boolean;
  audioFile?: File;
  videoFile?: File;
}

export interface AudioStory {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  authorId?: string;
  narratorName: string; // Giọng đọc chính
  summary: string;
  storyline?: string; // Cốt truyện chi tiết
  audioContent?: string; // Nội dung âm thanh / transcript
  coverUrl: string;
  bannerUrl?: string;
  genres?: Genre[];
  storyStatus: StoryStatus;
  publishStatus: PublishStatus;
  rating: number; // e.g. 4.9
  reviewCount: number;
  totalChapters: number;
  totalDurationSeconds: number;
  isVideoStory?: boolean;
  iframeCode?: string;
  iframeUrl?: string;
  stats: {
    viewCount: number;
    listenCount: number;
    favoriteCount: number;
  };
  chapters: AudioChapter[];
  publishedAt: string;
  isExclusive?: boolean;
  quality?: AudioQuality;
  bitrateKbps?: number;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  storyCount: number;
}

export interface ListeningProgress {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: string;
  lastPlayedAt?: string;
  completed: boolean;
  syncStatus?: 'PENDING' | 'SYNCED' | 'LOCAL_ONLY';
  version?: number;
}

export type SleepTimerOption = 0 | 15 | 30 | 45 | 60 | -1; // -1 means end of episode, 0 means off

export interface StoryTrendStats {
  listens24h: number;
  listens7d: number;
  growthRatePercent: number;
  favorites7d: number;
  completionRatePercent: number;
  trendRank: number;
}

export interface UserActivityRanking {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  activityPoints: number;
  validListeningMinutes: number;
  completedStories: number;
  helpfulReviews: number;
  activeDays: number;
  rank: number;
  achievements?: string[];
}

export interface CreatorRanking {
  creatorId: string;
  name: string;
  role: 'MC' | 'AUTHOR' | 'CREATOR';
  avatarUrl?: string;
  storyCount: number;
  totalListens: number;
  growthPercent: number;
  rating: number;
  rank: number;
}

export interface ActivityBadge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: 'LISTENER' | 'REVIEWER' | 'CREATOR' | 'COMMUNITY';
  isUnlocked?: boolean;
}

export interface UserPlaylist {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  coverUrl?: string;
  itemCount: number;
  totalDurationSeconds: number;
  createdAt: string;
  updatedAt: string;
  lastPlayedAt?: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  storyId: string;
  chapterId: string;
  position: number;
  addedAt: string;
}

export interface PlaylistLimits {
  maximumPlaylists: number | null;
  maximumItemsPerPlaylist: number | null;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  storyId: string;
  chapterId: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  lastListenedAt: string;
}

export type MembershipTier = 'FREE' | 'PREMIUM';

export type SubscriptionStatus =
  | 'NONE'
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export type SubscriptionPlanId =
  | 'PREMIUM_MONTHLY'
  | 'PREMIUM_QUARTERLY'
  | 'PREMIUM_SEMIANNUAL'
  | 'PREMIUM_ANNUAL';

export type PremiumPlanCode = SubscriptionPlanId;

export type PremiumBenefit =
  | 'AD_FREE'
  | 'HIGH_QUALITY_AUDIO'
  | 'PREMIUM_CATALOG'
  | 'EARLY_ACCESS'
  | 'UNLIMITED_PLAYLISTS'
  | 'PREMIUM_COMMENT_BADGE'
  | 'PRIORITY_SUPPORT';

export interface PremiumPlan {
  code: string;
  name: string;
  priceVnd: number;
  durationDays: number;
  originalPriceVnd?: number;
  savingsVnd?: number;
  isPopular?: boolean;
  isBestDeal?: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  durationDays: number;
  priceVnd: number;
  originalPriceVnd?: number;
  isRecommended?: boolean;
  benefits: PremiumBenefit[];
}

export interface UserSubscription {
  userId: string;
  membershipTier: MembershipTier;
  planId?: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt?: string;
  expiresAt?: string;
  lastBilledAt?: string;
  autoRenew: boolean;
  cancelledAt?: string;
}

export type AudioQuality = 'STANDARD' | 'HIGH' | 'AUTO';

export interface AudioSource {
  url: string;
  quality: AudioQuality;
  bitrateKbps?: number;
}

export type ViewRoute =
  | 'home'
  | 'explore'
  | 'genres'
  | 'leaderboard'
  | 'search'
  | 'story-detail'
  | 'full-player'
  | 'library'
  | 'favorites'
  | 'listening'
  | 'history'
  | 'creator-studio'
  | 'partner-portal'
  | 'admin-portal'
  | 'premium'
  | 'account-subscription'
  | 'playlists'
  | 'playlist-detail'
  | 'help'
  | 'contact'
  | 'account-support';


export interface TitleEffect {
  type: 'GLOW' | 'BORDER' | 'TEXT_COLOR' | 'SHINE' | 'ICON';
  color?: string;
  iconName?: string;
}

export interface HonoraryTitle {
  id: string;
  name: string;
  description: string;
  effects: TitleEffect[];
  createdAt: string;
  isActive: boolean;
}

export interface UserTitle {
  titleId: string;
  name: string;
  assignedAt: string;
  effects: TitleEffect[];
}
