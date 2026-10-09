import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, CheckCircle2, AlertCircle, Info, Mic, Share2, ShieldCheck } from 'lucide-react';
import { useNotifications, Notification, getNotificationIcon, getNotificationTypeLabel } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, openNotificationModal } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = (notif: Notification) => {
    markAsRead(notif.id);
    openNotificationModal(notif);
    setIsOpen(false);
  };

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 min-w-[40px] min-h-[40px] flex items-center justify-center relative transition-all"
        aria-label="Thông báo"
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-cyan-600 dark:text-cyan-400' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-[330px] sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[150] overflow-hidden whitespace-normal"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Thông Báo Hệ Thống</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors uppercase tracking-wider"
                >
                  Đánh dấu tất cả là đã đọc
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${!notif.isRead ? 'bg-cyan-500/5' : ''}`}
                    >
                      {!notif.isRead && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-500 rounded-full" />
                      )}
                      
                      <div className="flex gap-3">
                        <div className={`mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
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
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
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
                          <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {notif.content}
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Bạn chưa có thông báo mới</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Các cập nhật hệ thống và tin nhắn quan trọng sẽ hiển thị tại đây.</p>
                  </div>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    openNotificationModal(notifications[0]);
                    setIsOpen(false);
                  }}
                  className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Xem tất cả lịch sử thông báo ({notifications.length})
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
