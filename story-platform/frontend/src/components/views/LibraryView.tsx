import React, { useState } from 'react';
import { Bookmark, Heart, PlayCircle, History, ListMusic, Compass } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { ListeningProgress } from '../../types';
import { useNavigate } from 'react-router-dom';
import { StoryCard } from '../common/StoryCard';

export const LibraryView: React.FC = () => {
  const { favorites, listeningProgressMap, listeningHistory, playChapter } = useAudioPlayer();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'listening' | 'favorites' | 'history'>('listening');

  const publicStories = adminRepository.getPublicStories();
  const allStories = publicStories;

  const favStories = allStories.filter((s) => favorites.includes(s.id));

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const listeningItems = Object.values(listeningProgressMap) as ListeningProgress[];

  return (
    <div className="space-y-6 pb-20 animate-fadeIn max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <Bookmark className="w-6 h-6" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">Không Gian Cá Nhân</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Thư Viện Audio Cá Nhân</h1>
        <p className="text-sm text-slate-400 mt-1">Theo dõi tiến độ đang nghe, danh sách yêu thích và lịch sử trải nghiệm</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setTab('listening')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer min-h-[44px] ${
            tab === 'listening' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <PlayCircle className="w-4 h-4" /> Đang Nghe Dở ({listeningItems.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('favorites')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer min-h-[44px] ${
            tab === 'favorites' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" /> Yêu Thích ({favStories.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('history')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer min-h-[44px] ${
            tab === 'history' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" /> Lịch Sử Nghe ({listeningHistory.length})
        </button>

        <button
          type="button"
          onClick={() => navigate('/library/playlists')}
          className="px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all border-transparent text-slate-400 hover:text-white shrink-0 cursor-pointer min-h-[44px]"
        >
          <ListMusic className="w-4 h-4" /> Danh Sách Phát
        </button>
      </div>

      {/* Tab Content: Listening Progress */}
      {tab === 'listening' && (
        <>
          {listeningItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <p className="text-slate-400 text-sm">Bạn chưa có truyện nào đang nghe dở.</p>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl inline-flex items-center gap-2 min-h-[44px] cursor-pointer shadow-lg"
              >
                <Compass className="w-4 h-4" /> Khám phá truyện ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {listeningItems.map((prog) => {
                const story = allStories.find((s) => s.id === prog.storyId);
                if (!story) return null;
                const chapter = story.chapters.find((c) => c.id === prog.chapterId) || story.chapters[0];
                const pct = prog.durationSeconds > 0 ? (prog.positionSeconds / prog.durationSeconds) * 100 : 0;

                return (
                  <StoryCard
                    key={prog.chapterId}
                    story={story}
                    chapterTitle={chapter.title}
                    onPlayClick={() => { playChapter(story, chapter, prog.positionSeconds).then(success => { if(success) { const storyIdentifier = story.slug || story.id; navigate(`/listen/${storyIdentifier}/${chapter.id}`); } }) }}
                    progressPercent={pct}
                    formattedTime={`${formatTime(prog.positionSeconds)} / ${formatTime(prog.durationSeconds)}`}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab Content: Favorites */}
      {tab === 'favorites' && (
        <>
          {favStories.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <p className="text-slate-400 text-sm">Chưa có truyện nào trong danh sách yêu thích.</p>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl inline-flex items-center gap-2 min-h-[44px] cursor-pointer shadow-lg"
              >
                <Compass className="w-4 h-4" /> Khám phá truyện ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {favStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content: History */}
      {tab === 'history' && (
        <>
          {listeningHistory.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <p className="text-slate-400 text-sm">Lịch sử nghe đang trống.</p>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl inline-flex items-center gap-2 min-h-[44px] cursor-pointer shadow-lg"
              >
                <Compass className="w-4 h-4" /> Bắt đầu nghe truyện
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {listeningHistory.map((item, index) => {
                const story = allStories.find((s) => s.id === item.storyId);
                if (!story) return null;
                return (
                  <StoryCard
                    key={`${item.storyId}-${index}`}
                    story={story}
                    subtitle={`Tập ${item.chapterNumber} • ${formatTime(item.positionSeconds)}`}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
