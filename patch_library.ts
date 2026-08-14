import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/LibraryView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<StoryCard\s+key=\{prog\.storyId\}\s+story=\{story\}\s+chapterTitle=\{chapter\.title\}/g,
  `<StoryCard
                    key={prog.chapterId}
                    story={story}
                    chapterTitle={chapter.title}
                    onPlayClick={() => { playChapter(story, chapter, prog.positionSeconds).then(success => { if(success) navigate(\`/listen/\${story.slug}/\${chapter.id}\`); }) }}`
);

// We need to make sure useAudioPlayer imports playChapter
content = content.replace(
  /const \{ favorites, listeningProgressMap, listeningHistory \} = useAudioPlayer\(\);/,
  'const { favorites, listeningProgressMap, listeningHistory, playChapter } = useAudioPlayer();'
);

fs.writeFileSync(file, content);
