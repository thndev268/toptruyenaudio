import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/home/RecommendedStoriesSection.tsx';
let content = fs.readFileSync(file, 'utf8');

// Line 40: Object.values(listeningProgressMap).forEach((prog) => historyStoryIds.add(prog.storyId));
content = content.replace(/Object\.keys\(listeningProgressMap\)\.forEach\(\(id\) => historyStoryIds\.add\(id\)\);/, 'Object.values(listeningProgressMap).forEach((prog: any) => historyStoryIds.add(prog.storyId));');

// Line 96
content = content.replace(/const prog = listeningProgressMap\[s\.id\];/, `
        const progresses = Object.values(listeningProgressMap).filter((p: any) => p.storyId === s.id);
        progresses.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const prog = progresses[0];
`);

// Line 223
content = content.replace(/const chapter = story\.chapters\.find\(c => c\.id === listeningProgressMap\[story\.id\]\?\.chapterId\) \|\| story\.chapters\[0\];/, `
const progresses = Object.values(listeningProgressMap).filter((p: any) => p.storyId === story.id);
progresses.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
const chapter = story.chapters.find(c => c.id === progresses[0]?.chapterId) || story.chapters[0];
`);

fs.writeFileSync(file, content);
