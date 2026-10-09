import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Timer,
  Gauge,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useToast } from '../../context/ToastContext';
import { SleepTimerOption } from '../../types';

export const MiniAudioPlayer: React.FC = () => {
  const {
    currentStory,
    currentChapter,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isPlayerDismissed,
    togglePlayPause,
    seek,
    setVolumeLevel,
    toggleMute,
    setSpeedRate,
    toggleFullPlayer,
    dismissPlayer,
    restorePlayer,
  } = useAudioPlayer();

  const { showToast } = useToast();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Swipe logic using Motion values
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  if (!currentStory || !currentChapter || isPlayerDismissed) return null;

  const handleDismiss = () => {
    dismissPlayer();
    showToast('info', 'Đã đóng trình phát', 'Bạn có thể khôi phục lại bất cứ lúc nào.', {
      label: 'Hoàn tác',
      onClick: () => restorePlayer(),
    });
  };

  const onDragEnd = (_: any, info: any) => {
    const threshold = window.innerWidth * 0.35;
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > 500) {
      handleDismiss();
    } else {
      x.set(0);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <AnimatePresence>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={onDragEnd}
        style={{ x, opacity, scale }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0, transition: { duration: 0.2 } }}
        className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 sm:px-4 sm:pb-4 pointer-events-none"
      >
        <div className="max-w-5xl mx-auto w-full pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl relative group">
            
            {/* Top Slim Scrubber (#13) */}
            <div
              className="absolute top-0 left-0 right-0 h-1 bg-slate-200/80 dark:bg-slate-800/50 cursor-pointer overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                seek(pct * duration);
              }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${progressPercentage}%` }}
                layoutId="progress-bar"
              />
            </div>

            <div className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
              
              {/* Story Info - Swipe target zone (#17) */}
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none active:opacity-70 transition-opacity"
                onClick={() => toggleFullPlayer(true)}
              >
                <div className="relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-inner">
                  <img
                    loading="lazy"
                    src={currentStory.coverUrl}
                    alt=""
                    className={`w-full h-full object-cover bg-slate-800 ${isPlaying ? 'scale-110' : 'scale-100'} transition-transform duration-700`}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center">
                      <div className="flex gap-0.5 items-end h-3">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [4, 12, 4] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                            className="w-0.5 bg-cyan-500 dark:bg-cyan-400"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] sm:text-sm font-black text-slate-900 dark:text-white truncate leading-tight">
                    {currentChapter.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium mt-0.5">
                    {currentStory.title}
                  </p>
                </div>
              </div>

              {/* Main Controls - Block swipe logic here (#17) */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                
                {/* Speed Selector (Desktop) */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className={`p-2 rounded-xl transition-all ${showSpeedMenu ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    aria-label="Tốc độ phát"
                  >
                    <Gauge className="w-5 h-5" />
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute right-0 bottom-14 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1 z-50">
                      {speedOptions.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            setSpeedRate(rate);
                            setShowSpeedMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-mono rounded-xl transition-colors ${
                            playbackRate === rate ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Main Play Toggle */}
                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                  aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                {/* Close Button - Desktop & Mobile Alt (#18) */}
                <button
                  onClick={handleDismiss}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all sm:group-hover:opacity-100 sm:opacity-0"
                  aria-label="Đóng trình phát"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            </div>

            {/* Subtle Swipe Hint for Mobile (#14) */}
            <div className="lg:hidden absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-300 dark:bg-slate-800 rounded-full opacity-30" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
