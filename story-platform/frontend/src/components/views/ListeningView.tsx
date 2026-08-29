import React from 'react';
import { PlayCircle, Play } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { ListeningProgress } from '../../types';

export const ListeningView: React.FC = () => {
  const { playChapter, listeningProgressMap } = useAudioPlayer();

  const publicStories = adminRepository.getPublicStories();
  const allStories = publicStories;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <PlayCircle className="w-6 h-6" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">Tiến Độ Trải Nghiệm</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Truyện Audio Đang Nghe Dở</h1>
        <p className="text-sm text-slate-400 mt-1">Tự động lưu chính xác timestamp giây dở dang để bạn tiếp tục bất kỳ lúc nào</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.values(listeningProgressMap) as ListeningProgress[]).map((prog) => {
          const storiesArray = Array.isArray(allStories) ? allStories : [];
          const story = storiesArray.find((s) => s.id === prog.storyId);
          if (!story) return null;
          const chapters = Array.isArray(story.chapters) ? story.chapters : [];
          const chapter = chapters.find((c) => c.id === prog.chapterId) || (chapters.length > 0 ? chapters[0] : null);
          if (!chapter) return null;
          const pct = prog.durationSeconds > 0 ? (prog.positionSeconds / prog.durationSeconds) * 100 : 0;

          return (
            <div key={prog.storyId} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4">
              <img
                loading="lazy"
                src={story.coverUrl}
                alt={story.title}
                className="w-20 h-24 rounded-xl object-cover border border-slate-700 bg-slate-800"
              />
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="text-sm font-bold text-white truncate">{story.title}</h3>
                  <p className="text-xs text-cyan-400 font-semibold truncate">{chapter.title}</p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Thời điểm: <span className="font-mono text-slate-200">{formatTime(prog.positionSeconds)}</span> / {formatTime(prog.durationSeconds)} ({Math.round(pct)}%)
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-1">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>

                <button
                  onClick={() => playChapter(story, chapter)}
                  className="py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 text-xs font-bold rounded-lg border border-cyan-500/30 flex items-center justify-center gap-1 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Nghe Tiếp Tại Timestamp
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
