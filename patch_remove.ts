import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /Object\.keys\(next\)\.forEach\(k => \{ if\(next\[k\]\.storyId === storyId\) delete next\[k\] \}\);/g,
  'delete next[chapterId];'
);

fs.writeFileSync(file, content);
