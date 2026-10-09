import React, { useState } from 'react';
import { Mic, Upload, FileAudio, Radio, BarChart3 } from 'lucide-react';

export const CreatorStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'stories' | 'analytics'>('upload');
  
  // Upload form state
  const [storyTitle, setStoryTitle] = useState('');
  const [narratorName, setNarratorName] = useState('MC Hùng Sơn');
  const [chapterTitle, setChapterTitle] = useState('');
  const [accessLevel, setAccessLevel] = useState('FREE');

  const handleCreateAudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle || !chapterTitle) {
      alert('Vui lòng điền đầy đủ tên truyện và tên tập audio!');
      return;
    }
    alert(`Tải tập audio "${chapterTitle}" lên Creator Studio thành công! Tập audio sẽ được kiểm duyệt trong 15 phút.`);
    setStoryTitle('');
    setChapterTitle('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
          <Mic className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">Kênh Tác Giả & MC Giọng Đọc</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black text-white">Creator Studio Quản Lý Audio</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Đăng tải tập audio mới, cài đặt quyền truy cập và theo dõi lượt nghe</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all min-h-[44px] shrink-0 ${
            activeTab === 'upload' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" /> Đăng Tập Audio Mới
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all min-h-[44px] shrink-0 ${
            activeTab === 'stories' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" /> Audio Đã Đăng
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all min-h-[44px] shrink-0 ${
            activeTab === 'analytics' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Thống Kê & Doanh Thu
        </button>
      </div>

      {/* Upload Audio Form */}
      {activeTab === 'upload' && (
        <form onSubmit={handleCreateAudio} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-base sm:text-lg font-bold text-white border-b border-slate-800 pb-3">Tải Lên Tập Audio & Metadata</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tên Truyện Audio / Podcast</label>
              <input
                type="text"
                placeholder="Ví dụ: Phàm Nhân Tu Tiên Tập 6..."
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">MC / Giọng Đọc Thể Hiện</label>
              <input
                type="text"
                value={narratorName}
                onChange={(e) => setNarratorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tên Tập Audio</label>
              <input
                type="text"
                placeholder="Ví dụ: Tập 6: Đại Chiến Hắc Mộc Nhai..."
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Quyền Truy Cập</label>
              <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="FREE">Miễn phí (FREE)</option>
                  <option value="PREMIUM">Yêu cầu Premium (PREMIUM)</option>
                </select>
            </div>
          </div>

          {/* File Upload Simulation */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 sm:p-8 text-center space-y-2 bg-slate-950/50 cursor-pointer">
            <FileAudio className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 mx-auto" />
            <div className="text-xs font-bold text-white">Kéo thả file MP3 / M4A (320kbps) vào đây hoặc chọn file</div>
            <div className="text-[11px] text-slate-400">Hỗ trợ tối đa 500MB mỗi file audio HD</div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all min-h-[44px]"
          >
            Đăng Tải Tập Audio Lên Hệ Thống
          </button>
        </form>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase">Lượt Nghe Audio</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">154.200</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase">Tổng Giờ Nghe (Tháng)</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">1.450 Giờ</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase">Số Tập Đã Xuất Bản</div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">18 Tập</div>
          </div>
        </div>
      )}

    </div>
  );
};
