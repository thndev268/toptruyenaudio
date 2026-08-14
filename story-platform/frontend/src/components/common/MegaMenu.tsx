import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Swords,
  Heart,
  Building2,
  Ghost,
  BookOpen,
  Compass,
  Radio,
  ArrowRight,
  X,
  Grid
} from 'lucide-react';
import { useGenres } from '../../hooks/useGenres';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const genres = useGenres();

  // Icon mapping
  const getGenreIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Swords': return <Swords className="w-4 h-4 text-rose-400" />;
      case 'Heart': return <Heart className="w-4 h-4 text-pink-400" />;
      case 'Building2': return <Building2 className="w-4 h-4 text-cyan-400" />;
      case 'Ghost': return <Ghost className="w-4 h-4 text-indigo-400" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'Compass': return <Compass className="w-4 h-4 text-blue-400" />;
      case 'Radio': return <Radio className="w-4 h-4 text-violet-400" />;
      default: return <Grid className="w-4 h-4 text-cyan-400" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-1/2 -translate-x-1/2 w-[90vw] max-w-5xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-50 animate-fadeIn"
      role="region"
      aria-label="Danh mục thể loại truyện audio"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thể Loại Truyện Audio Phổ Biến</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Khám phá hàng ngàn câu chuyện thuộc các danh mục đặc sắc</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Đóng danh mục thể loại"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Genres Grid - 4 Columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => {
              navigate(`/explore?genre=${encodeURIComponent(genre.name)}`);
              onClose();
            }}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/30 text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
              {getGenreIcon(genre.iconName)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">
                {genre.name}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {genre.description}
              </p>
              <span className="inline-block mt-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-500/80 font-semibold">
                {genre.storyCount} bộ truyện
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex justify-end">
        <button
          onClick={() => {
            navigate('/genres');
            onClose();
          }}
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 flex items-center gap-1 hover:underline"
        >
          <span>Xem tất cả thể loại & danh mục</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
