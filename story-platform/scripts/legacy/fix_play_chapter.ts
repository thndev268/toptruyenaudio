import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const prog = listeningProgressMap\[story\.id\];/g, 'const prog = listeningProgressMap[chapter.id];');

fs.writeFileSync(file, content);
