import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Award, Eye, EyeOff, Star, ShieldCheck, Sparkles, Clock, Calendar, Lock } from 'lucide-react';
import { UserBadgeAssignment, BadgeLevel } from '../../types/badges';

interface UserBadgeCardProps {
  assignment: UserBadgeAssignment;
  onToggleVisibility?: (assignmentId: string, currentVisibility: 'PUBLIC' | 'PRIVATE') => void;
  onToggleFeatured?: (assignmentId: string, isFeatured: boolean) => void;
  isOwner?: boolean;
  compact?: boolean;
}

const LEVEL_LABELS: Record<BadgeLevel, string> = {
  COMMON: 'THÔNG THƯỜNG',
  RARE: 'HIẾM',
  EPIC: 'KINH ĐIỂN',
  LEGENDARY: 'HUYỀN THOẠI',
};

const LEVEL_STYLES: Record<BadgeLevel, {
  container: string;
  badgeTag: string;
  glow: string;
}> = {
  COMMON: {
    container: 'border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100',
    badgeTag: 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 font-extrabold whitespace-nowrap tracking-wide',
    glow: '',
  },
  RARE: {
    container: 'border-emerald-400 dark:border-emerald-500/60 bg-gradient-to-br from-emerald-50/60 via-white to-green-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/40 text-slate-900 dark:text-slate-100 shadow-sm shadow-emerald-500/15',
    badgeTag: 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 border-emerald-400 dark:border-emerald-600 font-extrabold whitespace-nowrap tracking-wide',
    glow: 'hover:shadow-md hover:shadow-emerald-500/20 transition-all',
  },
  EPIC: {
    container: 'border-amber-400 dark:border-amber-500/80 bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-amber-950/40 text-slate-900 dark:text-slate-100 shadow-sm shadow-amber-500/20',
    badgeTag: 'bg-amber-100 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 border-amber-400 dark:border-amber-600 font-extrabold whitespace-nowrap tracking-wide',
    glow: 'hover:shadow-lg hover:shadow-amber-500/25 transition-all',
  },
  LEGENDARY: {
    container: 'border-rose-500 dark:border-red-500/80 bg-gradient-to-br from-rose-50/80 via-red-50/30 to-rose-100/40 dark:from-slate-800 dark:via-slate-800 dark:to-rose-950/50 text-slate-900 dark:text-slate-100 shadow-md shadow-rose-500/25',
    badgeTag: 'bg-rose-100 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 border-rose-500 dark:border-rose-600 font-extrabold whitespace-nowrap tracking-wide',
    glow: 'hover:shadow-xl hover:shadow-rose-500/30 transition-all motion-safe:animate-pulse-subtle',
  },
};

export const UserBadgeCard: React.FC<UserBadgeCardProps> = ({
  assignment,
  onToggleVisibility,
  onToggleFeatured,
  isOwner = false,
  compact = false,
}) => {
  const badge = assignment.badge;
  if (!badge) return null;

  const level = badge.level || 'COMMON';
  const styles = LEVEL_STYLES[level];

  // Dynamic icon resolution
  const IconComponent = (LucideIcons as any)[badge.icon] || Award;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${styles.container} ${styles.glow}`}
        title={`${badge.name} (${LEVEL_LABELS[level]}) - ${badge.description}`}
      >
        <IconComponent className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
        <span className="truncate max-w-[120px]">{badge.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-extrabold whitespace-nowrap tracking-wide ${styles.badgeTag}`}>
          {LEVEL_LABELS[level]}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${styles.container} ${styles.glow}`}
    >
      {/* Featured Badge Star Indicator */}
      {assignment.isFeatured && (
        <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10">
          <Star className="w-3 h-3 fill-current" />
          <span>DANH HIỆU NỔI BẬT</span>
        </div>
      )}

      {/* Visibility Status Badge if private */}
      {isOwner && assignment.visibility === 'PRIVATE' && (
        <div className="absolute top-3 right-3 text-slate-400 dark:text-slate-500 flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700" title="Chỉ mình bạn nhìn thấy danh hiệu này">
          <Lock className="w-3 h-3" />
          <span>Riêng tư</span>
        </div>
      )}

      <div>
        {/* Header: Icon & Level Tag */}
        <div className="flex items-start justify-between gap-3 mb-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-500 dark:text-amber-400 shadow-inner shrink-0">
            <IconComponent className="w-7 h-7" />
          </div>

          <div className="flex flex-col items-end">
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-extrabold uppercase tracking-wide whitespace-nowrap shadow-sm ${styles.badgeTag}`}>
              CẤP: {LEVEL_LABELS[level]}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400" />
              {assignment.source === 'ADMIN' ? 'Admin cấp' : 'Hệ thống'}
            </span>
          </div>
        </div>

        {/* Name & Description */}
        <h4 className="text-base font-bold mb-1 text-slate-900 dark:text-white flex items-center gap-2">
          {badge.name}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
          {badge.description}
        </p>

        {/* Requirement text */}
        {badge.requirementText && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 mb-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Đạt được khi:</span> {badge.requirementText}
          </div>
        )}
      </div>

      {/* Footer: Date & Owner Controls */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 text-[11px]" title={`Được cấp lúc: ${(() => {
          try {
            const date = new Date(assignment.assignedAt);
            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('vi-VN');
          } catch (e) {
            return 'N/A';
          }
        })()}`}>
          <Calendar className="w-3.5 h-3.5" />
          <span>{(() => {
            try {
              const date = new Date(assignment.assignedAt);
              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
            } catch (e) {
              return 'N/A';
            }
          })()}</span>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            {/* Toggle Visibility */}
            {onToggleVisibility && (
              <button
                onClick={() => onToggleVisibility(assignment.id, assignment.visibility)}
                className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[11px] min-h-[36px] px-2 ${
                  assignment.visibility === 'PUBLIC'
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                    : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                }`}
                title={assignment.visibility === 'PUBLIC' ? 'Đang Công khai (Bấm để ẩn khỏi hồ sơ công khai)' : 'Đang Riêng tư (Bấm để công khai)'}
                aria-label="Thay đổi trạng thái công khai danh hiệu"
              >
                {assignment.visibility === 'PUBLIC' ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Công khai</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Riêng tư</span>
                  </>
                )}
              </button>
            )}

            {/* Set Featured Badge */}
            {onToggleFeatured && (
              <button
                onClick={() => onToggleFeatured(assignment.id, !assignment.isFeatured)}
                className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[11px] min-h-[36px] px-2 ${
                  assignment.isFeatured
                    ? 'bg-amber-500 text-white border-amber-600 font-semibold shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                }`}
                title={assignment.isFeatured ? 'Đang chọn làm danh hiệu nổi bật' : 'Chọn làm danh hiệu nổi bật trên hồ sơ'}
                aria-label="Chọn làm danh hiệu nổi bật"
              >
                <Star className={`w-3.5 h-3.5 ${assignment.isFeatured ? 'fill-current' : ''}`} />
                <span>{assignment.isFeatured ? 'Nổi bật' : 'Ghim'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
