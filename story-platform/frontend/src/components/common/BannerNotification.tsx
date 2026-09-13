import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, AlertCircle, CheckCircle, Info, Gift } from 'lucide-react';
import { bannersRepository, Banner } from '../../services/repositories/BannersRepository';
import { useAuth } from '../../context/AuthContext';

interface BannerNotificationProps {
  className?: string;
}

const DISMISSAL_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

const getBannerDismissalTime = (bannerId: string): number | null => {
  try {
    const key = `toptruyenaudio_banner_dismissed_${bannerId}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

const setBannerDismissed = (bannerId: string) => {
  const key = `toptruyenaudio_banner_dismissed_${bannerId}`;
  const now = Date.now();
  localStorage.setItem(key, now.toString());
};

const isBannerDismissed = (bannerId: string): boolean => {
  const dismissedAt = getBannerDismissalTime(bannerId);
  if (!dismissedAt) return false;
  const now = Date.now();
  return now - dismissedAt < DISMISSAL_DURATION;
};

const cleanupBannerDismissal = (bannerId: string) => {
  const key = `toptruyenaudio_banner_dismissed_${bannerId}`;
  localStorage.removeItem(key);
};

export const BannerNotification: React.FC<BannerNotificationProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    // Only load banners for logged-in users
    if (!user) {
      setBanner(null);
      setIsModalOpen(false);
      return;
    }

    const loadBanners = async () => {
      const fetchedBanners = await bannersRepository.fetchBanners(user.id);
      // Only show the first banner (highest priority) that is not dismissed
      if (fetchedBanners.length > 0) {
        const activeBanner = fetchedBanners.find(b => !isBannerDismissed(b.id));
        if (activeBanner) {
          setBanner(activeBanner);
          setIsModalOpen(true);
        } else {
          setBanner(null);
          setIsModalOpen(false);
        }
      } else {
        setBanner(null);
        setIsModalOpen(false);
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
    if (isDismissing) return;
    
    setIsDismissing(true);
    try {
      console.log('[BannerNotification] Dismissing banner:', bannerId);
      // Save dismissal time to localStorage (client-side only)
      setBannerDismissed(bannerId);
      console.log('[BannerNotification] Banner dismissed successfully');
      setBanner(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('[BannerNotification] Failed to dismiss banner:', error);
      alert('Không thể đóng banner. Vui lòng thử lại.');
    } finally {
      setIsDismissing(false);
    }
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

  if (!isModalOpen || !banner) return null;

  const Icon = getIcon(banner.type);

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-2xl lg:max-w-4xl"
            >
              <div
                className="rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${banner.backgroundColor} 0%, ${adjustColor(banner.backgroundColor, -20)} 100%)`,
                  color: banner.textColor,
                }}
              >
                {/* Header */}
                <div className="relative p-6 sm:p-8 lg:p-10 pb-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 rounded-full hover:bg-white/10 transition-colors"
                    style={{ color: banner.textColor }}
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    {banner.imageUrl && (
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.title}
                          className="w-full sm:w-32 sm:h-32 lg:w-48 lg:h-48 object-cover rounded-2xl shadow-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: banner.textColor }} />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                          {banner.type}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3" style={{ color: banner.textColor }}>
                        {banner.title}
                      </h3>
                      <p className="text-sm sm:text-base lg:text-lg opacity-90 leading-relaxed" style={{ color: banner.textColor }}>
                        {banner.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10 pt-4">
                  <div className="flex justify-end">
                    {/* Dismiss button */}
                    <button
                      onClick={() => handleDismiss(banner.id)}
                      disabled={isDismissing}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: banner.textColor 
                      }}
                    >
                      {isDismissing ? 'Đang đóng...' : 'Đóng 3 giờ'}
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
