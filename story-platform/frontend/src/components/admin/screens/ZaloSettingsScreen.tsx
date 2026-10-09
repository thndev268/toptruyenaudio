import React, { useState, useEffect } from 'react';
import { MessageCircle, Save } from 'lucide-react';
import { siteSettingsService, ZaloSettings } from '../../../services/siteSettings';
import { useToast } from '../../../context/ToastContext';

export const ZaloSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<ZaloSettings>({
    isEnabled: false,
    link: '',
    displayName: '',
    position: 'right',
  });
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setSettings(siteSettingsService.getZaloSettings());
  }, []);

  const handleSave = () => {
    setError(null);

    if (settings.isEnabled) {
      if (!settings.link) {
        setError('Vui lòng nhập Link Nhóm Zalo.');
        return;
      }

      try {
        const url = new URL(settings.link);
        if (url.protocol !== 'https:' || !url.hostname.endsWith('zalo.me')) {
          setError('Link không hợp lệ. Phải là https và thuộc tên miền zalo.me.');
          return;
        }
      } catch (e) {
        setError('Link không đúng định dạng URL.');
        return;
      }
    }

    siteSettingsService.updateZaloSettings(settings);
    showToast('success', 'Thành công', 'Đã lưu cấu hình Zalo thành công!');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2 text-blue-400 mb-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-bold text-white">Liên hệ Zalo</h3>
      </div>
      
      <p className="text-xs sm:text-sm text-slate-400">
        Hiển thị nút Zalo nổi trên toàn hệ thống giúp người dùng dễ dàng truy cập nhóm Zalo của bạn.
      </p>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Toggle Enable */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Trạng thái (Bật/Tắt nút Zalo)</span>
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
            <label className="text-xs font-bold text-slate-400">Link Nhóm Zalo (zalo.me)</label>
            <input
              type="url"
              value={settings.link}
              onChange={(e) => setSettings(prev => ({ ...prev, link: e.target.value }))}
              placeholder="https://zalo.me/g/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tên Hiển Thị (Hover)</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Cộng đồng Zalo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Vị Trí Nút Nổi</label>
            <select
              value={settings.position}
              onChange={(e) => setSettings(prev => ({ ...prev, position: e.target.value as 'left' | 'right' }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="right">Góc dưới, Bên Phải</option>
              <option value="left">Góc dưới, Bên Trái</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cấu Hình Zalo</span>
        </button>
      </div>
    </div>
  );
};
