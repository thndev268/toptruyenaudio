import React, { useState, useEffect } from 'react';
import { Trophy, Star, Play, Crown, User, PenTool, Award, Clock, Sparkles } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { StoryCard } from '../common/StoryCard';
import { rankingRepository } from '../../services/repositories/RankingRepository';
import { UserActivityRanking, CreatorRanking } from '../../types';
import { ActiveUserDetailModal } from '../home/ActiveUserDetailModal';

export const LeaderboardView: React.FC = () => {
  const { navigateTo, playChapter } = useAudioPlayer();

  // Tab State: STORIES, USERS, CREATOR
  const [mainTab, setMainTab] = useState<'STORIES' | 'USERS' | 'CREATOR'>('STORIES');
  const [subTab, setSubTab] = useState<'listens' | 'favorites' | 'rating' | 'trending'>('listens');
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Selected User Modal State
  const [selectedUser, setSelectedUser] = useState<UserActivityRanking | null>(null);

  // Async Repository Data
  const [userRankings, setUserRankings] = useState<UserActivityRanking[]>([]);
  const [creatorRankings, setCreatorRankings] = useState<CreatorRanking[]>([]);

  useEffect(() => {
    let active = true;
    rankingRepository
      .getUserRankings(timePeriod)
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res)) {
          setUserRankings(res);
        } else if (res && typeof res === 'object' && Array.isArray((res as any).data)) {
          setUserRankings((res as any).data);
        } else if (res && typeof res === 'object' && Array.isArray((res as any).rankings)) {
          setUserRankings((res as any).rankings);
        } else {
          setUserRankings([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load user rankings:', err);
        if (active) setUserRankings([]);
      });

    rankingRepository
      .getCreatorRankings()
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res)) {
          setCreatorRankings(res);
        } else if (res && typeof res === 'object' && Array.isArray((res as any).data)) {
          setCreatorRankings((res as any).data);
        } else if (res && typeof res === 'object' && Array.isArray((res as any).creators)) {
          setCreatorRankings((res as any).creators);
        } else {
          setCreatorRankings([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load creator rankings:', err);
        if (active) setCreatorRankings([]);
      });

    return () => {
      active = false;
    };
  }, [timePeriod]);

  // Story Ranking Logic
  const publicStories = adminRepository.getPublicStories();
  const allStories = publicStories;

  const sortedStories = [...allStories].sort((a, b) => {
    if (subTab === 'listens') return (b.stats?.listenCount || 0) - (a.stats?.listenCount || 0);
    if (subTab === 'favorites') return (b.stats?.favoriteCount || 0) - (a.stats?.favoriteCount || 0);
    if (subTab === 'rating') return b.rating - a.rating;
    return (b.stats?.viewCount || 0) * b.rating - (a.stats?.viewCount || 0) * a.rating;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">Hệ Thống Bảng Binh Danh</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white">Bảng Xếp Hạng TOP TRUYỆN AUDIO</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Cập nhật thời gian thực thành tích của tác phẩm, thính giả và tác giả</p>
        </div>

        {/* Time Period Selector */}
        <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {(['today', 'week', 'month', 'all'] as const).map((period) => {
            const labels = { today: 'Hôm Nay', week: 'Tuần Này', month: 'Tháng Này', all: 'Toàn Thời Gian' };
            return (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                  timePeriod === period ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMainTab('STORIES')}
          className={`px-5 py-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all min-h-[44px] shrink-0 ${
            mainTab === 'STORIES' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" /> Bảng Xếp Hạng Truyện Audio
        </button>

        <button
          onClick={() => setMainTab('USERS')}
          className={`px-5 py-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all min-h-[44px] shrink-0 ${
            mainTab === 'USERS' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Bảng Thính Giả Tích Cực
        </button>

        <button
          onClick={() => setMainTab('CREATOR')}
          className={`px-5 py-3.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all min-h-[44px] shrink-0 ${
            mainTab === 'CREATOR' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="w-4 h-4" /> Bảng Xếp Hạng Tác Giả
        </button>
      </div>

      {/* STORIES RANKINGS */}
      {mainTab === 'STORIES' && (
        <div className="space-y-4">
          
          {/* Sub Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSubTab('listens')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                subTab === 'listens' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              Lượt Nghe Nhiều
            </button>
            <button
              onClick={() => setSubTab('trending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                subTab === 'trending' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              Đang Xu Hướng
            </button>
            <button
              onClick={() => setSubTab('rating')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                subTab === 'rating' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              Đánh Giá Cao
            </button>
            <button
              onClick={() => setSubTab('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                subTab === 'favorites' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              Yêu Thích Nhất
            </button>
          </div>

          {/* Stories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {sortedStories.map((story, rank) => (
              <StoryCard key={story.id} story={story} rank={rank} />
            ))}
          </div>
        </div>
      )}

      {/* USERS RANKINGS */}
      {mainTab === 'USERS' && (
        <div className="space-y-3">
          {Array.isArray(userRankings) && userRankings.length > 0 ? (
            userRankings.map((user, rank) => (
              <div
                key={user.userId}
                onClick={() => setSelectedUser(user)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedUser(user);
                  }
                }}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-850 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01] group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                    #{rank + 1}
                  </div>

                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 group-hover:border-cyan-400/80 transition-colors shrink-0">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={user.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-cyan-400 font-mono font-bold">Cấp độ {user.level}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-mono">{user.activityPoints} Điểm tích cực</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-mono shrink-0">
                  <div className="text-slate-200 font-bold">{Math.round(user.validListeningMinutes / 60)} Giờ nghe</div>
                  <div className="text-[10px] text-slate-400">{user.completedStories} truyện hoàn thành</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-900/50 border border-slate-800 rounded-2xl">
              Chưa có dữ liệu thính giả tích cực
            </div>
          )}
        </div>
      )}

      {/* CREATOR RANKINGS */}
      {mainTab === 'CREATOR' && (
        <div className="space-y-3">
          {Array.isArray(creatorRankings) && creatorRankings.length > 0 ? (
            creatorRankings.map((creator, rank) => (
              <div
                key={creator.creatorId}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                    #{rank + 1}
                  </div>

                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-bold text-white truncate">{creator.name}</div>
                    <div className="text-xs text-slate-400">
                      <span className="text-emerald-400 font-mono font-bold">
                        {creator.role === 'AUTHOR' ? 'Tác Giả' : creator.role}
                      </span> | {creator.storyCount} tác phẩm
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-mono shrink-0">
                  <div className="text-slate-200 font-bold">{(creator.totalListens / 1000).toFixed(0)}k lượt nghe</div>
                  <div className="text-[10px] text-emerald-400">+{creator.growthPercent}% tăng trưởng</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-900/50 border border-slate-800 rounded-2xl">
              Chưa có dữ liệu tác giả
            </div>
          )}
        </div>
      )}

      {/* Active Listener Detail Modal */}
      <ActiveUserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};
