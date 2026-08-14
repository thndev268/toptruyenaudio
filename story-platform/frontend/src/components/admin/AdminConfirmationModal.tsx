import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Check, X, Loader2 } from 'lucide-react';
import { FocusTrap } from '../common/FocusTrap';

interface AdminConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  impactScope: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requiresReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
}

export const AdminConfirmationModal: React.FC<AdminConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  impactScope,
  confirmLabel = 'Xác Nhận Thực Hiện',
  cancelLabel = 'Hủy Thao Tác',
  variant = 'danger',
  requiresReason = true,
  reasonPlaceholder = 'Nhập lý do thực hiện thao tác quản trị này để lưu vào Nhật ký hoạt động (Audit Log)...',
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresReason && !reason.trim()) {
      setError('Vui lòng nhập lý do thực hiện thao tác để lưu vào hồ sơ kiểm toán.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setIsSubmitting(false);
      setReason('');
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError('Có lỗi xảy ra khi thực hiện thao tác. Vui lòng thử lại.');
    }
  };

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <FocusTrap
        isActive={isOpen}
        onEscape={onClose}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-scaleUp"
      >
        {/* Header */}
        <div
          className={`px-6 py-4.5 border-b flex items-center justify-between ${
            isDanger
              ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
              : isWarning
              ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
              : 'bg-cyan-950/40 border-cyan-800/50 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {isDanger ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="admin-confirm-title" className="text-base font-bold text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                Thao tác quản trị cấp cao bởi Chủ Sở Hữu (Owner Admin)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{description}</p>

          {/* Impact Scope Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Phạm vi ảnh hưởng trực tiếp:</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-cyan-300 pl-4 font-mono">
              {impactScope}
            </div>
          </div>

          {/* Reason Input */}
          {requiresReason && (
            <div className="space-y-1.5">
              <label
                htmlFor="admin-action-reason"
                className="block text-xs font-bold text-slate-300"
              >
                Lý do thực hiện <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="admin-action-reason"
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                placeholder={reasonPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Hành động này sẽ được ghi vào Nhật ký hoạt động (Audit Log)</span>
                <span>{reason.length} ký tự</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs sm:text-sm font-bold rounded-xl transition-all min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              {cancelLabel}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (requiresReason && !reason.trim())}
              className={`w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer ${
                isDanger
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  : isWarning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </FocusTrap>
    </div>
  );
};
