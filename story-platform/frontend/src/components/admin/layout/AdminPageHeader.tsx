import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  icon?: LucideIcon;
  category: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  categoryColor?: 'cyan' | 'rose' | 'amber' | 'emerald';
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  icon: Icon,
  category,
  title,
  subtitle,
  badge,
  actions,
  categoryColor = 'cyan',
}) => {
  const colorMap = {
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className={`flex items-center gap-2 ${colorMap[categoryColor]} mb-1`}>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span className="text-[11px] uppercase font-mono font-bold tracking-wider truncate">
            {category}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white truncate">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {(badge || actions) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          {badge}
          {actions}
        </div>
      )}
    </div>
  );
};
