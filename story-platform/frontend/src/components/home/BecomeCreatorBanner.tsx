import React from 'react';
import { PenTool, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BecomeCreatorBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/50 p-6 sm:p-8 lg:p-10 shadow-2xl">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold">
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kênh Dành Cho Tác Giả Sáng Tạo</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            Trở Thành Tác Giả Sáng Tạo Độc Quyền Tại TOP TRUYỆN AUDIO
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Đăng tải tác phẩm truyện audio, tiếp cận hàng triệu thính giả thấu hiểu và quản lý tác phẩm trực quan thông qua Creator Studio chuyên nghiệp.
          </p>
        </div>

        <button
          onClick={() => navigate('/creator')}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 shrink-0 transition-all min-h-[44px]"
        >
          <span>Tham Gia Creator Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

