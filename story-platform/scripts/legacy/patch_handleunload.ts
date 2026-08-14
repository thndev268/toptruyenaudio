import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const updatedUnload = `
    const handleUnload = () => {
      const st = currentStoryRef.current;
      const ch = currentChapterRef.current;
      if (st && ch && audio.currentTime > 0) {
        const cTime = activeEngineRef.current === 'youtube' && ytPlayerRef.current?.getCurrentTime 
           ? ytPlayerRef.current.getCurrentTime() : audio.currentTime;
        const cDur = activeEngineRef.current === 'youtube' && ytPlayerRef.current?.getDuration
           ? ytPlayerRef.current.getDuration() : audio.duration || 0;
        
        // Chỉ lưu localStorage (bằng forceImmediate), không quan trọng việc gọi API async bị huỷ
        saveProgress(st.id, ch.id, ch.number, cTime, cDur, true);
      }
    };`;

content = content.replace(/const handleUnload = \(\) => \{[\s\S]*?saveProgress\(st\.id, ch\.id, ch\.number, audio\.currentTime, audio\.duration \|\| 0, true\);\s*\}\s*\};/, updatedUnload);

fs.writeFileSync(file, content);
