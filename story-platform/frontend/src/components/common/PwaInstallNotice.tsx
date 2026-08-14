import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';

export const PwaInstallNotice: React.FC = () => {
  const pwa = usePwaInstall();

  // Only display if the PWA is installable (not standalone/installed) and not dismissed by the user
  if (!pwa.showNotice) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 animate-fadeIn transition-all duration-300">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-2xl shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Nghe truyện thuận tiện hơn</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Thêm TOP TRUYỆN AUDIO vào màn hình chính để mở nhanh như một ứng dụng.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={pwa.installPwa}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]"
          aria-label="Cài đặt ứng dụng TOP TRUYỆN AUDIO"
        >
          <Download className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Thêm vào màn hình chính</span>
        </button>
        <button
          onClick={pwa.dismissNotice}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer min-h-[44px]"
          aria-label="Để sau"
        >
          Để sau
        </button>
      </div>
    </div>
  );
};
