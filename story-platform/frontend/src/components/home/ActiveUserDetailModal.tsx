import React, { useEffect } from 'react';
import { X, Crown, Clock, Award, Headphones, CheckCircle2, Star, Sparkles, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { UserActivityRanking } from '../../types';
import { Link } from 'react-router-dom';
import { Portal } from '../common/filter/Portal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ActiveUserDetailModalProps {
  user: UserActivityRanking | null;
  onClose: () => void;
}

export const ActiveUserDetailModal: React.FC<ActiveUserDetailModalProps> = ({ user, onClose }) => {
  useBodyScrollLock(!!user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (user) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, onClose]);

  if (!user) return null;

  // Derive favorite sample stories for this user based on level/index
  const favoriteStories = [];

  const getRankBadgeColor = (rank?: number) => {
    if (rank === 1) return 'from-amber-400 to-yellow-600 text-slate-950';
    if (rank === 2) return 'from-slate-300 to-slate-500 text-slate-950';
    if (rank === 3) return 'from-amber-600 to-orange-700 text-white';
    return 'from-slate-700 to-slate-800 text-slate-200';
  };

  const getRankLabel = (rank?: number) => {
    if (rank === 1) return 'Quán Quân Tuần 👑';
    if (rank === 2) return 'Á Quân Tuần 🥈';
    if (rank === 3) return 'Hạng 3 Tuần 🥉';
    return `Hạng #${rank || 4} Tuần`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      <div 
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 animate-fadeIn"
        onClick={handleBackdropClick}
        role="presentation"
      >
        {/* Modal Container */}
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="listener-info-title"
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[calc(100dvh-2rem)] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Background Cover Banner */}
          <div className="h-28 bg-gradient-to-r from-cyan-900/60 via-slate-900 to-indigo-900/60 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-2 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full border border-slate-800 transition-colors z-10 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Rank Badge Header */}
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-lg bg-gradient-to-r flex items-center gap-1.5 ${getRankBadgeColor(
                  user.rank
                )}`}
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                {getRankLabel(user.rank)}
              </span>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-5 -mt-12 relative z-10 flex-1 min-h-0">
            {/* User Profile Info */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="flex items-end gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-900 bg-slate-800 shadow-xl"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 font-mono font-black text-[10px] px-2 py-0.5 rounded-full border-2 border-slate-900 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Lvl {user.level}
                  </div>
                </div>

                <div className="min-w-0 pb-1">
                  <h3 id="listener-info-title" className="text-lg font-bold text-white truncate">{user.displayName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-400 font-bold font-mono">
                      {user.activityPoints.toLocaleString('vi-VN')}
                    </span>{' '}
                    điểm tích cực
                  </p>
                </div>
              </div>
            </div>

            {/* Badges & Achievements */}
            {user.achievements && user.achievements.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Danh hiệu vinh danh:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.achievements.map((badge, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Crown className="w-3 h-3 text-amber-400" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Activity Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center space-y-0.5">
                <Clock className="w-4 h-4 text-cyan-400 mx-auto" />
                <div className="text-base font-extrabold text-cyan-400 font-mono">
                  {Math.round(user.validListeningMinutes / 60)}h
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Thời lượng nghe</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center space-y-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                <div className="text-base font-extrabold text-emerald-400 font-mono">
                  {user.completedStories}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Truyện hoàn thành</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center space-y-0.5">
                <Calendar className="w-4 h-4 text-purple-400 mx-auto" />
                <div className="text-base font-extrabold text-purple-400 font-mono">
                  {user.activeDays} ngày
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Chuỗi hoạt động</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center space-y-0.5">
                <Star className="w-4 h-4 text-amber-400 mx-auto" />
                <div className="text-base font-extrabold text-amber-400 font-mono">
                  {user.helpfulReviews}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Bình luận hữu ích</div>
              </div>
            </div>

            {/* Favorite Genres */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-cyan-400" /> Thể loại yêu thích:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Tiên Hiệp', 'Kiếm Hiệp', 'Đêm Muộn', 'Trinh Thám'].map((genre, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium rounded-xl"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample Top Favorite Audiobooks */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" /> Tủ truyện đang nghe nhiều nhất:
                </span>
              </div>

              <div className="space-y-2">
                {favoriteStories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/story/${story.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        loading="lazy"
                        src={story.coverUrl}
                        alt={story.title}
                        className="w-10 h-12 rounded-lg object-cover bg-slate-800 border border-slate-700/80 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                          {story.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          MC: {story.narratorName} • {story.totalChapters} Tập
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-cyan-400 shrink-0 ml-2 group-hover:underline">
                      Xem truyện
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
            <Link
              to={`/users/${user.userId}`}
              onClick={onClose}
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors min-h-[38px]"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Xem Bảng Vinh Danh Công Khai</span>
            </Link>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors min-h-[38px]"
            >
              Đóng
            </button>
          </div>
        </section>
      </div>
    </Portal>
  );
};
