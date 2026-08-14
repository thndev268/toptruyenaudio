import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/home/RecommendedStoriesSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const \{ listeningHistory, listeningProgressMap, favorites \} = useAudioPlayer\(\);/, "const { listeningHistory, listeningProgressMap, favorites, playChapter } = useAudioPlayer();");
fs.writeFileSync(file, content);
