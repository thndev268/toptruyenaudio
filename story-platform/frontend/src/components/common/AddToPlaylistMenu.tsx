import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, ListMusic } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { localPlaylistRepository } from '../../services/repositories/PlaylistRepository';
import { UserPlaylist } from '../../types';
import { useNavigate } from 'react-router-dom';

import { useToast } from '../../context/ToastContext';

interface AddToPlaylistMenuProps {
  storyId: string;
  chapterId: string;
  onClose: () => void;
  onSuccess: (playlistName: string) => void;
}

export const AddToPlaylistMenu: React.FC<AddToPlaylistMenuProps> = ({ storyId, chapterId, onClose, onSuccess }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium] = useState(false); // Mock status
  const [limits, setLimits] = useState(localPlaylistRepository.getPlaylistLimits(false));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) {
      // Wait for auth to load before checking
      return;
    }

    if (!isAuthenticated) {
      showToast('error', 'Lỗi', 'Vui lòng đăng nhập để sử dụng tính năng danh sách phát');
      onClose();
      navigate('/login');
      return;
    }
    loadPlaylists();
    setLimits(localPlaylistRepository.getPlaylistLimits(isPremium));
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user, isPremium, isAuthenticated, authLoading]);

  const loadPlaylists = async () => {
    if (!user) return;
    const data = await localPlaylistRepository.getPlaylistsByUser(user.id);
    setPlaylists(data);
    setLoading(false);
  };

  const handleAddToPlaylist = async (playlist: UserPlaylist) => {
    try {
      await localPlaylistRepository.addChapter(playlist.id, storyId, chapterId, isPremium);
      onSuccess(playlist.name);
      onClose();
    } catch (error: any) {
      showToast('error', 'Lỗi', error.message || 'Không thể thêm vào danh sách phát');
    }
  };

  const canCreateMore = limits.maximumPlaylists === null || playlists.length < limits.maximumPlaylists;

  return (
    <motion.div 
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[9999]"
    >
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lưu vào danh sách</span>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-slate-500 text-xs">Đang tải...</div>
        ) : playlists.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">Chưa có danh sách phát nào.</div>
        ) : (
          playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleAddToPlaylist(pl)}
              className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate"
            >
              {pl.name}
            </button>
          ))
        )}
      </div>

      <div className="border-t border-slate-700 bg-slate-900">
        {canCreateMore ? (
          <button 
            onClick={() => {
              onClose();
              navigate('/library/playlists');
            }}
            className="w-full px-4 py-3 text-left text-sm text-cyan-400 font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tạo danh sách mới
          </button>
        ) : (
          <button 
            onClick={() => {
              onClose();
              navigate('/premium');
            }}
            className="w-full px-4 py-3 text-left text-xs text-amber-400 font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            Nâng cấp để tạo thêm
          </button>
        )}
      </div>
    </motion.div>
  );
};
