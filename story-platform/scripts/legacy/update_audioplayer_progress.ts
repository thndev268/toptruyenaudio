import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change saveProgressMap to use chapterId as key
content = content.replace(
  /const next = \{ \.\.\.prev, \[storyId\]: prog \};/g,
  'const next = { ...prev, [chapterId]: prog };'
);

content = content.replace(
  /const current = next\[p\.storyId\];/g,
  'const current = next[p.chapterId];'
);

content = content.replace(
  /next\[p\.storyId\] = \{/g,
  'next[p.chapterId] = {'
);

content = content.replace(
  /delete next\[storyId\];/g,
  '// No longer delete by storyId as the key is chapterId. We will let History view handle delete explicitly\n      Object.keys(next).forEach(k => { if(next[k].storyId === storyId) delete next[k] });'
);

// We need to adjust StoryDetailView and others where they used listeningProgressMap[storyId]
fs.writeFileSync(file, content);
