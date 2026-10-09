import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Home, ShieldX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UnauthorizedView: React.FC = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-6 animate-fadeIn">
      <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center justify-center text-rose-400 mx-auto shadow-2xl">
        <ShieldX className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Không Có Quyền Truy Cập</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Tài khoản của bạn hiện ở vai trò <span className="text-amber-400 font-bold font-mono">[{role}]</span> không được phép truy cập trang vừa yêu cầu.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left text-xs text-slate-300 space-y-2">
        <div className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">Gợi ý kiểm thử:</div>
        <p>• Dùng công cụ chọn vai trò <strong>Role Switcher</strong> trên thanh điều hướng để đổi vai trò thành Tác Giả (CREATOR), Đối Tác (PARTNER) hoặc Admin (ADMIN).</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Quay Lại
        </button>
        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <Home className="w-4 h-4" /> Về Trang Chủ
        </Link>
      </div>
    </div>
  );
};
