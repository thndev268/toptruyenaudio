import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { apiRequest } from '../../../services/apiClient';

interface Banner {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PROMOTION';
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface BannersScreenProps {
  banners: Banner[];
  onCreateBanner: (banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBanner: (id: string, banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteBanner: (id: string) => void;
}

export const BannersScreen: React.FC<BannersScreenProps> = ({
  banners,
  onCreateBanner,
  onUpdateBanner,
  onDeleteBanner,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    imageUrl: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PROMOTION';
    backgroundColor: string;
    textColor: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
    priority: number;
  }>({
    title: '',
    content: '',
    imageUrl: '',
    type: 'INFO',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    isActive: true,
    startDate: '',
    endDate: '',
    priority: 0,
  });

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      content: banner.content,
      imageUrl: banner.imageUrl || '',
      type: banner.type,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      isActive: banner.isActive,
      startDate: banner.startDate || '',
      endDate: banner.endDate || '',
      priority: banner.priority,
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      type: 'INFO',
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      isActive: true,
      startDate: '',
      endDate: '',
      priority: banners.length,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editingBanner) {
      const updates: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title || editingBanner.title,
        content: formData.content || editingBanner.content,
        imageUrl: formData.imageUrl || editingBanner.imageUrl,
        type: formData.type || editingBanner.type,
        backgroundColor: formData.backgroundColor || editingBanner.backgroundColor,
        textColor: formData.textColor || editingBanner.textColor,
        isActive: formData.isActive,
        startDate: formData.startDate || editingBanner.startDate,
        endDate: formData.endDate || editingBanner.endDate,
        priority: formData.priority,
      };
      onUpdateBanner(editingBanner.id, updates);
    } else {
      if (!formData.title || !formData.content) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
      onCreateBanner({
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl || undefined,
        type: formData.type,
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        isActive: formData.isActive,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        priority: formData.priority,
      });
    }
    setIsEditing(false);
    setEditingBanner(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingBanner(null);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const data = await apiRequest<{ success: boolean; data: { url: string }; message: string }>(
        'banners/upload-image',
        {
          method: 'POST',
          body: uploadFormData,
        }
      );

      if (data.success && data.data?.url) {
        setFormData({ ...formData, imageUrl: data.data.url });
      } else {
        alert('Upload ảnh thất bại: ' + (data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      alert('Upload ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ERROR':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'SUCCESS':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PROMOTION':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'INFO':
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Megaphone className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Quản Lý Banner
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Thông Báo Banner
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Cấu hình và quản lý các banner thông báo hiển thị trên website
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
              {editingBanner ? 'Cập Nhật Banner' : 'Thêm Banner Mới'}
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
                Tiêu Đề
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                placeholder="Nhập tiêu đề banner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Loại
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="SUCCESS">Success</option>
                <option value="PROMOTION">Promotion</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Nội Dung
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 min-h-[80px]"
                placeholder="Nhập nội dung banner"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hình Ảnh (Tùy chọn)
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  id="banner-image"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
                <label
                  htmlFor="banner-image"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang upload...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Ảnh</span>
                    </>
                  )}
                </label>
                {formData.imageUrl && (
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="p-2 hover:bg-slate-700 rounded-lg text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {formData.imageUrl && (
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="URL hình ảnh"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Màu Nền
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Màu Chữ
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ngày Bắt Đầu
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ngày Kết Thúc
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ưu Tiên
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Trạng Thái
              </label>
              <select
                value={formData.isActive.toString()}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="true">Hoạt động</option>
                <option value="false">Tạm dừng</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Lưu</span>
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Hủy</span>
            </button>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tiêu Đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ưu Tiên
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Chưa có banner nào
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {banner.imageUrl && (
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-white">{banner.title}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{banner.content}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getTypeColor(banner.type)}`}>
                        {banner.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        banner.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {banner.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {banner.priority}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-cyan-400"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa banner này?')) {
                              onDeleteBanner(banner.id);
                            }
                          }}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-red-400"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
