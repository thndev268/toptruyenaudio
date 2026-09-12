import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';

interface SocialLink {
  id: string;
  platform: string;
  name: string;
  url: string;
  iconUrl?: string | null;
  isActive: boolean;
  order: number;
}

interface SocialLinksScreenProps {
  links: SocialLink[];
  onCreateLink: (link: Omit<SocialLink, 'id'>) => void;
  onUpdateLink: (id: string, link: Omit<SocialLink, 'id'>) => void;
  onDeleteLink: (id: string) => void;
  onToggleLink: (id: string) => void;
}

export const SocialLinksScreen: React.FC<SocialLinksScreenProps> = ({
  links,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onToggleLink,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [formData, setFormData] = useState<{
    platform: string;
    name: string;
    url: string;
    iconUrl: string;
    isActive: boolean;
    order: number;
  }>({
    platform: '',
    name: '',
    url: '',
    iconUrl: '',
    isActive: true,
    order: 0,
  });

  const handleEdit = (link: SocialLink) => {
    setEditingLink(link);
    setFormData({
      platform: link.platform,
      name: link.name,
      url: link.url,
      iconUrl: link.iconUrl || '',
      isActive: link.isActive,
      order: link.order,
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingLink(null);
    setFormData({
      platform: '',
      name: '',
      url: '',
      iconUrl: '',
      isActive: true,
      order: links.length,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingLink) {
      const updates: Omit<SocialLink, 'id'> = {
        platform: (formData.platform || editingLink.platform) as string,
        name: (formData.name || editingLink.name) as string,
        url: (formData.url || editingLink.url) as string,
        iconUrl: formData.iconUrl || null,
        isActive: formData.isActive,
        order: formData.order,
      };
      onUpdateLink(editingLink.id, updates);
    } else {
      if (!formData.platform || !formData.name || !formData.url) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
      onCreateLink({
        platform: formData.platform,
        name: formData.name,
        url: formData.url,
        iconUrl: formData.iconUrl || null,
        isActive: formData.isActive,
        order: formData.order,
      });
    }
    setIsEditing(false);
    setEditingLink(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingLink(null);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      INSTAGRAM: '📷',
      LINKEDIN: '💼',
      WHATSAPP: '💬',
      YOUTUBE: '▶️',
      FACEBOOK: '📘',
      TIKTOK: '🎵',
      TWITTER: '🐦',
    };
    return icons[platform] || '🔗';
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Share2 className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Quản Lý Social Media
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Liên Kết Mạng Xã Hội
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cấu hình và quản lý các liên kết mạng xã hội hiển thị ở footer
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all inline-flex items-center gap-2 min-h-[38px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Mới</span>
        </button>
      </div>

      {/* Edit/Create Form */}
      {isEditing && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {editingLink ? 'Cập Nhật Liên Kết' : 'Thêm Liên Kết Mới'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">Chọn platform</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="TIKTOK">TikTok</option>
                <option value="TWITTER">Twitter</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tên Hiển Thị
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Instagram"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://instagram.com/yourprofile"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Icon URL (Optional)
              </label>
              <input
                type="url"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                placeholder="https://example.com/icon.png"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thứ Tự Hiển Thị
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Trạng Thái
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.isActive
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {formData.isActive ? 'Đang Bật' : 'Đã Tắt'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Lưu</span>
            </button>
          </div>
        </div>
      )}

      {/* Links List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <div
            key={link.id}
            className={`bg-slate-900 border rounded-2xl p-5 shadow-xl space-y-4 ${
              link.isActive ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                  {getPlatformIcon(link.platform)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{link.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{link.platform}</p>
                </div>
              </div>

              <button
                onClick={() => onToggleLink(link.id)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {link.isActive ? (
                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-slate-500" />
                )}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{link.url}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Thứ tự: {link.order}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => handleEdit(link)}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all inline-flex items-center justify-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Sửa</span>
              </button>
              <button
                onClick={() => onDeleteLink(link.id)}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all inline-flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {links.length === 0 && !isEditing && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Share2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Chưa có liên kết mạng xã hội nào</p>
          <button
            onClick={handleCreate}
            className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Liên Kết Đầu Tiên</span>
          </button>
        </div>
      )}
    </div>
  );
};
