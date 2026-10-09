import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { useGenres } from '../../hooks/useGenres';
import {
  FilterState,
  DEFAULT_FILTERS,
  countActiveAdvancedFilters,
} from '../../utils/searchHelpers';
import { Portal } from '../common/filter/Portal';
import { FocusTrap } from '../common/FocusTrap';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const QuickStoryFilter: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterTriggerBtnRef = useRef<HTMLButtonElement | null>(null);
  const genres = useGenres();

  // Filter States
  const [filters, setFilters] = useState<FilterState>({
    q: searchParams.get('q') || '',
    genre: searchParams.get('genre') || 'all',
    status: searchParams.get('status') || 'all',
    access: searchParams.get('access') || 'all',
    duration: searchParams.get('duration') || 'all',
    creator: searchParams.get('creator') || '',
    sort: searchParams.get('sort') || 'listens',
  });

  // UI States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  // Use the robust scroll lock hook
  useBodyScrollLock(isDrawerOpen);

  // Synchronize state from URL
  useEffect(() => {
    const current: FilterState = {
      q: searchParams.get('q') || '',
      genre: searchParams.get('genre') || 'all',
      status: searchParams.get('status') || 'all',
      access: searchParams.get('access') || 'all',
      duration: searchParams.get('duration') || 'all',
      creator: searchParams.get('creator') || '',
      sort: searchParams.get('sort') || 'listens',
    };
    setFilters(current);
    setDraftFilters(current);
  }, [searchParams]);

  const activeCount = countActiveAdvancedFilters(filters);
  const draftActiveCount = countActiveAdvancedFilters(draftFilters);

  const applyParamsAndNavigate = (targetFilters: FilterState) => {
    const params = new URLSearchParams();
    if (targetFilters.q.trim()) params.set('q', targetFilters.q.trim());
    if (targetFilters.genre && targetFilters.genre !== 'all') params.set('genre', targetFilters.genre);
    if (targetFilters.status && targetFilters.status !== 'all') params.set('status', targetFilters.status);
    if (targetFilters.access && targetFilters.access !== 'all') params.set('access', targetFilters.access);
    if (targetFilters.duration && targetFilters.duration !== 'all') params.set('duration', targetFilters.duration);
    if (targetFilters.creator.trim()) params.set('creator', targetFilters.creator.trim());
    if (targetFilters.sort && targetFilters.sort !== 'listens') params.set('sort', targetFilters.sort);

    navigate(`/explore?${params.toString()}`);
  };

  const handleOpenDrawer = () => {
    setDraftFilters({ ...filters });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    if (filterTriggerBtnRef.current) {
      filterTriggerBtnRef.current.focus();
    }
  };

  const handleApplyDraft = () => {
    setFilters(draftFilters);
    setIsDrawerOpen(false);
    applyParamsAndNavigate(draftFilters);
    if (filterTriggerBtnRef.current) {
      filterTriggerBtnRef.current.focus();
    }
  };

  const handleResetDraft = () => {
    setDraftFilters({
      ...DEFAULT_FILTERS,
      q: draftFilters.q,
    });
  };

  const handleResetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
    setIsDrawerOpen(false);
    navigate('/explore');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyParamsAndNavigate(filters);
  };

  return (
    <>
      <style>{`
        .gradient-border-card {
          position: relative;
        }
        .gradient-border-card::before {
          content: '';
          position: absolute;
          width: 150%;
          height: 150%;
          background-image: linear-gradient(180deg, rgb(0, 183, 255), rgb(255, 48, 255));
          animation: rotBGimg 3s linear infinite;
          transition: all 0.2s linear;
          top: -25%;
          left: -25%;
        }
        @keyframes rotBGimg {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .gradient-border-card::after {
          content: '';
          position: absolute;
          background: #07182E;
          inset: 3px;
          border-radius: 20px;
        }
        .gradient-border-card > * {
          position: relative;
          z-index: 1;
        }
      `}</style>
      <div className="gradient-border-card bg-slate-900 rounded-3xl p-4 sm:p-5 lg:p-6 shadow-2xl relative overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Bộ Lọc Tối Ưu Truyện Audio</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">Tìm kiếm nhanh theo giọng đọc, thể loại, thời lượng và bản quyền</p>
          </div>
        </div>

        {(activeCount > 0 || filters.q.trim()) && (
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/80 transition-colors"
            aria-label="Xóa tất cả bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xóa bộ lọc</span>
            {activeCount > 0 && <span>({activeCount})</span>}
          </button>
        )}
      </div>

      {/* Main Search & Trigger Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 sm:gap-3" role="search">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên truyện, tác giả hoặc MC..."
            value={filters.q}
            onChange={(e) => {
              const updated = { ...filters, q: e.target.value };
              setFilters(updated);
              applyParamsAndNavigate(updated);
            }}
            className="w-full bg-slate-950 text-xs sm:text-sm text-slate-100 placeholder-slate-400 pl-10 pr-9 py-3 rounded-2xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 min-h-[46px] transition-colors"
            aria-label="Tìm kiếm truyện"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {filters.q && (
            <button
              type="button"
              onClick={() => {
                const updated = { ...filters, q: '' };
                setFilters(updated);
                applyParamsAndNavigate(updated);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-400 transition-colors"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile & Tablet "Bộ lọc" Trigger Button */}
        <button
          ref={filterTriggerBtnRef}
          type="button"
          onClick={handleOpenDrawer}
          aria-expanded={isDrawerOpen}
          aria-controls="home-story-filter-panel"
          aria-label="Mở bộ lọc truyện"
          className={`px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 min-h-[46px] border transition-all cursor-pointer ${
            activeCount > 0
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Bộ lọc</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-slate-950 text-cyan-300 font-mono text-[11px] flex items-center justify-center font-black">
              {activeCount}
            </span>
          )}
        </button>

        {/* Desktop More Filters Toggle */}
        <button
          type="button"
          onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
          aria-expanded={isDesktopExpanded}
          aria-label="Mở rộng bộ lọc nâng cao"
          className="hidden lg:flex items-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-2xl text-xs font-semibold min-h-[46px] transition-colors cursor-pointer"
        >
          <span>Nâng cao</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isDesktopExpanded ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </button>
      </form>

      {/* DESKTOP INLINE FILTER ROW (lg: and up) */}
      <div className="hidden lg:block space-y-3 pt-3">
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Genre Select */}
          <div className="col-span-3">
            <select
              value={filters.genre}
              onChange={(e) => {
                const updated = { ...filters, genre: e.target.value };
                setFilters(updated);
                applyParamsAndNavigate(updated);
              }}
              className="w-full bg-slate-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
              aria-label="Lọc theo thể loại"
            >
              <option value="all">Tất cả thể loại</option>
              {genres.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="col-span-3">
            <select
              value={filters.status}
              onChange={(e) => {
                const updated = { ...filters, status: e.target.value };
                setFilters(updated);
                applyParamsAndNavigate(updated);
              }}
              className="w-full bg-slate-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
              aria-label="Lọc theo trạng thái truyện"
            >
              <option value="all">Trạng thái truyện</option>
              <option value="ONGOING">Đang cập nhật</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PAUSED">Tạm dừng</option>
            </select>
          </div>

          {/* Access / Premium */}
          <div className="col-span-3">
            <select
              value={filters.access}
              onChange={(e) => {
                const updated = { ...filters, access: e.target.value };
                setFilters(updated);
                applyParamsAndNavigate(updated);
              }}
              className="w-full bg-slate-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
              aria-label="Lọc theo quyền truy cập"
            >
              <option value="all">Quyền truy cập</option>
              <option value="FREE">Miễn phí</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          {/* Sort Select */}
          <div className="col-span-3">
            <select
              value={filters.sort}
              onChange={(e) => {
                const updated = { ...filters, sort: e.target.value };
                setFilters(updated);
                applyParamsAndNavigate(updated);
              }}
              className="w-full bg-slate-950 text-xs text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
              aria-label="Sắp xếp theo"
            >
              <option value="listens">Nghe nhiều nhất</option>
              <option value="trending">Đang xu hướng</option>
              <option value="newest">Mới cập nhật</option>
              <option value="az">Tên A - Z</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row (Duration & Creator) */}
        {isDesktopExpanded && (
          <div className="grid grid-cols-12 gap-3 items-center pt-3 border-t border-slate-800/80 animate-fadeIn">
            <div className="col-span-4">
              <input
                type="text"
                placeholder="Tác giả / MC Giọng đọc..."
                value={filters.creator}
                onChange={(e) => {
                  const updated = { ...filters, creator: e.target.value };
                  setFilters(updated);
                  applyParamsAndNavigate(updated);
                }}
                className="w-full bg-slate-950 text-xs text-white placeholder-slate-400 px-3.5 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 min-h-[42px]"
                aria-label="Lọc theo tác giả hoặc MC"
              />
            </div>

            <div className="col-span-4">
              <select
                value={filters.duration}
                onChange={(e) => {
                  const updated = { ...filters, duration: e.target.value };
                  setFilters(updated);
                  applyParamsAndNavigate(updated);
                }}
                className="w-full bg-slate-950 text-xs text-white px-3.5 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
                aria-label="Lọc theo thời lượng"
              >
                <option value="all">Thời lượng tổng cộng</option>
                <option value="under5">Dưới 5 giờ</option>
                <option value="5to20">Từ 5 - 20 giờ</option>
                <option value="20to50">Từ 20 - 50 giờ</option>
                <option value="over50">Trên 50 giờ</option>
              </select>
            </div>

            <div className="col-span-4 flex items-center justify-end text-xs text-slate-400 gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hiển thị kết quả tối ưu dựa trên sở thích cá nhân</span>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE & TABLET LEFT-TO-RIGHT SLIDE DRAWER */}
      {isDrawerOpen && (
        <Portal>
          <div
            id="home-filter-panel"
            className="fixed inset-0 z-[150] flex justify-start"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-filter-modal-title"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
              onClick={handleCloseDrawer}
            />

            {/* Left-to-Right Drawer Container with FocusTrap */}
            <FocusTrap
              isActive={isDrawerOpen}
              onEscape={handleCloseDrawer}
              className="relative z-[151] w-full max-w-md sm:max-w-lg bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl h-full animate-slideInLeft"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 shrink-0 bg-slate-900">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="home-filter-modal-title" className="text-base font-bold text-white">
                      Bộ Lọc Lựa Chọn Truyện
                    </h3>
                    <p className="text-xs text-slate-400">Bộ lọc trượt trái - Tìm kiếm nhanh tác phẩm audio</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-750 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Đóng bộ lọc"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="filter-scroll-area px-6 py-6 space-y-4.5 text-xs font-medium pb-28 no-scrollbar">
                {/* Keyword */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Từ khóa / Tên truyện</label>
                  <input
                    type="text"
                    placeholder="Nhập tên truyện, tác giả..."
                    value={draftFilters.q}
                    onChange={(e) => setDraftFilters({ ...draftFilters, q: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  />
                </div>

                {/* Genre */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Thể loại truyện</label>
                  <select
                    value={draftFilters.genre}
                    onChange={(e) => setDraftFilters({ ...draftFilters, genre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer min-h-[44px]"
                  >
                    <option value="all">Tất cả thể loại</option>
                    {genres.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Trạng thái cập nhật</label>
                  <select
                    value={draftFilters.status}
                    onChange={(e) => setDraftFilters({ ...draftFilters, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer min-h-[44px]"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="ONGOING">Đang cập nhật</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="PAUSED">Tạm dừng</option>
                  </select>
                </div>

                {/* Access */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Phân loại truy cập</label>
                  <select
                    value={draftFilters.access}
                    onChange={(e) => setDraftFilters({ ...draftFilters, access: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer min-h-[44px]"
                  >
                    <option value="all">Tất cả</option>
                    <option value="FREE">Miễn phí</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Thời lượng audio</label>
                  <select
                    value={draftFilters.duration}
                    onChange={(e) => setDraftFilters({ ...draftFilters, duration: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer min-h-[44px]"
                  >
                    <option value="all">Tất cả thời lượng</option>
                    <option value="under5">Dưới 5 giờ</option>
                    <option value="5to20">Từ 5 - 20 giờ</option>
                    <option value="20to50">Từ 20 - 50 giờ</option>
                    <option value="over50">Trên 50 giờ</option>
                  </select>
                </div>

                {/* Creator */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Tác giả / MC Giọng đọc</label>
                  <input
                    type="text"
                    placeholder="Nhập tên MC hoặc tác giả..."
                    value={draftFilters.creator}
                    onChange={(e) => setDraftFilters({ ...draftFilters, creator: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  />
                </div>

                {/* Sort */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold block">Sắp xếp theo</label>
                  <select
                    value={draftFilters.sort}
                    onChange={(e) => setDraftFilters({ ...draftFilters, sort: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer min-h-[44px]"
                  >
                    <option value="listens">Nghe nhiều nhất</option>
                    <option value="trending">Đang xu hướng</option>
                    <option value="newest">Mới cập nhật</option>
                    <option value="az">Tên A - Z</option>
                  </select>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900 grid grid-cols-2 gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDraft}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-colors min-h-[46px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyDraft}
                  className="py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 min-h-[46px] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp dụng {draftActiveCount > 0 ? `(${draftActiveCount})` : ''}</span>
                </button>
              </div>
            </FocusTrap>
          </div>
        </Portal>
      )}
      </div>
    </>
  );
};

