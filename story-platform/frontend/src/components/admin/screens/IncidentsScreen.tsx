import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Clock,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { AdminSystemIncident } from '../../../types/admin';

interface IncidentsScreenProps {
  incidents: AdminSystemIncident[];
  onCreateIncident: (
    title: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    affectedServices: string[],
    description: string
  ) => void;
  onResolveIncident: (incident: AdminSystemIncident, resolutionNote: string) => void;
}

export const IncidentsScreen: React.FC<IncidentsScreenProps> = ({
  incidents,
  onCreateIncident,
  onResolveIncident,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [servicesText, setServicesText] = useState('CDN Streaming Edge, Database');
  const [description, setDescription] = useState('');

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const services = servicesText.split(',').map((s) => s.trim()).filter(Boolean);
    onCreateIncident(title.trim(), severity, services, description.trim());
    setTitle('');
    setDescription('');
    setIsCreating(false);
  };

  const handleResolve = (incident: AdminSystemIncident) => {
    onResolveIncident(incident, resolutionNote || 'Đã khắc phục sự cố và khôi phục hoạt động bình thường.');
    setResolvingId(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Ứng Phó Khẩn Cấp
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Theo Dõi & Ghi Nhận Sự Cố Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Ghi nhật ký dòng thời gian sự cố và theo dõi quá trình khắc phục các cụm streaming
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Đóng Biểu Mẫu' : 'Ghi Nhận Sự Cố Mới'}</span>
        </button>
      </div>

      {/* Incident Creator */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-scaleUp"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Khai Báo Sự Cố Mới</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tên / Tiêu Đề Sự Cố <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tăng độ trễ tải âm thanh tại khu vực miền Trung..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mức Độ Nghiêm Trọng
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 min-h-[42px] cursor-pointer"
              >
                <option value="LOW">Thấp (Low)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HIGH">Cao (High)</option>
                <option value="CRITICAL">Khẩn cấp (Critical)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Dịch Vụ Bị Ảnh Hưởng (phân tách bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={servicesText}
              onChange={(e) => setServicesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Mô Tả Chi Tiết & Hướng Xử Lý
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl min-h-[40px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 cursor-pointer min-h-[40px]"
            >
              Tạo Theo Dõi Sự Cố
            </button>
          </div>
        </form>
      )}

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    inc.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : inc.severity === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {inc.severity}
                </span>
                <h3 className="text-base font-bold text-white">{inc.title}</h3>
              </div>

              <span
                title={inc.status === 'RESOLVED' ? 'Sự cố đã được khắc phục hoàn tất' : 'Sự cố đang được đội ngũ xử lý khẩn cấp'}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                  inc.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                <span>{inc.status === 'RESOLVED' ? 'Đã khắc phục' : 'Đang xử lý khẩn cấp'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-850">
              {inc.description}
            </p>

            {/* Timeline */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Dòng Thời Gian Diễn Biến Sự Cố:
              </div>
              <div className="space-y-1.5 pl-2 border-l-2 border-slate-800">
                {inc.timeline.map((step, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">
                      [{step.timestamp}]
                    </span>
                    <span>{step.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {inc.status !== 'RESOLVED' && (
              <div className="pt-2 border-t border-slate-800">
                {resolvingId === inc.id ? (
                  <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Ghi chú kết quả khắc phục sự cố..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setResolvingId(null)}
                        className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(inc)}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
                      >
                        Xác Nhận Đóng Sự Cố
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setResolvingId(inc.id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer min-h-[40px]"
                    >
                      Đánh Dấu Đã Khắc Phục Hoàn Tất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
