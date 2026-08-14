import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Headphones, ArrowRight, Sparkles, Swords, Heart, Building2, Ghost, BookOpen, Compass, Radio } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useGenres } from '../../hooks/useGenres';

export const GenresView: React.FC = () => {
  const navigate = useNavigate();
  const { navigateTo } = useAudioPlayer();
  const genres = useGenres();

  const getGenreIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Swords': return <Swords className="w-5 h-5 text-rose-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-pink-400" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-cyan-400" />;
      case 'Ghost': return <Ghost className="w-5 h-5 text-indigo-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-blue-400" />;
      case 'Radio': return <Radio className="w-5 h-5 text-violet-400" />;
      default: return <Headphones className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleGenreClick = (genreName: string) => {
    navigate(`/explore?genre=${encodeURIComponent(genreName)}`);
    navigateTo('explore');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <Grid className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">Phân Loại Chuyên Sâu</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black text-white">Danh Sách Thể Loại Audio</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Khám phá thể loại truyện phù hợp với sở thích nghe mỗi đêm</p>
      </div>

      {/* Genres Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {genres.map((genre) => (
          <div
            key={genre.id}
            onClick={() => handleGenreClick(genre.name)}
            className="p-5 bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl cursor-pointer hover:bg-slate-850 transition-all space-y-3 group shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl group-hover:scale-105 transition-transform">
                  {getGenreIcon(genre.iconName)}
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-slate-950 text-cyan-400 rounded-full border border-cyan-500/20">
                  {genre.storyCount} Bộ Audio
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {genre.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {genre.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:underline">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
