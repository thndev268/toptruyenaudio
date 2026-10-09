import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Play, Trash2, Search, Filter, MoreVertical, X } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { ConfirmModal } from '../common/ConfirmModal';
import { StoryCard } from '../common/StoryCard';

export const HistoryView: React.FC = () => {
  const { playChapter, listeningHistory, removeHistoryItem, clearHistory } = useAudioPlayer();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const publicStories = adminRepository.getPublicStories();
  const allStories = publicStories;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const filteredHistory = useMemo(() => {
    const listeningHistoryArray = Array.isArray(listeningHistory) ? listeningHistory : [];
    return listeningHistoryArray.filter(item => {
      const storiesArray = Array.isArray(allStories) ? allStories : [];
      const story = storiesArray.find(s => s.id === item.storyId);
      if (!story) return false;
      const chapters = Array.isArray(story.chapters) ? story.chapters : [];
      const chapter = chapters.find((c: any) => c.id === item.chapterId);

      // Search match
      const lowerQuery = searchQuery.toLowerCase();
      const matchSearch = 
        story.title.toLowerCase().includes(lowerQuery) || 
        (chapter?.title.toLowerCase().includes(lowerQuery)) ||
        story.narratorName.toLowerCase().includes(lowerQuery) ||
        story.authorName.toLowerCase().includes(lowerQuery);
      
      if (!matchSearch) return false;

      // Filter match
      if (filter === 'IN_PROGRESS' && item.completed) return false;
      if (filter === 'COMPLETED' && !item.completed) return false;

      return true;
    });
  }, [listeningHistory, searchQuery, filter]);

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: typeof filteredHistory } = {
      'Hôm nay': [],
      'Hôm qua': [],
      '7 ngày qua': [],
      'Cũ hơn': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    filteredHistory.forEach(item => {
      try {
        const updatedDate = new Date(item.updatedAt);
        if (isNaN(updatedDate.getTime())) return;
        if (updatedDate >= today) {
          groups['Hôm nay'].push(item);
        } else if (updatedDate >= yesterday) {
          groups['Hôm qua'].push(item);
        } else if (updatedDate >= last7Days) {
          groups['7 ngày qua'].push(item);
        } else {
          groups['Cũ hơn'].push(item);
        }
      } catch (e) {
        console.warn('Invalid date in history item:', item.updatedAt);
      }
    });

    return groups;
  }, [filteredHistory]);

  const hasHistory = listeningHistory.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <History className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider">Nhật Ký Trải Nghiệm</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white">Lịch Sử Nghe Audio</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Danh sách các tập audio và câu chuyện bạn đã từng thưởng thức</p>
          </div>
          {hasHistory && (
            <button 
              onClick={() => setIsConfirmClearOpen(true)}
              className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" /> Xóa tất cả
            </button>
          )}
        </div>

        {hasHistory && (
          <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm tên truyện, tập, hoặc giọng đọc..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex gap-2">
                <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'}`}>Tất cả</button>
                <button onClick={() => setFilter('IN_PROGRESS')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filter === 'IN_PROGRESS' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'}`}>Đang nghe</button>
                <button onClick={() => setFilter('COMPLETED')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filter === 'COMPLETED' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'}`}>Đã hoàn thành</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">Tiến độ hiện đang được lưu cục bộ trên thiết bị của bạn (Cache). Chức năng đồng bộ đa thiết bị sẽ sớm ra mắt sau khi hệ thống Database được kết nối chính thức.</div>

      {!hasHistory ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm">Chưa có lịch sử nghe audio nào.</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm">Không tìm thấy kết quả phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([groupName, items]: [string, any[]]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupName} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-2 border-l-2 border-cyan-500">{groupName}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {items.map((item, idx) => {
                    const storiesArray = Array.isArray(allStories) ? allStories : [];
                    const story = storiesArray.find((s) => s.id === item.storyId);
                    if (!story) return null;
                    const chapters = Array.isArray(story.chapters) ? story.chapters : [];
                    const chapter = chapters.find((c: any) => c.id === item.chapterId) || (chapters.length > 0 ? chapters[0] : null);
                    if (!chapter) return null;
                    const percent = item.durationSeconds > 0 ? (item.positionSeconds / item.durationSeconds) * 100 : 0;
                    
                    return (
                      <StoryCard
                        key={`${item.storyId}-${item.chapterId}-${idx}`}
                        onPlayClick={() => { playChapter(story, chapter).then(success => { if(success) { const storyIdentifier = story.slug || story.id; navigate(`/listen/${storyIdentifier}/${chapter.id}`); } }) }}
                        story={story}
                        chapterTitle={chapter.title}
                        progressPercent={percent}
                        formattedTime={`${formatTime(item.positionSeconds)} / ${formatTime(item.durationSeconds)}`}
                        onRemove={() => removeHistoryItem(item.storyId, item.chapterId)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmClearOpen}
        title="Xóa Toàn Bộ Lịch Sử"
        message="Hành động này sẽ xóa toàn bộ nhật ký nghe của bạn. Dữ liệu này không thể được khôi phục. Các danh sách phát và yêu thích của bạn vẫn sẽ được giữ nguyên."
        confirmLabel="Xóa Toàn Bộ"
        cancelLabel="Hủy"
        onConfirm={() => {
          clearHistory();
          setIsConfirmClearOpen(false);
        }}
        onClose={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
