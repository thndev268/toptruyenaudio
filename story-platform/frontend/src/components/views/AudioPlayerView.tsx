import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { AddToPlaylistMenu } from '../common/AddToPlaylistMenu';
import { AudioQuality } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  List,
  Disc,
  Heart,
  Volume2,
  VolumeX,
  Gauge,
  Timer,
  AlertTriangle,
  RefreshCw,
  ListPlus,
  CheckCircle,
  Settings,
  Crown,
  Eye,
  EyeOff,
  Video,
  Zap,
} from 'lucide-react';

export const AudioPlayerView: React.FC = () => {
  const { storySlug, chapterId } = useParams<{ storySlug: string; chapterId: string }>();
  const navigate = useNavigate();

  const {
    currentStory,
    currentChapter,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    audioQuality,
    favorites,
    audioError,
    isOffline,
    isDataSaverMode,
    toggleDataSaverMode,
    pauseAudio,
    resumeAudio,
    isAuthenticated,
    openAuthModal,
    playChapter,
    togglePlayPause,
    seek,
    skipSeconds,
    setVolumeLevel,
    toggleMute,
    setSpeedRate,
    setAudioQuality,
    playNextChapter,
    playPreviousChapter,
    toggleFavorite,
    retryPlayback,
    clearAudioError,
  } = useAudioPlayer();

  const [playlistMenuChapterId, setPlaylistMenuChapterId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const videoSettings = adminRepository.getVideoSettings();
  const [isIframeVisible, setIsIframeVisible] = useState<boolean>(
    !videoSettings.hideIframeWithCSS || videoSettings.showIframeByDefault
  );

  useEffect(() => {
    if (storySlug) {
      const publicStories = adminRepository.getPublicStories();
      const storiesArray = Array.isArray(publicStories) ? publicStories : [];
      const foundStory = storiesArray.find((s) => s.slug === storySlug || s.id === storySlug) ;
      if (foundStory) {
        const chapters = Array.isArray(foundStory.chapters) ? foundStory.chapters : [];
        let foundChapter = chapters.find((c) => c.id === chapterId || c.number.toString() === chapterId);
        if (!foundChapter && chapters.length > 0) {
          foundChapter = chapters[0];
        }

        if (foundChapter && (currentStory?.id !== foundStory.id || currentChapter?.id !== foundChapter.id)) {
          playChapter(foundStory, foundChapter);
        }
      }
    }
  }, [storySlug, chapterId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extractYouTubeId = (str?: string): string | null => {
    if (!str) return null;
    
    // First try to extract from iframe src attribute
    const srcMatch = str.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      const src = srcMatch[1];
      const ytMatch = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch) return ytMatch[1];
    }
    
    // Then try direct URL patterns
    const match = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  };

  const chapterIframeSrc = currentChapter?.videoIframeUrl || currentChapter?.iframeCode || currentStory?.iframeUrl || currentStory?.iframeCode || '';
  const ytId = extractYouTubeId(chapterIframeSrc);
  const isVideoAllowedByAdmin = currentChapter?.allowVideoDisplay !== false && currentChapter?.isVideoEnabled !== false;
  const canShowVideo = isVideoAllowedByAdmin && !!ytId;

  const videoIframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytVideoPlayerRef = useRef<any>(null);

  // Ensure iframe's internal audio is muted via YouTube IFrame API setVolume(0) so only website audio plays
  useEffect(() => {
    if (canShowVideo && !isDataSaverMode) {
      const applyMute = () => {
        try {
          if (videoIframeRef.current?.contentWindow) {
            console.log('[AudioPlayerView] Sending postMessage to mute iframe visual video.');
            videoIframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'setVolume', args: [0] }),
              '*'
            );
            videoIframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'mute', args: [] }),
              '*'
            );
          }
        } catch (e) {}

        if (window.YT && window.YT.Player && videoIframeRef.current) {
          try {
            if (!ytVideoPlayerRef.current) {
              ytVideoPlayerRef.current = new window.YT.Player(videoIframeRef.current, {
                events: {
                  onReady: (event: any) => {
                    try {
                      console.log('[AudioPlayerView] YT visual player onReady - forcing mute.');
                      event.target.setVolume(0);
                      event.target.mute();
                    } catch (e) {}
                  },
                },
              });
            } else if (typeof ytVideoPlayerRef.current.setVolume === 'function') {
              console.log('[AudioPlayerView] YT visual player exists - forcing mute.');
              ytVideoPlayerRef.current.setVolume(0);
              ytVideoPlayerRef.current.mute?.();
            }
          } catch (e) {}
        }
      };

      applyMute();
      const t1 = setTimeout(applyMute, 400);
      const t2 = setTimeout(applyMute, 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        if (ytVideoPlayerRef.current) {
          try {
            ytVideoPlayerRef.current.destroy?.();
          } catch (e) {}
          ytVideoPlayerRef.current = null;
        }
      };
    }
  }, [canShowVideo, isDataSaverMode, ytId]);

  if (!currentStory || !currentChapter) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Không tìm thấy tập truyện audio</h2>
        <p className="text-xs text-slate-400">Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.</p>
        <Link to="/" className="inline-block px-5 py-2.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl">
          Trở Về Trang Chủ
        </Link>
      </div>
    );
  }

  const isFav = favorites.includes(currentStory.id);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speedOptions = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const qualityOptions: { value: AudioQuality; label: string }[] = [
    { value: 'STANDARD', label: 'Tiêu chuẩn (128 kbps)' },
    { value: 'HIGH', label: 'Cao (256 kbps)' },
  ];

  const handlePlaylistSuccess = (playlistName: string) => {
    setToastMessage(`Đã thêm vào "${playlistName}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-slideDownAndFade">
          <CheckCircle className="w-4 h-4 text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* Back Header Link */}
      <div className="flex items-center justify-between">
        <Link
          to={`/story/${currentStory.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Về Chi Tiết Truyện: {currentStory.title}
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Settings Menu */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-full border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cài đặt âm thanh"
            >
              <Settings className="w-4 h-4" />
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 animate-slideUpAndFade p-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Chất lượng âm thanh</div>
                {qualityOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setAudioQuality(opt.value);
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                      audioQuality === opt.value ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {audioQuality === opt.value && <CheckCircle className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => toggleFavorite(currentStory.id)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isFav ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isFav ? 'Đã Yêu Thích' : 'Yêu Thích'}</span>
          </button>
        </div>
      </div>

      {/* Audio Error Notification State */}
      {(audioError || isOffline) && (
        <div className="bg-rose-950/90 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-200 shadow-xl">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{isOffline ? 'Bạn đang ngoại tuyến. Vui lòng bật kết nối mạng.' : audioError?.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {audioError?.canSkipNext && (
              <button
                onClick={() => {
                  clearAudioError();
                  playNextChapter();
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <SkipForward className="w-4 h-4" /> Chuyển Tập Tiếp
              </button>
            )}
            <button
              onClick={retryPlayback}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Thử Lại
            </button>
          </div>
        </div>
      )}

      {/* Player Card Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Video / Audio Mode Switcher (When Video is Enabled by Admin) */}
        {canShowVideo && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 px-4 relative z-10">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Chế độ xem tập:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal();
                    return;
                  }
                  toggleDataSaverMode(false);
                  resumeAudio();
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isDataSaverMode
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Xem video 16:9</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal();
                    return;
                  }
                  toggleDataSaverMode(true);
                  resumeAudio();
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDataSaverMode
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tiết kiệm dữ liệu – chỉ nghe audio</span>
              </button>
            </div>
          </div>
        )}

        {/* Media Display: 16:9 Video vs Cover Art Audio */}
        {canShowVideo && !isDataSaverMode ? (
          /* Video 16:9 Display */
          <div className="space-y-4 relative z-10">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
              <iframe
                ref={videoIframeRef}
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&enablejsapi=1&rel=0`}
                title={currentChapter.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                onLoad={() => {
                  try {
                    if (videoIframeRef.current?.contentWindow) {
                      videoIframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ event: 'command', func: 'setVolume', args: [0] }),
                        '*'
                      );
                      videoIframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ event: 'command', func: 'mute', args: [] }),
                        '*'
                      );
                    }
                  } catch (e) {}
                }}
              />
            </div>
            <div className="text-center md:text-left space-y-1">
              <div className="inline-block px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold rounded-full">
                Tập {currentChapter.number} / {currentStory.chapters?.length || currentStory.totalChapters}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">{currentChapter.title}</h1>
              <p className="text-xs text-slate-400">
                Bộ truyện: <span className="text-slate-200 font-bold">{currentStory.title}</span> | Tác giả:{' '}
                <span className="text-slate-200">{currentStory.authorName}</span>
              </p>
            </div>
          </div>
        ) : (
          /* Standard Cover Art Audio Display */
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
            {/* Cover Art */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl shrink-0 group bg-slate-900">
              <img loading="lazy" src={currentStory.coverUrl} alt={currentStory.title} className="w-full h-full object-cover bg-slate-800" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc className={`w-12 h-12 text-cyan-300/80 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
              </div>
            </div>

            {/* Metadata & Description */}
            <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
              <div className="inline-block px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold rounded-full">
                Tập {currentChapter.number} / {currentStory.chapters?.length || currentStory.totalChapters}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{currentChapter.title}</h1>
              <p className="text-sm font-semibold text-slate-300">{currentStory.title}</p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Tác giả: <strong className="text-slate-200">{currentStory.authorName}</strong></p>
                <p>Giọng đọc: <strong className="text-slate-200">{currentChapter.narrator || currentStory.narratorName}</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* Scrubber & Progress */}
        <div className="space-y-2">
          <div
            className="relative w-full h-3 bg-slate-950 rounded-full cursor-pointer group border border-slate-800"
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
            <span className="text-[10px] text-cyan-400 font-sans font-bold uppercase">
              {currentChapter.accessLevel === 'FREE' ? 'Miễn Phí' : 'Premium'}
            </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Playback Controls */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <button
            onClick={playPreviousChapter}
            className="p-3 text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Tập trước"
            aria-label="Phát tập trước"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={() => skipSeconds(-10)}
            className="p-3 text-slate-300 hover:text-cyan-400 bg-slate-950 border border-slate-800 rounded-2xl transition-colors flex items-center min-w-[44px] min-h-[44px] justify-center"
            title="Lùi 10 giây"
            aria-label="Lùi 10 giây"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px] font-mono font-bold -ml-1">10</span>
          </button>

          <button
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/30 active:scale-95 transition-all shrink-0 gpu-accelerated"
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-slate-950" /> : <Play className="w-8 h-8 fill-slate-950 ml-1" />}
          </button>

          <button
            onClick={() => skipSeconds(10)}
            className="p-3 text-slate-300 hover:text-cyan-400 bg-slate-950 border border-slate-800 rounded-2xl transition-colors flex items-center min-w-[44px] min-h-[44px] justify-center"
            title="Tua 10 giây"
            aria-label="Tua 10 giây"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[10px] font-mono font-bold -ml-1">10</span>
          </button>

          <button
            onClick={playNextChapter}
            className="p-3 text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Tập tiếp theo"
            aria-label="Phát tập tiếp theo"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar: Volume + Speed */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">Tốc độ phát:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {speedOptions.map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeedRate(rate)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    playbackRate === rate ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white" aria-label="Tắt tiếng">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
              className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

        </div>

      </div>

      {/* Chapters Playlist Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <List className="w-4 h-4 text-cyan-400" /> Danh Sách Tập Của Story: {currentStory.title}
          </h3>
          <span className="text-xs text-slate-400 font-mono">{currentStory.chapters.length} tập</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {currentStory.chapters.map((ch) => {
            const isCurrent = ch.id === currentChapter.id;
            return (
              <div
                key={ch.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  playChapter(currentStory, ch);
                  const storyIdentifier = currentStory.slug || currentStory.id;
                  navigate(`/listen/${storyIdentifier}/${ch.id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playChapter(currentStory, ch);
                    const storyIdentifier = currentStory.slug || currentStory.id;
                    navigate(`/listen/${storyIdentifier}/${ch.id}`);
                  }
                }}
                className={`w-full text-left p-3.5 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${isCurrent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {ch.number}
                  </span>
                  <span className="text-xs truncate">{ch.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">{formatTime(ch.durationSeconds)}</span>
                  {ch.accessLevel === 'FREE' ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Miễn Phí</span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-center min-w-[50px]"><Crown className="w-2.5 h-2.5 inline-block mr-1 -mt-0.5"/>Premium</span>
                  )}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylistMenuChapterId(playlistMenuChapterId === ch.id ? null : ch.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-800"
                      title="Thêm vào danh sách phát"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>
                    {playlistMenuChapterId === ch.id && (
                      <AddToPlaylistMenu 
                        storyId={currentStory.id}
                        chapterId={ch.id}
                        onClose={() => setPlaylistMenuChapterId(null)}
                        onSuccess={handlePlaylistSuccess}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
