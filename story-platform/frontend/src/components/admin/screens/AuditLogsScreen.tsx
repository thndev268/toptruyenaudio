import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { AdminAuditLogEntry } from '../../../types/admin';

interface AuditLogsScreenProps {
  logs: AdminAuditLogEntry[];
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityName.toLowerCase().includes(search.toLowerCase()) ||
      log.reason.toLowerCase().includes(search.toLowerCase()) ||
      log.impactScope.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' ||
      log.entityType === categoryFilter ||
      log.action.includes(categoryFilter);

    let matchesTime = true;
    if (timeFilter !== 'ALL') {
      const logDate = new Date(log.timestamp.replace(' ', 'T'));
      const now = new Date();
      if (timeFilter === 'TODAY') {
        matchesTime = logDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesTime = logDate >= weekAgo;
      } else if (timeFilter === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesTime = logDate >= monthAgo;
      }
    }

    return matchesSearch && matchesCategory && matchesTime;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <History className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Kiểm Toán Minh Bạch
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Nhật Ký Hoạt Động & Kiểm Toán Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Ghi nhận toàn bộ thao tác do Chủ Sở Hữu (Owner Admin) thực thi cùng lý do và phạm vi ảnh hưởng
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700">
          {filtered.length} / {logs.length} bản ghi
        </span>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo hành động, lý do..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 min-h-[42px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 min-h-[42px] cursor-pointer"
            >
              <option value="ALL">Tất cả danh mục thao tác</option>
              <option value="User">Người dùng & Tài khoản</option>
              <option value="MaintenanceConfig">Bảo trì hệ thống</option>
              <option value="FeatureFlag">Cờ tính năng</option>
              <option value="SupportTicket">Hỗ trợ (Tickets)</option>
              <option value="BroadcastNotification">Thông báo người dùng</option>
              <option value="SystemIncident">Sự cố kỹ thuật</option>
              <option value="SecurityAlert">Cảnh báo an ninh</option>
              <option value="ServiceHealth">Dịch vụ (Healthcheck)</option>
            </select>
          </div>

          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 min-h-[42px] cursor-pointer"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="TODAY">Hôm nay</option>
              <option value="WEEK">7 ngày gần nhất</option>
              <option value="MONTH">30 ngày gần nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table on Desktop / Cards on Mobile */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Hành Động</th>
                <th className="py-3.5 px-4">Đối Tượng</th>
                <th className="py-3.5 px-4">Lý Do Thực Hiện</th>
                <th className="py-3.5 px-4">Phạm Vi Ảnh Hưởng</th>
                <th className="py-3.5 px-4 text-right">Người Thực Hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/20 whitespace-nowrap inline-block">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-white max-w-[180px] truncate" title={log.entityName}>
                    {log.entityName}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 max-w-[240px] truncate" title={log.reason}>
                    {log.reason}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono max-w-[200px] truncate" title={log.impactScope}>
                    {log.impactScope}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-[10px] text-rose-300 font-bold whitespace-nowrap">
                    OWNER_ADMIN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((log) => (
          <div
            key={log.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold text-[10px]">
                {log.action}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
            </div>

            <div className="font-bold text-white text-xs sm:text-sm">{log.entityName}</div>

            <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
              <span className="font-bold text-slate-400">Lý do: </span>
              {log.reason}
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
              Phạm vi: {log.impactScope}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
