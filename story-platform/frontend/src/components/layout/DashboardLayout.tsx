import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../branding/BrandLogo';
import { MiniAudioPlayer } from '../player/MiniAudioPlayer';
import { FullAudioPlayerModal } from '../player/FullAudioPlayerModal';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { ScrollToTopButton } from '../common/ScrollToTopButton';
import { FloatingZaloButton } from '../common/FloatingZaloButton';
import {
  Mic,
  Share2,
  ShieldCheck,
  Home,
  LogOut,
  Menu,
  X,
  Radio,
  User,
  LayoutDashboard,
  Coins, Crown,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { role, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Trang Chủ App', path: '/', icon: Home, roles: ['GUEST', 'USER', 'CREATOR', 'PARTNER', 'ADMIN'] },
    { label: 'Creator Studio', path: '/creator', icon: Mic, roles: ['CREATOR', 'ADMIN'] },
    { label: 'Partner Portal', path: '/partner', icon: Share2, roles: ['PARTNER', 'ADMIN'] },
    { label: 'Admin Portal', path: '/admin', icon: ShieldCheck, roles: ['ADMIN'] },
    { label: 'Quản Lý Premium', path: '/account/subscription', icon: Crown, roles: ['USER', 'CREATOR', 'PARTNER', 'ADMIN'] },
  ];

  const allowedNavs = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Mobile Top Header - Enhanced Sticky Layout */}
      <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo variant="compact" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label="Menu quản trị"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay - Improved Blur */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden transition-all duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Improved Drawer Transitions */}
      <aside
        className={`fixed inset-y-0 left-0 z-[100] w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-8">
          
          {/* Logo Brand */}
          <div className="px-2">
            <BrandLogo variant="compact" />
            <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-widest block mt-1 ml-1">
              Quản Trị [{role}]
            </span>
          </div>

          {/* User Badge - Refined */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{user?.name || 'Tài Khoản'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email || 'chua_dang_nhap'}</div>
            </div>
          </div>

          {/* Nav Links - Better Spacing */}
          <nav className="space-y-2">
            {allowedNavs.map((item) => {
              const IconComp = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all min-h-[48px] ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`
                  }
                >
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

        </div>

        {/* Logout Bottom - Professional Text */}
        <div className="pt-6 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all min-h-[48px]"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Workspace - Optimized Spacing */}
      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 pb-28 md:pb-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs />
          <div className="mt-4">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Menu - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
        {allowedNavs.slice(0, 4).map((item) => {
          const IconComp = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1.5 transition-all ${
                  isActive ? 'text-cyan-400' : 'text-slate-500'
                }`
              }
            >
              <IconComp className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-tighter truncate w-16 text-center">
                {item.label.split(' ')[0]}
              </span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1.5 text-slate-500"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Menu</span>
        </button>
      </div>

      <ScrollToTopButton />
      <FloatingZaloButton />
    </div>
  );
};
