import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { adminRepository } from '../../services/repositories/AdminRepository';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  const breadcrumbMap: Record<string, string> = {
    explore: 'Danh sách truyện',
    genres: 'Thể loại',
    rankings: 'Bảng xếp hạng',
    search: 'Tìm kiếm',
    library: 'Thư viện',
    favorites: 'Yêu thích',
    history: 'Lịch sử nghe',
    playlists: 'Danh sách phát',
    premium: 'Premium',
    account: 'Tài khoản',
    subscription: 'Gói Premium',
    'become-creator': 'Trở thành Creator',
    terms: 'Điều khoản dịch vụ',
    privacy: 'Chính sách bảo mật',
    copyright: 'Bản quyền',
    takedown: 'Yêu cầu gỡ bỏ',
    payment: 'Chính sách thanh toán',
    withdrawal: 'Chính sách rút tiền',
    help: 'Trợ giúp',
    contact: 'Liên hệ',
    'report-bug': 'Báo lỗi',
  };

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 lg:px-8 xl:px-10 w-full">
      <ol className="flex items-center flex-wrap gap-2 text-[11px] sm:text-xs text-slate-400">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trang chủ</span>
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          let name = breadcrumbMap[value] || value;

          const publicStories = adminRepository.getPublicStories();
          const allStories = publicStories;

          // Special handling for dynamic routes
          if (pathnames[index - 1] === 'story') {
            const story = allStories.find((s) => s.slug === value || s.id === value);
            name = story ? story.title : value;
          } else if (pathnames[index - 1] === 'listen') {
            const story = allStories.find((s) => s.slug === value || s.id === value);
            name = story ? story.title : value;
          } else if (pathnames[index - 2] === 'listen' && index === pathnames.length - 1) {
            // Chapter ID handling
            const storySlug = pathnames[index - 1];
            const story = allStories.find((s) => s.slug === storySlug);
            const chapter = story?.chapters.find(c => c.id === value);
            name = chapter ? `Tập ${chapter.number}` : value;
          }

          return (
            <li key={to} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              {last ? (
                <span className="text-white font-bold truncate max-w-[150px] sm:max-w-[300px]" aria-current="page">
                  {name}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-cyan-400 transition-colors truncate max-w-[100px] sm:max-w-[200px]"
                >
                  {name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
