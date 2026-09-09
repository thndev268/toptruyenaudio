import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  User,
  Shield,
  HelpCircle,
  PlusCircle,
  AlertCircle,
  Loader2,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  supportRepository,
  SupportConversation,
} from '../../services/repositories/SupportRepository';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../../lib/supabase';

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-start gap-2 mb-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl rounded-bl-none px-4 py-3">
      <div className="flex items-center gap-1">
        <span className="text-purple-100 text-sm font-medium">AI đang chat</span>
        <div className="flex gap-1 ml-2">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);

export const SupportView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  const isConversationsRoute = location.pathname.includes('/conversations');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'center' | 'conversations'>(
    isConversationsRoute ? 'conversations' : 'center'
  );

  useEffect(() => {
    setActiveTab(location.pathname.includes('/conversations') ? 'conversations' : 'center');
  }, [location.pathname]);

  // Support Request State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conversations State
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Socket.IO connection
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) {
      console.log('[SUPPORT VIEW] No user, skipping socket connection');
      return;
    }

    console.log('[SUPPORT VIEW] User present, preparing socket connection');
    let socket: Socket | null = null;
    let isMounted = true;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socketUrl = apiUrl.replace(/\/api\/v1$/, '');

    console.log('[SUPPORT VIEW] Connecting to:', socketUrl);

    const initSocket = async () => {
      try {
        console.log('[SUPPORT VIEW] Getting Supabase session...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) {
          console.log('[SUPPORT VIEW] Component unmounted, aborting connection');
          return;
        }

        if (error) {
          console.error('[SUPPORT VIEW AUTH] Failed to get session:', error);
          return;
        }

        if (!session || !session.access_token) {
          console.error('[SUPPORT VIEW AUTH] No session or token found');
          return;
        }

        console.log('[SUPPORT VIEW] creating authenticated connection');
        console.log('[SUPPORT VIEW AUTH] token exists:', true);
        console.log('[SUPPORT VIEW AUTH] token length:', session.access_token.length);

        socket = io(socketUrl, {
          auth: {
            token: session.access_token,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        if (!isMounted) {
          console.log('[SUPPORT VIEW] Component unmounted after socket creation, disconnecting');
          socket.disconnect();
          return;
        }

        socketRef.current = socket;

        if (socket) {
          socket.on('connect', () => {
            console.log('[SUPPORT VIEW] socket connected');
            console.log('[SUPPORT VIEW] socket id:', socket!.id);
          });

          socket.on('connected', (data) => {
            console.log('[SUPPORT VIEW] connected event received:', data);
          });

          socket.on('new-message', (data) => {
            console.log('[SUPPORT VIEW] new-message received');
            console.log('[SUPPORT VIEW] payload:', JSON.stringify(data));
            console.log('[SUPPORT VIEW] Message senderRole:', data.message?.senderRole);

            // Turn off typing indicator when receiving BOT message
            if (data.message?.senderRole === 'AI') {
              console.log('[AI CHAT] bot message received, stopping typing (SupportView)');
              setIsBotTyping(false);
            }
            console.log('[SUPPORT VIEW] Received conversation ID:', data.conversationId);
            console.log('[SUPPORT VIEW] Message ID:', data.message?.id);
            console.log('[SUPPORT VIEW] Message senderRole:', data.message?.senderRole);

            // Update conversations state
            setConversations((prev) => {
              const targetConvIndex = prev.findIndex((c) => c.id === data.conversationId);
              if (targetConvIndex === -1) {
                console.log('[SUPPORT VIEW] Conversation not found in state, reloading...');
                loadConversations();
                return prev;
              }

              const updated = [...prev];
              const targetConv = { ...updated[targetConvIndex] };

              // Check if message already exists
              if (targetConv.messages.some((m) => m.id === data.message.id)) {
                console.log('[SUPPORT VIEW] Duplicate message detected, skipping');
                return prev;
              }

              targetConv.messages = [...targetConv.messages, data.message];
              updated[targetConvIndex] = targetConv;
              console.log('[SUPPORT VIEW] Message appended to conversation, messages count:', targetConv.messages.length);
              return updated;
            });
          });

          socket.on('connect_error', (error) => {
            console.error('[SUPPORT VIEW] connect_error:', error);
          });

          socket.on('disconnect', (reason) => {
            console.log('[SUPPORT VIEW] disconnected:', reason);
          });
        }
      } catch (error) {
        console.error('[SUPPORT VIEW] Error initializing socket:', error);
      }
    };

    initSocket();

    return () => {
      console.log('[SUPPORT VIEW] Cleanup: disconnecting socket');
      isMounted = false;
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Load conversations
  const loadConversations = async () => {
    if (!user) return;
    const list = await supportRepository.getConversations(user.id);
    setConversations(list);
    if (list.length > 0 && !selectedConvId) {
      setSelectedConvId(list[0].id);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Create new ticket/conversation
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message || !user) return;

    setIsSubmitting(true);
    try {
      const created = await supportRepository.createConversation(
        user.id,
        user.name,
        subject,
        message
      );
      showToast('success', 'Đã gửi yêu cầu', 'Yêu cầu của bạn đã được chuyển tới Ban quản trị.');
      setSubject('');
      setMessage('');
      await loadConversations();
      setSelectedConvId(created.id);
      setActiveTab('conversations');
    } catch {
      showToast('error', 'Lỗi', 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send reply message
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedConvId || !user) return;

    setIsSendingReply(true);
    setIsBotTyping(true);
    console.log('[AI CHAT] typing started (SupportView)');
    try {
      await supportRepository.sendMessage(
        selectedConvId,
        'USER',
        user.name,
        replyMessage.trim()
      );
      setReplyMessage('');
      await loadConversations();
      showToast('success', 'Đã gửi tin nhắn', 'Tin nhắn của bạn đã được lưu.');
    } catch {
      showToast('error', 'Lỗi', 'Không thể gửi tin nhắn.');
      setIsBotTyping(false);
    } finally {
      setIsSendingReply(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 animate-fadeIn pb-24">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <LifeBuoy className="w-6 h-6" />
          <span className="text-xs uppercase font-mono font-bold tracking-wider">
            Trung Tâm Hỗ Trợ Khách Hàng
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Hỗ Trợ TOP TRUYỆN AUDIO</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Gửi yêu cầu giải đáp thắc mắc, phản hồi lỗi phát thanh hoặc trao đổi trực tiếp với Ban Quản Trị.
        </p>
      </div>

      {/* SEGMENT TABS */}
      <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-2 gap-1 shadow-md">
        <Link
          to="/support"
          onClick={() => setActiveTab('center')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
            activeTab === 'center'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Gửi yêu cầu hỗ trợ</span>
        </Link>

        <Link
          to="/support/conversations"
          onClick={() => setActiveTab('conversations')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
            activeTab === 'conversations'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Trao đổi với Admin</span>
        </Link>
      </div>

      {/* TAB 1: SUPPORT CENTER (Gửi Yêu Cầu Mới & FAQ) */}
      {activeTab === 'center' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Gửi Yêu Cầu */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cyan-400" /> Gửi Yêu Cầu Mới
            </h2>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Chủ đề cần hỗ trợ</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors min-h-[44px]"
                  required
                >
                  <option value="">-- Chọn chủ đề --</option>
                  <option value="Tài khoản & Đăng nhập">Tài khoản & Đăng nhập</option>
                  <option value="Vấn đề gói Premium & Thanh toán">Vấn đề gói Premium & Thanh toán</option>
                  <option value="Lỗi phát audio / Giọng đọc">Lỗi phát audio / Giọng đọc</option>
                  <option value="Góp ý tính năng & Khác">Góp ý tính năng & Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mô tả chi tiết nội dung</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Vui lòng mô tả chi tiết vấn đề hoặc yêu cầu của bạn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sau khi gửi, yêu cầu sẽ được chuyển đến chuyên mục "Trao đổi với Admin". Bạn có thể theo dõi và phản hồi lại bất cứ lúc nào.
              </p>

              <button
                type="submit"
                disabled={isSubmitting || !subject || !message}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Gửi Yêu Cầu</span>
              </button>
            </form>
          </div>

          {/* FAQ & Hướng dẫn */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" /> Câu Hỏi Thường Gặp
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <h3 className="text-xs font-bold text-white">Làm sao để đăng ký gói Premium?</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bạn truy cập vào mục "Gói Premium" hoặc bấm "Nâng cấp Premium" trong Hồ sơ cá nhân để chọn gói 1 tháng, 3 tháng hoặc 1 năm.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <h3 className="text-xs font-bold text-white">Tiến độ nghe truyện có bị mất khi đổi thiết bị không?</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tiến độ nghe được đồng bộ tự động với tài khoản của bạn. Đảm bảo bạn đã đăng nhập đúng email.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                <h3 className="text-xs font-bold text-white">Làm thế nào để tải truyện nghe offline?</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tính năng tải offline yêu cầu tài khoản Premium đang còn hiệu lực và được bật trong phần cài đặt trình phát.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRAO ĐỔI VỚI ADMIN */}
      {activeTab === 'conversations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" /> Hộp Thoại Trao Đổi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem lịch sử trao đổi và phản hồi từ Quản trị viên (OWNER_ADMIN)
              </p>
            </div>

            {import.meta.env.MODE !== 'production' && (
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold rounded-lg shrink-0">
                MOCK DEV MODE
              </span>
            )}
          </div>

          {conversations.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-950 border border-slate-800/80 rounded-2xl p-6">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Bạn chưa có hộp thoại trao đổi nào với Admin.</p>
              <button
                onClick={() => setActiveTab('center')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
              >
                Tạo yêu cầu mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ticket List */}
              <div className="space-y-2 border-r-0 md:border-r border-slate-800 pr-0 md:pr-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Danh sách yêu cầu</h3>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full p-3 rounded-2xl text-left border transition-all ${
                        selectedConvId === conv.id
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold truncate max-w-[140px] text-white">{conv.subject}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {conv.status === 'OPEN' ? 'Mới' : conv.status === 'IN_PROGRESS' ? 'Đang xử lý' : 'Đã xong'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {conv.messages[conv.messages.length - 1]?.content || 'Không có tin nhắn'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages Panel */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between min-h-[360px]">
                {selectedConversation ? (
                  <>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="text-xs font-bold text-cyan-300">{selectedConversation.subject}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> Ngày tạo:{' '}
                        {new Date(selectedConversation.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                      {selectedConversation.messages.map((msg) => {
                        const isUser = msg.senderRole === 'USER';
                        const isBot = msg.senderRole === 'AI';
                        const isAdmin = msg.senderRole === 'ADMIN';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                              {isUser ? (
                                <User className="w-3 h-3 text-cyan-400" />
                              ) : isBot ? (
                                <Shield className="w-3 h-3 text-purple-400" />
                              ) : (
                                <Shield className="w-3 h-3 text-amber-400" />
                              )}
                              <span className="font-bold">{msg.senderName}</span>
                              {isBot && <span className="text-purple-400 ml-1">(Bot)</span>}
                            </div>
                            <div
                              className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                isUser
                                  ? 'bg-cyan-500 text-slate-950 font-medium rounded-br-none'
                                  : isBot
                                  ? 'bg-purple-500/20 text-purple-100 border border-purple-500/30 rounded-bl-none'
                                  : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                      {isBotTyping && <TypingIndicator />}
                    </div>

                    {/* Reply Input Form */}
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Nhập tin nhắn phản hồi..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                      />
                      <button
                        type="submit"
                        disabled={isSendingReply || !replyMessage.trim()}
                        className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Gửi</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Vui lòng chọn một yêu cầu để xem tin nhắn.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
