import React from 'react';
import {
  Sliders,
  CheckCircle2,
  Lock,
  Radio,
  Clock,
} from 'lucide-react';
import { AdminFeatureFlag } from '../../../types/admin';

interface FeatureFlagsScreenProps {
  flags: AdminFeatureFlag[];
  onToggleFlag: (flag: AdminFeatureFlag) => void;
}

export const FeatureFlagsScreen: React.FC<FeatureFlagsScreenProps> = ({
  flags,
  onToggleFlag,
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Sliders className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Kiểm Soát Tính Năng Trực Tiếp
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Quản Lý Cờ Tính Năng (Feature Flags)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Bật/tắt tính năng theo thời gian thực mà không cần triển khai lại toàn bộ cụm máy chủ
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
          {flags.filter((f) => f.isEnabled).length} / {flags.length} tính năng đang bật
        </span>
      </div>

      {/* Grid of flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono font-bold">
                  {flag.category}
                </span>

                <span className="text-[10px] text-slate-500 font-mono">
                  Sửa đổi: {flag.lastModified}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white">{flag.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{flag.description}</p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                {flag.key}
              </span>

              <button
                type="button"
                onClick={() => onToggleFlag(flag)}
                title={flag.isEnabled ? 'Nhấn để tắt tính năng này' : 'Nhấn để bật kích hoạt tính năng này'}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer min-h-[38px] shrink-0 whitespace-nowrap ${
                  flag.isEnabled
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-750'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    flag.isEnabled ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>{flag.isEnabled ? 'Đang bật (ON)' : 'Đã tắt (OFF)'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
