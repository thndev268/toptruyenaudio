import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const ROUTE_LABELS: Record<string, BreadcrumbItem[]> = {
  '/admin': [{ label: 'Tổng quan' }],
  '/admin/dashboard': [{ label: 'Tổng quan' }],
  '/admin/users': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Người dùng' },
  ],
  '/admin/creators': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Creator và đơn duyệt' },
  ],
  '/admin/subscriptions': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Premium và đăng ký' },
  ],
  '/admin/stories': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Truyện và tập audio' },
  ],
  '/admin/genres': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Thể loại' },
  ],
  '/admin/comments': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Bình luận và đánh giá' },
  ],
  '/admin/reports': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Báo cáo vi phạm' },
  ],
  '/admin/copyright': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Bản quyền và gỡ bài' },
  ],
  '/admin/support': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Ticket hỗ trợ' },
  ],
  '/admin/notifications': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Thông báo người dùng' },
  ],
  '/admin/maintenance': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Bảo trì hệ thống' },
  ],
  '/admin/incidents': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Sự cố hệ thống' },
  ],
  '/admin/system': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Trạng thái dịch vụ' },
  ],
  '/admin/security': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Cảnh báo an ninh' },
  ],
  '/admin/audit-logs': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Nhật ký hoạt động' },
  ],
  '/admin/settings': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Cài đặt và quản lý tính năng' },
  ],
  '/admin/payos': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Cấu hình thanh toán PayOS' },
  ],
  '/admin/profile': [
    { label: 'Tổng quan', path: '/admin/dashboard' },
    { label: 'Hồ sơ quản trị viên' },
  ],
};

export const AdminBreadcrumb: React.FC<{ customItems?: BreadcrumbItem[] }> = ({
  customItems,
}) => {
  const location = useLocation();
  const path = location.pathname;

  let items: BreadcrumbItem[] = customItems || ROUTE_LABELS[path] || [];

  // Dynamic route handling if exact match is not found
  if (items.length === 0) {
    if (path.startsWith('/admin/users/')) {
      items = [
        { label: 'Tổng quan', path: '/admin/dashboard' },
        { label: 'Người dùng', path: '/admin/users' },
        { label: 'Chi tiết người dùng' },
      ];
    } else if (path.startsWith('/admin/stories/')) {
      items = [
        { label: 'Tổng quan', path: '/admin/dashboard' },
        { label: 'Truyện và tập audio', path: '/admin/stories' },
        { label: 'Chi tiết bộ truyện' },
      ];
    } else if (path.startsWith('/admin/security/')) {
      items = [
        { label: 'Tổng quan', path: '/admin/dashboard' },
        { label: 'Cảnh báo an ninh', path: '/admin/security' },
        { label: 'Chi tiết cảnh báo' },
      ];
    } else {
      items = [
        { label: 'Tổng quan', path: '/admin/dashboard' },
        { label: 'Quản trị hệ thống' },
      ];
    }
  }

  return (
    <nav
      aria-label="Đường dẫn điều hướng quản trị"
      className="flex items-center gap-1.5 text-xs text-slate-400 font-medium py-1.5 px-0.5 overflow-x-auto no-scrollbar"
    >
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
        title="Bảng điều khiển Tổng quan"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Bảng điều khiển</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast || !item.path ? (
              <span
                className="text-slate-200 font-bold truncate max-w-[200px] sm:max-w-[300px]"
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-slate-400 hover:text-cyan-400 transition-colors truncate max-w-[150px] sm:max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
