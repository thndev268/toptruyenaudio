import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Headphones,
  Compass,
  Grid,
  Trophy,
  Bookmark,
  Mic,
  Share2,
  ShieldCheck,
  Menu,
  X,
  Crown,
  Bell,
  User,
  ChevronDown,
  LogIn,
  LogOut,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { MegaMenu } from '../common/MegaMenu';
import { BrandLogo } from '../branding/BrandLogo';
import { NotificationBell } from './NotificationBell';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { NotificationListModal } from '../common/NotificationListModal';
import { motion, AnimatePresence } from 'motion/react';
import { motionTokens } from '../../config/motionTokens';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { InstallPwaButton } from '../common/InstallPwaButton';
import { usePwaInstall } from '../../context/PwaInstallContext';

export const Navbar: React.FC = () => {
  const { role, user, logout, switchRole } = useAuth();
  const { unreadCount, markAsRead, deleteNotification, openNotificationModal } = useNotifications();
  const { canInstall, isInstalled } = usePwaInstall();
  const showInstallAttention = canInstall && !isInstalled;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [isMobileNotifOpen, setIsMobileNotifOpen] = useState(false);

  useBodyScrollLock(mobileMenuOpen);

  const navigate = useNavigate();

  const handleViewDetail = (notif: Notification) => {
    markAsRead(notif.id);
    openNotificationModal(notif);
    setIsMobileNotifOpen(false);
  };

  // Lock body scroll on mobile drawer open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { path: '/', label: 'Trang Chủ', icon: Headphones },
    { path: '/explore', label: 'Khám Phá', icon: Compass },
    { path: '/genres', label: 'Thể Loại', icon: Grid, hasDropdown: true },
    { path: '/rankings', label: 'Xếp Hạng', icon: Trophy },
    { path: '/library', label: 'Thư Viện', icon: Bookmark, protected: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-all">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block">
              <BrandLogo variant="full" />
            </div>
            <div className="block sm:hidden">
              <BrandLogo variant="compact" />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 relative">
            {navItems.map((item) => {
              if (item.protected && role === 'GUEST') return null;
              const IconComp = item.icon;

              if (item.hasDropdown) {
                return (
                  <div key={item.path} className="relative">
                    <button
                      onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        megaMenuOpen
                          ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                      aria-expanded={megaMenuOpen}
                      aria-haspopup="true"
                      aria-label="Mở menu Thể Loại"
                    >
                      <IconComp className="w-4 h-4" />
                      <span>{item.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMegaMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  <IconComp className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Role-specific Quick Nav Links */}
            {role === 'CREATOR' && (
              <NavLink
                to="/creator"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`
                }
              >
                <Mic className="w-4 h-4" />
                <span>Creator Studio</span>
              </NavLink>
            )}

            {role === 'PARTNER' && (
              <NavLink
                to="/partner"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10'
                  }`
                }
              >
                <Share2 className="w-4 h-4" />
                <span>Partner Portal</span>
              </NavLink>
            )}

            {role === 'ADMIN' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Portal</span>
              </NavLink>
            )}
          </nav>

          {/* Mega Menu Dropdown */}
          <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

          {/* Right Actions: Auth User Dropdown, Premium, Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            {role !== 'GUEST' && <NotificationBell />}

            {/* Premium Status Chip */}
            {role !== 'GUEST' ? (
              <Link
                to="/premium"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold shadow-sm transition-all shrink-0 min-h-[38px]"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Premium</span>
              </Link>
            ) : (
              <Link
                to="/premium"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-cyan-600 dark:text-cyan-400 rounded-full text-xs font-bold shadow-sm transition-all shrink-0 min-h-[38px]"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Nâng cấp</span>
              </Link>
            )}

            {/* User Account Portal Menu / Login Button */}
            {role === 'GUEST' ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition-all min-h-[38px] border border-slate-300 dark:border-slate-700"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md min-h-[38px]"
                >
                  Đăng Ký
                </Link>
              </div>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="relative p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Tài khoản người dùng"
                >
                  <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {showInstallAttention && !userDropdownOpen && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-white dark:border-slate-900" />
                  )}
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs"
                    >
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Thành Viên Audio'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                    </div>

                    <Link
                      to="/account/subscription"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Quản Lý Premium
                    </Link>

                    <Link
                      to="/library"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                    >
                      <Bookmark className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Thư Viện Của Tôi
                    </Link>

                    {(role === 'CREATOR' || role === 'ADMIN') && (
                      <Link
                        to="/creator"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Creator Studio
                      </Link>
                    )}

                    {(role === 'PARTNER' || role === 'ADMIN') && (
                      <Link
                        to="/partner"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Partner Portal
                      </Link>
                    )}

                    {role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Admin Portal
                      </Link>
                    )}

                    {role === 'USER' && (
                      <Link
                        to="/become-creator"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Đăng Ký Trở Thành Creator
                      </Link>
                    )}

                     <Link
                      to="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Hồ Sơ Của Tôi
                    </Link>

                    <InstallPwaButton variant="menu" onSuccess={() => setUserDropdownOpen(false)} />

                    <button
                      onClick={() => { logout(); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4" /> Đăng Xuất Tài Khoản
                    </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative lg:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng 3 gạch'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6" />}
              {showInstallAttention && !mobileMenuOpen && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-white dark:border-slate-900" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative ml-auto w-[85vw] max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 overflow-y-auto mobile-optimized-scroll space-y-6 shadow-2xl flex flex-col justify-between z-[101] gpu-accelerated"
            >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <BrandLogo variant="full" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Đóng menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile User Profile Section */}
              {role !== 'GUEST' && (
                <div className="space-y-4">
                  <Link 
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                          <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate text-sm">{user?.name || 'Thành Viên Audio'}</div>
                          <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                        </div>
                      </div>
                      <Settings className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.isPremium && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> PREMIUM
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      to="/library"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 items-center text-center group"
                    >
                      <Bookmark className="w-5 h-5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Thư viện</span>
                    </Link>
                    <Link
                      to="/account/subscription"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 items-center text-center group"
                    >
                      <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Hội viên</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsMobileNotifOpen(true);
                      }}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 items-center text-center group relative"
                    >
                      <div className="relative">
                        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-cyan-500' : 'text-slate-400'} group-hover:scale-110 transition-transform`} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[16px] border border-white dark:border-slate-900">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Thông báo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <div className="space-y-1.5 font-medium text-sm">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left p-3 rounded-xl flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Headphones className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Trang Chủ
                </Link>

                <Link
                  to="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left p-3 rounded-xl flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Compass className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Khám Phá Truyện
                </Link>

                <Link
                  to="/genres"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left p-3 rounded-xl flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Grid className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Thể Loại
                </Link>

                <Link
                  to="/rankings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left p-3 rounded-xl flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Bảng Xếp Hạng
                </Link>

                {role !== 'GUEST' && (
                  <Link
                    to="/library"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left p-3 rounded-xl flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Bookmark className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Thư Viện Cá Nhân
                  </Link>
                )}
              </div>

              {/* Mobile Portals Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-semibold">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold tracking-wider px-1">
                  Cổng Quản Trị & Quyền
                </span>
                
                {role === 'GUEST' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
                    >
                      Đăng Nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full p-3 rounded-xl bg-cyan-500 text-slate-950 font-bold flex items-center justify-center gap-2"
                    >
                      Đăng Ký
                    </Link>
                  </div>
                ) : (
                  <>
                    {(role === 'CREATOR' || role === 'ADMIN') && (
                      <Link
                        to="/creator"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-left p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 border border-emerald-500/20"
                      >
                        <Mic className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Creator Studio
                      </Link>
                    )}

                    {(role === 'PARTNER' || role === 'ADMIN') && (
                      <Link
                        to="/partner"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-left p-3 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center gap-3 border border-indigo-500/20"
                      >
                        <Share2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Partner Portal
                      </Link>
                    )}

                    {role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full text-left p-3 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-center gap-3 border border-rose-500/20"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Admin Portal
                      </Link>
                    )}

                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full text-left p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-3 border border-rose-500/20 mt-2"
                    >
                      <LogOut className="w-4 h-4" /> Đăng Xuất Tài Khoản
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 pb-2 px-1 border-t border-slate-200 dark:border-slate-800">
              <InstallPwaButton variant="mobile" onSuccess={() => setMobileMenuOpen(false)} />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center">
              TOP TRUYỆN AUDIO v2.5
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <NotificationListModal
        isOpen={isMobileNotifOpen}
        onClose={() => setIsMobileNotifOpen(false)}
        onViewDetail={handleViewDetail}
      />
    </>
  );
};

