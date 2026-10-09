import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, X, CornerDownRight } from 'lucide-react';

interface CommentFormProps {
  replyToName?: string | null;
  parentId?: string | null;
  editingCommentId?: string | null;
  initialContent?: string;
  initialHasSpoiler?: boolean;
  onCancelReplyOrEdit?: () => void;
  onSubmitComment: (data: {
    content: string;
    hasSpoiler: boolean;
    parentId?: string | null;
    editingCommentId?: string | null;
  }) => Promise<void>;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  replyToName,
  parentId,
  editingCommentId,
  initialContent = '',
  initialHasSpoiler = false,
  onCancelReplyOrEdit,
  onSubmitComment,
}) => {
  const [content, setContent] = useState<string>('');
  const [hasSpoiler, setHasSpoiler] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingCommentId) {
      setContent(initialContent);
      setHasSpoiler(initialHasSpoiler);
    } else if (replyToName) {
      setContent(`@${replyToName} `);
      setHasSpoiler(false);
    } else {
      setContent('');
      setHasSpoiler(false);
    }
  }, [editingCommentId, replyToName, initialContent, initialHasSpoiler]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      setErrorMessage('Nội dung bình luận không được để trống hoặc chỉ chứa khoảng trắng');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitComment({
        content: trimmed,
        hasSpoiler,
        parentId,
        editingCommentId,
      });

      setContent('');
      setHasSpoiler(false);
      if (onCancelReplyOrEdit) onCancelReplyOrEdit();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 w-full">
      {/* Target indicator banner if replying or editing */}
      {(replyToName || editingCommentId) && (
        <div className="flex items-center justify-between p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <CornerDownRight className="w-4 h-4 text-cyan-400" />
            <span>
              {editingCommentId
                ? 'Đang chỉnh sửa bình luận của bạn'
                : `Đang trả lời người nghe: @${replyToName}`}
            </span>
          </div>
          {onCancelReplyOrEdit && (
            <button
              type="button"
              onClick={onCancelReplyOrEdit}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              aria-label="Hủy"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-semibold text-white">Nội dung bình luận:</label>
            <span className="font-mono text-[11px] text-slate-500">{1000 - content.length} / 1000 ký tự</span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết bình luận hoặc ý kiến của bạn về tập audio này..."
            rows={3}
            maxLength={1000}
            className="w-full bg-slate-950 text-xs sm:text-sm text-slate-100 placeholder-slate-500 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition-colors resize-y min-h-[80px]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-2 text-xs text-amber-300 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasSpoiler}
              onChange={(e) => setHasSpoiler(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500 accent-cyan-500 cursor-pointer"
            />
            <span>Tiết lộ nội dung (Spoiler)</span>
          </label>

          <div className="flex items-center gap-2">
            {(replyToName || editingCommentId) && onCancelReplyOrEdit && (
              <button
                type="button"
                onClick={onCancelReplyOrEdit}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white min-h-[38px]"
              >
                Hủy
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || content.trim().length === 0}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 disabled:opacity-50 min-h-[38px] flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang gửi...' : editingCommentId ? 'Cập Nhật' : 'Gửi Bình Luận'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
