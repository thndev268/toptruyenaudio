import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/syncStatus: 'SYNCED'/g, "syncStatus: 'LOCAL_ONLY'");
content = content.replace(/syncStatus: 'PENDING'/g, "syncStatus: 'LOCAL_ONLY'");

fs.writeFileSync(file, content);
