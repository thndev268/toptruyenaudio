import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Info,
  Save,
  Key,
} from 'lucide-react';
import { apiRequest } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';

/**
 * Kiểu trả về từ backend khi kiểm tra trạng thái cổng thanh toán.
 * Backend đọc Gateway Token từ database — frontend
 * KHÔNG bao giờ nhận, hiển thị hay nhập token cũ.
 */
interface GatewayStatus {
  configured: boolean;   // Gateway Token có tồn tại không
  reachable: boolean;    // Có kết nối được tới pay-8dip.onrender.com không
  tokenStatus: string;   // NOT_CONFIGURED, ACTIVE, EXPIRED, INVALID
  lastCheckedAt: string | null;
}

type CheckState = 'idle' | 'loading' | 'success' | 'error';
type SaveState = 'idle' | 'saving' | 'success' | 'error';

export const PayOSScreen: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [tokenInput, setTokenInput] = useState('');

  const fetchStatus = useCallback(async () => {
    setCheckState('loading');
    try {
      const res = await apiRequest<{ success: boolean; data: GatewayStatus }>(
        '/premium/gateway/status',
      );
      if (res?.success && res.data) {
        setStatus(res.data);
        setCheckState('success');
      } else {
        setCheckState('error');
      }
    } catch {
      setCheckState('error');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRecheck = async () => {
    await fetchStatus();
    showToast('info', 'Đã kiểm tra lại', 'Đã cập nhật trạng thái cổng thanh toán.');
  };

  const handleTestToken = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any; message: string }>(
        '/premium/gateway/token/test',
        {
          method: 'POST',
        },
      );
      if (res?.success) {
        showToast('success', 'Kiểm tra token', res.message);
        await fetchStatus(); // Refresh status
      }
    } catch (error: any) {
      showToast('error', 'Lỗi kiểm tra', 'Không thể kiểm tra token');
    }
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) {
      showToast('error', 'Lỗi', 'Vui lòng nhập Gateway Token');
      return;
    }

    setSaveState('saving');
    try {
      const res = await apiRequest<{ success: boolean; data: any; message: string }>(
        '/premium/gateway/token',
        {
          method: 'POST',
          body: JSON.stringify({ token: tokenInput.trim() }),
        },
      );
      if (res?.success) {
        showToast('success', 'Lưu token thành công', res.message);
        setTokenInput(''); // Clear input after save
        await fetchStatus(); // Refresh status
        setSaveState('success');
      }
    } catch (error: any) {
      showToast('error', 'Lỗi lưu token', 'Không thể lưu token');
      setSaveState('error');
    }
  };

  /* ─── helpers ─── */
  const dot = (ok: boolean) =>
    ok ? (
      <span className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
        <CheckCircle2 className="w-4 h-4 shrink-0" /> Hoạt động
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-rose-400 text-sm font-semibold">
        <XCircle className="w-4 h-4 shrink-0" /> Không khả dụng
      </span>
    );

  const tokenStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full">Đang hoạt động</span>;
      case 'EXPIRED':
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full">Đã hết hạn</span>;
      case 'INVALID':
        return <span className="px-2 py-1 bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-full">Không hợp lệ</span>;
      default:
        return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-xs font-semibold rounded-full">Chưa cấu hình</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Cấu hình Thanh Toán PayOS</h2>
          <p className="text-xs text-slate-400">
            Quản lý Gateway Token — Admin tự đăng nhập vào PayOS và dán token vào đây.
          </p>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-blue-300">Bảo mật:</span> Admin tự đăng nhập vào{' '}
          <a href="https://pay-8dip.onrender.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            PayOS Gateway
          </a>{' '}
          để lấy JWT Token, sau đó dán vào ô dưới đây. Token được lưu an toàn trong database
          backend và không bao giờ hiển thị lại. Frontend không lưu trữ token.
        </p>
      </div>

      {/* Token Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-200">Cấu hình Gateway Token</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Gateway Token (JWT từ PayOS)
            </label>
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Dán JWT Token từ PayOS Gateway vào đây..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none h-24"
              disabled={saveState === 'saving'}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToken}
              disabled={saveState === 'saving' || !tokenInput.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveState === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Lưu Token
                </>
              )}
            </button>

            {status?.configured && (
              <button
                onClick={handleTestToken}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Kiểm tra Token
              </button>
            )}
          </div>
        </div>

        {saveState === 'success' && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Đã lưu Gateway Token thành công.
          </div>
        )}

        {saveState === 'error' && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-xs">
            <XCircle className="w-4 h-4 shrink-0" />
            Không thể lưu Gateway Token. Vui lòng thử lại.
          </div>
        )}
      </div>

      {/* Status card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-200">Trạng thái hiện tại</span>
          <button
            onClick={handleRecheck}
            disabled={checkState === 'loading'}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkState === 'loading' ? 'animate-spin' : ''}`} />
            Kiểm tra lại
          </button>
        </div>

        {checkState === 'loading' && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Đang kiểm tra kết nối...
          </div>
        )}

        {checkState === 'error' && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Không thể lấy trạng thái từ backend. Vui lòng thử lại.
          </div>
        )}

        {checkState === 'success' && status && (
          <div className="divide-y divide-slate-800">
            {/* Token configured */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-slate-300 font-medium">Gateway Token</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Token đã được cấu hình bởi Admin
                </p>
              </div>
              <div className="flex items-center gap-2">
                {tokenStatusBadge(status.tokenStatus)}
                {dot(status.configured)}
              </div>
            </div>

            {/* Reachable */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-slate-300 font-medium">Kết nối cổng thanh toán</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  pay-8dip.onrender.com
                </p>
              </div>
              {dot(status.reachable)}
            </div>

            {/* Last checked */}
            <div className="flex items-center justify-between py-3">
              <p className="text-sm text-slate-400">Lần kiểm tra cuối</p>
              <span className="text-xs text-slate-500">
                {status.lastCheckedAt
                  ? new Date(status.lastCheckedAt).toLocaleString('vi-VN')
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Overall badge */}
      {checkState === 'success' && status && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-5 py-4 border ${
            status.configured && status.reachable && status.tokenStatus === 'ACTIVE'
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-rose-500/5 border-rose-500/20'
          }`}
        >
          {status.configured && status.reachable && status.tokenStatus === 'ACTIVE' ? (
            <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          )}
          <div>
            <p
              className={`text-sm font-bold ${
                status.configured && status.reachable && status.tokenStatus === 'ACTIVE'
                  ? 'text-green-300'
                  : 'text-amber-300'
              }`}
            >
              {status.configured && status.reachable && status.tokenStatus === 'ACTIVE'
                ? 'Cổng thanh toán đang hoạt động bình thường'
                : 'Cổng thanh toán chưa sẵn sàng'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {status.configured && status.reachable && status.tokenStatus === 'ACTIVE'
                ? 'User có thể thực hiện thanh toán Premium.'
                : status.tokenStatus === 'EXPIRED'
                ? 'Gateway Token đã hết hạn. Admin cần cập nhật token mới.'
                : status.tokenStatus === 'INVALID'
                ? 'Gateway Token không hợp lệ. Admin cần kiểm tra lại.'
                : 'Chưa cấu hình Gateway Token. Admin cần đăng nhập vào PayOS và dán token.'}
            </p>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          <strong>Hướng dẫn:</strong> Truy cập{' '}
          <a href="https://pay-8dip.onrender.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">
            PayOS Gateway
          </a>
          , đăng nhập tài khoản, copy JWT Token và dán vào ô trên. Token được lưu an toàn
          trong database backend. Nếu token hết hạn (401 error), Admin cần lấy token mới và cập nhật.
        </p>
      </div>
    </div>
  );
};
