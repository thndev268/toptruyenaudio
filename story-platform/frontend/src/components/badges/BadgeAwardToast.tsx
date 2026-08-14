import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Award, X, ExternalLink, Sparkles } from 'lucide-react';
import { UserBadge, BadgeLevel } from '../../types/badges';

interface BadgeAwardToastProps {
  badge: UserBadge;
  onClose: () => void;
  onViewBadges?: () => void;
  durationMs?: number;
}

const LEVEL_LABELS: Record<BadgeLevel, string> = {
  COMMON: 'THÔNG THƯỜNG',
  RARE: 'HIẾM',
  EPIC: 'KINH ĐIỂN',
  LEGENDARY: 'HUYỀN THOẠI',
};

const LEVEL_STYLES: Record<BadgeLevel, string> = {
  COMMON: 'border-slate-300 dark:border-slate-700 bg-slate-900/95 text-white shadow-slate-500/20',
  RARE: 'border-emerald-500 bg-gradient-to-r from-emerald-950/95 via-slate-900 to-green-950 text-white shadow-emerald-500/30',
  EPIC: 'border-amber-400 bg-gradient-to-r from-amber-950/95 via-slate-900 to-yellow-950 text-white shadow-amber-500/30',
  LEGENDARY: 'border-rose-500 bg-gradient-to-r from-rose-950/95 via-slate-900 to-red-950 text-white shadow-rose-500/40 ring-1 ring-rose-400/50',
};

export const BadgeAwardToast: React.FC<BadgeAwardToastProps> = ({
  badge,
  onClose,
  onViewBadges,
  durationMs = 8000,
}) => {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(durationMs);

  const IconComponent = (LucideIcons as any)[badge.icon] || Award;

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = remainingTimeRef.current - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      } else {
        setProgress((remaining / durationMs) * 100);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, durationMs, onClose]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleView = () => {
    onClose();
    if (onViewBadges) {
      onViewBadges();
    } else {
      navigate('/account/badges');
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      className={`fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-up ${
        LEVEL_STYLES[badge.level || 'COMMON']
      }`}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 overflow-hidden rounded-t-2xl">
        <div
          className="h-full bg-amber-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <IconComponent className="w-6 h-6 animate-bounce-subtle" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bạn vừa nhận được danh hiệu mới!</span>
            </div>

            <h4 className="text-sm font-bold text-white mb-0.5">{badge.name}</h4>

            <p className="text-xs text-slate-300 line-clamp-2 mb-2">
              {badge.description}
            </p>

            <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-300 uppercase whitespace-nowrap tracking-wide">
              CẤP: {LEVEL_LABELS[badge.level || 'COMMON']}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Button */}
      <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
        <button
          onClick={handleView}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 min-h-[36px]"
        >
          <span>Xem danh hiệu</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
