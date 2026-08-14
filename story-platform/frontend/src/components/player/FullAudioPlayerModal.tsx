import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Minimize2,
  Timer,
  Heart,
  List,
  Disc,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  Crown
} from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { FocusTrap } from '../common/FocusTrap';
import { motionTokens } from '../../config/motionTokens';

export const FullAudioPlayerModal: React.FC = () => {
  const {
    currentStory,
    currentChapter,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    autoPlayNext,
    sleepTimer,
    sleepTimerRemaining,
    isFullPlayerOpen,
    favorites,
    audioError,
    isOffline,
    togglePlayPause,
    seek,
    skipSeconds,
    setSpeedRate,
    setAutoPlayNextToggle,
    setSleepTimerMode,
    playNextChapter,
    playPreviousChapter,
    playChapter,
    toggleFullPlayer,
    toggleFavorite,
    retryPlayback,
    clearAudioError,
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<'visual' | 'playlist'>('visual');

  // Handle Escape key to close player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullPlayerOpen) {
        toggleFullPlayer(false);
      }
    };
    if (isFullPlayerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullPlayerOpen, toggleFullPlayer]);

  if (!currentStory || !currentChapter) return null;

  const isFav = favorites.includes(currentStory.id);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speedOptions = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <AnimatePresence>
      {isFullPlayerOpen && (
        <FocusTrap isActive={isFullPlayerOpen} onEscape={() => toggleFullPlayer(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-2xl flex flex-col h-[100dvh] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Trình phát audio đầy đủ màn hình"
          >
        {/* Background Decorative Blur */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 bg-slate-950">
          <img
            loading="lazy"
            src={currentStory.coverUrl}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-125 bg-slate-800/80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
        </div>

        {/* Top Bar Header */}
        <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => toggleFullPlayer(false)}
            className="p-2 px-3 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-full transition-colors flex items-center gap-2 text-xs font-semibold min-h-[44px]"
            aria-label="Thu nhỏ trình phát audio"
          >
            <Minimize2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Thu Nhỏ</span>
          </button>

          <div className="text-center px-2">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold block">
              Trình Phát Audio HD 320kbps
            </span>
            <span className="text-xs sm:text-sm text-slate-300 font-bold truncate max-w-[200px] sm:max-w-xs block">
              {currentStory.title}
            </span>
          </div>

          <button
            onClick={() => toggleFavorite(currentStory.id)}
            className={`p-2.5 rounded-full border transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isFav
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Thêm vào danh sách yêu thích"
            aria-label={isFav ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Audio Error Notification State */}
        {(audioError || isOffline) && (
          <div className="relative z-20 max-w-3xl mx-auto w-full px-4 pt-3">
            <div className="bg-rose-950/90 border border-rose-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-200 shadow-lg">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{isOffline ? 'Bạn đang ngoại tuyến. Vui lòng kết nối Internet.' : audioError?.message}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {audioError?.canSkipNext && (
                  <button
                    onClick={() => {
                      clearAudioError();
                      playNextChapter();
                    }}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-1 transition-all"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Chuyển Tập Tiếp</span>
                  </button>
                )}
                <button
                  onClick={retryPlayback}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử Lại</span>
                </button>
                <button onClick={clearAudioError} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="relative z-10 max-w-3xl mx-auto w-full flex-1 px-4 sm:px-6 py-4 flex flex-col justify-between overflow-y-auto min-h-0 space-y-4">
          {/* View Switcher */}
          <div className="flex justify-center shrink-0">
            <div className="bg-slate-900 border border-slate-800 p-1 rounded-full flex gap-1">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px] ${
                  activeTab === 'visual' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Disc className="w-3.5 h-3.5" /> Trình Diễn
              </button>
              <button
                onClick={() => setActiveTab('playlist')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all min-h-[38px] ${
                  activeTab === 'playlist' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Danh Sách Tập ({currentStory.chapters.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Animated Vinyl Artwork View */}
          {activeTab === 'visual' && (
            <div className="flex flex-col items-center justify-center space-y-4 my-auto py-2">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full p-2 bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-800 border border-slate-700/80 shadow-2xl flex items-center justify-center shrink-0">
                <div className="absolute inset-2 rounded-full border border-slate-700/40 pointer-events-none" />
                <div className="absolute inset-6 rounded-full border border-slate-700/30 pointer-events-none" />

                <div
                  className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-slate-900 shadow-xl animate-spin motion-reduce:animate-none"
                  style={{ 
                    animationDuration: '20s', 
                    animationPlayState: isPlaying ? 'running' : 'paused' 
                  }}
                >
                  <img loading="lazy" src={currentStory.coverUrl} alt={currentStory.title} className="w-full h-full object-cover bg-slate-800" />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-700" />
                  </div>
                </div>

                <div className="absolute bottom-1 bg-slate-900/90 border border-slate-700 px-3 py-0.5 rounded-full text-[10px] font-mono text-cyan-400 flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Audio HD 3D</span>
                </div>
              </div>

              <div className="text-center space-y-1 max-w-md">
                <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-snug">
                  {currentChapter.title}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-cyan-400">{currentStory.title}</p>
                <p className="text-[11px] text-slate-400">
                  Tác giả: <span className="text-slate-200">{currentStory.authorName}</span> | MC:{' '}
                  <span className="text-slate-200">{currentChapter.narrator || currentStory.narratorName}</span>
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Chapters List View */}
          {activeTab === 'playlist' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-2 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                <span>DANH SÁCH TẬP AUDIO</span>
                <span>THỜI LƯỢNG</span>
              </div>

              <div className="space-y-1.5">
                {currentStory.chapters.map((ch) => {
                  const isCurrent = ch.id === currentChapter.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => playChapter(currentStory, ch)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                        isCurrent
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-800/40 border-slate-800/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            isCurrent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ch.number}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold leading-tight truncate">{ch.title}</h5>
                          <p className="text-[10px] text-slate-400">Giọng đọc: {ch.narrator}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {ch.accessLevel === 'FREE' ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                            Miễn Phí
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded min-w-[50px] text-center">
                            <Crown className="w-2.5 h-2.5 inline-block mr-0.5 -mt-0.5"/>Premium
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">{formatTime(ch.durationSeconds)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls Section */}
          <div className="space-y-3 shrink-0 pt-2">
            <div className="space-y-1">
              <div
                className="relative w-full h-2 bg-slate-800 rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(1, clickX / rect.width));
                  seek(pct * duration);
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-cyan-500"
                  style={{ left: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span className="text-[10px] text-cyan-400 uppercase font-sans font-bold">
                  {currentChapter.accessLevel === 'FREE' ? 'Miễn phí' : 'Premium'}
                </span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-6 py-1">
              <button
                onClick={playPreviousChapter}
                className="p-3 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Tập trước"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => skipSeconds(-10)}
                className="p-3 text-slate-300 hover:text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full transition-colors flex items-center min-w-[44px] min-h-[44px] justify-center"
                aria-label="Lùi 10 giây"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="text-[10px] font-mono font-bold -ml-1">10</span>
              </button>

              <button
                onClick={togglePlayPause}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/25 active:scale-95 transition-all shrink-0"
                aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-slate-950" /> : <Play className="w-7 h-7 fill-slate-950 ml-1" />}
              </button>

              <button
                onClick={() => skipSeconds(10)}
                className="p-3 text-slate-300 hover:text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full transition-colors flex items-center min-w-[44px] min-h-[44px] justify-center"
                aria-label="Tua 10 giây"
              >
                <RotateCw className="w-5 h-5" />
                <span className="text-[10px] font-mono font-bold -ml-1">10</span>
              </button>

              <button
                onClick={playNextChapter}
                className="p-3 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Tập tiếp theo"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Tốc độ:</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
                  {speedOptions.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeedRate(rate)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        playbackRate === rate ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      aria-label={`Tốc độ ${rate}x`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setAutoPlayNextToggle(!autoPlayNext)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all min-h-[38px] ${
                  autoPlayNext
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${autoPlayNext ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>Tự Động Tập Tiếp</span>
              </button>

              <button
                onClick={() => {
                  const nextTimer = sleepTimer === 0 ? 15 : sleepTimer === 15 ? 30 : sleepTimer === 30 ? 60 : 0;
                  setSleepTimerMode(nextTimer);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all min-h-[38px] ${
                  sleepTimer > 0
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
                aria-label={sleepTimer > 0 ? `Hẹn giờ tắt còn ${Math.ceil(sleepTimerRemaining / 60)} phút` : 'Thiết lập hẹn giờ dừng audio'}
              >
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>{sleepTimer > 0 ? `${Math.ceil(sleepTimerRemaining / 60)}m` : 'Hẹn Giờ'}</span>
              </button>
            </div>
          </div>
        </div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
};
