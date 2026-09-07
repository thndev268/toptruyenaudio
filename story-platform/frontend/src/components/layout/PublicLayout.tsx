import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { ScrollToTopButton } from '../common/ScrollToTopButton';
import { FloatingZaloButton } from '../common/FloatingZaloButton';
import { SupportChat } from '../common/SupportChat';
import { Play, X, Wrench } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { MiniAudioPlayer } from '../player/MiniAudioPlayer';
import { FullAudioPlayerModal } from '../player/FullAudioPlayerModal';
import { AuthGateModal } from '../common/AuthGateModal';
import { PremiumUpgradeModal } from '../common/PremiumUpgradeModal';
import { BannedUserModal } from '../common/BannedUserModal';
import { BannerNotification } from '../common/BannerNotification';
import { useAuth } from '../../context/AuthContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { motionTokens } from '../../config/motionTokens';

export const PublicLayout: React.FC = () => {
  const { isBanned, banReason } = useAuth();
  const location = useLocation();
  const { 
    currentStory, 
    currentChapter, 
    isPlaying, 
    togglePlayPause, 
    isPlayerDismissed,
    isAuthModalOpen,
    closeAuthModal,
    isPremiumModalOpen,
    closePremiumModal
  } = useAudioPlayer();
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [maintConfig, setMaintConfig] = useState(() => adminRepository.getMaintenanceConfig());

  useEffect(() => {
    const syncMaint = () => {
      setMaintConfig(adminRepository.getMaintenanceConfig());
    };

    window.addEventListener('toptruyenaudio_admin_sync', syncMaint);
    window.addEventListener('storage', syncMaint);
    return () => {
      window.removeEventListener('toptruyenaudio_admin_sync', syncMaint);
      window.removeEventListener('storage', syncMaint);
    };
  }, []);

  const showResumePrompt = !isPlaying && currentStory && currentChapter && !resumeDismissed;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative">
      
      {/* Live System Maintenance Banner */}
      {maintConfig.isEnabled && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-b border-rose-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-rose-200 z-[100] sticky top-0 backdrop-blur-md shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <Wrench className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white uppercase font-mono tracking-wider mr-2 text-[11px]">
                Hệ Thống Bảo Trì:
              </span>
              <span className="text-slate-300 font-medium">
                {maintConfig.bannerMessage}
              </span>
            </div>
          </div>
          {maintConfig.scheduledEnd && (
            <div className="hidden sm:block text-[10px] font-mono text-rose-300 font-bold shrink-0 bg-rose-900/40 px-2.5 py-1 rounded-full border border-rose-500/30">
              Dự kiến: {maintConfig.scheduledEnd}
            </div>
          )}
        </div>
      )}

      {/* Banner Notification */}
      <BannerNotification />

      {/* Resume Listening Notification Prompt */}
      {showResumePrompt && (
        <div className="bg-gradient-to-r from-cyan-900/90 to-blue-900/90 border-b border-cyan-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs animate-fadeIn z-50 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <p className="truncate text-slate-200">
              <strong className="text-white">Tiếp tục nghe:</strong> {currentStory.title} - Tập {currentChapter.number}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={togglePlayPause}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg flex items-center gap-1 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Phát Tiếp</span>
            </button>
            <button
              onClick={() => setResumeDismissed(true)}
              className="p-1 text-slate-400 hover:text-white"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar />

      <Breadcrumbs />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pt-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={motionTokens.pageTransition.initial}
            animate={motionTokens.pageTransition.animate}
            exit={motionTokens.pageTransition.exit}
            transition={motionTokens.pageTransition.transition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Audio Players */}
      {!isPlayerDismissed && <MiniAudioPlayer />}
      <FullAudioPlayerModal />
      <ScrollToTopButton />
      <FloatingZaloButton />
      <SupportChat />

      {/* Access Gate Modals */}
      <BannedUserModal 
        isOpen={isBanned} 
        reason={banReason} 
      />
      <AuthGateModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
      />
      <PremiumUpgradeModal 
        isOpen={isPremiumModalOpen} 
        onClose={closePremiumModal} 
      />

    </div>
  );
};
