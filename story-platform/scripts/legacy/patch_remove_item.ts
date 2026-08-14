import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update imports
content = content.replace(
  /clearProgress \} from '\.\.\/services\/api\/progress';/,
  'clearProgress, deleteProgress } from \'../services/api/progress\';'
);

const removeHistoryItem = `  const removeHistoryItem = (storyId: string, chapterId: string) => {
    setListeningHistory((prev) => {
      const nextHistory = prev.filter((p) => p.storyId !== storyId || p.chapterId !== chapterId);
      storage.saveListeningHistory(nextHistory);
      return nextHistory;
    });
    setListeningProgressMap((prev) => {
      const next = { ...prev };
      delete next[storyId];
      storage.saveProgressMap(next);
      return next;
    });
    if (isAuthenticated) {
      deleteProgress(chapterId).catch(err => console.error(err));
    }
  };`;

content = content.replace(/const removeHistoryItem = \([\s\S]*?storage\.saveProgressMap\(next\);\s*return next;\s*\}\);\s*\};/, removeHistoryItem);

fs.writeFileSync(file, content);
