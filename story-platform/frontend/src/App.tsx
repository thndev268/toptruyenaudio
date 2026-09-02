import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { BadgeToastProvider } from './context/BadgeToastContext';
import { cleanupLegacyReferralStorage } from './config/features';
import { storage } from './services/storage';

import { UserRole } from './types';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { AdminNotFoundView } from './components/admin/layout/AdminNotFoundView';

// Route Guards
import { ProtectedRoute, RoleRoute } from './components/auth/ProtectedRoute';

// Public & User Views
import { HomeView } from './components/views/HomeView';
import { ExploreView } from './components/views/ExploreView';
import { GenresView } from './components/views/GenresView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { SearchView } from './components/views/SearchView';
import { StoryDetailView } from './components/views/StoryDetailView';
import { AudioPlayerView } from './components/views/AudioPlayerView';
import { LibraryView } from './components/views/LibraryView';
import { FavoritesView } from './components/views/FavoritesView';
import { ListeningView } from './components/views/ListeningView';
import { HistoryView } from './components/views/HistoryView';
import { PlaylistsView } from './components/views/PlaylistsView';
import { PlaylistDetailView } from './components/views/PlaylistDetailView';
import { PremiumView } from './components/views/PremiumView';
import { SupportView } from './components/views/SupportView';
import { SubscriptionManagementView } from './components/views/SubscriptionManagementView';
import { AccountView } from './components/views/AccountView';
import { AccountEditView } from './components/views/AccountEditView';
import { ProfileView } from './components/views/ProfileView';
import { BecomeCreatorView } from './components/views/BecomeCreatorView';
import { UserBadgesView } from './components/views/UserBadgesView';
import { PublicProfileView } from './components/views/PublicProfileView';

// Auth Views
import { LoginView } from './components/views/LoginView';
import { RegisterView } from './components/views/RegisterView';
import { ForgotPasswordView } from './components/views/ForgotPasswordView';
import { UnauthorizedView } from './components/views/UnauthorizedView';
import { NotFoundView } from './components/views/NotFoundView';
import { AuthCallback } from './components/auth/AuthCallback';

// Management Portal Views
import { CreatorStudioView } from './components/views/CreatorStudioView';
import { PartnerPortalView } from './components/views/PartnerPortalView';

// Admin Portal Pages
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminCreatorsPage,
  AdminSubscriptionsPage,
  AdminStoriesPage,
  AdminGenresPage,
  AdminCommentsPage,
  AdminReportsPage,
  AdminCopyrightPage,
  AdminSupportPage,
  AdminNotificationsPage,
  AdminMaintenancePage,
  AdminIncidentsPage,
  AdminSystemPage,
  AdminSecurityPage,
  AdminAuditLogsPage,
  AdminSettingsPage,
  AdminProfilePage,
  AdminHonoraryTitlesPage,
  AdminBadgesPage,
  AdminPayOSPage,
} from './components/admin/pages/AdminPages';

// Legal Policy Views
import { LegalPageView } from './components/views/LegalPageView';
import { FeatureUnavailableView } from './components/views/FeatureUnavailableView';

import { ScrollToTopOnNavigation } from './components/common/ScrollToTopOnNavigation';
import { ScrollToTopButton } from './components/common/ScrollToTopButton';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PwaInstallGuideModal } from './components/common/PwaInstallGuideModal';
import { usePwaInstall } from './context/PwaInstallContext';

// Component to restore audio navigation - DISABLED to prevent auto-redirect
// const AudioRestorationHandler = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const hasRestored = React.useRef(false);

//   useEffect(() => {
//     if (hasRestored.current) return;
//     hasRestored.current = true;

//     // Only restore if we're on the home page and not already on a story page
//     // Also check if we're not on a story or listen page to avoid redirecting when user reloads those pages
//     const isStoryPage = location.pathname.startsWith('/story/') || location.pathname.startsWith('/listen/');
    
//     if (!isStoryPage && (location.pathname === '/' || location.pathname === '/explore')) {
//       const currentAudio = storage.getCurrentAudio();
//       if (currentAudio && currentAudio.storySlug) {
//         console.log('[AudioRestorationHandler] Restoring navigation to story:', currentAudio.storySlug);
//         // Navigate to the story detail page
//         navigate(`/story/${currentAudio.storySlug}`, { replace: true });
//       }
//     }
//   }, [location.pathname, navigate]);

//   return null;
// };

export function App() {
  const pwa = usePwaInstall();

  useEffect(() => {
    cleanupLegacyReferralStorage();
    
    // Clear potentially corrupted localStorage data
    const clearCorruptedData = () => {
      const keysToCheck = ['toptruyenaudio:admin-stories:v1', 'toptruyenaudio:admin-chapters:v1', 'toptruyenaudio:admin-data:v1'];
      keysToCheck.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed) && (key.includes('stories') || key.includes('chapters'))) {
              console.warn(`[App] Clearing corrupted data from ${key}`);
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.warn(`[App] Failed to check ${key}, clearing it:`, e);
          localStorage.removeItem(key);
        }
      });
    };
    
    clearCorruptedData();
    
    // Global error handler to catch .find errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('find is not a function')) {
        console.error('[Global Error Handler] .find error detected:', event);
        console.error('[Global Error Handler] Error stack:', event.error?.stack);
        console.error('[Global Error Handler] Checking localStorage for corrupted data...');
        
        // Check localStorage for potential corrupted data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed && !Array.isArray(parsed) && (key.includes('stories') || key.includes('chapters') || key.includes('genres'))) {
                console.warn(`[Global Error Handler] Potentially corrupted data in ${key}:`, typeof parsed, parsed);
              }
            }
          } catch (e) {
            console.warn(`[Global Error Handler] Failed to parse ${key}:`, e);
          }
        });
      }
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTopOnNavigation />
              <AuthProvider>
                <NotificationProvider>
                  <BadgeToastProvider>
                    <AudioPlayerProvider>
                      <Routes>
              
              {/* Public Website Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomeView />} />
                <Route path="/explore" element={<ExploreView />} />
                <Route path="/genres" element={<GenresView />} />
                <Route path="/genres/:genreId" element={<GenresView />} />
                <Route path="/rankings" element={<LeaderboardView />} />
                <Route path="/search" element={<SearchView />} />
                <Route path="/story/:slug" element={<StoryDetailView />} />
                <Route path="/listen/:storySlug/:chapterId" element={<AudioPlayerView />} />
                <Route path="/users/:userId" element={<PublicProfileView />} />

                {/* Auth Page Routes */}
                <Route path="/login" element={<LoginView />} />
                <Route path="/register" element={<RegisterView />} />
                <Route path="/forgot-password" element={<ForgotPasswordView />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/unauthorized" element={<UnauthorizedView />} />

                {/* Deferred Referral & Affiliate Routes */}
                <Route path="/referrals" element={<FeatureUnavailableView title="Chương Trình Giới Thiệu" />} />
                <Route path="/affiliate" element={<FeatureUnavailableView title="Chương Trình Tiếp Thị Affiliate" />} />
                <Route path="/partner/campaigns" element={<FeatureUnavailableView title="Quản Lý Chiến Dịch Tiếp Thị" />} />
                <Route path="/partner/referrals" element={<FeatureUnavailableView title="Thống Kê Giới Thiệu Đối Tác" />} />
                <Route path="/partner/commissions" element={<FeatureUnavailableView title="Đối Soát Hoa Hồng Tiếp Thị" />} />

                {/* Legal & Help Pages */}
                <Route path="/terms" element={<LegalPageView type="terms" />} />
                <Route path="/privacy" element={<LegalPageView type="privacy" />} />
                <Route path="/copyright" element={<LegalPageView type="copyright" />} />
                <Route path="/copyright/takedown" element={<LegalPageView type="copyright-takedown" />} />
                <Route path="/payment-policy" element={<LegalPageView type="payment-policy" />} />
                <Route path="/withdrawal-policy" element={<LegalPageView type="withdrawal-policy" />} />
                <Route path="/help" element={<SupportView />} />
                <Route path="/contact" element={<SupportView />} />
                <Route path="/support" element={<SupportView />} />
                <Route path="/support/conversations" element={<SupportView />} />
                <Route path="/report-bug" element={<LegalPageView type="report-bug" />} />

                {/* Protected User Account & Library Routes */}
                <Route
                  path="/library"
                  element={
                    <ProtectedRoute>
                      <LibraryView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <FavoritesView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listening"
                  element={
                    <ProtectedRoute>
                      <ListeningView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/support"
                  element={
                    <ProtectedRoute>
                      <SupportView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/badges"
                  element={
                    <ProtectedRoute>
                      <UserBadgesView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/edit"
                  element={
                    <ProtectedRoute>
                      <AccountEditView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/subscription"
                  element={
                    <ProtectedRoute>
                      <SubscriptionManagementView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/profile"
                  element={
                    <ProtectedRoute>
                      <AccountView />
                    </ProtectedRoute>
                  }
                />
                <Route path="/premium" element={<PremiumView />} />
                <Route
                  path="/library/playlists"
                  element={
                    <ProtectedRoute>
                      <PlaylistsView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/library/playlists/:playlistId"
                  element={
                    <ProtectedRoute>
                      <PlaylistDetailView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/become-creator"
                  element={
                    <ProtectedRoute>
                      <BecomeCreatorView />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Management Dashboard Portals */}
              <Route element={<DashboardLayout />}>
                <Route
                  path="/creator"
                  element={
                    <RoleRoute allowedRoles={[UserRole.CREATOR, UserRole.ADMIN]}>
                      <CreatorStudioView />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/partner"
                  element={
                    <RoleRoute allowedRoles={[UserRole.PARTNER, UserRole.ADMIN]}>
                      <PartnerPortalView />
                    </RoleRoute>
                  }
                />
              </Route>

              {/* Standalone Owner Admin Portal */}
              <Route
                element={
                  <RoleRoute allowedRoles={[UserRole.ADMIN]}>
                    <AdminLayout />
                  </RoleRoute>
                }
              >
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/users/:userId" element={<AdminUsersPage />} />
                <Route path="/admin/badges" element={<AdminBadgesPage />} />
                <Route path="/admin/creators" element={<AdminCreatorsPage />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="/admin/stories" element={<AdminStoriesPage />} />
                <Route path="/admin/stories/:storyId" element={<AdminStoriesPage />} />
                <Route path="/admin/genres" element={<AdminGenresPage />} />
                <Route path="/admin/comments" element={<AdminCommentsPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/copyright" element={<AdminCopyrightPage />} />
                <Route path="/admin/support" element={<AdminSupportPage />} />
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/maintenance" element={<AdminMaintenancePage />} />
                <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
                <Route path="/admin/system" element={<AdminSystemPage />} />
                <Route path="/admin/security" element={<AdminSecurityPage />} />
                <Route path="/admin/security/:alertId" element={<AdminSecurityPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/payos" element={<AdminPayOSPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/admin/*" element={<AdminNotFoundView />} />
              </Route>

              {/* 404 Not Found Catch-All */}
              <Route path="*" element={<NotFoundView />} />

            </Routes>

            {/* Global PWA Install Guide Modal */}
            <PwaInstallGuideModal isOpen={pwa.isGuideOpen} onClose={pwa.closeGuide} />
          </AudioPlayerProvider>
        </BadgeToastProvider>
      </NotificationProvider>
      </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
