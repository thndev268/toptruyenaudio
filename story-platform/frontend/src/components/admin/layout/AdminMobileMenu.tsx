import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Users,
  UserCheck,
  Crown,
  Award,
  Disc,
  Tags,
  MessageSquare,
  AlertOctagon,
  Scale,
  Headphones,
  Bell,
  Megaphone,
  Wrench,
  AlertTriangle,
  Server,
  ShieldAlert,
  History,
  Sliders,
  User,
  ChevronDown,
  Radio,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { FocusTrap } from '../../common/FocusTrap';
import { OwnerAdminProfile } from '../../../types/admin';

interface AdminMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCounts: {
    creators: number;
    reports: number;
    copyright: number;
    tickets: number;
    security: number;
  };
  profile: OwnerAdminProfile;
  onSelectRoute?: (route: string) => void;
}

export const AdminMobileMenu: React.FC<AdminMobileMenuProps> = ({
  isOpen,
  onClose,
  pendingCounts,
  profile,
  onSelectRoute,
}) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    users: true,
    content: true,
    community: false,
    operations: false,
    system: false,
    settings: true,
  });

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNavigate = (route: string) => {
    onClose();
    if (onSelectRoute) onSelectRoute(route);
  };

  const sections = [
    {
      key: 'users',
      title: 'NGƯỜI DÙNG & QUYỀN LỢI',
      items: [
        {
          label: 'Người dùng',
          route: '/admin/users',
          icon: Users,
        },
        {
          label: 'Creator và đơn duyệt',
          route: '/admin/creators',
          icon: UserCheck,
          badge: pendingCounts.creators > 0 ? pendingCounts.creators : undefined,
        },
        {
          label: 'Premium và đăng ký',
          route: '/admin/subscriptions',
          icon: Crown,
        },
        {
          label: 'Danh hiệu & Huy hiệu',
          route: '/admin/badges',
          icon: Award,
        },
      ],
    },
    {
      key: 'content',
      title: 'NỘI DUNG AUDIO',
      items: [
        {
          label: 'Truyện và tập audio',
          route: '/admin/stories',
          icon: Disc,
        },
        {
          label: 'Thể loại',
          route: '/admin/genres',
          icon: Tags,
        },
      ],
    },
    {
      key: 'community',
      title: 'CỘNG ĐỒNG & HỖ TRỢ',
      items: [
        {
          label: 'Bình luận và đánh giá',
          route: '/admin/comments',
          icon: MessageSquare,
        },
        {
          label: 'Báo cáo vi phạm',
          route: '/admin/reports',
          icon: AlertOctagon,
          badge: pendingCounts.reports > 0 ? pendingCounts.reports : undefined,
          badgeColor: 'rose',
        },
        {
          label: 'Bản quyền và gỡ bài',
          route: '/admin/copyright',
          icon: Scale,
          badge: pendingCounts.copyright > 0 ? pendingCounts.copyright : undefined,
          badgeColor: 'rose',
        },
        {
          label: 'Ticket hỗ trợ',
          route: '/admin/support',
          icon: Headphones,
          badge: pendingCounts.tickets > 0 ? pendingCounts.tickets : undefined,
        },
      ],
    },
    {
      key: 'operations',
      title: 'VẬN HÀNH',
      items: [
        {
          label: 'Thông báo người dùng',
          route: '/admin/notifications',
          icon: Bell,
        },
        {
          label: 'Banner thông báo',
          route: '/admin/banners',
          icon: Megaphone,
        },
        {
          label: 'Bảo trì hệ thống',
          route: '/admin/maintenance',
          icon: Wrench,
        },
        {
          label: 'Sự cố hệ thống',
          route: '/admin/incidents',
          icon: AlertTriangle,
        },
      ],
    },
    {
      key: 'system',
      title: 'HỆ THỐNG & AN TOÀN',
      items: [
        {
          label: 'Trạng thái dịch vụ',
          route: '/admin/system',
          icon: Server,
        },
        {
          label: 'Cảnh báo an ninh',
          route: '/admin/security',
          icon: ShieldAlert,
          badge: pendingCounts.security > 0 ? pendingCounts.security : undefined,
          badgeColor: 'rose',
        },
        {
          label: 'Nhật ký hoạt động',
          route: '/admin/audit-logs',
          icon: History,
        },
      ],
    },
    {
      key: 'settings',
      title: 'CẤU HÌNH',
      items: [
        {
          label: 'Cài đặt và quản lý tính năng',
          route: '/admin/settings',
          icon: Sliders,
        },
        {
          label: 'Cấu hình thanh toán PayOS',
          route: '/admin/payos',
          icon: CreditCard,
        },
        {
          label: 'Hồ sơ quản trị viên',
          route: '/admin/profile',
          icon: User,
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-start bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
    >
      <FocusTrap
        isActive={isOpen}
        onEscape={onClose}
        className="w-full max-w-sm bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-full shadow-2xl animate-slideRight overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <div
                id="mobile-menu-title"
                className="text-xs font-black text-white tracking-wide truncate"
              >
                TOP TRUYỆN AUDIO
              </div>
              <div className="text-[10px] text-rose-400 font-mono font-bold truncate">
                Khu Vực Quản Trị
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu điều hướng"
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-750 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {/* Direct Link: Dashboard */}
          <NavLink
            to="/admin/dashboard"
            onClick={() => handleNavigate('/admin/dashboard')}
            className={({ isActive }) =>
              `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                isActive || location.pathname === '/admin'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Tổng quan</span>
            </div>
          </NavLink>

          {/* Accordion Sections */}
          {sections.map((section) => {
            const isSectionOpen = openSections[section.key];
            const hasActiveChild = section.items.some(
              (item) => location.pathname === item.route || location.pathname.startsWith(`${item.route}/`)
            );

            return (
              <div key={section.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold font-mono tracking-wider uppercase rounded-lg transition-colors cursor-pointer ${
                    hasActiveChild ? 'text-rose-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{section.title}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isSectionOpen ? 'rotate-180 text-rose-400' : ''
                    }`}
                  />
                </button>

                {isSectionOpen && (
                  <div className="space-y-0.5 pl-2 border-l border-slate-800 ml-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        location.pathname === item.route ||
                        location.pathname.startsWith(`${item.route}/`);

                      return (
                        <NavLink
                          key={item.route}
                          to={item.route}
                          onClick={() => handleNavigate(item.route)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
                            isActive
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 truncate">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge !== undefined && (
                            <span
                              className={`px-1.5 py-0.2 text-[10px] font-black rounded-full shrink-0 ${
                                isActive
                                  ? 'bg-white text-rose-600'
                                  : item.badgeColor === 'rose'
                                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                                  : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Switch to User Website */}
          <div className="pt-2">
            <Link
              to="/"
              onClick={onClose}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Xem trang người dùng</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Single Admin Info Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shrink-0 shadow-md">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{profile.name}</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 truncate">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Chủ sở hữu · Đang trực tuyến</span>
              </div>
            </div>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};
