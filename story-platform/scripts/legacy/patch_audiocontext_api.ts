import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const apiSaveLogic = `
    // Save to backend
    if (isAuthenticated) {
      apiSaveProgress(chapterId, {
        storyId,
        positionSeconds: Math.floor(position),
        durationSeconds: Math.floor(dur),
        completed: isComp,
        playbackMode: isVideoEnabled ? 'VIDEO' : 'AUDIO',
        playbackRate: playbackRate,
        version: prog.version
      }).then((savedProg) => {
        if (savedProg) {
          setListeningProgressMap(prev => {
             const next = { ...prev };
             if (next[chapterId]) {
               next[chapterId] = {
                 ...next[chapterId],
                 syncStatus: 'SYNCED',
                 version: savedProg.version,
                 updatedAt: savedProg.lastPlayedAt || next[chapterId].updatedAt
               };
               storage.saveProgressMap(next, user?.id);
             }
             return next;
          });
        }
      }).catch(err => console.error(err));
    }`;

content = content.replace(/\/\/ Save to backend[\s\S]*?apiSaveProgress\([\s\S]*?\}\)\.catch\(err => console\.error\(err\)\);\s*\}/, apiSaveLogic);

// Also set syncStatus: 'PENDING' in the initial prog object
content = content.replace(
  /completed: isComp,\s*\};/,
  "completed: isComp,\n      syncStatus: 'PENDING',\n      version: listeningProgressMap[chapterId]?.version\n    };"
);

fs.writeFileSync(file, content);
