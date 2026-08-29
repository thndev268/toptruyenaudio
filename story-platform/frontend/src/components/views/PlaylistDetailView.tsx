import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Trash2, ArrowLeft, GripVertical, ListMusic, MoreVertical } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { localPlaylistRepository } from '../../services/repositories/PlaylistRepository';
import { UserPlaylist, PlaylistItem } from '../../types';
import { adminRepository } from '../../services/repositories/AdminRepository';
import { ConfirmModal } from '../common/ConfirmModal';

export const PlaylistDetailView: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playChapter } = useAudioPlayer();

  const [playlist, setPlaylist] = useState<UserPlaylist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    loadPlaylist();
  }, [playlistId, user]);

  const loadPlaylist = async () => {
    if (!playlistId || !user) return;
    setLoading(true);
    
    const pl = await localPlaylistRepository.getPlaylistById(playlistId);
    if (!pl || pl.ownerId !== user.id) {
      navigate('/library/playlists');
      return;
    }
    setPlaylist(pl);

    const itms = await localPlaylistRepository.getPlaylistItems(playlistId);
    setItems(itms);
    setLoading(false);
  };

  const publicStories = adminRepository.getPublicStories();
  const allStories = Array.isArray(publicStories) ? publicStories : [];

  const handlePlayAll = () => {
    if (items.length === 0) return;
    // For mock, just play the first item. Real implementation would queue them.
    const firstItem = items[0];
    const story = allStories.find(s => s.id === firstItem.storyId);
    if (!story) return;
    const chapters = Array.isArray(story.chapters) ? story.chapters : [];
    const chapter = chapters.find((c: any) => c.id === firstItem.chapterId);
    if (chapter) {
      playChapter(story, chapter);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!playlistId) return;
    await localPlaylistRepository.removeItem(playlistId, itemId);
    await loadPlaylist();
  };

  const handleDeletePlaylist = async () => {
    if (!playlistId) return;
    await localPlaylistRepository.deletePlaylist(playlistId);
    setIsDeleteModalOpen(false);
    navigate('/library/playlists');
  };

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) return `${hrs} giờ ${mins} phút`;
    return `${mins} phút`;
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">Đang tải...</div>;
  }

  if (!playlist) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn pb-24">
      {/* Back button */}
      <button 
        onClick={() => navigate('/library/playlists')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách phát
      </button>

      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end mb-10 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl">
        <div className="w-40 h-40 sm:w-48 sm:h-48 shrink-0 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          {playlist.coverUrl ? (
            <img loading="lazy" src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover bg-slate-800" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListMusic className="w-16 h-16 text-slate-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase font-bold tracking-wider text-cyan-400 mb-2">Danh sách phát cá nhân</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 truncate">{playlist.name}</h1>
          <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            {playlist.description || 'Không có mô tả.'}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span>{playlist.itemCount} tập</span>
            <span>•</span>
            <span>{formatDuration(playlist.totalDurationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePlayAll}
            disabled={items.length === 0}
            className="w-14 h-14 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan-500/20"
            aria-label="Phát tất cả"
          >
            <Play className="w-6 h-6 fill-current ml-1" />
          </button>
        </div>
        
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
          title="Xóa danh sách phát"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            Chưa có tập nào trong danh sách phát này.
          </div>
        ) : (
          items.map((item, index) => {
            const story = allStories.find(s => s.id === item.storyId);
            if (!story) return null;
            const chapters = Array.isArray(story.chapters) ? story.chapters : [];
            const chapter = chapters.find((c: any) => c.id === item.chapterId);
            if (!chapter) return null;

            return (
              <div 
                key={item.id}
                className="group flex items-center gap-3 sm:gap-4 p-3 hover:bg-slate-800/50 rounded-xl transition-colors"
              >
                <div className="w-8 text-center text-slate-500 text-sm font-mono shrink-0 cursor-grab opacity-50 group-hover:opacity-100 hidden sm:block">
                  <GripVertical className="w-4 h-4 mx-auto" />
                </div>
                
                <div className="w-6 text-center text-slate-500 text-sm font-mono shrink-0 sm:hidden">
                  {index + 1}
                </div>

                <img loading="lazy" src={story.coverUrl} alt={story.title} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-800" />
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playChapter(story, chapter)}>
                  <div className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{chapter.title}</div>
                  <div className="text-xs text-slate-400 truncate">{story.title} • {story.narratorName}</div>
                </div>

                <div className="text-xs text-slate-500 font-mono hidden sm:block">
                  {formatDuration(chapter.durationSeconds)}
                </div>

                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  title="Xóa khỏi danh sách"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa danh sách phát"
        message={`Bạn có chắc chắn muốn xóa danh sách "${playlist.name}"?`}
        onConfirm={handleDeletePlaylist}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
