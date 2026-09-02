import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  Clock,
  Info,
  CheckCircle2,
  Mic,
  Share2,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  EyeOff,
  Search,
  ListFilter,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
  onDelete?: (id: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  onClose,
  notification: initialNotification,
  onDelete: propOnDelete,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    deleteNotification: contextDeleteNotification,
  } = useNotifications();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'LIST' | 'DETAIL'>('DETAIL');

  useBodyScrollLock(isOpen);

  // Set initial selected notification when modal opens or initialNotification changes
  useEffect(() => {
    if (initialNotification) {
      setSelectedId(initialNotification.id);
      setMobileTab('DETAIL');
    } else if (notifications.length > 0 && !selectedId) {
      setSelectedId(notifications[0].id);
      setMobileTab('DETAIL');
    }
  }, [initialNotification, notifications]);

  // Handle case when active selected notification is deleted
  useEffect(() => {
    if (selectedId && !notifications.some((n) => n.id === selectedId)) {
      if (notifications.length > 0) {
        setSelectedId(notifications[0].id);
      } else {
        setSelectedId(null);
      }
    }
  }, [notifications, selectedId]);

  if (!isOpen) return null;

  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const currentNotif = notificationsArray.find((n) => n.id === selectedId) || initialNotification || notificationsArray[0] || null;

  const filteredNotifications = notificationsArray.filter((n) => {
    if (activeFilter === 'UNREAD' && n.isRead) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const currentIndex = filteredNotifications.findIndex((n) => n.id === currentNotif?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredNotifications.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      const prevNotif = filteredNotifications[currentIndex - 1];
      setSelectedId(prevNotif.id);
      if (!prevNotif.isRead) markAsRead(prevNotif.id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const nextNotif = filteredNotifications[currentIndex + 1];
      setSelectedId(nextNotif.id);
      if (!nextNotif.isRead) markAsRead(nextNotif.id);
    }
  };

  const handleDelete = (id: string) => {
    if (propOnDelete) {
      propOnDelete(id);
    } else {
      contextDeleteNotification(id);
    }
  };

  const getIcon = (audience: string) => {
    switch (audience) {
      case 'PREMIUM':
        return <CheckCircle2 className="w-5 h-5 text-amber-400" />;
      case 'CREATOR':
        return <Mic className="w-5 h-5 text-emerald-400" />;
      case 'PARTNER':
        return <Share2 className="w-5 h-5 text-indigo-400" />;
      case 'ADMIN':
        return <ShieldCheck className="w-5 h-5 text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getBadgeColor = (audience: string) => {
    switch (audience) {
      case 'PREMIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CREATOR':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PARTNER':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'PREMIUM':
        return 'Thành Viên Premium';
      case 'CREATOR':
        return 'Tác Giả / Creator';
      case 'PARTNER':
        return 'Đối Tác Affiliate';
      case 'ADMIN':
        return 'Quản Trị Viên';
      default:
        return 'Hệ Thống';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          {/* Modal Container Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-4xl h-[78vh] sm:h-[82vh] max-h-[680px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto z-10"
          >
          {/* Top Main Header */}
          <div className="p-2.5 sm:p-4 border-b border-slate-200 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base truncate">Chi Tiết Thông Báo</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold shrink-0">
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                  Quản lý, xem nội dung và đánh dấu trạng thái thông báo
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đọc Tất Cả</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Đóng"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Tab Toggle (< md screen) */}
          <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-1 shrink-0">
            <button
              onClick={() => setMobileTab('LIST')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'LIST'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Danh Sách ({filteredNotifications.length})</span>
            </button>
            <button
              onClick={() => setMobileTab('DETAIL')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mobileTab === 'DETAIL'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Nội Dung Chi Tiết</span>
            </button>
          </div>

          {/* Main Content Area: Split View for Desktop/Tablet, Toggle for Mobile */}
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* LEFT PANEL: Notification List */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 flex flex-col min-h-0 ${
                mobileTab === 'LIST' ? 'flex' : 'hidden md:flex'
              }`}
            >
              {/* Filter & Search Bar */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 space-y-2 shrink-0 bg-white/60 dark:bg-slate-900/40">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm thông báo..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[36px]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      activeFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Tất cả ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('UNREAD')}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      activeFilter === 'UNREAD'
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Chưa đọc ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif) => {
                    const isSelected = notif.id === currentNotif?.id;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setSelectedId(notif.id);
                          setMobileTab('DETAIL');
                          if (!notif.isRead) markAsRead(notif.id);
                        }}
                        className={`p-3.5 sm:p-4 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer relative group flex gap-3 ${
                          isSelected ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : ''
                        } ${!notif.isRead ? 'bg-white dark:bg-slate-900/80 font-semibold' : ''}`}
                      >
                        {/* Audience Icon */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${getBadgeColor(
                            notif.targetAudience
                          ).split(' ')[0]}`}
                        >
                          {getIcon(notif.targetAudience)}
                        </div>

                        {/* Title & Preview */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                              {getAudienceLabel(notif.targetAudience)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                              {(() => {
                                try {
                                  const date = new Date(notif.sentAt.replace(/-/g, '/'));
                                  if (isNaN(date.getTime())) return 'N/A';
                                  return formatDistanceToNow(date, {
                                    addSuffix: false,
                                    locale: vi,
                                  });
                                } catch (e) {
                                  return 'N/A';
                                }
                              })()}
                            </span>
                          </div>

                          <h4
                            className={`text-xs sm:text-sm font-bold line-clamp-1 ${
                              !notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {notif.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {notif.content}
                          </p>

                          {/* Quick Read/Unread Status Toggle in List */}
                          <div className="pt-1 flex items-center justify-between">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReadStatus(notif.id);
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                                notif.isRead
                                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400'
                                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                              }`}
                            >
                              {notif.isRead ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> Đã đọc
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> Chưa đọc
                                </>
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notif.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
                              title="Xóa thông báo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center space-y-2 text-slate-400 dark:text-slate-500">
                    <Bell className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-xs">Không tìm thấy thông báo phù hợp</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Notification Detail View */}
            <div
              className={`flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900/90 overflow-hidden ${
                mobileTab === 'DETAIL' ? 'flex' : 'hidden md:flex'
              }`}
            >
              {currentNotif ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Detail Sub Header / Controls */}
                  <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    {/* Left: Mobile Back Button & Sequential Counter */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMobileTab('LIST')}
                        className="md:hidden p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Danh Sách</span>
                      </button>

                      {filteredNotifications.length > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold bg-white dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                          {currentIndex >= 0 ? currentIndex + 1 : 1} / {filteredNotifications.length}
                        </div>
                      )}
                    </div>

                    {/* Right: Mark Read/Unread Toggle & Next/Prev Controls */}
                    <div className="flex items-center gap-2">
                      {/* Read Status Toggle Button */}
                      <button
                        onClick={() => toggleReadStatus(currentNotif.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                          currentNotif.isRead
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400'
                            : 'bg-cyan-500 text-slate-950 border-cyan-400 hover:bg-cyan-400 font-extrabold shadow-md'
                        }`}
                      >
                        {currentNotif.isRead ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>Đánh dấu CHƯA ĐỌC</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đánh dấu ĐÃ ĐỌC</span>
                          </>
                        )}
                      </button>

                      {/* Previous & Next Navigation Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handlePrev}
                          disabled={!hasPrev}
                          className="p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer"
                          title="Thông báo trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={!hasNext}
                          className="p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer"
                          title="Thông báo tiếp theo"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(currentNotif.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                        title="Xóa thông báo này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Main Detail Body */}
                  <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
                    {/* Top Audience & Status Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            getBadgeColor(currentNotif.targetAudience).split(' ')[0]
                          }`}
                        >
                          {getIcon(currentNotif.targetAudience)}
                        </div>
                        <div>
                          <span
                            className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(
                              currentNotif.targetAudience
                            )}`}
                          >
                            {getAudienceLabel(currentNotif.targetAudience)}
                          </span>
                        </div>
                      </div>

                      {/* Read Status Pill */}
                      <div className="flex items-center gap-2">
                        {currentNotif.isRead ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            Đã Đọc
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            Chưa Đọc
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notification Title & Meta Info */}
                    <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                        {currentNotif.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {(() => {
                            try {
                              const date = new Date(currentNotif.sentAt.replace(/-/g, '/'));
                              if (isNaN(date.getTime())) return 'N/A';
                              return formatDistanceToNow(date, {
                                addSuffix: true,
                                locale: vi,
                              });
                            } catch (e) {
                              return 'N/A';
                            }
                          })()}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span>Người gửi: <strong className="text-slate-800 dark:text-slate-200">{currentNotif.sentBy}</strong></span>
                      </div>
                    </div>

                    {/* Main Content Box */}
                    <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800/80 shadow-inner">
                      <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {currentNotif.content}
                      </p>
                    </div>

                    {/* Footer Guidance / Tip */}
                    <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-cyan-700 dark:text-cyan-300">Mẹo:</strong> Nhấp danh sách bên trái hoặc sử dụng nút mũi tên <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-cyan-700 dark:text-cyan-300">←</code> <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-cyan-700 dark:text-cyan-300">→</code> để chuyển giữa các thông báo.
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="p-2.5 sm:p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={onClose}
                      className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <Bell className="w-12 h-12 text-slate-400 dark:text-slate-700" />
                  <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Chưa chọn thông báo nào</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Vui lòng chọn một thông báo từ danh sách bên trái để xem nội dung chi tiết.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
