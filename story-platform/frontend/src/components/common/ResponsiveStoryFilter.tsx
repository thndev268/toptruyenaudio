import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Star, 
  Check,
  Headphones,
  Clock,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { useGenres } from '../../hooks/useGenres';
import { 
  FilterState, 
  DEFAULT_FILTERS, 
  countActiveAdvancedFilters 
} from '../../utils/searchHelpers';
import { ResponsiveFilter } from './filter/ResponsiveFilter';
import { FilterSection, FilterChip, SegmentedControl, FilterFooter } from './filter/FilterBase';
import { FilterActiveChips } from './filter/FilterActiveChips';

interface ResponsiveStoryFilterProps {
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
  onReset?: () => void;
  totalResultsCount?: number;
  title?: string;
  subtitle?: string;
  showCardWrapper?: boolean;
  className?: string;
  isSearching?: boolean;
}

export const ResponsiveStoryFilter: React.FC<ResponsiveStoryFilterProps> = ({
  filters,
  onFiltersChange,
  onReset,
  totalResultsCount,
  title = 'Bộ lọc truyện audio',
  subtitle = 'Tìm kiếm nhanh theo tên truyện, giọng đọc, thể loại, thời lượng và bản quyền',
  showCardWrapper = true,
  className = '',
  isSearching = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const genres = useGenres();
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [draft, setDraft] = useState<FilterState>(filters);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync draft when filter panel opens
  useEffect(() => {
    if (isModalOpen || isDesktopExpanded) {
      setDraft(filters);
    }
  }, [isModalOpen, isDesktopExpanded, filters]);

  // Focus and place cursor at the end of input if redirected from homepage with search query
  useEffect(() => {
    if (filters.q && searchInputRef.current) {
      const len = filters.q.length;
      searchInputRef.current.focus();
      searchInputRef.current.setSelectionRange(len, len);
    }
  }, []);

  const activeCount = countActiveAdvancedFilters(filters);
  const draftActiveCount = countActiveAdvancedFilters(draft);

  const handleApply = () => {
    onFiltersChange(draft);
    setIsModalOpen(false);
    setIsDesktopExpanded(false);
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_FILTERS, q: draft.q };
    setDraft(resetFilters);
  };

  const handleClearAll = () => {
    if (onReset) {
      onReset();
    } else {
      onFiltersChange(DEFAULT_FILTERS);
    }
  };

  const handleRemoveChip = (key: keyof FilterState) => {
    const updated = { ...filters, [key]: DEFAULT_FILTERS[key] };
    onFiltersChange(updated);
  };

  const isGenreMatch = (g: { name: string; slug?: string; id?: string }, currentGenre: string) => {
    return currentGenre === g.name || currentGenre === g.slug || currentGenre === g.id;
  };

  const handleToggleGenre = (genreName: string) => {
    setDraft(prev => ({
      ...prev,
      genre: isGenreMatch(genres.find(g => g.name === genreName || g.slug === genreName) || { name: genreName, slug: genreName, id: '' }, prev.genre) ? 'all' : genreName
    }));
  };

  const handleToggleGenreDesktop = (genreName: string) => {
    const updatedGenre = isGenreMatch(genres.find(g => g.name === genreName || g.slug === genreName) || { name: genreName, slug: genreName, id: '' }, filters.genre) ? 'all' : genreName;
    onFiltersChange({
      ...filters,
      genre: updatedGenre
    });
  };

  const handleToggleFilter = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopExpanded(!isDesktopExpanded);
    } else {
      setIsModalOpen(true);
    }
  };

  // Mobile drawer filter content (uses draft and Apply button)
  const FilterContent = (
    <>
      {/* Sections */}
      <FilterSection title="Thể loại" description="Lọc theo thể loại truyện ưa thích">
        {genres.map((g) => (
          <FilterChip
            key={g.id}
            label={g.name}
            selected={isGenreMatch(g, draft.genre)}
            onClick={() => handleToggleGenre(g.name)}
          />
        ))}
      </FilterSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <FilterSection title="Trạng thái">
          <SegmentedControl
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'Đang ra', value: 'ONGOING' },
              { label: 'Hoàn thành', value: 'COMPLETED' },
            ]}
            value={draft.status}
            onChange={(val) => setDraft(prev => ({ ...prev, status: val }))}
          />
        </FilterSection>

        <FilterSection title="Gói cước">
          <SegmentedControl
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'Miễn phí', value: 'FREE' },
              { label: 'Premium', value: 'PREMIUM' },
            ]}
            value={draft.access}
            onChange={(val) => setDraft(prev => ({ ...prev, access: val }))}
          />
        </FilterSection>
      </div>

      <FilterSection title="Thời lượng">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {[
            { label: 'Tất cả', value: 'all', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { label: 'Dưới 5h', value: 'under5', icon: <Zap className="w-3.5 h-3.5" /> },
            { label: '5 - 20h', value: '5to20', icon: <Headphones className="w-3.5 h-3.5" /> },
            { label: 'Trên 50h', value: 'over50', icon: <Clock className="w-3.5 h-3.5" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDraft(prev => ({ ...prev, duration: opt.value }))}
              className={`
                p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border
                ${draft.duration === opt.value
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'}
              `}
            >
              <div className={`p-2.5 rounded-xl ${draft.duration === opt.value ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-slate-950'}`}>
                {opt.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Sắp xếp theo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {[
            { label: 'Lượt nghe nhiều nhất', value: 'listens', icon: <Headphones className="w-4 h-4" /> },
            { label: 'Đang thịnh hành', value: 'trending', icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Mới cập nhật', value: 'newest', icon: <Sparkles className="w-4 h-4" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDraft(prev => ({ ...prev, sort: opt.value }))}
              className={`
                px-5 py-4 rounded-2xl flex items-center justify-between transition-all border
                ${draft.sort === opt.value
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={draft.sort === opt.value ? 'text-cyan-400' : 'text-slate-500'}>
                  {opt.icon}
                </span>
                <span className="text-[13px] font-bold">{opt.label}</span>
              </div>
              {draft.sort === opt.value && <Check className="w-4 h-4 text-cyan-400" />}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Advanced Input - Creator */}
      <FilterSection title="Người tạo / MC giọng đọc">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Nhập tên tác giả hoặc MC..."
            value={draft.creator}
            onChange={(e) => setDraft(prev => ({ ...prev, creator: e.target.value }))}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          />
          {draft.creator && (
            <button
              onClick={() => setDraft(prev => ({ ...prev, creator: '' }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </FilterSection>
    </>
  );

  // Desktop inline filter content (operates on active filters state and triggers onFiltersChange immediately)
  const DesktopFilterContent = (
    <>
      {/* Sections */}
      <FilterSection title="Thể loại" description="Lọc theo thể loại truyện ưa thích">
        {genres.map((g) => (
          <FilterChip
            key={g.id}
            label={g.name}
            selected={isGenreMatch(g, filters.genre)}
            onClick={() => handleToggleGenreDesktop(g.name)}
          />
        ))}
      </FilterSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <FilterSection title="Trạng thái">
          <SegmentedControl
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'Đang ra', value: 'ONGOING' },
              { label: 'Hoàn thành', value: 'COMPLETED' },
            ]}
            value={filters.status}
            onChange={(val) => onFiltersChange({ ...filters, status: val })}
          />
        </FilterSection>

        <FilterSection title="Gói cước">
          <SegmentedControl
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'Miễn phí', value: 'FREE' },
              { label: 'Premium', value: 'PREMIUM' },
            ]}
            value={filters.access}
            onChange={(val) => onFiltersChange({ ...filters, access: val })}
          />
        </FilterSection>
      </div>

      <FilterSection title="Thời lượng">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {[
            { label: 'Tất cả', value: 'all', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { label: 'Dưới 5h', value: 'under5', icon: <Zap className="w-3.5 h-3.5" /> },
            { label: '5 - 20h', value: '5to20', icon: <Headphones className="w-3.5 h-3.5" /> },
            { label: 'Trên 50h', value: 'over50', icon: <Clock className="w-3.5 h-3.5" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, duration: opt.value })}
              className={`
                p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border
                ${filters.duration === opt.value
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'}
              `}
            >
              <div className={`p-2.5 rounded-xl ${filters.duration === opt.value ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-slate-950'}`}>
                {opt.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Sắp xếp theo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {[
            { label: 'Lượt nghe nhiều nhất', value: 'listens', icon: <Headphones className="w-4 h-4" /> },
            { label: 'Đang thịnh hành', value: 'trending', icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Mới cập nhật', value: 'newest', icon: <Sparkles className="w-4 h-4" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, sort: opt.value })}
              className={`
                px-5 py-4 rounded-2xl flex items-center justify-between transition-all border
                ${filters.sort === opt.value
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={filters.sort === opt.value ? 'text-cyan-400' : 'text-slate-500'}>
                  {opt.icon}
                </span>
                <span className="text-[13px] font-bold">{opt.label}</span>
              </div>
              {filters.sort === opt.value && <Check className="w-4 h-4 text-cyan-400" />}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Advanced Input - Creator */}
      <FilterSection title="Người tạo / MC giọng đọc">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Nhập tên tác giả hoặc MC..."
            value={filters.creator}
            onChange={(e) => onFiltersChange({ ...filters, creator: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          />
          {filters.creator && (
            <button
              onClick={() => onFiltersChange({ ...filters, creator: '' })}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </FilterSection>
    </>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search & Trigger Bar */}
      <div className={`${showCardWrapper ? 'bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl' : ''} space-y-4`}>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1 group">
            {isSearching ? (
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            )}
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo tên truyện, tác giả hoặc MC..."
              value={filters.q}
              onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner"
            />
            {filters.q && (
              <button
                onClick={() => onFiltersChange({ ...filters, q: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Trigger */}
          <button
            onClick={handleToggleFilter}
            className={`
              px-4 sm:px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all border
              ${activeCount > 0 || isDesktopExpanded
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20' 
                : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:border-slate-600 hover:text-white'}
            `}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Bộ lọc</span>
            {activeCount > 0 && (
              <span className="bg-slate-950 text-cyan-400 px-2 py-0.5 rounded-lg text-[10px] font-black">
                {activeCount}
              </span>
            )}
            <ChevronDown className={`hidden lg:block w-3.5 h-3.5 transition-transform duration-300 ${isDesktopExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Quick Genre Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 overscroll-x-contain">
          <button
            onClick={() => onFiltersChange({ ...filters, genre: 'all' })}
            className={`
              px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap
              ${filters.genre === 'all'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600'}
            `}
          >
            Tất cả
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => onFiltersChange({ ...filters, genre: isGenreMatch(g, filters.genre) ? 'all' : g.name })}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 whitespace-nowrap
                ${isGenreMatch(g, filters.genre)
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-cyan-500/30'}
              `}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Active Filter Chips Row */}
        <FilterActiveChips 
          filters={filters} 
          onRemove={handleRemoveChip} 
          onClearAll={handleClearAll} 
        />

        {/* Inline Desktop Filter Panel */}
        <AnimatePresence>
          {isDesktopExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="hidden lg:block overflow-hidden"
            >
              <div className="pt-6 border-t border-slate-800 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-2 overscroll-contain">
                {DesktopFilterContent}
                
                <div className="sticky bottom-0 pt-6 pb-2 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setIsDesktopExpanded(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs hover:text-white transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Đặt lại tất cả
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile/Tablet Filter Modal */}
      <ResponsiveFilter
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        subtitle="Sử dụng bộ lọc để tìm được truyện nghe ưng ý nhất"
        activeCount={draftActiveCount}
        footer={
          <FilterFooter 
            onReset={handleReset} 
            onApply={handleApply} 
            appliedCount={draftActiveCount} 
          />
        }
      >
        {FilterContent}
      </ResponsiveFilter>
    </div>
  );
};
