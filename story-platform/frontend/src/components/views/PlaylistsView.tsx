import React, { useState, useEffect } from 'react';
import { Plus, ListMusic, Trash2, Edit2, Play, MoreVertical } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { localPlaylistRepository } from '../../services/repositories/PlaylistRepository';
import { UserPlaylist } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../common/ConfirmModal';

export const PlaylistsView: React.FC = () => {
  const { user } = useAuth();
  const { playChapter } = useAudioPlayer();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [isPremium] = useState(false); // Mock status
  const [limits, setLimits] = useState(localPlaylistRepository.getPlaylistLimits(false));
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<UserPlaylist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadPlaylists();
    setLimits(localPlaylistRepository.getPlaylistLimits(isPremium));
  }, [user, isPremium]);

  const loadPlaylists = async () => {
    if (!user) return;
    setLoading(true);
    const data = await localPlaylistRepository.getPlaylistsByUser(user.id);
    setPlaylists(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newPlaylistName.trim()) return;
    try {
      await localPlaylistRepository.createPlaylist({
        ownerId: user.id,
        name: newPlaylistName.trim(),
      }, isPremium);
      setNewPlaylistName('');
      setIsCreateOpen(false);
      loadPlaylists();
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlaylist) return;
    await localPlaylistRepository.deletePlaylist(selectedPlaylist.id);
    setIsDeleteOpen(false);
    setSelectedPlaylist(null);
    loadPlaylists();
  };

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) return `${hrs} giờ ${mins} phút`;
    return `${mins} phút`;
  };

  const canCreateMore = limits.maximumPlaylists === null || playlists.length < limits.maximumPlaylists;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <ListMusic className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">Bộ Sưu Tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Danh Sách Phát</h1>
          <p className="text-sm text-slate-400 mt-1">
            {limits.maximumPlaylists === null 
              ? 'Tạo không giới hạn danh sách phát của riêng bạn.' 
              : `Bạn đã sử dụng ${playlists.length}/${limits.maximumPlaylists} danh sách phát miễn phí.`}
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tạo danh sách
        </button>
      </div>

      {!canCreateMore && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-amber-400">
            Bạn đã đạt giới hạn danh sách phát miễn phí. Hãy nâng cấp Premium để tạo không giới hạn.
          </div>
          <button onClick={() => navigate('/premium')} className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap">
            Xem quyền lợi Premium
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-40 flex items-center justify-center text-slate-500">Đang tải...</div>
      ) : playlists.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <ListMusic className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Chưa có danh sách phát</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md">
            Tạo danh sách phát để gom nhóm các tập audio yêu thích hoặc tạo một danh sách nghe trước khi ngủ.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Tạo danh sách đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group">
              <div 
                className="aspect-square bg-slate-800 relative cursor-pointer"
                onClick={() => navigate(`/library/playlists/${playlist.id}`)}
              >
                {playlist.coverUrl ? (
                  <img loading="lazy" src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity bg-slate-800" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListMusic className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button 
                    className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Play logic could be here if we want to play from start
                      navigate(`/library/playlists/${playlist.id}`);
                    }}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 relative">
                <h3 className="font-bold text-white truncate pr-8 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => navigate(`/library/playlists/${playlist.id}`)}>
                  {playlist.name}
                </h3>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>{playlist.itemCount} tập</span>
                  <span>•</span>
                  <span>{formatDuration(playlist.totalDurationSeconds)}</span>
                </div>

                <div className="absolute right-4 top-4">
                  <button 
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlaylist(playlist);
                      setIsDeleteOpen(true);
                    }}
                    aria-label="Xóa danh sách"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 animate-slideUpAndFade">
            <h2 className="text-xl font-bold text-white mb-4">Tạo danh sách phát mới</h2>
            
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}
            
            {!canCreateMore && !errorMsg ? (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                Bạn đã đạt giới hạn danh sách phát miễn phí. Nâng cấp Premium để tạo không giới hạn.
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Tên danh sách</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => {
                    setNewPlaylistName(e.target.value);
                    setErrorMsg('');
                  }}
                  autoFocus
                  placeholder="Ví dụ: Truyện ma buổi tối..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setErrorMsg('');
                }}
                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Hủy
              </button>
              {canCreateMore ? (
                <button
                  onClick={handleCreate}
                  disabled={!newPlaylistName.trim()}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-sm font-bold rounded-xl transition-colors"
                >
                  Tạo mới
                </button>
              ) : (
                <button
                  onClick={() => navigate('/premium')}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl transition-colors"
                >
                  Xem Premium
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Xóa danh sách phát"
        message={`Bạn có chắc chắn muốn xóa danh sách "${selectedPlaylist?.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
