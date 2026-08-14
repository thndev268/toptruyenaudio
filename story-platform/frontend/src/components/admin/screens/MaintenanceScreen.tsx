import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { AdminMaintenanceConfig } from '../../../types/admin';

interface MaintenanceScreenProps {
  config: AdminMaintenanceConfig;
  onSaveConfig: (updated: Partial<AdminMaintenanceConfig>, reason: string) => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  config,
  onSaveConfig,
}) => {
  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [bannerMessage, setBannerMessage] = useState(config.bannerMessage);
  const [scheduledStart, setScheduledStart] = useState(config.scheduledStart || '');
  const [scheduledEnd, setScheduledEnd] = useState(config.scheduledEnd || '');
  const [reason, setReason] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(
      {
        isEnabled,
        bannerMessage,
        scheduledStart,
        scheduledEnd,
      },
      reason || 'Owner Admin cập nhật chế độ bảo trì hệ thống'
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Wrench className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Vận Hành & Nâng Cấp
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Bảo Trì & Điều Hướng Khẩn Cấp
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Bật biểu ngữ thông báo hoặc tạm khóa truy cập khi nâng cấp cụm máy chủ Streaming
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
            config.isEnabled
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              config.isEnabled ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span>{config.isEnabled ? 'CHẾ ĐỘ BẢO TRÌ: ĐANG BẬT' : 'HỆ THỐNG HOẠT ĐỘNG BÌNH THƯỜNG'}</span>
        </div>
      </div>

      {/* Configuration Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
      >
        {/* Toggle Switch */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white">Kích Hoạt Chế Độ Bảo Trì</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Khi bật, khách vãng lai và người nghe thông thường sẽ nhìn thấy thông báo bảo dưỡng. Owner Admin vẫn giữ toàn quyền truy cập.
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            Thông Điệp Biểu Ngữ Thông Báo Bảo Dưỡng:
          </label>
          <textarea
            rows={3}
            value={bannerMessage}
            onChange={(e) => setBannerMessage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Thời Gian Bắt Đầu Dự Kiến</span>
              <span className="text-[10px] text-amber-400 font-mono font-normal">Chọn từ Lịch</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledStart ? scheduledStart.replace(' ', 'T') : ''}
              onChange={(e) => setScheduledStart(e.target.value.replace('T', ' '))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 min-h-[42px] [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Thời Gian Kết Thúc Dự Kiến</span>
              <span className="text-[10px] text-amber-400 font-mono font-normal">Chọn từ Lịch</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledEnd ? scheduledEnd.replace(' ', 'T') : ''}
              onChange={(e) => setScheduledEnd(e.target.value.replace('T', ' '))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 min-h-[42px] [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Reason for Audit Log */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            Lý Do Cập Nhật Cấu Hình (Lưu vào Audit Log):
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Nâng cấp định kỳ cụm Edge CDN máy chủ audio..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 min-h-[42px]"
          />
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã lưu và áp dụng cấu hình bảo trì thành công!</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer min-h-[42px] font-bold"
          >
            <Save className="w-4 h-4" />
            <span>Lưu & Áp Dụng Ngay</span>
          </button>
        </div>
      </form>
    </div>
  );
};
