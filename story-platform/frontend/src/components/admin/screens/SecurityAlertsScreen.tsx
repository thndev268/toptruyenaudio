import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Radio,
} from 'lucide-react';
import { AdminSecurityAlert } from '../../../types/admin';

interface SecurityAlertsScreenProps {
  alerts: AdminSecurityAlert[];
  onResolveAlert: (alert: AdminSecurityAlert) => void;
  onMarkFalsePositive: (alert: AdminSecurityAlert) => void;
}

export const SecurityAlertsScreen: React.FC<SecurityAlertsScreenProps> = ({
  alerts,
  onResolveAlert,
  onMarkFalsePositive,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'FALSE_POSITIVE'>('ALL');

  const filtered = alerts.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Tường Lửa WAF & Chống Tấn Công
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Cảnh Báo An Ninh & IP Bất Thường
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Phát hiện và ngăn chặn Brute Force đăng nhập, cào lậu file âm thanh và quá giới hạn Rate Limit
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
          {alerts.filter((a) => a.status === 'PENDING').length} mối đe dọa cần xử lý
        </span>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo IP, loại cảnh báo, địa điểm..."
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
          <option value="PENDING">Đang chờ ngăn chặn</option>
          <option value="RESOLVED">Đã khóa IP / Xử lý</option>
          <option value="FALSE_POSITIVE">Cảnh báo nhầm</option>
        </select>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    alert.severity === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {alert.type}
                </span>
                <h3 className="text-base font-bold text-white">{alert.title}</h3>
              </div>

              <span
                title={
                  alert.status === 'PENDING'
                    ? 'Cảnh báo đang chờ ngăn chặn khẩn cấp'
                    : alert.status === 'RESOLVED'
                    ? 'Đã áp dụng biện pháp khóa IP / chặn lưu lượng'
                    : 'Đã xác minh là cảnh báo nhầm'
                }
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                  alert.status === 'PENDING'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : alert.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                <span>
                  {alert.status === 'PENDING'
                    ? 'Chờ ngăn chặn'
                    : alert.status === 'RESOLVED'
                    ? 'Đã khóa IP'
                    : 'Cảnh báo nhầm'}
                </span>
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 flex-wrap gap-2">
                <span>
                  Địa chỉ IP: <span className="font-mono text-cyan-300 font-bold">{alert.ipAddress}</span> ({alert.location})
                </span>
                <span className="text-[11px] font-mono text-slate-500">{alert.detectedAt}</span>
              </div>
              <div className="text-slate-300">{alert.description}</div>
              <div className="text-[11px] text-slate-400">
                Phạm vi ảnh hưởng: <span className="text-white font-mono">{alert.impactScope}</span>
              </div>
            </div>

            {alert.actionTaken && (
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">Biện pháp đã áp dụng: </span>
                {alert.actionTaken}
              </div>
            )}

            {alert.status === 'PENDING' && (
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onMarkFalsePositive(alert)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[40px]"
                >
                  Đánh Dấu Cảnh Báo Nhầm
                </button>

                <button
                  type="button"
                  onClick={() => onResolveAlert(alert)}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Khóa IP 24 Giờ & Chặn WAF</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
