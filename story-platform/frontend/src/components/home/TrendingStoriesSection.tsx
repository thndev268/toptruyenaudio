import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { TrendingUp, ChevronLeft, ChevronRight, Play, Headphones, Crown, Sparkles, Star } from 'lucide-react';
import { AudioStory } from '../../types';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { getStoryThumbnailUrl } from '../common/StoryCard';
import { AuthGateModal } from '../common/AuthGateModal';

interface TrendingStoriesSectionProps {
  stories: AudioStory[];
}

export const TrendingStoriesSection: React.FC<TrendingStoriesSectionProps> = ({ stories }) => {
  const navigate = useNavigate();
  const { playChapter } = useAudioPlayer();
  const { isAuthenticated, role } = useAuth();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedStoryForAuth, setSelectedStoryForAuth] = useState<AudioStory | null>(null);

  // Interaction & Autoplay tracking
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isInViewport, setIsInViewport] = useState<boolean>(true);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const isReducedMotion = useReducedMotion();

  // Screen size detection for responsive 3D transforms
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sort stories by 24H popularity (listenCount + viewCount)
  const sortedTrending = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    return [...stories].sort((a, b) => {
      const aTotal = (a.stats?.listenCount || 0) + (a.stats?.viewCount || 0);
      const bTotal = (b.stats?.listenCount || 0) + (b.stats?.viewCount || 0);
      return bTotal - aTotal;
    });
  }, [stories]);

  const totalStories = sortedTrending.length;

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (totalStories <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setCurrentIndex((prev) => (prev + 1) % totalStories);
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 350);
  }, [totalStories]);

  const handlePrev = useCallback(() => {
    if (totalStories <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setCurrentIndex((prev) => (prev - 1 + totalStories) % totalStories);
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 350);
  }, [totalStories]);

  // Handle user interaction pause/resume
  const markUserInteraction = useCallback(() => {
    setIsUserInteracting(true);
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 6000);
  }, []);

  // Preload next/prev thumbnails for smooth rendering
  useEffect(() => {
    if (totalStories === 0) return;
    const nextIdx = (currentIndex + 1) % totalStories;
    const prevIdx = (currentIndex - 1 + totalStories) % totalStories;
    [nextIdx, prevIdx].forEach((idx) => {
      const story = sortedTrending[idx];
      if (story) {
        const url = getStoryThumbnailUrl(story);
        if (url) {
          const img = new Image();
          img.src = url;
        }
      }
    });
  }, [currentIndex, sortedTrending, totalStories]);

  // IntersectionObserver to pause autoplay when carousel is out of viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Autoplay timer (5 seconds)
  useEffect(() => {
    if (totalStories <= 1) return;

    let intervalId: NodeJS.Timeout | null = null;

    const shouldAutoPlay =
      isInViewport &&
      !isUserInteracting &&
      !isHovered &&
      !document.hidden;

    if (shouldAutoPlay) {
      intervalId = setInterval(() => {
        handleNext();
      }, 5000);
    }

    const handleVisibilityChange = () => {
      if (document.hidden && intervalId) {
        clearInterval(intervalId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [totalStories, isInViewport, isUserInteracting, isHovered, handleNext]);

  // Cleanup interaction timer on unmount
  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  // "Nghe ngay" click handler with Auth Check
  const handlePlayNow = async (e: React.MouseEvent, story: AudioStory) => {
    e.stopPropagation();
    markUserInteraction();

    const isGuest = !isAuthenticated || role === 'GUEST';

    if (isGuest) {
      setSelectedStoryForAuth(story);
      setIsAuthModalOpen(true);
      return;
    }

    if (story.chapters && story.chapters.length > 0) {
      const success = await playChapter(story, story.chapters[0]);
      if (success) {
        const storyIdentifier = story.slug || story.id;
        navigate(`/listen/${storyIdentifier}/${story.chapters[0].id}`);
      }
    } else {
      const storyIdentifier = story.slug || story.id;
      navigate(`/story/${storyIdentifier}`);
    }
  };

  const handleCardClick = (story: AudioStory, offset: number) => {
    markUserInteraction();
    if (offset === 0) {
      const storyIdentifier = story.slug || story.id;
      navigate(`/story/${storyIdentifier}`);
    } else if (offset < 0) {
      handlePrev();
    } else if (offset > 0) {
      handleNext();
    }
  };

  // Pan / Swipe gesture handler
  const handlePanEnd = (
    _event: any,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => {
    setDragOffset(0);
    markUserInteraction();

    const swipeThreshold = 40;
    const velocityThreshold = 180;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  if (totalStories === 0) return null;

  // Define offsets to render (-2, -1, 0, 1, 2)
  const offsets = [-2, -1, 0, 1, 2];

  return (
    <div className="space-y-4 relative w-full overflow-hidden" ref={containerRef}>
      {/* Header Section */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
              <span>Bảng Xu Hướng 24H</span>
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono rounded-full font-extrabold uppercase animate-pulse">
                REALTIME
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Xếp hạng theo tổng lượt nghe & xem trong 24 giờ qua
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/rankings')}
          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>Xem tất cả</span>
        </button>
      </div>

      {/* 3D Infinite Carousel Container */}
      <div
        className="relative w-full py-4 sm:py-6 outline-none select-none touch-pan-y"
        tabIndex={0}
        aria-label="Carousel Bảng Xu Hướng 24H"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => markUserInteraction()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handlePrev();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            handleNext();
          }
        }}
      >
        {/* Navigation Arrows (Desktop / Tablet) */}
        {totalStories > 1 && (
          <>
            <button
              onClick={() => {
                markUserInteraction();
                handlePrev();
              }}
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md"
              aria-label="Truyện trước"
            >
              <ChevronLeft className="w-6 h-6 ml-0.5" />
            </button>

            <button
              onClick={() => {
                markUserInteraction();
                handleNext();
              }}
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md"
              aria-label="Truyện tiếp theo"
            >
              <ChevronRight className="w-6 h-6 mr-0.5" />
            </button>
          </>
        )}

        {/* 3D Stage with Perspective */}
        <div
          className="relative w-full max-w-6xl mx-auto min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex items-center justify-center overflow-hidden"
          style={{ perspective: '1200px' }}
        >
          {offsets.map((offset) => {
            const index = (currentIndex + offset + totalStories * 1000) % totalStories;
            const story = sortedTrending[index];
            if (!story) return null;

            const isCenter = offset === 0;
            const thumbnailUrl = getStoryThumbnailUrl(story);

            // Responsive 3D transform calculations
            const isMobile = windowWidth < 640;
            const isTablet = windowWidth >= 640 && windowWidth < 1024;

            let translateX = 0;
            let rotateY = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 30;

            if (offset === 0) {
              translateX = 0;
              rotateY = 0;
              scale = 1;
              opacity = 1;
              zIndex = 30;
            } else if (offset === -1) {
              translateX = isMobile ? -62 : isTablet ? -66 : -72;
              rotateY = isReducedMotion ? 0 : isMobile ? 22 : isTablet ? 26 : 30;
              scale = isMobile ? 0.82 : isTablet ? 0.84 : 0.86;
              opacity = isMobile ? 0.55 : 0.8;
              zIndex = 20;
            } else if (offset === 1) {
              translateX = isMobile ? 62 : isTablet ? 66 : 72;
              rotateY = isReducedMotion ? 0 : isMobile ? -22 : isTablet ? -26 : -30;
              scale = isMobile ? 0.82 : isTablet ? 0.84 : 0.86;
              opacity = isMobile ? 0.55 : 0.8;
              zIndex = 20;
            } else if (offset === -2) {
              translateX = isMobile ? -110 : isTablet ? -118 : -132;
              rotateY = isReducedMotion ? 0 : isMobile ? 35 : isTablet ? 38 : 42;
              scale = isMobile ? 0.65 : isTablet ? 0.7 : 0.72;
              opacity = isMobile ? 0 : isTablet ? 0.3 : 0.45;
              zIndex = 10;
            } else if (offset === 2) {
              translateX = isMobile ? 110 : isTablet ? 118 : 132;
              rotateY = isReducedMotion ? 0 : isMobile ? -35 : isTablet ? -38 : -42;
              scale = isMobile ? 0.65 : isTablet ? 0.7 : 0.72;
              opacity = isMobile ? 0 : isTablet ? 0.3 : 0.45;
              zIndex = 10;
            }

            const totalListenCount = (story.stats?.listenCount || 0) + (story.stats?.viewCount || 0);

            return (
              <motion.div
                key={`story-card-slot-${offset}-${story.id}`}
                className="absolute top-0 w-[84%] sm:w-[58%] md:w-[48%] lg:w-[42%] max-w-[460px] cursor-pointer"
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex,
                }}
                animate={{
                  x: `${translateX + dragOffset}%`,
                  rotateY,
                  scale,
                  opacity,
                }}
                transition={{
                  duration: isReducedMotion ? 0.15 : 0.45,
                  ease: [0.25, 1, 0.5, 1],
                }}
                onPanStart={() => {
                  markUserInteraction();
                }}
                onPan={(_e, info) => {
                  setDragOffset((info.offset.x / (windowWidth || 1000)) * 100);
                }}
                onPanEnd={handlePanEnd}
                onClick={() => handleCardClick(story, offset)}
              >
                <div
                  className={`group bg-slate-900/95 rounded-3xl border ${
                    isCenter
                      ? 'border-rose-500/60 shadow-2xl shadow-rose-500/10'
                      : 'border-slate-800/90 shadow-lg'
                  } overflow-hidden transition-colors duration-300 flex flex-col`}
                >
                  {/* Thumbnail Area (Strict 16:9 Aspect Ratio) */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900/90 rounded-t-3xl border-b border-slate-800/80">
                    <img
                      loading="lazy"
                      src={thumbnailUrl}
                      alt={story.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out bg-slate-800/80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          story.coverUrl ||
                          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Dark gradient vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/40 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black shadow-xl flex items-center gap-1 ${
                            index === 0
                              ? 'bg-amber-400 text-slate-950'
                              : index === 1
                              ? 'bg-slate-200 text-slate-950'
                              : index === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-950/85 text-slate-200 border border-slate-700/80'
                          }`}
                        >
                          {index === 0 ? <Crown className="w-3.5 h-3.5 fill-current text-slate-950" /> : `#${index + 1}`}
                        </span>

                        {story.isExclusive && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-slate-950" /> Độc quyền
                          </span>
                        )}
                      </div>

                      {story.rating && (
                        <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-amber-400 text-xs font-black flex items-center gap-1 shadow">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{story.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Non-center card overlay */}
                    {!isCenter && (
                      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] transition-opacity duration-300 group-hover:bg-slate-950/30" />
                    )}
                  </div>

                  {/* Card Details Area - FULL Details ONLY for Center Card */}
                  {isCenter ? (
                    <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-slate-900/95">
                      <div className="space-y-1.5">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                          {story.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 truncate">
                          {story.narratorName
                            ? `MC: ${story.narratorName}`
                            : `Tác giả: ${story.authorName}`}
                        </p>
                      </div>

                      {/* Primary "Nghe Ngay" Action Button */}
                      <button
                        onClick={(e) => handlePlayNow(e, story)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-black rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] min-h-[46px] cursor-pointer"
                        aria-label={`Nghe ngay ${story.title}`}
                      >
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                        <span className="text-sm uppercase tracking-wider font-extrabold">Nghe Ngay</span>
                      </button>
                    </div>
                  ) : (
                    /* Side Card Minimal Footer */
                    <div className="p-3 bg-slate-950/70 border-t border-slate-800/60 text-center">
                      <p className="text-xs font-bold text-slate-300 truncate">{story.title}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Auth Gate Modal for Guests clicking "Nghe ngay" */}
      <AuthGateModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Đăng Nhập Để Thưởng Thức Audio"
        message={
          selectedStoryForAuth
            ? `Bạn cần đăng nhập tài khoản để nghe bộ truyện "${selectedStoryForAuth.title}".`
            : 'Bạn cần đăng nhập hoặc đăng ký tài khoản để nghe bộ truyện này.'
        }
      />
    </div>
  );
};
