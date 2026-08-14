import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const syncUserEffect = `
  // Sync data when user changes
  useEffect(() => {
    setFavorites(storage.getFavorites(user?.id));
    
    // First, sync any PENDING local progress to backend
    const localProgressMap = storage.getProgressMap(user?.id);
    const pendingProgresses = Object.values(localProgressMap).filter((p: any) => p.syncStatus === 'PENDING');
    
    setListeningProgressMap(localProgressMap);
    setListeningHistory(storage.getListeningHistory(user?.id));

    if (isAuthenticated && user?.id) {
      // Background sync pending
      const syncPromises = pendingProgresses.map((p: any) => 
        apiSaveProgress(p.chapterId, {
          storyId: p.storyId,
          positionSeconds: p.positionSeconds,
          durationSeconds: p.durationSeconds,
          completed: p.completed,
          playbackMode: 'AUDIO', // or video if known
          playbackRate: 1,
          version: p.version
        })
      );
      
      Promise.allSettled(syncPromises).then(() => {
        // Then fetch latest from backend
        fetchProgress().then(progresses => {
          if (!progresses || !Array.isArray(progresses)) return;
          
          const sortedProgresses = [...progresses].sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime());
          const newHistory = sortedProgresses.map((p: any) => ({
            storyId: p.storyId,
            chapterId: p.chapterId,
            chapterNumber: 1,
            positionSeconds: p.positionSeconds,
            durationSeconds: p.durationSeconds,
            updatedAt: p.lastPlayedAt,
            completed: p.completed,
            syncStatus: 'SYNCED',
            version: p.version
          }));
          setListeningHistory(newHistory);
          storage.saveListeningHistory(newHistory, user.id);

          setListeningProgressMap(prev => {
            const next = { ...prev };
            let changed = false;
            progresses.forEach(p => {
              const current = next[p.chapterId];
              if (!current || new Date(p.lastPlayedAt).getTime() > new Date(current.updatedAt || 0).getTime()) {
                next[p.chapterId] = {
                  storyId: p.storyId,
                  chapterId: p.chapterId,
                  chapterNumber: 1,
                  positionSeconds: p.positionSeconds,
                  durationSeconds: p.durationSeconds,
                  updatedAt: p.lastPlayedAt,
                  completed: p.completed,
                  syncStatus: 'SYNCED',
                  version: p.version
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
      });
    }
  }, [user?.id, isAuthenticated]);
`;
content = content.replace(/\/\/ Sync data when user changes[\s\S]*?\}, \[user\?\.id, isAuthenticated\]\);/, syncUserEffect);

fs.writeFileSync(file, content);
