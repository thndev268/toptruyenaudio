import React, { useState } from 'react';
import {
  AlertOctagon,
  Check,
  X,
  Search,
  ShieldAlert,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { AdminViolationReport } from '../../../types/admin';

interface ReportsScreenProps {
  reports: AdminViolationReport[];
  onResolveReport: (report: AdminViolationReport) => void;
  onDismissReport: (report: AdminViolationReport) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  reports,
  onResolveReport,
  onDismissReport,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.targetTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <AlertOctagon className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              An Toàn Cộng Đồng
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Báo Cáo Vi Phạm Nội Dung & Hành Vi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Xử lý các nội dung vi phạm tiêu chuẩn cộng đồng do thính giả báo cáo
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
          {reports.filter((r) => r.status === 'PENDING').length} báo cáo chưa xử lý
        </span>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo đối tượng vi phạm, lý do, người báo cáo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 min-h-[42px]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 min-h-[42px] cursor-pointer sm:w-48"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ xử lý</option>
          <option value="RESOLVED">Đã xử lý trừng phạt</option>
          <option value="DISMISSED">Đã bỏ qua / Báo cáo nhầm</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((rep) => (
          <div
            key={rep.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-mono font-bold text-cyan-300">
                  {rep.targetType}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">{rep.targetTitle}</h3>
              </div>

              <span
                title={
                  rep.status === 'PENDING'
                    ? 'Báo cáo vi phạm đang chờ xử lý'
                    : rep.status === 'RESOLVED'
                    ? 'Đã thực thi xử phạt vi phạm'
                    : 'Đã bỏ qua / Báo cáo không vi phạm'
                }
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                  rep.status === 'PENDING'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : rep.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                <span>
                  {rep.status === 'PENDING'
                    ? 'Chờ xử lý'
                    : rep.status === 'RESOLVED'
                    ? 'Đã xử phạt'
                    : 'Đã bỏ qua'}
                </span>
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="text-slate-400">
                <span className="font-bold text-rose-400">Lý do báo cáo: </span>
                <span className="text-slate-200">{rep.reason}</span>
              </div>
              <div className="text-slate-400">
                <span className="font-bold text-slate-300">Chi tiết phản ánh: </span>
                <span className="text-slate-300">{rep.details}</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Báo cáo bởi: {rep.reporterName} ({rep.reporterEmail}) · {rep.createdAt}
              </div>
            </div>

            {rep.resolutionNote && (
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">Kết quả xử lý: </span>
                {rep.resolutionNote}
              </div>
            )}

            {rep.status === 'PENDING' && (
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onDismissReport(rep)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[40px]"
                >
                  Bỏ Qua Báo Cáo
                </button>

                <button
                  type="button"
                  onClick={() => onResolveReport(rep)}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer min-h-[40px]"
                >
                  Xử Phạt & Khóa Vi Phạm
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
