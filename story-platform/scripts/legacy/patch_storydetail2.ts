import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/StoryDetailView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const handlePlayChapter = async \(chapter: any\) => \{/,
  'const handlePlayChapter = async (chapter: any, startPos?: number) => {'
);
content = content.replace(
  /const success = await playChapter\(story, chapter\);/,
  'const success = await playChapter(story, chapter, startPos);'
);
content = content.replace(/onClick=\{\(\) => playChapter\(story, chapter\)\}/g, 'onClick={() => handlePlayChapter(chapter)}');
content = content.replace(/onClick=\{\(\) => playChapter\(story, chapter, 0\)\}/g, 'onClick={() => handlePlayChapter(chapter, 0)}');

fs.writeFileSync(file, content);
