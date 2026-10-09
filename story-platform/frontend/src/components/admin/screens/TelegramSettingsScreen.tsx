import React, { useState, useEffect } from 'react';
import { Send, Save, CheckCircle, XCircle, Loader2, Bot, Upload, Trash2, FileText, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { siteSettingsService, TelegramSettings } from '../../../services/siteSettings';
import { apiRequest } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';

interface BotSettings {
  botEnabled: boolean;
  aiEnabled: boolean;
  aiTimeoutSeconds: number;
  autoHandoffEnabled: boolean;
  supportStartTime: string;
  supportEndTime: string;
  greetingMessage: string;
  handoffMessage: string;
  unknownMessage: string;
  outsideHoursMessage: string;
  closedMessage: string;
}

interface KnowledgeDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  errorMessage?: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export const TelegramSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<TelegramSettings>({
    isEnabled: false,
    botToken: '',
    adminChatId: '',
    webhookSecret: '',
  });
  const [botSettings, setBotSettings] = useState<BotSettings>({
    botEnabled: true,
    aiEnabled: true,
    aiTimeoutSeconds: 5,
    autoHandoffEnabled: true,
    supportStartTime: '08:00',
    supportEndTime: '22:00',
    greetingMessage: '',
    handoffMessage: '',
    unknownMessage: '',
    outsideHoursMessage: '',
    closedMessage: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingBotSettings, setIsSavingBotSettings] = useState(false);
  const [isLoadingBotSettings, setIsLoadingBotSettings] = useState(false);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isSyncingKnowledge, setIsSyncingKnowledge] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadSettings();
    loadBotSettings();
    loadKnowledgeDocuments();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiRequest('/telegram/admin/settings');
      if (response) {
        setSettings({
          isEnabled: response.isEnabled || false,
          botToken: response.botToken || '',
          adminChatId: response.adminChatId || '',
          webhookSecret: response.webhookSecret || '',
        });
      }
    } catch (error) {
      console.error('Failed to load Telegram settings:', error);
      // Fallback to localStorage
      setSettings(siteSettingsService.getTelegramSettings());
    }
  };

  const loadBotSettings = async () => {
    setIsLoadingBotSettings(true);
    try {
      const response = await apiRequest('/telegram/admin/bot-settings');
      if (response) {
        setBotSettings({
          botEnabled: response.botEnabled ?? true,
          aiEnabled: response.aiEnabled ?? true,
          aiTimeoutSeconds: response.aiTimeoutSeconds ?? 5,
          autoHandoffEnabled: response.autoHandoffEnabled ?? true,
          supportStartTime: response.supportStartTime ?? '08:00',
          supportEndTime: response.supportEndTime ?? '22:00',
          greetingMessage: response.greetingMessage || '',
          handoffMessage: response.handoffMessage || '',
          unknownMessage: response.unknownMessage || '',
          outsideHoursMessage: response.outsideHoursMessage || '',
          closedMessage: response.closedMessage || '',
        });
      }
    } catch (error) {
      console.error('Failed to load Bot settings:', error);
    } finally {
      setIsLoadingBotSettings(false);
    }
  };

  const loadKnowledgeDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const response = await apiRequest('/telegram/knowledge/documents');
      if (response) {
        setKnowledgeDocuments(response);
      }
    } catch (error) {
      console.error('Failed to load knowledge documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Lỗi', 'File quá lớn (tối đa 10MB)');
      return;
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Lỗi', 'Loại file không được hỗ trợ (chỉ chấp nhận TXT, PDF, DOCX)');
      return;
    }

    setIsUploadingDocument(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiRequest('/telegram/knowledge/upload', {
        method: 'POST',
        body: formData,
      });
      showToast('success', 'Thành công', 'Upload file thành công');
      await loadKnowledgeDocuments();
    } catch (error) {
      console.error('Failed to upload file:', error);
      showToast('error', 'Lỗi', 'Upload file thất bại');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa file này?')) return;

    try {
      await apiRequest(`/telegram/knowledge/documents/${id}`, {
        method: 'DELETE',
      });
      showToast('success', 'Thành công', 'Xóa file thành công');
      await loadKnowledgeDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      showToast('error', 'Lỗi', 'Xóa file thất bại');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">READY</span>;
      case 'PROCESSING':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">PROCESSING</span>;
      case 'FAILED':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">FAILED</span>;
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">{status}</span>;
    }
  };

  const handleSyncKnowledge = async () => {
    setIsSyncingKnowledge(true);
    try {
      const response = await apiRequest('/telegram/knowledge/sync-website-context', {
        method: 'POST',
      });
      showToast('success', 'Thành công', response.message || 'Đã sync Knowledge Base thành công!');
      await loadKnowledgeDocuments();
    } catch (error: any) {
      console.error('Failed to sync Knowledge Base:', error);
      showToast('error', 'Lỗi', error?.message || 'Sync Knowledge Base thất bại');
    } finally {
      setIsSyncingKnowledge(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    if (settings.isEnabled) {
      if (!settings.botToken) {
        setError('Vui lòng nhập Bot Token.');
        return;
      }
      if (!settings.adminChatId) {
        setError('Vui lòng nhập Admin Chat ID.');
        return;
      }
    }

    try {
      await apiRequest('/telegram/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      siteSettingsService.updateTelegramSettings(settings);
      showToast('success', 'Thành công', 'Đã lưu cấu hình Telegram thành công!');
      setTestResult(null);
    } catch (error) {
      console.error('Failed to save Telegram settings:', error);
      setError('Không thể lưu cấu hình. Vui lòng thử lại.');
    }
  };

  const handleSaveBotSettings = async () => {
    setIsSavingBotSettings(true);
    try {
      await apiRequest('/telegram/admin/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify(botSettings),
      });
      showToast('success', 'Thành công', 'Đã lưu cài đặt Bot thành công!');
    } catch (error: any) {
      console.error('Failed to save Bot settings:', error);
      setError(error?.message || 'Không thể lưu cài đặt Bot. Vui lòng thử lại.');
    } finally {
      setIsSavingBotSettings(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.botToken || !settings.adminChatId) {
      setError('Vui lòng nhập Bot Token và Admin Chat ID trước khi kiểm tra kết nối.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await apiRequest('/telegram/admin/test', {
        method: 'POST',
        body: JSON.stringify({
          botToken: settings.botToken,
          adminChatId: settings.adminChatId,
        }),
      });

      setTestResult({
        success: response.success || false,
        message: response.message || 'Kết nối thành công!',
      });

      if (response.success) {
        showToast('success', 'Kết nối thành công', 'Đã kết nối thành công với Telegram Bot!');
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error?.message || 'Không thể kết nối đến Telegram. Vui lòng kiểm tra lại thông tin.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2 text-blue-400 mb-2">
        <Send className="w-5 h-5" />
        <h3 className="text-lg font-bold text-white">Cấu Hình Telegram Bot</h3>
      </div>

      <p className="text-xs sm:text-sm text-slate-400">
        Cấu hình Telegram Bot để nhận và gửi tin nhắn hỗ trợ từ người dùng.
      </p>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
          {error}
        </div>
      )}

      {testResult && (
        <div className={`p-3 border text-xs rounded-xl flex items-center gap-2 ${
          testResult.success
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Toggle Enable */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Trạng thái (Bật/Tắt Telegram Bot)</span>
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${settings.isEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Form Fields */}
        <div className={`space-y-4 transition-opacity ${settings.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Bot Token</label>
            <input
              type="text"
              value={settings.botToken}
              onChange={(e) => setSettings(prev => ({ ...prev, botToken: e.target.value }))}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500">
              Lấy từ @BotFather trên Telegram
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Admin Chat ID</label>
            <input
              type="text"
              value={settings.adminChatId}
              onChange={(e) => setSettings(prev => ({ ...prev, adminChatId: e.target.value }))}
              placeholder="123456789"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500">
              Chat ID của admin sẽ nhận tin nhắn hỗ trợ
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Webhook Secret (Tùy chọn)</label>
            <input
              type="text"
              value={settings.webhookSecret}
              onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
              placeholder="your-secret-key"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500">
              Mã bảo mật để xác thực webhook từ Telegram
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isTesting || !settings.botToken || !settings.adminChatId}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kiểm Tra Kết Nối</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cấu Hình Telegram</span>
        </button>
      </div>

      {/* BOT SETTINGS SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Bot className="w-5 h-5" />
          <h3 className="text-lg font-bold text-white">🤖 BOT SETTINGS</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-400">
          Cấu hình Bot tự động trả lời và chuyển CSKH.
        </p>

        {isLoadingBotSettings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bot Enabled */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Bot tự động</span>
              <button
                type="button"
                onClick={() => setBotSettings(prev => ({ ...prev, botEnabled: !prev.botEnabled }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${botSettings.botEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${botSettings.botEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* AI Enabled */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">AI tự động trả lời</span>
              <button
                type="button"
                onClick={() => setBotSettings(prev => ({ ...prev, aiEnabled: !prev.aiEnabled }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${botSettings.aiEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${botSettings.aiEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* AI Timeout */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Thời gian Bot xử lý (giây)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={botSettings.aiTimeoutSeconds}
                onChange={(e) => setBotSettings(prev => ({ ...prev, aiTimeoutSeconds: parseInt(e.target.value) || 5 }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500">
                Thời gian tối đa để AI xử lý (1-30 giây)
              </p>
            </div>

            {/* Auto Handoff */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Tự động chuyển CSKH</span>
              <button
                type="button"
                onClick={() => setBotSettings(prev => ({ ...prev, autoHandoffEnabled: !prev.autoHandoffEnabled }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${botSettings.autoHandoffEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${botSettings.autoHandoffEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Support Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Từ</label>
                <input
                  type="time"
                  value={botSettings.supportStartTime}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, supportStartTime: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Đến</label>
                <input
                  type="time"
                  value={botSettings.supportEndTime}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, supportEndTime: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Tin nhắn chào mừng</label>
                <textarea
                  value={botSettings.greetingMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, greetingMessage: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Tin nhắn chào mừng khi người dùng bắt đầu..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Tin nhắn khi chuyển CSKH</label>
                <textarea
                  value={botSettings.handoffMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, handoffMessage: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Tin nhắn khi chuyển đến nhân viên CSKH..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Tin nhắn khi Bot không hiểu</label>
                <textarea
                  value={botSettings.unknownMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, unknownMessage: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Tin nhắn khi Bot không hiểu yêu cầu..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Tin nhắn ngoài giờ</label>
                <textarea
                  value={botSettings.outsideHoursMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, outsideHoursMessage: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Tin nhắn khi ngoài giờ hỗ trợ..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Tin nhắn khi hội thoại đã đóng</label>
                <textarea
                  value={botSettings.closedMessage}
                  onChange={(e) => setBotSettings(prev => ({ ...prev, closedMessage: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Tin nhắn khi hội thoại đã đóng..."
                />
              </div>
            </div>

            <button
              onClick={handleSaveBotSettings}
              disabled={isSavingBotSettings}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSavingBotSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Cài Đặt Bot</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* KNOWLEDGE BASE SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-green-400 mb-2">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-bold text-white">📚 KNOWLEDGE BASE</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-400">
          Upload tài liệu để AI đọc và trả lời câu hỏi của người dùng.
        </p>

        {/* Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="knowledge-file"
              accept=".txt,.pdf,.docx,.doc"
              onChange={handleFileUpload}
              disabled={isUploadingDocument}
              className="hidden"
            />
            <label
              htmlFor="knowledge-file"
              className={`flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer`}
            >
              {isUploadingDocument ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang upload...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </>
              )}
            </label>
          </div>
          <p className="text-[10px] text-slate-500">
            Chấp nhận: TXT, PDF, DOCX (tối đa 10MB)
          </p>

          {/* Sync Website Context Button */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleSyncKnowledge}
              disabled={isSyncingKnowledge}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSyncingKnowledge ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang sync...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Knowledge Base</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 mt-2">
              Đọc website-context.txt từ source code và tạo chunks
            </p>
          </div>
        </div>

        {/* Documents List */}
        {isLoadingDocuments ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : knowledgeDocuments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Chưa có tài liệu nào được upload
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {knowledgeDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-white truncate">{doc.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{doc.chunkCount} chunks</span>
                    <span>•</span>
                    {getStatusBadge(doc.status)}
                  </div>
                  {doc.errorMessage && (
                    <div className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span className="truncate">{doc.errorMessage}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                  title="Xóa file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
