import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BadgeAwardNotification } from '../types/badges';
import { badgeRepository } from '../services/repositories/BadgeRepository';
import { badgeEventService } from '../services/BadgeEventService';
import { BadgeAwardToast } from '../components/badges/BadgeAwardToast';
import { useAuth } from './AuthContext';

export { BadgeAwardToast };

interface BadgeToastContextType {
  enqueueBadgeAward: (notification: BadgeAwardNotification) => void;
  checkUnseenBadges: () => Promise<void>;
  currentBadgeToast: BadgeAwardNotification | null;
  dismissCurrentToast: () => void;
}

const BadgeToastContext = createContext<BadgeToastContextType | undefined>(undefined);

export const BadgeToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<BadgeAwardNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<BadgeAwardNotification | null>(null);
  const shownIdsRef = useRef<Set<string>>(new Set());

  const checkUnseenBadges = useCallback(async () => {
    if (!user?.id) return;
    try {
      const unseen = await badgeRepository.getUnseenBadgeNotifications(user.id);
      if (unseen.length > 0) {
        setQueue((prev) => {
          const existingInQueue = new Set(prev.map((n) => n.assignmentId));
          const newItems = unseen.filter(
            (n) => !existingInQueue.has(n.assignmentId) && !shownIdsRef.current.has(n.assignmentId)
          );
          return [...prev, ...newItems];
        });
      }
    } catch (e) {
      console.error('[BadgeToastProvider] Failed to check unseen badges:', e);
    }
  }, [user?.id]);

  const enqueueBadgeAward = useCallback((notification: BadgeAwardNotification) => {
    if (!shownIdsRef.current.has(notification.assignmentId)) {
      setQueue((prev) => [...prev, notification]);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      checkUnseenBadges();
    }
  }, [user?.id, checkUnseenBadges]);

  useEffect(() => {
    const unsubscribe = badgeEventService.onBadgeAwarded((assignment) => {
      if (assignment.badge) {
        enqueueBadgeAward({
          assignmentId: assignment.id,
          badge: assignment.badge,
          awardedAt: assignment.assignedAt,
        });
      } else {
        checkUnseenBadges();
      }
    });
    return unsubscribe;
  }, [enqueueBadgeAward, checkUnseenBadges]);

  // Process queue sequentially
  useEffect(() => {
    if (!currentNotification && queue.length > 0) {
      const next = queue[0];
      shownIdsRef.current.add(next.assignmentId);

      // Persist that toast was shown immediately to prevent duplicate toasts on page refresh
      badgeRepository.markAwardAsSeen(next.assignmentId).catch(() => {});
      badgeRepository.markToastShown(next.assignmentId).catch(() => {});

      setCurrentNotification(next);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, currentNotification]);

  const handleCloseToast = useCallback(async () => {
    if (currentNotification) {
      try {
        await badgeRepository.markAwardAsSeen(currentNotification.assignmentId);
        await badgeRepository.markToastShown(currentNotification.assignmentId);
      } catch (e) {
        console.error('[BadgeToastProvider] Failed to mark award as seen:', e);
      }
      setCurrentNotification(null);
    }
  }, [currentNotification]);

  return (
    <BadgeToastContext.Provider
      value={{
        enqueueBadgeAward,
        checkUnseenBadges,
        currentBadgeToast: currentNotification,
        dismissCurrentToast: handleCloseToast,
      }}
    >
      {children}
      {currentNotification && (
        <BadgeAwardToast
          badge={currentNotification.badge}
          durationMs={8000}
          onClose={handleCloseToast}
        />
      )}
    </BadgeToastContext.Provider>
  );
};

export const useBadgeToast = (): BadgeToastContextType => {
  const context = useContext(BadgeToastContext);
  if (!context) {
    throw new Error('useBadgeToast must be used within a BadgeToastProvider');
  }
  return context;
};

