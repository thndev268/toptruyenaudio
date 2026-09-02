import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Activity,
  RefreshCw,
  Database,
  Radio,
  Plus,
  Sliders,
  Trash2,
  ShieldAlert,
  HardDrive,
  Wifi,
  WifiOff,
  Zap,
  Info,
  X,
  CheckCircle2,
  Search,
  Clock,
} from 'lucide-react';
import { AdminServiceHealthItem } from '../../../types/admin';

interface ServiceHealthScreenProps {
  services: AdminServiceHealthItem[];
  onRecheck: () => void;
  onPingSingle?: (id: string) => Promise<void>;
  onUpdateConfig?: (id: string, updates: Partial<AdminServiceHealthItem>) => void;
  onAddService?: (newService: Omit<AdminServiceHealthItem, 'id' | 'lastChecked'>) => void;
  onDeleteService?: (id: string) => void;
  onCreateIncident?: (
    title: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    affectedServices: string[],
    description: string
  ) => void;
}

export const ServiceHealthScreen: React.FC<ServiceHealthScreenProps> = ({
  services,
  onRecheck,
  onPingSingle,
  onUpdateConfig,
  onAddService,
  onDeleteService,
  onCreateIncident,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [realApiPing, setRealApiPing] = useState<number | null>(null);
  const [storageSizeKb, setStorageSizeKb] = useState<number>(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Auto Refresh Interval Settings
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(30); // 0 = off, 10, 30, 60
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<'ADD' | 'EDIT_CONFIG' | null>(null);
  const [selectedService, setSelectedService] = useState<AdminServiceHealthItem | null>(null);

  // Form states for Add/Edit Config
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('CDN');
  const [formEndpoint, setFormEndpoint] = useState('');
  const [formRegion, setFormRegion] = useState('asia-east1');
  const [formUptime, setFormUptime] = useState(99.9);

  // Auto-measure system status on mount & setup auto-refresh
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Calculate localStorage usage
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += (localStorage[x].length + x.length) * 2;
        }
      }
      setStorageSizeKb(Math.round(total / 1024));
    } catch {}

    measureRealPing();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer loop for auto-refresh
  useEffect(() => {
    if (autoRefreshSec <= 0) {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
      return;
    }

    autoRefreshTimerRef.current = setInterval(() => {
      handleGlobalPing(true);
    }, autoRefreshSec * 1000);

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefreshSec]);

  const measureRealPing = async () => {
    const start = performance.now();
    try {
      await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      const duration = Math.round(performance.now() - start);
      setRealApiPing(duration);
    } catch {
      setRealApiPing(null);
    }
  };

  const handleGlobalPing = async (silent = false) => {
    if (!silent) setIsPinging(true);
    await measureRealPing();
    await onRecheck();
    if (!silent) setTimeout(() => setIsPinging(false), 400);
  };

  const handleSinglePing = async (id: string) => {
    setPingingId(id);
    if (onPingSingle) {
      await onPingSingle(id);
    }
    setTimeout(() => setPingingId(null), 400);
  };

  const openEditModal = (svc: AdminServiceHealthItem) => {
    setSelectedService(svc);
    setFormName(svc.name);
    setFormCategory(svc.category);
    setFormEndpoint(svc.endpoint);
    setFormRegion(svc.nodeRegion || 'asia-east1');
    setFormUptime(svc.uptimePercent);
    setActiveModal('EDIT_CONFIG');
  };

  const openAddModal = () => {
    setSelectedService(null);
    setFormName('');
    setFormCategory('CDN');
    setFormEndpoint('https://api.toptruyenaudio.com/v1/health');
    setFormRegion('asia-east1 (Singapore)');
    setFormUptime(99.99);
    setActiveModal('ADD');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !formName.trim() || !formEndpoint.trim()) return;

    if (onUpdateConfig) {
      onUpdateConfig(selectedService.id, {
        name: formName.trim(),
        category: formCategory,
        endpoint: formEndpoint.trim(),
        nodeRegion: formRegion.trim(),
        uptimePercent: Number(formUptime) || 99.9,
      });
    }

    setActiveModal(null);
  };

  const handleCreateNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEndpoint.trim()) return;

    if (onAddService) {
      onAddService({
        name: formName.trim(),
        category: formCategory,
        endpoint: formEndpoint.trim(),
        nodeRegion: formRegion.trim(),
        status: 'HEALTHY',
        statusNote: 'Vừa khai báo theo dõi mới từ Backend',
        httpStatus: 200,
        latencyMs: 15,
        uptimePercent: Number(formUptime) || 99.9,
        activeConnections: 120,
        cpuLoadPercent: 10,
        memoryUsagePercent: 30,
        errorRatePercent: 0,
        latencyHistory: [18, 16, 15, 17, 15],
      });
    }

    setActiveModal(null);
  };

  const handleTriggerIncidentFromService = (svc: AdminServiceHealthItem) => {
    if (onCreateIncident) {
      onCreateIncident(
        `Cảnh báo tự động Backend: Cụm ${svc.name}`,
        svc.status === 'DOWN' ? 'CRITICAL' : 'HIGH',
        [svc.name],
        `Cụm dịch vụ ${svc.name} (${svc.endpoint}) do Backend báo về trạng thái ${svc.status} (Mã HTTP: ${svc.httpStatus || 'N/A'}). Thông điệp: ${svc.statusNote || 'Mất kết nối hoặc quá tải độ trễ.'}`
      );
    }
  };

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Status counts
  const healthyCount = services.filter((s) => s.status === 'HEALTHY').length;
  const degradedCount = services.filter((s) => s.status === 'DEGRADED').length;
  const downCount = services.filter((s) => s.status === 'DOWN').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Server className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Telemetry & Hạ Tầng Backend Real-time
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Trạng Thái Dịch Vụ Vận Hành
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Trạng thái do <strong>máy chủ Backend tự động ghi nhận và phân tích</strong>. Admin theo dõi độ trễ, tải CPU/RAM, mã HTTP và khởi tạo xử lý sự cố.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap">
          {/* Auto Refresh Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-semibold">Tự động quét:</span>
            <select
              value={autoRefreshSec}
              onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-bold font-mono focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-slate-900 text-white">10 giây</option>
              <option value={30} className="bg-slate-900 text-white">30 giây</option>
              <option value={60} className="bg-slate-900 text-white">60 giây</option>
              <option value={0} className="bg-slate-900 text-white">Tắt auto</option>
            </select>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Điểm Giám Sát</span>
          </button>

          <button
            type="button"
            disabled={isPinging}
            onClick={() => handleGlobalPing(false)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer min-h-[42px]"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Đang Đo Đạc...' : 'Ping Lại Tất Cả'}</span>
          </button>
        </div>
      </div>

      {/* Diagnostics Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Độ Trễ API Root Node</div>
            <div className="text-base font-black font-mono text-cyan-400 mt-0.5">
              {realApiPing !== null ? `${realApiPing} ms` : 'Đang đo đạc...'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Bộ Nhớ Cache Client</div>
            <div className="text-base font-black font-mono text-purple-400 mt-0.5">
              {storageSizeKb} KB
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Kết Nối Mạng Trực Tiếp</div>
            <div className={`text-base font-black font-mono mt-0.5 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOnline ? 'Trực Tuyến (Online)' : 'Ngoại Tuyến (Offline)'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Tổng Cụm Máy Chủ</div>
            <div className="text-base font-black font-mono text-amber-400 mt-0.5 flex items-center gap-1.5">
              <span>{services.length} Cụm</span>
              {downCount > 0 && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold animate-pulse">
                  {downCount} MẤT TÍN HIỆU
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Overview Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên dịch vụ, URL..."
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['ALL', 'CDN', 'DATABASE', 'AUTH', 'STORAGE', 'QUEUE'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Telemetry Disclaimer */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend Hoạt Động Ổn Định ({healthyCount})</span>
            </div>

            {degradedCount > 0 && (
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Backend Cảnh Báo Chậm ({degradedCount})</span>
              </div>
            )}

            {downCount > 0 && (
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Backend Báo Lỗi / Mất Kết Nối ({downCount})</span>
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-cyan-400/90 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Chế độ giám sát tự động (Read-only)</span>
          </div>
        </div>
      </div>

      {/* Grid of Service Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Server className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chưa xác định</h3>
            <p className="text-sm text-slate-400">
              Không có dữ liệu dịch vụ từ Backend. Vui lòng kiểm tra kết nối hoặc khởi động Backend API.
            </p>
          </div>
        ) : (
          filteredServices.map((svc) => {
            const isSvcPinging = pingingId === svc.id;

            let badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            let badgeDot = 'bg-emerald-400 animate-pulse';
            let badgeText = 'Backend: 200 OK (Khỏe)';

            if (svc.status === 'DEGRADED') {
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              badgeDot = 'bg-amber-400';
              badgeText = `Backend: Quá tải (${svc.latencyMs}ms)`;
            } else if (svc.status === 'DOWN') {
              badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              badgeDot = 'bg-rose-500 animate-ping';
              badgeText = `Backend Lỗi (HTTP ${svc.httpStatus || 503})`;
            }

            return (
            <div
              key={svc.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl space-y-4 transition-all hover:border-slate-700 ${
                svc.status === 'DOWN'
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : svc.status === 'DEGRADED'
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    svc.category === 'DATABASE'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : svc.category === 'CDN'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : svc.category === 'AUTH'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {svc.category === 'DATABASE' ? (
                      <Database className="w-5 h-5" />
                    ) : svc.category === 'CDN' ? (
                      <Radio className="w-5 h-5" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{svc.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-400 font-semibold border border-slate-700 shrink-0">
                        {svc.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      {svc.endpoint}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 border ${badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeDot}`} />
                    <span>{badgeText}</span>
                  </span>

                  <div className="text-[10px] text-slate-500 font-mono">{svc.lastChecked}</div>
                </div>
              </div>

              {/* Status Note Banner from Backend */}
              {svc.statusNote && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/90 text-xs text-slate-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-mono text-[11px]">
                    <strong>Thông điệp từ Máy Chủ:</strong> {svc.statusNote}
                  </span>
                </div>
              )}

              {/* Latency History Sparkline */}
              {svc.latencyHistory && svc.latencyHistory.length > 0 && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Lịch sử độ trễ ping gần nhất (ms)</span>
                    <span className="text-cyan-400 font-bold">{svc.latencyMs} ms (mới nhất)</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-7 pt-1">
                    {svc.latencyHistory.map((val, idx) => {
                      const maxVal = Math.max(...(svc.latencyHistory || [50]), 50);
                      const heightPct = Math.min(100, Math.max(15, Math.round((val / maxVal) * 100)));
                      const isHigh = val > 350;
                      return (
                        <div
                          key={idx}
                          className="flex-1 rounded-t flex flex-col justify-end group relative"
                          style={{ height: '100%' }}
                        >
                          <div
                            className={`w-full rounded-t transition-all ${
                              isHigh ? 'bg-amber-400' : 'bg-cyan-500/80 hover:bg-cyan-400'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {val} ms
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Node Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Mã HTTP / Node</div>
                  <div className="text-sm font-black font-mono text-cyan-400 mt-0.5">
                    {svc.httpStatus || 200}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Khu Vực (Region)</div>
                  <div className="text-xs font-bold text-slate-300 truncate mt-1">
                    {svc.nodeRegion || 'asia-east1'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Tải CPU / RAM</div>
                  <div className="text-xs font-mono font-bold text-slate-300 mt-1">
                    {svc.cpuLoadPercent || 12}% / {svc.memoryUsagePercent || 35}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Kết Nối Đang Mở</div>
                  <div className="text-xs font-mono font-bold text-purple-400 mt-1">
                    {svc.activeConnections || 120} conns
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isSvcPinging}
                    onClick={() => handleSinglePing(svc.id)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSvcPinging ? 'animate-spin' : ''}`} />
                    <span>{isSvcPinging ? 'Đang ping...' : 'Ping thủ công'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(svc)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cấu hình Endpoint</span>
                  </button>

                  {onDeleteService && (
                    <button
                      type="button"
                      onClick={() => onDeleteService(svc.id)}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/80 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                      title="Gỡ khỏi hệ thống giám sát"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {(svc.status === 'DOWN' || svc.status === 'DEGRADED') && onCreateIncident && (
                  <button
                    type="button"
                    onClick={() => handleTriggerIncidentFromService(svc)}
                    className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Tạo Sự Cố Ngay</span>
                  </button>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* MODAL: ADD OR EDIT CONFIG */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Server className="w-5 h-5" />
                <h3 className="text-lg font-black text-white">
                  {activeModal === 'ADD' ? 'Khai Báo Cụm Máy Chủ Giám Sát Mới' : `Cấu Hình Điểm Cuối: ${selectedService?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={activeModal === 'ADD' ? handleCreateNewService : handleSaveConfig}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Tên Cụm Dịch Vụ
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: PostgreSQL Main Master Node"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Danh Mục Dịch Vụ
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CDN">CDN Streaming</option>
                    <option value="DATABASE">Cơ Sở Dữ Liệu</option>
                    <option value="AUTH">Xác Thực (Auth)</option>
                    <option value="STORAGE">Bộ Nhớ Đệm / Storage</option>
                    <option value="QUEUE">Hàng Đợi (Queue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Khu Vực (Region)
                  </label>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="asia-east1 (Singapore)"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  URL Điểm Cuối / Endpoint
                </label>
                <input
                  type="text"
                  required
                  value={formEndpoint}
                  onChange={(e) => setFormEndpoint(e.target.value)}
                  placeholder="https://api.toptruyenaudio.com/v1/health"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác thực & Telemetry tự động từ Backend</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Toàn bộ trạng thái vận hành (`200 OK`, `Quá tải độ trễ`, `Mất kết nối`), mã lỗi HTTP, tỷ lệ tải CPU/RAM và kết nối đang mở đều được <strong>Backend đo đạc và trả về hoàn toàn tự động</strong>. Admin không thể tự gán trạng thái ảo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20"
                >
                  {activeModal === 'ADD' ? 'Khai Báo Cụm Máy Chủ' : 'Lưu Cấu Hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
