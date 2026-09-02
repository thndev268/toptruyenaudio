import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Trash2, Clock, CheckCircle2, Mic, Share2, ShieldCheck, Info } from 'lucide-react';
import { useNotifications, Notification, getNotificationIcon, getNotificationTypeLabel } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface NotificationListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetail: (notif: Notification) => void;
}

export const NotificationListModal: React.FC<NotificationListModalProps> = ({
  isOpen,
  onClose,
  onViewDetail,
}) => {
  const { notifications, unreadCount, markAllAsRead, deleteNotification } = useNotifications();

  useBodyScrollLock(isOpen);

  const getIcon = (type?: string) => {
    const IconComponent = getNotificationIcon(type);
    const iconColor = type === 'WARNING' ? 'text-amber-400' :
                       type === 'ERROR' ? 'text-rose-400' :
                       type === 'SUPPORT' ? 'text-blue-400' :
                       type === 'PROMOTION' ? 'text-emerald-400' :
                       'text-cyan-400';
    return <IconComponent className={`w-4 h-4 ${iconColor}`} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Thông báo ({unreadCount})</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Cập nhật mới nhất</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-colors"
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => onViewDetail(notif)}
                      className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${!notif.isRead ? 'bg-cyan-500/5' : ''}`}
                    >
                      {!notif.isRead && (
                        <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                      )}
                      
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          notif.type === 'WARNING' ? 'bg-amber-500/10' :
                          notif.type === 'ERROR' ? 'bg-rose-500/10' :
                          notif.type === 'SUPPORT' ? 'bg-blue-500/10' :
                          notif.type === 'PROMOTION' ? 'bg-emerald-500/10' :
                          'bg-cyan-500/10'
                        }`}>
                          {getIcon(notif.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                              {getNotificationTypeLabel(notif.type)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(() => {
                                try {
                                  const date = new Date(notif.sentAt.replace(/-/g, '/'));
                                  if (isNaN(date.getTime())) return 'N/A';
                                  return formatDistanceToNow(date, { addSuffix: true, locale: vi });
                                } catch (e) {
                                  return 'N/A';
                                }
                              })()}
                            </span>
                          </div>
                          <h4 className={`text-sm font-bold truncate ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {notif.content}
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all rounded-xl hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 px-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto ring-8 ring-slate-50 dark:ring-slate-900">
                    <Bell className="w-10 h-10 text-slate-400 dark:text-slate-700" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Chưa có thông báo</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-[200px] mx-auto">
                      Chúng tôi sẽ gửi các tin tức và cập nhật quan trọng cho bạn tại đây.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
               <button 
                onClick={onClose}
                className="w-full py-4 px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl transition-all"
               >
                 Quay lại
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
