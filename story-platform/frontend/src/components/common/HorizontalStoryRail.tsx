import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalStoryRailProps {
  children: React.ReactNode;
  className?: string;
}

export const HorizontalStoryRail: React.FC<HorizontalStoryRailProps> = ({ children, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 rounded-full items-center justify-center shadow-xl transition-all opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px]"
        aria-label="Cuộn sang trái"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 rounded-full items-center justify-center shadow-xl transition-all opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px]"
        aria-label="Cuộn sang phải"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Rail Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 mobile-optimized-scroll"
      >
        {children}
      </div>
    </div>
  );
};
