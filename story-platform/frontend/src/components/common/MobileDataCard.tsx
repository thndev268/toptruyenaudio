import React from 'react';

export interface MobileDataCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  fields: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
}

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  badge,
  fields,
  actions,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white line-clamp-1">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
        {fields.map((field, idx) => (
          <div key={idx} className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-medium">
              {field.label}
            </span>
            <div className="text-slate-200 font-medium">{field.value}</div>
          </div>
        ))}
      </div>

      {actions && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};
