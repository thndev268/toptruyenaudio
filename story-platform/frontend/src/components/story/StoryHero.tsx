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
      <span className="px-2.5 py-1 bg-slate-700 text-slate-300 font-black text-[10px] rounded-lg shadow-lg uppercase tracking-wider">
        {story.bitrateKbps || 128}kbps
      </span>
    );
  };

  return (
    <>
      <style>{`
        .gradient-btn-wrapper {
          --rad: 32px;
          --color-wrapper-border: #fff;
          --color-btn-bg: #06b6d4;
          --color-btn-text: #000;
          --color-btn-text-shadow: #fff;
          --color-btn-inset-shadow: #558;
          --color-layer-a: #fff;
          --color-layer-b: #00f;
          --color-overlay-text: #000;
          --color-overlay-glow: #fff;
          --color-overlay-shadow: #0004;
          --color-overlay-highlight: #fff5;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: clip;
          overflow-clip-margin: 4px;
          border: 2px solid var(--color-wrapper-border);
          border-radius: var(--rad);
          font-family: "Inter", sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          filter: saturate(0.65) brightness(1.8);
        }
        .gradient-btn {
          position: relative;
          z-index: -1;
          padding: 12px 32px;
          border: none;
          border-radius: var(--rad);
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0.15rem;
          color: var(--color-btn-text);
          background-color: var(--color-btn-bg);
          background-size: 200% 200%;
          box-shadow: inset 0 0 10px 9px var(--color-btn-inset-shadow);
          text-shadow: 0 1px 3px var(--color-btn-text-shadow);
          cursor: pointer;
          mix-blend-mode: color-dodge;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }
        .gradient-btn::after {
          content: "";
          position: absolute;
          pointer-events: none;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: var(--rad);
          background-size: 200% 200%;
          mix-blend-mode: difference;
          z-index: 1;
        }
        .gradient-layer {
          position: absolute;
          pointer-events: none;
          left: -160px;
          width: 500%;
          aspect-ratio: 1;
          background: radial-gradient(
            ellipse at 65% 180%,
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a)
          );
          mix-blend-mode: difference;
          animation: rotate 8s linear infinite;
        }
        .gradient-layer:last-child {
          mix-blend-mode: color-dodge;
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .text-overlay {
          position: absolute;
          pointer-events: none;
          z-index: 2;
          padding: 12px 32px;
          border-radius: var(--rad);
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0.15rem;
          color: var(--color-overlay-text);
          text-shadow: 0 0 4px var(--color-overlay-glow);
          box-shadow: inset 0 -4px 4px 0 var(--color-overlay-shadow), inset 0 4px 4px 0 var(--color-overlay-highlight);
          mix-blend-mode: multiply;
          transition: transform 0.3s ease;
          animation: opacityPulse 5s ease infinite;
        }
        .gradient-btn-wrapper:hover .text-overlay {
          transform: scale(1.1);
        }
        .gradient-btn-wrapper:hover .gradient-btn {
          color: #0000;
          text-shadow: 0 0 0 #0000;
        }
        .gradient-btn-wrapper:active .text-overlay {
          transform: scale(0.95);
        }
        .gradient-btn-wrapper:active .gradient-btn {
          color: #0000;
          text-shadow: 0 0 0 #0000;
        }
        .light {
          position: absolute;
          pointer-events: none;
          z-index: 1;
          border-radius: 50px;
          width: 80%;
          height: 1.9rem;
          aspect-ratio: 1;
          background-color: #fff5;
          filter: blur(5px);
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.1; }
        }
        @keyframes opacityPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

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
        </div>
        
        {/* Layered Overlays for Readability (#5) */}
        {/* 1. Global Darken */}
        <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true" />
        
        {/* 2. Desktop Left-to-Right Gradient */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent opacity-100" aria-hidden="true" />
        
        {/* 3. Mobile/Tablet Bottom-to-Top Gradient */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" aria-hidden="true" />
        
        {/* 4. Bottom Edge Connector (blends into page content) */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" aria-hidden="true" />

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
              <div className="gradient-btn-wrapper">
                <div className="gradient-layer"></div>
                <div className="gradient-layer"></div>
                <button
                  onClick={onPlay}
                  className="gradient-btn flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-950/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-sm sm:text-base uppercase tracking-tight">Nghe ngay</span>
                </button>
                <div className="text-overlay"></div>
                <div className="light"></div>
              </div>

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
    </>
  );
};
