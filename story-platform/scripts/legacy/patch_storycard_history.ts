import * as fs from 'fs';
let file = 'story-platform/frontend/src/components/views/HistoryView.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /<StoryCard\s+key=\{`\$\{item\.storyId\}-\$\{item\.chapterId\}-\$\{idx\}`\}/,
  '<StoryCard\n                        key={`${item.storyId}-${item.chapterId}-${idx}`}\n                        onPlayClick={() => { playChapter(story, chapter).then(success => { if(success) navigate(`/listen/${story.slug}/${chapter.id}`); }) }}'
);
fs.writeFileSync(file, content);

file = 'story-platform/frontend/src/components/home/RecommendedStoriesSection.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /<StoryCard\s+key=\{story\.id\}/,
  '<StoryCard\n            key={story.id}\n            onPlayClick={() => { const chapter = story.chapters.find(c => c.id === listeningProgressMap[story.id]?.chapterId) || story.chapters[0]; playChapter(story, chapter).then(success => { if(success) navigate(`/listen/${story.slug}/${chapter.id}`); }) }}'
);
fs.writeFileSync(file, content);
