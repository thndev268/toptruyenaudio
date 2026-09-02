import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { AdminPageContainer } from './AdminPageContainer';
import { AdminConfirmationModal } from '../AdminConfirmationModal';
import { adminRepository } from '../../../services/repositories/AdminRepository';
import { useUserBanNotification } from '../../../hooks/useUserBanNotification';
import {
  AdminUser,
  AdminCreatorApplication,
  AdminStoryItem,
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
  AdminFeatureFlag,
  AdminAuditLogEntry,
  DangerousActionConfirmation,
  OwnerAdminProfile,
} from '../../../types/admin';
import { AudioChapter } from '../../../types';
import { CheckCircle2 } from 'lucide-react';

export interface AdminLayoutContextType {
  users: AdminUser[];
  creators: AdminCreatorApplication[];
  stories: AdminStoryItem[];
  genres: AdminGenreItem[];
  comments: AdminCommentItem[];
  reports: AdminViolationReport[];
  copyrightClaims: AdminCopyrightClaim[];
  tickets: AdminSupportTicket[];
  notifications: AdminBroadcastNotification[];
  maintenanceConfig: AdminMaintenanceConfig;
  incidents: AdminSystemIncident[];
  serviceHealth: AdminServiceHealthItem[];
  securityAlerts: AdminSecurityAlert[];
  featureFlags: AdminFeatureFlag[];
  auditLogs: AdminAuditLogEntry[];
  subscriptions: any[];
  profile: OwnerAdminProfile;
  userCounts: { total: number; premium: number; creator: number; partner: number };
  pendingCounts: {
    creators: number;
    reports: number;
    copyright: number;
    tickets: number;
    security: number;
  };
  refreshAllData: () => void;
  showToast: (msg: string) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<DangerousActionConfirmation>>;
  // Direct Action Handlers
  handleLockUser: (user: AdminUser) => void;
  handleUnlockUser: (user: AdminUser) => void;
  handleGrantPremium: (user: AdminUser) => void;
  handleDeleteUser: (user: AdminUser) => void;
  handleApproveCreator: (app: AdminCreatorApplication) => void;
  handleRejectCreator: (app: AdminCreatorApplication) => void;
  handleUpdateStoryPublishStatus: (
    story: AdminStoryItem,
    newStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED'
  ) => void;
  handleUpdateStoryAccessLevel: (
    story: AdminStoryItem,
    newAccess: 'FREE' | 'PREMIUM'
  ) => void;
  handleDeleteStory: (story: AdminStoryItem) => void;
  handleDeleteChapter: (
    story: AdminStoryItem,
    chapterId: string,
    chapterTitle?: string
  ) => void;
  handleDeleteChapters: (
    story: AdminStoryItem,
    chapterIds: string[]
  ) => void;
  getStoryChapters: (storyId: string) => AudioChapter[];
  handleAddGenre: (name: string, slug: string, description: string) => void;
  handleDeleteGenre: (genre: AdminGenreItem) => void;
  handleHideComment: (comment: AdminCommentItem) => void;
  handleDeleteComment: (comment: AdminCommentItem) => void;
  handleResolveReport: (report: AdminViolationReport) => void;
  handleDismissReport: (report: AdminViolationReport) => void;
  handleResolveClaim: (claim: AdminCopyrightClaim) => void;
  handleDismissClaim: (claim: AdminCopyrightClaim) => void;
  handleResolveTicket: (ticket: AdminSupportTicket, reply: string) => void;
  handleSendBroadcast: (
    title: string,
    content: string,
    type: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER' | 'WARNING' | 'ERROR' | 'SUPPORT',
    targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER'
  ) => Promise<void>;
  handleDeleteBroadcast: (notification: AdminBroadcastNotification) => void;
  handleSaveMaintenanceConfig: (
    config: Partial<AdminMaintenanceConfig>,
    reason: string
  ) => void;
  handleCreateIncident: (
    title: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    affectedServices: string[],
    description: string
  ) => void;
  handleResolveIncident: (
    incident: AdminSystemIncident,
    resolutionNote: string
  ) => void;
  handleRecheckServices: () => void;
  handlePingSingleService: (id: string) => Promise<void>;
  handleUpdateServiceConfig: (id: string, updates: Partial<AdminServiceHealthItem>) => void;
  handleAddMonitoredService: (
    newService: Omit<AdminServiceHealthItem, 'id' | 'lastChecked'>
  ) => void;
  handleDeleteMonitoredService: (id: string) => void;
  handleResolveSecurityAlert: (alert: AdminSecurityAlert) => void;
  handleMarkFalsePositiveAlert: (alert: AdminSecurityAlert) => void;
  handleToggleFeatureFlag: (flag: AdminFeatureFlag) => void;
}

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Reactive state from repository
  const [users, setUsers] = useState<AdminUser[]>(() => adminRepository.getUsers());
  const [creators, setCreators] = useState<AdminCreatorApplication[]>(() =>
    adminRepository.getCreatorApplications()
  );
  const [subscriptions, setSubscriptions] = useState(() =>
    adminRepository.getSubscriptions()
  );
  const [stories, setStories] = useState<AdminStoryItem[]>(() =>
    adminRepository.getStories()
  );
  const [genres, setGenres] = useState<AdminGenreItem[]>(() =>
    adminRepository.getGenres()
  );
  const [comments, setComments] = useState<AdminCommentItem[]>(() =>
    adminRepository.getComments()
  );
  const [reports, setReports] = useState<AdminViolationReport[]>(() =>
    adminRepository.getReports()
  );
  const [copyrightClaims, setCopyrightClaims] = useState<AdminCopyrightClaim[]>(() =>
    adminRepository.getCopyrightClaims()
  );
  const [tickets, setTickets] = useState<AdminSupportTicket[]>(() =>
    adminRepository.getTickets()
  );
  const [notifications, setNotifications] = useState<AdminBroadcastNotification[]>(
    () => adminRepository.getNotifications()
  );
  const [maintenanceConfig, setMaintenanceConfig] = useState<AdminMaintenanceConfig>(
    () => adminRepository.getMaintenanceConfig()
  );
  const [incidents, setIncidents] = useState<AdminSystemIncident[]>(() =>
    adminRepository.getIncidents()
  );
  const [serviceHealth, setServiceHealth] = useState<AdminServiceHealthItem[]>(() =>
    adminRepository.getServiceHealth()
  );
  const [securityAlerts, setSecurityAlerts] = useState<AdminSecurityAlert[]>(() =>
    adminRepository.getSecurityAlerts()
  );
  const [featureFlags, setFeatureFlags] = useState<AdminFeatureFlag[]>(() =>
    adminRepository.getFeatureFlags()
  );
  const [auditLogs, setAuditLogs] = useState(() => adminRepository.getAuditLogs());
  const [userCounts, setUserCounts] = useState<{ total: number; premium: number; creator: number; partner: number }>(() => adminRepository.getCachedUserCounts());
  const profile = adminRepository.getOwnerProfile();

  // Global modals and feedbacks
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<DangerousActionConfirmation>({
    isOpen: false,
    title: '',
    description: '',
    impactScope: '',
    confirmLabel: 'Xác Nhận',
    onConfirm: () => {},
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch user counts on mount
  useEffect(() => {
    const fetchInitialUserCounts = async () => {
      try {
        const counts = await adminRepository.getUserCounts();
        setUserCounts(counts);
      } catch (err) {
        console.error('Failed to fetch initial user counts:', err);
      }
    };
    fetchInitialUserCounts();
  }, []);

  const refreshAllData = async () => {
    try {
      const [u, f, a, p, c, uc] = await Promise.all([
        adminRepository.fetchUsersApi(),
        adminRepository.fetchFeatureFlagsApi(),
        adminRepository.fetchAuditLogsApi(),
        adminRepository.fetchOwnerProfileApi(),
        adminRepository.fetchCommentsApi(),
        adminRepository.getUserCounts(),
      ]);
      setUsers(u);
      setFeatureFlags(f);
      setAuditLogs(a);
      setComments(c);
      setUserCounts(uc);
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    setCreators(adminRepository.getCreatorApplications());
    setSubscriptions(adminRepository.getSubscriptions());
    setStories(adminRepository.getStories());
    setGenres(adminRepository.getGenres());
    setReports(adminRepository.getReports());
    setCopyrightClaims(adminRepository.getCopyrightClaims());
    setTickets(adminRepository.getTickets());
    setNotifications(adminRepository.getNotifications());
    setMaintenanceConfig(adminRepository.getMaintenanceConfig());
    setIncidents(adminRepository.getIncidents());
    setServiceHealth(adminRepository.getServiceHealth());
    setSecurityAlerts(adminRepository.getSecurityAlerts());
  };

  React.useEffect(() => {
    refreshAllData();

    const handleSync = () => {
      // Re-read current state from the repository
      setCreators(adminRepository.getCreatorApplications());
      setSubscriptions(adminRepository.getSubscriptions());
      setStories(adminRepository.getStories());
      setGenres(adminRepository.getGenres());
      setComments(adminRepository.getComments());
      setReports(adminRepository.getReports());
      setCopyrightClaims(adminRepository.getCopyrightClaims());
      setTickets(adminRepository.getTickets());
      setNotifications(adminRepository.getNotifications());
      setMaintenanceConfig(adminRepository.getMaintenanceConfig());
      setIncidents(adminRepository.getIncidents());
      setServiceHealth(adminRepository.getServiceHealth());
      setSecurityAlerts(adminRepository.getSecurityAlerts());
    };

    window.addEventListener('toptruyenaudio_admin_sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('toptruyenaudio_admin_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Pending counts for notifications & badges
  const pendingCounts = {
    creators: creators.filter((c) => c.status === 'PENDING').length,
    reports: reports.filter((r) => r.status === 'PENDING').length,
    copyright: copyrightClaims.filter((c) => c.status === 'PENDING').length,
    tickets: tickets.filter((t) => t.status === 'PENDING').length,
    security: securityAlerts.filter((s) => s.status === 'PENDING').length,
  };

  const { notifyUserBanned } = useUserBanNotification();

  // Action Handlers
  const handleLockUser = (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: `Tạm Khóa Tài Khoản: ${user.name}`,
      description: `Bạn sắp tạm dừng quyền truy cập và nghe truyện của người dùng ${user.email}. Tài khoản này sẽ không thể đăng nhập hoặc nghe audio cho đến khi được mở lại.`,
      impactScope: `Khóa đăng nhập tài khoản ${user.email} (ID: ${user.id})`,
      confirmLabel: 'Xác Nhận Tạm Khóa',
      variant: 'warning',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do tạm khóa (VD: Vi phạm quy tắc bình luận xúc phạm)...',
      onConfirm: async (reason) => {
        const res = await adminRepository.updateUserStatus(user.id, 'SUSPENDED', reason);
        notifyUserBanned({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          reason,
          status: 'SUSPENDED',
        });
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleUnlockUser = (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: `Mở Khóa Tài Khoản: ${user.name}`,
      description: `Khôi phục toàn bộ quyền truy cập và lịch sử nghe audio của thành viên ${user.email}.`,
      impactScope: `Khôi phục trạng thái ACTIVE cho ${user.email}`,
      confirmLabel: 'Mở Khóa Ngay',
      variant: 'primary',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do mở khóa...',
      onConfirm: async (reason) => {
        const res = await adminRepository.updateUserStatus(user.id, 'ACTIVE', reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleGrantPremium = (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: `Cấp / Gia Hạn Premium Cho: ${user.name}`,
      description: `Cấp thêm 30 ngày quyền nghe audio chất lượng cao 320kbps và toàn bộ các bộ truyện VIP có tính phí.`,
      impactScope: `Nâng hạng VIP cho ${user.email}`,
      confirmLabel: 'Cấp Gói VIP Ngay',
      variant: 'primary',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do cấp VIP (VD: Hỗ trợ lỗi thanh toán qua VietQR)...',
      onConfirm: async (reason) => {
        const res = await adminRepository.updateUserMembership(user.id, 'PREMIUM', 30, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleDeleteUser = (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: `Xóa Vĩnh Viễn Người Dùng: ${user.name}`,
      description: `HÀNH ĐỘNG NGUY HIỂM: Thao tác này sẽ xóa vĩnh viễn dữ liệu tài khoản, lịch sử nghe và danh sách yêu thích của ${user.email}. Không thể hoàn tác sau khi xác nhận.`,
      impactScope: `Xóa toàn bộ bản ghi database của ${user.email}`,
      confirmLabel: 'Xóa Vĩnh Viễn',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Bắt buộc nhập lý do xóa tài khoản theo yêu cầu pháp lý hoặc vi phạm nghiêm trọng...',
      onConfirm: async (reason) => {
        const res = await adminRepository.deleteUser(user.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleApproveCreator = (app: AdminCreatorApplication) => {
    setConfirmModal({
      isOpen: true,
      title: `Phê Duyệt Creator: ${app.creatorName}`,
      description: `Phê duyệt giọng đọc và cấp quyền đăng tải truyện audio, tự động mã hóa AAC cho ${app.email}.`,
      impactScope: `Nâng cấp quyền CREATOR cho ${app.email} và xuất bản truyện "${app.storyTitle}"`,
      confirmLabel: 'Phê Duyệt Ngay',
      variant: 'primary',
      requiresReason: true,
      reasonPlaceholder: 'Ghi chú thẩm định giọng đọc...',
      onConfirm: (reason) => {
        const res = adminRepository.approveCreatorApplication(app.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleRejectCreator = (app: AdminCreatorApplication) => {
    setConfirmModal({
      isOpen: true,
      title: `Từ Chối Đơn Creator: ${app.creatorName}`,
      description: `Từ chối cấp quyền tác giả đối với dự án "${app.storyTitle}".`,
      impactScope: `Từ chối đơn của ${app.email}`,
      confirmLabel: 'Xác Nhận Từ Chối',
      variant: 'warning',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do từ chối (chất lượng phòng thu, tạp âm, v.v.)...',
      onConfirm: (reason) => {
        const res = adminRepository.rejectCreatorApplication(app.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleUpdateStoryPublishStatus = (
    story: AdminStoryItem,
    newStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED'
  ) => {
    setConfirmModal({
      isOpen: true,
      title: `Chuyển Trạng Thái: ${story.title}`,
      description: `Thay đổi trạng thái phát hành của bộ truyện sang "${newStatus}".`,
      impactScope: `Bộ truyện "${story.title}" (${story.id})`,
      confirmLabel: 'Lưu Trạng Thái',
      variant: 'primary',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do thay đổi trạng thái phát hành...',
      onConfirm: async (reason) => {
        const res = await adminRepository.updateStoryPublishStatus(story.id, newStatus, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleUpdateStoryAccessLevel = (
    story: AdminStoryItem,
    newAccess: 'FREE' | 'PREMIUM'
  ) => {
    setConfirmModal({
      isOpen: true,
      title: `Đổi Gói Truy Cập: ${story.title}`,
      description: `Chuyển phân quyền nghe toàn bộ các tập của bộ truyện này sang "${newAccess}".`,
      impactScope: `Khóa/Mở gói VIP cho "${story.title}"`,
      confirmLabel: 'Áp Dụng Phân Quyền',
      variant: 'primary',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do điều chỉnh phân quyền gói cước...',
      onConfirm: async (reason) => {
        const res = await adminRepository.updateStoryAccessLevel(story.id, newAccess, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleDeleteStory = (story: AdminStoryItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Gỡ Vĩnh Viễn Bộ Truyện: ${story.title}`,
      description: `HÀNH ĐỘNG NGUY HIỂM: Gỡ toàn bộ các tập audio và xóa bộ truyện khỏi danh mục nghe của thính giả.`,
      impactScope: `Xóa vĩnh viễn tệp audio và dữ liệu truyện "${story.title}"`,
      confirmLabel: 'Xác Nhận Gỡ Bỏ',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Bắt buộc nhập lý do gỡ bài...',
      onConfirm: async (reason) => {
        const res = await adminRepository.deleteStory(story.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleDeleteChapter = (
    story: AdminStoryItem,
    chapterId: string,
    chapterTitle?: string
  ) => {
    setConfirmModal({
      isOpen: true,
      title: `Xóa Tập Audio: ${chapterTitle || 'Tập audio'}`,
      description: `Bạn có chắc muốn xóa vĩnh viễn tập này khỏi bộ truyện "${story.title}"? Dữ liệu phát âm thanh và lịch sử nghe tập này sẽ bị gỡ bỏ hoàn toàn.`,
      impactScope: `Xóa tệp audio của "${story.title}" (Tập ID: ${chapterId})`,
      confirmLabel: 'Xác Nhận Xóa Tập',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do xóa tập (tệp hỏng, đổi MC, bản quyền)...',
      onConfirm: async (reason) => {
        const res = await adminRepository.deleteStoryChapter(story.id, chapterId, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleDeleteChapters = (
    story: AdminStoryItem,
    chapterIds: string[]
  ) => {
    setConfirmModal({
      isOpen: true,
      title: `Xóa Hàng Loạt ${chapterIds.length} Tập Audio`,
      description: `Bạn sắp xóa vĩnh viễn ${chapterIds.length} tập audio đã chọn khỏi bộ truyện "${story.title}". Thao tác này không thể hoàn tác sau khi xác nhận.`,
      impactScope: `Xóa ${chapterIds.length} tập audio của bộ truyện "${story.title}"`,
      confirmLabel: `Xóa ${chapterIds.length} Tập Đã Chọn`,
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do xóa hàng loạt tập audio...',
      onConfirm: async (reason) => {
        const res = await adminRepository.deleteStoryChapters(story.id, chapterIds, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const getStoryChapters = (storyId: string): AudioChapter[] => {
    return adminRepository.getStoryChapters(storyId);
  };

  const handleAddGenre = (name: string, slug: string, description: string) => {
    const res = adminRepository.addGenre(name, slug, description);
    refreshAllData();
    showToast(res.message);
  };

  const handleDeleteGenre = (genre: AdminGenreItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Xóa Thể Loại: ${genre.name}`,
      description: `Xóa thể loại này khỏi bộ lọc tìm kiếm và danh mục truyện.`,
      impactScope: `Xóa danh mục "${genre.name}"`,
      confirmLabel: 'Xóa Thể Loại',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Nhập lý do xóa thể loại...',
      onConfirm: (reason) => {
        const res = adminRepository.deleteGenre(genre.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleHideComment = async (comment: AdminCommentItem) => {
    const newStatus = comment.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    const res = await adminRepository.updateCommentStatus(comment.id, newStatus, 
      newStatus === 'HIDDEN' ? 'Owner Admin ẩn bình luận' : 'Khôi phục hiển thị'
    );
    refreshAllData();
    showToast(res.message);
  };

  const handleDeleteComment = (comment: AdminCommentItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Xóa Vĩnh Viễn Bình Luận`,
      description: `Xóa bình luận của ${comment.userName} trên truyện "${comment.storyTitle}".`,
      impactScope: `Bình luận ID: ${comment.id}`,
      confirmLabel: 'Xóa Bình Luận',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Lý do xóa bình luận spam / xúc phạm...',
      onConfirm: async (reason) => {
        const res = await adminRepository.deleteComment(comment.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleResolveReport = (report: AdminViolationReport) => {
    setConfirmModal({
      isOpen: true,
      title: `Xử Phạt Báo Cáo Vi Phạm`,
      description: `Áp dụng biện pháp xử phạt đối với ${report.targetTitle} dựa trên phản ánh của ${report.reporterName}.`,
      impactScope: `Báo cáo #${report.id}`,
      confirmLabel: 'Thực Thi Xử Phạt',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Ghi chú biện pháp xử phạt...',
      onConfirm: (reason) => {
        const res = adminRepository.resolveReport(report.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleDismissReport = (report: AdminViolationReport) => {
    const res = adminRepository.dismissReport(report.id, 'Báo cáo nhầm hoặc không vi phạm tiêu chuẩn');
    refreshAllData();
    showToast(res.message);
  };

  const handleResolveClaim = (claim: AdminCopyrightClaim) => {
    setConfirmModal({
      isOpen: true,
      title: `Chấp Thuận Khiếu Nại & Gỡ Tác Phẩm`,
      description: `Thực thi gỡ bỏ bộ truyện "${claim.infringingStoryTitle}" theo giấy phép bản quyền của ${claim.organization}.`,
      impactScope: `Gỡ truyện "${claim.infringingStoryTitle}" khỏi hệ thống`,
      confirmLabel: 'Thực Thi Gỡ Bỏ',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Ghi chú văn bản bản quyền...',
      onConfirm: (reason) => {
        const res = adminRepository.resolveCopyrightClaim(claim.id, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleDismissClaim = (claim: AdminCopyrightClaim) => {
    const res = adminRepository.dismissCopyrightClaim(claim.id, 'Bằng chứng không đủ căn cứ pháp lý');
    refreshAllData();
    showToast(res.message);
  };

  const handleResolveTicket = (ticket: AdminSupportTicket, reply: string) => {
    const res = adminRepository.resolveTicket(ticket.id, reply);
    refreshAllData();
    showToast(res.message);
  };

  const handleSendBroadcast = async (
    title: string,
    content: string,
    type: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER' | 'WARNING' | 'ERROR' | 'SUPPORT',
    targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER'
  ) => {
    const res = await adminRepository.sendBroadcastNotification(title, content, type, targetAudience);
    if (res.success) {
      refreshAllData();
    }
    showToast(res.message);
  };

  const handleDeleteBroadcast = (notification: AdminBroadcastNotification) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Thông Báo Hệ Thống',
      description: `Bạn có chắc chắn muốn gỡ bỏ hoàn toàn thông báo "${notification.title}"? Thính giả sẽ không còn thấy thông báo này nữa.`,
      impactScope: `Xóa thông báo ID: ${notification.id}`,
      confirmLabel: 'Xác Nhận Xóa',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Lý do gỡ bỏ thông báo...',
      onConfirm: (reason) => {
        const res = adminRepository.deleteBroadcastNotification(notification.id);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleSaveMaintenanceConfig = (
    config: Partial<AdminMaintenanceConfig>,
    reason: string
  ) => {
    const res = adminRepository.updateMaintenanceConfig(config, reason);
    refreshAllData();
    showToast(res.message);
  };

  const handleCreateIncident = (
    title: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    affectedServices: string[],
    description: string
  ) => {
    const res = adminRepository.createIncident(title, severity, affectedServices, description);
    refreshAllData();
    showToast(res.message);
  };

  const handleResolveIncident = (incident: AdminSystemIncident, resolutionNote: string) => {
    const res = adminRepository.resolveIncident(incident.id, resolutionNote);
    refreshAllData();
    showToast(res.message);
  };

  const handleRecheckServices = async () => {
    const res = await adminRepository.recheckAllServices();
    setServiceHealth(adminRepository.getServiceHealth());
    setAuditLogs(adminRepository.getAuditLogs());
    showToast(res.message);
  };

  const handlePingSingleService = async (id: string) => {
    const item = await adminRepository.pingServiceHealthItem(id);
    if (item) {
      setServiceHealth(adminRepository.getServiceHealth());
      showToast(`Đã kiểm tra ${item.name}: ${item.latencyMs}ms (${item.status})`);
    }
  };

  const handleUpdateServiceConfig = (id: string, updates: Partial<AdminServiceHealthItem>) => {
    const res = adminRepository.updateServiceConfig(id, updates);
    setServiceHealth(adminRepository.getServiceHealth());
    setAuditLogs(adminRepository.getAuditLogs());
    showToast(res.message);
  };

  const handleAddMonitoredService = (
    newService: Omit<AdminServiceHealthItem, 'id' | 'lastChecked'>
  ) => {
    const res = adminRepository.addMonitoredService(newService);
    setServiceHealth(adminRepository.getServiceHealth());
    setAuditLogs(adminRepository.getAuditLogs());
    showToast(res.message);
  };

  const handleDeleteMonitoredService = (id: string) => {
    const res = adminRepository.deleteMonitoredService(id);
    setServiceHealth(adminRepository.getServiceHealth());
    setAuditLogs(adminRepository.getAuditLogs());
    showToast(res.message);
  };

  const handleResolveSecurityAlert = (alert: AdminSecurityAlert) => {
    setConfirmModal({
      isOpen: true,
      title: `Khóa IP & Chặn WAF: ${alert.ipAddress}`,
      description: `Thêm IP ${alert.ipAddress} vào danh sách đen của tường lửa WAF 24 giờ.`,
      impactScope: `Chặn toàn bộ lưu lượng từ IP ${alert.ipAddress}`,
      confirmLabel: 'Khóa IP Ngay',
      variant: 'danger',
      requiresReason: true,
      reasonPlaceholder: 'Lý do khóa IP (Brute Force / Scraping quá tải)...',
      onConfirm: (reason) => {
        const res = adminRepository.resolveSecurityAlert(alert.id, `Đã khóa IP: ${reason}`);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const handleMarkFalsePositiveAlert = (alert: AdminSecurityAlert) => {
    const res = adminRepository.markAlertFalsePositive(alert.id, 'Thiết bị chính chủ của người dùng');
    refreshAllData();
    showToast(res.message);
  };

  const handleToggleFeatureFlag = (flag: AdminFeatureFlag) => {
    setConfirmModal({
      isOpen: true,
      title: `Chuyển Đổi Cờ Tính Năng: ${flag.name}`,
      description: `Bạn có chắc muốn ${flag.isEnabled ? 'TẮT' : 'BẬT'} tính năng này trên toàn bộ hệ thống ngay lập tức?`,
      impactScope: `Cờ tính năng: ${flag.key}`,
      confirmLabel: flag.isEnabled ? 'Tắt Tính Năng' : 'Bật Tính Năng',
      variant: flag.isEnabled ? 'warning' : 'primary',
      requiresReason: true,
      reasonPlaceholder: 'Lý do thay đổi cờ tính năng...',
      onConfirm: (reason) => {
        const res = adminRepository.toggleFeatureFlag(flag.key, reason);
        refreshAllData();
        showToast(res.message);
      },
    });
  };

  const contextValue: AdminLayoutContextType = {
    users,
    creators,
    stories,
    genres,
    comments,
    reports,
    copyrightClaims,
    tickets,
    notifications,
    maintenanceConfig,
    incidents,
    serviceHealth,
    securityAlerts,
    featureFlags,
    auditLogs,
    subscriptions,
    profile,
    userCounts,
    pendingCounts,
    refreshAllData,
    showToast,
    setConfirmModal,
    handleLockUser,
    handleUnlockUser,
    handleGrantPremium,
    handleDeleteUser,
    handleApproveCreator,
    handleRejectCreator,
    handleUpdateStoryPublishStatus,
    handleUpdateStoryAccessLevel,
    handleDeleteStory,
    handleDeleteChapter,
    handleDeleteChapters,
    getStoryChapters,
    handleAddGenre,
    handleDeleteGenre,
    handleHideComment,
    handleDeleteComment,
    handleResolveReport,
    handleDismissReport,
    handleResolveClaim,
    handleDismissClaim,
    handleResolveTicket,
    handleSendBroadcast,
    handleDeleteBroadcast,
    handleSaveMaintenanceConfig,
    handleCreateIncident,
    handleResolveIncident,
    handleRecheckServices,
    handlePingSingleService,
    handleUpdateServiceConfig,
    handleAddMonitoredService,
    handleDeleteMonitoredService,
    handleResolveSecurityAlert,
    handleMarkFalsePositiveAlert,
    handleToggleFeatureFlag,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white flex flex-col antialiased">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] max-w-md p-4 bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl flex items-center gap-3 text-xs text-white animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <AdminConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        impactScope={confirmModal.impactScope}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        requiresReason={confirmModal.requiresReason}
        reasonPlaceholder={confirmModal.reasonPlaceholder}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Admin Top Header */}
      <AdminHeader
        profile={profile}
        pendingCounts={pendingCounts}
        onSelectRoute={(route) => navigate(route)}
        onOpenChangePassword={() => navigate('/admin/profile')}
      />

      {/* Breadcrumb Sub-Header */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-1.5 sticky top-16 z-30 backdrop-blur-md">
        <div className="w-full max-w-[1800px] mx-auto">
          <AdminBreadcrumb />
        </div>
      </div>

      {/* Main Admin Content View Area */}
      <main className="flex-1 w-full pb-16">
        <Outlet context={contextValue} />
      </main>
    </div>
  );
};
