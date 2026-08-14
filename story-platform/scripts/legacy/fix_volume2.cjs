const fs = require('fs');
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const toggleMuteRegex = /const toggleMute = \(\) => \{[\s\S]*?(?=const handlePlaybackRateChange =)/;
const newToggleMute = `const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMutedState(nextMute);
    storage.savePreferences({ isMuted: nextMute });
    if (audioRef.current) {
      audioRef.current.volume = nextMute ? 0 : volume;
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
            ytPlayerRef.current.setVolume(volume * 100);
          }
        }
      } catch (e) {}
    }
  };

  `;
content = content.replace(toggleMuteRegex, newToggleMute);

const setVolumeLevelRegex = /const setVolumeLevel = \(vol: number\) => \{[\s\S]*?(?=const toggleMute = \(\) => \{)/;
const newSetVolumeLevel = `const setVolumeLevel = (vol: number) => {
    setVolumeState(vol);
    setIsMutedState(vol === 0);
    storage.savePreferences({ volume: vol, isMuted: vol === 0 });
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (activeEngineRef.current === 'audio') {
          ytPlayerRef.current.mute();
          ytPlayerRef.current.setVolume(0);
        } else {
          ytPlayerRef.current.setVolume(vol * 100);
          if (vol === 0) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
        }
      } catch (e) {}
    }
  };

  `;
content = content.replace(setVolumeLevelRegex, newSetVolumeLevel);

fs.writeFileSync(file, content);
