import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const syncUserEffect = `
  // Sync data when user changes
  useEffect(() => {
    setFavorites(storage.getFavorites(user?.id));
    setListeningProgressMap(storage.getProgressMap(user?.id));
    setListeningHistory(storage.getListeningHistory(user?.id));

    if (isAuthenticated && user?.id) {
      fetchProgress().then(progresses => {
        if (!progresses || !Array.isArray(progresses)) return;
        
        // 1. Build listeningHistory (latest per chapter)
        const sortedProgresses = [...progresses].sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime());
        const newHistory = sortedProgresses.map(p => ({
          storyId: p.storyId,
          chapterId: p.chapterId,
          chapterNumber: 1,
          positionSeconds: p.positionSeconds,
          durationSeconds: p.durationSeconds,
          updatedAt: p.lastPlayedAt,
          completed: p.completed,
        }));
        setListeningHistory(newHistory);
        storage.saveListeningHistory(newHistory, user.id);

        // 2. Build listeningProgressMap (latest per story)
        setListeningProgressMap(prev => {
          const next = { ...prev };
          let changed = false;
          progresses.forEach(p => {
            const current = next[p.storyId];
            if (!current || new Date(p.lastPlayedAt).getTime() > new Date(current.updatedAt || 0).getTime()) {
              next[p.storyId] = {
                storyId: p.storyId,
                chapterId: p.chapterId,
                chapterNumber: 1,
                positionSeconds: p.positionSeconds,
                durationSeconds: p.durationSeconds,
                updatedAt: p.lastPlayedAt,
                completed: p.completed,
              };
              changed = true;
            }
          });
          if (changed) {
            storage.saveProgressMap(next, user.id);
            return next;
          }
          return prev;
        });
      }).catch(err => console.error(err));
    }
  }, [user?.id, isAuthenticated]);
`;
content = content.replace(/\/\/ Sync data when user changes[\s\S]*?\}, \[user\?\.id, isAuthenticated\]\);/, syncUserEffect);

fs.writeFileSync(file, content);
