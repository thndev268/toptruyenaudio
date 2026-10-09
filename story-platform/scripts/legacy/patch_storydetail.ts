import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/StoryDetailView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<button\s*onClick=\{\(\) => handlePlayChapter\(chapter\)\}[\s\S]*?<Play className="w-3\.5 h-3\.5 fill-current" \/> Phát Audio\s*<\/button>/g;

content = content.replace(regex, `
                    {listeningProgressMap[story.id]?.chapterId === chapter.id && listeningProgressMap[story.id]?.positionSeconds > 5 && !listeningProgressMap[story.id]?.completed ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playChapter(story, chapter)}
                          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 text-xs font-bold rounded-xl border border-cyan-500/30 flex items-center gap-1.5 transition-all min-h-[40px]"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Nghe tiếp từ {formatTime(listeningProgressMap[story.id].positionSeconds)}
                        </button>
                        <button
                          onClick={() => playChapter(story, chapter, 0)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all min-h-[40px]"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Nghe lại
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => playChapter(story, chapter, 0)}
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 text-xs font-bold rounded-xl border border-cyan-500/30 flex items-center gap-1.5 transition-all min-h-[40px]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Phát Audio
                      </button>
                    )}
`);

fs.writeFileSync(file, content);
