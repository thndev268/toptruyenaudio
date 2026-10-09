import React from 'react';
import { Compass } from 'lucide-react';
import { StoryCardSkeleton } from '../../common/skeletons/StoryCardSkeleton';

export const ExploreViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
      {/* Header Banner Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-3 w-full max-w-sm animate-pulse">
          <div className="flex items-center gap-2 mb-1.5">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
            <div className="h-4 bg-slate-800 rounded w-32" />
          </div>
          <div className="h-8 bg-slate-800/80 rounded-lg w-full" />
          <div className="h-4 bg-slate-800/60 rounded w-4/5 mt-1" />
        </div>
      </div>

      {/* Filter Section Skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 animate-pulse">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
           <div className="h-12 bg-slate-800/70 rounded-xl w-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/50 rounded-xl w-full" />
          ))}
        </div>
      </div>

      {/* Stories Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 10 }).map((_, idx) => (
          <StoryCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};
