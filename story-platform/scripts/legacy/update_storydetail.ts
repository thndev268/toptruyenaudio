import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/StoryDetailView.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace handleStartListening
const startListenReplacement = `
  const handleStartListening = () => {
    const progresses = Object.values(listeningProgressMap).filter((p: any) => p.storyId === story.id);
    progresses.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const progress = progresses[0];
    
    if (progress) {
      const chapter = story.chapters.find(c => c.id === progress.chapterId) || story.chapters[0];
      handlePlayChapter(chapter);
    } else {
      handlePlayChapter(story.chapters[0]);
    }
  };`;
content = content.replace(/const handleStartListening = \(\) => \{[\s\S]*?handlePlayChapter\(story\.chapters\[0\]\);\s*\}\s*\};/, startListenReplacement);

// line 533 & 539
content = content.replace(/listeningProgressMap\[story\.id\]\?/g, 'listeningProgressMap[chapter.id]?');
content = content.replace(/listeningProgressMap\[story\.id\]\.positionSeconds/g, 'listeningProgressMap[chapter.id]?.positionSeconds || 0');

fs.writeFileSync(file, content);
