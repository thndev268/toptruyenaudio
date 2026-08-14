import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ title, description, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div>
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
        {title}
      </h3>
      {description && <p className="text-[11px] text-slate-600 mt-1 px-1">{description}</p>}
    </div>
    <div className="flex flex-wrap gap-2">
      {children}
    </div>
  </div>
);

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onClick, icon, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`
      px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 
      inline-flex items-center gap-2 border touch-manipulation min-h-[44px]
      ${selected 
        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10 font-black' 
        : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600 hover:text-slate-300'}
    `}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span>{label}</span>
    {selected && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"
      />
    )}
  </button>
);

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => (
  <div className="p-1 bg-slate-950/50 border border-slate-800 rounded-2xl flex w-full">
    {options.map((opt) => {
      const isSelected = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative z-10 min-h-[40px]
            ${isSelected ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
          `}
        >
          {isSelected && (
            <motion.div
              layoutId="segmented-bg"
              className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-xl -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          {opt.label}
        </button>
      );
    })}
  </div>
);

interface FilterFooterProps {
  onReset: () => void;
  onApply: () => void;
  appliedCount?: number;
  isApplying?: boolean;
}

export const FilterFooter: React.FC<FilterFooterProps> = ({ onReset, onApply, appliedCount, isApplying }) => (
  <div className="p-6 bg-slate-900 border-t border-slate-800 shrink-0 safe-area-bottom">
    <div className="flex gap-4 max-w-lg mx-auto">
      <button
        onClick={onReset}
        className="flex-1 h-12 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-750 transition-colors border border-slate-700/50"
      >
        Xóa lọc
      </button>
      <button
        onClick={onApply}
        disabled={isApplying}
        className="flex-[2] h-12 rounded-xl bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
      >
        {isApplying ? (
          <span className="w-5 h-5 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Áp dụng {appliedCount ? `(${appliedCount})` : ''}</span>
          </>
        )}
      </button>
    </div>
  </div>
);
