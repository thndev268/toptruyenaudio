import React, { useState } from 'react';
import {
  ShieldCheck,
  ThumbsUp,
  MessageCircle,
  Flag,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  CornerDownRight,
} from 'lucide-react';
import { StoryComment } from '../../types/reviews';

interface CommentCardProps {
  comment: StoryComment;
  currentUserId?: string | null;
  hasVotedHelpful?: boolean;
  onVoteHelpful: (commentId: string) => void;
  onEdit?: (comment: StoryComment) => void;
  onDelete?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  onReplyClick?: (commentId: string, userName: string) => void;
  isReply?: boolean;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUserId,
  hasVotedHelpful = false,
  onVoteHelpful,
  onEdit,
  onDelete,
  onReport,
  onReplyClick,
  isReply = false,
}) => {
  const [showSpoiler, setShowSpoiler] = useState<boolean>(!comment.hasSpoiler);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const isOwner = currentUserId && currentUserId === comment.userId;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 3600));
      const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));

      if (diffMins < 60) return `${Math.max(1, diffMins)} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 30) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 transition-all space-y-3 relative ${
        isReply
          ? 'bg-slate-950/90 border border-slate-800/80 ml-4 sm:ml-8 border-l-2 border-l-cyan-500/50'
          : 'bg-slate-900 border border-slate-800 hover:border-slate-750'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isReply && <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 hidden sm:block" />}

          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-cyan-400 text-xs">
            {comment.userAvatar ? (
              <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
            ) : (
              (comment.userName || '?').charAt(0).toUpperCase()
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white">{comment.userName || 'Người dùng'}</span>
              {comment.verifiedListener && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-full text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Xác thực</span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{formatDate(comment.createdAt)}</div>
          </div>
        </div>

        {/* Owner Dropdown Menu */}
        {isOwner && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="Tùy chọn bình luận"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-30 text-xs space-y-1 animate-fadeIn">
                {onEdit && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(comment);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <Edit2 className="w-3 h-3 text-cyan-400" /> Sửa
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(comment.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body Content & Spoiler Handling */}
      {comment.hasSpoiler && !showSpoiler ? (
        <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Nội dung bình luận chứa thông tin tiết lộ cốt truyện</span>
          </div>
          <button
            onClick={() => setShowSpoiler(true)}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[11px] rounded-lg border border-amber-500/40 inline-flex items-center gap-1 transition-all min-h-[32px]"
          >
            <Eye className="w-3 h-3" /> Hiển thị nội dung
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {comment.content}
          </p>

          {comment.hasSpoiler && showSpoiler && (
            <button
              onClick={() => setShowSpoiler(false)}
              className="text-[10px] text-amber-400/80 hover:text-amber-300 font-mono flex items-center gap-1 pt-1"
            >
              <EyeOff className="w-3 h-3" /> Ẩn tiết lộ
            </button>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[11px]">
        <div className="flex items-center gap-2">
          {/* Helpful Button */}
          <button
            onClick={() => onVoteHelpful(comment.id)}
            className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-all min-h-[32px] ${
              hasVotedHelpful
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
            aria-label={`Thích bình luận, ${comment.helpfulCount} lượt`}
          >
            <ThumbsUp className={`w-3 h-3 ${hasVotedHelpful ? 'fill-cyan-400 text-cyan-400' : ''}`} />
            <span>Thích ({comment.helpfulCount})</span>
          </button>

          {/* Reply Button (Only top level can be replied to in MVP single level) */}
          {!isReply && onReplyClick && (
            <button
              onClick={() => onReplyClick(comment.id, comment.userName)}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 font-semibold flex items-center gap-1 transition-all min-h-[32px]"
              aria-label={`Trả lời bình luận của ${comment.userName}`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>Trả lời</span>
            </button>
          )}
        </div>

        {/* Report Button */}
        {!isOwner && onReport && (
          <button
            onClick={() => onReport(comment.id)}
            className="text-slate-500 hover:text-rose-400 font-medium flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800"
            aria-label="Báo cáo bình luận này"
          >
            <Flag className="w-3 h-3" /> Báo cáo
          </button>
        )}
      </div>

      {/* Render 1-level replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              hasVotedHelpful={hasVotedHelpful}
              onVoteHelpful={onVoteHelpful}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
