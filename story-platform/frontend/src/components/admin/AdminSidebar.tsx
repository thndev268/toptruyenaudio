import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Award,
  Disc,
  Tags,
  MessageSquare,
  AlertOctagon,
  Scale,
  Headphones,
  Bell,
  Wrench,
  AlertTriangle,
  Server,
  ShieldAlert,
  History,
  Sliders,
  Crown,
  User,
  X,
  Radio,
} from 'lucide-react';
import { AdminScreenId } from '../../types/admin';

interface AdminSidebarProps {
  activeScreen: AdminScreenId;
  onSelectScreen: (screen: AdminScreenId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingCounts: {
    creators: number;
    reports: number;
    copyright: number;
    tickets: number;
    security: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeScreen,
  onSelectScreen,
  isOpenMobile,
  onCloseMobile,
  pendingCounts,
}) => {
  const menuGroups = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard' as AdminScreenId, label: 'Tổng quan', icon: LayoutDashboard },
      ],
    },
    {
      title: 'NGƯỜI DÙNG & TÁC GIẢ',
      items: [
        { id: 'users' as AdminScreenId, label: 'Người dùng', icon: Users },
        {
          id: 'creators' as AdminScreenId,
          label: 'Creator & Đơn duyệt',
          icon: UserCheck,
          badge: pendingCounts.creators > 0 ? pendingCounts.creators : undefined,
        },
        { id: 'badges' as AdminScreenId, label: 'Danh hiệu & Huy hiệu', icon: Award },
        { id: 'comments' as AdminScreenId, label: 'Bình luận', icon: MessageSquare },
      ],
    },
    {
      title: 'NỘI DUNG & BẢN QUYỀN',
      items: [
        { id: 'stories' as AdminScreenId, label: 'Truyện & Tập audio', icon: Disc },
        { id: 'genres' as AdminScreenId, label: 'Thể loại truyện', icon: Tags },
        {
          id: 'copyright' as AdminScreenId,
          label: 'Bản quyền & Gỡ bài',
          icon: Scale,
          badge: pendingCounts.copyright > 0 ? pendingCounts.copyright : undefined,
        },
        {
          id: 'reports' as AdminScreenId,
          label: 'Báo cáo vi phạm',
          icon: AlertOctagon,
          badge: pendingCounts.reports > 0 ? pendingCounts.reports : undefined,
        },
      ],
    },
    {
      title: 'DOANH THU & GÓI CƯỚC',
      items: [
        { id: 'premium' as AdminScreenId, label: 'Premium & Đăng ký', icon: Crown },
      ],
    },
    {
      title: 'HỖ TRỢ & THÔNG BÁO',
      items: [
        {
          id: 'tickets' as AdminScreenId,
          label: 'Ticket hỗ trợ',
          icon: Headphones,
          badge: pendingCounts.tickets > 0 ? pendingCounts.tickets : undefined,
        },
        { id: 'notifications' as AdminScreenId, label: 'Thông báo người dùng', icon: Bell },
      ],
    },
    {
      title: 'VẬN HÀNH & AN NINH',
      items: [
        { id: 'service-health' as AdminScreenId, label: 'Trạng thái dịch vụ', icon: Server },
        { id: 'incidents' as AdminScreenId, label: 'Sự cố hệ thống', icon: AlertTriangle },
        {
          id: 'security-alerts' as AdminScreenId,
          label: 'Cảnh báo an ninh',
          icon: ShieldAlert,
          badge: pendingCounts.security > 0 ? pendingCounts.security : undefined,
          badgeColor: 'rose',
        },
        { id: 'maintenance' as AdminScreenId, label: 'Bảo trì hệ thống', icon: Wrench },
      ],
    },
    {
      title: 'HỆ THỐNG & CÀI ĐẶT',
      items: [
        { id: 'feature-flags' as AdminScreenId, label: 'Quản lý tính năng', icon: Sliders },
        { id: 'audit-logs' as AdminScreenId, label: 'Nhật ký hoạt động', icon: History },
        { id: 'admin-profile' as AdminScreenId, label: 'Hồ sơ quản trị viên', icon: User },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[101] w-72 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white tracking-wide truncate">
                TOP TRUYỆN AUDIO
              </div>
              <div className="text-[10px] text-cyan-400 font-mono font-bold truncate">
                Chủ Sở Hữu & Vận Hành
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-wider text-slate-300 uppercase">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectScreen(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] cursor-pointer ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                            item.badgeColor === 'rose'
                              ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                              : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Single Admin Info Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black text-xs shrink-0">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">Người Vận Hành Duy Nhất</div>
              <div className="text-[10px] text-emerald-400 font-mono truncate">● Đang trực tuyến</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
