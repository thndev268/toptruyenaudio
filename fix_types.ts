import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/p\.updatedAt/g, "(p.lastPlayedAt || p.updatedAt)");
content = content.replace(/savedProg\.updatedAt/g, "(savedProg.lastPlayedAt || savedProg.updatedAt)");

fs.writeFileSync(file, content);
