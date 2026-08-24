import React from 'react';
import { 
  Play, 
  Heart, 
  Star, 
  Clock, 
  Headphones, 
  ChevronRight,
  Sparkles,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { AudioStory } from '../../types';

interface StoryHeroProps {
  story: AudioStory;
  isFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
  averageRating?: number;
  totalReviews?: number;
}

export const StoryHero: React.FC<StoryHeroProps> = ({
  story,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onAddToPlaylist,
  onShare,
  averageRating,
  totalReviews,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Logic for quality badge as per instruction #10
  const renderQualityBadge = () => {
    const hasHighQuality = story.quality === 'HIGH' && story.bitrateKbps === 320;
    
    if (hasHighQuality) {
      return (
        <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-lg shadow-lg shadow-emerald-500/20 uppercase tracking-wider">
          HD Audio 320kbps
        </span>
      );
    }
    
    return (
      <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 font-bold text-[10px] rounded-lg border border-slate-700/50 uppercase tracking-wider">
        Chất lượng tùy nguồn
      </span>
    );
  };

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 min-h-[620px] sm:min-h-[500px] lg:min-h-[640px] flex flex-col justify-end">
      {/* Background Image with Cinematic Effects */}
      <div className="absolute inset-0 z-0">
        <motion.img
          loading="lazy"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          src={story.coverUrl}
          alt=""
          className="h-full w-full object-cover object-center bg-slate-900"
        />
        
        {/* Layered Overlays for Readability (#5) */}
        {/* 1. Global Darken */}
        <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" />
        
        {/* 2. Desktop Left-to-Right Gradient */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent opacity-100" aria-hidden="true" />
        
        {/* 3. Mobile/Tablet Bottom-to-Top Gradient */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" aria-hidden="true" />
        
        {/* 4. Bottom Edge Connector (blends into page content) */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" aria-hidden="true" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 lg:pt-32">
        <div className="lg:max-w-[60%] space-y-6 sm:space-y-8">
          
          {/* Breadcrumb / Top Meta */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Trang chủ</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-400">Audio chi tiết</span>
          </div>

          <div className="space-y-4">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2">
              {renderQualityBadge()}
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                story.storyStatus === 'ONGOING' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : story.storyStatus === 'PAUSED'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {story.storyStatus === 'ONGOING' ? 'Đang cập nhật' : story.storyStatus === 'PAUSED' ? 'Tạm dừng' : 'Trọn bộ audio'}
              </span>
              <div className="flex flex-wrap gap-2">
                {story.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg border border-slate-700"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight">
              {story.title}
            </h1>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Tác giả</span>
                <span className="text-white hover:text-cyan-400 cursor-pointer transition-colors">{story.authorName}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Giọng đọc</span>
                <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors">{story.narratorName}</span>
              </div>
            </div>

            {/* Summary Preview with "Read More" logic (#8) */}
            <div className="space-y-2">
              <p className={`text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl opacity-90 transition-all ${isExpanded ? '' : 'line-clamp-3 sm:line-clamp-4 lg:line-clamp-none'}`}>
                {story.summary}
              </p>
              {!isExpanded && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="lg:hidden text-xs font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300 flex items-center gap-1"
                >
                  Xem thêm <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons Row - Cinematic Style (#11) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-6">
            <button
              onClick={onPlay}
              className="h-14 px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl shadow-2xl shadow-cyan-500/20 flex items-center gap-3 transform active:scale-95 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-950/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <span className="text-sm sm:text-base uppercase tracking-tight">Nghe ngay</span>
            </button>

            <button
              onClick={onToggleFavorite}
              className={`h-14 px-6 rounded-2xl border transition-all flex items-center gap-3 group ${
                isFavorite
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white"
              }`}
              aria-label={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
            >
              <Heart className={`w-6 h-6 transition-transform group-active:scale-125 ${isFavorite ? "fill-current" : ""}`} />
              <span className="hidden sm:inline font-bold text-sm uppercase tracking-wider">Yêu thích</span>
            </button>

            {onAddToPlaylist && (
              <button
                onClick={onAddToPlaylist}
                className="h-14 px-6 rounded-2xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-600 hover:text-white transition-all group flex items-center gap-3"
                aria-label="Thêm vào danh sách phát"
              >
                <Sparkles className="w-6 h-6 transition-transform group-active:scale-125 text-cyan-400" />
                <span className="hidden sm:inline font-bold text-sm uppercase tracking-wider">Playlist</span>
              </button>
            )}

            {onShare && (
              <button
                onClick={onShare}
                className="h-14 px-6 rounded-2xl bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-600 hover:text-white transition-all group flex items-center gap-3"
                aria-label="Chia sẻ truyện"
              >
                <Share2 className="w-5 h-5 transition-transform group-active:scale-125" />
                <span className="hidden sm:inline font-bold text-sm uppercase tracking-wider">Chia sẻ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
