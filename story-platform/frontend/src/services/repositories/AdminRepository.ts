// AdminRepository - Single Owner Admin Management Engine
import {
  AdminType,
  OwnerAdminProfile,
  AdminUser,
  AdminCreatorApplication,
  AdminSubscriptionRecord,
  AdminStoryItem,
  AdminChapterItem,
  AdminGenreItem,
  AdminCommentItem,
  AdminViolationReport,
  AdminCopyrightClaim,
  AdminSupportTicket,
  AdminBroadcastNotification,
  AdminMaintenanceConfig,
  AdminSystemIncident,
  AdminServiceHealthItem,
  AdminSecurityAlert,
  AdminAuditLogEntry,
  AdminFeatureFlag,
} from '../../types/admin';
import { AudioChapter, HonoraryTitle, TitleEffect, UserTitle } from '../../types';
import { apiRequest, getDataSourceMode } from '../apiClient';
import { notificationsRepository, CreateNotificationInput } from './NotificationsRepository';

export interface VideoIframeSettings {
  showIframeByDefault: boolean;
  hideIframeWithCSS: boolean;
  allowUserToggleIframe: boolean;
  autoPlayVideo: boolean;
  globalVideoEnabled: boolean; // Global toggle for video display - default OFF
}

class AdminRepositoryService {
  
  private honoraryTitles: HonoraryTitle[] = [];

  getHonoraryTitles(): HonoraryTitle[] {
    if (!Array.isArray(this.honoraryTitles)) {
      console.warn('[AdminRepository] honoraryTitles is not an array, resetting to empty array');
      this.honoraryTitles = [];
    }
    return this.honoraryTitles;
  }

  saveHonoraryTitle(title: HonoraryTitle): void {
    if (!Array.isArray(this.honoraryTitles)) {
      this.honoraryTitles = [];
    }
    const existingIndex = this.honoraryTitles.findIndex(t => t.id === title.id);
    if (existingIndex >= 0) {
      this.honoraryTitles[existingIndex] = title;
    } else {
      this.honoraryTitles.push(title);
    }
  }

  deleteHonoraryTitle(titleId: string): void {
    if (!Array.isArray(this.honoraryTitles)) {
      this.honoraryTitles = [];
      return;
    }
    this.honoraryTitles = this.honoraryTitles.filter(t => t.id !== titleId);
  }

  assignTitleToUser(userId: string, titleId: string): void {
    const title = this.honoraryTitles.find(t => t.id === titleId);
    if (!title) return;
    
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      if (!this.users[userIndex].honoraryTitles) {
        this.users[userIndex].honoraryTitles = [];
      }
      
      const alreadyHas = this.users[userIndex].honoraryTitles!.find(t => t.titleId === titleId);
      if (!alreadyHas) {
        this.users[userIndex].honoraryTitles!.push({
          titleId: title.id,
          name: title.name,
          assignedAt: new Date().toISOString(),
          effects: title.effects
        });
      }
    }
  }

  removeTitleFromUser(userId: string, titleId: string): void {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex >= 0 && this.users[userIndex].honoraryTitles) {
      this.users[userIndex].honoraryTitles = this.users[userIndex].honoraryTitles!.filter(t => t.titleId !== titleId);
    }
  }
  
  private videoSettings: VideoIframeSettings = {
    showIframeByDefault: false,
    hideIframeWithCSS: true,
    allowUserToggleIframe: true,
    autoPlayVideo: false,
    globalVideoEnabled: false, // Default OFF - videos hidden globally
  };
  private ownerProfile: OwnerAdminProfile = {
    id: 'owner-admin-01',
    name: 'Chủ Sở Hữu & Điều Hành Hệ Thống',
    email: 'admin@toptruyenaudio.com',
    adminType: 'OWNER_ADMIN',
    title: 'Người Vận Hành Duy Nhất (Owner Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    joinedAt: '2025-01-01',
    lastLoginAt: '2026-08-06 20:30 (Phiên hiện tại)',
    security2FAEnabled: true,
    systemPermissions: [
      'TOÀN QUYỀN VẬN HÀNH HỆ THỐNG',
      'KIỂM DUYỆT BẢN QUYỀN AUDIO',
      'QUẢN LÝ TÀI CHÍNH & PREMIUM',
      'CẤU HÌNH BẢO TRÌ & AN NINH',
      'ĐIỀU HÀNH TÍNH NĂNG FEATURE FLAGS',
    ],
  };

  private users: AdminUser[] = [];

  private creatorApplications: AdminCreatorApplication[] = [];

  private subscriptions: AdminSubscriptionRecord[] = [];

  private stories: AdminStoryItem[] = [];

  private storyChapters: Record<string, AudioChapter[]> = (() => {
    const map: Record<string, AudioChapter[]> = {};
    return map;
  })();

  private loadPersistedState() {
    try {
      if (typeof window === 'undefined') return;
      // Only load video settings from localStorage (UI preference, not data)
      const savedVideoSettings = localStorage.getItem('toptruyenaudio:video-settings:v1');
      if (savedVideoSettings) {
        const parsed = JSON.parse(savedVideoSettings);
        if (parsed && typeof parsed === 'object') {
          this.videoSettings = { ...this.videoSettings, ...parsed };
        }
      }

      // Always fetch from backend API - no localStorage fallback for data
      this.fetchFromBackendApi();
    } catch (e) {
      console.error('Error loading persisted admin state:', e);
      // Don't use localStorage as fallback - let the error propagate
    }
  }

  // Cache for preventing duplicate fetch calls (React Strict Mode)
  private fetchPromise: Promise<void> | null = null;
  
  // Refs to prevent concurrent PUT/DELETE calls
  private updatePromise: Map<string, Promise<any>> = new Map();
  private deletePromise: Map<string, Promise<any>> = new Map();

  private async fetchFromBackendApi() {
    // Return existing promise if already fetching (prevent duplicate calls)
    if (this.fetchPromise) {
      console.log('[fetchFromBackendApi] Already fetching, returning existing promise');
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        // Use apiRequest to ensure proper backend URL and authentication
        try {
          const settingsData = await apiRequest<any>('/admin/video-settings');
          if (settingsData?.settings) {
            this.videoSettings = { ...this.videoSettings, ...settingsData.settings };
            localStorage.setItem('toptruyenaudio:video-settings:v1', JSON.stringify(this.videoSettings));
          }
        } catch (err) {
          console.warn('[fetchFromBackendApi] Failed to fetch video settings:', err);
        }

        try {
          const storiesResponse = await apiRequest<{ success: boolean; data: any[] } | any[]>('/stories');
          
          console.log('[fetchFromBackendApi] Stories response:', storiesResponse);
          
          // Handle both response formats: { success, data } and direct array
          let storiesData: any[] = [];
          if (Array.isArray(storiesResponse)) {
            storiesData = storiesResponse;
          } else if (storiesResponse?.data && Array.isArray(storiesResponse.data)) {
            storiesData = storiesResponse.data;
          }
          
          // Always update stories array, even if empty
          const storiesArray = Array.isArray(this.stories) ? this.stories : [];
          
          if (storiesData.length > 0) {
            storiesData.forEach((as: any) => {
              // Ensure genreIds is set from genres array if missing
              if (as.genres && Array.isArray(as.genres) && as.genres.length > 0 && (!as.genreIds || as.genreIds.length === 0)) {
                as.genreIds = as.genres.map((g: any) => g.id);
                console.log('[fetchFromBackendApi] Set genreIds from genres for story:', as.id, 'genreIds:', as.genreIds);
              }
              
              console.log('[fetchFromBackendApi] Processing story:', as.id, 'genres:', as.genres, 'genreIds:', as.genreIds);
              
              const existingIdx = storiesArray.findIndex((s) => s.id === as.id);
              if (existingIdx !== -1) {
                storiesArray[existingIdx] = as;
              } else {
                storiesArray.unshift(as);
              }
              if (as.chapters && Array.isArray(as.chapters)) {
                this.storyChapters[as.id] = as.chapters;
              } else {
                // Fetch chapters separately if not included in story response
                this.fetchStoryChapters(as.id);
              }
            });
          }
          
          this.stories = storiesArray;
          console.log('[fetchFromBackendApi] Fetched stories count:', this.stories.length);
          console.log('[fetchFromBackendApi] Sample story data:', this.stories[0] ? { id: this.stories[0].id, title: this.stories[0].title, slug: this.stories[0].slug, genreIds: this.stories[0].genreIds, genres: this.stories[0].genres } : 'No stories');
        } catch (err) {
          console.warn('[fetchFromBackendApi] Failed to fetch stories:', err);
        }

        try {
          const genresResponse = await apiRequest<{ success: boolean; data: any[] }>('/stories/genres/all');
          if (genresResponse?.data && Array.isArray(genresResponse.data)) {
            this.genres = genresResponse.data;
            console.log('[fetchFromBackendApi] Fetched genres:', this.genres.length);
            
            // Map genre IDs to genre objects in stories (only if genres is missing)
            const storiesArray = Array.isArray(this.stories) ? this.stories : [];
            storiesArray.forEach((story) => {
              // Only map from genreIds if genres array is empty
              if ((!story.genres || story.genres.length === 0) && story.genreIds && Array.isArray(story.genreIds)) {
                story.genres = this.genres.filter((g) => story.genreIds && story.genreIds.includes(g.id));
                console.log('[fetchFromBackendApi] Mapped genres for story:', story.id, 'genres:', story.genres);
              }
              // Ensure genreIds is set from genres if missing
              if (story.genres && Array.isArray(story.genres) && story.genres.length > 0 && (!story.genreIds || story.genreIds.length === 0)) {
                story.genreIds = story.genres.map((g: any) => g.id);
              }
            });
            
            // Calculate storyCount for each genre based on stories
            const genresWithCount = this.genres.map((genre: any) => {
              const count = storiesArray.filter((story) => {
                const storyGenres = story.genres || [];
                return storyGenres.some((g: any) => g.name === genre.name || g.id === genre.id);
              }).length;
              return {
                ...genre,
                storyCount: count,
              };
            });
            this.genres = genresWithCount;
            console.log('[fetchFromBackendApi] Genres with story counts:', this.genres);
            window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
          }
        } catch (err) {
          console.warn('[fetchFromBackendApi] Failed to fetch genres:', err);
        }
      } catch (err) {
        console.error('[fetchFromBackendApi] Backend API sync failed:', err);
        // Don't fallback to localStorage - let the error propagate
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  public persistState() {
    try {
      if (typeof window === 'undefined') return;
      // Only persist UI preferences (video settings) - stories/chapters always from database
      localStorage.setItem('toptruyenaudio:video-settings:v1', JSON.stringify(this.videoSettings));
    } catch (err) {
      console.warn('Failed to persist state:', err);
    }
  }

  public getVideoSettings(): VideoIframeSettings {
    return { ...this.videoSettings };
  }

  public saveVideoSettings(newSettings: Partial<VideoIframeSettings>): { success: boolean; message: string } {
    this.videoSettings = { ...this.videoSettings, ...newSettings };
    this.persistState();
    return { success: true, message: 'Đã lưu cấu hình hiển thị khung Video Iframe thành công.' };
  }

  public getPublicStories(): any[] {
    if (!Array.isArray(this.stories)) {
      console.warn('[AdminRepository] stories is not an array, resetting to empty array', this.stories);
      this.stories = [];
    }
    return this.stories.map((s) => {
      const chapters = Array.isArray(this.storyChapters[s.id]) ? this.storyChapters[s.id] : [];
      if (!Array.isArray(s.genres)) {
        console.warn('[AdminRepository] story.genres is not an array', s.id, s.genres);
      }
      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        authorName: s.authorName,
        narratorName: s.narratorName,
        summary: s.summary,
        storyline: s.storyline || s.summary,
        audioContent: s.audioContent || s.summary,
        coverUrl: s.coverUrl,
        bannerUrl: s.coverUrl,
        genres: Array.isArray(s.genres) ? s.genres : [],
        storyStatus: s.storyStatus || 'COMPLETED',
        publishStatus: s.publishStatus || 'PUBLISHED',
        rating: s.rating || 5.0,
        reviewCount: 88,
        totalChapters: chapters.length > 0 ? chapters.length : (s.totalChapters || 0),
        totalDurationSeconds: chapters.reduce((acc, c) => acc + (c.durationSeconds || 1800), 0) || 1800,
        isExclusive: false,
        publishedAt: s.createdAt,
        isVideoStory: s.isVideoStory,
        iframeCode: s.iframeCode,
        iframeUrl: s.iframeUrl,
        stats: {
          viewCount: s.listenCount || 0,
          listenCount: s.listenCount || 0,
          favoriteCount: 0,
        },
        chapters: chapters.length > 0 ? chapters : [],
      };
    });
  }

  async fetchPublicStoriesApi(): Promise<any[]> {
    if (getDataSourceMode() === 'API') {
      try {
        const res = await apiRequest<any[]>('/stories');
        if (Array.isArray(res)) {
          this.stories = res;
          return this.getPublicStories();
        }
      } catch (err) {
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return this.getPublicStories();
  }

  private genres: AdminGenreItem[] = [];

  private comments: AdminCommentItem[] = [];

  private reports: AdminViolationReport[] = [];

  private copyrightClaims: AdminCopyrightClaim[] = [];

  private tickets: AdminSupportTicket[] = [];

  private notifications: AdminBroadcastNotification[] = [];

  private maintenanceConfig: AdminMaintenanceConfig = {
    isEnabled: false,
    bannerMessage: 'Hệ thống đang bảo trì nâng cấp cụm máy chủ Streaming Audio. Dự kiến hoàn tất trong 30 phút.',
    scheduledStart: '2026-08-10 02:00',
    scheduledEnd: '2026-08-10 03:00',
    allowAdminBypass: true,
    lastUpdatedBy: 'OWNER_ADMIN',
    lastUpdatedAt: '2026-08-06 18:00',
  };

  private incidents: AdminSystemIncident[] = [];

  private serviceHealth: AdminServiceHealthItem[] = [];

  private securityAlerts: AdminSecurityAlert[] = [];

  private auditLogs: AdminAuditLogEntry[] = [];

  private featureFlags: AdminFeatureFlag[] = [
    {
      key: 'audioStreaming320Kbps',
      name: 'Phát Âm Thanh Chất Lượng Cao 320kbps (Premium)',
      description: 'Cho phép thành viên Premium nghe âm thanh bitrate cao với dải tần đầy đủ.',
      category: 'PREMIUM',
      isEnabled: true,
      isProtected: true,
      lastModified: '2026-08-06 12:00',
    },
    {
      key: 'creatorUploadAutoEncode',
      name: 'Tự Động Mã Hóa AAC Khi Creator Tải Tập Mới',
      description: 'Tự động chuyển đổi file MP3/WAV thô của Creator sang chuẩn HLS tối ưu di động.',
      category: 'CREATOR',
      isEnabled: true,
      lastModified: '2026-08-05 09:30',
    },
    {
      key: 'guestListenLimit',
      name: 'Giới Hạn 5 Tập Đầu Miễn Phí Cho Khách Vãng Lai',
      description: 'Yêu cầu đăng ký tài khoản miễn phí sau khi nghe hết 5 tập audio đầu tiên.',
      category: 'AUDIO',
      isEnabled: true,
      lastModified: '2026-08-04 14:15',
    },
    {
      key: 'systemMaintenanceBanner',
      name: 'Hiển Thị Biểu Ngữ Thông Báo Nâng Cấp Hệ Thống',
      description: 'Hiển thị thanh banner đầu trang báo trước kế hoạch bảo dưỡng định kỳ.',
      category: 'SYSTEM',
      isEnabled: false,
      lastModified: '2026-08-06 18:00',
    },
    {
      key: 'securityAutoBanBruteForce',
      name: 'Tự Động Khóa IP Khi Phát Hiện Brute Force Đăng Nhập',
      description: 'Chặn tạm thời 24h đối với IP gửi quá 20 yêu cầu sai mật khẩu liên tiếp.',
      category: 'SECURITY',
      isEnabled: true,
      isProtected: true,
      lastModified: '2026-08-06 10:00',
    },
    {
      key: 'userReviewModeration',
      name: 'Kiểm Duyệt Bình Luận Chứa Từ Khóa Nhạy Cảm',
      description: 'Tự động đưa bình luận chứa link lạ hoặc từ ngữ vi phạm vào hàng đợi duyệt.',
      category: 'SYSTEM',
      isEnabled: true,
      lastModified: '2026-08-02 11:00',
    },
  ];

  constructor() {
    // Don't load stories from localStorage - always fetch fresh from backend
    // Only load UI preferences (video settings)
    this.loadPersistedState();
    // Fetch real service health data from backend
    this.fetchServiceHealthFromBackend();
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        users: this.users,
        creatorApplications: this.creatorApplications,
        subscriptions: this.subscriptions,
        stories: this.stories,
        genres: this.genres,
        comments: this.comments,
        reports: this.reports,
        copyrightClaims: this.copyrightClaims,
        notifications: this.notifications,
        maintenanceConfig: this.maintenanceConfig,
        incidents: this.incidents,
        securityAlerts: this.securityAlerts,
        auditLogs: this.auditLogs,
        featureFlags: this.featureFlags,
        serviceHealth: this.serviceHealth,
      };
      localStorage.setItem('toptruyenaudio:admin-data:v1', JSON.stringify(data));
      this.persistState();
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
    } catch (e) {
      console.error('Failed to save admin repository data to localStorage', e);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('toptruyenaudio:admin-data:v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.users) this.users = parsed.users;
        if (parsed.creatorApplications) this.creatorApplications = parsed.creatorApplications;
        if (parsed.subscriptions) this.subscriptions = parsed.subscriptions;
        if (parsed.stories) this.stories = parsed.stories;
        if (parsed.genres) this.genres = parsed.genres;
        if (parsed.comments) this.comments = parsed.comments;
        if (parsed.reports) this.reports = parsed.reports;
        if (parsed.copyrightClaims) this.copyrightClaims = parsed.copyrightClaims;
        if (parsed.notifications) this.notifications = parsed.notifications;
        if (parsed.maintenanceConfig) this.maintenanceConfig = parsed.maintenanceConfig;
        if (parsed.incidents) this.incidents = parsed.incidents;
        if (parsed.securityAlerts) this.securityAlerts = parsed.securityAlerts;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
        if (parsed.featureFlags) this.featureFlags = parsed.featureFlags;
        if (parsed.serviceHealth) this.serviceHealth = parsed.serviceHealth;
      }
    } catch (e) {
      console.error('Failed to load admin repository data from localStorage', e);
    }
  }

  // Helper to record an audit log entry on any action
  private recordAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    entityName: string,
    reason: string,
    impactScope: string,
    metadata?: Record<string, any>
  ) {
    const now = new Date();
    const formatted = now.toISOString().replace('T', ' ').substring(0, 19);
    const newLog: AdminAuditLogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: formatted,
      performedBy: 'OWNER_ADMIN',
      action,
      entityType,
      entityId,
      entityName,
      reason: reason || 'Chủ sở hữu thực hiện thao tác quản trị trực tiếp',
      impactScope,
      metadata,
    };
    this.auditLogs.unshift(newLog);
  }

  // --- Profile ---
  getOwnerProfile(): OwnerAdminProfile {
    return { ...this.ownerProfile };
  }

  async fetchOwnerProfileApi(): Promise<OwnerAdminProfile> {
    if (getDataSourceMode() === 'API') {
      try {
        const me = await apiRequest<any>('/admin/me');
        if (me && me.id) {
          this.ownerProfile = {
            ...this.ownerProfile,
            id: me.id,
            name: me.displayName || me.name || 'Owner Admin',
            email: me.email,
          };
        }
      } catch (e) {
        if (getDataSourceMode() === 'API') throw e;
      }
    }
    return this.getOwnerProfile();
  }

  // --- Users ---
  getUsers(): AdminUser[] {
    return [...this.users];
  }

  async fetchUsersApi(): Promise<AdminUser[]> {
    // Always try to fetch from API for admin operations, regardless of data source mode
    try {
      const res = await apiRequest<{ items: any[]; pagination: any }>('/admin/users');
      
      if (res && Array.isArray(res.items)) {
        this.users = res.items.map((u: any) => ({
          id: u.id || u._id,
          name: u.displayName || u.email?.split('@')[0] || 'Unknown',
          email: u.email || '',
          role: u.role === 'OWNER_ADMIN' ? 'ADMIN' : u.role,
          status: u.status || u.accountStatus || 'ACTIVE',
          tier: u.membershipTier || u.membership?.tier || 'FREE',
          membershipTier: u.membershipTier || u.membership?.tier || 'FREE',
          createdAt: u.createdAt ? u.createdAt.substring(0, 10) : '2026-01-01',
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.substring(0, 16) : 'Chưa có',
          totalListens: u.stats?.totalListens || 0,
          listenHistoryCount: u.stats?.historyCount || 0,
          favoritesCount: u.stats?.favoritesCount || 0,
          isOwnerAdmin: u.role === 'OWNER_ADMIN',
          avatar: u.avatarUrl || null,
        }));
      }
    } catch (err) {
      // Don't throw error, fall back to local data
    }
    
    return this.getUsers();
  }

  getUserById(id: string): AdminUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  async updateUserStatus(
    userId: string,
    newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED',
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const endpoint = newStatus === 'ACTIVE' 
        ? `/admin/users/${userId}/unsuspend` 
        : `/admin/users/${userId}/suspend`;
      
      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      
      // Update local state
      const user = this.users.find((u) => u.id === userId);
      if (user) {
        if (user.isOwnerAdmin) {
          return { success: false, message: 'CẢNH BÁO AN TOÀN: Không thể tự khóa hoặc thay đổi trạng thái của Chủ Sở Hữu (Owner Admin).' };
        }
        user.status = newStatus;
        user.banReason = newStatus !== 'ACTIVE' ? reason : undefined;
      }

      this.recordAuditLog(
        `ĐỔI_TRẠNG_THÁI_NGƯỜI_DÙNG_${newStatus}`,
        'User',
        userId,
        user?.name || 'Unknown',
        reason,
        `Tài khoản chuyển sang trạng thái ${newStatus}`
      );

      if (newStatus === 'SUSPENDED' || newStatus === 'BANNED') {
        const statusTitle = newStatus === 'BANNED' ? 'Cấm vĩnh viễn' : 'Tạm khóa';
        const notifTitle = '⚠️ Tài khoản của bạn đã bị khóa bởi quản trị viên';
        const notifContent = `Tài khoản đã bị Ban Quản Trị ${statusTitle.toLowerCase()} trên hệ thống. Lý do: "${reason}". Vui lòng liên hệ hỗ trợ nếu cần giải đáp.`;

        // Check if notification already exists to avoid duplication
        const exists = this.notifications.some((n) => n.title === notifTitle && n.content === notifContent && n.targetUserId === userId);
        if (!exists) {
          this.sendBroadcastNotification(notifTitle, notifContent, 'WARNING', 'SPECIFIC_USER', userId);
        }
      }

      this.saveToStorage();
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));

      return { success: true, message: `Đã cập nhật trạng thái người dùng thành công.` };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, message: 'Cập nhật trạng thái người dùng thất bại.' };
    }
  }

  async updateUserMembership(
    userId: string,
    newTier: 'FREE' | 'PREMIUM',
    daysToAdd: number = 30,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (newTier === 'PREMIUM') {
        await apiRequest(`/admin/users/${userId}/grant-premium`, {
          method: 'POST',
          body: JSON.stringify({
            planId: 'PREMIUM_MONTHLY',
            days: daysToAdd,
            reason,
          }),
        });
      }
      
      // Update local state
      const user = this.users.find((u) => u.id === userId);
      if (user) {
        user.membershipTier = newTier;
        user.tier = newTier;
        if (newTier === 'PREMIUM') {
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + daysToAdd);
          user.premiumExpiresAt = expDate.toISOString().split('T')[0];
        } else {
          user.premiumExpiresAt = undefined;
        }
      }

      this.recordAuditLog(
        `CẤP_GÓI_MEMBERSHIP_${newTier}`,
        'User',
        userId,
        user?.name || 'Unknown',
        reason,
        `Chuyển thành viên sang hạng ${newTier} (${daysToAdd} ngày)`
      );

      this.saveToStorage();
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));

      return { success: true, message: `Đã cập nhật gói thành viên thành công.` };
    } catch (error) {
      console.error('Error updating user membership:', error);
      return { success: false, message: 'Cập nhật gói thành viên thất bại.' };
    }
  }

  async deleteUser(userId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
      
      // Update local state
      const userIndex = this.users.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        const user = this.users[userIndex];
        if (user.isOwnerAdmin) {
          return { success: false, message: 'CẢNH BÁO AN TOÀN: Không thể tự xóa tài khoản Chủ Sở Hữu (Owner Admin).' };
        }
        this.users.splice(userIndex, 1);
      }

      this.recordAuditLog(
        'XÓA_TÀI_KHOẢN_NGƯỜI_DÙNG',
        'User',
        userId,
        'Unknown',
        reason,
        `Xóa vĩnh viễn dữ liệu tài khoản`
      );

      return { success: true, message: 'Đã xóa người dùng thành công.' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Xóa người dùng thất bại.' };
    }
  }

  // --- Creator Applications ---
  getCreatorApplications(): AdminCreatorApplication[] {
    return [...this.creatorApplications];
  }

  approveCreatorApplication(appId: string, notes: string): { success: boolean; message: string } {
    const app = this.creatorApplications.find((a) => a.id === appId);
    if (!app) return { success: false, message: 'Không tìm thấy đơn đăng ký.' };

    app.status = 'APPROVED';
    app.reviewNotes = notes || 'Đã kiểm tra chất lượng giọng đọc đạt chuẩn.';

    // Upgrade user role if found
    const user = this.users.find((u) => u.email === app.email);
    if (user) {
      user.role = 'CREATOR';
    }

    this.recordAuditLog(
      'PHÊ_DUYỆT_ĐƠN_CREATOR',
      'CreatorApplication',
      app.id,
      app.creatorName,
      notes,
      `Nâng cấp quyền tác giả/MC cho ${app.email}`
    );

    return { success: true, message: 'Đã phê duyệt đơn đăng ký Creator thành công.' };
  }

  rejectCreatorApplication(appId: string, reason: string): { success: boolean; message: string } {
    const app = this.creatorApplications.find((a) => a.id === appId);
    if (!app) return { success: false, message: 'Không tìm thấy đơn đăng ký.' };

    app.status = 'REJECTED';
    app.reviewNotes = reason;

    this.recordAuditLog(
      'TỪ_CHỐI_ĐƠN_CREATOR',
      'CreatorApplication',
      app.id,
      app.creatorName,
      reason,
      `Từ chối đơn của ${app.email}`
    );

    return { success: true, message: 'Đã từ chối đơn đăng ký.' };
  }

  // --- Subscriptions ---
  getSubscriptions(): AdminSubscriptionRecord[] {
    return [...this.subscriptions];
  }

  // --- Stories ---
  getStories(): AdminStoryItem[] {
    return [...this.stories];
  }

  getStoryById(id: string): AdminStoryItem | undefined {
    return this.stories.find((s) => s.id === id);
  }

  async updateStoryPublishStatus(
    storyId: string,
    newStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED',
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await this.updateStory(storyId, { publishStatus: newStatus });
    if (res.success) {
      const story = this.stories.find((s) => s.id === storyId);
      if (story) {
        this.recordAuditLog(
          `ĐỔI_TRẠNG_THÁI_PHÁT_HÀNH_${newStatus}`,
          'Story',
          story.id,
          story.title,
          reason,
          `Chuyển bộ truyện "${story.title}" sang trạng thái ${newStatus}`
        );
      }
    }
    return res;
  }

  async updateStoryAccessLevel(
    storyId: string,
    newAccess: 'FREE' | 'PREMIUM',
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await this.updateStory(storyId, { accessLevel: newAccess });
    if (res.success) {
      const story = this.stories.find((s) => s.id === storyId);
      if (story) {
        this.recordAuditLog(
          `ĐỔI_QUYỀN_TRUY_CẬP_${newAccess}`,
          'Story',
          story.id,
          story.title,
          reason,
          `Chuyển bộ truyện "${story.title}" sang hạng ${newAccess}`
        );
      }
    }
    return res;
  }

  async deleteStory(storyId: string, reason: string): Promise<{ success: boolean; message: string }> {
    // Prevent concurrent delete for same story
    if (this.deletePromise.has(storyId)) {
      console.log('[deleteStory] Already deleting story, returning existing promise');
      return this.deletePromise.get(storyId);
    }

    const deletePromise = (async () => {
      try {
        const story = this.stories.find((s) => s.id === storyId);
        await apiRequest(`/admin/stories/${storyId}`, {
          method: 'DELETE',
        });

        if (story) {
          this.recordAuditLog(
            'GỠ_BỎ_BỘ_TRUYỆN',
            'Story',
            story.id,
            story.title,
            reason,
            `Gỡ vĩnh viễn bộ truyện "${story.title}" khỏi nền tảng`
          );
        }

        // Remove from local state immediately
        this.stories = this.stories.filter((s) => s.id !== storyId);

        return { success: true, message: 'Đã xóa truyện thành công.' };
      } catch (err: any) {
        console.error('[deleteStory] Error:', err);
        return { success: false, message: err.message || 'Lỗi khi xóa truyện' };
      } finally {
        this.deletePromise.delete(storyId);
      }
    })();

    this.deletePromise.set(storyId, deletePromise);
    return deletePromise;
  }

  // --- Video Story CRUD Methods ---
  async addVideoStory(item: Partial<AdminStoryItem>): Promise<{ success: boolean; message: string; story?: AdminStoryItem }> {
    try {
      // Extract iframeUrl from iframeCode if not provided
      let iframeUrl = item.iframeUrl;
      if (item.iframeCode && !iframeUrl) {
        const srcMatch = item.iframeCode.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          iframeUrl = srcMatch[1];
        }
      }

      // Auto-extract YouTube thumbnail if iframeUrl exists
      let coverUrl = item.coverUrl;
      if (iframeUrl && !coverUrl) {
        const youtubeRegex = /(?:youtube\.com\/embed\/|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = iframeUrl.match(youtubeRegex);
        if (match) {
          const videoId = match[1];
          coverUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      // Generate slug from title if not provided
      const slug = item.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : `video-${Date.now()}`);

      // Build payload matching backend AdminCreateStoryDto
      const payload: any = {
        title: item.title,
        slug,
        authorName: item.authorName || 'Top Truyện Audio',
        narratorName: item.narratorName || 'AI AUDIO',
        summary: item.summary || 'Đang cập nhật.',
        storyline: item.storyline || item.summary || 'Đang cập nhật',
        audioContent: item.audioContent || 'Đang cập nhật',
        coverUrl,
        iframeUrl,
        iframeCode: item.iframeCode,
        isVideoStory: true,
        storyStatus: item.storyStatus || 'ONGOING',
        publishStatus: item.publishStatus || 'PUBLISHED',
        genreIds: item.genreIds,
        videoDurationSeconds: item.videoDurationSeconds || 1800, // Use user-provided duration or default 30 minutes
      };

      // Create story with JSON
      const res = await apiRequest<{ success: boolean; data: { id: string } } | { id: string }>('/admin/stories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Extract storyId from response (handle both response formats)
      const storyId = (res as any)?.data?.id || (res as any)?.id;
      if (!storyId) {
        console.error('[addVideoStory] No storyId in response:', res);
        return { success: false, message: 'Không nhận được ID truyện từ server' };
      }

      console.log('[addVideoStory] Story created with ID:', storyId);

      // Backend already creates Chapter 1 with iframe when creating story
      // No need to create chapter again, just ensure local state is updated
      const responseData = (res as any)?.data || res;
      console.log('[addVideoStory] Backend response:', responseData);
      console.log('[addVideoStory] Response has chapters?', !!responseData?.chapters);
      console.log('[addVideoStory] Chapters array:', responseData?.chapters);
      
      if (responseData && responseData.id) {
        const storyIndex = this.stories.findIndex((s) => s.id === storyId);
        if (storyIndex !== -1) {
          this.stories[storyIndex] = responseData;
        } else {
          this.stories.unshift(responseData);
        }
        if (responseData.chapters && Array.isArray(responseData.chapters)) {
          this.storyChapters[storyId] = responseData.chapters;
          console.log('[addVideoStory] Chapters from backend response:', responseData.chapters.length);
        } else {
          console.warn('[addVideoStory] No chapters in backend response, fetching separately');
          // Fetch chapters separately if not included in response
          try {
            const chaptersResponse = await apiRequest<any>(`/admin/stories/${storyId}/chapters`);
            const chaptersData = chaptersResponse?.data || chaptersResponse;
            if (Array.isArray(chaptersData)) {
              this.storyChapters[storyId] = chaptersData;
              console.log('[addVideoStory] Fetched chapters separately:', chaptersData.length);
            }
          } catch (fetchError) {
            console.error('[addVideoStory] Failed to fetch chapters separately:', fetchError);
          }
        }
        this.persistState();
      }

      return { success: true, message: 'Đã thêm video story thành công.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi khi tạo video story' };
    }
  }

  async updateVideoStory(storyId: string, updated: Partial<AdminStoryItem>): Promise<{ success: boolean; message: string }> {
    return this.updateStory(storyId, updated);
  }

  async updateStory(storyId: string, updated: Partial<AdminStoryItem>): Promise<{ success: boolean; message: string; story?: AdminStoryItem }> {
    // Prevent concurrent update for same story
    if (this.updatePromise.has(storyId)) {
      console.log('[updateStory] Already updating story, returning existing promise');
      return this.updatePromise.get(storyId);
    }

    const updatePromise = (async () => {
      try {
        console.log('[updateStory] Starting update for story:', storyId, updated);
        const formData = new FormData();
        if (updated.title) formData.append('title', updated.title);
        if (updated.slug) formData.append('slug', updated.slug);
        if (updated.authorName) formData.append('authorName', updated.authorName);
        if (updated.narratorName) formData.append('narratorName', updated.narratorName);
        if (updated.summary) formData.append('summary', updated.summary);
        if (updated.storyline) formData.append('storyline', updated.storyline);
        if (updated.storyStatus) formData.append('storyStatus', updated.storyStatus);
        if (updated.publishStatus) formData.append('publishStatus', updated.publishStatus);
        if (updated.accessLevel) formData.append('accessLevel', updated.accessLevel);
        if (updated.coverUrl) formData.append('coverUrl', updated.coverUrl);
        if (updated.iframeUrl !== undefined) formData.append('iframeUrl', updated.iframeUrl);
        if (updated.iframeCode !== undefined) formData.append('iframeCode', updated.iframeCode);
        if (updated.audioContent !== undefined) formData.append('audioContent', updated.audioContent);
        if (updated.isVideoStory !== undefined) formData.append('isVideoStory', String(updated.isVideoStory));
        if (updated.genreIds !== undefined) {
          console.log('[updateStory] genreIds being sent:', updated.genreIds);
          formData.append('genreIds', JSON.stringify(updated.genreIds));
        }

        console.log('[updateStory] Sending API request to /admin/stories/${storyId}');
        const response = await apiRequest<{ success: boolean; data: any }>(`/admin/stories/${storyId}`, {
          method: 'PUT',
          body: formData,
        });
        console.log('[updateStory] API response:', response);

        // Update local state immediately with the returned story data (including genres)
        const storyIndex = this.stories.findIndex((s) => s.id === storyId);
        if (storyIndex !== -1 && response?.data) {
          this.stories[storyIndex] = { ...response.data };
          console.log('[updateStory] Local state updated with genres:', response.data.genres);
        }

        // Fetch fresh data from database to ensure genres are properly mapped
        await this.fetchFromBackendApi();

        return { success: true, message: 'Cập nhật bộ truyện thành công.', story: response?.data };
      } catch (err: any) {
        console.error('[updateStory] Error:', err);
        return { success: false, message: err.message || 'Lỗi khi cập nhật truyện' };
      } finally {
        this.updatePromise.delete(storyId);
      }
    })();

    this.updatePromise.set(storyId, updatePromise);
    return updatePromise;
  }

  async addBulkVideos(items: Partial<AdminStoryItem>[]): Promise<{ success: boolean; count: number; message: string }> {
    const processedTitles = new Set<string>();
    const processedSlugs = new Set<string>();
    let added = 0;
    let skipped = 0;

    for (const item of items) {
      // Skip if title is missing
      if (!item.title) {
        skipped++;
        continue;
      }

      // Normalize title for comparison
      const normalizedTitle = item.title.trim().toLowerCase();
      
      // Skip duplicate titles
      if (processedTitles.has(normalizedTitle)) {
        skipped++;
        continue;
      }

      // Generate expected slug and check for duplicates
      const expectedSlug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (processedSlugs.has(expectedSlug)) {
        skipped++;
        continue;
      }

      // Check if story already exists in local cache
      const existingByTitle = this.stories.find(s => s.title.toLowerCase() === normalizedTitle);
      if (existingByTitle) {
        skipped++;
        continue;
      }

      const existingBySlug = this.stories.find(s => s.slug === expectedSlug);
      if (existingBySlug) {
        skipped++;
        continue;
      }

      // Mark as processed
      processedTitles.add(normalizedTitle);
      processedSlugs.add(expectedSlug);

      const res = await this.addVideoStory(item);
      if (res.success) {
        added++;
      } else {
        skipped++;
      }
    }
    
    await this.fetchFromBackendApi();
    
    const message = skipped > 0 
      ? `Thêm thành công ${added} video, đã bỏ qua ${skipped} trùng lặp` 
      : `Thêm thành công ${added} video`;
    
    return { success: true, count: added, message };
  }

  // --- Story Chapters Management ---
  getStoryChapters(storyId: string): AudioChapter[] {
    return [...(this.storyChapters[storyId] || [])];
  }

  async fetchStoryChapters(storyId: string): Promise<void> {
    try {
      const chaptersResponse = await apiRequest<any>(`/admin/stories/${storyId}/chapters`);
      const chaptersData = chaptersResponse?.data || chaptersResponse;
      if (Array.isArray(chaptersData)) {
        this.storyChapters[storyId] = chaptersData;
        this.persistState();
        console.log('[fetchStoryChapters] Fetched chapters for story:', storyId, chaptersData.length);
      }
    } catch (error) {
      console.error('[fetchStoryChapters] Failed to fetch chapters:', error);
    }
  }

  async addStoryChapter(
    storyId: string,
    chapterData: Partial<AudioChapter>
  ): Promise<{ success: boolean; message: string; chapter?: AudioChapter }> {
    try {
      const formData = new FormData();
      formData.append('number', chapterData.number?.toString() || '1');
      if (chapterData.title) formData.append('title', chapterData.title);
      if (chapterData.durationSeconds) formData.append('durationSeconds', chapterData.durationSeconds.toString());
      if (chapterData.accessLevel) formData.append('accessLevel', chapterData.accessLevel);
      if (chapterData.audioUrl) formData.append('audioUrl', chapterData.audioUrl);
      if (chapterData.videoUrl) formData.append('videoUrl', chapterData.videoUrl);
      if (chapterData.iframeCode) formData.append('iframeCode', chapterData.iframeCode);
      if (chapterData.videoIframeUrl) formData.append('videoIframeUrl', chapterData.videoIframeUrl);
      if (chapterData.audioContent) formData.append('audioContent', chapterData.audioContent);
      
      // Handle file uploads
      if (chapterData.audioFile) formData.append('audioFile', chapterData.audioFile);
      if (chapterData.videoFile) formData.append('videoFile', chapterData.videoFile);

      await apiRequest(`/admin/stories/${storyId}/chapters`, {
        method: 'POST',
        body: formData,
      });

      await this.fetchFromBackendApi();

      return {
        success: true,
        message: `Đã thêm Tập thành công.`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi khi thêm tập' };
    }
  }

  async updateStoryChapter(
    storyId: string,
    chapterId: string,
    chapterData: Partial<AudioChapter>
  ): Promise<{ success: boolean; message: string; chapter?: AudioChapter }> {
    try {
      const formData = new FormData();
      if (chapterData.number !== undefined) formData.append('number', chapterData.number.toString());
      if (chapterData.title) formData.append('title', chapterData.title);
      if (chapterData.durationSeconds !== undefined) formData.append('durationSeconds', chapterData.durationSeconds.toString());
      if (chapterData.accessLevel) formData.append('accessLevel', chapterData.accessLevel);
      if (chapterData.audioUrl) formData.append('audioUrl', chapterData.audioUrl);
      if (chapterData.videoUrl) formData.append('videoUrl', chapterData.videoUrl);
      if (chapterData.iframeCode) formData.append('iframeCode', chapterData.iframeCode);
      if (chapterData.videoIframeUrl) formData.append('videoIframeUrl', chapterData.videoIframeUrl);
      if (chapterData.audioContent) formData.append('audioContent', chapterData.audioContent);
      
      // Handle file uploads
      if (chapterData.audioFile) formData.append('audioFile', chapterData.audioFile);
      if (chapterData.videoFile) formData.append('videoFile', chapterData.videoFile);

      const response = await apiRequest<{ success: boolean; data: any }>(`/admin/stories/${storyId}/chapters/${chapterId}`, {
        method: 'PUT',
        body: formData,
      });

      if (response?.success && response?.data) {
        // Update local state with the returned data
        const list = this.storyChapters[storyId] || [];
        const idx = list.findIndex((c) => c.id === chapterId);
        if (idx !== -1) {
          list[idx] = response.data;
          this.storyChapters[storyId] = list;
        }
        
        // Fetch fresh data to ensure consistency
        await this.fetchFromBackendApi();

        return {
          success: true,
          message: `Đã cập nhật Tập ${response.data.number}: "${response.data.title}" thành công.`,
          chapter: response.data,
        };
      }

      return { success: false, message: 'Cập nhật thất bại' };
    } catch (err: any) {
      console.error('[updateStoryChapter] Error:', err);
      return { success: false, message: err.message || 'Lỗi khi cập nhật tập' };
    }
  }

  async deleteStoryChapter(
    storyId: string,
    chapterId: string,
    reason: string
  ): Promise<{ success: boolean; message: string; remainingCount: number }> {
    try {
      await apiRequest(`/admin/stories/${storyId}/chapters/${chapterId}`, { method: 'DELETE' });
      
      // Update local state
      const list = this.storyChapters[storyId] || [];
      const idx = list.findIndex((c) => c.id === chapterId);
      if (idx !== -1) {
        const removedChapter = list[idx];
        list.splice(idx, 1);
        this.storyChapters[storyId] = list;

        const story = this.stories.find((s) => s.id === storyId);
        if (story) {
          story.totalChapters = list.length;
          this.recordAuditLog(
            'XÓA_TẬP_AUDIO',
            'Chapter',
            removedChapter.id,
            removedChapter.title,
            reason || 'Chủ sở hữu xóa tập audio',
            `Xóa vĩnh viễn tập audio #${removedChapter.number} (${removedChapter.title}) khỏi bộ truyện "${story.title}"`
          );
        }
      }

      this.persistState();
      return {
        success: true,
        message: 'Đã xóa tập audio thành công.',
        remainingCount: this.storyChapters[storyId]?.length || 0,
      };
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa tập audio. Vui lòng thử lại.',
        remainingCount: this.storyChapters[storyId]?.length || 0,
      };
    }
  }

  async deleteStoryChapters(
    storyId: string,
    chapterIds: string[],
    reason: string
  ): Promise<{ success: boolean; message: string; remainingCount: number }> {
    try {
      await apiRequest(`/admin/stories/${storyId}/chapters/batch`, {
        method: 'DELETE',
        body: JSON.stringify({ chapterIds, reason }),
      });

      // Update local state
      const list = this.storyChapters[storyId] || [];
      const initialCount = list.length;
      const idsSet = new Set(chapterIds);

      const remaining = list.filter((c) => !idsSet.has(c.id));
      const deletedCount = initialCount - remaining.length;

      this.storyChapters[storyId] = remaining;

      const story = this.stories.find((s) => s.id === storyId);
      if (story) {
        story.totalChapters = remaining.length;
        this.recordAuditLog(
          'XÓA_NHIỀU_TẬP_AUDIO',
          'Chapter',
          chapterIds.join(', '),
          `${deletedCount} tập audio`,
          reason || 'Chủ sở hữu xóa hàng loạt tập audio',
          `Xóa ${deletedCount} tập audio khỏi bộ truyện "${story.title}"`
        );
      }

      this.persistState();
      return {
        success: true,
        message: `Đã xóa thành công ${deletedCount} tập đã chọn. Bộ truyện còn lại ${remaining.length} tập.`,
        remainingCount: remaining.length,
      };
    } catch (error) {
      console.error('Failed to delete chapters:', error);
      return {
        success: false,
        message: 'Lỗi khi xóa tập audio. Vui lòng thử lại.',
        remainingCount: this.storyChapters[storyId]?.length || 0,
      };
    }
  }

  // --- Genres ---
  getGenres(): AdminGenreItem[] {
    if (!Array.isArray(this.genres)) {
      console.warn('[AdminRepository] genres is not an array, resetting to empty array');
      this.genres = [];
    }
    
    // Ensure stories have genres mapped from genreIds
    this.stories.forEach((story) => {
      if (story.genreIds && Array.isArray(story.genreIds) && (!story.genres || story.genres.length === 0)) {
        story.genres = this.genres.filter((g) => story.genreIds && story.genreIds.includes(g.id));
      }
    });
    
    // Calculate storyCount for each genre
    const genresWithCount = this.genres.map((genre) => {
      const count = this.stories.filter((story) => {
        const storyGenres = story.genres || [];
        return storyGenres.some((g: any) => g.name === genre.name || g.id === genre.id);
      }).length;
      return {
        ...genre,
        storyCount: count,
      };
    });
    
    return genresWithCount;
  }

  async addGenre(name: string, slug: string, description: string, iconName?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest<{ success: boolean; data: any; message: string }>('/admin/stories/genres', {
        method: 'POST',
        body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), description, iconName }),
      });

      if (response?.success && response?.data) {
        // Refresh genres from backend
        await this.fetchFromBackendApi();
        return { success: true, message: response.message || 'Đã thêm thể loại mới thành công.' };
      } else {
        return { success: false, message: response?.message || 'Lỗi khi thêm thể loại.' };
      }
    } catch (error: any) {
      console.error('[AdminRepository] Failed to add genre:', error);
      return { success: false, message: error?.message || 'Lỗi khi thêm thể loại.' };
    }
  }

  async deleteGenre(genreId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(`/admin/stories/genres/${genreId}`, {
        method: 'DELETE',
      });

      if (response?.success) {
        // Refresh genres from backend
        await this.fetchFromBackendApi();
        return { success: true, message: response.message || 'Đã xóa thể loại thành công.' };
      } else {
        return { success: false, message: response?.message || 'Lỗi khi xóa thể loại.' };
      }
    } catch (error: any) {
      console.error('[AdminRepository] Failed to delete genre:', error);
      return { success: false, message: error?.message || 'Lỗi khi xóa thể loại.' };
    }
  }

  // --- Comments ---
  getComments(filters?: { status?: string; storyId?: string }): AdminCommentItem[] {
    return [...this.comments];
  }

  async fetchCommentsApi(filters?: { status?: string; storyId?: string }): Promise<AdminCommentItem[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.storyId) queryParams.append('storyId', filters.storyId);
      
      const url = `/admin/comments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await apiRequest<{ success: boolean; data: any[]; pagination: any }>(url);
      
      if (res && Array.isArray(res.data)) {
        this.comments = res.data.map((c: any) => ({
          id: c.id,
          storyId: c.storyId,
          storyTitle: c.storyTitle || 'Unknown',
          userName: c.userName || 'Unknown',
          userEmail: c.userEmail || '',
          content: c.content || '',
          rating: c.rating || 0,
          createdAt: c.createdAt || new Date().toISOString(),
          reportCount: c.reportCount || 0,
          status: c.status || 'ACTIVE',
          isPinned: c.isPinned || false,
        }));
      }
    } catch (err) {
      console.warn('[fetchCommentsApi] Failed to fetch comments:', err);
    }
    
    return this.getComments();
  }

  async updateCommentStatus(commentId: string, newStatus: 'ACTIVE' | 'HIDDEN' | 'FLAGGED', reason: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiRequest(`/admin/comments/${commentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason }),
      });
      
      const cmt = this.comments.find((c) => c.id === commentId);
      if (cmt) {
        cmt.status = newStatus;
      }

      this.recordAuditLog(
        `KIỂM_DUYỆT_BÌNH_LUẬN_${newStatus}`,
        'Comment',
        commentId,
        cmt?.userName || 'Unknown',
        reason,
        `Thay đổi trạng thái bình luận thành ${newStatus}`
      );

      this.saveToStorage();
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));

      return { success: true, message: 'Đã cập nhật trạng thái bình luận.' };
    } catch (error) {
      console.error('Error updating comment status:', error);
      return { success: false, message: 'Cập nhật trạng thái bình luận thất bại.' };
    }
  }

  async deleteComment(commentId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiRequest(`/admin/comments/${commentId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
      
      const idx = this.comments.findIndex((c) => c.id === commentId);
      const cmt = idx !== -1 ? this.comments[idx] : null;
      if (idx !== -1) {
        this.comments.splice(idx, 1);
      }

      this.recordAuditLog(
        'XÓA_BÌNH_LUẬN',
        'Comment',
        commentId,
        cmt?.userName || 'Unknown',
        reason,
        `Xóa vĩnh viễn bình luận trên truyện "${cmt?.storyTitle || 'Unknown'}"`
      );

      this.saveToStorage();
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));

      return { success: true, message: 'Đã xóa bình luận thành công.' };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, message: 'Xóa bình luận thất bại.' };
    }
  }

  // --- Violation Reports ---
  getReports(): AdminViolationReport[] {
    return [...this.reports];
  }

  resolveReport(reportId: string, resolutionNote: string): { success: boolean; message: string } {
    const rep = this.reports.find((r) => r.id === reportId);
    if (!rep) return { success: false, message: 'Không tìm thấy báo cáo.' };

    rep.status = 'RESOLVED';
    rep.resolutionNote = resolutionNote;

    this.recordAuditLog(
      'XỬ_LÝ_BÁO_CÁO_VI_PHẠM',
      'ViolationReport',
      rep.id,
      rep.targetTitle,
      resolutionNote,
      `Đã xử lý báo cáo vi phạm #${rep.id}`
    );

    return { success: true, message: 'Đã xử lý báo cáo vi phạm thành công.' };
  }

  dismissReport(reportId: string, reason: string): { success: boolean; message: string } {
    const rep = this.reports.find((r) => r.id === reportId);
    if (!rep) return { success: false, message: 'Không tìm thấy báo cáo.' };

    rep.status = 'DISMISSED';
    rep.resolutionNote = `Bỏ qua: ${reason}`;

    this.recordAuditLog(
      'BỎ_QUA_BÁO_CÁO_VI_PHẠM',
      'ViolationReport',
      rep.id,
      rep.targetTitle,
      reason,
      `Xác định báo cáo #${rep.id} không vi phạm hoặc báo cáo nhầm`
    );

    return { success: true, message: 'Đã bỏ qua báo cáo.' };
  }

  // --- Copyright Claims ---
  getCopyrightClaims(): AdminCopyrightClaim[] {
    return [...this.copyrightClaims];
  }

  resolveCopyrightClaim(claimId: string, actionTaken: string): { success: boolean; message: string } {
    const claim = this.copyrightClaims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Không tìm thấy yêu cầu bản quyền.' };

    claim.status = 'RESOLVED';
    claim.actionTaken = actionTaken;

    this.recordAuditLog(
      'XỬ_LÝ_KHIẾU_NẠI_BẢN_QUYỀN',
      'CopyrightClaim',
      claim.id,
      claim.workTitle,
      actionTaken,
      `Thực thi xử lý bản quyền cho tác phẩm "${claim.workTitle}"`
    );

    return { success: true, message: 'Đã xử lý khiếu nại bản quyền thành công.' };
  }

  dismissCopyrightClaim(claimId: string, reason: string): { success: boolean; message: string } {
    const claim = this.copyrightClaims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Không tìm thấy yêu cầu bản quyền.' };

    claim.status = 'DISMISSED';
    claim.actionTaken = `Từ chối: ${reason}`;

    this.recordAuditLog(
      'BỎ_QUA_KHIẾU_NẠI_BẢN_QUYỀN',
      'CopyrightClaim',
      claim.id,
      claim.workTitle,
      reason,
      `Bằng chứng bản quyền không hợp lệ hoặc thiếu căn cứ pháp lý`
    );

    return { success: true, message: 'Đã từ chối khiếu nại bản quyền.' };
  }

  // --- Support Tickets ---
  getTickets(): AdminSupportTicket[] {
    try {
      if (typeof window !== 'undefined') {
        let rawSupport = localStorage.getItem('toptruyenaudio:support:v1');
        if (!rawSupport) {
          // Auto-initialize support key with empty array
          const initialConvs: any[] = [];
          localStorage.setItem('toptruyenaudio:support:v1', JSON.stringify(initialConvs));
          rawSupport = JSON.stringify(initialConvs);
        }

        const convs: any[] = JSON.parse(rawSupport);
        const mapped: AdminSupportTicket[] = convs.map((c: any) => {
          const adminMsg = c.messages?.find(
            (m: any) => m.senderRole === 'ADMIN' || m.senderRole === 'OWNER_ADMIN'
          );
          return {
            id: c.id,
            userName: c.userName || 'Người dùng',
            userEmail: c.userId?.includes('@') ? c.userId : `${c.userId || 'user'}@toptruyenaudio.com`,
            subject: c.subject || 'Yêu cầu hỗ trợ',
            category: (c.category as any) || 'OTHER',
            priority: (c.priority as any) || 'MEDIUM',
            status: c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'RESOLVED' : 'PENDING',
            message: c.messages?.[0]?.content || 'Nội dung hỗ trợ',
            createdAt: (() => {
              try {
                const date = new Date(c.createdAt || Date.now());
                if (isNaN(date.getTime())) return new Date().toISOString().replace('T', ' ').substring(0, 16);
                return date.toISOString().replace('T', ' ').substring(0, 16);
              } catch (e) {
                return new Date().toISOString().replace('T', ' ').substring(0, 16);
              }
            })(),
            adminReply: adminMsg?.content,
            resolvedAt: c.status === 'RESOLVED' ? (() => {
              try {
                const date = new Date(c.updatedAt || Date.now());
                if (isNaN(date.getTime())) return new Date().toISOString().replace('T', ' ').substring(0, 16);
                return date.toISOString().replace('T', ' ').substring(0, 16);
              } catch (e) {
                return new Date().toISOString().replace('T', ' ').substring(0, 16);
              }
            })() : undefined,
          };
        });

        this.tickets = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn('Error reading support tickets storage', e);
    }
    return [];
  }

  resolveTicket(ticketId: string, adminReply: string): { success: boolean; message: string } {
    const allTickets = this.getTickets();
    let ticket = allTickets.find((t) => t.id === ticketId);
    if (!ticket) {
      ticket = this.tickets.find((t) => t.id === ticketId);
    }
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (ticket) {
      ticket.status = 'RESOLVED';
      ticket.adminReply = adminReply;
      ticket.resolvedAt = nowStr;
      const idx = this.tickets.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        this.tickets[idx] = ticket;
      } else {
        this.tickets.push(ticket);
      }
    }

    // Sync back to SupportRepository localStorage
    try {
      if (typeof window !== 'undefined') {
        const rawSupport = localStorage.getItem('toptruyenaudio:support:v1');
        if (rawSupport) {
          const convs: any[] = JSON.parse(rawSupport);
          const targetConv = convs.find((c: any) => c.id === ticketId);
          if (targetConv) {
            targetConv.status = 'RESOLVED';
            targetConv.updatedAt = new Date().toISOString();
            if (adminReply && adminReply.trim()) {
              if (!targetConv.messages) targetConv.messages = [];
              targetConv.messages.push({
                id: 'msg-admin-' + Math.random().toString(36).substring(2, 7),
                conversationId: ticketId,
                senderRole: 'ADMIN',
                senderName: 'Ban Quản Trị (OWNER_ADMIN)',
                content: adminReply,
                createdAt: new Date().toISOString(),
              });
            }
            localStorage.setItem('toptruyenaudio:support:v1', JSON.stringify(convs));
          }
        }
      }
    } catch (e) {
      console.error('Failed to sync ticket resolution to support storage', e);
    }

    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
    }

    // Notify user (specific user who created the ticket)
    this.sendBroadcastNotification(
      `[Hỗ Trợ Admin] Phản hồi ticket: ${ticket?.subject || ticketId}`,
      `Ban Quản Trị đã phản hồi yêu cầu hỗ trợ của bạn: "${adminReply}"`,
      'SUPPORT',
      'SPECIFIC_USER',
      (ticket as any)?.userId || ticket?.userEmail
    );

    this.recordAuditLog(
      'PHẢN_HỒI_HỖ_TRỢ_NGƯỜI_DÙNG',
      'SupportTicket',
      ticketId,
      ticket?.subject || ticketId,
      adminReply,
      `Giải quyết yêu cầu hỗ trợ của ${ticket?.userEmail || 'người dùng'}`
    );

    this.saveToStorage();
    return { success: true, message: 'Đã gửi phản hồi và giải quyết ticket thành công.' };
  }

  // --- Notifications ---
  getNotifications(): AdminBroadcastNotification[] {
    return [...this.notifications];
  }

  async fetchNotificationsFromBackend(): Promise<AdminBroadcastNotification[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: any[]; meta?: any }>('/notifications/admin/all?status=SENT');
      if (response?.success && response?.data) {
        this.notifications = response.data.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          type: n.type,
          targetAudience: n.targetAudience,
          sentAt: n.sentAt || n.createdAt,
          sentBy: n.createdBy || 'OWNER_ADMIN',
          reachCount: n.recipientCount || 0,
          status: n.status,
        }));
        console.log('[AdminRepository] Fetched notifications:', this.notifications.length);
        return this.notifications;
      }
    } catch (error) {
      console.error('[AdminRepository] Failed to fetch notifications:', error);
    }
    return this.notifications;
  }

  private cachedUserCounts: { total: number; premium: number; creator: number; partner: number } | null = null;
  private userCountsCacheTime: number = 0;
  private readonly USER_COUNTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getUserCounts(): Promise<{ total: number; premium: number; creator: number; partner: number }> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.cachedUserCounts && (now - this.userCountsCacheTime) < this.USER_COUNTS_CACHE_TTL) {
      return this.cachedUserCounts;
    }

    try {
      const response = await apiRequest<{ success: boolean; data: { total: number; premium: number; creator: number; partner: number } }>('/notifications/admin/user-counts');
      if (response?.success && response.data) {
        this.cachedUserCounts = response.data;
        this.userCountsCacheTime = now;
        return response.data;
      }
      // Return zeros if API fails - no fake numbers
      return { total: 0, premium: 0, creator: 0, partner: 0 };
    } catch (error) {
      console.error('[AdminRepository] Failed to fetch user counts:', error);
      // Return zeros if API fails - no fake numbers
      return { total: 0, premium: 0, creator: 0, partner: 0 };
    }
  }

  getCachedUserCounts(): { total: number; premium: number; creator: number; partner: number } {
    return this.cachedUserCounts || { total: 0, premium: 0, creator: 0, partner: 0 };
  }

  async sendBroadcastNotification(title: string, content: string, type: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER' | 'WARNING' | 'ERROR' | 'SUPPORT', targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER' | 'SPECIFIC_USER', targetUserId?: string): Promise<{ success: boolean; message: string }> {
    // Get real user counts for accurate reach calculation
    const userCounts = this.getCachedUserCounts();
    
    const reachCount = targetAudience === 'ALL' 
      ? userCounts.total 
      : targetAudience === 'PREMIUM' 
        ? userCounts.premium 
        : targetAudience === 'CREATOR' 
          ? userCounts.creator 
          : targetAudience === 'PARTNER' 
            ? userCounts.partner 
            : targetAudience === 'SPECIFIC_USER' 
              ? 1 
              : 0;

    const newNotif: AdminBroadcastNotification = {
      id: 'notif-' + Math.random().toString(36).substring(2, 7),
      title,
      content,
      type,
      targetAudience,
      targetUserId: targetAudience === 'SPECIFIC_USER' ? targetUserId : undefined,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sentBy: 'OWNER_ADMIN',
      reachCount,
      status: 'SENT',
    };
    this.notifications.unshift(newNotif);

    // Save to backend API first before returning success
    try {
      await this.saveNotificationToBackend(title, content, type, targetAudience, targetUserId);
      console.log('[AdminRepository] Notification saved to backend successfully');
    } catch (err) {
      console.error('[AdminRepository] Failed to save notification to backend:', err);
      // Remove from local storage if backend save failed
      this.notifications = this.notifications.filter(n => n.id !== newNotif.id);
      return { success: false, message: 'Lưu thông báo vào database thất bại. Vui lòng thử lại.' };
    }

    this.recordAuditLog(
      'GỬI_THÔNG_BÁO_TOÀN_HỆ_THỐNG',
      'BroadcastNotification',
      newNotif.id,
      title,
      'Gửi thông báo broadcast trực tiếp đến đối tượng người dùng',
      `Phát thông báo tới nhóm ${targetAudience}${targetUserId ? ` (User ID: ${targetUserId})` : ''}`
    );

    this.saveToStorage();
    return { success: true, message: 'Đã phát sóng thông báo thành công.' };
  }

  private async saveNotificationToBackend(
    title: string,
    content: string,
    type: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER' | 'WARNING' | 'ERROR' | 'SUPPORT',
    targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER' | 'SPECIFIC_USER',
    targetUserId?: string
  ): Promise<void> {
    try {
      const input: CreateNotificationInput = {
        title,
        content,
        type,
        targetAudience: targetAudience === 'PARTNER' ? 'CREATOR' : targetAudience as 'ALL' | 'REGULAR' | 'PREMIUM' | 'CREATOR' | 'SPECIFIC_USER',
        targetUserId,
      };
      await notificationsRepository.createNotification(input);
      console.log('[AdminRepository] Notification saved to backend successfully');
    } catch (error) {
      console.error('[AdminRepository] Failed to save notification to backend:', error);
      // Don't throw error - local storage should still work as fallback
    }
  }

  deleteBroadcastNotification(id: string): { success: boolean; message: string } {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    if (this.notifications.length === initialLength) {
      return { success: false, message: 'Không tìm thấy thông báo để xóa.' };
    }

    this.recordAuditLog(
      'XÓA_THÔNG_BÁO_HỆ_THỐNG',
      'BroadcastNotification',
      id,
      'Broadcast Notification',
      'Xóa thông báo đã gửi khỏi hệ thống',
      `Xóa bỏ thông báo ID: ${id}`
    );

    this.saveToStorage();
    return { success: true, message: 'Đã xóa thông báo thành công.' };
  }

  // --- Maintenance ---
  getMaintenanceConfig(): AdminMaintenanceConfig {
    return { ...this.maintenanceConfig };
  }

  updateMaintenanceConfig(config: Partial<AdminMaintenanceConfig>, reason: string): { success: boolean; message: string } {
    this.maintenanceConfig = {
      ...this.maintenanceConfig,
      ...config,
      lastUpdatedBy: 'OWNER_ADMIN',
      lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.recordAuditLog(
      'CẬP_NHẬT_CHẾ_ĐỘ_BẢO_TRÌ',
      'MaintenanceConfig',
      'sys-maint',
      'Trạng thái bảo trì hệ thống',
      reason,
      `Bảo trì ${this.maintenanceConfig.isEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}`
    );

    this.saveToStorage();
    return { success: true, message: 'Đã lưu cấu hình bảo trì hệ thống.' };
  }

  // --- Incidents ---
  getIncidents(): AdminSystemIncident[] {
    return [...this.incidents];
  }

  createIncident(
    title: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    affectedServices: string[],
    description: string
  ): { success: boolean; message: string } {
    const newInc: AdminSystemIncident = {
      id: 'inc-' + Math.random().toString(36).substring(2, 7),
      title,
      severity,
      status: 'INVESTIGATING',
      affectedServices,
      description,
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      timeline: [
        {
          timestamp: new Date().toLocaleTimeString(),
          message: 'Owner Admin ghi nhận sự cố và bắt đầu điều tra',
          status: 'Đang điều tra',
        },
      ],
    };
    this.incidents.unshift(newInc);

    this.recordAuditLog(
      'GHI_NHẬN_SỰ_CỐ_HỆ_THỐNG',
      'SystemIncident',
      newInc.id,
      title,
      description,
      `Kích hoạt theo dõi sự cố cấp độ ${severity}`
    );

    this.saveToStorage();
    return { success: true, message: 'Đã tạo sự cố và bắt đầu theo dõi.' };
  }

  resolveIncident(incidentId: string, resolutionMessage: string): { success: boolean; message: string } {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) return { success: false, message: 'Không tìm thấy sự cố.' };

    inc.status = 'RESOLVED';
    inc.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    inc.timeline.push({
      timestamp: new Date().toLocaleTimeString(),
      message: resolutionMessage || 'Đã khắc phục hoàn toàn sự cố và khôi phục hoạt động',
      status: 'Đã xử lý',
    });

    this.recordAuditLog(
      'ĐÓNG_SỰ_CỐ_HỆ_THỐNG',
      'SystemIncident',
      inc.id,
      inc.title,
      resolutionMessage,
      `Đóng sự cố và xác nhận khôi phục các dịch vụ`
    );

    this.saveToStorage();
    return { success: true, message: 'Đã đóng sự cố thành công.' };
  }

  // --- Service Health ---
  private async fetchServiceHealthFromBackend(): Promise<void> {
    try {
      const response = await fetch('/api/v1/health/services', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.services && Array.isArray(data.services)) {
          this.serviceHealth = data.services.map((svc: any) => ({
            ...svc,
            id: svc.id || `srv-${Date.now().toString().slice(-4)}`,
          }));
          this.saveToStorage();
        }
      }
    } catch (error) {
      console.error('[AdminRepository] Failed to fetch service health from backend:', error);
      // Leave serviceHealth empty - will show "Chưa xác định" in UI
    }
  }

  getServiceHealth(): AdminServiceHealthItem[] {
    return [...this.serviceHealth];
  }

  async pingServiceHealthItem(id: string): Promise<AdminServiceHealthItem | null> {
    const item = this.serviceHealth.find((s) => s.id === id);
    if (!item) return null;

    try {
      // Try to fetch real data from backend API
      const response = await fetch('/api/v1/health/services', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.services && Array.isArray(data.services)) {
          const updatedService = data.services.find((s: any) => s.id === id);
          if (updatedService) {
            // Update the specific service with real data
            Object.assign(item, {
              ...updatedService,
              id: item.id, // Keep original ID
            });
            item.lastChecked = `Đồng bộ từ Backend lúc ${new Date().toLocaleTimeString()}`;
            
            this.saveToStorage();
            return item;
          }
        }
      }
    } catch (error) {
      console.error('[AdminRepository] Failed to fetch single service health:', error);
    }

    // If backend API fails, mark as "Chưa xác định" instead of fake data
    item.status = 'DOWN';
    item.statusNote = 'Chưa xác định - Backend không khả dụng';
    item.lastChecked = `Không thể kiểm tra: ${new Date().toLocaleTimeString()}`;
    item.latencyMs = 0;
    item.httpStatus = 503;

    this.saveToStorage();
    return item;
  }

  async recheckAllServices(): Promise<{ success: boolean; message: string }> {
    try {
      // Fetch real service health data from backend
      const response = await fetch('/api/v1/health/services', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.services && Array.isArray(data.services)) {
          // Update service health with real data from backend
          this.serviceHealth = data.services.map((svc: any) => ({
            ...svc,
            id: svc.id || `srv-${Date.now().toString().slice(-4)}`,
          }));
          
          this.recordAuditLog(
            'KIỂM_TRA_TOÀN_BỘ_DỊCH_VỤ',
            'ServiceHealth',
            'all-services',
            'Cụm dịch vụ Streaming & Database',
            'Thực hiện Ping Healthcheck đo đạc thực tế từ Backend',
            'Cập nhật số liệu độ trễ phản hồi đo đạc thực tế'
          );

          this.saveToStorage();
          return { success: true, message: 'Đã đồng bộ dữ liệu giám sát thực tế từ Backend.' };
        }
      }
      
      // If API returns no data or fails, mark all services as "Chưa xác định"
      this.serviceHealth = this.serviceHealth.map(svc => ({
        ...svc,
        status: 'DOWN' as const,
        statusNote: 'Chưa xác định - Backend không khả dụng',
        lastChecked: `Không thể kiểm tra: ${new Date().toLocaleTimeString()}`,
        latencyMs: 0,
        httpStatus: 503,
      }));

      this.saveToStorage();
      return { success: false, message: 'Không thể lấy dữ liệu từ Backend API.' };
    } catch (error) {
      console.error('[AdminRepository] Failed to fetch service health from backend:', error);
      
      // Mark all services as "Chưa xác định" when backend fails
      this.serviceHealth = this.serviceHealth.map(svc => ({
        ...svc,
        status: 'DOWN' as const,
        statusNote: 'Chưa xác định - Backend không khả dụng',
        lastChecked: `Không thể kiểm tra: ${new Date().toLocaleTimeString()}`,
        latencyMs: 0,
        httpStatus: 503,
      }));

      this.saveToStorage();
      return { success: false, message: 'Backend API không khả dụng. Không thể kiểm tra dịch vụ.' };
    }
  }

  updateServiceConfig(
    id: string,
    updates: Partial<AdminServiceHealthItem>
  ): { success: boolean; message: string } {
    const item = this.serviceHealth.find((s) => s.id === id);
    if (!item) return { success: false, message: 'Không tìm thấy cụm dịch vụ' };

    Object.assign(item, updates);
    item.lastChecked = `Cập nhật thông số lúc ${new Date().toLocaleTimeString()}`;

    this.recordAuditLog(
      'SỬA_THÔNG_SỐ_DỊCH_VỤ',
      'ServiceHealth',
      id,
      item.name,
      'Cập nhật tên / endpoint dịch vụ',
      `Endpoint: ${item.endpoint}`
    );

    this.saveToStorage();
    return { success: true, message: `Đã cập nhật cấu hình dịch vụ ${item.name}.` };
  }

  addMonitoredService(
    newService: Omit<AdminServiceHealthItem, 'id' | 'lastChecked'>
  ): { success: boolean; message: string; newId: string } {
    const newId = `srv-${Date.now().toString().slice(-4)}`;
    const newItem: AdminServiceHealthItem = {
      ...newService,
      id: newId,
      lastChecked: `Khởi tạo lúc ${new Date().toLocaleTimeString()}`,
    };

    this.serviceHealth.push(newItem);

    this.recordAuditLog(
      'THÊM_CỤM_DỊCH_VỤ_GIÁM_SÁT',
      'ServiceHealth',
      newId,
      newItem.name,
      `Khai báo điểm cuối: ${newItem.endpoint}`,
      `Danh mục: ${newItem.category}`
    );

    this.saveToStorage();
    return { success: true, message: `Đã thêm cụm dịch vụ giám sát mới: ${newItem.name}`, newId };
  }

  deleteMonitoredService(id: string): { success: boolean; message: string } {
    const index = this.serviceHealth.findIndex((s) => s.id === id);
    if (index === -1) return { success: false, message: 'Không tìm thấy dịch vụ để xóa' };

    const removed = this.serviceHealth[index];
    this.serviceHealth.splice(index, 1);

    this.recordAuditLog(
      'XÓA_CỤM_DỊCH_VỤ_GIÁM_SÁT',
      'ServiceHealth',
      id,
      removed.name,
      'Gỡ khỏi hệ thống giám sát',
      'Xóa điểm cuối giám sát'
    );

    this.saveToStorage();
    return { success: true, message: `Đã xóa cụm dịch vụ: ${removed.name}` };
  }

  // --- Security Alerts ---
  getSecurityAlerts(): AdminSecurityAlert[] {
    return [...this.securityAlerts];
  }

  resolveSecurityAlert(alertId: string, actionTaken: string): { success: boolean; message: string } {
    const alert = this.securityAlerts.find((a) => a.id === alertId);
    if (!alert) return { success: false, message: 'Không tìm thấy cảnh báo an ninh.' };

    alert.status = 'RESOLVED';
    alert.actionTaken = actionTaken;

    this.recordAuditLog(
      'XỬ_LÝ_CẢNH_BÁO_AN_NINH',
      'SecurityAlert',
      alert.id,
      alert.title,
      actionTaken,
      `Áp dụng biện pháp an ninh cho IP ${alert.ipAddress}`
    );

    return { success: true, message: 'Đã xử lý cảnh báo an ninh thành công.' };
  }

  markAlertFalsePositive(alertId: string, reason: string): { success: boolean; message: string } {
    const alert = this.securityAlerts.find((a) => a.id === alertId);
    if (!alert) return { success: false, message: 'Không tìm thấy cảnh báo an ninh.' };

    alert.status = 'FALSE_POSITIVE';
    alert.actionTaken = `Cảnh báo nhầm: ${reason}`;

    this.recordAuditLog(
      'ĐÁNH_DẤU_CẢNH_BÁO_NHẦM',
      'SecurityAlert',
      alert.id,
      alert.title,
      reason,
      `Gỡ cảnh báo cho IP ${alert.ipAddress}`
    );

    return { success: true, message: 'Đã đánh dấu cảnh báo nhầm.' };
  }

  // --- Feature Flags ---
  getFeatureFlags(): AdminFeatureFlag[] {
    return [...this.featureFlags];
  }

  async fetchFeatureFlagsApi(): Promise<AdminFeatureFlag[]> {
    if (getDataSourceMode() === 'API') {
      try {
        const res = await apiRequest<any[]>('/admin/feature-flags');
        if (Array.isArray(res)) {
          this.featureFlags = res.map((f: any) => ({
            key: f.key,
            name: f.name,
            description: f.descriptionVi || f.description || '',
            category: f.category || 'SYSTEM',
            isEnabled: f.isEnabled,
            isProtected: f.isLocked || f.isProtected || false,
            lastModified: f.updatedAt ? f.updatedAt.substring(0, 16) : 'Mới cập nhật',
          }));
        }
      } catch (err) {
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return this.getFeatureFlags();
  }

  toggleFeatureFlag(key: string, reason: string): { success: boolean; message: string } {
    const flag = this.featureFlags.find((f) => f.key === key);
    if (!flag) return { success: false, message: 'Không tìm thấy cờ tính năng.' };

    flag.isEnabled = !flag.isEnabled;
    flag.lastModified = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (getDataSourceMode() === 'API') {
      apiRequest(`/admin/feature-flags/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: flag.isEnabled }),
      }).catch((e) => console.error('Failed to patch feature flag:', e));
    }

    this.recordAuditLog(
      `CHUYỂN_ĐỔI_CỜ_TÍNH_NĂNG_${flag.isEnabled ? 'BẬT' : 'TẮT'}`,
      'FeatureFlag',
      flag.key,
      flag.name,
      reason,
      `Cờ ${flag.key} chuyển sang ${flag.isEnabled ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ TẮT'}`
    );

    return { success: true, message: `Đã ${flag.isEnabled ? 'bật' : 'tắt'} tính năng "${flag.name}".` };
  }

  // --- Audit Logs ---
  getAuditLogs(): AdminAuditLogEntry[] {
    return [...this.auditLogs];
  }

  async fetchAuditLogsApi(): Promise<AdminAuditLogEntry[]> {
    if (getDataSourceMode() === 'API') {
      try {
        const res = await apiRequest<{ items: any[]; pagination: any }>('/admin/audit-logs');
        if (res && Array.isArray(res.items)) {
          this.auditLogs = res.items.map((l: any) => ({
            id: l.id || l._id,
            timestamp: l.timestamp ? l.timestamp.substring(0, 19).replace('T', ' ') : new Date().toISOString(),
            performedBy: l.performedBy || l.performedByAdminId || 'OWNER_ADMIN',
            action: l.action,
            entityType: l.resource,
            entityId: l.resourceId || '',
            entityName: l.entityName || l.resource,
            reason: l.reason || '',
            impactScope: l.impactScope || '',
          }));
          console.log('[AdminRepository] Fetched audit logs:', this.auditLogs.length);
        }
      } catch (err) {
        console.error('[AdminRepository] Failed to fetch audit logs:', err);
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return this.getAuditLogs();
  }

  // --- Profanity Filter Management ---
  async getProfanityWords(): Promise<string[]> {
    if (getDataSourceMode() === 'API') {
      try {
        const res = await apiRequest<{ success: boolean; data: string[] }>('/comments/profanity-words');
        if (res && Array.isArray(res.data)) {
          return res.data;
        }
      } catch (err) {
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return [];
  }

  async addProfanityWord(word: string): Promise<{ success: boolean; message: string }> {
    if (getDataSourceMode() === 'API') {
      try {
        const res = await apiRequest<{ success: boolean; message: string }>('/comments/profanity-words', {
          method: 'POST',
          body: JSON.stringify({ word }),
        });
        return res;
      } catch (err) {
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return { success: true, message: 'Đã thêm từ ngữ lọc thành công' };
  }

  async removeProfanityWord(word: string): Promise<{ success: boolean; message: string }> {
    if (getDataSourceMode() === 'API') {
      try {
        const res = await apiRequest<{ success: boolean; message: string }>(`/comments/profanity-words/${word}`, {
          method: 'DELETE',
        });
        return res;
      } catch (err) {
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return { success: true, message: 'Đã xóa từ ngữ lọc thành công' };
  }
}

export const adminRepository = new AdminRepositoryService();
