import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  EyeOff,
  Trash2,
  Pin,
  Star,
  ShieldAlert,
  Disc,
  AlertTriangle,
  Ban,
  CheckCircle,
  Plus,
  X,
  Settings,
} from 'lucide-react';
import { AdminCommentItem } from '../../../types/admin';
import { adminRepository } from '../../../services/repositories/AdminRepository';

interface CommentsScreenProps {
  comments: AdminCommentItem[];
  stories: any[];
  onHideComment: (comment: AdminCommentItem) => void;
  onDeleteComment: (comment: AdminCommentItem) => void;
  onFetchComments: (filters?: { status?: string; storyId?: string }) => void;
}

export const CommentsScreen: React.FC<CommentsScreenProps> = ({
  comments,
  stories,
  onHideComment,
  onDeleteComment,
  onFetchComments,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN' | 'FLAGGED'>('ALL');
  const [storyFilter, setStoryFilter] = useState<string>('ALL');
  const [showProfanitySettings, setShowProfanitySettings] = useState(false);
  const [profanityWords, setProfanityWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [openaiModerationEnabled, setOpenaiModerationEnabled] = useState(false);

  // Load profanity words when modal opens
  useEffect(() => {
    if (showProfanitySettings) {
      adminRepository.getProfanityWords().then(setProfanityWords).catch(console.error);
    }
  }, [showProfanitySettings]);

  const filtered = comments.filter((c) => {
    const matchSearch =
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      (c.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      c.storyTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchStory = storyFilter === 'ALL' || c.storyId === storyFilter;
    return matchSearch && matchStatus && matchStory;
  });

  // Group comments by story
  const commentsByStory = filtered.reduce((acc: Record<string, AdminCommentItem[]>, comment) => {
    if (!acc[comment.storyId]) {
      acc[comment.storyId] = [];
    }
    acc[comment.storyId].push(comment);
    return acc;
  }, {});

  const sortedStoryIds = Object.keys(commentsByStory).sort((a, b) => {
    const aStory = stories.find(s => s.id === a);
    const bStory = stories.find(s => s.id === b);
    return (aStory?.title || '').localeCompare(bStory?.title || '');
  });

  // Fetch comments when filters change
  React.useEffect(() => {
    const filters: any = {};
    if (statusFilter !== 'ALL') filters.status = statusFilter === 'ACTIVE' ? 'APPROVED' : statusFilter;
    if (storyFilter !== 'ALL') filters.storyId = storyFilter;
    onFetchComments(filters);
  }, [statusFilter, storyFilter]);

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

        <select
          value={storyFilter}
          onChange={(e) => setStoryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer sm:w-64"
        >
          <option value="ALL">Tất cả truyện</option>
          {stories?.map((story) => (
            <option key={story.id} value={story.id}>
              {story.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowProfanitySettings(true)}
          className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 min-h-[42px]"
        >
          <Settings className="w-4 h-4" />
          <span>Quản Lý Lọc Từ</span>
        </button>
      </div>

      {/* Profanity Filter Settings Modal */}
      {showProfanitySettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Quản Lý Lọc Từ Ngữ Không Phù Hợp</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thêm/xóa từ ngữ cần lọc trong bình luận
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfanitySettings(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Add new word */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
              <label className="text-xs font-bold text-slate-300 mb-2 block">Thêm từ ngữ mới</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Nhập từ ngữ cần lọc..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newWord.trim()) {
                      setProfanityWords([...profanityWords, newWord.trim()]);
                      setNewWord('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newWord.trim()) {
                      setProfanityWords([...profanityWords, newWord.trim()]);
                      setNewWord('');
                    }
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>

            {/* Current profanity words list */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-300">Danh sách từ ngữ đang lọc ({profanityWords.length})</label>
                {profanityWords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa tất cả từ ngữ lọc?')) {
                        setProfanityWords([]);
                      }
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              
              {profanityWords.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có từ ngữ nào trong danh sách lọc</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {profanityWords.map((word, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-white font-mono">{word}</span>
                      <button
                        type="button"
                        onClick={() => setProfanityWords(profanityWords.filter((_, i) => i !== index))}
                        className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors group"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning info */}
            <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200">
                  <p className="font-bold mb-1">Cảnh báo về hệ thống lọc:</p>
                  <ul className="space-y-1 list-disc list-inside text-slate-300">
                    <li>Lần 1: Cảnh báo, từ chối bình luận</li>
                    <li>Lần 2: Cảnh báo, từ chối bình luận</li>
                    <li>Lần 3: Block 1 giờ</li>
                    <li>Lần 5: Block 7 ngày</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* OpenAI Moderation Toggle */}
            <div className="mt-6 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">OpenAI Moderation AI</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Phát hiện nội dung không phù hợp thông minh hơn (xúc phạm, khiêu dâm, bạo lực)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenaiModerationEnabled(!openaiModerationEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    openaiModerationEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      openaiModerationEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowProfanitySettings(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    // Save all profanity words to backend
                    await Promise.all(profanityWords.map(word => adminRepository.addProfanityWord(word)));
                    setShowProfanitySettings(false);
                    alert('Đã lưu danh sách từ ngữ lọc thành công!');
                  } catch (error) {
                    console.error('Failed to save profanity words:', error);
                    alert('Có lỗi xảy ra khi lưu danh sách từ ngữ lọc. Vui lòng thử lại.');
                  }
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List - Grouped by Story */}
      <div className="space-y-4">
        {sortedStoryIds.map((storyId) => {
          const storyComments = commentsByStory[storyId];
          const story = stories.find(s => s.id === storyId);
          
          return (
            <div key={storyId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              {/* Story Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <Disc className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{story?.title || 'Unknown Story'}</h3>
                    <p className="text-[11px] text-slate-400">{storyComments.length} bình luận</p>
                  </div>
                </div>
              </div>

              {/* Comments for this story */}
              <div className="space-y-3">
                {storyComments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
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
                            {cmt.createdAt}
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

                    <p className="text-xs sm:text-sm text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-850 leading-relaxed">
                      {cmt.content}
                    </p>

                    <div className="flex items-center justify-between pt-1">
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
        })}
      </div>
    </div>
  );
};
