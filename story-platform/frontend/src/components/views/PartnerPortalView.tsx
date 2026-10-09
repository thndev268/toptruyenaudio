import React from 'react';
import { Building2, ShieldCheck, FileAudio, BarChart3 } from 'lucide-react';

export const PartnerPortalView: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 mb-2">
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">Cổng Đối Tác Bản Quyền Nội Dung</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black text-white">Đối Tác Nội Dung TOP TRUYỆN AUDIO</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Quản lý hồ sơ bản quyền, danh mục tác phẩm ủy quyền và thống kê lượt phân phối audio</p>
      </div>

      {/* Partner Profile Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Hồ Sơ Nhà Xuất Bản / Đơn Vị Bản Quyền</h3>
            <p className="text-xs text-slate-400">Trạng thái ủy quyền phân phối tác phẩm audio chính thức</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
            Đã xác minh bản quyền
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Mã Đối Tác</span>
            <div className="text-base font-bold text-white font-mono">PTR-9842-VN</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Hợp Đồng Tác Quyền</span>
            <div className="text-base font-bold text-cyan-400 font-mono">Ủy quyền toàn phần</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Tác Phẩm Đã Ủy Quyền</span>
            <div className="text-base font-bold text-emerald-400 font-mono">12 Bộ Audio</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Chất Lượng Phân Phối</span>
            <div className="text-base font-bold text-amber-300 font-mono">320kbps Lossless</div>
          </div>
        </div>
      </div>

      {/* Distribution Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Tổng Lượt Phân Phối</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">1.280.400</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Thính Giả Tiếp Cận</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">420.000</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase">Chỉ Số Đánh Giá</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">4.92 / 5.0</div>
        </div>
      </div>

    </div>
  );
};
