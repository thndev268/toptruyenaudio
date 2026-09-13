import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, AlertCircle, CheckCircle, Info, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import { bannersRepository, Banner } from '../../services/repositories/BannersRepository';
import { useAuth } from '../../context/AuthContext';

interface BannerNotificationProps {
  className?: string;
}

const DISMISSAL_STORAGE_KEY = 'banner_dismissals';

const getDismissedBanners = (): Record<string, { dismissedAt: number; expiresAt: number }> => {
  try {
    const stored = localStorage.getItem(DISMISSAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setDismissedBanner = (bannerId: string) => {
  const dismissals = getDismissedBanners();
  const now = Date.now();
  const expiresAt = now + 3 * 60 * 60 * 1000; // 3 hours
  dismissals[bannerId] = { dismissedAt: now, expiresAt };
  localStorage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify(dismissals));
};

const isBannerDismissed = (bannerId: string): boolean => {
  const dismissals = getDismissedBanners();
  const dismissal = dismissals[bannerId];
  if (!dismissal) return false;
  return Date.now() < dismissal.expiresAt;
};

const cleanupExpiredDismissals = () => {
  const dismissals = getDismissedBanners();
  const now = Date.now();
  const cleaned = Object.fromEntries(
    Object.entries(dismissals).filter(([_, value]) => now < value.expiresAt)
  );
  localStorage.setItem(DISMISSAL_STORAGE_KEY, JSON.stringify(cleaned));
};

export const BannerNotification: React.FC<BannerNotificationProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Only load banners for logged-in users
    if (!user) {
      setBanners([]);
      setCurrentIndex(0);
      setIsModalOpen(false);
      return;
    }

    const loadBanners = async () => {
      const fetchedBanners = await bannersRepository.fetchBanners(user.id);
      setBanners(fetchedBanners);
      if (fetchedBanners.length > 0) {
        setIsModalOpen(true);
      }
    };

    loadBanners();

    const unsubscribe = bannersRepository.subscribe(() => {
      loadBanners();
    });

    // Refresh banners every 5 minutes
    const interval = setInterval(() => {
      loadBanners();
    }, 5 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  const handleDismiss = async (bannerId: string) => {
    try {
      await bannersRepository.dismissBanner(bannerId);
      setBanners(prev => prev.filter(b => b.id !== bannerId));
      if (banners.length <= 1) {
        setIsModalOpen(false);
      } else if (currentIndex >= banners.length - 1) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return AlertTriangle;
      case 'ERROR':
        return AlertCircle;
      case 'SUCCESS':
        return CheckCircle;
      case 'PROMOTION':
        return Gift;
      case 'INFO':
      default:
        return Info;
    }
  };

  const currentBanner = banners[currentIndex];

  if (!isModalOpen || !currentBanner) return null;

  const Icon = getIcon(currentBanner.type);

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-lg"
            >
              <div
                className="rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${currentBanner.backgroundColor} 0%, ${adjustColor(currentBanner.backgroundColor, -20)} 100%)`,
                  color: currentBanner.textColor,
                }}
              >
                {/* Header */}
                <div className="relative p-6 pb-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                    style={{ color: currentBanner.textColor }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-start gap-4">
                    {currentBanner.imageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={currentBanner.imageUrl} 
                          alt={currentBanner.title}
                          className="w-20 h-20 object-cover rounded-xl shadow-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                          <Icon className="w-5 h-5" style={{ color: currentBanner.textColor }} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                          {currentBanner.type}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1" style={{ color: currentBanner.textColor }}>
                        {currentBanner.title}
                      </h3>
                      <p className="text-sm opacity-90 leading-relaxed" style={{ color: currentBanner.textColor }}>
                        {currentBanner.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2">
                  <div className="flex items-center justify-between">
                    {/* Navigation */}
                    {banners.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrev}
                          disabled={banners.length <= 1}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                          style={{ color: currentBanner.textColor }}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium" style={{ color: currentBanner.textColor }}>
                          {currentIndex + 1} / {banners.length}
                        </span>
                        <button
                          onClick={handleNext}
                          disabled={banners.length <= 1}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                          style={{ color: currentBanner.textColor }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Dismiss button */}
                    <button
                      onClick={() => handleDismiss(currentBanner.id)}
                      className="px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: currentBanner.textColor 
                      }}
                    >
                      Đóng 3 giờ
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
