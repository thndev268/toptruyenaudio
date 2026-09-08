import React, { useState, useEffect } from 'react';
import { Send, Save, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { siteSettingsService, TelegramSettings } from '../../../services/siteSettings';
import { apiRequest } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';

export const TelegramSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<TelegramSettings>({
    isEnabled: false,
    botToken: '',
    adminChatId: '',
    webhookSecret: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiRequest('/admin/telegram/settings');
      if (response) {
        setSettings({
          isEnabled: response.isEnabled || false,
          botToken: response.botToken || '',
          adminChatId: response.adminChatId || '',
          webhookSecret: response.webhookSecret || '',
        });
      }
    } catch (error) {
      console.error('Failed to load Telegram settings:', error);
      // Fallback to localStorage
      setSettings(siteSettingsService.getTelegramSettings());
    }
  };

  const handleSave = async () => {
    setError(null);

    if (settings.isEnabled) {
      if (!settings.botToken) {
        setError('Vui lòng nhập Bot Token.');
        return;
      }
      if (!settings.adminChatId) {
        setError('Vui lòng nhập Admin Chat ID.');
        return;
      }
    }

    try {
      await apiRequest('/admin/telegram/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      siteSettingsService.updateTelegramSettings(settings);
      showToast('success', 'Thành công', 'Đã lưu cấu hình Telegram thành công!');
      setTestResult(null);
    } catch (error) {
      console.error('Failed to save Telegram settings:', error);
      setError('Không thể lưu cấu hình. Vui lòng thử lại.');
    }
  };

  const handleTestConnection = async () => {
    if (!settings.botToken || !settings.adminChatId) {
      setError('Vui lòng nhập Bot Token và Admin Chat ID trước khi kiểm tra kết nối.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await apiRequest('/admin/telegram/test', {
        method: 'POST',
        body: JSON.stringify({
          botToken: settings.botToken,
          adminChatId: settings.adminChatId,
        }),
      });

      setTestResult({
        success: response.success || false,
        message: response.message || 'Kết nối thành công!',
      });

      if (response.success) {
        showToast('success', 'Kết nối thành công', 'Đã kết nối thành công với Telegram Bot!');
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error?.message || 'Không thể kết nối đến Telegram. Vui lòng kiểm tra lại thông tin.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2 text-blue-400 mb-2">
        <Send className="w-5 h-5" />
        <h3 className="text-lg font-bold text-white">Cấu Hình Telegram Bot</h3>
      </div>

      <p className="text-xs sm:text-sm text-slate-400">
        Cấu hình Telegram Bot để nhận và gửi tin nhắn hỗ trợ từ người dùng.
      </p>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
          {error}
        </div>
      )}

      {testResult && (
        <div className={`p-3 border text-xs rounded-xl flex items-center gap-2 ${
          testResult.success
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Toggle Enable */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Trạng thái (Bật/Tắt Telegram Bot)</span>
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.isEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Form Fields */}
        <div className={`space-y-4 transition-opacity ${settings.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Bot Token</label>
            <input
              type="text"
              value={settings.botToken}
              onChange={(e) => setSettings(prev => ({ ...prev, botToken: e.target.value }))}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500">
              Lấy từ @BotFather trên Telegram
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Admin Chat ID</label>
            <input
              type="text"
              value={settings.adminChatId}
              onChange={(e) => setSettings(prev => ({ ...prev, adminChatId: e.target.value }))}
              placeholder="123456789"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500">
              Chat ID của admin sẽ nhận tin nhắn hỗ trợ
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Webhook Secret (Tùy chọn)</label>
            <input
              type="text"
              value={settings.webhookSecret}
              onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
              placeholder="your-secret-key"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500">
              Mã bảo mật để xác thực webhook từ Telegram
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isTesting || !settings.botToken || !settings.adminChatId}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kiểm Tra Kết Nối</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cấu Hình Telegram</span>
        </button>
      </div>
    </div>
  );
};
