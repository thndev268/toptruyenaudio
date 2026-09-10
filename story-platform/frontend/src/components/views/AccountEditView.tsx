import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  KeyRound,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  ShieldCheck,
  AtSign,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userProfileRepository, UserProfileData } from '../../services/repositories/UserProfileRepository';
import { AvatarPicker } from '../../components/common/AvatarPicker';

export const AccountEditView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Active Segment Tab ('profile' | 'password')
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Server Profile State
  const [serverProfile, setServerProfile] = useState<UserProfileData | null>(null);

  // FORM 1: PROFILE STATE
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [username, setUsername] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isVersionConflict, setIsVersionConflict] = useState(false);

  // AVATAR STATE
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    if (user?.avatarUrl) {
      if (user.avatarUrl.startsWith('/avatars/')) {
        return user.avatarUrl.replace('/avatars/', '');
      }
      return user.avatarUrl;
    }
    return '';
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // FORM 2: PASSWORD STATE
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibilities
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Load profile from repository
  const loadProfile = async () => {
    try {
      const profile = await userProfileRepository.getCurrentProfile();
      setServerProfile(profile);
      setDisplayName(profile.name || user?.name || '');
      setUsername(profile.username || '');
      setIsVersionConflict(false);
    } catch {
      if (user) {
        setDisplayName(user.name || '');
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (!user) {
    return null;
  }

  // Calculate if profile form has pending changes
  const safeDisplayName = displayName || '';
  const safeUsername = username || '';
  const safeInitialName = serverProfile?.name || user?.name || '';
  const safeInitialUsername = serverProfile?.username || '';

  const hasProfileChanged =
    safeDisplayName.trim() !== safeInitialName.trim() ||
    safeUsername.trim().toLowerCase() !== safeInitialUsername.trim().toLowerCase() ||
    selectedAvatar !== (serverProfile?.avatarUrl?.replace('/avatars/', '') || '');

  // SUBMIT PROFILE UPDATE
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsVersionConflict(false);

    const trimmedName = (displayName || '').trim();
    if (!trimmedName) {
      setProfileError('Tên hiển thị không được để trống.');
      return;
    }

    const trimmedUsername = (username || '').trim();
    if (trimmedUsername) {
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        setProfileError('Tên người dùng chỉ được bao gồm chữ cái, số và dấu gạch dưới (_).');
        return;
      }
    }

    setIsSavingProfile(true);

    try {
      // Handle avatar from preset list
      const avatarUrlToSave = selectedAvatar ? `/avatars/${selectedAvatar}` : (serverProfile?.avatarUrl || user.avatarUrl);

      // Update Profile via Repository
      const updatedData = await userProfileRepository.updateProfile({
        name: trimmedName,
        username: trimmedUsername || undefined,
        avatarUrl: avatarUrlToSave,
      });

      setServerProfile(updatedData);

      // Synchronize Auth Context
      updateUser({
        name: updatedData.name,
        avatarUrl: updatedData.avatarUrl,
      });

      setProfileSuccess('Đã cập nhật hồ sơ thành công.');
      showToast('success', 'Thành công', 'Thông tin hồ sơ của bạn đã được cập nhật.');
    } catch (err: any) {
      if (err?.message === 'VERSION_CONFLICT') {
        setIsVersionConflict(true);
        setProfileError('Dữ liệu hồ sơ đã bị thay đổi bởi phiên khác. Vui lòng tải lại dữ liệu mới.');
        showToast('error', 'Xung đột dữ liệu', 'Vui lòng tải lại trang để lấy thông tin mới nhất.');
      } else if (err?.message?.includes('USERNAME_ALREADY_EXISTS')) {
        setProfileError('Tên người dùng này đã được người khác sử dụng.');
        showToast('error', 'Tên người dùng đã tồn tại', 'Vui lòng chọn một tên người dùng khác.');
      } else {
        setProfileError('Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
        showToast('error', 'Lỗi cập nhật', 'Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // SUBMIT PASSWORD CHANGE
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await userProfileRepository.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess('Đổi mật khẩu thành công. Tất cả phiên đăng nhập khác đã được đăng xuất an toàn.');
      showToast('success', 'Đổi mật khẩu thành công', 'Mật khẩu của bạn đã được thay đổi an toàn.');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.message === 'CURRENT_PASSWORD_INCORRECT') {
        setPasswordError('Mật khẩu hiện tại không chính xác.');
        showToast('error', 'Mật khẩu sai', 'Mật khẩu hiện tại bạn nhập không chính xác.');
      } else if (err?.message === 'PASSWORD_REUSE_NOT_ALLOWED') {
        setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
        showToast('error', 'Mật khẩu không hợp lệ', 'Vui lòng chọn mật khẩu mới khác mật khẩu hiện tại.');
      } else {
        const msg = 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra lại.';
        setPasswordError(msg);
        showToast('error', 'Lỗi hệ thống', msg);
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const currentAvatarSrc =
    selectedAvatar ? `/avatars/${selectedAvatar}` : (serverProfile?.avatarUrl || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fadeIn pb-24">
      {/* NAVIGATION BACK BUTTON */}
      <div className="flex items-center justify-between">
        <Link
          to="/account"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Hồ sơ</span>
        </Link>
        <h1 className="text-lg sm:text-xl font-bold text-white">Chỉnh sửa tài khoản</h1>
      </div>

      {/* HEADER AVATAR & USER SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-5">
        <div className="relative shrink-0 group">
          <img
            src={currentAvatarSrc}
            alt={`Ảnh đại diện của ${displayName || user.name}`}
            className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500/40 bg-slate-800 shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
            }}
          />
        </div>

        <div className="text-center sm:text-left min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-bold text-white truncate">{displayName || user.name}</h2>
          </div>
          <p className="text-xs text-slate-400 break-all">{user.email}</p>

          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 min-h-[36px]"
            >
              <User className="w-3.5 h-3.5" />
              <span>Thay ảnh đại diện</span>
            </button>
          </div>
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={selectedAvatar}
          onSelect={(avatar) => setSelectedAvatar(avatar)}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {/* SEGMENTED CONTROL TABS */}
      <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-2 gap-1 shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
            activeTab === 'profile'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          aria-selected={activeTab === 'profile'}
          role="tab"
        >
          <User className="w-4 h-4" />
          <span>Chỉnh sửa hồ sơ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
            activeTab === 'password'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          aria-selected={activeTab === 'password'}
          role="tab"
        >
          <KeyRound className="w-4 h-4" />
          <span>Đổi mật khẩu</span>
        </button>
      </div>

      {/* TAB 1: EDIT PROFILE FORM */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" /> Thông Tin Hồ Sơ
            </h3>
            <p className="text-xs text-slate-400 mt-1">Cập nhật tên hiển thị và tên người dùng của bạn</p>
          </div>

          {profileSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{profileError}</span>
              </div>
              {isVersionConflict && (
                <button
                  type="button"
                  onClick={loadProfile}
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tải lại
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="displayNameInput" className="block text-xs font-bold text-slate-300">
                Tên hiển thị <span className="text-rose-400">*</span>
              </label>
              <input
                id="displayNameInput"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setProfileError(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors min-h-[44px]"
                placeholder="Nhập tên hiển thị của bạn"
                required
              />
              <p className="text-[11px] text-slate-500">
                Tên này sẽ xuất hiện công khai khi bạn bình luận, đánh giá và tương tác.
              </p>
            </div>

            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="usernameInput" className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5 text-cyan-400" /> Tên người dùng (Username)
              </label>
              <input
                id="usernameInput"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setProfileError(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors min-h-[44px]"
                placeholder="ví dụ: docgia_kimdung (tùy chọn)"
              />
              <p className="text-[11px] text-slate-500">
                Chỉ chứa chữ cái, chữ số và dấu gạch dưới (_). Dùng để định danh riêng cho tài khoản.
              </p>
            </div>

            {/* Read-only Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Địa chỉ Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-500 cursor-not-allowed select-none min-h-[44px]"
              />
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Email không thể thay đổi để đảm bảo bảo mật tài khoản.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={!hasProfileChanged || isSavingProfile}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CHANGE PASSWORD FORM */}
      {activeTab === 'password' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" /> Đổi Mật Khẩu
            </h3>
            <p className="text-xs text-slate-400 mt-1">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản</p>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label htmlFor="currentPassInput" className="block text-xs font-bold text-slate-300">
                Mật khẩu hiện tại <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="currentPassInput"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  autoComplete="current-password"
                  aria-label="Mật khẩu hiện tại"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors min-h-[44px]"
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="newPassInput" className="block text-xs font-bold text-slate-300">
                Mật khẩu mới <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="newPassInput"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  autoComplete="new-password"
                  aria-label="Mật khẩu mới"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors min-h-[44px]"
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassInput" className="block text-xs font-bold text-slate-300">
                Xác nhận mật khẩu mới <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassInput"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  autoComplete="new-password"
                  aria-label="Xác nhận mật khẩu mới"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors min-h-[44px]"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Password Button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
              >
                {isSavingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
