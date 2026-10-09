const fs = require('fs');
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const toggleMuteRegex = /const toggleMute = \(\) => \{[\s\S]*?(?=const setSpeedRate =)/;
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

fs.writeFileSync(file, content);
