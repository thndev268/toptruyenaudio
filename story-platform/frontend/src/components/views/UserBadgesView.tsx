import React, { useState, useEffect, useMemo } from 'react';
import { Award, Search, Filter, ArrowUpDown, Star, Shield, Lock, Eye, EyeOff, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { badgeRepository } from '../../services/repositories/BadgeRepository';
import { UserBadgeAssignment, BadgeLevel } from '../../types/badges';
import { UserBadgeCard } from '../badges/UserBadgeCard';

type SortOption = 'NEWEST' | 'OLDEST' | 'LEVEL_DESC' | 'NAME_ASC';

const LEVEL_WEIGHT: Record<BadgeLevel, number> = {
  LEGENDARY: 4,
  EPIC: 3,
  RARE: 2,
  COMMON: 1,
};

export const UserBadgesView: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<UserBadgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<BadgeLevel | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');

  const loadUserBadges = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await badgeRepository.getUserBadges(user.id);
      setAssignments(data);
    } catch (e) {
      console.error('[UserBadgesView] Failed to load badges:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserBadges();
  }, [user?.id]);

  const handleToggleVisibility = async (assignmentId: string, currentVisibility: 'PUBLIC' | 'PRIVATE') => {
    const newVisibility = currentVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      await badgeRepository.updateVisibility(assignmentId, newVisibility);
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, visibility: newVisibility } : a))
      );
    } catch (e) {
      console.error('Failed to update visibility:', e);
    }
  };

  const handleToggleFeatured = async (assignmentId: string, currentFeatured: boolean) => {
    if (!user?.id) return;
    const targetAssignmentId = currentFeatured ? null : assignmentId;
    try {
      await badgeRepository.setFeaturedBadge(user.id, targetAssignmentId);
      setAssignments((prev) =>
        prev.map((a) => ({
          ...a,
          isFeatured: a.id === assignmentId ? !currentFeatured : false,
        }))
      );
    } catch (e) {
      console.error('Failed to set featured badge:', e);
    }
  };

  // Filtered & Sorted Badges
  const filteredBadges = useMemo(() => {
    return assignments.filter((a) => {
      const badge = a.badge;
      if (!badge) return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = badge.name.toLowerCase().includes(query);
        const matchesDesc = badge.description.toLowerCase().includes(query);
        const matchesCode = badge.code.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCode) return false;
      }

      // Level match
      if (selectedLevel !== 'ALL' && badge.level !== selectedLevel) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
      }
      if (sortBy === 'LEVEL_DESC') {
        const weightA = LEVEL_WEIGHT[a.badge?.level || 'COMMON'];
        const weightB = LEVEL_WEIGHT[b.badge?.level || 'COMMON'];
        if (weightB !== weightA) return weightB - weightA;
        return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      }
      if (sortBy === 'NAME_ASC') {
        return (a.badge?.name || '').localeCompare(b.badge?.name || '', 'vi');
      }
      return 0;
    });
  }, [assignments, searchQuery, selectedLevel, sortBy]);

  const featuredAssignment = useMemo(() => {
    return assignments.find((a) => a.isFeatured);
  }, [assignments]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-100">
              <Sparkles className="w-4 h-4" />
              <span>Hệ Thống Vinh Danh & Thành Tích</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Danh Hiệu Của Bạn
            </h1>

            <p className="text-amber-100 text-sm md:text-base max-w-xl leading-relaxed">
              Thu thập các danh hiệu vinh danh độc quyền thông qua quá trình thưởng thức audio, đóng góp cộng đồng và sự kiện đặc biệt.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-6 self-start md:self-auto shrink-0">
            <div className="text-center px-2">
              <div className="text-3xl font-black text-white">{assignments.length}</div>
              <div className="text-xs text-amber-100 font-medium uppercase mt-0.5">Đã đạt được</div>
            </div>

            <div className="h-10 w-px bg-white/20" />

            <div className="text-center px-2">
              <div className="text-3xl font-black text-amber-200">
                {assignments.filter((a) => a.badge?.level === 'LEGENDARY' || a.badge?.level === 'EPIC').length}
              </div>
              <div className="text-xs text-amber-100 font-medium uppercase mt-0.5">Epic / Huyền thoại</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Badge Spotlight */}
      {featuredAssignment?.badge && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-6 dark:bg-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-4">
            <Star className="w-4 h-4 fill-current text-amber-500" />
            <span>Danh Hiệu Nổi Bật Đang Hiển Thị Trên Hồ Sơ</span>
          </div>

          <div className="max-w-md">
            <UserBadgeCard
              assignment={featuredAssignment}
              onToggleVisibility={handleToggleVisibility}
              onToggleFeatured={handleToggleFeatured}
              isOwner={true}
            />
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm danh hiệu theo tên, mô tả..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Level Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const).map((lvl) => {
            const labels: Record<string, string> = {
              ALL: 'Tất cả',
              COMMON: 'THÔNG THƯỜNG',
              RARE: 'HIẾM',
              EPIC: 'KINH ĐIỂN',
              LEGENDARY: 'HUYỀN THOẠI',
            };
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {labels[lvl]}
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="NEWEST">Mới nhận nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="LEVEL_DESC">Cấp độ cao nhất</option>
            <option value="NAME_ASC">Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <span>Đang tải danh sách danh hiệu...</span>
        </div>
      ) : filteredBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map((assignment) => (
            <UserBadgeCard
              key={assignment.id}
              assignment={assignment}
              onToggleVisibility={handleToggleVisibility}
              onToggleFeatured={handleToggleFeatured}
              isOwner={true}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
          <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 inline-block">
            <Award className="w-12 h-12" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {assignments.length === 0 ? 'Bạn chưa nhận được danh hiệu nào' : 'Không tìm thấy danh hiệu phù hợp'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {assignments.length === 0
                ? 'Hãy tích cực thưởng thức truyện audio và tương tác với cộng đồng để mở khóa những danh hiệu đầu tiên!'
                : 'Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ lọc cấp độ để xem thêm kết quả.'}
            </p>
          </div>

          {(searchQuery || selectedLevel !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('ALL');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
};
