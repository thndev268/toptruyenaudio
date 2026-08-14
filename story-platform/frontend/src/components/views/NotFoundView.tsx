import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Home, Search } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6 animate-fadeIn">
      <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-cyan-400 mx-auto shadow-2xl relative">
        <Radio className="w-12 h-12 animate-pulse" />
        <span className="absolute -top-2 -right-2 px-2.5 py-1 bg-rose-500 text-white font-mono text-xs font-black rounded-full">404</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-white">Không Tìm Thấy Trang</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Đường dẫn bạn vừa mở không tồn tại hoặc đã được thay đổi. Hãy kiểm tra lại URL hoặc tìm kiếm bộ audio yêu thích.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <Home className="w-4 h-4" /> Về Trang Chủ
        </Link>
        <Link
          to="/search"
          className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
        >
          <Search className="w-4 h-4" /> Tìm Kiếm Truyện
        </Link>
      </div>
    </div>
  );
};
