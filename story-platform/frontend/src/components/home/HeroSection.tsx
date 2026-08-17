import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Sparkles, Headphones, Crown, Info } from 'lucide-react';
import { AudioStory } from '../../types';
import { useAudioPlayer, extractYouTubeId } from '../../context/AudioPlayerContext';
import { useAuth } from '../../context/AuthContext';

interface HeroSectionProps {
  featuredStory: AudioStory;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ featuredStory }) => {
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuth();
  const { playChapter, openAuthModal, openPremiumModal } = useAudioPlayer();

  if (!featuredStory) return null;

  const firstChapter = featuredStory.chapters?.[0];

  // Extract YouTube Video ID from any available field
  const ytId =
    extractYouTubeId(featuredStory.iframeUrl) ||
    extractYouTubeId(featuredStory.iframeCode) ||
    extractYouTubeId(firstChapter?.videoIframeUrl) ||
    extractYouTubeId(firstChapter?.iframeCode) ||
    extractYouTubeId(firstChapter?.audioUrl);

  const [thumbIndex, setThumbIndex] = useState<number>(0);

  useEffect(() => {
    setThumbIndex(0);
  }, [ytId, featuredStory.id]);

  const getThumbUrl = (): string => {
    if (!ytId) return featuredStory.bannerUrl || featuredStory.coverUrl || '/placeholder.jpg';
    if (thumbIndex === 0) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    if (thumbIndex === 1) return `https://img.youtube.com/vi/${ytId}/sddefault.jpg`;
    if (thumbIndex === 2) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return featuredStory.bannerUrl || featuredStory.coverUrl || '/placeholder.jpg';
  };

  const handleImgError = () => {
    if (thumbIndex < 3) {
      setThumbIndex((prev) => prev + 1);
    }
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    // YouTube returns a 120x90 image when maxresdefault is missing
    if (thumbIndex === 0 && img.naturalWidth === 120 && img.naturalHeight === 90) {
      setThumbIndex(1);
    }
  };

  const isPremiumStory =
    (featuredStory as any).accessLevel === 'PREMIUM' || firstChapter?.accessLevel === 'PREMIUM';

  const handlePlayStory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Guest Check - prompt login & do NOT play audio
    if (!isAuthenticated || role === 'GUEST') {
      openAuthModal();
      return;
    }

    if (!firstChapter) return;

    // 2. Free vs Premium Check
    const userIsPremium = user?.membership?.tier === 'PREMIUM';

    if (isPremiumStory && !userIsPremium) {
      openPremiumModal();
      return;
    }

    // 3. Authorized Playback
    playChapter(featuredStory, firstChapter);
    const storyIdentifier = featuredStory.slug || featuredStory.id;
    navigate(`/listen/${storyIdentifier}/${firstChapter.id}`);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl transition-all duration-300 animate-fadeIn w-full">
      {/* Background Atmosphere Blur */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-900">
        <img
          loading="lazy"
          src={featuredStory.bannerUrl || featuredStory.coverUrl}
          alt=""
          className="w-full h-full object-cover opacity-10 dark:opacity-20 blur-2xl scale-110 bg-slate-800/80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100/90 via-slate-100/70 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent" />
      </div>

      <div className="relative z-10 p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center w-full">
        {/* Left Content Column */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 rounded-full text-xs font-bold tracking-wide shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Truyện nổi bật mới ra</span>
            </div>

            {isPremiumStory ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-bold">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>PREMIUM</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-bold">
                <span>MIỄN PHÍ</span>
              </div>
            )}
          </div>

          <Link to={`/story/${featuredStory.slug}`} className="block group">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {featuredStory.title}
            </h1>
          </Link>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-normal">
            {featuredStory.summary}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 pt-1">
            <span className="text-cyan-700 dark:text-cyan-400 font-semibold flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5" />
              MC Giọng đọc: {featuredStory.narratorName}
            </span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-600">•</span>
            <span className="bg-slate-200 dark:bg-slate-800/90 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/80 font-mono text-[11px]">
              {featuredStory.totalChapters || featuredStory.chapters?.length || 0} Tập audio HD
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handlePlayStory}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transform hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              <span>Nghe Ngay Tập 1</span>
            </button>

            <Link
              to={`/story/${featuredStory.slug}`}
              className="px-5 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 transition-all duration-200 min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Chi Tiết Truyện</span>
            </Link>
          </div>
        </div>

        {/* Right Thumbnail Column */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div
            onClick={handlePlayStory}
            className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-700/80 cursor-pointer group bg-slate-900 transition-transform duration-300"
          >
            <img
              loading="lazy"
              src={getThumbUrl()}
              alt={featuredStory.title}
              onError={handleImgError}
              onLoad={handleImgLoad}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out bg-slate-800/80"
            />

            {/* Overlay Gradient & Centered Play Button */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 flex items-center justify-center transition-colors duration-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-cyan-500/50 group-hover:scale-105 active:scale-95 transition-all duration-200 hover:brightness-110">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 fill-slate-950 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
