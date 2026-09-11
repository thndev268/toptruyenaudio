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
import { TelegramSettingsScreen } from '../screens/TelegramSettingsScreen';
import { PayOSScreen } from '../screens/PayOSScreen';
import { AuditLogsScreen } from '../screens/AuditLogsScreen';
import { AdminProfileScreen } from '../screens/AdminProfileScreen';
import { AdminBadgesScreen } from '../screens/AdminBadgesScreen';
import { AdminBadgesPage } from './AdminBadgesPage';
import { SystemStatusScreen } from '../screens/SystemStatusScreen';

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
      'system-status': '/admin/system-status',
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
        totalUsersCount={ctx.userCounts.total}
        userCounts={ctx.userCounts}
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
  return (
    <AdminPageContainer>
      <PremiumScreen />
    </AdminPageContainer>
  );
};

// 5. Stories Page
export const AdminStoriesPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const selectedStory = selectedStoryId
    ? (Array.isArray(ctx.stories) ? ctx.stories.find((s) => s.id === selectedStoryId) : null) || null
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
        onStoryUpdated={() => ctx.refreshAllData()}
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
export const AdminGenresPage: React.FC = () => {
  const ctx = useOutletContext<AdminLayoutContextType>();

  return (
    <AdminPageContainer>
      <GenresScreen
        genres={ctx.genres}
        onAddGenre={ctx.handleAddGenre}
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
        stories={ctx.stories}
        onHideComment={ctx.handleHideComment}
        onDeleteComment={ctx.handleDeleteComment}
        onFetchComments={ctx.handleFetchComments}
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
        userCounts={ctx.userCounts}
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
        <TelegramSettingsScreen />
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

// 19. PayOS Configuration Page
export const AdminPayOSPage: React.FC = () => {
  return (
    <AdminPageContainer>
      <PayOSScreen />
    </AdminPageContainer>
  );
};

// 20. System Status Page
export const AdminSystemStatusPage: React.FC = () => {
  return (
    <AdminPageContainer>
      <SystemStatusScreen />
    </AdminPageContainer>
  );
};
