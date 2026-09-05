import React, { useState, useEffect } from 'react';
import {
  Users,
  Disc,
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  History,
  Crown,
  Bell,
  Wrench,
  Radio,
  Calendar,
  Filter,
  RotateCcw,
  LifeBuoy,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import {
  AdminScreenId,
  AdminAuditLogEntry,
  AdminServiceHealthItem,
  AdminSupportTicket,
} from '../../../types/admin';
import { apiRequest } from '../../../services/apiClient';

type TimeFilterPreset = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM';

interface DashboardScreenProps {
  onNavigate: (screen: AdminScreenId) => void;
  pendingCounts: {
    creators: number;
    reports: number;
    copyright: number;
    tickets: number;
    security: number;
  };
  auditLogs: AdminAuditLogEntry[];
  serviceHealth: AdminServiceHealthItem[];
  tickets?: AdminSupportTicket[];
  totalStoriesCount: number;
  totalUsersCount: number;
  userCounts?: { total: number; premium: number; creator: number; partner: number };
  onQuickMaintenanceToggle: () => void;
  isMaintenanceActive: boolean;
  onQuickBroadcastModal: () => void;
  onQuickHealthPing: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  pendingCounts,
  auditLogs,
  serviceHealth,
  tickets = [],
  totalStoriesCount,
  totalUsersCount,
  userCounts,
  onQuickMaintenanceToggle,
  isMaintenanceActive,
  onQuickBroadcastModal,
  onQuickHealthPing,
}) => {
  const [timePreset, setTimePreset] = useState<TimeFilterPreset>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-07');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const unresolvedTickets = tickets.filter(
    (t) => t.status === 'PENDING' || (t.status !== 'RESOLVED' && t.status !== 'CLOSED')
  );

  const totalTasks =
    pendingCounts.creators +
    pendingCounts.reports +
    pendingCounts.copyright +
    pendingCounts.tickets +
    pendingCounts.security;

  useEffect(() => {
    fetchMetrics();
  }, [timePreset, startDate, endDate]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const queryParams: any = { timeFilter: timePreset };
      if (timePreset === 'CUSTOM') {
        if (startDate) queryParams.startDate = startDate;
        if (endDate) queryParams.endDate = endDate;
      }

      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/admin/dashboard/metrics${queryString ? `?${queryString}` : ''}`;
      
      console.log('[Dashboard] Fetching metrics from:', url);
      const response = await apiRequest<{ success: boolean; data: any }>(url, {
        method: 'GET',
      });
      
      console.log('[Dashboard] Metrics response:', response);
      
      if (response?.data) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch dashboard metrics:', error);
      // Fallback to default values on error - use real user counts from context
      setMetrics({
        users: { total: userCounts?.total || totalUsersCount, new: 0 },
        stories: { total: totalStoriesCount, new: 0 },
        listening: { totalHours: '0h', totalSeconds: 0 },
        revenue: { total: 0, formatted: '0 đ' },
        dateRange: { filter: timePreset },
      });
    } finally {
      setLoading(false);
    }
  };

  // Format metrics for display
  const displayMetrics = metrics ? {
    users: metrics.users?.total || userCounts?.total || totalUsersCount,
    userLabel: userCounts 
      ? `Tổng: ${userCounts.total.toLocaleString('vi-VN')} | Premium: ${userCounts.premium.toLocaleString('vi-VN')} | Creator: ${userCounts.creator.toLocaleString('vi-VN')}`
      : (timePreset === 'THIS_MONTH' 
      ? 'Đang hoạt động trên nền tảng' 
      : `Thành viên ${timePreset === 'TODAY' ? 'hôm nay' : timePreset === 'THIS_WEEK' ? 'tuần này' : 'tích lũy'}`),
    stories: metrics.stories?.total || 0,
    storyLabel: timePreset === 'THIS_MONTH' 
      ? 'Bao gồm cả Free và Premium' 
      : `Phát hành ${timePreset === 'TODAY' ? 'hôm nay' : timePreset === 'THIS_WEEK' ? 'tuần này' : 'tích lũy'}`,
    hours: metrics.listening?.totalHours || '0h',
    hoursDelta: metrics.listening?.totalSeconds 
      ? `+${Math.floor(metrics.listening.totalSeconds / 3600)} lượt nghe` 
      : '0 lượt nghe',
    revenue: metrics.revenue?.formatted || '0 đ',
    revenueLabel: metrics.subscriptions?.active 
      ? `${metrics.subscriptions.active} thành viên trả phí` 
      : '0 thành viên trả phí',
    dateText: timePreset === 'CUSTOM' 
      ? `${startDate} đến ${endDate}` 
      : timePreset === 'TODAY' 
      ? 'Hôm nay' 
      : timePreset === 'THIS_WEEK' 
      ? 'Tuần này' 
      : timePreset === 'THIS_MONTH' 
      ? 'Tháng này' 
      : 'Toàn bộ thời gian',
  } : {
    users: userCounts?.total || totalUsersCount,
    userLabel: userCounts 
      ? `Tổng: ${userCounts.total.toLocaleString('vi-VN')} | Premium: ${userCounts.premium.toLocaleString('vi-VN')} | Creator: ${userCounts.creator.toLocaleString('vi-VN')}`
      : 'Đang tải...',
    stories: 0,
    storyLabel: 'Đang tải...',
    hours: '...',
    hoursDelta: '...',
    revenue: '...',
    revenueLabel: 'Đang tải...',
    dateText: 'Đang tải...',
  };

  console.log('[Dashboard] Metrics state:', metrics);
  console.log('[Dashboard] Display metrics:', displayMetrics);
  console.log('[Dashboard] Loading:', loading);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Trung Tâm Điều Hành Hệ Thống
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Tổng Quan Quản Trị TOP TRUYỆN AUDIO
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Bảng điều khiển duy nhất dành cho Chủ Sở Hữu (Owner Admin) tự thực hiện toàn bộ quy trình
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onQuickHealthPing}
            title="Kiểm tra độ trễ mạng và trạng thái 5 cụm dịch vụ"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Kiểm tra dịch vụ</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('audit-logs')}
            title="Xem nhật ký lịch sử toàn bộ thao tác của quản trị viên"
            className="px-3 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 inline-flex items-center gap-1.5 transition-all min-h-[38px] cursor-pointer shrink-0 whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>Nhật ký hoạt động</span>
          </button>
        </div>
      </div>

      {/* Alert Banner for Support Requests */}
      {pendingCounts.tickets > 0 && (
        <div 
          onClick={() => onNavigate('tickets')}
          className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                <span>Yêu Cầu Hỗ Trợ Từ Người Dùng</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  {pendingCounts.tickets} Yêu cầu chưa trả lời
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate mt-0.5">
                Người nghe cần hỗ trợ giải đáp thắc mắc hoặc sự cố. Nhấn vào đây để xem và phản hồi ngay.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-3.5 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 shrink-0 group-hover:bg-emerald-400 transition-all min-h-[38px] cursor-pointer"
          >
            <span>Phản Hồi Ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Date & Time Range Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Filter className="w-4 h-4" />
            <h2 className="text-sm font-bold text-white">Lọc Theo Thời Gian & Ngày Tháng</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/20">
              {displayMetrics.dateText}
            </span>
          </div>

          {timePreset !== 'THIS_MONTH' && (
            <button
              onClick={() => setTimePreset('THIS_MONTH')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại tháng này</span>
            </button>
          )}
        </div>

        {/* Filter Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTimePreset('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              timePreset === 'TODAY'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Hôm Nay
          </button>
          <button
            onClick={() => setTimePreset('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              timePreset === 'THIS_WEEK'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Tuần Này
          </button>
          <button
            onClick={() => setTimePreset('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              timePreset === 'THIS_MONTH'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Tháng Này
          </button>
          <button
            onClick={() => setTimePreset('ALL_TIME')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              timePreset === 'ALL_TIME'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Tất Cả Thời Gian
          </button>
          <button
            onClick={() => setTimePreset('CUSTOM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              timePreset === 'CUSTOM'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-amber-400 border border-amber-500/30 hover:border-amber-500/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Chọn Ngày & Giờ...</span>
          </button>
        </div>

        {/* Custom Calendar & Time Picker Input Bar */}
        {timePreset === 'CUSTOM' && (
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-amber-500/20 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Từ Ngày (Chọn từ Lịch)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 min-h-[38px] [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Đến Ngày (Chọn từ Lịch)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 min-h-[38px] [color-scheme:dark]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Stat Cards - Filtered according to selected timeframe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div
          onClick={() => onNavigate('users')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group shadow-lg flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Tổng Người Dùng
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {loading ? '...' : displayMetrics.users.toLocaleString('vi-VN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{displayMetrics.userLabel}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Audio Stories */}
        <div
          onClick={() => onNavigate('stories')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group shadow-lg flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Bộ Audio Phát Hành
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Disc className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
              {loading ? '...' : displayMetrics.stories} Bộ
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{displayMetrics.storyLabel}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Accumulated Listening Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Giờ Nghe Tích Lũy
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {loading ? '...' : displayMetrics.hours}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">{displayMetrics.hoursDelta}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Revenue / Premium */}
        <div
          onClick={() => onNavigate('premium')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group shadow-lg flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Doanh Thu Gói Premium
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              {loading ? '...' : displayMetrics.revenue}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayMetrics.revenueLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Story Distribution & Top Listening */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Story Distribution by Genre */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-rose-400" />
              <h2 className="text-base font-bold text-white">Phân Bố Truyện Theo Thể Loại</h2>
            </div>
            <span className="text-xs text-slate-400">Tổng số: {metrics?.stories?.total || 0} bộ</span>
          </div>

          <div className="space-y-2">
            {metrics?.stories?.genreDistribution?.slice(0, 8).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-6">{index + 1}</span>
                  <span className="text-xs font-medium text-white truncate">{item.genreName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${(item.count / (metrics?.stories?.total || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400 w-12 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stories by Listening Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Truyện Được Nghe Nhiều Nhất</h2>
            </div>
            <span className="text-xs text-slate-400">Theo giờ nghe tích lũy</span>
          </div>

          <div className="space-y-2">
            {metrics?.stories?.topListeningStories?.slice(0, 8).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-bold w-6 ${
                    index === 0 ? 'text-amber-400' : 
                    index === 1 ? 'text-slate-300' : 
                    index === 2 ? 'text-amber-600' : 'text-slate-400'
                  }`}>{index + 1}</span>
                  <span className="text-xs font-medium text-white truncate">{item.storyTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-emerald-400">{item.totalHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Công việc cần xử lý (8 cols) & Tình trạng hệ thống (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pending Tasks (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-base font-bold text-white">
                Công Việc Cần Xử Lý ({totalTasks})
              </h2>
            </div>
            <span className="text-xs text-slate-400">Tự xử lý trực tiếp không qua trung gian</span>
          </div>

          <div className="space-y-2.5">
            {/* Task 1: Creator applications */}
            <div className="bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  CR
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    Đơn đăng ký Creator & Giọng đọc MC
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {pendingCounts.creators > 0
                      ? `${pendingCounts.creators} đơn chờ duyệt giọng đọc mẫu`
                      : 'Không có đơn nào đang chờ'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('creators')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Kiểm Tra</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task 2: Copyright claims */}
            <div className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  BQ
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    Khiếu nại bản quyền & Yêu cầu gỡ bài
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {pendingCounts.copyright > 0
                      ? `${pendingCounts.copyright} hồ sơ bản quyền cần thẩm định`
                      : 'Không có khiếu nại bản quyền'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('copyright')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Thẩm Định</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task 3: Violation reports */}
            <div className="bg-slate-950 border border-slate-800 hover:border-rose-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                  BC
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    Báo cáo vi phạm nội dung & Spam bình luận
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {pendingCounts.reports > 0
                      ? `${pendingCounts.reports} báo cáo từ cộng đồng người nghe`
                      : 'Không có báo cáo vi phạm'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-rose-500 hover:text-white text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Xử Lý</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task 4: Support tickets */}
            <div
              onClick={() => onNavigate('tickets')}
              className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  TK
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                    Ticket hỗ trợ thanh toán & Yêu cầu người dùng
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {pendingCounts.tickets > 0
                      ? `${pendingCounts.tickets} yêu cầu hỗ trợ người nghe cần giải đáp`
                      : 'Đã phản hồi tất cả ticket'}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('tickets');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Phản Hồi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* System Health (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Tình Trạng Hệ Thống</h2>
              </div>
              <span className={`text-[10px] font-mono font-bold ${
                serviceHealth.some((s) => s.status === 'DOWN')
                  ? 'text-rose-400'
                  : serviceHealth.some((s) => s.status === 'DEGRADED')
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {serviceHealth.some((s) => s.status === 'DOWN')
                  ? 'CÓ SỰ CỐ CẦN XỬ LÝ'
                  : serviceHealth.some((s) => s.status === 'DEGRADED')
                  ? 'CẢNH BÁO GIẢM HIỆU NĂNG'
                  : 'HỆ THỐNG HOẠT ĐỘNG ỔN ĐỊNH'}
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {serviceHealth.slice(0, 5).map((svc) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      svc.status === 'DOWN'
                        ? 'bg-rose-500 animate-ping'
                        : svc.status === 'DEGRADED'
                        ? 'bg-amber-400'
                        : svc.status === 'MAINTENANCE'
                        ? 'bg-cyan-400'
                        : 'bg-emerald-400'
                    }`} />
                    <span className="text-slate-300 font-medium truncate">{svc.name}</span>
                  </div>
                  <span className={`font-mono font-bold text-[11px] shrink-0 ${
                    svc.status === 'DOWN'
                      ? 'text-rose-400'
                      : svc.status === 'DEGRADED'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {svc.status === 'DOWN' ? 'DOWN' : `${svc.latencyMs}ms`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('service-health')}
            className="w-full mt-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Xem Chi Tiết 5 Cụm Dịch Vụ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* User Support Tickets Widget - Directly on Admin Home Page (Only displayed when there are unresolved tickets) */}
      {unresolvedTickets.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Yêu Cầu Hỗ Trợ Chưa Giải Quyết ({unresolvedTickets.length})</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/40 animate-pulse">
                    Cần phản hồi
                  </span>
                </div>
                <p className="text-xs text-slate-400">Danh sách các yêu cầu trợ giúp & phản hồi chưa giải quyết từ người nghe</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('tickets')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[38px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mở Trang Hỗ Trợ Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tickets Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unresolvedTickets.slice(0, 3).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onNavigate(('tickets:' + ticket.id) as any)}
                className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all cursor-pointer group space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/20 text-amber-300 border-amber-500/30">
                    • Chờ phản hồi
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{ticket.createdAt}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {ticket.subject}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    "{ticket.message}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-900 text-slate-400">
                  <span className="truncate text-slate-300 font-medium">
                    {ticket.userName} ({ticket.userEmail})
                  </span>
                  <span className="text-emerald-400 font-bold group-hover:underline shrink-0">
                    Phản hồi →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Nhật ký gần đây (8 cols) & Thao tác nhanh (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Audit Logs (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Nhật Ký Hoạt Động Gần Đây</h2>
            </div>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Xem Tất Cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-slate-400">· {log.entityName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{log.reason}</p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0 self-start sm:self-auto">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Thao Tác Nhanh</h2>
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={onQuickBroadcastModal}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Gửi Thông Báo Toàn Sàn</div>
                  <div className="text-[10px] text-slate-400">Phát sóng tin tức cập nhật mới</div>
                </div>
              </button>

              <button
                onClick={onQuickMaintenanceToggle}
                className={`w-full p-3 border rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  isMaintenanceActive
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isMaintenanceActive
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isMaintenanceActive ? 'Tắt Chế Độ Bảo Trì' : 'Bật Chế Độ Bảo Trì'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isMaintenanceActive ? 'Đang bật biểu ngữ bảo dưỡng' : 'Khóa truy cập để nâng cấp'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('security-alerts')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Xem Cảnh Báo An Ninh</div>
                  <div className="text-[10px] text-slate-400">Kiểm tra IP và bảo vệ WAF</div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Chế độ vận hành trực tiếp bởi Owner Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
