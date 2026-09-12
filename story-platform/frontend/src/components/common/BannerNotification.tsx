import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, AlertCircle, CheckCircle, Info, Gift } from 'lucide-react';
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
  const [visibleBanner, setVisibleBanner] = useState<Banner | null>(null);

  useEffect(() => {
    // Only load banners for logged-in users
    if (!user) {
      setBanners([]);
      setVisibleBanner(null);
      return;
    }

    const loadBanners = async () => {
      const fetchedBanners = await bannersRepository.fetchBanners(user.id);
      setBanners(fetchedBanners);
      if (fetchedBanners.length > 0) {
        setVisibleBanner(fetchedBanners[0]);
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

  const handleDismiss = async () => {
    if (!visibleBanner) return;

    try {
      await bannersRepository.dismissBanner(visibleBanner.id);
      setBanners(prev => prev.filter(b => b.id !== visibleBanner.id));
      setVisibleBanner(prevBanners => {
        const remaining = banners.filter(b => b.id !== visibleBanner.id);
        return remaining.length > 0 ? remaining[0] : null;
      });
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
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

  const Icon = visibleBanner ? getIcon(visibleBanner.type) : Info;

  if (!visibleBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full"
        style={{
          backgroundColor: visibleBanner.backgroundColor,
          color: visibleBanner.textColor,
        }}
      >
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 ${className}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {visibleBanner.imageUrl && (
                <div className="flex-shrink-0">
                  <img 
                    src={visibleBanner.imageUrl} 
                    alt={visibleBanner.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-shrink-0">
                <Icon className="w-5 h-5" style={{ color: visibleBanner.textColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: visibleBanner.textColor }}>
                  {visibleBanner.title}
                </p>
                <p className="text-xs opacity-90 truncate" style={{ color: visibleBanner.textColor }}>
                  {visibleBanner.content}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
              style={{ color: visibleBanner.textColor }}
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
