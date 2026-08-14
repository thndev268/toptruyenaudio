const fs = require('fs');
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix onReady
content = content.replace(
  /onReady: \(event: any\) => \{\s+ytReadyRef\.current = true;\s+event\.target\.setVolume\(isMuted \? 0 : volume \* 100\);\s+event\.target\.setPlaybackRate\(playbackRate\);\s+if \(pendingYtIdRef\.current\) \{/g,
  `onReady: (event: any) => {
              ytReadyRef.current = true;
              if (activeEngineRef.current === 'audio') {
                event.target.mute();
                event.target.setVolume(0);
              } else {
                if (isMuted) event.target.mute();
                else event.target.unMute();
                event.target.setVolume(isMuted ? 0 : volume * 100);
              }
              event.target.setPlaybackRate(playbackRate);
              if (pendingYtIdRef.current) {`
);

// 2. Fix playChapter
const playChapterRegex = /const ytId = audioUrlYtId \|\| \(\!hasWebAudio \? fallbackYtId : null\);[\s\S]*?(?=const togglePlayPause = async)/;

const newPlayChapter = `const ytId = audioUrlYtId || fallbackYtId;

    setCurrentStory(story);
    setCurrentChapter({ ...chapter, audioUrl: finalAudioUrl || chapter.audioUrl });

    if (mode === 'API' && isAuthenticated) {
      try {
        const session = await apiRequest<{ _id: string }>(
          '/listening/sessions',
          {
            method: 'POST',
            body: JSON.stringify({
              storySlug: story.slug,
              chapterSlug: chapter.slug,
              startPosition: 0,
              playbackRate: playbackRate
            })
          }
        );
        setSessionId(session._id);
      } catch (err) {
        console.warn('Failed to start listening session:', err);
        setSessionId(null);
      }
    } else {
      setSessionId(null);
    }

    if (hasWebAudio) {
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
        audioRef.current.src = finalAudioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.playbackRate = playbackRate;
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
      // Play via YouTube Engine
      activeEngineRef.current = 'youtube';
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (ytReadyRef.current && ytPlayerRef.current) {
        try {
          if (isMuted) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
          ytPlayerRef.current.setPlaybackRate(playbackRate);
          ytPlayerRef.current.loadVideoById(ytId);
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

  `;

content = content.replace(playChapterRegex, newPlayChapter);

// 3. Fix togglePlayPause
const togglePlayPauseRegex = /const togglePlayPause = async \(\) => \{[\s\S]*?(?=const retryPlayback = \(\) => \{)/;
const newTogglePlayPause = `const togglePlayPause = async () => {
    if (!currentChapter || !currentStory) return;
    setAudioError(null);

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
        // Sync ytPlayer if exists
        if (ytPlayerRef.current && ytReadyRef.current) {
          try { ytPlayerRef.current.pauseVideo(); } catch(e) {}
        }
        setIsPlaying(false);
      } else {
        if (!audioRef.current.src || audioRef.current.src === '') {
          playChapter(currentStory, currentChapter);
          return;
        }
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            // Sync ytPlayer if exists
            if (ytPlayerRef.current && ytReadyRef.current) {
              try { ytPlayerRef.current.playVideo(); } catch(e) {}
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

  `;

content = content.replace(togglePlayPauseRegex, newTogglePlayPause);

// 4. Fix seek
const seekRegex = /const seek = \(seconds: number\) => \{[\s\S]*?(?=const skipSeconds = \(delta: number\))/;
const newSeek = `const seek = (seconds: number) => {
    setCurrentTime(seconds);
    if (activeEngineRef.current === 'youtube') {
      if (ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.seekTo(seconds, true);
        } catch (e) {}
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      // Sync ytPlayer if exists
      if (ytPlayerRef.current && ytReadyRef.current) {
        try { ytPlayerRef.current.seekTo(seconds, true); } catch(e) {}
      }
    }
  };

  `;
content = content.replace(seekRegex, newSeek);

fs.writeFileSync(file, content);
