import React from 'react';

export const StoryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-full w-full animate-pulse">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-slate-800/50 rounded-t-2xl shrink-0" />
      
      {/* Details Area */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-3">
          {/* Title lines */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-800/70 rounded-md w-11/12" />
            <div className="h-4 bg-slate-800/70 rounded-md w-4/5" />
          </div>
          {/* Author line */}
          <div className="h-3 bg-slate-800/50 rounded-md w-3/5" />
        </div>
        
        {/* Footer Meta */}
        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <div className="h-3.5 bg-slate-800/60 rounded w-16" />
          <div className="h-3.5 bg-slate-800/60 rounded w-12" />
        </div>
      </div>
    </div>
  );
};
