import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, Eye, Sparkles, Radio, Info } from 'lucide-react';
import { adminRepository } from '../services/repositories/AdminRepository';
import { useAuth } from './AuthContext';
import { AdminBroadcastNotification } from '../types/admin';
import { NotificationDetailModal } from '../components/common/NotificationDetailModal';
import { BannedUserModal } from '../components/common/BannedUserModal';

export interface Notification extends AdminBroadcastNotification {
  isRead: boolean;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'broadcast';
  notificationId?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  openNotificationModal: (notification?: Notification) => void;
  closeNotificationModal: () => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  toggleReadStatus: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isBanned, banReason } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNotification, setModalNotification] = useState<Notification | null>(null);

  const knownNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (toastInput: Omit<ToastNotification, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastNotification = {
      ...toastInput,
      id,
      type: toastInput.type || 'broadcast',
      duration: toastInput.duration || 6000,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 4));
  };

  useEffect(() => {
    const syncNotifications = () => {
      const broadcasts = adminRepository.getNotifications();

      // Filter by role/audience
      const filteredBroadcasts = broadcasts.filter((notif) => {
        if (notif.targetAudience === 'ALL') return true;
        if (notif.targetAudience === 'PREMIUM' && user?.isPremium) return true;
        if (notif.targetAudience === 'CREATOR' && (role === 'CREATOR' || role === 'ADMIN')) return true;
        if (notif.targetAudience === 'PARTNER' && (role === 'PARTNER' || role === 'ADMIN')) return true;
        return false;
      });

      // Load read status from localStorage
      const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user?.id || 'guest'}`) || '[]');
      const deletedIds = JSON.parse(localStorage.getItem(`deleted_notifications_${user?.id || 'guest'}`) || '[]');

      const combined: Notification[] = filteredBroadcasts
        .filter((b) => !deletedIds.includes(b.id))
        .map((b) => ({
          ...b,
          isRead: readIds.includes(b.id),
        }));

      // Detect new incoming notifications for real-time toast
      if (!isFirstLoadRef.current) {
        const newItems = combined.filter((n) => !knownNotifIdsRef.current.has(n.id));
        newItems.forEach((newNotif) => {
          showToast({
            title: newNotif.title,
            message: newNotif.content,
            type: 'broadcast',
            notificationId: newNotif.id,
            duration: 7000,
          });
        });
      } else {
        isFirstLoadRef.current = false;
      }

      knownNotifIdsRef.current = new Set(combined.map((n) => n.id));
      setNotifications(combined);
    };

    syncNotifications();

    const handleSync = () => {
      syncNotifications();
    };

    window.addEventListener('toptruyenaudio_admin_sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('toptruyenaudio_admin_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [user, role]);

  const openNotificationModal = (notification?: Notification) => {
    if (notification) {
      setModalNotification(notification);
    } else if (notifications.length > 0) {
      setModalNotification(notifications[0]);
    } else {
      setModalNotification(null);
    }
    setIsModalOpen(true);
  };

  const closeNotificationModal = () => {
    setIsModalOpen(false);
    setModalNotification(null);
  };

  const markAsRead = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user?.id || 'guest'}`) || '[]');
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      localStorage.setItem(`read_notifications_${user?.id || 'guest'}`, JSON.stringify(newReadIds));

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAsUnread = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user?.id || 'guest'}`) || '[]');
    if (readIds.includes(id)) {
      const newReadIds = readIds.filter((item: string) => item !== id);
      localStorage.setItem(`read_notifications_${user?.id || 'guest'}`, JSON.stringify(newReadIds));

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  };

  const toggleReadStatus = (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif?.isRead) {
      markAsUnread(id);
    } else {
      markAsRead(id);
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(`read_notifications_${user?.id || 'guest'}`, JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    const deletedIds = JSON.parse(localStorage.getItem(`deleted_notifications_${user?.id || 'guest'}`) || '[]');
    if (!deletedIds.includes(id)) {
      const newDeletedIds = [...deletedIds, id];
      localStorage.setItem(`deleted_notifications_${user?.id || 'guest'}`, JSON.stringify(newDeletedIds));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        showToast,
        removeToast,
        openNotificationModal,
        closeNotificationModal,
        markAsRead,
        markAsUnread,
        toggleReadStatus,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}

      {/* Real-time Toast Notifications Container */}
      <div className="fixed top-16 right-3 sm:top-20 sm:right-6 z-[280] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-24px)] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
              onViewDetail={() => {
                removeToast(toast.id);
                if (toast.notificationId) {
                  markAsRead(toast.notificationId);
                  const found = notifications.find((n) => n.id === toast.notificationId);
                  openNotificationModal(found || undefined);
                } else {
                  openNotificationModal();
                }
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Global Notification Detail Modal */}
      <NotificationDetailModal
        isOpen={isModalOpen}
        onClose={closeNotificationModal}
        notification={modalNotification}
      />

      {/* Global Account Ban Alert Dialog */}
      <BannedUserModal
        isOpen={isBanned}
        reason={banReason}
      />
    </NotificationContext.Provider>
  );
};

// Sub-component for individual toast item timer & animation
const ToastItem: React.FC<{
  toast: ToastNotification;
  onClose: () => void;
  onViewDetail: () => void;
}> = ({ toast, onClose, onViewDetail }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 6000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl p-3.5 sm:p-4 text-white flex gap-3 pointer-events-auto relative overflow-hidden group hover:border-cyan-400 transition-all"
    >
      {/* Accent Glowing Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-400 to-indigo-500" />

      {/* Icon Badge */}
      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
        <Radio className="w-5 h-5 animate-pulse" />
      </div>

      {/* Body Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Thông Báo Trực Tiếp
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Vừa xong</span>
        </div>

        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 leading-snug">
          {toast.title}
        </h4>

        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
          {toast.message}
        </p>

        <div className="pt-1 flex items-center justify-between">
          <button
            onClick={onViewDetail}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Xem Chi Tiết →
          </button>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors self-start cursor-pointer"
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

