import React, { useState, useMemo } from 'react';
import { MessageSquare, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { StoryComment, CommentFilterOption } from '../../types/reviews';
import { CommentCard } from './CommentCard';
import { CommentForm } from './CommentForm';

interface CommentSectionProps {
  comments: StoryComment[];
  currentUserId?: string | null;
  currentUserName?: string | null;
  currentUserAvatar?: string;
  isEligible: boolean;
  votedCommentIds: string[];
  isLoading?: boolean;
  onAddComment: (content: string, hasSpoiler: boolean, parentId?: string | null) => Promise<void>;
  onEditComment: (commentId: string, content: string, hasSpoiler?: boolean) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onVoteHelpful: (commentId: string) => Promise<void>;
  onReportComment: (commentId: string) => void;
}

const COMMENTS_PER_PAGE = 5;

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  currentUserId,
  votedCommentIds,
  isLoading = false,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onVoteHelpful,
  onReportComment,
}) => {
  const [filterOption, setFilterOption] = useState<CommentFilterOption>('ALL');
  const [visibleCount, setVisibleCount] = useState<number>(COMMENTS_PER_PAGE);

  // Active reply target state
  const [replyTarget, setReplyTarget] = useState<{ parentId: string; userName: string } | null>(null);

  // Active edit target state
  const [editingComment, setEditingComment] = useState<StoryComment | null>(null);

  const filteredComments = useMemo(() => {
    const commentsArray = Array.isArray(comments) ? comments : [];
    let list = [...commentsArray];

    if (filterOption === 'VERIFIED_ONLY') {
      list = list.filter((c) => c.verifiedListener);
    }

    list.sort((a, b) => {
      switch (filterOption) {
        case 'HELPFUL':
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        case 'NEWEST':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'VERIFIED_ONLY':
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        case 'ALL':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [comments, filterOption]);

  const displayedComments = filteredComments.slice(0, visibleCount);

  const handleFormSubmit = async (data: {
    content: string;
    hasSpoiler: boolean;
    parentId?: string | null;
    editingCommentId?: string | null;
  }) => {
    if (data.editingCommentId) {
      await onEditComment(data.editingCommentId, data.content, data.hasSpoiler);
      setEditingComment(null);
    } else {
      await onAddComment(data.content, data.hasSpoiler, data.parentId);
      setReplyTarget(null);
    }
  };

  const handleReplyClick = (commentId: string, userName: string) => {
    setEditingComment(null);
    setReplyTarget({ parentId: commentId, userName });
    // Scroll smoothly to comment form area
    const formElement = document.getElementById('comment-form-anchor');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleEditClick = (comment: StoryComment) => {
    setReplyTarget(null);
    setEditingComment(comment);
    const formElement = document.getElementById('comment-form-anchor');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-xl space-y-6 w-full">
      {/* Title Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <span>Bình Luận Người Nghe ({comments.length})</span>
        </h3>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'NEWEST', label: 'Mới nhất' },
              { id: 'HELPFUL', label: 'Hữu ích' },
              { id: 'VERIFIED_ONLY', label: 'Người nghe xác thực' },
            ] as { id: CommentFilterOption; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterOption(tab.id);
                setVisibleCount(COMMENTS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[34px] ${
                filterOption === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Anchor for form scrolling */}
      <div id="comment-form-anchor" />

      {/* Comment Form */}
      <CommentForm
        replyToName={replyTarget?.userName}
        parentId={replyTarget?.parentId}
        editingCommentId={editingComment?.id}
        initialContent={editingComment?.content || ''}
        initialHasSpoiler={editingComment?.hasSpoiler || false}
        onCancelReplyOrEdit={() => {
          setReplyTarget(null);
          setEditingComment(null);
        }}
        onSubmitComment={handleFormSubmit}
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2 text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
          <p>Đang tải danh sách bình luận...</p>
        </div>
      ) : displayedComments.length === 0 ? (
        /* Empty State */
        <div className="py-10 text-center space-y-2 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-300">Chưa có bình luận nào phù hợp bộ lọc này.</p>
          <p className="text-[11px] text-slate-500">Hãy là người đầu tiên gửi bình luận để thảo luận về câu chuyện!</p>
        </div>
      ) : (
        /* Comments List */
        <div className="space-y-4">
          {displayedComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              hasVotedHelpful={votedCommentIds.includes(comment.id)}
              onVoteHelpful={onVoteHelpful}
              onEdit={handleEditClick}
              onDelete={onDeleteComment}
              onReport={onReportComment}
              onReplyClick={handleReplyClick}
            />
          ))}

          {/* Load More Button */}
          {visibleCount < filteredComments.length && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + COMMENTS_PER_PAGE)}
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-all min-h-[44px]"
              >
                <span>Xem thêm bình luận ({filteredComments.length - visibleCount})</span>
                <ChevronDown className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
