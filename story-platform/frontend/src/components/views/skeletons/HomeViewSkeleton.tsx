import React from 'react';
import { StoryCardSkeleton } from '../../common/skeletons/StoryCardSkeleton';

export const HomeViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 sm:space-y-12 lg:space-y-14 pb-28 sm:pb-32 animate-fadeIn max-w-[1800px] w-full mx-auto px-1 sm:px-2 lg:px-3">
      {/* Hero Banner Skeleton */}
      <div className="w-full aspect-[21/9] sm:aspect-[21/8] lg:aspect-[24/7] bg-slate-900/60 rounded-3xl sm:rounded-[2.5rem] border border-slate-800/80 mt-4 animate-pulse overflow-hidden flex flex-col justify-end p-6 sm:p-12 lg:p-16">
        <div className="max-w-2xl space-y-4">
          <div className="h-6 bg-slate-800/80 rounded-md w-32" />
          <div className="h-10 sm:h-14 bg-slate-800/70 rounded-lg w-4/5" />
          <div className="h-4 bg-slate-800/60 rounded-md w-3/4" />
          <div className="h-4 bg-slate-800/60 rounded-md w-2/3" />
          <div className="flex gap-3 pt-4">
            <div className="h-12 bg-slate-800/80 rounded-xl w-36" />
            <div className="h-12 bg-slate-800/60 rounded-xl w-36" />
          </div>
        </div>
      </div>

      {/* Quick Filter Skeleton */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[44px] w-28 bg-slate-900/80 rounded-xl border border-slate-800/80 shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Rail Section Skeleton 1 */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="h-7 bg-slate-800/80 rounded-lg w-48 animate-pulse" />
          <div className="h-5 bg-slate-800/60 rounded-md w-24 hidden sm:block animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={i > 1 ? (i > 2 ? (i > 3 ? (i > 4 ? "hidden xl:block" : "hidden lg:block") : "hidden md:block") : "hidden sm:block") : ""}>
              <StoryCardSkeleton />
            </div>
          ))}
        </div>
      </div>
      
      {/* Genres Grid Skeleton */}
      <div className="space-y-4 bg-slate-900/30 border border-slate-800/50 rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="h-7 bg-slate-800/80 rounded-lg w-56 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[88px] bg-slate-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Rail Section Skeleton 2 */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="h-7 bg-slate-800/80 rounded-lg w-48 animate-pulse" />
          <div className="h-5 bg-slate-800/60 rounded-md w-24 hidden sm:block animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={i > 1 ? (i > 2 ? (i > 3 ? (i > 4 ? "hidden xl:block" : "hidden lg:block") : "hidden md:block") : "hidden sm:block") : ""}>
              <StoryCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
