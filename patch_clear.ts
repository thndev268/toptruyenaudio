import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const clearHistory = `  const clearHistory = () => {
    setListeningHistory([]);
    setListeningProgressMap({});
    storage.clearHistoryAndProgress();
    if (isAuthenticated) {
      clearProgress().catch(err => console.error(err));
    }
  };`;

content = content.replace(/const clearHistory = \(\) => \{[\s\S]*?storage\.clearHistoryAndProgress\(\);\s*\};/, clearHistory);

fs.writeFileSync(file, content);
