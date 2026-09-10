import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
} from 'lucide-react';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { useGenres } from '../../hooks/useGenres';
import { useStories } from '../../hooks/useStories';
import { HeroSection } from '../home/HeroSection';
import { QuickStoryFilter } from '../home/QuickStoryFilter';
import { RecommendedStoriesSection } from '../home/RecommendedStoriesSection';
import { TrendingStoriesSection } from '../home/TrendingStoriesSection';
import { FeaturedCreatorsSection } from '../home/FeaturedCreatorsSection';
import { FeaturedActiveUsersSection } from '../home/FeaturedActiveUsersSection';
import { CommunityActivitySection } from '../home/CommunityActivitySection';
import { BecomeCreatorBanner } from '../home/BecomeCreatorBanner';
import { HomeViewSkeleton } from './skeletons/HomeViewSkeleton';
import { PremiumLoadingScreen } from '../common/PremiumLoadingScreen';
import { ErrorState } from '../common/ErrorState';
import { BottomLoadingIndicator } from '../common/BottomLoadingIndicator';
import { GoogleAd } from '../ads/GoogleAd';

const EMPTY_STORIES: any[] = [];
const EMPTY_GENRES: any[] = [];

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  const { stories, isLoading, isLoadingMore, error, hasTimedOut, retry, loadMore } = useStories();
  const allStories = Array.isArray(stories) ? stories : EMPTY_STORIES;
  const featuredStory = allStories.length > 0 ? allStories[0] : null;
  const genres = useGenres();
  const genresArray = Array.isArray(genres) ? genres : EMPTY_GENRES;

  // Show premium loading screen for initial load
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Show premium loading screen during initial load
  if (showInitialLoading && isLoading) {
    return <PremiumLoadingScreen message="Đang tải truyện audio..." />;
  }

  // Show error state if there's an error
  if (error && !isLoading) {
    return (
      <ErrorState
        title={hasTimedOut ? 'Hệ thống đang gặp sự cố' : 'Không thể tải dữ liệu'}
        message={hasTimedOut ? 'Vui lòng chờ trong giây lát...' : error.message}
        onRetry={retry}
        isRetrying={isLoading}
      />
    );
  }

  // Show skeleton if still loading but not initial loading
  if (isLoading && !showInitialLoading) {
    return <HomeViewSkeleton />;
  }

  return (
    <div className="space-y-8 sm:space-y-12 lg:space-y-14 pb-28 sm:pb-32 animate-fadeIn max-w-[1800px] w-full mx-auto px-1 sm:px-2 lg:px-3">

      {/* 1. HERO BANNER SECTION */}
      {featuredStory && <HeroSection featuredStory={featuredStory} />}

      {/* GOOGLE ADSENSE BANNER - After Hero */}
      <div className="w-full flex justify-center">
        <GoogleAd slot="YOUR_AD_SLOT_ID" className="w-full max-w-[728px] h-[90px]" />
      </div>

      {/* 2. QUICK STORY FILTER */}
      <QuickStoryFilter />

      {/* 3. RECOMMENDED FOR YOU SECTION */}
      <RecommendedStoriesSection stories={allStories} />

      {/* 4. GENRES SELECTION SECTION - Directly after Recommended Stories */}
      <div className="space-y-4 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white">Khám Phá Thể Loại Truyện</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chọn thể loại yêu thích để chuyển tiếp sang trang khám phá
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 transition-all cursor-pointer"
          >
            <span>Tất cả thể loại</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {genresArray.map((genre) => (
            <div
              key={genre.id}
              onClick={() => navigate(`/explore?genre=${encodeURIComponent(genre.name)}`)}
              className="p-3.5 sm:p-4 bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer hover:bg-slate-850 transition-all group flex flex-col justify-between"
            >
              <div className="text-xs sm:text-sm font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
                {genre.name}
              </div>
              <div className="text-[11px] font-mono text-cyan-400/80 mt-2 flex items-center justify-between">
                <span>{genre.storyCount} bộ audio</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-cyan-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. TRENDING 24H SECTION */}
      <TrendingStoriesSection stories={allStories} />

      {/* GOOGLE ADSENSE BANNER - After Trending */}
      <div className="w-full flex justify-center">
        <GoogleAd slot="YOUR_AD_SLOT_ID_2" className="w-full max-w-[728px] h-[90px]" />
      </div>

      {/* 6. BOTTOM LOADING INDICATOR */}
      {isLoadingMore && <BottomLoadingIndicator />}

      {/* 7. FEATURED CREATORS */}
      <FeaturedCreatorsSection />

      {/* 8. FEATURED ACTIVE USERS */}
      <FeaturedActiveUsersSection />

      {/* 9. COMMUNITY ACTIVITY */}
      <CommunityActivitySection />

      {/* 10. BECOME CREATOR CTA BANNER */}
      <BecomeCreatorBanner />

      {/* GOOGLE ADSENSE BANNER - Before Footer */}
      <div className="w-full flex justify-center">
        <GoogleAd slot="YOUR_AD_SLOT_ID_3" className="w-full max-w-[728px] h-[90px]" />
      </div>

    </div>
  );
};
