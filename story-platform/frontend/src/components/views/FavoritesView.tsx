import React from 'react';
import { Heart } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { StoryCard } from '../common/StoryCard';

export const FavoritesView: React.FC = () => {
  const { favorites } = useAudioPlayer();
  const publicStories = adminRepository.getPublicStories();
  const allStories = Array.isArray(publicStories) ? publicStories : [];
  const favStories = allStories.filter((s) => favorites.includes(s.id));

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-rose-500 mb-2">
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-rose-500" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">Danh Sách Đã Lưu</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black text-white">Truyện Audio Yêu Thích</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Tất cả những bộ audio bạn đánh dấu theo dõi để nghe lại mỗi ngày</p>
      </div>

      {favStories.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Heart className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm">Bạn chưa đánh dấu yêu thích bộ truyện audio nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {favStories.map((story) => (
            <StoryCard key={story.id} story={story} variant="vertical" />
          ))}
        </div>
      )}
    </div>
  );
};
