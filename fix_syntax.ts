import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/StoryDetailView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace {listeningProgressMap... with listeningProgressMap...
content = content.replace(
  /\{listeningProgressMap\[story\.id\]\?\.chapterId/g,
  'listeningProgressMap[story.id]?.chapterId'
);

fs.writeFileSync(file, content);
