import React, { useState } from 'react';
import {
  Bell,
  Send,
  Radio,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { AdminBroadcastNotification } from '../../../types/admin';

interface NotificationsScreenProps {
  notifications: AdminBroadcastNotification[];
  onSendBroadcast: (
    title: string,
    content: string,
    targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER'
  ) => void;
  onDeleteBroadcast?: (notification: AdminBroadcastNotification) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onSendBroadcast,
  onDeleteBroadcast,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER'>('ALL');
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSendBroadcast(title.trim(), content.trim(), targetAudience);
    setTitle('');
    setContent('');
    setIsComposing(false);
  };

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
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Soạn Tin Nhắn Broadcast Toàn Sàn</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tiêu Đề Thông Báo <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ra mắt tính năng hẹn giờ nghe và chất lượng âm thanh 320kbps..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[42px]"
              />
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
                <option value="ALL">Tất cả người nghe (18.420 người)</option>
                <option value="PREMIUM">Chỉ thành viên Premium (3.200 người)</option>
                <option value="CREATOR">Chỉ tác giả & MC (450 người)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nội Dung Thông Điệp Chi Tiết
            </label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông điệp sẽ hiển thị trên chuông thông báo và ứng dụng di động..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl min-h-[40px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer min-h-[40px] font-bold"
            >
              <Send className="w-4 h-4" />
              <span>Phát Sóng Ngay</span>
            </button>
          </div>
        </form>
      )}

      {/* Broadcast History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Lịch Sử Các Bản Tin Đã Phát Sóng
        </h3>

        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2.5"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  {notif.targetAudience}
                </span>
                <h4 className="font-bold text-white text-sm sm:text-base">{notif.title}</h4>
              </div>

              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã tiếp cận ~{notif.reachCount.toLocaleString('vi-VN')} tài khoản</span>
              </span>
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
        ))}
      </div>
    </div>
  );
};
