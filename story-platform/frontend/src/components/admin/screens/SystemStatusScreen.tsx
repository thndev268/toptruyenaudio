import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Database,
  Cloud,
  CreditCard,
  MessageSquare,
  Bot,
  Globe,
  Server,
  Zap,
  BarChart3,
  HardDrive,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { apiRequest } from '../../../services/apiClient';

type ServiceStatus = 'operational' | 'degraded' | 'major_outage' | 'unknown' | 'configured';

interface ServiceHealth {
  status: ServiceStatus;
  responseTime: number | null;
}

interface SystemStatusData {
  overallStatus: ServiceStatus;
  checkedAt: string;
  services: {
    website: ServiceHealth;
    api: ServiceHealth;
    database: ServiceHealth;
    storage: ServiceHealth;
    payment: ServiceHealth;
    telegram: ServiceHealth;
    ai: ServiceHealth;
  };
  statistics: {
    requestsToday: number;
    errorRate: number;
    averageResponseTime: number;
    databaseQueryTime: number;
    ai: {
      requestsToday: number;
      inputTokensToday: number;
      outputTokensToday: number;
      totalTokensToday: number;
    };
    storage: {
      usedBytes: number | null;
    };
  };
}

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    label: 'Hoạt động bình thường',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Hoạt động nhưng có vấn đề',
  },
  major_outage: {
    icon: AlertCircle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    label: 'Lỗi nghiêm trọng',
  },
  unknown: {
    icon: HelpCircle,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    label: 'Chưa xác định',
  },
  configured: {
    icon: CheckCircle2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    label: 'Đã cấu hình',
  },
};

const serviceIcons = {
  website: Globe,
  api: Server,
  database: Database,
  storage: Cloud,
  payment: CreditCard,
  telegram: MessageSquare,
  ai: Bot,
};

export const SystemStatusScreen: React.FC = () => {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const fetchSystemStatus = async () => {
    try {
      setError(null);
      const response = await apiRequest<SystemStatusData>('/admin/system-status');
      setStatusData(response);
      setLastChecked(new Date().toLocaleString('vi-VN'));
    } catch (err) {
      console.error('[SystemStatusScreen] Failed to fetch system status:', err);
      setError('Không thể lấy trạng thái hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number | null): string => {
    if (bytes === null) return 'N/A';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN');
  };

  const renderServiceCard = (serviceName: keyof SystemStatusData['services'], label: string) => {
    const service = statusData?.services[serviceName];
    if (!service) return null;

    const config = statusConfig[service.status];
    const Icon = serviceIcons[serviceName];
    const StatusIcon = config.icon;

    return (
      <div className={`bg-slate-900 border ${config.borderColor} rounded-2xl p-4 shadow-lg`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className="text-white font-bold text-sm">{label}</span>
          </div>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className={`text-xs font-mono ${config.color} mb-1`}>
          {config.label}
        </div>
        {service.responseTime !== null && (
          <div className="text-xs text-slate-400 font-mono">
            {service.responseTime} ms
          </div>
        )}
      </div>
    );
  };

  const renderStatCard = (icon: React.ElementType, label: string, value: string | number, unit?: string) => {
    const Icon = icon;
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400">{label}</span>
        </div>
        <div className="text-xl font-bold text-white">
          {typeof value === 'number' ? formatNumber(value) : value}
          {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-white">Đang tải trạng thái hệ thống...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5 animate-fadeIn">
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400" />
            <span className="text-white">{error}</span>
          </div>
          <button
            onClick={fetchSystemStatus}
            className="mt-4 px-4 py-2 bg-rose-500/20 text-rose-300 rounded-xl text-sm hover:bg-rose-500/30 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  const overallConfig = statusConfig[statusData.overallStatus];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Trạng thái hệ thống
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Trạng thái dịch vụ vận hành
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Theo dõi tình trạng hoạt động của website/backend và các dịch vụ quan trọng
          </p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${overallConfig.bgColor} ${overallConfig.borderColor} border`}>
          <OverallIcon className={`w-5 h-5 ${overallConfig.color}`} />
          <span className={`text-sm font-bold ${overallConfig.color}`}>
            {overallConfig.label}
          </span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Dịch vụ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {renderServiceCard('website', 'Website')}
          {renderServiceCard('api', 'Backend API')}
          {renderServiceCard('database', 'Database')}
          {renderServiceCard('storage', 'Storage')}
          {renderServiceCard('payment', 'Payment')}
          {renderServiceCard('telegram', 'Telegram CSKH')}
          {renderServiceCard('ai', 'AI Service')}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Thống kê
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {renderStatCard(Zap, 'API Response', statusData.statistics.averageResponseTime, 'ms')}
          {renderStatCard(Activity, 'Requests hôm nay', statusData.statistics.requestsToday)}
          {renderStatCard(AlertCircle, 'Error Rate', statusData.statistics.errorRate, '%')}
          {renderStatCard(Database, 'Database Query', statusData.statistics.databaseQueryTime, 'ms')}
          {renderStatCard(Bot, 'AI Requests', statusData.statistics.ai.requestsToday)}
          {renderStatCard(Bot, 'AI Tokens', statusData.statistics.ai.totalTokensToday)}
          {renderStatCard(HardDrive, 'Storage', formatBytes(statusData.statistics.storage.usedBytes))}
        </div>
      </div>

      {/* Last checked */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Cập nhật lần cuối:</span>
        <span className="font-mono">{lastChecked}</span>
      </div>
    </div>
  );
};
