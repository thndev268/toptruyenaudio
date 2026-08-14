import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, X, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Portal } from './filter/Portal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  title = 'Yêu cầu đăng nhập',
  message = 'Bạn cần đăng nhập hoặc đăng ký tài khoản để sử dụng tính năng này.',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);

  // Focus trap and escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Focus the modal for accessibility
      modalRef.current?.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleLogin = () => {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?returnTo=${returnTo}`);
    onClose();
  };

  const handleRegister = () => {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    navigate(`/register?returnTo=${returnTo}`);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden focus:outline-none max-h-[calc(100dvh-2rem)] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-6 flex items-start justify-between shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pt-4 pb-8 space-y-6 overflow-y-auto overscroll-contain flex-1 min-h-0">
                <div className="space-y-2">
                  <h3 id="auth-modal-title" className="text-xl font-black text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleLogin}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] min-h-[44px]"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Đăng Nhập</span>
                  </button>
                  <button
                    onClick={handleRegister}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700 active:scale-[0.98] min-h-[44px]"
                  >
                    <UserPlus className="w-5 h-5 text-cyan-400" />
                    <span>Đăng Ký</span>
                  </button>
                </div>
              </div>

              {/* Subtle Footer */}
              <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800/50 text-center shrink-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Trải nghiệm nghe truyện audio tốt nhất
                </p>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
};
