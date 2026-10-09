import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Portal } from './filter/Portal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  title = 'Trải nghiệm Premium',
  message = 'Tập audio này chỉ dành cho thành viên Premium. Nâng cấp ngay để mở khóa toàn bộ kho truyện!',
}) => {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleUpgrade = () => {
    navigate('/premium');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const benefits = [
    'Nghe toàn bộ kho truyện Premium',
    'Chất lượng âm thanh 320kbps (HQ)',
    'Không quảng cáo làm phiền',
    'Hỗ trợ tải xuống nghe offline',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50"
            onClick={handleBackdropClick}
            role="presentation"
          >
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-slate-900 border border-amber-500/20 rounded-[32px] shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)] overflow-hidden focus:outline-none max-h-[calc(100dvh-2rem)] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="premium-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -mr-32 -mt-32" />
              
              {/* Header */}
              <div className="relative px-8 pt-8 flex items-start justify-between shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-8 h-8 text-slate-950" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  aria-label="Đóng"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="relative px-8 pt-6 pb-10 space-y-8 overflow-y-auto overscroll-contain flex-1 min-h-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-[0.2em]">
                    <Sparkles className="w-4 h-4" />
                    <span>Hội viên đặc quyền</span>
                  </div>
                  <h3 id="premium-modal-title" className="text-3xl font-black text-white tracking-tight leading-tight">
                    {title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                    {message}
                  </p>
                </div>

                {/* Benefits List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 text-slate-300 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleUpgrade}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] min-h-[52px]"
                  >
                    <Crown className="w-5 h-5" />
                    <span>Nâng Cấp Ngay</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700 active:scale-[0.98] min-h-[52px]"
                  >
                    Để Sau
                  </button>
                </div>
              </div>

              {/* Price Note */}
              <div className="relative px-8 py-4 bg-slate-950/80 border-t border-slate-800/50 flex items-center justify-center gap-2 shrink-0">
                <p className="text-[11px] text-slate-500 font-medium">
                  Chỉ từ <span className="text-amber-400 font-black">2.000đ/ngày</span>. Hủy bất kỳ lúc nào.
                </p>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
};
