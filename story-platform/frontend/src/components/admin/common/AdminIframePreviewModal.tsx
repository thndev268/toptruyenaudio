import React, { useState } from 'react';
import { Video, X, Smartphone, Monitor, Code, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { extractYouTubeId } from '../../../context/AudioPlayerContext';

interface AdminIframePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  iframeCodeOrUrl: string;
  title?: string;
}

export const AdminIframePreviewModal: React.FC<AdminIframePreviewModalProps> = ({
  isOpen,
  onClose,
  iframeCodeOrUrl,
  title = 'Demo Trình Chiếu Video Iframe',
}) => {
  const [deviceMode, setDeviceMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [customInput, setCustomInput] = useState<string>('');
  const [activeCode, setActiveCode] = useState<string>(iframeCodeOrUrl);

  // Update active code when prop changes
  React.useEffect(() => {
    setActiveCode(iframeCodeOrUrl);
    setCustomInput(iframeCodeOrUrl);
  }, [iframeCodeOrUrl, isOpen]);

  if (!isOpen) return null;

  const currentText = customInput.trim() || activeCode.trim();
  const ytId = extractYouTubeId(currentText);

  // Determine final embed src URL or iframe HTML
  let embedUrl = '';
  if (ytId) {
    embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&enablejsapi=1`;
  } else if (currentText.includes('<iframe')) {
    const srcMatch = currentText.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      embedUrl = srcMatch[1];
    }
  } else if (currentText.startsWith('http://') || currentText.startsWith('https://')) {
    embedUrl = currentText;
  }

  // Clean iframe HTML string if raw HTML passed
  const getSanitizedIframeHtml = () => {
    if (ytId) {
      return `<iframe src="${embedUrl}" title="YouTube Video Preview" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="w-full h-full rounded-2xl"></iframe>`;
    }

    if (currentText.includes('<iframe')) {
      // Inject w-full h-full and remove hardcoded pixel widths/heights that break layout
      let cleanHtml = currentText
        .replace(/width=["']\d+["']/gi, 'width="100%"')
        .replace(/height=["']\d+["']/gi, 'height="100%"');
      return cleanHtml;
    }

    if (embedUrl) {
      return `<iframe src="${embedUrl}" title="Video Preview" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full rounded-2xl"></iframe>`;
    }

    return '';
  };

  const iframeHtml = getSanitizedIframeHtml();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Kiểm tra hiển thị chuẩn responsive trên màn hình User
              </p>
            </div>
          </div>

          {/* Viewport device switcher */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDeviceMode('DESKTOP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deviceMode === 'DESKTOP'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (16:9)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('MOBILE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deviceMode === 'MOBILE'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Frame</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Đóng Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status info bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {ytId ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-semibold truncate">
                    Xác nhận YouTube Embed Video (ID: <code className="font-mono">{ytId}</code>)
                  </span>
                </>
              ) : iframeHtml ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 font-semibold truncate">Mã Iframe Hợp Lệ</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-300 font-semibold">Chưa có mã Iframe hoặc Link Video</span>
                </>
              )}
            </div>

            {embedUrl && (
              <a
                href={embedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Mở tab mới</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Video Player Display Stage */}
          <div className="flex justify-center items-center py-2 bg-slate-950/60 rounded-3xl p-3 sm:p-6 border border-slate-800/80 min-h-[260px]">
            {iframeHtml ? (
              <div
                className={`transition-all duration-300 relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 w-full ${
                  deviceMode === 'MOBILE'
                    ? 'max-w-[360px] aspect-[9/16] max-h-[480px]'
                    : 'max-w-3xl aspect-video'
                }`}
              >
                <div
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:aspect-video [&>iframe]:border-0"
                  dangerouslySetInnerHTML={{ __html: iframeHtml }}
                />
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500 space-y-2">
                <Code className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs sm:text-sm font-medium">Vui lòng nhập hoặc dán mã Iframe / Link YouTube ở ô bên dưới để thử demo.</p>
              </div>
            )}
          </div>

          {/* Quick Input & Test Area for Admin */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Code className="w-4 h-4 text-rose-400" />
              <span>Thử Nhập/Sửa Mã Iframe Demo</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder='Dán link YouTube (https://www.youtube.com/watch?v=...) hoặc mã <iframe ...></iframe>'
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setActiveCode(customInput)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Cập Nhật</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
