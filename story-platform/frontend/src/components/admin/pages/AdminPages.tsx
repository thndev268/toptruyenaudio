import { HonoraryTitlesScreen } from '../screens/HonoraryTitlesScreen';
import React, { useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { AdminLayoutContextType } from '../layout/AdminLayout';
import { AdminPageContainer } from '../layout/AdminPageContainer';
import { AdminUser, AdminStoryItem } from '../../../types/admin';

// Screen Components
import { DashboardScreen } from '../screens/DashboardScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { UserDetailModal } from '../screens/UserDetailModal';
import { CreatorsScreen } from '../screens/CreatorsScreen';
import { StoriesScreen } from '../screens/StoriesScreen';
import { StoryDetailModal } from '../screens/StoryDetailModal';
import { VideoStoriesAdminModal } from '../screens/VideoStoriesAdminModal';
import { GenresScreen } from '../screens/GenresScreen';
import { CommentsScreen } from '../screens/CommentsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { CopyrightScreen } from '../screens/CopyrightScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { TicketsScreen } from '../screens/TicketsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { MaintenanceScreen } from '../screens/MaintenanceScreen';
import { IncidentsScreen } from '../screens/IncidentsScreen';
import { ServiceHealthScreen } from '../screens/ServiceHealthScreen';
import { SecurityAlertsScreen } from '../screens/SecurityAlertsScreen';
import { FeatureFlagsScreen } from '../screens/FeatureFlagsScreen';
import { ZaloSettingsScreen } from '../screens/ZaloSettingsScreen';
import { AuditLogsScreen } from '../screens/AuditLogsScreen';
import { AdminProfileScreen } from '../screens/AdminProfileScreen';
import { AdminBadgesScreen } from '../screens/AdminBadgesScreen';
import { AdminBadgesPage } from './AdminBadgesPage';

export { AdminBadgesPage };

// 1. Dashboard Page
export const AdminDashboardPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();
  const navigate = useNavigate();

  const handleNavigate = (screenId: string) => {
    const [screen, paramId] = screenId.split(':');
    const routeMap: Record<string, string> = {
      dashboard: '/admin/dashboard',
      users: '/admin/users',
      creators: '/admin/creators',
      premium: '/admin/subscriptions',
      badges: '/admin/badges',
      stories: '/admin/stories',
      genres: '/admin/genres',
      comments: '/admin/comments',
      reports: '/admin/reports',
      copyright: '/admin/copyright',
      tickets: '/admin/support',
      notifications: '/admin/notifications',
      maintenance: '/admin/maintenance',
      incidents: '/admin/incidents',
      'service-health': '/admin/system',
      'security-alerts': '/admin/security',
      'audit-logs': '/admin/audit-logs',
      'feature-flags': '/admin/settings',
      'admin-profile': '/admin/profile',
    };
    const route = routeMap[screen] || '/admin/dashboard';
    if (paramId) {
      navigate(route, { state: { selectedTicketId: paramId } });
    } else {
      navigate(route);
    }
  };

  return (
    <AdminPageContainer>
      <DashboardScreen
        onNavigate={handleNavigate as any}
        pendingCounts={ctx.pendingCounts}
        auditLogs={ctx.auditLogs}
        serviceHealth={ctx.serviceHealth}
        tickets={ctx.tickets}
        totalStoriesCount={ctx.stories.length}
        totalUsersCount={ctx.users.length}
        onQuickMaintenanceToggle={() =>
          ctx.handleSaveMaintenanceConfig(
            { isEnabled: !ctx.maintenanceConfig.isEnabled },
            'Bật/tắt bảo trì từ bảng điều khiển nhanh'
          )
        }
        isMaintenanceActive={ctx.maintenanceConfig.isEnabled}
        onQuickBroadcastModal={() => navigate('/admin/notifications')}
        onQuickHealthPing={ctx.handleRecheckServices}
      />
    </AdminPageContainer>
  );
};

// 2. Users Page
export const AdminUsersPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  return (
    <AdminPageContainer>
      <UsersScreen
        users={ctx.users}
        onViewUser={(user) => setSelectedUser(user)}
        onLockUser={ctx.handleLockUser}
        onUnlockUser={ctx.handleUnlockUser}
        onGrantPremium={ctx.handleGrantPremium}
        onDeleteUser={ctx.handleDeleteUser}
      />

      <UserDetailModal
        isOpen={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        auditLogs={ctx.auditLogs}
        onLockUser={ctx.handleLockUser}
        onUnlockUser={ctx.handleUnlockUser}
        onGrantPremium={ctx.handleGrantPremium}
        onDeleteUser={(u) => {
          ctx.handleDeleteUser(u);
          setSelectedUser(null);
        }}
      />
    </AdminPageContainer>
  );
};

// 3. Creators Page
export const AdminCreatorsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <CreatorsScreen
        applications={ctx.creators}
        onApproveApplication={ctx.handleApproveCreator}
        onRejectApplication={ctx.handleRejectCreator}
      />
    </AdminPageContainer>
  );
};

// 4. Subscriptions / Premium Page
export const AdminSubscriptionsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <PremiumScreen subscriptions={ctx.subscriptions} />
    </AdminPageContainer>
  );
};

// 5. Stories Page
export const AdminStoriesPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const selectedStory = selectedStoryId
    ? ctx.stories.find((s) => s.id === selectedStoryId) || null
    : null;

  return (
    <AdminPageContainer>
      <StoriesScreen
        stories={ctx.stories}
        onManageStory={(story) => setSelectedStoryId(story.id)}
        onUpdatePublishStatus={ctx.handleUpdateStoryPublishStatus}
        onUpdateAccessLevel={ctx.handleUpdateStoryAccessLevel}
        onDeleteStory={ctx.handleDeleteStory}
        onOpenVideoModal={() => setIsVideoModalOpen(true)}
      />

      <StoryDetailModal
        isOpen={!!selectedStory}
        story={selectedStory}
        onClose={() => setSelectedStoryId(null)}
        onUpdatePublishStatus={ctx.handleUpdateStoryPublishStatus}
        onUpdateAccessLevel={ctx.handleUpdateStoryAccessLevel}
        onDeleteStory={(s) => {
          ctx.handleDeleteStory(s);
          setSelectedStoryId(null);
        }}
        onDeleteChapter={ctx.handleDeleteChapter}
        onDeleteChapters={ctx.handleDeleteChapters}
        getStoryChapters={ctx.getStoryChapters}
      />

      <VideoStoriesAdminModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onRefreshData={ctx.refreshAllData}
        stories={ctx.stories}
      />
    </AdminPageContainer>
  );
};

// 6. Genres Page
import { Terminal as TerminalIcon, Cpu, Check, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

export const AdminGenresPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();
  const [logs, setLogs] = useState<{ id: string; timestamp: string; type: 'info' | 'success' | 'error' | 'warn'; message: string }[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Hệ thống chẩn đoán Genres đã sẵn sàng. Chờ lệnh từ quản trị viên...'
    }
  ]);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const addLog = (type: 'info' | 'success' | 'error' | 'warn', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), timestamp, type, message }
    ]);
  };

  const handleAddGenreDiagnostic = async (name: string, slug: string, description: string) => {
    addLog('info', `===== KHỞI CHẠY QUY TRÌNH THÊM THỂ LOẠI MỚI =====`);
    addLog('info', `Tham số nhận được: Name="${name}", Slug="${slug}", Description="${description}"`);

    // Step 1: Validate locally
    addLog('info', 'Bước 1: Kiểm tra tính hợp lệ dữ liệu locally...');
    const slugToUse = slug || name.toLowerCase().replace(/\s+/g, '-');
    const exists = ctx.genres.some(
      (g) => g.slug === slugToUse || g.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      addLog('error', `Thất bại: Thể loại với tên hoặc slug "${slugToUse}" đã tồn tại trên local state.`);
      ctx.showToast('Thể loại này đã tồn tại.');
      return;
    }
    addLog('success', 'Local validation hoàn tất: Không phát hiện trùng lặp.');

    // Step 2: Trigger state update locally via Repository
    addLog('info', 'Bước 2: Gọi handleAddGenre của Layout để thêm dữ liệu vào local repository & dispatch sự kiện đồng bộ...');
    setIsVerifying(true);
    
    try {
      // Call repository
      ctx.handleAddGenre(name, slug, description);
      addLog('success', 'Cập nhật bộ nhớ đệm (Local Cache) và dispatch toptruyenaudio_admin_sync thành công!');

      // Step 3: Await/Verify the API Backend Sync response
      addLog('info', 'Bước 3: Gửi và kiểm tra phản hồi từ API Backend (POST /api/genres)...');
      
      const response = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: [...ctx.genres, { id: 'temp-' + Date.now(), name, slug: slugToUse, description, storyCount: 0 }] }),
      });

      if (response.ok) {
        const responseData = await response.json();
        addLog('success', `API Backend phản hồi thành công (HTTP ${response.status})!`);
        addLog('info', `Payload nhận được từ Server: ${JSON.stringify(responseData)}`);
        
        if (responseData.success) {
          addLog('success', `Xác nhận: Máy chủ lưu trữ thành công. Tổng số lượng thể loại hiện tại trên Server: ${responseData.count}`);
        } else {
          addLog('warn', `Chú ý: Server phản hồi nhưng trường success = false. Chi tiết: ${responseData.message || 'Không có'}`);
        }
      } else {
        const errorText = await response.text();
        addLog('error', `Lỗi API Backend (HTTP ${response.status}): ${errorText || 'Không rõ nguyên nhân'}`);
      }

      // Step 4: Verify UI state synchronization
      addLog('info', 'Bước 4: Đồng bộ trạng thái UI (State Synchronization & Re-fetch Check)...');
      await ctx.refreshAllData();
      addLog('success', `Đã đồng bộ lại toàn bộ dữ liệu quản trị mới từ Server. Trạng thái UI hiển thị chuẩn xác!`);
    } catch (error: any) {
      addLog('error', `Lỗi nghiêm trọng trong quá trình đồng bộ: ${error?.message || error}`);
    } finally {
      setIsVerifying(false);
      addLog('info', `===== QUY TRÌNH THỂ LOẠI HOÀN TẤT =====`);
    }
  };

  const clearLogs = () => {
    setLogs([
      {
        id: 'init',
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        message: 'Đã dọn dẹp bảng điều khiển chẩn đoán. Chờ lệnh mới...'
      }
    ]);
  };

  return (
    <AdminPageContainer>
      {/* Diagnostic Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Bảng Chẩn Đoán Đồng Bộ API (Genres Diagnostic Terminal)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 rounded-lg transition-all"
            >
              {showDiagnostics ? 'Ẩn Chẩn Đoán' : 'Hiện Chẩn Đoán'}
            </button>
            {logs.length > 1 && (
              <button
                onClick={clearLogs}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-xs font-semibold text-rose-400 rounded-lg transition-all"
              >
                Xóa Logs
              </button>
            )}
          </div>
        </div>

        {showDiagnostics && (
          <div className="space-y-3">
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-h-[220px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0 font-bold">[{log.timestamp}]</span>
                  <span
                    className={`font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.2 rounded shrink-0 ${
                      log.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : log.type === 'error'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : log.type === 'warn'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-300'
                        : log.type === 'error'
                        ? 'text-rose-300'
                        : log.type === 'warn'
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Hệ thống giám sát vòng lặp request/response tự động đang hoạt động.</span>
            </div>
          </div>
        )}
      </div>

      <GenresScreen
        genres={ctx.genres}
        onAddGenre={handleAddGenreDiagnostic}
        onDeleteGenre={ctx.handleDeleteGenre}
      />
    </AdminPageContainer>
  );
};

// 7. Comments Page
export const AdminCommentsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <CommentsScreen
        comments={ctx.comments}
        onHideComment={ctx.handleHideComment}
        onDeleteComment={ctx.handleDeleteComment}
      />
    </AdminPageContainer>
  );
};

// 8. Reports Page
export const AdminReportsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <ReportsScreen
        reports={ctx.reports}
        onResolveReport={ctx.handleResolveReport}
        onDismissReport={ctx.handleDismissReport}
      />
    </AdminPageContainer>
  );
};

// 9. Copyright Page
export const AdminCopyrightPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <CopyrightScreen
        claims={ctx.copyrightClaims}
        onResolveClaim={ctx.handleResolveClaim}
        onDismissClaim={ctx.handleDismissClaim}
      />
    </AdminPageContainer>
  );
};

// 10. Support / Tickets Page
export const AdminSupportPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <TicketsScreen
        tickets={ctx.tickets}
        onResolveTicket={ctx.handleResolveTicket}
      />
    </AdminPageContainer>
  );
};

// 11. Notifications Page
export const AdminNotificationsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <NotificationsScreen
        notifications={ctx.notifications}
        onSendBroadcast={ctx.handleSendBroadcast}
        onDeleteBroadcast={ctx.handleDeleteBroadcast}
      />
    </AdminPageContainer>
  );
};

// 12. Maintenance Page
export const AdminMaintenancePage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <MaintenanceScreen
        config={ctx.maintenanceConfig}
        onSaveConfig={ctx.handleSaveMaintenanceConfig}
      />
    </AdminPageContainer>
  );
};

// 13. Incidents Page
export const AdminIncidentsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <IncidentsScreen
        incidents={ctx.incidents}
        onCreateIncident={ctx.handleCreateIncident}
        onResolveIncident={ctx.handleResolveIncident}
      />
    </AdminPageContainer>
  );
};

// 14. System / Service Health Page
export const AdminSystemPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <ServiceHealthScreen
        services={ctx.serviceHealth}
        onRecheck={ctx.handleRecheckServices}
        onPingSingle={ctx.handlePingSingleService}
        onUpdateConfig={ctx.handleUpdateServiceConfig}
        onAddService={ctx.handleAddMonitoredService}
        onDeleteService={ctx.handleDeleteMonitoredService}
        onCreateIncident={ctx.handleCreateIncident}
      />
    </AdminPageContainer>
  );
};

// 15. Security Page
export const AdminSecurityPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <SecurityAlertsScreen
        alerts={ctx.securityAlerts}
        onResolveAlert={ctx.handleResolveSecurityAlert}
        onMarkFalsePositive={ctx.handleMarkFalsePositiveAlert}
      />
    </AdminPageContainer>
  );
};

// 16. Audit Logs Page
export const AdminAuditLogsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <AuditLogsScreen logs={ctx.auditLogs} />
    </AdminPageContainer>
  );
};

// 17. Settings / Feature Flags Page
export const AdminSettingsPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <div className="space-y-6">
        <ZaloSettingsScreen />
        <FeatureFlagsScreen
          flags={ctx.featureFlags}
          onToggleFlag={ctx.handleToggleFeatureFlag}
        />
      </div>
    </AdminPageContainer>
  );
};

// 18. Admin Profile Page
export const AdminProfilePage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <AdminProfileScreen profile={ctx.profile} />
    </AdminPageContainer>
  );
};

export const AdminHonoraryTitlesPage = () => <AdminPageContainer><HonoraryTitlesScreen /></AdminPageContainer>;
