import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const unloadBlock = `    const handleUnload = () => {
      const st = currentStoryRef.current;
      const ch = currentChapterRef.current;
      if (st && ch && audio.currentTime > 0) {
        saveProgress(st.id, ch.id, ch.number, audio.currentTime, audio.duration || 0, true);
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const st = currentStoryRef.current;
        const ch = currentChapterRef.current;
        if (st && ch && audio.currentTime > 0) {
          // If using youtube iframe, time comes from yt player
          const cTime = activeEngineRef.current === 'youtube' && ytPlayerRef.current?.getCurrentTime 
            ? ytPlayerRef.current.getCurrentTime() : audio.currentTime;
          const cDur = activeEngineRef.current === 'youtube' && ytPlayerRef.current?.getDuration
            ? ytPlayerRef.current.getDuration() : audio.duration || 0;
            
          saveProgress(st.id, ch.id, ch.number, cTime, cDur, true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);`;

content = content.replace(/const handleUnload = \(\) => \{[\s\S]*?window\.addEventListener\('beforeunload', handleUnload\);/, unloadBlock);

const cleanupBlock = `      audio.removeEventListener('play', onPlay);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audio.pause();`;
content = content.replace(/audio\.removeEventListener\('play', onPlay\);\s*window\.removeEventListener\('beforeunload', handleUnload\);\s*audio\.pause\(\);/, cleanupBlock);

fs.writeFileSync(file, content);
