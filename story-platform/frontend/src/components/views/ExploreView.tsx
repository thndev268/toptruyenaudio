import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, RefreshCw } from 'lucide-react';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { useStories } from '../../hooks/useStories';
import { StoryCard } from '../common/StoryCard';
import { ResponsiveStoryFilter } from '../common/ResponsiveStoryFilter';
import { StoryCardSkeleton } from '../common/skeletons/StoryCardSkeleton';
import { ExploreViewSkeleton } from './skeletons/ExploreViewSkeleton';
import {
  FilterState,
  DEFAULT_FILTERS,
  filterStoryList,
} from '../../utils/searchHelpers';

export const ExploreView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Read initial filter values from URL
  const [filters, setFilters] = useState<FilterState>({
    q: searchParams.get('q') || '',
    genre: searchParams.get('genre') || 'all',
    status: searchParams.get('status') || 'all',
    access: searchParams.get('access') || 'all',
    duration: searchParams.get('duration') || 'all',
    creator: searchParams.get('creator') || '',
    sort: searchParams.get('sort') || 'listens',
  });

  // Sync state when URL searchParams changes
  useEffect(() => {
    setFilters({
      q: searchParams.get('q') || '',
      genre: searchParams.get('genre') || 'all',
      status: searchParams.get('status') || 'all',
      access: searchParams.get('access') || 'all',
      duration: searchParams.get('duration') || 'all',
      creator: searchParams.get('creator') || '',
      sort: searchParams.get('sort') || 'listens',
    });
  }, [searchParams]);

  // Debounce the searching feedback spinner when search query changes
  useEffect(() => {
    if (filters.q) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [filters.q]);

  // Update URL search parameters when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const params = new URLSearchParams();

    if (newFilters.q && newFilters.q.trim()) {
      params.set('q', newFilters.q.trim());
    }
    if (newFilters.genre && newFilters.genre !== 'all') {
      params.set('genre', newFilters.genre);
    }
    if (newFilters.status && newFilters.status !== 'all') {
      params.set('status', newFilters.status);
    }
    if (newFilters.access && newFilters.access !== 'all') {
      params.set('access', newFilters.access);
    }
    if (newFilters.duration && newFilters.duration !== 'all') {
      params.set('duration', newFilters.duration);
    }
    if (newFilters.creator && newFilters.creator.trim()) {
      params.set('creator', newFilters.creator.trim());
    }
    if (newFilters.sort && newFilters.sort !== 'listens') {
      params.set('sort', newFilters.sort);
    }

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams(new URLSearchParams());
  };

  const publicStories = useStories();
  const allStories = publicStories;
  const filteredStories = filterStoryList(allStories, filters);

  // Simulate network loading time for smoother visual transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <ExploreViewSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">Kho Audio Số Đa Dạng</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white">Khám Phá Truyện Audio & Podcast</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Lọc kết quả chi tiết theo thể loại, giọng đọc, tác giả và mức phí</p>
        </div>
      </div>

      {/* Unified Responsive Story Filter */}
      <ResponsiveStoryFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        totalResultsCount={filteredStories.length}
        title="Bộ lọc truyện audio"
        subtitle="Tìm kiếm nhanh theo tên truyện, tác giả, MC giọng đọc và thể loại"
        isSearching={isSearching}
      />

      {/* Stories Grid */}
      {isSearching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <StoryCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <p className="text-slate-400 text-sm">Không tìm thấy bộ truyện audio phù hợp với bộ lọc hiện tại.</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} variant="vertical" />
          ))}
        </div>
      )}
    </div>
  );
};

