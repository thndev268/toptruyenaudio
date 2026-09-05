import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Heart, Star, Headphones, Sparkles, Crown, Trash2 } from 'lucide-react';
import { AudioStory } from '../../types';
import { useAudioPlayer, extractYouTubeId } from '../../context/AudioPlayerContext';

export interface StoryCardProps {
  story: AudioStory;
  variant?: 'vertical' | 'horizontal' | 'compact';
  onPlayClick?: () => void;
  rank?: number;
  progressPercent?: number;
  chapterTitle?: string;
  formattedTime?: string;
  subtitle?: string;
  onRemove?: () => void;
}

export function getStoryThumbnailUrl(story: AudioStory): string {
  const chapters = Array.isArray(story.chapters) ? story.chapters : [];
  if (!Array.isArray(story.chapters)) {
    console.warn('[StoryCard] story.chapters is not an array', story.id, story.chapters);
  }
  const firstChapter = chapters.length > 0 ? chapters[0] : null;
  const ytId =
    extractYouTubeId(story.iframeUrl) ||
    extractYouTubeId(story.iframeCode) ||
    extractYouTubeId(story.coverUrl) ||
    extractYouTubeId(firstChapter?.videoIframeUrl) ||
    extractYouTubeId(firstChapter?.iframeCode) ||
    extractYouTubeId(firstChapter?.audioUrl);

  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return story.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onPlayClick,
  rank,
  progressPercent,
  chapterTitle,
  formattedTime,
  subtitle,
  onRemove,
}) => {
  const navigate = useNavigate();
  const { playChapter, toggleFavorite, isFavorite } = useAudioPlayer();
  const favorited = isFavorite(story.id);

  const handleCardClick = () => {
    const storyIdentifier = story.slug || story.id;
    navigate(`/story/${storyIdentifier}`);
  };

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayClick) {
      onPlayClick();
    } else {
      const chapters = Array.isArray(story.chapters) ? story.chapters : [];
      if (!Array.isArray(story.chapters)) {
        console.warn('[StoryCard] story.chapters is not an array in handlePlayClick', story.id, story.chapters);
      }
      if (chapters.length > 0) {
        const success = await playChapter(story, chapters[0]);
        if (success) {
          const storyIdentifier = story.slug || story.id;
          navigate(`/listen/${storyIdentifier}/${chapters[0].id}`);
        }
      }
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(story.id);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  const formatListenCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  const thumbnailUrl = getStoryThumbnailUrl(story);

  // Check if story is VIP / Premium
  const chapters = Array.isArray(story.chapters) ? story.chapters : [];
  const isPremiumStory = story.isExclusive || chapters.some((c: any) => c.accessLevel === 'PREMIUM');

  return (
    <>
      <style>{`
        .story-card-3d-container {
          perspective: 500px;
        }
        .story-card-3d-image {
          transform-style: preserve-3d;
          will-change: transform;
          transition: transform 0.5s;
        }
        .story-card-3d-image:hover {
          transform: translateZ(10px) rotateX(5deg) rotateY(5deg);
        }
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
          font-size: 1rem;
          font-weight: 600;

          filter: saturate(0.65) brightness(1.8);
        }
        .gradient-btn {
          position: relative;
          z-index: -1;

          padding: 12px 36px;
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
          padding: 12px 36px;
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
      <div
        onClick={handleCardClick}
        className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] shadow-md hover:shadow-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 w-full gpu-accelerated"
        tabIndex={0}
        role="button"
        aria-label={`Chi tiết truyện ${story.title}`}
      >
      {/* 1. TOP 16:9 ASPECT-VIDEO THUMBNAIL */}
      <div className="story-card-3d-container relative aspect-video w-full overflow-hidden bg-slate-900/90 rounded-t-2xl flex items-center justify-center border-b border-slate-800/60 shrink-0 transform-gpu">
        <div className="story-card-3d-image w-full h-full">
          <img
            loading="lazy"
            src={thumbnailUrl}
            alt={story.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out bg-slate-800/80 will-change-transform"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                story.coverUrl ||
                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex items-center gap-1">
            {rank !== undefined && (
              <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black shadow-lg flex items-center gap-1 ${
                rank === 0
                  ? 'bg-amber-500 text-slate-950'
                  : rank === 1
                  ? 'bg-slate-300 text-slate-950'
                  : rank === 2
                  ? 'bg-amber-700 text-white'
                  : 'bg-slate-950/80 text-slate-300 border border-slate-700'
              }`}>
                {rank === 0 ? <Crown className="w-3 h-3 fill-current" /> : `#${rank + 1}`}
              </span>
            )}

            {story.isExclusive ? (
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-lg flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-slate-950" /> Độc quyền
              </span>
            ) : isPremiumStory ? (
              <span className="bg-amber-500/20 backdrop-blur-md text-amber-300 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg border border-amber-500/40 shadow-lg flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5 text-amber-400" /> VIP
              </span>
            ) : (
              <div className="flex gap-1 flex-wrap">
                {Array.isArray(story.genres) && story.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre.id}
                    className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md border border-slate-700"
                  >
                    {genre.name}
                  </span>
                ))}
                {Array.isArray(story.genres) && story.genres.length > 2 && <span>+{story.genres.length - 2}</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {onRemove && (
              <button
                onClick={handleRemoveClick}
                className="p-1.5 rounded-lg backdrop-blur-md bg-slate-950/60 text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-white/10 transition-colors cursor-pointer"
                title="Xóa khỏi danh sách"
                aria-label="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                favorited
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900 border border-white/10'
              }`}
              aria-label={favorited ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            >
              <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-slate-950/30">
          <div className="gradient-btn-wrapper">
            <div className="gradient-layer"></div>
            <div className="gradient-layer"></div>
            <button
              onClick={handlePlayClick}
              className="gradient-btn w-12 h-12 flex items-center justify-center"
              aria-label="Nghe ngay"
            >
              <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
            </button>
            <div className="text-overlay"></div>
            <div className="light"></div>
          </div>
        </div>

      </div>

      {/* 2. BOTTOM DETAILS AREA */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-2">
        <div className="space-y-1.5">
          {/* Subtitle / Reason / Chapter Title */}
          {subtitle && (
            <div className="text-[10px] sm:text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 truncate inline-block max-w-full">
              {subtitle}
            </div>
          )}

          {chapterTitle && (
            <p className="text-xs text-cyan-400 font-medium truncate">
              {chapterTitle}
            </p>
          )}

          <h3 className="text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
            {story.title}
          </h3>

          <p className="text-xs text-slate-400 truncate">
            {story.narratorName ? `MC: ${story.narratorName}` : `Tác giả: ${story.authorName}`}
          </p>
        </div>

        {/* Listening Progress Bar if applicable */}
        {progressPercent !== undefined && (
          <div className="space-y-1 pt-1">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            {formattedTime && (
              <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                <span>Đã nghe {Math.round(progressPercent)}%</span>
                <span>{formattedTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Meta */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1 font-mono">
            <Headphones className="w-3.5 h-3.5 text-cyan-500" />
            {formatListenCount(story.stats?.listenCount)}
          </span>

          <span className="text-slate-500 font-mono">{story.totalChapters || story.chapters?.length || 0} tập</span>
        </div>
      </div>
    </div>
    </>
  );
};
