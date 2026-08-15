import React, { useState, useEffect } from 'react';
import {
  Disc,
  Play,
  Pause,
  Crown,
  Clock,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  Radio,
  FileAudio,
  Trash2,
  CheckSquare,
  Square,
  Search,
  AlertTriangle,
  Volume2,
  Layers,
  Sparkles,
  Filter,
  Plus,
  Edit3,
  Save,
  Video,
  Loader2,
} from 'lucide-react';
import { AdminStoryItem, AdminGenreItem } from '../../../types/admin';
import { AudioChapter } from '../../../types';
import { FocusTrap } from '../../common/FocusTrap';
import { adminRepository } from '../../../services/repositories/AdminRepository';
import { AdminIframePreviewModal } from '../common/AdminIframePreviewModal';

interface StoryDetailModalProps {
  isOpen: boolean;
  story: AdminStoryItem | null;
  onClose: () => void;
  onUpdatePublishStatus: (story: AdminStoryItem, newStatus: 'PUBLISHED' | 'PENDING' | 'DRAFT' | 'REJECTED') => void;
  onUpdateAccessLevel: (story: AdminStoryItem, newAccess: 'FREE' | 'PREMIUM') => void;
  onDeleteStory: (story: AdminStoryItem) => void;
  onDeleteChapter?: (story: AdminStoryItem, chapterId: string, chapterTitle?: string) => void;
  onDeleteChapters?: (story: AdminStoryItem, chapterIds: string[]) => void;
  getStoryChapters?: (storyId: string) => AudioChapter[];
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({
  isOpen,
  story,
  onClose,
  onUpdatePublishStatus,
  onUpdateAccessLevel,
  onDeleteStory,
  onDeleteChapter,
  onDeleteChapters,
  getStoryChapters,
}) => {
  const [playingChapterNumber, setPlayingChapterNumber] = useState<number | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');

  // Version counter to trigger re-renders on CRUD
  const [chaptersVersion, setChaptersVersion] = useState(0);
  const refreshChapters = () => setChaptersVersion((v) => v + 1);

  // Add chapter form state
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterNumber, setNewChapterNumber] = useState<number>(1);
  const [newChapterNarrator, setNewChapterNarrator] = useState('');
  const [newChapterAudioUrl, setNewChapterAudioUrl] = useState('');
  const [newChapterIframe, setNewChapterIframe] = useState('');
  const [newChapterAllowVideoDisplay, setNewChapterAllowVideoDisplay] = useState<boolean>(true);
  const [newChapterAccessLevel, setNewChapterAccessLevel] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [newChapterContent, setNewChapterContent] = useState('');

  // Edit chapter form state
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterNumber, setEditChapterNumber] = useState<number>(1);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterNarrator, setEditChapterNarrator] = useState('');
  const [editChapterAudioUrl, setEditChapterAudioUrl] = useState('');
  const [editChapterIframe, setEditChapterIframe] = useState('');
  const [editChapterAllowVideoDisplay, setEditChapterAllowVideoDisplay] = useState<boolean>(true);
  const [editChapterAccessLevel, setEditChapterAccessLevel] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [editChapterContent, setEditChapterContent] = useState('');

  // Edit story metadata state
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [editStoryTitle, setEditStoryTitle] = useState('');
  const [editStoryAuthor, setEditStoryAuthor] = useState('');
  const [editStoryNarrator, setEditStoryNarrator] = useState('');
  const [editStoryCoverUrl, setEditStoryCoverUrl] = useState('');
  const [editStorySummary, setEditStorySummary] = useState('');
  const [editStoryGenreIds, setEditStoryGenreIds] = useState<string[]>([]);
  const [genres, setGenres] = useState<AdminGenreItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset state when story changes or modal closes
  useEffect(() => {
    setSelectedChapterIds([]);
    setSearchQuery('');
    setAccessFilter('ALL');
    setIsAddingChapter(false);
    setEditingChapterId(null);
    setIsEditingStory(false);
    if (story) {
      setNewChapterNarrator(story.narratorName || 'MC Giọng Đọc');
    }
    if (audioElem) {
      audioElem.pause();
      setAudioElem(null);
      setPlayingChapterNumber(null);
    }
  }, [story?.id, isOpen]);

  if (!isOpen || !story) return null;

  // Retrieve chapters dynamically from repository or props
  const rawChapters: AudioChapter[] = getStoryChapters
    ? getStoryChapters(story.id)
    : adminRepository.getStoryChapters(story.id);

  // Filtered chapters for search and access filter
  const filteredChapters = rawChapters.filter((chapter) => {
    const matchSearch =
      searchQuery === '' ||
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.number.toString().includes(searchQuery) ||
      chapter.narrator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAccess =
      accessFilter === 'ALL' || chapter.accessLevel === accessFilter;
    return matchSearch && matchAccess;
  });

  const isAllFilteredSelected =
    filteredChapters.length > 0 &&
    filteredChapters.every((c) => selectedChapterIds.includes(c.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Remove all filtered from selection
      const filteredSet = new Set(filteredChapters.map((c) => c.id));
      setSelectedChapterIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      // Add all filtered to selection
      const newSelected = new Set([
        ...selectedChapterIds,
        ...filteredChapters.map((c) => c.id),
      ]);
      setSelectedChapterIds(Array.from(newSelected));
    }
  };

  const toggleChapterSelection = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleSelectVipOnly = () => {
    const vipIds = rawChapters
      .filter((c) => c.accessLevel === 'PREMIUM')
      .map((c) => c.id);
    setSelectedChapterIds(vipIds);
  };

  const handleSelectFreeOnly = () => {
    const freeIds = rawChapters
      .filter((c) => c.accessLevel === 'FREE')
      .map((c) => c.id);
    setSelectedChapterIds(freeIds);
  };

  const handleClearSelection = () => {
    setSelectedChapterIds([]);
  };

  const toggleChapterAudio = (num: number, url: string) => {
    if (playingChapterNumber === num) {
      audioElem?.pause();
      setPlayingChapterNumber(null);
    } else {
      audioElem?.pause();
      const a = new Audio(url);
      a.play().catch(() => {});
      a.onended = () => setPlayingChapterNumber(null);
      setAudioElem(a);
      setPlayingChapterNumber(num);
    }
  };

  const handleSingleDelete = (chapter: AudioChapter) => {
    if (onDeleteChapter) {
      onDeleteChapter(story, chapter.id, `Tập ${chapter.number}: ${chapter.title}`);
      // Remove deleted chapter from selection if it was selected
      setSelectedChapterIds((prev) => prev.filter((id) => id !== chapter.id));
      refreshChapters();
    }
  };

  const handleBatchDelete = () => {
    if (selectedChapterIds.length === 0) return;
    if (onDeleteChapters) {
      onDeleteChapters(story, selectedChapterIds);
      setSelectedChapterIds([]);
      refreshChapters();
    }
  };

  const handleSaveNewChapter = async () => {
    if (!story || isSaving) return;
    const title = newChapterTitle.trim() || `Tập ${newChapterNumber}`;
    setIsSaving(true);
    setSaveError(null);
    const res = await adminRepository.addStoryChapter(story.id, {
      number: newChapterNumber,
      title,
      narrator: newChapterNarrator || story.narratorName,
      audioUrl: newChapterAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      iframeCode: newChapterIframe,
      videoIframeUrl: newChapterIframe,
      allowVideoDisplay: newChapterAllowVideoDisplay,
      isVideoEnabled: newChapterAllowVideoDisplay,
      accessLevel: newChapterAccessLevel,
      audioContent: newChapterContent,
    });
    setIsSaving(false);
    if (res.success) {
      setIsAddingChapter(false);
      setNewChapterTitle('');
      setNewChapterAudioUrl('');
      setNewChapterIframe('');
      setNewChapterAllowVideoDisplay(true);
      setNewChapterContent('');
      refreshChapters();
    } else {
      setSaveError(res.message);
    }
  };

  const handleStartEditChapter = (chapter: AudioChapter) => {
    setIsAddingChapter(false);
    setEditingChapterId(chapter.id);
    setEditChapterNumber(chapter.number);
    setEditChapterTitle(chapter.title);
    setEditChapterNarrator(chapter.narrator || story.narratorName || '');
    setEditChapterAudioUrl(chapter.audioUrl || '');
    setEditChapterIframe(chapter.iframeCode || chapter.videoIframeUrl || '');
    setEditChapterAllowVideoDisplay(
      chapter.allowVideoDisplay !== undefined ? chapter.allowVideoDisplay : (chapter.isVideoEnabled !== undefined ? chapter.isVideoEnabled : true)
    );
    setEditChapterAccessLevel(chapter.accessLevel || 'FREE');
    setEditChapterContent(chapter.audioContent || '');
  };

  const handleSaveEditChapter = async () => {
    if (!story || !editingChapterId || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    const res = await adminRepository.updateStoryChapter(story.id, editingChapterId, {
      number: editChapterNumber,
      title: editChapterTitle.trim() || `Tập ${editChapterNumber}`,
      narrator: editChapterNarrator || story.narratorName,
      audioUrl: editChapterAudioUrl,
      iframeCode: editChapterIframe,
      videoIframeUrl: editChapterIframe,
      allowVideoDisplay: editChapterAllowVideoDisplay,
      isVideoEnabled: editChapterAllowVideoDisplay,
      accessLevel: editChapterAccessLevel,
      audioContent: editChapterContent,
    });
    setIsSaving(false);
    if (res.success) {
      setEditingChapterId(null);
      refreshChapters();
    } else {
      setSaveError(res.message);
    }
  };

  const handleStartEditStory = () => {
    setIsEditingStory(true);
    setEditStoryTitle(story.title);
    setEditStoryAuthor(story.authorName);
    setEditStoryNarrator(story.narratorName);
    setEditStoryCoverUrl(story.coverUrl || '');
    setEditStorySummary(story.summary || story.storyline || '');
    setEditStoryGenreIds(story.genreIds || []);
    // Load genres
    setGenres(adminRepository.getGenres());
  };

  const handleSaveEditStory = async () => {
    if (!story || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    const res = await adminRepository.updateStory(story.id, {
      title: editStoryTitle,
      authorName: editStoryAuthor,
      narratorName: editStoryNarrator,
      coverUrl: editStoryCoverUrl,
      summary: editStorySummary,
      genreIds: editStoryGenreIds,
    });
    setIsSaving(false);
    if (res.success) {
      setIsEditingStory(false);
      refreshChapters();
    } else {
      setSaveError(res.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-detail-title"
    >
      <FocusTrap
        isActive={isOpen}
        onEscape={onClose}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4 sm:my-8 max-h-[92vh] animate-scaleUp"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold shrink-0 shadow-lg">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Quản Trị Tập Audio
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {rawChapters.length} tập trong kho
                </span>
              </div>
              <h2 id="story-detail-title" className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                {story.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-750 min-w-[42px] min-h-[42px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Đóng bảng quản lý tập"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Top Story Info & Quick Actions Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-18 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700 shadow-md">
                <img
                  loading="lazy"
                  src={story.coverUrl}
                  alt={story.title}
                  className="w-full h-full object-cover bg-slate-800"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    title={
                      story.publishStatus === 'PUBLISHED'
                        ? 'Bộ truyện đang được phát hành công khai'
                        : 'Bộ truyện đang ở trạng thái bản nháp hoặc chờ duyệt'
                    }
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                      story.publishStatus === 'PUBLISHED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                    <span>{story.publishStatus === 'PUBLISHED' ? 'Đang phát hành' : 'Bản nháp'}</span>
                  </span>

                  <span
                    title={
                      story.accessLevel === 'PREMIUM'
                        ? 'Bộ truyện yêu cầu gói thành viên VIP / Premium'
                        : 'Bộ truyện mở nghe miễn phí toàn bộ các tập'
                    }
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                      story.accessLevel === 'PREMIUM'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {story.accessLevel === 'PREMIUM' && <Crown className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
                    <span>{story.accessLevel === 'PREMIUM' ? 'Gói VIP' : 'Miễn phí'}</span>
                  </span>

                  <span className="text-xs text-slate-400">
                    Tác giả: <strong className="text-slate-200">{story.authorName}</strong> · MC: <strong className="text-slate-200">{story.narratorName}</strong>
                  </span>
                </div>
                {story.genres && story.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {story.genres?.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg border border-slate-700"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
                {story.genres.length > 3 && (
                  <span className="text-[10px] text-slate-500">+{story.genres.length - 3}</span>
                )}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {story.summary}
                </p>
              </div>
            </div>

            {/* Global Story Actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <button
                type="button"
                onClick={handleStartEditStory}
                className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa Thông Tin Truyện</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdatePublishStatus(
                    story,
                    story.publishStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
                  )
                }
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[38px]"
              >
                {story.publishStatus === 'PUBLISHED' ? 'Ẩn Về Bản Nháp' : 'Xuất Bản Truyện'}
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateAccessLevel(
                    story,
                    story.accessLevel === 'PREMIUM' ? 'FREE' : 'PREMIUM'
                  )
                }
                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[38px]"
              >
                {story.accessLevel === 'PREMIUM' ? 'Đổi Sang Miễn Phí' : 'Khóa Gói Premium'}
              </button>

              <button
                type="button"
                onClick={() => onDeleteStory(story)}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5"
                title="Gỡ toàn bộ truyện khỏi hệ thống"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Gỡ Bộ Truyện</span>
              </button>
            </div>
          </div>

          {/* Edit Story Metadata Form */}
          {isEditingStory && (
            <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" /> Chỉnh Sửa Thông Tin Bộ Truyện
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">ID: {story.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Tên Bộ Truyện</label>
                  <input
                    type="text"
                    value={editStoryTitle}
                    onChange={(e) => setEditStoryTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Tác Giả</label>
                  <input
                    type="text"
                    value={editStoryAuthor}
                    onChange={(e) => setEditStoryAuthor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">MC / Giọng Đọc Chính</label>
                  <input
                    type="text"
                    value={editStoryNarrator}
                    onChange={(e) => setEditStoryNarrator(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Link Ảnh Bìa (Cover URL)</label>
                  <input
                    type="text"
                    value={editStoryCoverUrl}
                    onChange={(e) => setEditStoryCoverUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Tóm Tắt / Cốt Truyện</label>
                <textarea
                  rows={3}
                  value={editStorySummary}
                  onChange={(e) => setEditStorySummary(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Thể Loại</label>
                <select
                  multiple
                  value={editStoryGenreIds}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions, (option) => option.value);
                    setEditStoryGenreIds(options);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[80px]"
                >
                  {genres.length > 0 ? (
                    genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Đang tải thể loại...</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-500">Giữ Ctrl/Cmd để chọn nhiều thể loại</p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                {saveError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {saveError}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditingStory(false); setSaveError(null); }}
                    disabled={isSaving}
                    className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-750 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditStory}
                    disabled={isSaving}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu Thông Tin Truyện'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chapter Search, Filters & Selection Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tập theo số tập (vd: 1, 2), tên tập hoặc MC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 min-h-[40px]"
                />
              </div>

              {/* Access Filter & Quick Selection buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 min-h-[40px] cursor-pointer"
                >
                  <option value="ALL">Tất cả gói ({rawChapters.length})</option>
                  <option value="FREE">Chỉ tập Miễn phí ({rawChapters.filter(c => c.accessLevel === 'FREE').length})</option>
                  <option value="PREMIUM">Chỉ tập VIP ({rawChapters.filter(c => c.accessLevel === 'PREMIUM').length})</option>
                </select>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  disabled={filteredChapters.length === 0}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all min-h-[40px] cursor-pointer border ${
                    isAllFilteredSelected
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  {isAllFilteredSelected ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-rose-400" />
                      <span>Bỏ Chọn Tất Cả</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-slate-400" />
                      <span>Chọn Tất Cả ({filteredChapters.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Floating / Sticky Batch Actions Bar when >= 1 chapter selected */}
            {selectedChapterIds.length > 0 && (
              <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-500/60 rounded-2xl p-3.5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0 border border-rose-500/30">
                    <Trash2 className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Đã chọn <strong className="text-rose-400 text-sm font-black">{selectedChapterIds.length}</strong> / {rawChapters.length} tập audio</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold uppercase">
                        Sẵn sàng xóa
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Chọn thao tác bên phải để xóa hàng loạt các tập audio đã đánh dấu
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all min-h-[38px] cursor-pointer"
                  >
                    Bỏ Chọn ({selectedChapterIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all min-h-[38px] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa {selectedChapterIds.length} Tập Đã Chọn</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chapters List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-cyan-400" />
                <span>Danh Sách Tập Audio ({filteredChapters.length} tập hiển thị)</span>
              </h3>
              
              <button
                type="button"
                onClick={() => {
                  setNewChapterNumber(rawChapters.length + 1);
                  setNewChapterTitle(`Tập ${rawChapters.length + 1}`);
                  setIsAddingChapter(!isAddingChapter);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingChapter ? 'Đóng Form' : 'Thêm Tập Mới'}</span>
              </button>
            </div>

            {/* Add Chapter Form */}
            {isAddingChapter && (
              <div className="bg-slate-950 border border-rose-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Thêm Tập Mới Cho Bộ Truyện
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Tự động tăng STT: Tập {newChapterNumber}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Số Tập (STT)</label>
                    <input
                      type="number"
                      value={newChapterNumber}
                      onChange={(e) => setNewChapterNumber(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300">Tên / Tiêu Đề Tập</label>
                    <input
                      type="text"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="VD: Tập 1: Khởi Đầu Mới"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">MC / Giọng Đọc</label>
                    <input
                      type="text"
                      value={newChapterNarrator}
                      onChange={(e) => setNewChapterNarrator(e.target.value)}
                      placeholder="Nhập tên MC..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Gói Cước Mở Khóa</label>
                    <select
                      value={newChapterAccessLevel}
                      onChange={(e) => setNewChapterAccessLevel(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="FREE">Miễn Phí (FREE)</option>
                      <option value="PREMIUM">Gói VIP (PREMIUM)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Link File Audio MP3 / HLS Streaming URL</label>
                  <input
                    type="text"
                    value={newChapterAudioUrl}
                    onChange={(e) => setNewChapterAudioUrl(e.target.value)}
                    placeholder="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-rose-400">Mã Iframe Video Embed / Link YouTube</label>
                  </div>
                  <input
                    type="text"
                    value={newChapterIframe}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewChapterIframe(val);
                      const titleMatch = val.match(/title=["']([^"']+)["']/i);
                      if (titleMatch && titleMatch[1]) {
                        setNewChapterTitle(titleMatch[1]);
                      }
                    }}
                    placeholder='<iframe width="100%" height="450" src="https://www.youtube.com/embed/..." title="Tiêu đề tập" frameborder="0" allowfullscreen></iframe> hoặc https://youtu.be/...'
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                  />

                  {/* Toggle Switch: Allow Video Display */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 px-3.5 mt-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 block">Cho phép hiển thị / ẩn video</span>
                      <span className="text-[10px] text-slate-400 block">
                        {newChapterAllowVideoDisplay
                          ? 'Bật: Người dùng có thể chọn Xem video 16:9 hoặc Tiết kiệm dữ liệu.'
                          : 'Tắt: Ẩn hoàn toàn video, người dùng chỉ nghe phần âm thanh.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewChapterAllowVideoDisplay(!newChapterAllowVideoDisplay)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        newChapterAllowVideoDisplay ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={newChapterAllowVideoDisplay}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          newChapterAllowVideoDisplay ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-cyan-400">Nội Dung / Kịch Bản Lời Thoại Tập</label>
                  <textarea
                    rows={3}
                    value={newChapterContent}
                    onChange={(e) => setNewChapterContent(e.target.value)}
                    placeholder="Nhập nội dung transcript hoặc kịch bản lời thoại của tập..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                  {saveError && (
                    <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {saveError}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsAddingChapter(false); setSaveError(null); }}
                      disabled={isSaving}
                      className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-750 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewChapter}
                      disabled={isSaving}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>{isSaving ? 'Đang lưu...' : 'Lưu Tập Mới'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredChapters.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {rawChapters.length === 0
                    ? 'Bộ truyện này chưa có tập audio nào'
                    : 'Không tìm thấy tập audio phù hợp với bộ lọc'}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {rawChapters.length === 0
                    ? 'Các tập audio của bộ truyện đã bị gỡ hoặc chưa được tải lên từ Creator Studio.'
                    : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn "Tất cả gói" để xem đầy đủ danh sách.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setAccessFilter('ALL');
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 text-cyan-400 text-xs font-bold rounded-xl hover:bg-slate-750 cursor-pointer"
                  >
                    Xóa Bộ Lọc Tìm Kiếm
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredChapters.map((chapter) => {
                  const isSelected = selectedChapterIds.includes(chapter.id);
                  const isPlaying = playingChapterNumber === chapter.number;

                  return (
                    <div
                      key={chapter.id}
                      className={`border rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'bg-rose-950/20 border-rose-500/50 shadow-md'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Checkbox + Play button + Chapter details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox for selecting chapter */}
                        <button
                          type="button"
                          onClick={() => toggleChapterSelection(chapter.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500 text-white'
                              : 'border-2 border-slate-700 hover:border-slate-500 bg-slate-900 text-transparent'
                          }`}
                          aria-label={`Chọn tập ${chapter.number}`}
                          aria-checked={isSelected}
                          role="checkbox"
                        >
                          <CheckSquare className={`w-4 h-4 ${isSelected ? 'block' : 'hidden'}`} />
                        </button>

                        {/* Audio preview button */}
                        <button
                          type="button"
                          onClick={() => toggleChapterAudio(chapter.number, chapter.audioUrl)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                              : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400'
                          }`}
                          aria-label={`Nghe thử tập ${chapter.number}`}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        {/* Chapter text & metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white truncate">
                              Tập {chapter.number}: {chapter.title}
                            </span>

                            {chapter.accessLevel === 'PREMIUM' ? (
                              <span
                                title="Tập audio yêu cầu gói Premium"
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                              >
                                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>VIP</span>
                              </span>
                            ) : (
                              <span
                                title="Tập audio mở nghe miễn phí"
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0 whitespace-nowrap"
                              >
                                FREE
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>MC: <strong className="text-slate-300 font-medium">{chapter.narrator}</strong></span>
                            <span>·</span>
                            <span className="font-mono text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>
                                {Math.floor(chapter.durationSeconds / 60)}p {chapter.durationSeconds % 60}s
                              </span>
                            </span>
                            <span>·</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                              SẴN SÀNG PHÁT
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Individual Edit & Delete Chapter Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditChapter(chapter)}
                          className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                          aria-label={`Sửa tập ${chapter.number}: ${chapter.title}`}
                          title={`Sửa tập ${chapter.number}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sửa Tập</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSingleDelete(chapter)}
                          className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/25 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                          aria-label={`Xóa tập ${chapter.number}: ${chapter.title}`}
                          title={`Xóa tập ${chapter.number}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Xóa Tập</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline Edit Chapter Form overlay */}
            {editingChapterId && (
              <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn my-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4" /> Chỉnh Sửa Thông Tin Tập Audio
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {editingChapterId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Số Tập (STT)</label>
                    <input
                      type="number"
                      value={editChapterNumber}
                      onChange={(e) => setEditChapterNumber(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300">Tên / Tiêu Đề Tập</label>
                    <input
                      type="text"
                      value={editChapterTitle}
                      onChange={(e) => setEditChapterTitle(e.target.value)}
                      placeholder="VD: Tập 1: Khởi Đầu Mới"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">MC / Giọng Đọc</label>
                    <input
                      type="text"
                      value={editChapterNarrator}
                      onChange={(e) => setEditChapterNarrator(e.target.value)}
                      placeholder="Nhập tên MC..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Gói Cước Mở Khóa</label>
                    <select
                      value={editChapterAccessLevel}
                      onChange={(e) => setEditChapterAccessLevel(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="FREE">Miễn Phí (FREE)</option>
                      <option value="PREMIUM">Gói VIP (PREMIUM)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Link File Audio MP3 / Streaming URL</label>
                  <input
                    type="text"
                    value={editChapterAudioUrl}
                    onChange={(e) => setEditChapterAudioUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-400">Mã Iframe Video Embed / Link YouTube</label>
                  </div>
                  <input
                    type="text"
                    value={editChapterIframe}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditChapterIframe(val);
                      const titleMatch = val.match(/title=["']([^"']+)["']/i);
                      if (titleMatch && titleMatch[1]) {
                        setEditChapterTitle(titleMatch[1]);
                      }
                    }}
                    placeholder='<iframe ... title="Tiêu đề tập"></iframe> hoặc https://youtu.be/...'
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />

                  {/* Toggle Switch: Allow Video Display */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 px-3.5 mt-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 block">Cho phép hiển thị / ẩn video</span>
                      <span className="text-[10px] text-slate-400 block">
                        {editChapterAllowVideoDisplay
                          ? 'Bật: Người dùng có thể chọn Xem video 16:9 hoặc Tiết kiệm dữ liệu.'
                          : 'Tắt: Ẩn hoàn toàn video, người dùng chỉ nghe phần âm thanh.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditChapterAllowVideoDisplay(!editChapterAllowVideoDisplay)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editChapterAllowVideoDisplay ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                      role="switch"
                      aria-checked={editChapterAllowVideoDisplay}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          editChapterAllowVideoDisplay ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-cyan-400">Nội Dung / Kịch Bản Lời Thoại Tập</label>
                  <textarea
                    rows={3}
                    value={editChapterContent}
                    onChange={(e) => setEditChapterContent(e.target.value)}
                    placeholder="Nhập nội dung transcript hoặc kịch bản lời thoại của tập..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingChapterId(null)}
                    className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-750 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditChapter}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Cập Nhật Tập</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Hệ thống phân phối âm thanh CDN sẵn sàng</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedChapterIds.length > 0 && (
              <span className="text-rose-400 font-bold font-mono">
                Đã chọn {selectedChapterIds.length} tập
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};
