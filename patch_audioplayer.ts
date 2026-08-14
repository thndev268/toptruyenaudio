import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const importStatement = `import { fetchProgress, saveProgress as apiSaveProgress, clearProgress } from '../services/api/progress';\n`;
if (!content.includes('api/progress')) {
  content = content.replace("import { storage } from '../services/storage';", importStatement + "import { storage } from '../services/storage';");
}

const syncUserEffect = `
  // Sync data when user changes
  useEffect(() => {
    setFavorites(storage.getFavorites(user?.id));
    setListeningProgressMap(storage.getProgressMap(user?.id));
    setListeningHistory(storage.getListeningHistory(user?.id));

    if (isAuthenticated && user?.id) {
      fetchProgress().then(progresses => {
        if (!progresses || !Array.isArray(progresses)) return;
        setListeningProgressMap(prev => {
          const next = { ...prev };
          let changed = false;
          progresses.forEach(p => {
            // merge
            const current = next[p.storyId];
            if (!current || new Date(p.lastPlayedAt).getTime() > new Date(current.updatedAt || 0).getTime()) {
              next[p.storyId] = {
                storyId: p.storyId,
                chapterId: p.chapterId,
                chapterNumber: 1, // we don't have chapterNumber from api easily but it's ok
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
content = content.replace(/\/\/ Sync data when user changes\s*useEffect\(\(\) => \{[\s\S]*?\}, \[user\?\.id\]\);/, syncUserEffect);

const saveProgressFunc = `
  // Save Progress Helper with throttling
  const saveProgress = (
    storyId: string,
    chapterId: string,
    chapterNumber: number,
    position: number,
    dur: number,
    forceImmediate = false
  ) => {
    if (!storyId || !chapterId || position <= 0) return;
    
    // GUEST is not allowed to create new listening data
    if (!isAuthenticated) return;

    const now = Date.now();
    // Throttle to every 10 seconds unless forced
    if (!forceImmediate && now - lastSaveTimeRef.current < 10000) {
      return;
    }
    lastSaveTimeRef.current = now;

    const remaining = dur - position;
    const isComp = dur > 0 && (remaining <= 15 || (position / dur) >= 0.95);

    const prog: ListeningProgress = {
      storyId,
      chapterId,
      chapterNumber,
      positionSeconds: Math.floor(position),
      durationSeconds: Math.floor(dur),
      updatedAt: new Date().toISOString(),
      completed: isComp,
    };

    setListeningProgressMap((prev) => {
      const next = { ...prev, [storyId]: prog };
      storage.saveProgressMap(next, user?.id);
      return next;
    });

    setListeningHistory((prev) => {
      const filtered = prev.filter((p) => p.storyId !== storyId || p.chapterId !== chapterId);
      const nextHistory = [prog, ...filtered];
      storage.saveListeningHistory(nextHistory, user?.id);
      return nextHistory;
    });

    // Save to backend
    if (isAuthenticated) {
      apiSaveProgress(chapterId, {
        storyId,
        positionSeconds: Math.floor(position),
        durationSeconds: Math.floor(dur),
        completed: isComp,
        playbackMode: isVideoEnabled ? 'VIDEO' : 'AUDIO',
        playbackRate: playbackRate,
      }).catch(err => console.error(err));
    }
  };
`;
content = content.replace(/\/\/ Save Progress Helper with throttling[\s\S]*?const prog: ListeningProgress = \{[\s\S]*?storage\.saveListeningHistory[\s\S]*?return nextHistory;\s*\}\);\s*\};/, saveProgressFunc);

fs.writeFileSync(file, content);
