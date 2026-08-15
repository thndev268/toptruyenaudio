import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Disc,
  Search,
  Crown,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  Star,
  Headphones,
  SlidersHorizontal,
  RotateCcw,
  Video,
  Sparkles
} from 'lucide-react';
import { AdminStoryItem } from '../../../types/admin';
import { AdminFilterPanel, AdminFilterItem } from '../common/AdminFilterPanel';
import { AdminIframePreviewModal } from '../common/AdminIframePreviewModal';

interface StoriesScreenProps {
  stories: AdminStoryItem[];
  onManageStory: (story: AdminStoryItem) => void;
  onUpdatePublishStatus: (story: AdminStoryItem, newStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED') => void;
  onUpdateAccessLevel: (story: AdminStoryItem, newAccess: 'FREE' | 'PREMIUM') => void;
  onDeleteStory: (story: AdminStoryItem) => void;
  onOpenVideoModal?: () => void;
}

export const StoriesScreen: React.FC<StoriesScreenProps> = ({
  stories,
  onManageStory,
  onUpdatePublishStatus,
  onUpdateAccessLevel,
  onDeleteStory,
  onOpenVideoModal,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING' | 'DRAFT'>('ALL');
  const [accessFilter, setAccessFilter] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [previewIframe, setPreviewIframe] = useState<string | null>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (accessFilter !== 'ALL') count++;
    return count;
  }, [statusFilter, accessFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setAccessFilter('ALL');
  };

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.authorName.toLowerCase().includes(search.toLowerCase()) ||
        s.narratorName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || s.publishStatus === statusFilter;
      const matchAccess = accessFilter === 'ALL' || s.accessLevel === accessFilter;
      return matchSearch && matchStatus && matchAccess;
    });
  }, [stories, search, statusFilter, accessFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <Disc className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Kho Dữ Liệu Audio & Video
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Quản Trị Truyện Audio & Video Toàn Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Quản lý quyền truy cập gói cước, trạng thái xuất bản, tệp audio và mã iframe video
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenVideoModal && (
            <button
              onClick={onOpenVideoModal}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Nhập Video Iframe AI
            </button>
          )}

          <span className="px-3 py-2 rounded-xl bg-slate-950 text-cyan-400 text-xs font-mono font-bold border border-slate-800">
            {filtered.length} / {stories.length} bộ truyện
          </span>
        </div>
      </div>

      {/* Admin Filter Panel */}
      <AdminFilterPanel
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo tên truyện, tác giả, MC giọng đọc..."
        isExpanded={isFilterVisible}
        onToggleExpand={() => setIsFilterVisible(!isFilterVisible)}
        onReset={handleResetFilters}
        activeCount={activeFilterCount}
      >
        <AdminFilterItem label="Trạng thái xuất bản">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đang phát hành công khai</option>
            <option value="DRAFT">Bản nháp / Chưa duyệt</option>
            <option value="PENDING">Chờ thẩm định</option>
          </select>
        </AdminFilterItem>

        <AdminFilterItem label="Gói truy cập">
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
          >
            <option value="ALL">Tất cả gói cước</option>
            <option value="FREE">Miễn phí toàn bộ</option>
            <option value="PREMIUM">Yêu cầu gói Premium</option>
          </select>
        </AdminFilterItem>
      </AdminFilterPanel>

      {/* Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((story) => (
          <div key={story.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group shadow-lg hover:shadow-cyan-500/5 transition-all">
            <div className="relative aspect-video overflow-hidden">
              <img loading="lazy" src={story.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-slate-800" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute top-2 right-2">
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg ${
                  story.publishStatus === 'PUBLISHED' ? 'bg-emerald-500 text-slate-950' :
                  story.publishStatus === 'DRAFT' ? 'bg-slate-800 text-slate-400' :
                  'bg-amber-500 text-slate-950'
                }`}>
                  {story.publishStatus === 'PUBLISHED' ? 'Đã duyệt' :
                   story.publishStatus === 'DRAFT' ? 'Bản nháp' : 'Chờ duyệt'}
                </div>
              </div>
              <div className="absolute bottom-2 left-2 flex gap-1">
                {story.accessLevel === 'PREMIUM' && (
                  <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg shadow-lg">
                    <Crown className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                  {story.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {story.authorName} • {story.narratorName}
                </p>
                {story.genres && story.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {story.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md border border-slate-700"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400">
                <div className="flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-cyan-400" />
                  {story.listenCount.toLocaleString()} lượt nghe
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  {story.rating} / 5.0
                </div>
              </div>

              <div className="pt-3 mt-auto border-t border-slate-800 flex items-center justify-between gap-2">
                {(story.isVideoStory || story.iframeCode || story.iframeUrl) && (
                  <button
                    onClick={() => setPreviewIframe(story.iframeCode || story.iframeUrl || '')}
                    className="py-2 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Xem Demo Video Iframe"
                  >
                    <Video className="w-3.5 h-3.5" /> Demo
                  </button>
                )}
                <button
                  onClick={() => onManageStory(story)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Chi tiết
                </button>
                <button
                  onClick={() => onDeleteStory(story)}
                  className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  title="Xóa truyện"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminIframePreviewModal
        isOpen={Boolean(previewIframe)}
        onClose={() => setPreviewIframe(null)}
        iframeCodeOrUrl={previewIframe || ''}
      />
    </div>
  );
};
