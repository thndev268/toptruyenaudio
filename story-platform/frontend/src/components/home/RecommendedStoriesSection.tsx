import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass, BookmarkCheck } from 'lucide-react';
import { AudioStory } from '../../types';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';

import { StoryCard } from '../common/StoryCard';

interface RecommendedStoriesSectionProps {
  stories?: AudioStory[];
}

interface ScoredStory {
  story: AudioStory;
  score: number;
  reason: string;
}

export const RecommendedStoriesSection: React.FC<RecommendedStoriesSectionProps> = ({
  stories,
}) => {
  const publicStories = adminRepository.getPublicStories();
  const effectiveStories = stories && stories.length > 0 ? stories : (publicStories);

  const navigate = useNavigate();
  const { listeningHistory, listeningProgressMap, favorites, playChapter } = useAudioPlayer();

  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | 'ALL'>('ALL');

  const handleSelectGenre = (genre: string) => {
    setSelectedGenreFilter(genre);
  };

  // Compute recommendation scores based on user's listening history and favorites
  const { recommendedList, userTopGenres, hasPersonalizedData } = useMemo(() => {
    const listeningHistoryArray = Array.isArray(listeningHistory) ? listeningHistory : [];
    const favoritesArray = Array.isArray(favorites) ? favorites : [];
    const effectiveStoriesArray = Array.isArray(effectiveStories) ? effectiveStories : [];
    
    // Collect all story IDs user interacted with
    const historyStoryIds = new Set<string>();
    listeningHistoryArray.forEach((h) => historyStoryIds.add(h.storyId));
    Object.values(listeningProgressMap).forEach((prog: any) => historyStoryIds.add(prog.storyId));
    favoritesArray.forEach((id) => historyStoryIds.add(id));

    // Get stories the user has listened to or favorited
    const interactedStories = effectiveStoriesArray.filter((s) => historyStoryIds.has(s.id));

    const genreCounts: Record<string, number> = {};
    const narratorCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};

    interactedStories.forEach((s) => {
      s.genres?.forEach((genre: any) => {
        genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 2;
      });
      if (s.narratorName) {
        narratorCounts[s.narratorName] = (narratorCounts[s.narratorName] || 0) + 1;
      }
      if (s.authorName) {
        authorCounts[s.authorName] = (authorCounts[s.authorName] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);

    const hasData = interactedStories.length > 0;

    // Score candidate stories
    const scored: ScoredStory[] = effectiveStories.map((s) => {
      let score = s.rating * 2; // base score from rating
      let primaryReason = 'Được yêu thích & Phổ biến';

      if (hasData) {
        // Genre match boost
        let matchedGenresCount = 0;
        let matchedGenreName = '';
        s.genres?.forEach((genre: any) => {
          if (genreCounts[genre.name]) {
            score += genreCounts[genre.name] * 4;
            matchedGenresCount++;
            if (!matchedGenreName) matchedGenreName = genre.name;
          }
        });

        // Narrator match boost
        if (s.narratorName && narratorCounts[s.narratorName]) {
          score += narratorCounts[s.narratorName] * 5;
        }

        // Author match boost
        if (s.authorName && authorCounts[s.authorName]) {
          score += authorCounts[s.authorName] * 4;
        }

        // Deduct slightly if user already completed or listened to this exact story
        
        const progresses = Object.values(listeningProgressMap).filter((p: any) => p.storyId === s.id);
        progresses.sort((a: any, b: any) => {
          try {
            const dateA = new Date(a.updatedAt);
            const dateB = new Date(b.updatedAt);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB.getTime() - dateA.getTime();
          } catch (e) {
            return 0;
          }
        });
        const prog = progresses[0];

        if (prog) {
          if (prog.completed) {
            score -= 15; // Already finished
          } else {
            score += 5; // In progress - great to recommend next chapters or related
          }
        }

        // Determine human-readable recommendation reason
        if (s.narratorName && narratorCounts[s.narratorName]) {
          primaryReason = `Cùng MC ${s.narratorName}`;
        } else if (matchedGenreName) {
          primaryReason = `Gợi ý vì bạn thích ${matchedGenreName}`;
        } else if (s.authorName && authorCounts[s.authorName]) {
          primaryReason = `Tác giả ${s.authorName}`;
        } else {
          primaryReason = 'Có thể bạn sẽ thích';
        }
      }

      return {
        story: s,
        score,
        reason: primaryReason,
      };
    });

    // Sort by score descending
    const sorted = scored.sort((a, b) => b.score - a.score);

    return {
      recommendedList: sorted,
      userTopGenres: topGenres,
      hasPersonalizedData: hasData,
    };
  }, [effectiveStories, listeningHistory, listeningProgressMap, favorites]);

  // Filter recommendations if a specific top genre is selected
  const filteredList = useMemo(() => {
    if (selectedGenreFilter === 'ALL') {
      return recommendedList;
    }
    return recommendedList.filter((item) => 
      item.story.genres?.some((genre) => genre.name === selectedGenreFilter)
    );
  }, [recommendedList, selectedGenreFilter]);

  if (!effectiveStories || effectiveStories.length === 0) return null;

  return (
    <div className="space-y-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-inner">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Gợi Ý Dành Cho Bạn
              </h2>
              {hasPersonalizedData ? (
                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                  <BookmarkCheck className="w-3 h-3" /> Cá nhân hóa
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold rounded-full">
                  Phổ biến ({filteredList.length} bộ)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasPersonalizedData
                ? `Hiển thị toàn bộ ${filteredList.length} gợi ý dựa trên lịch sử nghe audio, thể loại yêu thích và MC của bạn`
                : 'Những bộ truyện audio nổi bật nhất được cộng đồng đề xuất cho bạn'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/explore')}
          className="self-start sm:self-auto text-xs font-bold text-cyan-400 hover:text-cyan-300 min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Khám phá kho truyện</span>
        </button>
      </div>

      {/* Genre Filter Chips if user has personalized preferences */}
      {hasPersonalizedData && userTopGenres.length > 0 && (
        <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">
            Lọc theo thể loại:
          </span>
          <button
            onClick={() => handleSelectGenre('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[32px] cursor-pointer ${
              selectedGenreFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/80'
            }`}
          >
            Tất cả ({recommendedList.length})
          </button>
          {userTopGenres.slice(0, 4).map((genre) => (
            <button
              key={genre}
              onClick={() => handleSelectGenre(genre)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[32px] cursor-pointer ${
                selectedGenreFilter === genre
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/80'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Full Recommendation Grid Without Pagination */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pt-1">
        {filteredList.map(({ story, reason }) => (
          <StoryCard
            key={story.id}
            onPlayClick={() => { 
const progresses = Object.values(listeningProgressMap).filter((p: any) => p.storyId === story.id);
progresses.sort((a: any, b: any) => {
  try {
    const dateA = new Date(a.updatedAt);
    const dateB = new Date(b.updatedAt);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
    return dateB.getTime() - dateA.getTime();
  } catch (e) {
    return 0;
  }
});
const chapters = Array.isArray(story.chapters) ? story.chapters : [];
const chapter = chapters.find(c => c.id === progresses[0]?.chapterId) || (chapters.length > 0 ? chapters[0] : null);
if (!chapter) return;
 playChapter(story, chapter).then(success => { if(success) { const storyIdentifier = story.slug || story.id; navigate(`/listen/${storyIdentifier}/${chapter.id}`); } }) }}
            story={story}
            subtitle={reason}
          />
        ))}
      </div>
    </div>
  );
};
