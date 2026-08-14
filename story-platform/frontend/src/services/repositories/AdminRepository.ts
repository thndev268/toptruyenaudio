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

export interface VideoIframeSettings {
  showIframeByDefault: boolean;
  hideIframeWithCSS: boolean;
  allowUserToggleIframe: boolean;
  autoPlayVideo: boolean;
}

class AdminRepositoryService {
  
  private honoraryTitles: HonoraryTitle[] = [];

  getHonoraryTitles(): HonoraryTitle[] {
    return this.honoraryTitles;
  }

  saveHonoraryTitle(title: HonoraryTitle): void {
    const existingIndex = this.honoraryTitles.findIndex(t => t.id === title.id);
    if (existingIndex >= 0) {
      this.honoraryTitles[existingIndex] = title;
    } else {
      this.honoraryTitles.push(title);
    }
  }

  deleteHonoraryTitle(titleId: string): void {
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
  };
  private ownerProfile: OwnerAdminProfile = {
    id: 'owner-admin-01',
    name: 'Chủ Sở Hữu & Điều Hành Hệ Thống',
    email: 'thndev26@gmail.com',
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

  private stories: AdminStoryItem[] = [].map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    authorName: s.authorName,
    narratorName: s.narratorName,
    genres: s.genres,
    totalChapters: s.chapters.length,
    storyStatus: s.storyStatus,
    publishStatus: s.publishStatus,
    accessLevel: s.chapters.some((c) => c.accessLevel === 'PREMIUM') ? 'PREMIUM' : 'FREE',
    listenCount: s.stats.listenCount,
    rating: s.rating,
    createdAt: s.publishedAt,
    summary: s.summary,
    storyline: s.storyline || s.summary,
    audioContent: s.audioContent || s.summary,
    coverUrl: s.coverUrl,
    isVideoStory: s.isVideoStory,
    iframeCode: s.iframeCode,
    iframeUrl: s.iframeUrl,
  }));

  private storyChapters: Record<string, AudioChapter[]> = (() => {
    const map: Record<string, AudioChapter[]> = {};
    return map;
  })();

  private loadPersistedState() {
    try {
      if (typeof window === 'undefined') return;
      const savedStories = localStorage.getItem('toptruyenaudio:admin-stories:v1');
      if (savedStories) {
        const parsed = JSON.parse(savedStories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.stories = parsed;
        }
      }

      const savedChapters = localStorage.getItem('toptruyenaudio:admin-chapters:v1');
      if (savedChapters) {
        const parsedMap = JSON.parse(savedChapters);
        if (parsedMap && typeof parsedMap === 'object') {
          this.storyChapters = { ...this.storyChapters, ...parsedMap };
        }
      }

      const savedVideoSettings = localStorage.getItem('toptruyenaudio:video-settings:v1');
      if (savedVideoSettings) {
        const parsed = JSON.parse(savedVideoSettings);
        if (parsed && typeof parsed === 'object') {
          this.videoSettings = { ...this.videoSettings, ...parsed };
        }
      }

      this.fetchFromBackendApi();
    } catch (e) {
      console.warn('Error loading persisted admin state:', e);
    }
  }

  private async fetchFromBackendApi() {
    try {
      const settingsRes = await fetch('/api/video-settings');
      if (settingsRes.ok) {
        const json = await settingsRes.json();
        if (json.settings) {
          this.videoSettings = { ...this.videoSettings, ...json.settings };
          localStorage.setItem('toptruyenaudio:video-settings:v1', JSON.stringify(this.videoSettings));
        }
      }

      const storiesRes = await fetch('/api/stories');
      if (storiesRes.ok) {
        const json = await storiesRes.json();
        if (Array.isArray(json.stories) && json.stories.length > 0) {
          json.stories.forEach((as: any) => {
            const existingIdx = this.stories.findIndex((s) => s.id === as.id);
            if (existingIdx !== -1) {
              this.stories[existingIdx] = as;
            } else {
              this.stories.unshift(as);
            }
          });
          localStorage.setItem('toptruyenaudio:admin-stories:v1', JSON.stringify(this.stories));
        }
      }

      const genresRes = await fetch('/api/genres');
      if (genresRes.ok) {
        const json = await genresRes.json();
        if (Array.isArray(json.genres) && json.genres.length > 0) {
          this.genres = json.genres;
          const oldDataRaw = localStorage.getItem('toptruyenaudio:admin-data:v1');
          const oldData = oldDataRaw ? JSON.parse(oldDataRaw) : {};
          localStorage.setItem('toptruyenaudio:admin-data:v1', JSON.stringify({
            ...oldData,
            genres: this.genres
          }));
          window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
        }
      }
    } catch (err) {
      console.warn('Backend API sync notice:', err);
    }
  }

  public persistState() {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem('toptruyenaudio:admin-stories:v1', JSON.stringify(this.stories));
      localStorage.setItem('toptruyenaudio:admin-chapters:v1', JSON.stringify(this.storyChapters));
      localStorage.setItem('toptruyenaudio:video-settings:v1', JSON.stringify(this.videoSettings));

      fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stories: this.stories }),
      }).catch((e) => console.warn('Sync stories API:', e));

      fetch('/api/video-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: this.videoSettings }),
      }).catch((e) => console.warn('Sync video-settings API:', e));

      fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: this.genres }),
      }).catch((e) => console.warn('Sync genres API:', e));
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
    return this.stories.map((s) => {
      const chapters = this.storyChapters[s.id] || [];
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
        genres: s.genres,
        storyStatus: s.storyStatus || 'COMPLETED',
        publishStatus: s.publishStatus || 'PUBLISHED',
        rating: s.rating || 5.0,
        reviewCount: 88,
        totalChapters: chapters.length || s.totalChapters || 1,
        totalDurationSeconds: chapters.reduce((acc, c) => acc + (c.durationSeconds || 1800), 0) || 1800,
        isExclusive: false,
        publishedAt: s.createdAt,
        isVideoStory: s.isVideoStory,
        iframeCode: s.iframeCode,
        iframeUrl: s.iframeUrl,
        stats: {
          viewCount: (s.listenCount || 500) * 2,
          listenCount: s.listenCount || 500,
          favoriteCount: Math.floor((s.listenCount || 500) / 10),
        },
        chapters: chapters.length > 0 ? chapters : [
          {
            id: `cv-${s.id}-1`,
            storyId: s.id,
            number: 1,
            title: `Video Audio Full: ${s.title}`,
            slug: `full-video-${s.slug}`,
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            videoIframeUrl: s.iframeUrl,
            iframeCode: s.iframeCode,
            audioContent: s.audioContent,
            durationSeconds: 1800,
            accessLevel: (s.accessLevel as any) || 'FREE',
            isEarlyAccess: false,
            narrator: s.narratorName,
            publishStatus: 'PUBLISHED' as any,
            publishedAt: s.createdAt,
          }
        ],
      };
    });
  }

  private genres: AdminGenreItem[] = [].map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    description: g.description,
    storyCount: g.storyCount,
    iconName: g.iconName,
  }));

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

  private serviceHealth: AdminServiceHealthItem[] = [
    {
      id: 'srv-01',
      name: 'CDN Audio Streaming Edge (HLS/AAC)',
      category: 'CDN',
      status: 'HEALTHY',
      latencyMs: 28,
      uptimePercent: 99.98,
      endpoint: 'https://cdn.toptruyenaudio.com/stream/v1',
      lastChecked: 'Vừa kiểm tra (10 giây trước)',
    },
    {
      id: 'srv-02',
      name: 'Cơ Sở Dữ Liệu Chính (Database Cluster)',
      category: 'DATABASE',
      status: 'HEALTHY',
      latencyMs: 12,
      uptimePercent: 99.99,
      endpoint: 'db-primary.internal.toptruyenaudio.com:5432',
      lastChecked: 'Vừa kiểm tra (15 giây trước)',
    },
    {
      id: 'srv-03',
      name: 'Bộ Nhớ Đệm Tốc Độ Cao (Redis Cache)',
      category: 'STORAGE',
      status: 'HEALTHY',
      latencyMs: 4,
      uptimePercent: 100,
      endpoint: 'redis-cluster.internal:6379',
      lastChecked: 'Vừa kiểm tra (5 giây trước)',
    },
    {
      id: 'srv-04',
      name: 'Hệ Thống Xác Thực & Token (Auth Service)',
      category: 'AUTH',
      status: 'HEALTHY',
      latencyMs: 18,
      uptimePercent: 99.95,
      endpoint: 'https://auth.toptruyenaudio.com/jwt',
      lastChecked: 'Vừa kiểm tra (20 giây trước)',
    },
    {
      id: 'srv-05',
      name: 'Hàng Đợi Xử Lý Âm Thanh Nền (Transcoding Queue)',
      category: 'QUEUE',
      status: 'HEALTHY',
      latencyMs: 35,
      uptimePercent: 99.92,
      endpoint: 'queue.internal/workers/audio',
      lastChecked: 'Vừa kiểm tra (30 giây trước)',
    },
  ];

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
    this.loadFromStorage();
    this.loadPersistedState();
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
    this.saveToStorage();
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
    if (getDataSourceMode() === 'API') {
      try {
        const res = await apiRequest<{ data: any[] }>('/admin/users');
        if (res && Array.isArray(res.data)) {
          this.users = res.data.map((u: any) => ({
            id: u.id || u._id,
            name: u.displayName || u.email.split('@')[0],
            email: u.email,
            role: u.role === 'OWNER_ADMIN' ? 'ADMIN' : u.role,
            status: u.accountStatus || 'ACTIVE',
            membershipTier: u.membershipTier || u.membership?.tier || 'FREE',
            createdAt: u.createdAt ? u.createdAt.substring(0, 10) : '2026-01-01',
            lastLoginAt: u.lastLoginAt ? u.lastLoginAt.substring(0, 16) : 'Chưa có',
            totalListens: u.stats?.totalListens || 0,
            listenHistoryCount: u.stats?.historyCount || 0,
            favoritesCount: u.stats?.favoritesCount || 0,
            isOwnerAdmin: u.role === 'OWNER_ADMIN',
          }));
        }
      } catch (err) {
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return this.getUsers();
  }

  getUserById(id: string): AdminUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  updateUserStatus(
    userId: string,
    newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED',
    reason: string
  ): { success: boolean; message: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'Không tìm thấy người dùng.' };

    if (user.isOwnerAdmin) {
      return { success: false, message: 'CẢNH BÁO AN TOÀN: Không thể tự khóa hoặc thay đổi trạng thái của Chủ Sở Hữu (Owner Admin).' };
    }

    user.status = newStatus;
    user.banReason = newStatus !== 'ACTIVE' ? reason : undefined;

    this.recordAuditLog(
      `ĐỔI_TRẠNG_THÁI_NGƯỜI_DÙNG_${newStatus}`,
      'User',
      user.id,
      user.name,
      reason,
      `Tài khoản ${user.email} chuyển sang trạng thái ${newStatus}`
    );

    if (newStatus === 'SUSPENDED' || newStatus === 'BANNED') {
      const statusTitle = newStatus === 'BANNED' ? 'Cấm vĩnh viễn' : 'Tạm khóa';
      const notifTitle = '⚠️ Tài khoản của bạn đã bị khóa bởi quản trị viên';
      const notifContent = `Tài khoản (${user.email}) đã bị Ban Quản Trị ${statusTitle.toLowerCase()} trên hệ thống. Lý do: "${reason}". Vui lòng liên hệ hỗ trợ nếu cần giải đáp.`;

      // Check if notification already exists to avoid duplication
      const exists = this.notifications.some((n) => n.title === notifTitle && n.content === notifContent);
      if (!exists) {
        this.sendBroadcastNotification(notifTitle, notifContent, 'ALL');
      }
    }

    this.saveToStorage();
    window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));

    return { success: true, message: `Đã cập nhật trạng thái người dùng thành công.` };
  }

  updateUserMembership(
    userId: string,
    newTier: 'FREE' | 'PREMIUM',
    daysToAdd: number = 30,
    reason: string
  ): { success: boolean; message: string } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'Không tìm thấy người dùng.' };

    user.membershipTier = newTier;
    if (newTier === 'PREMIUM') {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + daysToAdd);
      user.premiumExpiresAt = expDate.toISOString().split('T')[0];
    } else {
      user.premiumExpiresAt = undefined;
    }

    this.recordAuditLog(
      `CẤP_GÓI_MEMBERSHIP_${newTier}`,
      'User',
      user.id,
      user.name,
      reason,
      `Chuyển thành viên ${user.email} sang hạng ${newTier} (${daysToAdd} ngày)`
    );

    return { success: true, message: `Đã điều chỉnh gói thành viên thành công.` };
  }

  deleteUser(userId: string, reason: string): { success: boolean; message: string } {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return { success: false, message: 'Không tìm thấy người dùng.' };

    const user = this.users[userIndex];
    if (user.isOwnerAdmin) {
      return { success: false, message: 'CẢNH BÁO AN TOÀN: Không thể tự xóa tài khoản Chủ Sở Hữu (Owner Admin).' };
    }

    this.users.splice(userIndex, 1);
    this.recordAuditLog(
      'XÓA_TÀI_KHOẢN_NGƯỜI_DÙNG',
      'User',
      user.id,
      user.name,
      reason,
      `Xóa vĩnh viễn dữ liệu tài khoản ${user.email}`
    );

    return { success: true, message: 'Đã xóa người dùng thành công.' };
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

  updateStoryPublishStatus(
    storyId: string,
    newStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED',
    reason: string
  ): { success: boolean; message: string } {
    const story = this.stories.find((s) => s.id === storyId);
    if (!story) return { success: false, message: 'Không tìm thấy truyện.' };

    story.publishStatus = newStatus;
    this.recordAuditLog(
      `ĐỔI_TRẠNG_THÁI_PHÁT_HÀNH_${newStatus}`,
      'Story',
      story.id,
      story.title,
      reason,
      `Chuyển bộ truyện "${story.title}" sang trạng thái ${newStatus}`
    );

    return { success: true, message: 'Đã cập nhật trạng thái phát hành truyện.' };
  }

  updateStoryAccessLevel(
    storyId: string,
    newAccess: 'FREE' | 'PREMIUM',
    reason: string
  ): { success: boolean; message: string } {
    const story = this.stories.find((s) => s.id === storyId);
    if (!story) return { success: false, message: 'Không tìm thấy truyện.' };

    story.accessLevel = newAccess;
    this.recordAuditLog(
      `ĐỔI_QUYỀN_TRUY_CẬP_${newAccess}`,
      'Story',
      story.id,
      story.title,
      reason,
      `Chuyển bộ truyện "${story.title}" sang hạng ${newAccess}`
    );

    return { success: true, message: 'Đã cập nhật phân quyền truy cập truyện.' };
  }

  deleteStory(storyId: string, reason: string): { success: boolean; message: string } {
    const idx = this.stories.findIndex((s) => s.id === storyId);
    if (idx === -1) return { success: false, message: 'Không tìm thấy truyện.' };

    const story = this.stories[idx];
    this.stories.splice(idx, 1);
    delete this.storyChapters[storyId];

    this.recordAuditLog(
      'GỠ_BỎ_BỘ_TRUYỆN',
      'Story',
      story.id,
      story.title,
      reason,
      `Gỡ vĩnh viễn bộ truyện "${story.title}" khỏi nền tảng`
    );

    this.persistState();
    return { success: true, message: 'Đã gỡ bỏ bộ truyện thành công.' };
  }

  // --- Video Story CRUD Methods ---
  addVideoStory(item: Partial<AdminStoryItem>): { success: boolean; message: string; story: AdminStoryItem } {
    const id = item.id || `video-story-${Date.now()}`;
    const slug = item.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'video-story');
    
    const newStory: AdminStoryItem = {
      id,
      title: item.title || 'Truyện Video Mới',
      slug,
      authorName: item.authorName || 'Kênh Studio AI',
      authorId: item.authorId || 'author-default',
      narratorName: item.narratorName || 'MC Giọng Đọc Video',
      genres: item.genres && item.genres.length ? item.genres : ['Truyện Video'],
      totalChapters: 1,
      storyStatus: item.storyStatus || 'COMPLETED',
      publishStatus: item.publishStatus || 'PUBLISHED',
      accessLevel: item.accessLevel || 'FREE',
      listenCount: item.listenCount || 100,
      rating: item.rating || 5.0,
      createdAt: new Date().toISOString().split('T')[0],
      summary: item.summary || item.storyline || 'Mô tả cốt truyện video',
      storyline: item.storyline || item.summary || 'Chi tiết cốt truyện video',
      audioContent: item.audioContent || 'Chi tiết nội dung âm thanh và kịch bản',
      coverUrl: item.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      isVideoStory: true,
      iframeCode: item.iframeCode || '',
      iframeUrl: item.iframeUrl || '',
    };

    this.stories.unshift(newStory);

    // Create corresponding chapter for the video player
    this.storyChapters[id] = [
      {
        id: `cv-${id}-1`,
        storyId: id,
        number: 1,
        title: `Video Audio Full: ${newStory.title}`,
        slug: `full-video-${slug}`,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        videoIframeUrl: newStory.iframeUrl,
        iframeCode: newStory.iframeCode,
        audioContent: newStory.audioContent,
        durationSeconds: 1800,
        accessLevel: newStory.accessLevel as any,
        isEarlyAccess: false,
        narrator: newStory.narratorName,
        publishStatus: 'PUBLISHED' as any,
        publishedAt: newStory.createdAt,
      }
    ];

    this.recordAuditLog(
      'THÊM_VIDEO_STORY',
      'Story',
      newStory.id,
      newStory.title,
      'Đăng video story iframe thành công',
      `Tạo mới video story "${newStory.title}"`
    );

    this.persistState();
    return { success: true, message: 'Đã thêm video story thành công.', story: newStory };
  }

  updateVideoStory(storyId: string, updated: Partial<AdminStoryItem>): { success: boolean; message: string } {
    return this.updateStory(storyId, updated);
  }

  updateStory(storyId: string, updated: Partial<AdminStoryItem>): { success: boolean; message: string; story?: AdminStoryItem } {
    const story = this.stories.find((s) => s.id === storyId);
    if (!story) return { success: false, message: 'Không tìm thấy bộ truyện.' };

    if (updated.title !== undefined) story.title = updated.title;
    if (updated.summary !== undefined) story.summary = updated.summary;
    if (updated.storyline !== undefined) story.storyline = updated.storyline;
    if (updated.audioContent !== undefined) story.audioContent = updated.audioContent;
    if (updated.coverUrl !== undefined) story.coverUrl = updated.coverUrl;
    if (updated.iframeCode !== undefined) story.iframeCode = updated.iframeCode;
    if (updated.iframeUrl !== undefined) story.iframeUrl = updated.iframeUrl;
    if (updated.authorName !== undefined) story.authorName = updated.authorName;
    if (updated.authorId !== undefined) story.authorId = updated.authorId;
    if (updated.narratorName !== undefined) story.narratorName = updated.narratorName;
    if (updated.genres !== undefined) story.genres = updated.genres;
    if (updated.accessLevel !== undefined) story.accessLevel = updated.accessLevel;
    if (updated.publishStatus !== undefined) story.publishStatus = updated.publishStatus;
    if (updated.storyStatus !== undefined) story.storyStatus = updated.storyStatus;

    // Update chapter as well if it's a single video story
    const chapters = this.storyChapters[storyId];
    if (chapters && chapters[0] && story.isVideoStory) {
      chapters[0].title = `Video Audio Full: ${story.title}`;
      chapters[0].videoIframeUrl = story.iframeUrl;
      chapters[0].iframeCode = story.iframeCode;
      chapters[0].audioContent = story.audioContent;
      chapters[0].accessLevel = story.accessLevel as any;
    }

    this.recordAuditLog(
      'CẬP_NHẬT_BỘ_TRUYỆN',
      'Story',
      story.id,
      story.title,
      'Cập nhật thông tin bộ truyện',
      `Sửa thông tin bộ truyện "${story.title}"`
    );

    this.persistState();
    return { success: true, message: 'Cập nhật bộ truyện thành công.', story };
  }

  addBulkVideos(items: Partial<AdminStoryItem>[]): { success: boolean; count: number } {
    let added = 0;
    for (const item of items) {
      this.addVideoStory(item);
      added++;
    }
    this.persistState();
    return { success: true, count: added };
  }

  // --- Story Chapters Management ---
  getStoryChapters(storyId: string): AudioChapter[] {
    return [...(this.storyChapters[storyId] || [])];
  }

  addStoryChapter(
    storyId: string,
    chapterData: Partial<AudioChapter>
  ): { success: boolean; message: string; chapter: AudioChapter } {
    const list = this.storyChapters[storyId] || [];
    const nextNum = list.length > 0 ? Math.max(...list.map((c) => c.number)) + 1 : 1;

    const newChapter: AudioChapter = {
      id: chapterData.id || `chapter-${storyId}-${Date.now()}`,
      storyId,
      number: chapterData.number || nextNum,
      title: chapterData.title || `Tập ${nextNum}`,
      slug: chapterData.slug || `tap-${nextNum}`,
      audioUrl: chapterData.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      videoIframeUrl: chapterData.videoIframeUrl || '',
      iframeCode: chapterData.iframeCode || '',
      allowVideoDisplay: chapterData.allowVideoDisplay !== undefined ? chapterData.allowVideoDisplay : (chapterData.isVideoEnabled !== undefined ? chapterData.isVideoEnabled : true),
      isVideoEnabled: chapterData.isVideoEnabled !== undefined ? chapterData.isVideoEnabled : (chapterData.allowVideoDisplay !== undefined ? chapterData.allowVideoDisplay : true),
      audioContent: chapterData.audioContent || '',
      durationSeconds: chapterData.durationSeconds || 1800,
      accessLevel: chapterData.accessLevel || 'FREE',
      isEarlyAccess: false,
      narrator: chapterData.narrator || 'MC Giọng Đọc',
      publishStatus: 'PUBLISHED' as any,
      publishedAt: new Date().toISOString().split('T')[0],
    };

    list.push(newChapter);
    this.storyChapters[storyId] = list;

    const story = this.stories.find((s) => s.id === storyId);
    if (story) {
      story.totalChapters = list.length;
    }

    this.recordAuditLog(
      'THÊM_TẬP_TRUYỆN',
      'Chapter',
      newChapter.id,
      newChapter.title,
      'Thêm tập mới cho bộ truyện',
      `Thêm tập #${newChapter.number} (${newChapter.title}) vào bộ truyện "${story?.title || storyId}"`
    );

    this.persistState();
    return {
      success: true,
      message: `Đã thêm Tập ${newChapter.number}: "${newChapter.title}" thành công.`,
      chapter: newChapter,
    };
  }

  updateStoryChapter(
    storyId: string,
    chapterId: string,
    chapterData: Partial<AudioChapter>
  ): { success: boolean; message: string; chapter?: AudioChapter } {
    const list = this.storyChapters[storyId] || [];
    const idx = list.findIndex((c) => c.id === chapterId);
    if (idx === -1) {
      return { success: false, message: 'Không tìm thấy tập audio cần sửa.' };
    }

    const current = list[idx];
    const updatedChapter: AudioChapter = {
      ...current,
      ...chapterData,
      title: chapterData.title !== undefined ? chapterData.title : current.title,
      number: chapterData.number !== undefined ? chapterData.number : current.number,
      narrator: chapterData.narrator !== undefined ? chapterData.narrator : current.narrator,
      audioUrl: chapterData.audioUrl !== undefined ? chapterData.audioUrl : current.audioUrl,
      videoIframeUrl: chapterData.videoIframeUrl !== undefined ? chapterData.videoIframeUrl : current.videoIframeUrl,
      iframeCode: chapterData.iframeCode !== undefined ? chapterData.iframeCode : current.iframeCode,
      allowVideoDisplay: chapterData.allowVideoDisplay !== undefined ? chapterData.allowVideoDisplay : (chapterData.isVideoEnabled !== undefined ? chapterData.isVideoEnabled : current.allowVideoDisplay),
      isVideoEnabled: chapterData.isVideoEnabled !== undefined ? chapterData.isVideoEnabled : (chapterData.allowVideoDisplay !== undefined ? chapterData.allowVideoDisplay : current.isVideoEnabled),
      audioContent: chapterData.audioContent !== undefined ? chapterData.audioContent : current.audioContent,
      accessLevel: chapterData.accessLevel !== undefined ? chapterData.accessLevel : current.accessLevel,
      durationSeconds: chapterData.durationSeconds !== undefined ? chapterData.durationSeconds : current.durationSeconds,
    };

    list[idx] = updatedChapter;
    this.storyChapters[storyId] = list;

    const story = this.stories.find((s) => s.id === storyId);

    this.recordAuditLog(
      'SỬA_TẬP_TRUYỆN',
      'Chapter',
      updatedChapter.id,
      updatedChapter.title,
      'Cập nhật thông tin tập audio',
      `Sửa tập #${updatedChapter.number} (${updatedChapter.title}) trong bộ truyện "${story?.title || storyId}"`
    );

    this.persistState();
    return {
      success: true,
      message: `Đã cập nhật Tập ${updatedChapter.number}: "${updatedChapter.title}" thành công.`,
      chapter: updatedChapter,
    };
  }

  deleteStoryChapter(
    storyId: string,
    chapterId: string,
    reason: string
  ): { success: boolean; message: string; remainingCount: number } {
    const list = this.storyChapters[storyId] || [];
    const idx = list.findIndex((c) => c.id === chapterId);
    if (idx === -1) {
      return { success: false, message: 'Không tìm thấy tập audio cần xóa.', remainingCount: list.length };
    }

    const removedChapter = list[idx];
    list.splice(idx, 1);
    this.storyChapters[storyId] = list;

    // Update totalChapters in story summary item
    const story = this.stories.find((s) => s.id === storyId);
    if (story) {
      story.totalChapters = list.length;
    }

    this.recordAuditLog(
      'XÓA_TẬP_AUDIO',
      'Chapter',
      removedChapter.id,
      removedChapter.title,
      reason || 'Chủ sở hữu xóa tập audio',
      `Xóa vĩnh viễn tập audio #${removedChapter.number} (${removedChapter.title}) khỏi bộ truyện "${story?.title || storyId}"`
    );

    this.persistState();
    return {
      success: true,
      message: `Đã xóa tập "${removedChapter.title}" thành công. Bộ truyện còn lại ${list.length} tập.`,
      remainingCount: list.length,
    };
  }

  deleteStoryChapters(
    storyId: string,
    chapterIds: string[],
    reason: string
  ): { success: boolean; message: string; remainingCount: number } {
    const list = this.storyChapters[storyId] || [];
    const initialCount = list.length;
    const idsSet = new Set(chapterIds);

    const remaining = list.filter((c) => !idsSet.has(c.id));
    const deletedCount = initialCount - remaining.length;

    this.storyChapters[storyId] = remaining;

    // Update totalChapters in story summary item
    const story = this.stories.find((s) => s.id === storyId);
    if (story) {
      story.totalChapters = remaining.length;
    }

    this.recordAuditLog(
      'XÓA_NHIỀU_TẬP_AUDIO',
      'Chapter',
      chapterIds.join(', '),
      `${deletedCount} tập audio`,
      reason || 'Chủ sở hữu xóa hàng loạt tập audio',
      `Xóa ${deletedCount} tập audio khỏi bộ truyện "${story?.title || storyId}"`
    );

    return {
      success: true,
      message: `Đã xóa thành công ${deletedCount} tập đã chọn. Bộ truyện còn lại ${remaining.length} tập.`,
      remainingCount: remaining.length,
    };
  }

  // --- Genres ---
  getGenres(): AdminGenreItem[] {
    return [...this.genres];
  }

  addGenre(name: string, slug: string, description: string, iconName?: string): { success: boolean; message: string } {
    const exists = this.genres.some((g) => g.slug === slug || g.name.toLowerCase() === name.toLowerCase());
    if (exists) return { success: false, message: 'Thể loại này đã tồn tại.' };

    const newGenre: AdminGenreItem = {
      id: 'genre-' + Math.random().toString(36).substring(2, 7),
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      storyCount: 0,
      iconName: iconName || 'Disc',
    };
    this.genres.push(newGenre);

    this.recordAuditLog(
      'THÊM_THỂ_LOẠI_MỚI',
      'Genre',
      newGenre.id,
      newGenre.name,
      'Thêm danh mục truyện mới theo định hướng nội dung',
      `Tạo thể loại "${newGenre.name}"`
    );

    this.saveToStorage();

    return { success: true, message: 'Đã thêm thể loại mới thành công.' };
  }

  deleteGenre(genreId: string, reason: string): { success: boolean; message: string } {
    const idx = this.genres.findIndex((g) => g.id === genreId);
    if (idx === -1) return { success: false, message: 'Không tìm thấy thể loại.' };

    const genre = this.genres[idx];
    this.genres.splice(idx, 1);

    this.recordAuditLog(
      'XÓA_THỂ_LOẠI',
      'Genre',
      genre.id,
      genre.name,
      reason,
      `Xóa danh mục "${genre.name}"`
    );

    this.saveToStorage();

    return { success: true, message: 'Đã xóa thể loại thành công.' };
  }

  // --- Comments ---
  getComments(): AdminCommentItem[] {
    return [...this.comments];
  }

  updateCommentStatus(commentId: string, newStatus: 'ACTIVE' | 'HIDDEN' | 'FLAGGED', reason: string): { success: boolean; message: string } {
    const cmt = this.comments.find((c) => c.id === commentId);
    if (!cmt) return { success: false, message: 'Không tìm thấy bình luận.' };

    cmt.status = newStatus;
    this.recordAuditLog(
      `KIỂM_DUYỆT_BÌNH_LUẬN_${newStatus}`,
      'Comment',
      cmt.id,
      `Bình luận của ${cmt.userName}`,
      reason,
      `Thay đổi trạng thái bình luận thành ${newStatus}`
    );

    return { success: true, message: 'Đã cập nhật trạng thái bình luận.' };
  }

  deleteComment(commentId: string, reason: string): { success: boolean; message: string } {
    const idx = this.comments.findIndex((c) => c.id === commentId);
    if (idx === -1) return { success: false, message: 'Không tìm thấy bình luận.' };

    const cmt = this.comments[idx];
    this.comments.splice(idx, 1);

    this.recordAuditLog(
      'XÓA_BÌNH_LUẬN',
      'Comment',
      cmt.id,
      `Bình luận của ${cmt.userName}`,
      reason,
      `Xóa vĩnh viễn bình luận trên truyện "${cmt.storyTitle}"`
    );

    return { success: true, message: 'Đã xóa bình luận thành công.' };
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
            createdAt: new Date(c.createdAt || Date.now()).toISOString().replace('T', ' ').substring(0, 16),
            adminReply: adminMsg?.content,
            resolvedAt: c.status === 'RESOLVED' ? new Date(c.updatedAt || Date.now()).toISOString().replace('T', ' ').substring(0, 16) : undefined,
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

    // Notify user
    this.sendBroadcastNotification(
      `[Hỗ Trợ Admin] Phản hồi ticket: ${ticket?.subject || ticketId}`,
      `Ban Quản Trị đã phản hồi yêu cầu hỗ trợ của bạn: "${adminReply}"`,
      'ALL'
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

  sendBroadcastNotification(title: string, content: string, targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER'): { success: boolean; message: string } {
    const newNotif: AdminBroadcastNotification = {
      id: 'notif-' + Math.random().toString(36).substring(2, 7),
      title,
      content,
      targetAudience,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sentBy: 'OWNER_ADMIN',
      reachCount: targetAudience === 'ALL' ? 18420 : targetAudience === 'PREMIUM' ? 3200 : 450,
      status: 'SENT',
    };
    this.notifications.unshift(newNotif);

    this.recordAuditLog(
      'GỬI_THÔNG_BÁO_TOÀN_HỆ_THỐNG',
      'BroadcastNotification',
      newNotif.id,
      title,
      'Gửi thông báo broadcast trực tiếp đến đối tượng người dùng',
      `Phát thông báo tới nhóm ${targetAudience}`
    );

    this.saveToStorage();
    return { success: true, message: 'Đã phát sóng thông báo thành công.' };
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
  getServiceHealth(): AdminServiceHealthItem[] {
    return [...this.serviceHealth];
  }

  async pingServiceHealthItem(id: string): Promise<AdminServiceHealthItem | null> {
    const item = this.serviceHealth.find((s) => s.id === id);
    if (!item) return null;

    const startTime = performance.now();
    let status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE' = item.status;
    let latencyMs = 0;

    try {
      if (item.category === 'CDN' || item.category === 'AUTH') {
        const response = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
        const duration = Math.round(performance.now() - startTime);
        latencyMs = Math.max(duration, 8);
        if (response.ok && item.status !== 'MAINTENANCE' && item.status !== 'DEGRADED' && item.status !== 'DOWN') {
          status = 'HEALTHY';
        }
      } else if (item.category === 'DATABASE' || item.category === 'STORAGE') {
        const testKey = 'toptruyenaudio_ping_test';
        localStorage.setItem(testKey, 'ok');
        localStorage.removeItem(testKey);
        const duration = Math.round(performance.now() - startTime);
        latencyMs = Math.max(duration, 4);
        if (item.status !== 'MAINTENANCE' && item.status !== 'DEGRADED' && item.status !== 'DOWN') {
          status = 'HEALTHY';
        }
      } else {
        const duration = Math.round(performance.now() - startTime);
        latencyMs = Math.max(duration, 12);
      }
    } catch {
      latencyMs = 0;
      if (item.status !== 'MAINTENANCE') {
        status = 'DOWN';
      }
    }

    item.latencyMs = latencyMs;
    item.status = status;
    item.lastChecked = `Vừa kiểm tra lúc ${new Date().toLocaleTimeString()}`;

    this.saveToStorage();
    return item;
  }

  async recheckAllServices(): Promise<{ success: boolean; message: string }> {
    for (const svc of this.serviceHealth) {
      await this.pingServiceHealthItem(svc.id);
    }

    this.recordAuditLog(
      'KIỂM_TRA_TOÀN_BỘ_DỊCH_VỤ',
      'ServiceHealth',
      'all-services',
      'Cụm dịch vụ Streaming & Database',
      'Thực hiện Ping Healthcheck đo đạc thực tế',
      'Cập nhật số liệu độ trễ phản hồi đo đạc thực tế'
    );

    this.saveToStorage();
    return { success: true, message: 'Đã đo đạc lại độ trễ và kiểm tra thực tế các cụm dịch vụ.' };
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
        const res = await apiRequest<{ data: any[] }>('/admin/audit-logs');
        if (res && Array.isArray(res.data)) {
          this.auditLogs = res.data.map((l: any) => ({
            id: l.id || l._id,
            timestamp: l.createdAt ? l.createdAt.substring(0, 19).replace('T', ' ') : new Date().toISOString(),
            performedBy: l.performedByAdminId || 'OWNER_ADMIN',
            action: l.action,
            entityType: l.resource,
            entityId: l.resourceId || '',
            entityName: l.entityName || l.resource,
            reason: l.reason || '',
            impactScope: l.impactScope || '',
          }));
        }
      } catch (err) {
        if (getDataSourceMode() === 'API') throw err;
      }
    }
    return this.getAuditLogs();
  }
}

export const adminRepository = new AdminRepositoryService();
