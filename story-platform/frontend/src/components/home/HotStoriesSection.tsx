import React, { useState } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { AudioStory } from '../../types';
import { StoryCard } from '../common/StoryCard';

interface HotStoriesSectionProps {
  stories: AudioStory[];
}

export const HotStoriesSection: React.FC<HotStoriesSectionProps> = ({ stories }) => {
  const [tab, setTab] = useState<'today' | 'week' | 'month'>('week');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 6;

  const storiesArray = Array.isArray(stories) ? stories : [];

  const handleTabChange = (newTab: 'today' | 'week' | 'month') => {
    setTab(newTab);
    setCurrentPage(1);
  };

  const sortedStories = [...storiesArray].sort((a, b) => {
    if (tab === 'today') return (b.stats?.listenCount || 0) - (a.stats?.listenCount || 0);
    if (tab === 'week') return (b.stats?.favoriteCount || 0) - (a.stats?.favoriteCount || 0);
    return b.rating - a.rating;
  });

  const totalPages = Math.max(1, Math.ceil(sortedStories.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const paginatedStories = sortedStories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-xl">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">Truyện Audio Hot Đột Phá</h2>
            <p className="text-xs text-slate-400">Tác phẩm thu hút hàng trăm nghìn lượt nghe và bình luận nhiều nhất</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={() => handleTabChange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
              tab === 'today' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hot Hôm Nay
          </button>
          <button
            onClick={() => handleTabChange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
              tab === 'week' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hot Tuần này
          </button>
          <button
            onClick={() => handleTabChange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] cursor-pointer ${
              tab === 'month' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hot Tháng này
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {paginatedStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <span>
            Hiển thị {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, sortedStories.length)} / {sortedStories.length} truyện
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={validPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`min-w-[36px] min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  pageNum === validPage
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={validPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
