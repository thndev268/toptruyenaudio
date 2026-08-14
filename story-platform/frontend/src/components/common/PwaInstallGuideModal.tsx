import React, { useEffect, useRef } from 'react';
import { PlusSquare, X, Share, MoreVertical, Download, Smartphone, Monitor } from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';

interface PwaInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallGuideModal: React.FC<PwaInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isIos, isAndroid } = usePwaInstall();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(modalRef.current.querySelectorAll(focusableSelector)) as HTMLElement[];
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    } else {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine platform specific content
  const title = isIos ? 'Cài đặt trên iOS (Safari)' : isAndroid ? 'Cài đặt trên Android (Chrome)' : 'Cài đặt ứng dụng';
  const deviceIcon = isIos ? <Smartphone className="w-7 h-7" /> : <Monitor className="w-7 h-7" />;
  const guideImage = isIos 
    ? '/src/assets/images/ios_pwa_guide_1786685287202.jpg' 
    : '/src/assets/images/android_pwa_guide_1786685302009.jpg';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Hướng dẫn cài đặt ứng dụng trên ${isIos ? 'iOS' : 'Android'}`}
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col animate-scaleUp"
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer backdrop-blur-sm"
          aria-label="Đóng bảng hướng dẫn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 no-scrollbar">
          {/* Header */}
          <div className="space-y-2 text-center pt-2">
            <div className="inline-flex p-3.5 bg-cyan-500/10 dark:bg-cyan-950/30 rounded-2xl text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              {deviceIcon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 px-4 leading-relaxed">
              {isIos 
                ? 'Làm theo hướng dẫn bên dưới để thêm ứng dụng vào màn hình chính từ trình duyệt Safari.' 
                : 'Làm theo hướng dẫn bên dưới để thêm ứng dụng vào màn hình chính từ trình duyệt Chrome.'}
            </p>
          </div>

          {/* Visual Guide Image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
             <img 
               src={guideImage} 
               alt={`Hình ảnh minh họa cài đặt trên ${isIos ? 'iOS' : 'Android'}`}
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none" />
          </div>

          {/* Instruction List */}
          <div className="space-y-4">
            {isIos ? (
              <div className="space-y-3">
                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div className="flex-1">
                     <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Nhấn nút <strong>Chia sẻ</strong> <Share className="inline w-4 h-4 ml-1 mb-1 text-cyan-500" /></p>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div className="flex-1">
                     <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Chọn <strong>“Thêm vào MH chính”</strong> <PlusSquare className="inline w-4 h-4 ml-1 mb-1 text-cyan-500" /></p>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div className="flex-1">
                     <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Nhấn <strong>“Thêm”</strong> ở góc trên</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div className="flex-1">
                     <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Nhấn <strong>Menu</strong> <MoreVertical className="inline w-4 h-4 ml-1 mb-1 text-cyan-500" /></p>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div className="flex-1">
                     <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Chọn <strong>“Cài đặt ứng dụng”</strong> <Download className="inline w-4 h-4 ml-1 mb-1 text-cyan-500" /></p>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div className="flex-1">
                     <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Nhấn <strong>“Cài đặt”</strong> để hoàn tất</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action - Fixed at bottom */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-2xl transition-all shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95 cursor-pointer min-h-[52px]"
          >
            Đã hiểu hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
