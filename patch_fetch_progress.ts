import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const updatedHistory = `
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
        }));`;
content = content.replace(/const newHistory = sortedProgresses\.map\(p => \(\{[\s\S]*?\}\)\);/, updatedHistory);

const updatedMap = `
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
              };`;
content = content.replace(/next\[p\.chapterId\] = \{[\s\S]*?completed: p\.completed,\s*\};/, updatedMap);

fs.writeFileSync(file, content);
