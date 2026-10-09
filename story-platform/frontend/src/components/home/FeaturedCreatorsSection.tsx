import React from 'react';
import { PenTool, Star, BookOpen } from 'lucide-react';

export const FeaturedCreatorsSection: React.FC = () => {
  const creators: any[] = [];
  
  if (creators.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">Tác Giả Nổi Bật</h2>
            <p className="text-xs text-slate-400">Những tác giả tài năng sáng tạo nên các tác phẩm truyện hấp dẫn</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[].map((creator) => (
          <div
            key={creator.creatorId}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3.5 transition-all group hover:shadow-xl"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
              <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 truncate">
                {creator.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Tác Giả Nổi Bật
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" /> {creator.rating}
                </span>
                <span>•</span>
                <span className="text-cyan-400 font-mono font-semibold">
                  {(creator.totalListens / 1000).toFixed(0)}k lượt nghe
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
