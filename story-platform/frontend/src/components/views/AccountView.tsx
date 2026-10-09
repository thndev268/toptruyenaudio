import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {  Award, 
  User,
  Crown,
  Edit3,
  Volume2,
  Globe,
  LifeBuoy,
  MessageSquare,
  LogOut,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Sliders,
  AtSign,
  } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';
import { userProfileRepository, UserProfileData } from '../../services/repositories/UserProfileRepository';
import { useToast } from '../../context/ToastContext';
import { FocusTrap } from '../common/FocusTrap';

export const AccountView: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    volume,
    setVolumeLevel,
    playbackRate,
    setSpeedRate,
    autoPlayNext,
    setAutoPlayNextToggle,
    audioQuality,
    setAudioQuality,
  } = useAudioPlayer();

  // Profile data from backend source of truth
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);

  // Modals state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  // Focus restore refs for accessibility
  const logoutBtnRef = useRef<HTMLButtonElement | null>(null);

  // Fetch live backend profile
  useEffect(() => {
    let mounted = true;
    userProfileRepository
      .getCurrentProfile()
      .then((data) => {
        if (mounted) setProfileData(data);
      })
      .catch(() => {
        // Fallback silently
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!user) {
    return null;
  }

  // Calculate membership tier: prefer backend live profile, fallback to repository
  const sub = subscriptionRepository.getCurrentSubscription(user.id);
  const isPremiumActive =
    profileData?.membership
      ? profileData.membership.tier === 'PREMIUM' && profileData.membership.subscriptionStatus === 'ACTIVE'
      : sub.membershipTier === 'PREMIUM' &&
        sub.status === 'ACTIVE' &&
        (!sub.expiresAt || new Date(sub.expiresAt).getTime() > Date.now());

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    showToast('info', 'Đã đăng xuất', 'Bạn đã đăng xuất khỏi tài khoản thành công.');
    navigate('/', { replace: true });
  };

  const displayName = profileData?.name || user.name;
  const username = profileData?.username;
  const avatarUrl = profileData?.avatarUrl || user.avatarUrl;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fadeIn pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Circular Avatar */}
            <div className="relative shrink-0">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={`Ảnh đại diện của ${displayName}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500/40 bg-slate-100 dark:bg-slate-800 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                }}
              />
              {isPremiumActive && (
                <div
                  className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md"
                  title="Tài khoản Premium"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{displayName}</h1>
              {username && (
                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center justify-center sm:justify-start gap-0.5">
                  <AtSign className="w-3 h-3" />
                  <span>{username}</span>
                </p>
              )}
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-all">{user.email}</p>

              {/* Subscription Status */}
              <div className="pt-1.5 flex items-center justify-center sm:justify-start gap-2">
                {isPremiumActive ? (
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full font-bold text-xs flex items-center gap-1 shadow-sm">
                    <Crown className="w-3.5 h-3.5" /> Premium
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 rounded-full font-semibold text-xs">
                    Tài khoản FREE
                  </span>
                )}

                {isPremiumActive ? (
                  <Link
                    to="/account/subscription"
                    className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline ml-1"
                  >
                    Quản lý gói
                  </Link>
                ) : (
                  <Link
                    to="/premium"
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline ml-1 flex items-center gap-0.5"
                  >
                    Nâng cấp Premium
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <Link
            to="/account/edit"
            className="w-full sm:w-auto px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 min-h-[44px] shrink-0"
            aria-label="Chỉnh sửa thông tin tài khoản"
          >
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh sửa</span>
          </Link>
        </div>
      </div>

      {/* MENU GROUPS */}
      <div className="space-y-6">
        {/* GROUP 0: VINH DANH & DANH HIỆU */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
            Vinh danh & Thành tích
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-lg">
            <Link
              to="/account/badges"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group min-h-[44px]"
              aria-label="Xem Danh hiệu & Huy hiệu"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                    Danh hiệu & Huy hiệu vinh danh
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Bộ sưu tập huy hiệu, khung đại diện & danh hiệu hiệu ứng đặc biệt
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
            </Link>
          </div>
        </div>

        {/* GROUP 1: ỨNG DỤNG */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
            Ứng dụng
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-lg">
            {/* Cài đặt âm thanh */}
            <button
              onClick={() => setShowAudioModal(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group min-h-[44px]"
              aria-label="Cài đặt âm thanh"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    Cài đặt âm thanh
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Tốc độ phát ({playbackRate}x), âm lượng, chất lượng ({audioQuality})
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
            </button>

            {/* Ngôn ngữ */}
            <button
              onClick={() => setShowLangModal(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group min-h-[44px]"
              aria-label="Ngôn ngữ ứng dụng"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    Ngôn ngữ
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Tiếng Việt (Chính thức)
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
            </button>
          </div>
        </div>

        {/* GROUP 2: HỖ TRỢ */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
            Hỗ trợ
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-lg">
            {/* Trung tâm hỗ trợ */}
            <Link
              to="/support"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group min-h-[44px]"
              aria-label="Đến Trung tâm hỗ trợ"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    Trung tâm hỗ trợ
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Câu hỏi thường gặp & hướng dẫn tài khoản
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
            </Link>

            {/* Trao đổi với Admin */}
            <Link
              to="/support/conversations"
              className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors group min-h-[44px]"
              aria-label="Đến trang Trao đổi với Admin"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                    Trao đổi với Admin
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Gửi yêu cầu & nhận phản hồi trực tiếp từ Quản trị viên
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
            </Link>
          </div>
        </div>

        {/* GROUP 3: KHÁC */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
            Khác
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            {/* Đăng xuất */}
            <button
              ref={logoutBtnRef}
              onClick={() => setShowLogoutModal(true)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors group min-h-[44px]"
              aria-label="Đăng xuất khỏi tài khoản"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400 group-hover:text-rose-500 dark:group-hover:text-rose-300 transition-colors">
                    Đăng xuất
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Thoát phiên làm việc trên thiết bị này
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-500/60 group-hover:text-rose-500 transition-colors shrink-0 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* AUDIO SETTINGS MODAL */}
      {showAudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <FocusTrap onEscape={() => setShowAudioModal(false)}>
            <div
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100"
              role="dialog"
              aria-labelledby="audio-modal-title"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 id="audio-modal-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Cài Đặt Âm Thanh
                </h3>
                <button
                  onClick={() => setShowAudioModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                  aria-label="Đóng cài đặt âm thanh"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Playback Rate */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tốc độ phát audio</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSpeedRate(rate)}
                        className={`py-2 text-xs font-bold font-mono rounded-xl border transition-all ${
                          playbackRate === rate
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                            : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Âm lượng</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Auto Play Next */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Tự động phát tập tiếp theo</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Tự chuyển sang tập liền sau khi hoàn tất</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPlayNext}
                    onChange={(e) => setAutoPlayNextToggle(e.target.checked)}
                    className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Audio Quality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chất lượng nguồn audio</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAudioQuality('STANDARD')}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        audioQuality === 'STANDARD'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">Chuẩn (Standard)</div>
                      <div className="text-[10px] text-slate-500">Tiết kiệm dung lượng dữ liệu</div>
                    </button>

                    <button
                      onClick={() => setAudioQuality('HIGH')}
                      className={`p-3 text-left rounded-xl border transition-all ${
                        audioQuality === 'HIGH'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">Cao (High Quality)</div>
                      <div className="text-[10px] text-slate-500">Âm thanh trung thực HD</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowAudioModal(false)}
                  className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-colors min-h-[40px]"
                >
                  Xong
                </button>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}

      {/* LANGUAGE MODAL */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <FocusTrap onEscape={() => setShowLangModal(false)}>
            <div
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100"
              role="dialog"
              aria-labelledby="lang-modal-title"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 id="lang-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" /> Chọn Ngôn Ngữ
                </h3>
                <button
                  onClick={() => setShowLangModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                  aria-label="Đóng bảng chọn ngôn ngữ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base">🇻🇳</span>
                    <div>
                      <div className="text-xs font-bold text-white">Tiếng Việt</div>
                      <div className="text-[10px] text-cyan-400 font-semibold">Chính thức (Mặc định)</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-500 text-xs space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Chú thích ngôn ngữ
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Các ngôn ngữ khác (English, 中文, 日本語) hiện chưa được hỗ trợ chính thức trong phiên bản này. TOP TRUYỆN AUDIO ưu tiên tối ưu trải nghiệm tiếng Việt chuẩn.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowLangModal(false)}
                  className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl min-h-[40px]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <FocusTrap
            onEscape={() => {
              setShowLogoutModal(false);
              logoutBtnRef.current?.focus();
            }}
          >
            <div
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-modal-title"
              aria-describedby="logout-modal-desc"
            >
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 id="logout-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Xác Nhận Đăng Xuất
                </h3>
                <p id="logout-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bạn có chắc muốn đăng xuất khỏi tài khoản không?
                </p>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    logoutBtnRef.current?.focus();
                  }}
                  className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors min-h-[44px]"
                >
                  Hủy
                </button>

                <button
                  onClick={handleConfirmLogout}
                  className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-colors min-h-[44px]"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </div>
  );
};
