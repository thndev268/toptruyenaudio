import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Mail, Shield, Camera, Save, Loader2 } from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { InstallPwaButton } from '../common/InstallPwaButton';
import { AvatarPicker } from '../common/AvatarPicker';
import { userProfileRepository } from '../../services/repositories/UserProfileRepository';

export const ProfileView: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const { canInstall, isInstalled } = usePwaInstall();
  const isInstallable = canInstall && !isInstalled;
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    // Handle both base64 and path avatars
    if (user?.avatarUrl) {
      if (user.avatarUrl.startsWith('/avatars/')) {
        return user.avatarUrl.replace('/avatars/', '');
      }
      return user.avatarUrl; // Could be base64 or already a filename
    }
    return '';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Handle both base64 (upload) and path (public folder) avatars
      let avatarUrlToSave = '';
      if (selectedAvatar) {
        if (selectedAvatar.startsWith('data:')) {
          // Base64 from upload - save directly
          avatarUrlToSave = selectedAvatar;
        } else {
          // Filename from public folder - add prefix
          avatarUrlToSave = `/avatars/${selectedAvatar}`;
        }
      }

      await userProfileRepository.updateProfile({
        name: formData.name,
        avatarUrl: avatarUrlToSave,
        expectedVersion: undefined, // Don't send version check to avoid 409 conflict
      });

      // Update auth context
      if (user) {
        user.avatarUrl = avatarUrlToSave;
      }

      setLoading(false);
      showToast('success', 'Thành công', 'Thông tin hồ sơ đã được cập nhật.');
    } catch (error) {
      setLoading(false);
      showToast('error', 'Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        Vui lòng đăng nhập để xem hồ sơ.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Hồ Sơ Cá Nhân</h1>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold rounded border border-cyan-500/20">
            {role}
          </span>
          {user.isPremium && (
            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold rounded border border-amber-500/20">
              PREMIUM
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header/Avatar section */}
        <div className="h-32 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 relative">
          <div className="absolute -bottom-12 left-8 flex items-end gap-4">
            <div className="relative group">
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="w-24 h-24 rounded-2xl bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-slate-500 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-colors"
              >
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar.startsWith('data:') ? selectedAvatar : `/avatars/${selectedAvatar}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
              </button>
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white pointer-events-none">
                <Camera size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User size={14} /> Tên hiển thị
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="Nhập tên của bạn"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Mail size={14} /> Địa chỉ Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                placeholder="email@example.com"
              />
              <p className="text-[10px] text-slate-500">Email không thể thay đổi để đảm bảo bảo mật tài khoản.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                Giới thiệu bản thân
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors min-h-[100px] resize-none"
                placeholder="Một chút về bạn..."
              />
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Shield size={16} />
                <span className="text-xs">Dữ liệu của bạn được bảo mật</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {isInstallable && (
        <div className="mt-8 p-6 bg-slate-900 border border-slate-800/80 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-slate-100 font-bold text-sm">Trải nghiệm ứng dụng mượt mà</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thêm TOP TRUYỆN AUDIO lên điện thoại hoặc máy tính để nghe truyện nhanh chóng, ổn định và thuận tiện hơn.
            </p>
          </div>
          <InstallPwaButton variant="button" className="w-full md:w-auto" />
        </div>
      )}
      
      <div className="mt-8 p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
        <h3 className="text-rose-400 font-bold text-sm mb-2">Vùng nguy hiểm</h3>
        <p className="text-xs text-slate-500 mb-4">Sau khi xóa tài khoản, toàn bộ dữ liệu nghe và thư viện của bạn sẽ bị mất vĩnh viễn.</p>
        <button className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">
          Xóa Tài Khoản
        </button>
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={selectedAvatar}
          onSelect={(avatar) => setSelectedAvatar(avatar)}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
};
