import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, ChevronDown, RotateCcw, X } from 'lucide-react';

interface AdminFilterPanelProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReset: () => void;
  children: React.ReactNode;
  activeCount?: number;
}

export const AdminFilterPanel: React.FC<AdminFilterPanelProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  isExpanded,
  onToggleExpand,
  onReset,
  children,
  activeCount = 0
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center gap-3">
        {/* Main Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border-2 border-slate-700 sm:border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-rose-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger */}
        <button
          onClick={onToggleExpand}
          className={`
            px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border-2
            ${isExpanded || activeCount > 0 
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/10' 
              : 'bg-slate-800 text-slate-300 border-slate-600 sm:border-slate-700 hover:border-slate-500'}
          `}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Bộ lọc</span>
          {activeCount > 0 && (
            <span className="bg-slate-950 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-black">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="p-2.5 rounded-xl bg-slate-800/50 text-slate-500 hover:text-rose-400 border-2 border-slate-600 hover:border-slate-500 transition-all"
            title="Xóa tất cả lọc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/80 border-2 border-cyan-500/30 sm:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {children}
              </div>
              
              <div className="pt-4 border-t border-slate-700 sm:border-slate-800 flex justify-end">
                <button
                  onClick={onReset}
                  className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đặt lại về mặc định
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AdminFilterItemProps {
  label: string;
  children: React.ReactNode;
}

export const AdminFilterItem: React.FC<AdminFilterItemProps> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    {children}
  </div>
);
