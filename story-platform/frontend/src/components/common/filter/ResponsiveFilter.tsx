import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useBodyScrollLock } from '../../../hooks/useBodyScrollLock';
import { Portal } from './Portal';

interface ResponsiveFilterProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  activeCount?: number;
}

export const ResponsiveFilter: React.FC<ResponsiveFilterProps> = ({
  isOpen,
  onClose,
  title = "Bộ lọc",
  subtitle = "Tinh chỉnh kết quả theo nhu cầu của bạn",
  children,
  footer,
  activeCount = 0
}) => {
  useBodyScrollLock(isOpen);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Mobile/Tablet Bottom Sheet & Drawer */}
            <motion.section
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="
                relative w-full max-w-2xl bg-slate-900 
                rounded-t-[32px] md:rounded-[32px] 
                border-t md:border border-slate-800 
                flex flex-col max-h-[92dvh] md:max-h-[85vh]
                shadow-2xl
                md:m-4
                gpu-accelerated
              "
            >
              {/* Header */}
              <header className="px-6 pt-4 pb-4 shrink-0 flex flex-col items-center">
                <div className="w-12 h-1.5 rounded-full bg-slate-800 mb-6 md:hidden" />
                <div className="w-full flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                      <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                      <span>{title}</span>
                      {activeCount > 0 && (
                        <span className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-lg text-[10px] font-black">
                          {activeCount}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-11 h-11 rounded-2xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center border border-slate-700/50 cursor-pointer min-h-[44px]"
                    aria-label="Đóng bộ lọc"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </header>

              {/* Scrollable Content */}
              <div className="filter-scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-10 no-scrollbar mobile-optimized-scroll">
                {children}
              </div>

              {/* Footer */}
              {footer}
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
