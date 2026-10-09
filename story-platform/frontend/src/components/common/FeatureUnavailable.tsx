// DEFERRED_PHASE_2: Referral / Affiliate / Marketing Partner functions deferred to future phases.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Home, Compass } from 'lucide-react';

interface FeatureUnavailableProps {
  title?: string;
  description?: string;
}

export const FeatureUnavailable: React.FC<FeatureUnavailableProps> = ({
  title = 'Tính Năng Đang Phát Triển',
  description = 'Chức năng này đang được chuẩn bị cho giai đoạn phát triển tiếp theo.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 text-center space-y-6 animate-fadeIn">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-cyan-500/20">
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl sm:text-3xl font-black text-white">{title}</h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-400 font-mono">
        Cảm ơn bạn đã đồng hành cùng TOP TRUYỆN AUDIO. Vui lòng quay lại sau!
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all min-h-[44px]"
        >
          <Home className="w-4 h-4" /> Về trang chủ
        </button>

        <button
          onClick={() => navigate('/explore')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 flex items-center gap-2 transition-all min-h-[44px]"
        >
          <Compass className="w-4 h-4 text-cyan-400" /> Khám phá truyện
        </button>
      </div>
    </div>
  );
};
