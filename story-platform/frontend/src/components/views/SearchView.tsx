import React, { useState } from 'react';
import { Search, Play, Star, X, Sparkles, Filter, RotateCcw, Crown } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { useGenres } from '../../hooks/useGenres';
import { useStories } from '../../hooks/useStories';
import { matchesSearchKeyword } from '../../utils/searchHelpers';
import { StoryCard } from '../common/StoryCard';

const EMPTY_STORIES: any[] = [];

export const SearchView: React.FC = () => {
  const { navigateTo, playChapter } = useAudioPlayer();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedAccess, setSelectedAccess] = useState<'all' | 'FREE' | 'PREMIUM'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ONGOING' | 'COMPLETED'>('all');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce searching feedback spinner when query changes
  React.useEffect(() => {
    if (query) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [query]);

  const { stories: publicStories } = useStories();
  const allStories = Array.isArray(publicStories) ? publicStories : EMPTY_STORIES;
  const genres = useGenres();

  const filtered = allStories.filter((story) => {
    // Keyword match
    if (query.trim()) {
      const matchesTitle = matchesSearchKeyword(story.title, query);
      const matchesAuthor = matchesSearchKeyword(story.authorName, query);
      const matchesNarrator = matchesSearchKeyword(story.narratorName, query);
      const matchesSummary = matchesSearchKeyword(story.summary, query);
      const storyGenres = Array.isArray(story.genres) ? story.genres : [];
      const matchesGenres = matchesSearchKeyword(storyGenres, query);
      if (!(matchesTitle || matchesAuthor || matchesNarrator || matchesSummary || matchesGenres)) {
        return false;
      }
    }

    // Genre filter
    const storyGenres = Array.isArray(story.genres) ? story.genres : [];
    if (selectedGenre !== 'all' && !storyGenres.includes(selectedGenre)) {
      return false;
    }

    // Access filter (checks if story has any FREE or VIP chapter)
    if (selectedAccess !== 'all') {
      const chapters = Array.isArray(story.chapters) ? story.chapters : [];
      const hasMatchingAccess = chapters.some((ch: any) => ch.accessLevel === selectedAccess);
      if (!hasMatchingAccess) return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && story.storyStatus !== selectedStatus) {
      return false;
    }

    return true;
  });

  const popularKeywords = ['Hàn Lập', 'Truyện ma đêm khuya', 'MC Hùng Sơn', 'Đắc Nhân Tâm', 'Kiếm Hiệp', 'Ngôn Tình'];

  const hasActiveFilters = query.trim() !== '' || selectedGenre !== 'all' || selectedAccess !== 'all' || selectedStatus !== 'all';

  const handleResetFilters = () => {
    setQuery('');
    setSelectedGenre('all');
    setSelectedAccess('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">Tìm Kiếm Thông Minh</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        <h1 className="text-xl sm:text-3xl font-black text-white">Tìm Kiếm Truyện Audio & Giọng Đọc</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Hỗ trợ tìm kiếm tiếng Việt có dấu và không dấu theo tên truyện, tác giả, MC giọng đọc và phân loại
        </p>

        <div className="relative pt-1">
          <input
            type="text"
            placeholder="Tìm theo tên truyện, tác giả hoặc MC..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 text-slate-100 placeholder-slate-400 pl-12 pr-10 py-3.5 rounded-2xl border border-slate-700/80 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 shadow-inner min-h-[48px]"
            aria-label="Tìm kiếm truyện"
          />
          {isSearching ? (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Popular Keywords */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">Gợi ý tìm kiếm:</span>
          {popularKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => setQuery(kw)}
              className={`px-3 py-1.5 rounded-full border transition-colors min-h-[32px] cursor-pointer ${
                query === kw
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border-slate-700'
              }`}
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Quick Filter Horizontal Scroll Bar */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          {/* Genre Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain py-1">
            <button
              type="button"
              onClick={() => setSelectedGenre('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap inline-flex items-center transition-all cursor-pointer border ${
                selectedGenre === 'all'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm font-black'
                  : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Tất cả thể loại
            </button>
            {genres.map((g) => {
              const isSelected = selectedGenre === g.name;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGenre(isSelected ? 'all' : g.name)}
                  title={`Lọc truyện thuộc thể loại ${g.name}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-sm'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:text-white'
                  }`}
                >
                  <span>{g.name}</span>
                </button>
              );
            })}
          </div>

          {/* Access & Status Quick Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain py-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 whitespace-nowrap">Lọc nhanh:</span>
            <button
              type="button"
              onClick={() => setSelectedAccess(selectedAccess === 'FREE' ? 'all' : 'FREE')}
              title="Lọc các bộ truyện có các tập audio miễn phí"
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 whitespace-nowrap inline-flex items-center transition-all border ${
                selectedAccess === 'FREE'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Miễn phí (FREE)
            </button>
            <button
              type="button"
              onClick={() => setSelectedAccess(selectedAccess === 'PREMIUM' ? 'all' : 'PREMIUM')}
              title="Lọc các bộ truyện độc quyền dành cho hội viên VIP Premium"
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 whitespace-nowrap inline-flex items-center gap-1 transition-all border ${
                selectedAccess === 'PREMIUM'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Crown className="w-3 h-3 text-amber-400 shrink-0" />
              <span>VIP Premium</span>
            </button>

            <span className="text-slate-700 shrink-0">|</span>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'ONGOING' ? 'all' : 'ONGOING')}
              title="Lọc truyện đang ra tập mới định kỳ"
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 whitespace-nowrap inline-flex items-center transition-all border ${
                selectedStatus === 'ONGOING'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Đang ra
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'COMPLETED' ? 'all' : 'COMPLETED')}
              title="Lọc truyện đã hoàn thành trọn bộ"
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 whitespace-nowrap inline-flex items-center transition-all border ${
                selectedStatus === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Hoàn thành
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
        <span>KẾT QUẢ TÌM KIẾM ({filtered.length})</span>
        <div className="flex items-center gap-2">
          {query && <span>Từ khóa: "{query}"</span>}
          {selectedGenre !== 'all' && <span>Thể loại: {selectedGenre}</span>}
        </div>
      </div>

      {/* Results List */}
      {isSearching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-3 sm:p-4 space-y-3.5 animate-pulse">
              <div className="aspect-[3/4] bg-slate-800/70 rounded-2xl w-full" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-800/70 rounded-md w-11/12" />
                <div className="h-3.5 bg-slate-800/50 rounded-md w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <p className="text-slate-400 text-sm">Không tìm thấy bộ truyện audio nào phù hợp với điều kiện tìm kiếm.</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa toàn bộ bộ lọc</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
};

