import React, { useState } from 'react';
import {
  Video,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Play,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  Radio,
  Layers,
  Crown,
  Info,
  Loader2,
  Code,
  Settings,
  Eye,
  EyeOff,
  Sliders
} from 'lucide-react';
import { AdminStoryItem } from '../../../types/admin';
import { adminRepository } from '../../../services/repositories/AdminRepository';
import { AdminIframePreviewModal } from '../common/AdminIframePreviewModal';

interface VideoStoriesAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  stories: AdminStoryItem[];
}

export const VideoStoriesAdminModal: React.FC<VideoStoriesAdminModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  stories,
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT' | 'CREATE' | 'SETTINGS'>('IMPORT');
  const [iframeInputText, setIframeInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<Partial<AdminStoryItem>[]>([]);

  // Video Display Settings State
  const [videoSettings, setVideoSettings] = useState(() => adminRepository.getVideoSettings());
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Manual create / edit state
  const [editingStory, setEditingStory] = useState<Partial<AdminStoryItem> | null>(null);
  const [previewIframe, setPreviewIframe] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const videoStories = stories.filter((s) => s.isVideoStory || !!s.iframeUrl || !!s.iframeCode);

  // Call API to analyze video iframes
  const handleAnalyzeIframes = async () => {
    if (!iframeInputText.trim()) return;
    setIsExtracting(true);

    try {
      const res = await fetch('/api/v1/admin/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iframeInput: iframeInputText }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setExtractedItems(json.data);
          setActiveTab('IMPORT');
        }
      } else {
        // Fallback client side extractor if backend error
        fallbackClientExtract(iframeInputText);
      }
    } catch (err) {
      console.warn("Using client-side video parser fallback:", err);
      fallbackClientExtract(iframeInputText);
    } finally {
      setIsExtracting(false);
    }
  };

  const fallbackClientExtract = (text: string) => {
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const matches = text.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>.*?<\/iframe>|<iframe[^>]*src=["']([^"']+)["'][^>]*\/>/gi)
      || text.match(/https?:\/\/[^\s"']+/gi)
      || [text];

    const results: Partial<AdminStoryItem>[] = [];

    matches.forEach((item, idx) => {
      let src = '';
      const srcM = item.match(/src=["']([^"']+)["']/i);
      if (srcM) src = srcM[1];
      else if (item.startsWith('http')) src = item;

      let ytId = '';
      const ytM = (src || item).match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (ytM) ytId = ytM[1];

      const thumbnail = ytId
        ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
        : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';

      const iframeCode = item.includes('<iframe')
        ? item
        : `<iframe width="100%" height="450" src="${ytId ? `https://www.youtube.com/embed/${ytId}` : src}" title="Video Player" frameborder="0" allowfullscreen></iframe>`;

      let titleFromIframe = '';
      const titleM = item.match(/title=["']([^"']+)["']/i);
      if (titleM && titleM[1] && titleM[1] !== 'Video Player') {
        titleFromIframe = titleM[1];
      }

      results.push({
        id: `video-import-${Date.now()}-${idx}`,
        title: titleFromIframe || `Video Truyện Lồng Tiếng #${idx + 1}${ytId ? ` (${ytId})` : ''}`,
        summary: titleFromIframe ? `Cốt truyện cho: ${titleFromIframe}` : `Cốt truyện video #${idx + 1}: Diễn biến gay cấn xoay quanh những nhân vật chính và phân cảnh hình ảnh âm thanh giàu cảm xúc.`,
        storyline: `Cốt truyện chi tiết: Bộ phim video câu chuyện dẫn dắt người xem qua từng diễn biến đặc sắc, cao trào và thông điệp nhân văn sâu sắc.`,
        audioContent: `Nội dung âm thanh kịch bản lời thoại:\n- Thuyết minh tập ${idx + 1} trọn vẹn.\n- Âm nhạc nền và hiệu ứng âm thanh lồng tiếng sống động.`,
        coverUrl: thumbnail,
        iframeUrl: ytId ? `https://www.youtube.com/embed/${ytId}` : src,
        iframeCode: iframeCode,
        authorName: 'Kênh Video Production',
        narratorName: 'MC Giọng Đọc AI',
        genres: ['Truyện Video', 'Podcast & Đêm Muộn'],
        accessLevel: 'FREE',
        publishStatus: 'PUBLISHED',
        isVideoStory: true,
      });
    });

    setExtractedItems(results);
    setActiveTab('IMPORT');
  };

  const handleSaveAllExtracted = async () => {
    if (!extractedItems.length || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    const res = await adminRepository.addBulkVideos(extractedItems as any);
    setIsSaving(false);
    if (res.success) {
      setExtractedItems([]);
      setIframeInputText('');
      onRefreshData();
      setActiveTab('LIST');
    } else {
      // In a real app we might want to show a toast, but here we can just alert or log
      alert(res.message || 'Lỗi khi lưu video.');
    }
  };

  const handleSaveSingleStory = async (storyData: Partial<AdminStoryItem>) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    let res;
    if (storyData.id) {
      res = await adminRepository.updateVideoStory(storyData.id, storyData);
    } else {
      res = await adminRepository.addVideoStory(storyData);
    }
    setIsSaving(false);
    if (res.success) {
      setEditingStory(null);
      onRefreshData();
    } else {
      setSaveError(res.message);
    }
  };

  const handleDeleteVideo = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa video story này khỏi hệ thống?')) {
      adminRepository.deleteStory(id, 'Admin xóa video story');
      onRefreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Quản Lý Video Iframe & Trích Xuất AI
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                  Gemini Pro AI
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập mã iframe cho nhiều video để tự động lấy Thumbnail, Cốt truyện, và Lời thoại âm thanh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'IMPORT'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Nhập Iframe & Trích Xuất AI
          </button>
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'LIST'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Danh Sách Video ({videoStories.length})
          </button>
          <button
            onClick={() => {
              setEditingStory({
                title: '',
                summary: '',
                storyline: '',
                audioContent: '',
                coverUrl: '',
                iframeCode: '',
                iframeUrl: '',
                accessLevel: 'FREE',
                publishStatus: 'PUBLISHED',
              });
              setActiveTab('CREATE');
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'CREATE'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            Thêm Video Thủ Công
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Cấu Hình Player & CSS Toggle
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: IMPORT & EXTRACT */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    Dán Mã Iframe hoặc Link Video (Hỗ trợ nhiều video cùng lúc, mỗi video 1 dòng hoặc bọc thẻ iframe)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Hỗ trợ: YouTube Embed, Youtube Watch URLs, Vimeo, Iframe HTML
                  </span>
                </div>

                <textarea
                  rows={5}
                  value={iframeInputText}
                  onChange={(e) => setIframeInputText(e.target.value)}
                  placeholder={`<iframe width="560" height="315" src="https://www.youtube.com/embed/jfKfPfyJRdk" title="Truyện Video 1"></iframe>\nhttps://www.youtube.com/watch?v=5qap5aO4i9A`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500 resize-y"
                />

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    AI Gemini sẽ tự động nhận diện ID video, phân tích Tiêu đề, tạo Ảnh Thumbnail sắc nét, tổng hợp Cốt Truyện và trích xuất Lời Thoại Âm Thanh.
                  </p>

                  <button
                    onClick={handleAnalyzeIframes}
                    disabled={isExtracting || !iframeInputText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI Đang Phân Tích...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Tự Động Trích Xuất Dữ Liệu AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Extracted Preview Items */}
              {extractedItems.length > 0 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Kết Quả Trích Xuất AI ({extractedItems.length} video)
                    </h3>

                    <button
                      onClick={handleSaveAllExtracted}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>{isSaving ? 'Đang lưu...' : 'Đăng Tất Cả Video Lên Website'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 relative group"
                      >
                        <div className="flex gap-3">
                          <img
                            loading="lazy"
                            src={item.coverUrl}
                            alt=""
                            className="w-28 h-20 object-cover rounded-xl border border-slate-800 shrink-0 bg-slate-800"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => {
                                const next = [...extractedItems];
                                next[idx].title = e.target.value;
                                setExtractedItems(next);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                            />
                            <div className="flex gap-2 text-[10px] text-slate-400">
                              <span>Tác giả: {item.authorName}</span>
                              <span>• MC: {item.narratorName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Storyline (Cốt truyện) */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Cốt Truyện Video (Mô tả):
                          </label>
                          <textarea
                            rows={2}
                            value={item.summary || item.storyline || ''}
                            onChange={(e) => {
                              const next = [...extractedItems];
                              next[idx].summary = e.target.value;
                              next[idx].storyline = e.target.value;
                              setExtractedItems(next);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        {/* Audio Content (Làm nội dung âm thanh) */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                            Âm Thanh & Lời Thoại (Nội dung transcript):
                          </label>
                          <textarea
                            rows={3}
                            value={item.audioContent || ''}
                            onChange={(e) => {
                              const next = [...extractedItems];
                              next[idx].audioContent = e.target.value;
                              setExtractedItems(next);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIST EXISTING VIDEOS */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoStories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0 border border-slate-800">
                        <img loading="lazy" src={story.coverUrl} alt="" className="w-full h-full object-cover bg-slate-800" />
                        <button
                          onClick={() => setPreviewIframe(story.iframeCode || story.iframeUrl || '')}
                          className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-6 h-6 text-white fill-white" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{story.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {story.authorName} • {story.narratorName}
                        </p>

                        <div className="flex gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                            Video Iframe
                          </span>
                          {story.accessLevel === 'PREMIUM' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                              <Crown className="w-3 h-3" /> Premium
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              Miễn Phí
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cốt truyện preview */}
                    <div className="bg-slate-900/80 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1">
                      <span className="font-bold text-rose-400 block text-[10px] uppercase">
                        Cốt truyện (Mô tả):
                      </span>
                      <p className="line-clamp-2">{story.storyline || story.summary}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setPreviewIframe(story.iframeCode || story.iframeUrl || '')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 text-rose-400" /> Xem Iframe
                      </button>
                      <button
                        onClick={() => {
                          setEditingStory(story);
                          setActiveTab('CREATE');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Sửa CRUD
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(story.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE / EDIT MANUAL */}
          {(activeTab === 'CREATE' || editingStory) && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-400" />
                {editingStory?.id ? 'Chỉnh Sửa Video Story' : 'Thêm Mới Video Story Thủ Công'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Tiêu đề Video / Truyện</label>
                  <input
                    type="text"
                    value={editingStory?.title || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="Nhập tiêu đề video..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Link Ảnh Thumbnail (Cover Image)</label>
                  <input
                    type="text"
                    value={editingStory?.coverUrl || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, coverUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="https://img.youtube.com/vi/.../maxresdefault.jpg"
                  />
                </div>
              </div>

              {/* Storyline Cốt truyện */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Cốt Truyện (Mô tả nội dung video)</label>
                <textarea
                  rows={3}
                  value={editingStory?.storyline || editingStory?.summary || ''}
                  onChange={(e) =>
                    setEditingStory({
                      ...editingStory,
                      summary: e.target.value,
                      storyline: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder="Nhập chi tiết cốt truyện..."
                />
              </div>

              {/* Audio Content Âm thanh */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-cyan-400">Âm Thanh & Lời Thoại (Kịch bản transcript)</label>
                <textarea
                  rows={4}
                  value={editingStory?.audioContent || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, audioContent: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder="Kịch bản lời thoại âm thanh chi tiết..."
                />
              </div>

              {/* Mã Iframe Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Mã Iframe Embed HTML</label>
                  {editingStory?.iframeCode && (
                    <button
                      type="button"
                      onClick={() => setPreviewIframe(editingStory.iframeCode || '')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Xem Demo Video
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={editingStory?.iframeCode || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updates: any = { iframeCode: val, iframeUrl: val };
                    
                    // Trích xuất tiêu đề (title) từ thẻ iframe
                    const titleMatch = val.match(/title=["']([^"']+)["']/i);
                    if (titleMatch && titleMatch[1]) {
                      // Nếu có tiêu đề trong iframe, tự động điền vào title của truyện
                      updates.title = titleMatch[1];
                    }
                    
                    setEditingStory({ ...editingStory, ...updates } as any);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                  placeholder='<iframe width="100%" height="450" src="https://www.youtube.com/embed/..." title="Tiêu đề video" frameborder="0" allowfullscreen></iframe>'
                />
              </div>

              <div className="flex flex-col gap-2 pt-3">
                {saveError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    {saveError}
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setEditingStory(null);
                      setActiveTab('LIST');
                      setSaveError(null);
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50"
                  >
                    Hủy
                  </button>

                  <button
                    onClick={() => handleSaveSingleStory(editingStory || {})}
                    disabled={isSaving}
                    className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu Nội Dung'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS (CẤU HÌNH BẬT TẮT XEM IFRAME VÀ CSS HIDE) */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-rose-400" />
                    Cấu Hình Hiển Thị Khung Video Iframe & Bật Tắt CSS (Admin Setting)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Lấy toàn bộ iframe video nhưng cho phép ẩn khung bằng CSS để giữ âm thanh phát ngầm liên tục, đồng thời cung cấp tùy chọn bật/tắt cho quản trị viên và khán giả.
                  </p>
                </div>

                {settingsMessage && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{settingsMessage}</span>
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  {/* Option 1: Hide iframe with CSS */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Mặc định Ẩn Khung Video Iframe bằng CSS</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Áp dụng lớp CSS <code className="text-rose-400 bg-slate-900 px-1 py-0.5 rounded">hidden</code> để ẩn khung hiển thị video ở giao diện người dùng. Âm thanh vẫn tiếp tục chạy ngầm trong DOM mà không bị gián đoạn.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...videoSettings, hideIframeWithCSS: !videoSettings.hideIframeWithCSS };
                        setVideoSettings(updated);
                        const res = adminRepository.saveVideoSettings(updated);
                        setSettingsMessage(res.message);
                        setTimeout(() => setSettingsMessage(null), 3000);
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                        videoSettings.hideIframeWithCSS
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {videoSettings.hideIframeWithCSS ? 'Đang Ẩn bằng CSS (ON)' : 'Hiển Thị Khung (OFF)'}
                    </button>
                  </div>

                  {/* Option 2: Allow User Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold text-white">Cho phép Khán giả tự Bật/Tắt (Ẩn/Hiện) Khung Video</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Hiển thị nút bấm <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">[ 👁️ Ẩn/Hiện Khung Video ]</code> ở trang chi tiết truyện và trình phát nhạc để người dùng tự điều chỉnh.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...videoSettings, allowUserToggleIframe: !videoSettings.allowUserToggleIframe };
                        setVideoSettings(updated);
                        const res = adminRepository.saveVideoSettings(updated);
                        setSettingsMessage(res.message);
                        setTimeout(() => setSettingsMessage(null), 3000);
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                        videoSettings.allowUserToggleIframe
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {videoSettings.allowUserToggleIframe ? 'Cho Phép Khán Giả Toggle (ON)' : 'Khóa Nút Toggle (OFF)'}
                    </button>
                  </div>

                  {/* Option 3: Autoplay Video */}
                  <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Tự động phát Video (Autoplay)</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Kích hoạt thuộc tính autoplay cho iframe video khi khởi chạy tập audio mới.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...videoSettings, autoPlayVideo: !videoSettings.autoPlayVideo };
                        setVideoSettings(updated);
                        const res = adminRepository.saveVideoSettings(updated);
                        setSettingsMessage(res.message);
                        setTimeout(() => setSettingsMessage(null), 3000);
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                        videoSettings.autoPlayVideo
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {videoSettings.autoPlayVideo ? 'Đang Bật Autoplay (ON)' : 'Tắt Autoplay (OFF)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview Iframe Modal */}
      <AdminIframePreviewModal
        isOpen={Boolean(previewIframe)}
        onClose={() => setPreviewIframe(null)}
        iframeCodeOrUrl={previewIframe || ''}
      />
    </div>
  );
};
