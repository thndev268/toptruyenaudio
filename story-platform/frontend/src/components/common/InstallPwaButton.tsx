import React, { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { useToast } from '../../context/ToastContext';

interface InstallPwaButtonProps {
  variant?: 'menu' | 'mobile' | 'button';
  onSuccess?: () => void;
  className?: string;
}

export const InstallPwaButton: React.FC<InstallPwaButtonProps> = ({
  variant = 'button',
  onSuccess,
  className = '',
}) => {
  const pwa = usePwaInstall();
  const { showToast } = useToast();
  const prevInstalledRef = useRef<boolean>(pwa.isInstalled);

  // Success toast when PWA is successfully installed
  useEffect(() => {
    if (pwa.isInstalled && !prevInstalledRef.current) {
      showToast('success', 'Thành công', 'Đã cài đặt TOP TRUYỆN AUDIO lên thiết bị của bạn!');
      if (onSuccess) {
        onSuccess();
      }
    }
    prevInstalledRef.current = pwa.isInstalled;
  }, [pwa.isInstalled, showToast, onSuccess]);

  // If the app is already installed or PWA isn't installable on this device/browser, render nothing
  if (!pwa.canInstall || pwa.isInstalled) {
    return null;
  }

  const handleInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    pwa.installPwa();
  };

  return (
    <>
      {/* 1. Variant: ACCOUNT MENU LIST ITEM */}
      {variant === 'menu' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all duration-200 text-left cursor-pointer min-h-[44px] ${className}`}
          aria-label="Thêm TOP TRUYỆN AUDIO vào màn hình chính"
          id="pwa-install-menu-btn"
        >
          <Download className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Cài ứng dụng</span>
        </button>
      )}

      {/* 2. Variant: MOBILE DRAWER / FOOTER MENU ITEM */}
      {variant === 'mobile' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 dark:bg-cyan-950/10 dark:hover:bg-cyan-950/20 active:bg-cyan-500/30 dark:active:bg-cyan-950/30 border border-cyan-500/15 rounded-xl transition-colors cursor-pointer min-h-[48px] ${className}`}
          aria-label="Thêm TOP TRUYỆN AUDIO vào màn hình chính"
          id="pwa-install-mobile-btn"
        >
          <Download className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>Thêm vào màn hình chính</span>
        </button>
      )}

      {/* 3. Variant: GENERAL CTA BUTTON */}
      {variant === 'button' && (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 min-h-[44px] cursor-pointer ${className}`}
          aria-label="Thêm TOP TRUYỆN AUDIO vào màn hình chính"
          id="pwa-install-cta-btn"
        >
          <Download className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Thêm vào màn hình chính</span>
        </button>
      )}
    </>
  );
};
