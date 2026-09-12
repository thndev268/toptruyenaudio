import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Award,
  LayoutDashboard,
  Users,
  UserCheck,
  Crown,
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
  CreditCard,
  User,
  Share2,
} from 'lucide-react';
import { AdminDropdownMenu, AdminNavGroup } from './AdminDropdownMenu';

interface AdminNavigationProps {
  pendingCounts: {
    creators: number;
    reports: number;
    copyright: number;
    tickets: number;
    security: number;
  };
  onSelectRoute?: (route: string) => void;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  pendingCounts,
  onSelectRoute,
}) => {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const location = useLocation();

  const groups: AdminNavGroup[] = [
    {
      id: 'users-group',
      shortLabel: 'Người dùng',
      fullLabel: 'Người dùng & Quyền lợi',
      items: [
        {
          id: 'users',
          label: 'Người dùng',
          route: '/admin/users',
          icon: Users,
          description: 'Danh sách và trạng thái tài khoản',
        },
        {
          id: 'creators',
          label: 'Tác giả và đơn duyệt',
          route: '/admin/creators',
          icon: UserCheck,
          badge: pendingCounts.creators > 0 ? pendingCounts.creators : undefined,
          description: 'Thẩm định hồ sơ tác giả & đơn đăng ký sáng tạo',
        },
        {
          id: 'subscriptions',
          label: 'Premium và đăng ký',
          route: '/admin/subscriptions',
          icon: Crown,
          description: 'Quản lý gói VIP và doanh thu',
        },
        {
          id: 'badges',
          label: 'Danh hiệu & Huy hiệu',
          route: '/admin/badges',
          icon: Award,
          description: 'Quản lý danh hiệu vinh danh người dùng',
        },
      ],
    },
    {
      id: 'content-group',
      shortLabel: 'Kho Audio',
      fullLabel: 'Nội dung Audio',
      items: [
        {
          id: 'stories',
          label: 'Truyện và tập audio',
          route: '/admin/stories',
          icon: Disc,
          description: 'Kho truyện, tập phát hành và quyền truy cập',
        },
        {
          id: 'genres',
          label: 'Thể loại',
          route: '/admin/genres',
          icon: Tags,
          description: 'Danh mục và phân loại truyện',
        },
      ],
    },
    {
      id: 'community-group',
      shortLabel: 'Cộng đồng',
      fullLabel: 'Cộng đồng & Hỗ trợ',
      items: [
        {
          id: 'comments',
          label: 'Bình luận và đánh giá',
          route: '/admin/comments',
          icon: MessageSquare,
          description: 'Kiểm duyệt bình luận & chấm điểm',
        },
        {
          id: 'reports',
          label: 'Báo cáo vi phạm',
          route: '/admin/reports',
          icon: AlertOctagon,
          badge: pendingCounts.reports > 0 ? pendingCounts.reports : undefined,
          badgeColor: 'rose',
          description: 'Xử lý phản ánh từ thính giả',
        },
        {
          id: 'copyright',
          label: 'Bản quyền và gỡ bài',
          route: '/admin/copyright',
          icon: Scale,
          badge: pendingCounts.copyright > 0 ? pendingCounts.copyright : undefined,
          badgeColor: 'rose',
          description: 'Khiếu nại bản quyền tác giả',
        },
        {
          id: 'support',
          label: 'Ticket hỗ trợ',
          route: '/admin/support',
          icon: Headphones,
          badge: pendingCounts.tickets > 0 ? pendingCounts.tickets : undefined,
          description: 'Giải đáp yêu cầu người nghe',
        },
      ],
    },
    {
      id: 'operations-group',
      shortLabel: 'Vận hành',
      fullLabel: 'Vận hành hệ thống',
      items: [
        {
          id: 'notifications',
          label: 'Thông báo người dùng',
          route: '/admin/notifications',
          icon: Bell,
          description: 'Phát sóng tin tức toàn hệ thống',
        },
        {
          id: 'banners',
          label: 'Banner thông báo',
          route: '/admin/banners',
          icon: Megaphone,
          description: 'Quản lý banner hiển thị trên website',
        },
        {
          id: 'maintenance',
          label: 'Bảo trì hệ thống',
          route: '/admin/maintenance',
          icon: Wrench,
          description: 'Cấu hình bảo dưỡng và tạm dừng dịch vụ',
        },
        {
          id: 'incidents',
          label: 'Sự cố hệ thống',
          route: '/admin/incidents',
          icon: AlertTriangle,
          description: 'Theo dõi và xử lý sự cố',
        },
      ],
    },
    {
      id: 'system-group',
      shortLabel: 'Hệ thống',
      fullLabel: 'Hệ thống & An toàn',
      items: [
        {
          id: 'system',
          label: 'Trạng thái dịch vụ',
          route: '/admin/system',
          icon: Server,
          description: 'Giám sát CDN, Database & Storage',
        },
        {
          id: 'security',
          label: 'Cảnh báo an ninh',
          route: '/admin/security',
          icon: ShieldAlert,
          badge: pendingCounts.security > 0 ? pendingCounts.security : undefined,
          badgeColor: 'rose',
          description: 'Tường lửa WAF, chống DDoS & khóa IP',
        },
        {
          id: 'audit-logs',
          label: 'Nhật ký hoạt động',
          route: '/admin/audit-logs',
          icon: History,
          description: 'Lịch sử thao tác của Owner Admin',
        },
      ],
    },
    {
      id: 'settings-group',
      shortLabel: 'Cấu hình',
      fullLabel: 'Cấu hình & Hồ sơ',
      items: [
        {
          id: 'settings',
          label: 'Cài đặt và quản lý tính năng',
          route: '/admin/settings',
          icon: Sliders,
          description: 'Bật/tắt cờ tính năng hệ thống',
        },
        {
          id: 'payos',
          label: 'Cấu hình thanh toán PayOS',
          route: '/admin/payos',
          icon: CreditCard,
          description: 'Quản lý thông tin PayOS',
        },
        {
          id: 'social-links',
          label: 'Liên kết mạng xã hội',
          route: '/admin/social-links',
          icon: Share2,
          description: 'Quản lý liên kết Instagram, Facebook, YouTube...',
        },
        {
          id: 'profile',
          label: 'Hồ sơ quản trị viên',
          route: '/admin/profile',
          icon: User,
          description: 'Thông tin tài khoản Owner Admin',
        },
      ],
    },
  ];

  const handleToggleGroup = (groupId: string) => {
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const isDashboardActive =
    location.pathname === '/admin' || location.pathname === '/admin/dashboard';

  return (
    <nav
      aria-label="Thanh điều hướng quản trị"
      className="flex items-center gap-1 xl:gap-1.5 flex-wrap lg:flex-nowrap py-1 relative z-50"
    >
      {/* Direct Link 1: Tổng quan */}
      <NavLink
        to="/admin/dashboard"
        onClick={() => {
          setOpenGroupId(null);
          if (onSelectRoute) onSelectRoute('/admin/dashboard');
        }}
        className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] cursor-pointer shrink-0 whitespace-nowrap ${
          isDashboardActive
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
        title="Tổng quan hệ thống"
      >
        <LayoutDashboard className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
        <span className="whitespace-nowrap">Tổng quan</span>
      </NavLink>

      {/* Dropdown Groups 2 - 7 */}
      {groups.map((group) => (
        <AdminDropdownMenu
          key={group.id}
          group={group}
          isOpen={openGroupId === group.id}
          onToggle={() => handleToggleGroup(group.id)}
          onClose={() => setOpenGroupId(null)}
          onSelectRoute={onSelectRoute}
        />
      ))}
    </nav>
  );
};

