import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AudioStory, AudioChapter, SleepTimerOption, ListeningProgress, ViewRoute, AudioQuality } from '../types';
import { fetchProgress, saveProgress as apiSaveProgress, clearProgress, deleteProgress } from '../services/api/progress';
import { storage, createProgressKey, isValidProgressId } from '../services/storage';
import { useAuth } from './AuthContext';
import { apiRequest, getDataSourceMode } from '../services/apiClient';
import { EligibilityService } from '../services/repositories/EligibilityService';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function extractYouTubeId(urlOrCode?: string): string | null {
  if (!urlOrCode) return null;
  let target = urlOrCode;
  
  // First try to extract from iframe src attribute if it's HTML code
  if (urlOrCode.includes('<iframe')) {
    const srcMatch = urlOrCode.match(/src=["']([^"']+)["']/i);
    if (srcMatch) target = srcMatch[1];
  }
  
  // Try YouTube embed URL pattern first (most common for iframe)
  const embedMatch = target.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^"&?\/\s]{11})/);
  if (embedMatch) return embedMatch[1];
  
  // Then try other YouTube URL patterns
  const match = target.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match ? match[1] : null;
}

export type AudioErrorCode =
  | 'AUDIO_NOT_FOUND'
  | 'AUDIO_LOAD_FAILED'
  | 'NETWORK_OFFLINE'
  | 'INVALID_SLUG'
  | 'PLAYBACK_BLOCKED'
  | 'UNSUPPORTED_FORMAT'
  | 'CHAPTER_LOCKED';

export interface AudioErrorDetails {
  code: AudioErrorCode;
  message: string;
  isYouTubeError?: boolean;
  ytErrorCode?: number;
  canSkipNext?: boolean;
}

interface AudioPlayerContextType {
  // Current Audio State
  currentStory: AudioStory | null;
  currentChapter: AudioChapter | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  autoPlayNext: boolean;
  isDataSaverMode: boolean;
  sleepTimer: SleepTimerOption;
  sleepTimerRemaining: number;
  audioError: AudioErrorDetails | null;
  isOffline: boolean;
  
  // Navigation & View Route
  currentRoute: ViewRoute;
  selectedStorySlug: string | null;
  isFullPlayerOpen: boolean;
  isPlayerDismissed: boolean;
  isAuthModalOpen: boolean;
  isPremiumModalOpen: boolean;
  isAuthenticated: boolean;
  
  // User Data & Collections
  favorites: string[];
  isFavorite: (storyId: string) => boolean;
  listeningProgressMap: Record<string, ListeningProgress>;
  listeningHistory: ListeningProgress[];
  
  // Actions
  playChapter: (story: AudioStory, chapter: AudioChapter, startPosition?: number) => Promise<boolean>;
  togglePlayPause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skipSeconds: (delta: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  setSpeedRate: (rate: number) => void;
  setAutoPlayNextToggle: (enabled: boolean) => void;
  toggleDataSaverMode: (enabled?: boolean) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  setSleepTimerMode: (timer: SleepTimerOption) => void;
  playNextChapter: () => void;
  playPreviousChapter: () => void;
  retryPlayback: () => void;
  clearAudioError: () => void;
  saveProgressImmediately?: () => void;
  
  // UI Actions
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  
  // Navigation & User Actions
  navigateTo: (route: ViewRoute, storySlug?: string) => void;
  toggleFullPlayer: (open?: boolean) => void;
  dismissPlayer: () => void;
  restorePlayer: () => void;
  toggleFavorite: (storyId: string) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  removeHistoryItem: (storyId: string, chapterId: string) => void;
  clearHistory: () => void;
  resetAllData: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const activeEngineRef = useRef<'audio' | 'youtube'>('audio');
  const ytReadyRef = useRef<boolean>(false);
  const pendingYtIdRef = useRef<string | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);

  // Restore saved preferences
  const savedPrefs = storage.getPreferences();

  // Active playing item state
  const [currentStory, setCurrentStory] = useState<AudioStory | null>(null);
  const [currentChapter, setCurrentChapter] = useState<AudioChapter | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  // Restore & sanitize volume and mute
  const initialVol = savedPrefs.volume && savedPrefs.volume > 0 ? savedPrefs.volume : 0.8;
  const initialMuted = savedPrefs.volume <= 0 ? true : Boolean(savedPrefs.isMuted);

  const [volume, setVolumeState] = useState<number>(initialVol);
  const [isMuted, setIsMutedState] = useState<boolean>(initialMuted);
  const [playbackRate, setPlaybackRateState] = useState<number>(savedPrefs.playbackRate ?? 1.0);
  const [autoPlayNext, setAutoPlayNextState] = useState<boolean>(savedPrefs.autoPlayNext ?? true);
  const [isDataSaverMode, setIsDataSaverModeState] = useState<boolean>(savedPrefs.isDataSaverMode ?? true);
  const [audioQuality, setAudioQualityState] = useState<AudioQuality>(savedPrefs.audioQuality ?? 'AUTO');

  // Navigation state (backward compatibility)
  const [currentRoute, setCurrentRoute] = useState<ViewRoute>('home');
  const [selectedStorySlug, setSelectedStorySlug] = useState<string | null>(null);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isPlayerDismissed, setIsPlayerDismissed] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const mode = getDataSourceMode();
  const heartbeatIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User state restored from Storage Adapter
  const [favorites, setFavorites] = useState<string[]>([]);
  const [listeningProgressMap, setListeningProgressMap] = useState<Record<string, ListeningProgress>>({});
  const [listeningHistory, setListeningHistory] = useState<ListeningProgress[]>([]);

  // Refs to avoid stale closures in listeners
  const userRef = useRef<any>(user);
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated);
  const currentStoryRef = useRef<AudioStory | null>(currentStory);
  const currentChapterRef = useRef<AudioChapter | null>(currentChapter);
  const currentTimeRef = useRef<number>(currentTime);
  const durationRef = useRef<number>(duration);
  const listeningProgressMapRef = useRef<Record<string, ListeningProgress>>(listeningProgressMap);
  const listeningHistoryRef = useRef<ListeningProgress[]>(listeningHistory);
  const autoPlayNextRef = useRef<boolean>(autoPlayNext);
  const playbackRateRef = useRef<number>(playbackRate);

  // Load listening progress from localStorage on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id && isValidProgressId(user.id)) {
      const progressMap = storage.getProgressMap(user.id);
      setListeningProgressMap(progressMap);
      
      const history = storage.getListeningHistory(user.id);
      setListeningHistory(history);
      
      const userFavorites = storage.getFavorites(user.id);
      setFavorites(userFavorites);
    } else {
      // Clear data when not authenticated
      setListeningProgressMap({});
      setListeningHistory([]);
      setFavorites([]);
    }
  }, [isAuthenticated, user?.id]);

  // Restore current audio state on mount
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    const currentAudio = storage.getCurrentAudio();
    if (currentAudio) {
      console.log('[AudioPlayerContext] Restoring current audio from storage:', currentAudio);
      // Don't auto-play, just log for debugging
      // The AudioPlayerView will handle loading from URL
    }
  }, [authLoading]);

  // Update refs when state changes
  useEffect(() => {
    userRef.current = user;
    isAuthenticatedRef.current = isAuthenticated;
  }, [user, isAuthenticated]);

  useEffect(() => {
    currentStoryRef.current = currentStory;
    currentChapterRef.current = currentChapter;

    // Setup Media Session API for background playback
    if ('mediaSession' in navigator && currentStory && currentChapter) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStory.title,
        artist: currentStory.authorName || 'Unknown',
        album: 'TopTruyenAudio',
        artwork: currentStory.coverUrl ? [{ src: currentStory.coverUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
      });

      // Set up action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlayPause();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && !isNaN(details.seekTime)) {
          seek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        skipSeconds(offset);
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        skipSeconds(-offset);
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextChapter();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPreviousChapter();
      });
    }
  }, [currentStory, currentChapter]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
    
    // Update Media Session position state for background playback
    if ('mediaSession' in navigator && duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: playbackRate,
        position: currentTime,
      });
    }
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Update Media Session playback state when playing state changes
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    listeningProgressMapRef.current = listeningProgressMap;
  }, [listeningProgressMap]);

  useEffect(() => {
    listeningHistoryRef.current = listeningHistory;
  }, [listeningHistory]);

  useEffect(() => {
    autoPlayNextRef.current = autoPlayNext;
  }, [autoPlayNext]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // Helper to synchronize website audio muted & volume of the audio element before playing
  const syncAudioStateBeforePlay = (): number => {
    let targetVol = volume;
    if (targetVol <= 0) {
      targetVol = 0.8;
      setVolumeState(0.8);
    }

    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : targetVol;
      audioRef.current.playbackRate = playbackRate;
    }

    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (activeEngineRef.current === 'youtube') {
          if (isMuted) {
            ytPlayerRef.current.mute?.();
            ytPlayerRef.current.setVolume?.(0);
          } else {
            ytPlayerRef.current.unMute?.();
            ytPlayerRef.current.setVolume?.(targetVol * 100);
          }
          ytPlayerRef.current.setPlaybackRate?.(playbackRate);
        } else {
          ytPlayerRef.current.mute?.();
          ytPlayerRef.current.setVolume?.(0);
        }
      } catch (e) {}
    }

    return targetVol;
  };

  const ensureSoundBeforePlay = (): number => {
    let targetVol = volume;
    if (targetVol <= 0) {
      targetVol = 0.8;
      setVolumeState(0.8);
    }
    if (isMuted) {
      setIsMutedState(false);
      storage.savePreferences({ volume: targetVol, isMuted: false });
    }

    return syncAudioStateBeforePlay();
  };

  const toggleDataSaverMode = (enabled?: boolean) => {
    setIsDataSaverModeState(prev => {
      const nextVal = enabled !== undefined ? enabled : !prev;
      storage.savePreferences({ isDataSaverMode: nextVal });
      return nextVal;
    });
  };

  const pauseAudio = () => {
    saveProgressImmediately();
    // Release wake lock when pausing
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
    if (activeEngineRef.current === 'youtube') {
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (e) {}
      }
      setIsPlaying(false);
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeAudio = async () => {
    // Request wake lock when playing
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (e) {
        console.log('[AudioPlayerContext] Wake Lock request failed:', e);
      }
    }
    if (activeEngineRef.current === 'youtube') {
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch (e) {
          setIsPlaying(false);
        }
      }
    } else if (audioRef.current) {
      ensureSoundBeforePlay();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Error & Network States
  const [audioError, setAudioError] = useState<AudioErrorDetails | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Sleep timer state
  const [sleepTimer, setSleepTimer] = useState<SleepTimerOption>(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number>(0);

  // Synchronous immediate save to localStorage (reads directly from latest refs)
  const saveProgressImmediately = useCallback(() => {
    const userObj = userRef.current;
    const isAuth = isAuthenticatedRef.current;

    if (!isAuth || !userObj?.id || !isValidProgressId(userObj.id)) return;

    const st = currentStoryRef.current;
    const ch = currentChapterRef.current;
    if (!st || !ch || !isValidProgressId(ch.id)) return;

    let pos = currentTimeRef.current;
    let dur = durationRef.current;

    if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
          const ytPos = ytPlayerRef.current.getCurrentTime();
          if (typeof ytPos === 'number' && !isNaN(ytPos) && isFinite(ytPos) && ytPos > 0) {
            pos = ytPos;
          }
        }
        if (typeof ytPlayerRef.current.getDuration === 'function') {
          const ytDur = ytPlayerRef.current.getDuration();
          if (typeof ytDur === 'number' && !isNaN(ytDur) && isFinite(ytDur) && ytDur > 0) {
            dur = ytDur;
          }
        }
      } catch (e) {}
    } else if (audioRef.current) {
      const audioPos = audioRef.current.currentTime;
      const audioDur = audioRef.current.duration;
      if (typeof audioPos === 'number' && !isNaN(audioPos) && isFinite(audioPos) && audioPos > 0) {
        pos = audioPos;
      }
      if (typeof audioDur === 'number' && !isNaN(audioDur) && isFinite(audioDur) && audioDur > 0) {
        dur = audioDur;
      }
    }

    // Strict validation guards:
    // Do not save invalid values, NaN, negative positions, missing IDs, positions before loadedmetadata,
    // or a temporary zero that could overwrite valid stored progress.
    if (
      pos === null ||
      pos === undefined ||
      isNaN(pos) ||
      !isFinite(pos) ||
      pos <= 0
    ) {
      return;
    }

    if (
      dur === null ||
      dur === undefined ||
      isNaN(dur) ||
      !isFinite(dur) ||
      dur <= 0
    ) {
      return;
    }

    const userId = userObj.id;
    const chapterId = ch.id;
    const progressKey = createProgressKey(userId, chapterId);

    const existingMap = listeningProgressMapRef.current;
    const existingProg = existingMap[progressKey] || existingMap[chapterId];

    const remaining = dur - pos;
    const isComp = dur > 0 && (remaining <= 15 || (pos / dur) >= 0.95);

    const prog: ListeningProgress = {
      storyId: st.id,
      chapterId: ch.id,
      chapterNumber: ch.number,
      positionSeconds: Math.floor(pos),
      durationSeconds: Math.floor(dur),
      updatedAt: new Date().toISOString(),
      completed: isComp,
      syncStatus: 'LOCAL_ONLY' as const,
      version: existingProg?.version,
    };

    const nextMap = { ...existingMap, [progressKey]: prog };
    listeningProgressMapRef.current = nextMap;
    storage.saveProgressMap(nextMap, userId);

    const currentHistory = listeningHistoryRef.current;
    const filteredHistory = currentHistory.filter((p) => p.storyId !== st.id || p.chapterId !== ch.id);
    const nextHistory = [prog, ...filteredHistory];
    listeningHistoryRef.current = nextHistory;
    storage.saveListeningHistory(nextHistory, userId);

    lastSaveTimeRef.current = Date.now();

    setListeningProgressMap(nextMap);
    setListeningHistory(nextHistory);
  }, []);

  // Throttled 10-second localStorage & backend save cycle
  const saveProgressThrottled = (
    storyId: string,
    chapterId: string,
    chapterNumber: number,
    position: number,
    dur: number
  ) => {
    const userObj = userRef.current;
    const isAuth = isAuthenticatedRef.current;

    if (!isAuth || !userObj?.id || !isValidProgressId(userObj.id) || !isValidProgressId(chapterId)) return;

    if (
      position === null ||
      position === undefined ||
      isNaN(position) ||
      !isFinite(position) ||
      position <= 0
    ) {
      return;
    }

    if (
      dur === null ||
      dur === undefined ||
      isNaN(dur) ||
      !isFinite(dur) ||
      dur <= 0
    ) {
      return;
    }

    const now = Date.now();
    // Throttle to every 10 seconds
    if (now - lastSaveTimeRef.current < 10000) {
      return;
    }
    lastSaveTimeRef.current = now;

    const remaining = dur - position;
    const isComp = dur > 0 && (remaining <= 15 || (position / dur) >= 0.95);
    const progressKey = createProgressKey(userObj.id, chapterId);

    const existingMap = listeningProgressMapRef.current;
    const existingProg = existingMap[progressKey] || existingMap[chapterId];

    const prog: ListeningProgress = {
      storyId,
      chapterId,
      chapterNumber,
      positionSeconds: Math.floor(position),
      durationSeconds: Math.floor(dur),
      updatedAt: new Date().toISOString(),
      completed: isComp,
      syncStatus: 'LOCAL_ONLY' as const,
      version: existingProg?.version,
    };

    const nextMap = { ...existingMap, [progressKey]: prog };
    listeningProgressMapRef.current = nextMap;
    setListeningProgressMap(nextMap);
    storage.saveProgressMap(nextMap, userObj.id);

    const currentHistory = listeningHistoryRef.current;
    const filteredHistory = currentHistory.filter((p) => p.storyId !== storyId || p.chapterId !== chapterId);
    const nextHistory = [prog, ...filteredHistory];
    listeningHistoryRef.current = nextHistory;
    setListeningHistory(nextHistory);
    storage.saveListeningHistory(nextHistory, userObj.id);

    // Backend sync (10s cycle) - separate from emergency-save
    if (isAuth) {
      apiSaveProgress(chapterId, {
        storyId,
        positionSeconds: Math.floor(position),
        durationSeconds: Math.floor(dur),
        completed: isComp,
        playbackMode: activeEngineRef.current === 'youtube' ? 'VIDEO' : 'AUDIO',
        playbackRate: playbackRateRef.current,
        version: prog.version,
      })
        .then((savedProg) => {
          if (savedProg && userObj?.id) {
            setListeningProgressMap((prev) => {
              const next = { ...prev };
              const pk = createProgressKey(userObj.id, chapterId);
              if (next[pk] || next[chapterId]) {
                const targetKey = next[pk] ? pk : chapterId;
                next[targetKey] = {
                  ...next[targetKey],
                  syncStatus: 'LOCAL_ONLY' as const,
                  version: savedProg.version,
                  updatedAt: (savedProg.lastPlayedAt || savedProg.updatedAt) || next[targetKey].updatedAt,
                };
                storage.saveProgressMap(next, userObj.id);
              }
              return next;
            });
          }
        })
        .catch((err) => console.error(err));
    }
  };

  // Helper function routing to immediate or throttled progress save
  const saveProgress = (
    storyId: string,
    chapterId: string,
    chapterNumber: number,
    position: number,
    dur: number,
    forceImmediate = false
  ) => {
    if (forceImmediate) {
      saveProgressImmediately();
    } else {
      saveProgressThrottled(storyId, chapterId, chapterNumber, position, dur);
    }
  };


  // YouTube IFrame Player API Script Load and Initialization
  useEffect(() => {
    const initYouTubePlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('youtube-audio-player-element', {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              ytReadyRef.current = true;
              console.log('[AudioPlayerContext] YouTube player ready. Engine:', activeEngineRef.current);
              try {
                if (activeEngineRef.current === 'youtube') {
                  if (isMuted) event.target.mute();
                  else event.target.unMute();
                  event.target.setVolume(isMuted ? 0 : (volume > 0 ? volume : 0.8) * 100);
                } else {
                  event.target.mute();
                  event.target.setVolume(0);
                }
                event.target.setPlaybackRate(playbackRate);
              } catch (e) {}

              if (pendingYtIdRef.current) {
                const videoId = pendingYtIdRef.current;
                pendingYtIdRef.current = null;
                event.target.loadVideoById(videoId);
                if (activeEngineRef.current === 'youtube') {
                  setIsPlaying(true);
                }
              }
            },
            onStateChange: (event: any) => {
              if (activeEngineRef.current !== 'youtube') {
                if (event.data === 1) {
                  try {
                    event.target.mute();
                    event.target.setVolume(0);
                  } catch (e) {}
                }
                return;
              }
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                setAudioError(null);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                const dur = event.target.getDuration() || 0;
                if (currentStoryRef.current && currentChapterRef.current) {
                  saveProgress(
                    currentStoryRef.current.id,
                    currentChapterRef.current.id,
                    currentChapterRef.current.number,
                    dur,
                    dur,
                    true
                  );
                }
                if (autoPlayNextRef.current) {
                  playNextChapter();
                }
              }
            },
            onError: (event: any) => {
              const code = event.data;
              console.warn('YouTube Player error code:', code);
              setIsPlaying(false);

              let errorMsg = 'Không thể phát âm thanh từ nguồn YouTube.';
              if (code === 101 || code === 150) {
                errorMsg = 'Video YouTube bị giới hạn nhúng hoặc hạn chế bản quyền bởi tác giả (Mã 101/150).';
              } else if (code === 100) {
                errorMsg = 'Video YouTube không tồn tại, riêng tư hoặc đã bị gỡ (Mã 100).';
              } else if (code === 2 || code === 5) {
                errorMsg = 'Lỗi ID/link video YouTube hoặc trình phát HTML5 không hỗ trợ (Mã 2/5).';
              } else {
                errorMsg = `Lỗi kết nối trình phát YouTube (Mã lỗi ${code}).`;
              }

              const chapters = Array.isArray(currentStoryRef.current?.chapters) ? currentStoryRef.current.chapters : [];
              const hasNext = Boolean(
                currentStoryRef.current &&
                currentChapterRef.current &&
                chapters.findIndex((c) => c.id === currentChapterRef.current?.id) <
                  chapters.length - 1
              );

              setAudioError({
                code: 'AUDIO_LOAD_FAILED',
                message: errorMsg,
                isYouTubeError: true,
                ytErrorCode: code,
                canSkipNext: hasNext,
              });
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YouTube player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    } else {
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevOnReady === 'function') prevOnReady();
        initYouTubePlayer();
      };
    }
  }, []);

  // Sync YouTube Player Current Time & Duration
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (activeEngineRef.current === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const curr = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(curr);
            if (dur > 0) setDuration(dur);

            if (currentStoryRef.current && currentChapterRef.current) {
              saveProgress(
                currentStoryRef.current.id,
                currentChapterRef.current.id,
                currentChapterRef.current.number,
                curr,
                dur || duration,
                false
              );
            }
          }
        } catch (e) {}
      }
    }, 300);

    return () => clearInterval(syncInterval);
  }, [duration]);

  // Audio Session Heartbeat Logic (Reports listening progress every 30 seconds)
  useEffect(() => {
    const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

    const stopHeartbeat = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };

    const sendHeartbeat = async () => {
      if (!isAuthenticated) return;

      const activeStory = currentStoryRef.current;
      const activeChapter = currentChapterRef.current;
      if (!activeStory || !activeChapter) return;

      const currentPos = activeEngineRef.current === 'youtube' && ytPlayerRef.current?.getCurrentTime
        ? Math.floor(ytPlayerRef.current.getCurrentTime())
        : Math.floor(audioRef.current?.currentTime || 0);

      // 1. Sync local listening progress
      saveProgress(
        activeStory.id,
        activeChapter.id,
        activeChapter.number,
        currentPos,
        duration || activeChapter.durationSeconds || 0,
        true
      );

      // 2. Accumulate valid listening seconds locally for stats & eligibility
      const validMap = EligibilityService.getValidListeningSecondsMap();
      const currentValid = validMap[activeStory.id] || 0;
      EligibilityService.setValidListeningSeconds(activeStory.id, currentValid + 30);

      // 3. Report heartbeat to backend in API mode
      if (mode === 'API') {
        let activeSessionId = sessionId;

        if (!activeSessionId) {
          try {
            const session = await apiRequest<{ _id: string }>('/listening/sessions', {
              method: 'POST',
              body: JSON.stringify({
                storySlug: activeStory.slug,
                chapterSlug: activeChapter.slug,
                startPosition: currentPos,
                playbackRate: playbackRate,
              }),
            });
            activeSessionId = session._id;
            setSessionId(session._id);
          } catch (startErr) {
            console.warn('[Heartbeat] Could not initialize session:', startErr);
            return;
          }
        }

        try {
          await apiRequest(
            `/listening/sessions/${activeSessionId}/heartbeat`,
            {
              method: 'PATCH',
              body: JSON.stringify({
                currentPosition: currentPos,
                playbackRate: playbackRate,
              }),
            }
          );
        } catch (err: any) {
          console.warn('[Heartbeat] Failed to report heartbeat to backend:', err);
          if (err?.status === 404) {
            setSessionId(null);
          }
        }
      }
    };

    if (isPlaying && isAuthenticated) {
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    } else {
      stopHeartbeat();
    }

    return () => stopHeartbeat();
  }, [isPlaying, sessionId, isAuthenticated, mode, playbackRate, duration]);

  // Initialize HTML5 Audio Element ONCE on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : (volume > 0 ? volume : 0.8);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    // Create background video element for iOS background audio workaround
    const backgroundVideo = document.createElement('video');
    backgroundVideo.src = '/branding/video_loop.mp4';
    backgroundVideo.muted = true;
    backgroundVideo.loop = true;
    backgroundVideo.playsInline = true;
    backgroundVideo.style.position = 'fixed';
    backgroundVideo.style.top = '50%';
    backgroundVideo.style.left = '50%';
    backgroundVideo.style.transform = 'translate(-50%, -50%)';
    backgroundVideo.style.width = '200px';
    backgroundVideo.style.height = '112px';
    backgroundVideo.style.objectFit = 'cover';
    backgroundVideo.style.zIndex = '9999';
    backgroundVideo.style.opacity = '0.3';
    backgroundVideo.style.pointerEvents = 'none';
    backgroundVideo.style.borderRadius = '12px';
    backgroundVideo.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    backgroundVideo.preload = 'auto';
    document.body.appendChild(backgroundVideo);
    backgroundVideoRef.current = backgroundVideo;

    // Handle visibility change - show video when hidden, hide when visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Hide video when app comes to foreground
        try {
          if (backgroundVideoRef.current) {
            backgroundVideoRef.current.style.opacity = '0';
            backgroundVideoRef.current.pause();
          }
          // Resume audio if it was playing
          if (isPlaying && audioRef.current && audioRef.current.paused) {
            await audioRef.current.play();
          }
        } catch (e) {
          console.log('[AudioPlayerContext] Failed to handle visibility change:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const onTimeUpdate = () => {
      if (activeEngineRef.current !== 'audio') return;
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);

      const st = currentStoryRef.current;
      const ch = currentChapterRef.current;
      if (st && ch) {
        saveProgress(st.id, ch.id, ch.number, audio.currentTime, audio.duration || 0, false);
      }
    };

    const onEnded = async () => {
      if (activeEngineRef.current !== 'audio') return;
      setIsPlaying(false);
      const st = currentStoryRef.current;
      const ch = currentChapterRef.current;
      if (st && ch) {
        saveProgress(st.id, ch.id, ch.number, audio.duration || 0, audio.duration || 0, true);
        
        if (sessionId && mode === 'API' && isAuthenticated) {
          try {
            await apiRequest(`/listening/sessions/${sessionId}/complete`, { method: 'POST' });
          } catch (err) {
            console.warn('Failed to complete session:', err);
          }
        }
      }
      if (autoPlayNextRef.current) {
        playNextChapter();
      }
    };

    const onError = () => {
      if (activeEngineRef.current !== 'audio') return;
      setIsPlaying(false);
      if (!navigator.onLine) {
        setAudioError({
          code: 'NETWORK_OFFLINE',
          message: 'Mất kết nối Internet. Vui lòng kiểm tra lại mạng.',
        });
      } else {
        setAudioError({
          code: 'AUDIO_LOAD_FAILED',
          message: 'Không thể tải tệp âm thanh. Vui lòng thử lại hoặc chọn tập khác.',
        });
      }
    };

    const onPlay = () => {
      if (activeEngineRef.current === 'audio') {
        setIsPlaying(true);
      }
    };

    const onPause = () => {
      if (activeEngineRef.current === 'audio') {
        setIsPlaying(false);
        saveProgressImmediately();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.pause();
      // Release wake lock on cleanup
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      // Cleanup background video
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.pause();
        backgroundVideoRef.current.remove();
        backgroundVideoRef.current = null;
      }
    };
  }, [saveProgressImmediately]);

  // Unload, pagehide, & visibility change lifecycle listeners (registered once)
  useEffect(() => {
    const handleUnloadEvents = () => {
      saveProgressImmediately();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgressImmediately();
      }
    };

    window.addEventListener('beforeunload', handleUnloadEvents);
    window.addEventListener('pagehide', handleUnloadEvents);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnloadEvents);
      window.removeEventListener('pagehide', handleUnloadEvents);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveProgressImmediately]);

  // Sync video visibility with audio playback state
  useEffect(() => {
    if (backgroundVideoRef.current) {
      if (isPlaying && activeEngineRef.current === 'audio') {
        // Show video when audio is playing
        backgroundVideoRef.current.style.opacity = '0.3';
        backgroundVideoRef.current.play().catch(e => {
          console.log('[AudioPlayerContext] Failed to play background video:', e);
        });
      } else {
        // Hide video when audio is paused or not using audio engine
        backgroundVideoRef.current.style.opacity = '0';
        backgroundVideoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync volume & rate across both audio engines
  useEffect(() => {
    const effectiveVol = volume > 0 ? volume : 0.8;
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : effectiveVol;
      audioRef.current.playbackRate = playbackRate;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (activeEngineRef.current === 'audio') {
          ytPlayerRef.current.mute?.();
          ytPlayerRef.current.setVolume?.(0);
        } else {
          if (isMuted) {
            ytPlayerRef.current.mute?.();
            ytPlayerRef.current.setVolume?.(0);
          } else {
            ytPlayerRef.current.unMute?.();
            ytPlayerRef.current.setVolume?.(effectiveVol * 100);
          }
        }
        ytPlayerRef.current.setPlaybackRate?.(playbackRate);
      } catch (e) {}
    }
  }, [volume, isMuted, playbackRate]);

  // Media Session API Implementation for Background Playback
  useEffect(() => {
    if ('mediaSession' in navigator && currentStory && currentChapter) {
      const artwork = currentStory.coverUrl ? [
        { src: currentStory.coverUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: currentStory.coverUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: currentStory.coverUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: currentStory.coverUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: currentStory.coverUrl, sizes: '384x384', type: 'image/jpeg' },
        { src: currentStory.coverUrl, sizes: '512x512', type: 'image/jpeg' },
      ] : [];

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentChapter.title,
        artist: currentStory.authorName || currentStory.narratorName || 'Radio Truyện Audio',
        album: currentStory.title,
        artwork: artwork
      });
    }
  }, [currentStory, currentChapter]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    if ('mediaSession' in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: playbackRate,
          position: currentTime
        });
      } catch (e) {}
    }
  }, [currentTime, duration, playbackRate]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      const handlers: [MediaSessionAction, (details: MediaSessionActionDetails) => void][] = [
        ['play', () => togglePlayPause()],
        ['pause', () => togglePlayPause()],
        ['previoustrack', () => playPreviousChapter()],
        ['nexttrack', () => playNextChapter()],
        ['seekbackward', (details) => skipSeconds(-(details.seekOffset || 10))],
        ['seekforward', (details) => skipSeconds(details.seekOffset || 10)],
        ['seekto', (details) => {
          if (details.seekTime !== undefined) {
            seek(details.seekTime);
          }
        }],
        ['stop', () => dismissPlayer()]
      ];

      for (const [action, handler] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {}
      }

      return () => {
        for (const [action] of handlers) {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch (error) {}
        }
      };
    }
  }, [currentStory, currentChapter]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimer <= 0) {
      setSleepTimerRemaining(0);
      return;
    }

    setSleepTimerRemaining(sleepTimer * 60);

    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          pauseAudio();
          saveProgressImmediately();
          setSleepTimer(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimer, saveProgressImmediately]);

  // Actions
  const playChapter = async (story: AudioStory, chapter: AudioChapter, startPosition?: number): Promise<boolean> => {
    saveProgressImmediately();
    setAudioError(null);
    setIsPlayerDismissed(false);

    if (authLoading) {
      // Wait for auth to load before checking
      return false;
    }

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return false;
    }

    // Check if chapter exists
    if (!chapter) {
      console.error('[AudioPlayerContext] playChapter called with undefined chapter');
      setAudioError({ code: 'AUDIO_NOT_FOUND', message: 'Không tìm thấy tập audio' });
      return false;
    }

    // Check Access Level for FREE vs PREMIUM
    const isPremiumItem = chapter.accessLevel === 'PREMIUM';
    const userIsPremium = user?.membership?.tier === 'PREMIUM';

    if (isPremiumItem && !userIsPremium) {
      setIsPremiumModalOpen(true);
      return false;
    }

    let finalAudioUrl = chapter.audioUrl;

    if (mode === 'API' && !finalAudioUrl) {
      try {
        // Validate story.slug and chapter.slug before constructing URL
        if (!story.slug || !chapter.slug) {
          console.error('[AudioPlayerContext] Invalid story.slug or chapter.slug:', { storySlug: story.slug, chapterSlug: chapter.slug });
          setAudioError({
            code: 'INVALID_SLUG',
            message: 'Invalid story or chapter slug',
          });
          return false;
        }

        const accessData = await apiRequest<{ audioUrl: string; canListen: boolean; isGuest?: boolean; guestLimitMinutes?: number }>(
          `/stories/${story.slug}/chapters/${chapter.slug}/access`
        );
        finalAudioUrl = accessData.audioUrl;
        
        // Handle guest limit
        if (accessData.isGuest && accessData.guestLimitMinutes) {
          const guestLimitMs = accessData.guestLimitMinutes * 60 * 1000;
          const guestListenKey = 'guest_listen_start';
          const listenStart = localStorage.getItem(guestListenKey);
          
          if (!listenStart) {
            localStorage.setItem(guestListenKey, Date.now().toString());
          } else {
            const elapsed = Date.now() - parseInt(listenStart);
            if (elapsed >= guestLimitMs) {
              setIsAuthModalOpen(true);
              return false;
            }
          }
        }
      } catch (err: any) {
        if (err.status === 401) {
          setIsAuthModalOpen(true);
          return false;
        }
        if (err.status === 403) {
          setIsPremiumModalOpen(true);
          return false;
        }
        setAudioError({
          code: 'AUDIO_LOAD_FAILED',
          message: err.message || 'Không thể lấy quyền truy cập âm thanh.',
        });
        return false;
      }
    }

    // Extract YouTube ID if present in any of the fields
    const audioUrlYtId = extractYouTubeId(finalAudioUrl);
    const fallbackYtId =
      extractYouTubeId(chapter.videoIframeUrl) ||
      extractYouTubeId(chapter.iframeCode) ||
      extractYouTubeId(chapter.iframeUrl) ||
      (chapter.number === 1 ? (extractYouTubeId(story.iframeUrl) || extractYouTubeId(story.iframeCode)) : null) ||
      extractYouTubeId(story.iframeUrl) ||
      extractYouTubeId(story.iframeCode);

    const ytId = audioUrlYtId || fallbackYtId;

    // When admin provides an iframe, prefer it as the audio source for Chapter 1 or whenever explicitly attached
    const isGenericOrMissingAudio = !finalAudioUrl || finalAudioUrl.includes('SoundHelix') || finalAudioUrl.trim() === '';
    const shouldPreferIframeAudio = Boolean(
      ytId && (isGenericOrMissingAudio || chapter.number === 1 || story.isVideoStory || chapter.videoIframeUrl || chapter.iframeCode)
    );

    const hasWebAudio = Boolean(finalAudioUrl && !audioUrlYtId && !shouldPreferIframeAudio);

    setCurrentStory(story);
    setCurrentChapter({ ...chapter, audioUrl: finalAudioUrl || chapter.audioUrl });

    // Save current audio state to localStorage for restoration after reload
    storage.saveCurrentAudio({
      storyId: story.id,
      chapterId: chapter.id,
      storySlug: story.slug,
      chapterNumber: chapter.number,
      timestamp: Date.now(),
    });

    // If no audio source available but story has iframe, iframe is the audio source
    if (!ytId && !hasWebAudio) {
      const hasIframe = Boolean(
        chapter.iframeCode || chapter.videoIframeUrl || chapter.iframeUrl ||
        story.iframeCode || story.iframeUrl
      );
      
      if (hasIframe) {
        console.log('[AudioPlayerContext] Using iframe as audio source');
        // Iframe is the audio source, return true without error
        // The iframe will be rendered in the UI
        return true;
      }
      
      console.error('[AudioPlayerContext] No audio source available:', {
        finalAudioUrl,
        ytId,
        shouldPreferIframeAudio,
        hasWebAudio,
        chapter: chapter.id,
        story: story.id,
      });
      setAudioError({
        code: 'AUDIO_NOT_FOUND',
        message: 'Không tìm thấy nguồn âm thanh. Truyện này có thể cần cập nhật.',
      });
      return false;
    }

    if (mode === 'API' && isAuthenticated) {
      // Fire session creation asynchronously to not block the play() user gesture
      apiRequest<{ _id: string }>(
        '/listening/sessions',
        {
          method: 'POST',
          body: JSON.stringify({
            storySlug: story.slug,
            chapterSlug: chapter.slug,
            startPosition: startPosition || 0,
            playbackRate: playbackRate
          })
        }
      ).then(session => {
        setSessionId(session._id);
      }).catch(err => {
        console.warn('Failed to start listening session:', err);
        setSessionId(null);
      });
    } else {
      setSessionId(null);
    }

    if (hasWebAudio) {
      console.log('[AudioPlayerContext] Primary player assigned: HTML5 Audio');
      // Play via Standard HTML5 Audio Engine
      activeEngineRef.current = 'audio';
      
      if (ytId) {
        if (ytReadyRef.current && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.mute();
            ytPlayerRef.current.setVolume(0);
            ytPlayerRef.current.loadVideoById(ytId);
          } catch(e) {}
        } else {
          pendingYtIdRef.current = ytId;
        }
      } else {
        if (ytReadyRef.current && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {}
        }
      }

      if (!finalAudioUrl) {
        setAudioError({
          code: 'AUDIO_NOT_FOUND',
          message: 'Tệp âm thanh không tồn tại hoặc bạn không có quyền truy cập.',
        });
        return false;
      }

      
      if (audioRef.current) {
        ensureSoundBeforePlay();
        audioRef.current.src = finalAudioUrl;
        
        let startPos = startPosition || 0;
        if (startPosition === undefined) {
          const pk = user?.id && isValidProgressId(user.id) ? createProgressKey(user.id, chapter.id) : chapter.id;
          const prog = listeningProgressMap[pk] || listeningProgressMap[chapter.id];
          if (prog && prog.chapterId === chapter.id && !prog.completed && prog.positionSeconds > 5) {
            startPos = prog.positionSeconds;
          }
        }
        
        const onLoadedMetadata = () => {
          if (startPos > 0 && audioRef.current) {
             audioRef.current.currentTime = startPos;
          }
          audioRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
        audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);

        try {

          await audioRef.current.play();
          setIsPlaying(true);
          return true;
        } catch (err) {
          console.warn('Play prevented or error:', err);
          setIsPlaying(false);
          setAudioError({
            code: 'PLAYBACK_BLOCKED',
            message: 'Trình duyệt chặn tự động phát hoặc tệp âm thanh gặp sự cố.',
          });
          return false;
        }
      }
    } else if (ytId) {
      console.log('[AudioPlayerContext] Primary player assigned: YouTube IFrame API');
      // Play via YouTube Engine
      activeEngineRef.current = 'youtube';
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.muted = true;
      }

      
      if (ytReadyRef.current && ytPlayerRef.current) {
        try {
          if (isMuted) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
          ytPlayerRef.current.setPlaybackRate(playbackRate);
          
          let startPos = startPosition || 0;
          if (startPosition === undefined) {
            const pk = user?.id && isValidProgressId(user.id) ? createProgressKey(user.id, chapter.id) : chapter.id;
            const prog = listeningProgressMap[pk] || listeningProgressMap[chapter.id];
            if (prog && prog.chapterId === chapter.id && !prog.completed && prog.positionSeconds > 5) {
              startPos = prog.positionSeconds;
            }
          }
          
          ytPlayerRef.current.loadVideoById(ytId, startPos);
          setIsPlaying(true);
          return true;

        } catch (err) {
          console.warn('YouTube loadVideoById error:', err);
        }
      } else {
        pendingYtIdRef.current = ytId;
        setIsPlaying(true);
        return true;
      }
    }

    return false;
  };

  const togglePlayPause = async () => {
    if (!currentChapter || !currentStory) return;
    setAudioError(null);

    if (authLoading) {
      // Wait for auth to load before checking
      return;
    }

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (activeEngineRef.current === 'youtube') {
      if (isPlaying) {
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {}
        }
        setIsPlaying(false);
      } else {
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch (e) {
            setIsPlaying(false);
          }
        } else {
          playChapter(currentStory, currentChapter);
        }
      }
    } else {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        if (ytPlayerRef.current && ytReadyRef.current) {
          try { ytPlayerRef.current.pauseVideo(); } catch(e) {}
        }
        setIsPlaying(false);
      } else {
        ensureSoundBeforePlay();
        if (!audioRef.current.src || audioRef.current.src === '' || audioRef.current.src === window.location.href) {
          playChapter(currentStory, currentChapter);
          return;
        }
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            if (ytPlayerRef.current && ytReadyRef.current) {
              try {
                ytPlayerRef.current.mute?.();
                ytPlayerRef.current.setVolume?.(0);
                ytPlayerRef.current.playVideo?.();
              } catch (e) {}
            }
          })
          .catch(() => {
            setIsPlaying(false);
            setAudioError({
              code: 'PLAYBACK_BLOCKED',
              message: 'Không thể phát audio. Nhấn vào đây để thử lại.',
            });
          });
      }
    }
  };

  const retryPlayback = () => {
    setAudioError(null);
    if (currentStory && currentChapter) {
      playChapter(currentStory, currentChapter);
    }
  };

  const clearAudioError = () => {
    setAudioError(null);
  };

  
  const seek = (seconds: number) => {
    currentTimeRef.current = seconds;
    setCurrentTime(seconds);
    
    if (activeEngineRef.current === 'youtube') {

      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.seekTo(seconds, true);
        } catch (e) {}
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.mute();
          ytPlayerRef.current.setVolume(0);
          ytPlayerRef.current.seekTo(seconds, true);
        } catch (e) {}
      }
    }
    saveProgressImmediately();
  };

  const skipSeconds = (delta: number) => {
    const newTime = Math.max(0, Math.min(currentTime + delta, duration || 999999));
    seek(newTime);
  };

  const setVolumeLevel = (vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    const nextMuted = clampedVol === 0;
    const saveVol = clampedVol > 0 ? clampedVol : (volume > 0 ? volume : 0.8);

    setVolumeState(saveVol);
    setIsMutedState(nextMuted);
    storage.savePreferences({ volume: saveVol, isMuted: nextMuted });

    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      audioRef.current.volume = nextMuted ? 0 : saveVol;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (activeEngineRef.current === 'audio') {
          ytPlayerRef.current.mute();
          ytPlayerRef.current.setVolume(0);
        } else {
          ytPlayerRef.current.setVolume(saveVol * 100);
          if (nextMuted) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
        }
      } catch (e) {}
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    let nextVol = volume;
    if (!nextMute && nextVol <= 0) {
      nextVol = 0.8;
      setVolumeState(0.8);
    }
    setIsMutedState(nextMute);
    storage.savePreferences({ volume: nextVol, isMuted: nextMute });

    if (audioRef.current) {
      audioRef.current.muted = nextMute;
      audioRef.current.volume = nextMute ? 0 : nextVol;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (activeEngineRef.current === 'audio') {
          ytPlayerRef.current.mute();
          ytPlayerRef.current.setVolume(0);
        } else {
          if (nextMute) {
            ytPlayerRef.current.mute();
            ytPlayerRef.current.setVolume(0);
          } else {
            ytPlayerRef.current.unMute();
            ytPlayerRef.current.setVolume(nextVol * 100);
          }
        }
      } catch (e) {}
    }
  };

  const setSpeedRate = (rate: number) => {
    setPlaybackRateState(rate);
    storage.savePreferences({ playbackRate: rate });

    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch (e) {}
    }
  };

  const setAutoPlayNextToggle = (enabled: boolean) => {
    setAutoPlayNextState(enabled);
    storage.savePreferences({ autoPlayNext: enabled });
  };

  const setSleepTimerMode = (timer: SleepTimerOption) => {
    setSleepTimer(timer);
  };

  const playNextChapter = () => {
    if (!currentStory || !currentChapter) return;
    const chapters = Array.isArray(currentStory.chapters) ? currentStory.chapters : [];
    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      playChapter(currentStory, nextChapter);
    }
  };

  const playPreviousChapter = () => {
    if (!currentStory || !currentChapter) return;
    const chapters = Array.isArray(currentStory.chapters) ? currentStory.chapters : [];
    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      playChapter(currentStory, prevChapter);
    }
  };

  const navigateTo = (route: ViewRoute, storySlug?: string) => {
    saveProgressImmediately();
    setCurrentRoute(route);
    if (storySlug) {
      setSelectedStorySlug(storySlug);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFullPlayer = (open?: boolean) => {
    setIsFullPlayerOpen(open !== undefined ? open : !isFullPlayerOpen);
  };

  const dismissPlayer = () => {
    if (activeEngineRef.current === 'youtube') {
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (e) {}
      }
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPlayerDismissed(true);
  };

  const restorePlayer = () => {
    setIsPlayerDismissed(false);
  };

  const isFavorite = (storyId: string) => favorites.includes(storyId);

  const toggleFavorite = (storyId: string) => {
    console.log('[AudioPlayerContext] toggleFavorite called', { storyId, isAuthenticated, authLoading, currentFavorites: favorites });
    if (authLoading) {
      console.log('[AudioPlayerContext] Auth loading, skipping');
      // Wait for auth to load before checking
      return;
    }
    if (!isAuthenticated) {
      console.log('[AudioPlayerContext] Not authenticated, opening auth modal');
      setIsAuthModalOpen(true);
      return;
    }
    setFavorites((prev) => {
      const next = prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId];
      console.log('[AudioPlayerContext] Favorites updated', { prev, next, storyId });
      storage.saveFavorites(next, user?.id);
      return next;
    });
  };

  const setAudioQuality = (quality: AudioQuality) => {
    setAudioQualityState(quality);
    storage.savePreferences({ audioQuality: quality });
  };

    const removeHistoryItem = (storyId: string, chapterId: string) => {
    setListeningHistory((prev) => {
      const nextHistory = prev.filter((p) => p.storyId !== storyId || p.chapterId !== chapterId);
      storage.saveListeningHistory(nextHistory);
      return nextHistory;
    });
    setListeningProgressMap((prev) => {
      const next = { ...prev };
      // No longer delete by storyId as the key is chapterId. We will let History view handle delete explicitly
      delete next[chapterId];
      storage.saveProgressMap(next);
      return next;
    });
    if (isAuthenticated) {
      deleteProgress(chapterId).catch(err => console.error(err));
    }
  };

    const clearHistory = () => {
    setListeningHistory([]);
    setListeningProgressMap({});
    storage.clearHistoryAndProgress();
    if (isAuthenticated) {
      clearProgress().catch(err => console.error(err));
    }
  };

  const resetAllData = () => {
    storage.resetAllMockData();
    window.location.reload();
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentStory,
        currentChapter,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        autoPlayNext,
        isDataSaverMode,
        sleepTimer,
        sleepTimerRemaining,
        audioError,
        isOffline,
        audioQuality,
        currentRoute,
        selectedStorySlug,
        isFullPlayerOpen,
        isPlayerDismissed,
        isAuthModalOpen,
        isPremiumModalOpen,
        isAuthenticated,
        favorites,
        isFavorite,
        listeningProgressMap,
        listeningHistory,
        
        playChapter,
        togglePlayPause,
        togglePlay: togglePlayPause,
        seek,
        skipSeconds,
        setVolumeLevel,
        toggleMute,
        setSpeedRate,
        setAutoPlayNextToggle,
        toggleDataSaverMode,
        pauseAudio,
        resumeAudio,
        setSleepTimerMode,
        setAudioQuality,
        playNextChapter,
        playPreviousChapter,
        retryPlayback,
        clearAudioError,
        saveProgressImmediately,
        
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        openPremiumModal: () => setIsPremiumModalOpen(true),
        closePremiumModal: () => setIsPremiumModalOpen(false),
        
        navigateTo,
        toggleFullPlayer,
        dismissPlayer,
        restorePlayer,
        toggleFavorite,
        
        removeHistoryItem,
        clearHistory,
        resetAllData,
      }}
    >
      {children}
      {/* Interactive YouTube Error Prompt Banner */}
      {audioError?.isYouTubeError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[92%] bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-white transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5 border border-rose-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <span>Sự cố nguồn YouTube</span>
                  {audioError.ytErrorCode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 font-mono font-bold">
                      Mã {audioError.ytErrorCode}
                    </span>
                  )}
                </h4>
                <button
                  onClick={() => clearAudioError()}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Đóng thông báo"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {audioError.message}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800">
                {audioError.canSkipNext && (
                  <button
                    onClick={() => {
                      clearAudioError();
                      playNextChapter();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Chuyển Tập Tiếp Theo</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => retryPlayback()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Thử Lại Kết Nối</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden YouTube Iframe Audio Player */}
      <div className="youtube-audio-source" aria-hidden="true" tabIndex={-1}>
        <div id="youtube-audio-player-element" />
      </div>
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
