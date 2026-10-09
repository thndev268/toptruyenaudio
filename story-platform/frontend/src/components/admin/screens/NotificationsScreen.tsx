import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Send,
  Radio,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  X,
  Gift,
  BookOpen,
  AlertTriangle,
  Info,
  Headphones,
  Shield,
  MessageSquare,
  Filter,
  Eye,
  User,
} from 'lucide-react';
import { AdminBroadcastNotification } from '../../../types/admin';
import { adminRepository } from '../../../services/repositories/AdminRepository';

interface NotificationsScreenProps {
  notifications: AdminBroadcastNotification[];
  userCounts: { total: number; premium: number; creator: number; partner: number };
  onSendBroadcast: (
    title: string,
    content: string,
    type: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER' | 'WARNING' | 'ERROR' | 'SUPPORT',
    targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER'
  ) => Promise<void>;
  onDeleteBroadcast?: (notification: AdminBroadcastNotification) => void;
}

const DRAFT_STORAGE_KEY = 'broadcast_draft';

const notificationTypeConfig: Record<string, any> = {
  NEW_USER: { icon: Users, color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', label: 'Người dùng mới' },
  NEW_STORY: { icon: BookOpen, color: 'bg-blue-500/10 text-blue-300 border-blue-500/30', label: 'Truyện mới' },
  NEW_CHAPTER: { icon: Headphones, color: 'bg-purple-500/10 text-purple-300 border-purple-500/30', label: 'Chương mới' },
  PROMOTION: { icon: Gift, color: 'bg-amber-500/10 text-amber-300 border-amber-500/30', label: 'Khuyến mãi' },
  SYSTEM: { icon: Shield, color: 'bg-slate-500/10 text-slate-300 border-slate-500/30', label: 'Hệ thống' },
  OTHER: { icon: Info, color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30', label: 'Khác' },
  WARNING: { icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-300 border-orange-500/30', label: 'Cảnh báo' },
  ERROR: { icon: AlertCircle, color: 'bg-rose-500/10 text-rose-300 border-rose-500/30', label: 'Lỗi' },
  SUPPORT: { icon: MessageSquare, color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30', label: 'Hỗ trợ' },
  BADGE_AWARD: { icon: Gift, color: 'bg-amber-500/10 text-amber-300 border-amber-500/30', label: 'Danh hiệu' },
};

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  userCounts,
  onSendBroadcast,
  onDeleteBroadcast,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER'>('ALL');
  const [notificationType, setNotificationType] = useState<'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER' | 'WARNING' | 'ERROR' | 'SUPPORT'>('SYSTEM');
  const [isComposing, setIsComposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{ title?: string; content?: string }>({});
  
  // Filtering state
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAudience, setFilterAudience] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filterType !== 'ALL' && notif.type !== filterType) return false;
    if (filterStatus !== 'ALL' && notif.status !== filterStatus) return false;
    if (filterAudience !== 'ALL' && notif.targetAudience !== filterAudience) return false;
    return true;
  });

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterAudience('ALL');
  };

  const hasActiveFilters = filterType !== 'ALL' || filterStatus !== 'ALL' || filterAudience !== 'ALL';

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title || draft.content) {
          setTitle(draft.title || '');
          setContent(draft.content || '');
          setTargetAudience(draft.targetAudience || 'ALL');
          setNotificationType(draft.notificationType || 'SYSTEM');
          try {
            const date = new Date(draft.savedAt);
            setLastSaved(isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('vi-VN'));
          } catch (e) {
            setLastSaved('N/A');
          }
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Auto-save draft with debounce
  useEffect(() => {
    if (title || content) {
      setIsSaving(true);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const draft = {
          title,
          content,
          targetAudience,
          notificationType,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setLastSaved(new Date().toLocaleString('vi-VN'));
        setIsSaving(false);
      }, 1000);
    }
  }, [title, content, targetAudience, notificationType]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Real-time validation
  useEffect(() => {
    const errors: { title?: string; content?: string } = {};
    
    if (title.length > 100) {
      errors.title = 'Tiêu đề không được quá 100 ký tự';
    }
    
    if (content.length > 500) {
      errors.content = 'Nội dung không được quá 500 ký tự';
    }
    
    setValidationErrors(errors);
  }, [title, content]);

  // Clear draft after successful send
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setLastSaved('');
    setNotificationType('SYSTEM');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!title.trim()) {
      setValidationErrors({ title: 'Vui lòng nhập tiêu đề' });
      return;
    }
    
    if (!content.trim()) {
      setValidationErrors({ content: 'Vui lòng nhập nội dung' });
      return;
    }
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    await onSendBroadcast(title.trim(), content.trim(), notificationType, targetAudience);
    
    // Clear form after successful send
    clearDraft();
    setTitle('');
    setContent('');
    setTargetAudience('ALL');
    setNotificationType('SYSTEM');
    setValidationErrors({});
    setIsComposing(false);
  };

  const handleCancel = () => {
    if (title || content) {
      if (confirm('Bạn có chắc muốn hủy? Nội dung nháp sẽ bị mất.')) {
        clearDraft();
        setTitle('');
        setContent('');
        setTargetAudience('ALL');
        setNotificationType('SYSTEM');
        setValidationErrors({});
        setIsComposing(false);
      }
    } else {
      setIsComposing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComposing && (e.metaKey || e.ctrlKey)) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit(e as any);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComposing]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Bell className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Kênh Truyền Thông Hệ Thống
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Thông Báo & Phát Sóng Toàn Sàn (Broadcast)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Gửi tin tức cập nhật, sự kiện ra mắt audio và thông điệp vận hành tới toàn thể thính giả
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsComposing(!isComposing)}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer min-h-[42px] font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>{isComposing ? 'Đóng Soạn Thảo' : 'Soạn Thông Báo Mới'}</span>
        </button>
      </div>

      {/* Broadcast Composer */}
      {isComposing && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-scaleUp"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Soạn Tin Nhắn Broadcast Toàn Sàn</span>
            </h3>
            
            {/* Auto-save indicator */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Save className="w-3 h-3 animate-spin" />
                  Đang lưu...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Đã lưu {lastSaved}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tiêu Đề Thông Báo <span className="text-rose-400">*</span>
                <span className="text-slate-500 font-normal ml-1">
                  ({title.length}/100)
                </span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ra mắt tính năng hẹn giờ nghe và chất lượng âm thanh 320kbps..."
                maxLength={100}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none min-h-[42px] transition-colors ${
                  validationErrors.title 
                    ? 'border-rose-500 focus:border-rose-500' 
                    : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
              {validationErrors.title && (
                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Loại Thông Báo
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
              >
                <option value="SYSTEM">Hệ thống</option>
                <option value="NEW_USER">Người dùng mới</option>
                <option value="NEW_STORY">Truyện mới</option>
                <option value="NEW_CHAPTER">Chương mới</option>
                <option value="PROMOTION">Khuyến mãi</option>
                <option value="WARNING">Cảnh báo</option>
                <option value="ERROR">Lỗi</option>
                <option value="SUPPORT">Hỗ trợ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Đối Tượng Nhận Tin
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
            >
              <option value="ALL">Tất cả người nghe ({userCounts.total.toLocaleString('vi-VN')} người)</option>
              <option value="PREMIUM">Chỉ thành viên Premium ({userCounts.premium.toLocaleString('vi-VN')} người)</option>
              <option value="CREATOR">Chỉ tác giả & MC ({userCounts.creator.toLocaleString('vi-VN')} người)</option>
              <option value="PARTNER">Chỉ đối tác ({userCounts.partner.toLocaleString('vi-VN')} người)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nội Dung Thông Điệp Chi Tiết <span className="text-rose-400">*</span>
              <span className="text-slate-500 font-normal ml-1">
                ({content.length}/500)
              </span>
            </label>
            <textarea
              ref={contentRef}
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông điệp sẽ hiển thị trên chuông thông báo và ứng dụng di động..."
              maxLength={500}
              className={`w-full bg-slate-950 border rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none resize-none transition-colors ${
                validationErrors.content 
                  ? 'border-rose-500 focus:border-rose-500' 
                  : 'border-slate-800 focus:border-cyan-500'
              }`}
            />
            {validationErrors.content && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.content}
              </p>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-[10px] text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span className="font-mono">Ctrl+Enter</span> để gửi • <span className="font-mono">Esc</span> để hủy
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl min-h-[40px] cursor-pointer flex items-center gap-2 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hủy</span>
            </button>
            <button
              type="submit"
              disabled={Object.keys(validationErrors).length > 0 || !title.trim() || !content.trim()}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer min-h-[40px] font-bold transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Phát Sóng Ngay</span>
            </button>
          </div>
        </form>
      )}

      {/* Broadcast History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Lịch Sử Các Bản Tin Đã Phát Sóng
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              hasActiveFilters 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ Lọc</span>
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Loại thông báo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="SYSTEM">Hệ thống</option>
                  <option value="NEW_USER">Người dùng mới</option>
                  <option value="NEW_STORY">Truyện mới</option>
                  <option value="NEW_CHAPTER">Chương mới</option>
                  <option value="PROMOTION">Khuyến mãi</option>
                  <option value="WARNING">Cảnh báo</option>
                  <option value="ERROR">Lỗi</option>
                  <option value="SUPPORT">Hỗ trợ</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="SENT">Đã gửi</option>
                  <option value="SCHEDULED">Đã lên lịch</option>
                  <option value="DRAFT">Nháp</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Đối tượng</label>
                <select
                  value={filterAudience}
                  onChange={(e) => setFilterAudience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="ALL">Toàn bộ</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="CREATOR">Tác giả</option>
                  <option value="SPECIFIC_USER">Người dùng cụ thể</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        )}

        {filteredNotifications.map((notif) => {
          const typeConfig = notificationTypeConfig[notif.type || 'OTHER'] || notificationTypeConfig.OTHER;
          const TypeIcon = typeConfig.icon;
          
          return (
            <div
              key={notif.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded ${typeConfig.color} text-[10px] font-mono font-bold border flex items-center gap-1`}>
                    <TypeIcon className="w-3 h-3" />
                    {typeConfig.label}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-300 text-[10px] font-mono font-bold border border-slate-500/30">
                    {notif.targetAudience}
                  </span>
                  {notif.targetUser && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                      <User className="w-3 h-3" />
                      <span>{notif.targetUser.displayName}</span>
                    </div>
                  )}
                  <h4 className="font-bold text-white text-sm sm:text-base">{notif.title}</h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Đã tiếp cận ~{notif.reachCount?.toLocaleString('vi-VN') || '0'} tài khoản</span>
                  </span>
                  {(notif as any).readCount !== undefined && (
                    <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1 font-bold">
                      <Eye className="w-3 h-3" />
                      <span>Đã đọc {notif.readCount?.toLocaleString('vi-VN') || '0'}</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850">
                {notif.content}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span>Người phát: {notif.sentBy}</span>
                <div className="flex items-center gap-3">
                  <span>Thời gian gửi: {notif.sentAt}</span>
                  {onDeleteBroadcast && (
                    <button
                      onClick={() => onDeleteBroadcast(notif)}
                      className="text-rose-400 hover:text-rose-300 transition-colors font-bold uppercase tracking-tighter cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
