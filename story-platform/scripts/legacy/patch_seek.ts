import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const seekLogic = `
  const seek = (seconds: number) => {
    setCurrentTime(seconds);
    const st = currentStoryRef.current;
    const ch = currentChapterRef.current;
    if (st && ch) {
      saveProgress(st.id, ch.id, ch.number, seconds, duration || 0, true);
    }
    
    if (activeEngineRef.current === 'youtube') {
`;
content = content.replace(/const seek = \(seconds: number\) => \{\s*setCurrentTime\(seconds\);\s*if \(activeEngineRef\.current === 'youtube'\) \{/, seekLogic);

fs.writeFileSync(file, content);
