import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Search } from 'lucide-react';
import { AdminPageContainer } from './AdminPageContainer';

export const AdminNotFoundView: React.FC = () => {
  return (
    <AdminPageContainer>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-5 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-rose-300 border border-slate-700 mb-3">
          404 - KHÔNG TÌM THẤY TRANG
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Không Tìm Thấy Trang Quản Trị
        </h1>

        <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
          Đường dẫn quản trị bạn vừa truy cập không tồn tại, đã được di chuyển hoặc nằm ngoài danh mục điều hành của Chủ sở hữu (Owner Admin).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/admin/dashboard"
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Về Bảng Tổng Quan</span>
          </Link>

          <Link
            to="/admin/users"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Quản Lý Người Dùng</span>
          </Link>
        </div>
      </div>
    </AdminPageContainer>
  );
};
