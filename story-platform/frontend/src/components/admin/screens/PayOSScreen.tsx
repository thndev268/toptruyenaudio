import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Settings,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../../../services/apiClient';

interface PayOSConfig {
  id?: string;
  clientId: string;
  apiKey: string;
  checksumKey?: string;
  isActive: boolean;
  configuredAt?: string;
  updatedAt?: string;
}

export const PayOSScreen: React.FC = () => {
  const [config, setConfig] = useState<PayOSConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    apiKey: '',
    checksumKey: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<{ success: boolean; data: PayOSConfig | null; message: string }>('/admin/payos-config');
      if (response?.data) {
        setConfig(response.data);
        setFormData({
          clientId: response.data.clientId || '',
          apiKey: response.data.apiKey || '',
          checksumKey: response.data.checksumKey || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch PayOS config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.clientId || !formData.apiKey) {
      alert('Vui lòng nhập Client ID và API Key');
      return;
    }

    setSaving(true);
    try {
      const endpoint = config?.id ? `/admin/payos-config/${config.id}` : '/admin/payos-config';
      const method = config?.id ? 'PUT' : 'POST';
      
      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (response?.success) {
        alert('Đã lưu cấu hình PayOS thành công');
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to save PayOS config:', error);
      alert('Không thể lưu cấu hình PayOS. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!config?.id) return;
    
    if (!confirm('Bạn có chắc chắn muốn xóa cấu hình PayOS? Hành động này sẽ làm hệ thống thanh toán không hoạt động.')) {
      return;
    }

    try {
      const response = await apiRequest(`/admin/payos-config/${config.id}`, {
        method: 'DELETE',
      });

      if (response?.success) {
        alert('Đã xóa cấu hình PayOS thành công');
        setConfig(null);
        setFormData({ clientId: '', apiKey: '', checksumKey: '' });
      }
    } catch (error) {
      console.error('Failed to delete PayOS config:', error);
      alert('Không thể xóa cấu hình PayOS. Vui lòng thử lại.');
    }
  };

  const maskValue = (value: string) => {
    if (!value || value.length <= 8) return '****';
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Cấu Hình Thanh Toán PayOS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Quản lý thông tin xác thực với cổng thanh toán PayOS
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-300">
              {config ? 'Cập nhật cấu hình' : 'Tạo cấu hình mới'}
            </span>
          </div>
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Indicator */}
          {config ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-sm font-bold text-emerald-300">Đã cấu hình</div>
                <div className="text-xs text-emerald-400/70">
                  Cập nhật lần cuối: {new Date(config.updatedAt || '').toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-bold text-amber-300">Chưa cấu hình</div>
                <div className="text-xs text-amber-400/70">
                  Hệ thống thanh toán sẽ không hoạt động cho đến khi cấu hình
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="Nhập Client ID từ PayOS"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKeys ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Nhập API Key từ PayOS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Checksum Key (Optional)
              </label>
              <div className="relative">
                <input
                  type={showApiKeys ? 'text' : 'password'}
                  value={formData.checksumKey}
                  onChange={(e) => setFormData({ ...formData, checksumKey: e.target.value })}
                  placeholder="Nhập Checksum Key từ PayOS (nếu có)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleSave}
              disabled={saving || !formData.clientId || !formData.apiKey}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {config ? 'Cập nhật cấu hình' : 'Lưu cấu hình'}
                </>
              )}
            </button>

            {config && (
              <button
                onClick={handleDelete}
                className="px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Hướng dẫn lấy thông tin PayOS</h3>
        <ol className="space-y-3 text-sm text-slate-300">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">1</span>
            <span>Đăng nhập vào tài khoản PayOS tại <a href="https://payos.vn" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">payos.vn</a></span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">2</span>
            <span>Đi đến mục API Keys hoặc Integration trong cài đặt</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">3</span>
            <span>Sao chép Client ID, API Key và Checksum Key (nếu có)</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">4</span>
            <span>Dán thông tin vào form trên và lưu cấu hình</span>
          </li>
        </ol>
      </div>
    </div>
  );
};