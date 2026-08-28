import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  EyeOff,
  Trash2,
  Pin,
  Star,
  ShieldAlert,
} from 'lucide-react';
import { AdminCommentItem } from '../../../types/admin';

interface CommentsScreenProps {
  comments: AdminCommentItem[];
  onHideComment: (comment: AdminCommentItem) => void;
  onDeleteComment: (comment: AdminCommentItem) => void;
}

export const CommentsScreen: React.FC<CommentsScreenProps> = ({
  comments,
  onHideComment,
  onDeleteComment,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN' | 'FLAGGED'>('ALL');

  const filtered = comments.filter((c) => {
    const matchSearch =
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      (c.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      c.storyTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Kiểm Duyệt Tương Tác
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Bình Luận & Đánh Giá Người Nghe
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Xử lý các bình luận phản cảm, spam đường dẫn độc hại và ghim nhận xét chất lượng
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700">
          {filtered.length} bình luận
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo nội dung, người bình luận, tên truyện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[42px]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer sm:w-48"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Bình thường</option>
          <option value="FLAGGED">Có cảnh báo / Spam</option>
          <option value="HIDDEN">Đã ẩn khỏi giao diện</option>
        </select>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {filtered.map((cmt) => (
          <div
            key={cmt.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                  {(cmt.userName || '?').charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <span>{cmt.userName}</span>
                    {cmt.isPinned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5" />
                        <span>Ghim</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Bình luận trên: <span className="text-cyan-300 font-medium">{cmt.storyTitle}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  title={
                    cmt.status === 'ACTIVE'
                      ? 'Bình luận đang hiển thị công khai'
                      : cmt.status === 'FLAGGED'
                      ? 'Bình luận bị gắn cờ vi phạm / spam'
                      : 'Bình luận đã bị ẩn'
                  }
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                    cmt.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : cmt.status === 'FLAGGED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                  <span>
                    {cmt.status === 'ACTIVE'
                      ? 'Hiển thị'
                      : cmt.status === 'FLAGGED'
                      ? 'Bị báo cáo'
                      : 'Đã ẩn'}
                  </span>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-850 leading-relaxed">
              {cmt.content}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 font-mono">{cmt.createdAt}</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onHideComment(cmt)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{cmt.status === 'HIDDEN' ? 'Bỏ Ẩn' : 'Ẩn Bình Luận'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteComment(cmt)}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Vĩnh Viễn</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
