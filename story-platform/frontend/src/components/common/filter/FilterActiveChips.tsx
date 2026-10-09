import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { FilterState } from '../../../utils/searchHelpers';

interface FilterActiveChipsProps {
  filters: FilterState;
  onRemove: (key: keyof FilterState) => void;
  onClearAll: () => void;
}

export const FilterActiveChips: React.FC<FilterActiveChipsProps> = ({
  filters,
  onRemove,
  onClearAll,
}) => {
  const getStatusLabel = (status: string) => {
    if (status === 'ONGOING') return 'Đang cập nhật';
    if (status === 'COMPLETED') return 'Hoàn thành';
    return status;
  };

  const getDurationLabel = (duration: string) => {
    if (duration === 'under5') return 'Dưới 5h';
    if (duration === '5to20') return '5-20h';
    if (duration === '20to50') return '20-50h';
    if (duration === 'over50') return 'Trên 50h';
    return duration;
  };

  const getSortLabel = (sort: string) => {
    if (sort === 'trending') return 'Xu hướng';
    if (sort === 'newest') return 'Mới nhất';
    if (sort === 'az') return 'Tên A-Z';
    return 'Lượt nghe';
  };

  const activeFilters: { key: keyof FilterState; label: string; value: string }[] = [];

  if (filters.genre && filters.genre !== 'all') {
    activeFilters.push({ key: 'genre', label: 'Thể loại', value: filters.genre });
  }
  if (filters.status && filters.status !== 'all') {
    activeFilters.push({ key: 'status', label: 'Trạng thái', value: getStatusLabel(filters.status) });
  }
  if (filters.access && filters.access !== 'all') {
    activeFilters.push({ key: 'access', label: 'Gói cước', value: filters.access === 'FREE' ? 'Miễn phí' : 'Premium' });
  }
  if (filters.duration && filters.duration !== 'all') {
    activeFilters.push({ key: 'duration', label: 'Thời lượng', value: getDurationLabel(filters.duration) });
  }
  if (filters.creator && filters.creator.trim()) {
    activeFilters.push({ key: 'creator', label: 'Tác giả/MC', value: filters.creator.trim() });
  }
  if (filters.sort && filters.sort !== 'listens') {
    activeFilters.push({ key: 'sort', label: 'Sắp xếp', value: getSortLabel(filters.sort) });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 overscroll-x-contain">
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 text-[11px] font-bold border border-rose-500/20 hover:bg-rose-500/20 transition-all shrink-0 whitespace-nowrap"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Xóa hết</span>
        </button>
        <div className="w-px h-4 bg-slate-800 mx-1 shrink-0" />
      </div>
      
      {activeFilters.map((f) => (
        <div
          key={f.key}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-200 text-[11px] font-bold border border-slate-700/50 shrink-0 whitespace-nowrap hover:border-slate-600 transition-all group"
        >
          <span className="text-slate-500 font-medium">{f.label}:</span>
          <span>{f.value}</span>
          <button
            onClick={() => onRemove(f.key)}
            className="p-0.5 rounded-md hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-all"
            aria-label={`Xóa lọc ${f.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <div className="w-8 shrink-0 md:hidden" /> {/* Padding at end for mobile scroll */}
    </div>
  );
};
