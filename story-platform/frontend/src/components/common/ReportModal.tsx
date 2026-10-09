import React, { useState } from 'react';
import { Flag, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReportReason } from '../../types/reviews';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { motionTokens } from '../../config/motionTokens';

interface ReportModalProps {
  isOpen: boolean;
  targetType: 'Bình luận';
  onClose: () => void;
  onSubmitReport: (reason: ReportReason, details: string) => void;
}

const REPORT_REASONS: { id: ReportReason; label: string; desc: string }[] = [
  {
    id: 'SPOILER_UNFLAGGED',
    label: 'Tiết lộ cốt truyện không gắn nhãn',
    desc: 'Nội dung tiết lộ chi tiết truyện quan trọng nhưng không tích chọn Spoiler',
  },
  {
    id: 'OFFENSIVE_CONTENT',
    label: 'Ngôn từ xúc phạm, thiếu văn hóa',
    desc: 'Chứa nội dung công kích cá nhân, xúc phạm hoặc thô tục',
  },
  {
    id: 'SPAM',
    label: 'Spam hoặc Quảng cáo',
    desc: 'Lặp lại nhiều lần, chèn link độc hại hoặc quảng cáo ứng dụng khác',
  },
  {
    id: 'INCORRECT_INFO',
    label: 'Thông tin sai lệch',
    desc: 'Nội dung không đúng sự thật về tác giả, MC giọng đọc hoặc nội dung audio',
  },
  {
    id: 'OTHER',
    label: 'Lý do khác',
    desc: 'Các vi phạm tiêu chuẩn cộng đồng khác',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  targetType,
  onClose,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('SPOILER_UNFLAGGED');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useBodyScrollLock(isOpen);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedReason, details);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setDetails('');
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionTokens.duration.fast }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.entrance }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Flag className="w-5 h-5" />
                </div>
                <h3 id="report-modal-title" className="text-base font-bold text-white">
                  Báo cáo vi phạm {targetType}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Cảm ơn bạn đã gửi báo cáo!</h4>
                <p className="text-xs text-slate-400">Ban quản trị sẽ kiểm tra và xử lý vi phạm trong 24 giờ.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Chọn lý do báo cáo:</label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {REPORT_REASONS.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedReason === item.id
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={item.id}
                          checked={selectedReason === item.id}
                          onChange={() => setSelectedReason(item.id)}
                          className="mt-1 accent-amber-400"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-white">{item.label}</div>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Mô tả thêm (Không bắt buộc):</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Nhập thêm chi tiết dòng hoặc lý do vi phạm..."
                    rows={2}
                    maxLength={300}
                    className="w-full bg-slate-950 text-xs text-slate-100 placeholder-slate-500 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white min-h-[40px] transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 min-h-[40px] shadow-md transition-all active:scale-95"
                  >
                    Gửi Báo Cáo
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
