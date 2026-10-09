import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  KeyRound,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { OwnerAdminProfile } from '../../../types/admin';
import { useAuth } from '../../../context/AuthContext';

interface AdminProfileMenuProps {
  profile: OwnerAdminProfile;
  onOpenChangePassword?: () => void;
}

export const AdminProfileMenu: React.FC<AdminProfileMenuProps> = ({
  profile,
  onOpenChangePassword,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  const handlePasswordModal = () => {
    setIsOpen(false);
    if (onOpenChangePassword) {
      onOpenChangePassword();
    } else {
      navigate('/admin/profile');
    }
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Menu tài khoản chủ sở hữu"
        className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border transition-all cursor-pointer min-h-[40px] ${
          isOpen
            ? 'bg-slate-800 border-rose-500/50 shadow-lg shadow-rose-500/10'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-md shrink-0">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="hidden xl:block text-left min-w-0">
          <div className="text-xs font-bold text-white truncate max-w-[120px]">
            {profile.name}
          </div>
          <div className="text-[10px] text-rose-400 font-mono font-bold leading-none">
            Chủ Sở Hữu
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-rose-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[120] py-2 animate-scaleUp overflow-hidden divide-y divide-slate-800/80"
        >
          {/* Header Summary */}
          <div className="px-4 py-3 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shrink-0 shadow-md">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{profile.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{profile.email}</div>
                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>OWNER_ADMIN</span>
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="py-1.5">
            <Link
              to="/admin/profile"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <User className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold">Hồ sơ quản trị viên</div>
                <div className="text-[10px] text-slate-400">Xem đặc quyền và bảo mật 2FA</div>
              </div>
            </Link>

            <button
              type="button"
              onClick={handlePasswordModal}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold">Đổi mật khẩu</div>
                <div className="text-[10px] text-slate-400">Cập nhật khóa bí mật quản trị</div>
              </div>
            </button>

            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold">Xem trang người dùng</div>
                <div className="text-[10px] text-slate-400">Chuyển sang giao diện nghe audio</div>
              </div>
            </Link>
          </div>

          {/* Logout */}
          <div className="p-1.5 bg-slate-950/40">
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors text-left cursor-pointer min-h-[38px]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Đăng Xuất Quản Trị</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
