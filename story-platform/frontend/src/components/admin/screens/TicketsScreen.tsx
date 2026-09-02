import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Send,
  CheckCircle2,
  Clock,
  Search,
  MessageSquare,
  Bot,
  User,
  Shield,
  Settings,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AdminSupportTicket } from '../../../types/admin';
import {
  supportRepository,
  SupportConversation,
  getAutoResponderSettings,
  saveAutoResponderSettings,
  AutoResponderSettings,
} from '../../../services/repositories/SupportRepository';

interface TicketsScreenProps {
  tickets: AdminSupportTicket[];
  onResolveTicket: (ticket: AdminSupportTicket, reply: string) => void;
}

export const TicketsScreen: React.FC<TicketsScreenProps> = ({
  onResolveTicket,
}) => {
  const location = useLocation();
  const stateSelectedId = location.state?.selectedTicketId;

  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(stateSelectedId || null);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [isSending, setIsSending] = useState(false);

  // Auto Responder State
  const [autoSettings, setAutoSettings] = useState<AutoResponderSettings>(getAutoResponderSettings());
  const [isEditingAutoReply, setIsEditingAutoReply] = useState(false);
  const [autoMessageText, setAutoMessageText] = useState(autoSettings.message);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await supportRepository.getAdminConversations();
      if (res && res.items) {
        setConversations(res.items);
        
        const activeId = selectedConvId || stateSelectedId;
        const itemsArray = Array.isArray(res.items) ? res.items : [];
        if (activeId && itemsArray.some((item) => item.id === activeId)) {
          setSelectedConvId(activeId);
          // Auto set status filter so that the selected conversation is visible
          const matchedConv = itemsArray.find((item) => item.id === activeId);
          if (matchedConv) {
            const isPending = matchedConv.status !== 'RESOLVED' && matchedConv.status !== 'CLOSED';
            if (isPending) {
              setStatusFilter('PENDING');
            } else {
              setStatusFilter('RESOLVED');
            }
          }
        } else if (itemsArray.length > 0) {
          // Default to first pending conversation if available, otherwise first overall
          const firstPending = itemsArray.find((item) => item.status !== 'RESOLVED' && item.status !== 'CLOSED');
          setSelectedConvId(firstPending ? firstPending.id : itemsArray[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading support conversations for admin', e);
    }
  };

  useEffect(() => {
    loadConversations();

    const handleSync = () => {
      loadConversations();
      setAutoSettings(getAutoResponderSettings());
    };

    window.addEventListener('toptruyenaudio_admin_sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('toptruyenaudio_admin_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedConvId]);

  // Toggle Auto-Responder
  const handleToggleAutoResponder = () => {
    const nextEnabled = !autoSettings.enabled;
    const newConfig = { ...autoSettings, enabled: nextEnabled };
    setAutoSettings(newConfig);
    saveAutoResponderSettings(newConfig);
  };

  // Save Auto-Reply Message
  const handleSaveAutoReplyMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = { ...autoSettings, message: autoMessageText.trim() };
    setAutoSettings(newConfig);
    saveAutoResponderSettings(newConfig);
    setIsEditingAutoReply(false);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()));

    const isPending = c.status !== 'RESOLVED' && c.status !== 'CLOSED';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && isPending) ||
      (statusFilter === 'RESOLVED' && !isPending);

    return matchesSearch && matchesStatus;
  });

  const selectedConv = Array.isArray(conversations) ? conversations.find((c) => c.id === selectedConvId) : null;

  // Send Admin Chat Reply
  const handleSendChatReply = async (e?: React.FormEvent, shouldClose: boolean = false) => {
    if (e) e.preventDefault();
    if (!selectedConvId || !replyText.trim() || isSending) return;

    setIsSending(true);
    try {
      await supportRepository.sendMessage(
        selectedConvId,
        'OWNER_ADMIN',
        'Ban Quản Trị (OWNER_ADMIN)',
        replyText.trim()
      );

      if (shouldClose) {
        await supportRepository.updateConversationStatus(selectedConvId, 'RESOLVED');
        // Legacy trigger to sync with AdminRepository
        if (selectedConv) {
          onResolveTicket(
            {
              id: selectedConv.id,
              userName: selectedConv.userName,
              userEmail: selectedConv.userId,
              subject: selectedConv.subject,
              category: (selectedConv.category as any) || 'OTHER',
              priority: (selectedConv.priority as any) || 'MEDIUM',
              status: 'RESOLVED',
              message: selectedConv.messages?.[0]?.content || '',
              createdAt: selectedConv.createdAt,
            },
            replyText.trim()
          );
        }
      }

      setReplyText('');
      await loadConversations();
    } catch (e) {
      console.error('Failed to send admin chat reply', e);
    } finally {
      setIsSending(false);
    }
  };

  // Trigger Instant Manual Auto-Reply
  const handleSendInstantAutoReply = async () => {
    if (!selectedConvId || isSending) return;
    setIsSending(true);
    try {
      await supportRepository.sendMessage(
        selectedConvId,
        'ADMIN',
        'Ban Quản Trị (Tự Động Bot)',
        autoSettings.message
      );
      await loadConversations();
    } catch (e) {
      console.error('Failed to send instant auto-reply', e);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Resolve / Re-open Status
  const handleToggleStatus = async (convId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'RESOLVED' || currentStatus === 'CLOSED' ? 'IN_PROGRESS' : 'RESOLVED';
    await supportRepository.updateConversationStatus(convId, nextStatus);

    if (selectedConv) {
      onResolveTicket(
        {
          id: selectedConv.id,
          userName: selectedConv.userName,
          userEmail: selectedConv.userId,
          subject: selectedConv.subject,
          category: (selectedConv.category as any) || 'OTHER',
          priority: (selectedConv.priority as any) || 'MEDIUM',
          status: nextStatus === 'RESOLVED' ? 'RESOLVED' : 'PENDING',
          message: selectedConv.messages?.[0]?.content || '',
          createdAt: selectedConv.createdAt,
        },
        nextStatus === 'RESOLVED' ? 'Đã đánh dấu giải quyết từ Admin Chat' : 'Đã mở lại ticket từ Admin Chat'
      );
    }
    await loadConversations();
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header & Auto-Responder Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Headphones className="w-5 h-5" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider">
                Chăm Sóc Khách Hàng Trực Tuyến
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Hộp Thoại Trò Chuyện Trực Tiếp (Support Chat)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Trao đổi tin nhắn hai chiều với người nghe & Cấu hình chế độ trả lời tự động khi Admin bận
            </p>
          </div>

          {/* Auto-Responder Toggle Switch */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-2xl shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  autoSettings.enabled
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Chế Độ Trả Lời Tự Động</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      autoSettings.enabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {autoSettings.enabled ? 'ĐANG BẬT (ADMIN VẮNG MẶT)' : 'ĐANG TẮT (TRỰC TRỰC TIẾP)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {autoSettings.enabled
                    ? 'Tự động gửi tin nhắn hẹn giờ khi người dùng gửi yêu cầu'
                    : 'Chỉ trả lời thủ công khi Admin chủ động gõ tin nhắn'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingAutoReply(!isEditingAutoReply)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors text-xs font-medium cursor-pointer"
                title="Cấu hình tin nhắn tự động"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleAutoResponder}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  autoSettings.enabled ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {autoSettings.enabled ? (
                  <ToggleRight className="w-8 h-8 text-amber-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Auto-Reply Config Modal/Drawer */}
        {isEditingAutoReply && (
          <form
            onSubmit={handleSaveAutoReplyMessage}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Cấu Hình Nội Dung Trả Lời Tự Động (Auto-Reply Message)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingAutoReply(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Đóng
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Nội dung tin nhắn sẽ tự động gửi khi người dùng tạo yêu cầu hoặc nhắn tin mới:
              </label>
              <textarea
                rows={3}
                value={autoMessageText}
                onChange={(e) => setAutoMessageText(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Quick Templates */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400">Gợi ý mẫu phản hồi nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setAutoMessageText(
                      'Chào bạn! Quản trị viên hiện đang tạm vắng mặt. Yêu cầu của bạn đã được ghi nhận và sẽ xử lý sớm nhất trong vòng 15-30 phút nữa.'
                    )
                  }
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Mẫu 1: Vắng mặt ngắn
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAutoMessageText(
                      'Chào bạn! Hiện tại Ban Quản Trị đang nâng cấp hệ thống âm thanh. Vấn đề của bạn đã được chuyển cho bộ phận kỹ thuật để xử lý khẩn cấp. Cảm ơn bạn!'
                    )
                  }
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Mẫu 2: Sự cố kỹ thuật
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAutoMessageText(
                      'Cảm ơn bạn đã liên hệ TOP TRUYỆN AUDIO. Yêu cầu kích hoạt gói / hỗ trợ thanh toán đang được xác minh giao dịch và sẽ hoàn tất trong ít phút.'
                    )
                  }
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Mẫu 3: Thanh toán Premium
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingAutoReply(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Interactive Chat Layout: 5 cols list & 7 cols chat stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Search & Conversation List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col justify-between min-h-[520px]">
          <div className="space-y-3">
            {/* Search & Filters */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm cuộc trò chuyện, tên người dùng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[38px]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cần xử lý ({conversations.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('RESOLVED')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  statusFilter === 'RESOLVED'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đã xong ({conversations.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length})
              </button>
            </div>

            {/* Conversation Items */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((c) => {
                  const isSelected = selectedConvId === c.id;
                  const isPending = c.status !== 'RESOLVED' && c.status !== 'CLOSED';
                  const lastMsg = c.messages[c.messages.length - 1];

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConvId(c.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-slate-950 border-cyan-500 shadow-lg ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                          {c.subject}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isPending ? '• Cần xử lý' : '✓ Đã xong'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {lastMsg ? lastMsg.content : 'Chưa có tin nhắn'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                        <span className="text-slate-300 font-medium truncate">{c.userName}</span>
                        <span>{(() => {
                          try {
                            const date = new Date(c.updatedAt);
                            if (isNaN(date.getTime())) return '--:--';
                            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                          } catch (e) {
                            return '--:--';
                          }
                        })()}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  Không tìm thấy cuộc trò chuyện nào
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center font-mono border-t border-slate-800 pt-2">
            Đồng bộ thời gian thực với ứng dụng người nghe
          </div>
        </div>

        {/* Right Column: Full Interactive Chat View (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between min-h-[520px]">
          {selectedConv ? (
            <div className="space-y-4 flex flex-col justify-between h-full">
              {/* Chat Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{selectedConv.subject}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedConv.status !== 'RESOLVED' && selectedConv.status !== 'CLOSED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {selectedConv.status !== 'RESOLVED' && selectedConv.status !== 'CLOSED'
                        ? 'Đang mở'
                        : 'Đã giải quyết'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Thành viên: <span className="text-cyan-300 font-medium">{selectedConv.userName}</span> ({selectedConv.userId})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedConv.id, selectedConv.status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedConv.status === 'RESOLVED' || selectedConv.status === 'CLOSED'
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {selectedConv.status === 'RESOLVED' || selectedConv.status === 'CLOSED' ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mở Lại Ticket</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đánh Dấu Giải Quyết</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={loadConversations}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                    title="Tải lại cuộc trò chuyện"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message Stream / Bubbles */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 my-2">
                {selectedConv.messages.map((msg) => {
                  const isUser = msg.senderRole === 'USER';
                  const isAutoBot = msg.senderName.includes('Tự Động') || msg.senderName.includes('Bot');

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      {/* Sender Avatar & Role Badge */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        {isUser ? (
                          <>
                            <User className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="font-bold text-cyan-300">{msg.senderName}</span>
                          </>
                        ) : isAutoBot ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-amber-300">{msg.senderName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                              [Auto-Reply]
                            </span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-bold text-emerald-300">{msg.senderName}</span>
                          </>
                        )}
                        <span className="text-slate-500 font-mono text-[9px] ml-1">
                          {(() => {
                            try {
                              const date = new Date(msg.createdAt);
                              if (isNaN(date.getTime())) return '--:--';
                              return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            } catch (e) {
                              return '--:--';
                            }
                          })()}
                        </span>
                      </div>

                      {/* Bubble content */}
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                          isUser
                            ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
                            : isAutoBot
                            ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 text-amber-100 border border-amber-500/40 rounded-tr-none'
                            : 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold">Mẫu phản hồi nhanh cho Admin:</span>
                  {autoSettings.enabled && (
                    <button
                      type="button"
                      onClick={handleSendInstantAutoReply}
                      className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Bot className="w-3 h-3" /> Gửi tin tự động ngay
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReplyText('Chào bạn, Ban Quản trị đã xác nhận và kích hoạt thành công cho tài khoản của bạn. Chúc bạn nghe truyện vui vẻ!')}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    + Kích hoạt thành công
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('Sự cố âm thanh đã được bộ phận kỹ thuật xử lý xong. Bạn vui lòng làm mới ứng dụng và nghe lại nhé.')}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    + Sửa xong audio
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('Cảm ơn phản hồi của bạn! Yêu cầu của bạn đã được chuyển đến bộ phận chăm sóc khách hàng để hỗ trợ chi tiết.')}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    + Đã ghi nhận
                  </button>
                </div>

                {/* Chat Reply Form */}
                <form onSubmit={(e) => handleSendChatReply(e, false)} className="space-y-2 pt-1">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập tin nhắn trao đổi với người dùng..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">
                      Gõ tin nhắn để trò chuyện liên tục 2 chiều
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!replyText.trim() || isSending}
                        onClick={() => handleSendChatReply(undefined, true)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
                      >
                        Gửi & Đóng Ticket
                      </button>

                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSending}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px] disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi Tin Nhắn</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-500 space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-700" />
              <p className="text-xs">Chọn một cuộc trò chuyện từ danh sách bên trái để mở hộp thoại trò chuyện trực tiếp</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

