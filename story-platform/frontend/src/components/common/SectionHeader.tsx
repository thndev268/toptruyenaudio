import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actionText?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  iconColor = 'text-cyan-400',
  actionText = 'Xem tất cả',
  onAction,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 pb-1">
      <div className="space-y-1 min-w-0">
        {badge && (
          <span className="inline-block px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-wider">
            {badge}
          </span>
        )}
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${iconColor}`} />}
          <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-tight truncate">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 line-clamp-1">
            {subtitle}
          </p>
        )}
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 shrink-0 self-start sm:self-end min-h-[44px] px-2 py-1 rounded-lg hover:bg-slate-800/60"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
