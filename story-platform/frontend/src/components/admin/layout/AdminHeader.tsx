import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sparkles,
  Database,
} from 'lucide-react';
import { AdminNavigation } from './AdminNavigation';
import { AdminProfileMenu } from './AdminProfileMenu';
import { AdminMobileMenu } from './AdminMobileMenu';
import { OwnerAdminProfile } from '../../../types/admin';

interface AdminHeaderProps {
  profile: OwnerAdminProfile;
  pendingCounts: {
    creators: number;
    reports: number;
    copyright: number;
    tickets: number;
    security: number;
  };
  onSelectRoute?: (route: string) => void;
  onOpenChangePassword?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  profile,
  pendingCounts,
  onSelectRoute,
  onOpenChangePassword,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu quản trị"
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 min-w-[42px] min-h-[42px] flex items-center justify-center cursor-pointer transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo Link to /admin/dashboard */}
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2.5 group focus:outline-none shrink-0"
              title="Bảng tổng quan quản trị TOP TRUYỆN AUDIO"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform shrink-0">
                AD
              </div>
              <div className="hidden sm:block shrink-0">
                <div className="text-xs font-black text-white tracking-wide whitespace-nowrap group-hover:text-rose-400 transition-colors">
                  TOP TRUYỆN AUDIO
                </div>
                <div className="text-[10px] text-rose-400 font-mono font-bold tracking-wider uppercase whitespace-nowrap">
                  Khu Vực Quản Trị
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Groups */}
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-1 xl:px-3 overflow-visible">
            <AdminNavigation
              pendingCounts={pendingCounts}
              onSelectRoute={onSelectRoute}
            />
          </div>

          {/* Right: Meta Badge, Switch to User Site & Profile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mock / Live Data Badge */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-cyan-300 shrink-0 whitespace-nowrap"
              title="Chế độ dữ liệu độc lập dành cho Owner Admin"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="hidden xl:inline">Dữ liệu mô phỏng</span>
              <span className="xl:hidden">Mô phỏng</span>
            </div>

            {/* View User Website Button */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[36px] shrink-0 whitespace-nowrap"
              title="Chuyển sang giao diện nghe truyện của người dùng"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">Xem website</span>
              <span className="xl:hidden">Web</span>
            </Link>

            {/* Admin Profile Menu */}
            <AdminProfileMenu
              profile={profile}
              onOpenChangePassword={onOpenChangePassword}
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <AdminMobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        pendingCounts={pendingCounts}
        profile={profile}
        onSelectRoute={onSelectRoute}
      />
    </>
  );
};
