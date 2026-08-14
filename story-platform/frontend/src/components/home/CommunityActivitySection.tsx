import React from 'react';
import { MessageSquare, Star, UserCheck } from 'lucide-react';

export const CommunityActivitySection: React.FC = () => {
  const reviews: any[] = [];

  if (reviews.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">Hoạt Động Cộng Đồng Nghe Truyện</h2>
          <p className="text-xs text-slate-400">Bình luận và cảm nhận mới nhất từ thính giả thấu hiểu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {reviews.map((item) => (
          <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> {item.userName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
            </div>

            <div className="text-xs font-bold text-cyan-300 truncate">{item.storyTitle}</div>

            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(item.rating)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed italic">
              "{item.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
