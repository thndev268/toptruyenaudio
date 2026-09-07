import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';
import { io, Socket } from 'socket.io-client';
import './SupportChat.css';

// Custom chat icon from Uiverse.io
const ChatIcon = () => (
  <svg height="1.6em" fill="white" xmlSpace="preserve" viewBox="0 0 1000 1000" y="0px" x="0px" version="1.1">
    <path d="M881.1,720.5H434.7L173.3,941V720.5h-54.4C58.8,720.5,10,671.1,10,610.2v-441C10,108.4,58.8,59,118.9,59h762.2C941.2,59,990,108.4,990,169.3v441C990,671.1,941.2,720.5,881.1,720.5L881.1,720.5z M935.6,169.3c0-30.4-24.4-55.2-54.5-55.2H118.9c-30.1,0-54.5,24.7-54.5,55.2v441c0,30.4,24.4,55.1,54.5,55.1h54.4h54.4v110.3l163.3-110.2H500h381.1c30.1,0,54.5-24.7,54.5-55.1V169.3L935.6,169.3z M717.8,444.8c-30.1,0-54.4-24.7-54.4-55.1c0-30.4,24.3-55.2,54.4-55.2c30.1,0,54.5,24.7,54.5,55.2C772.2,420.2,747.8,444.8,717.8,444.8L717.8,444.8z M500,444.8c-30.1,0-54.4-24.7-54.4-55.1c0-30.4,24.3-55.2,54.4-55.2c30.1,0,54.4,24.7,54.4,55.2C554.4,420.2,530.1,444.8,500,444.8L500,444.8z M282.2,444.8c-30.1,0-54.5-24.7-54.5-55.1c0-30.4,24.4-55.2,54.5-55.2c30.1,0,54.4,24.7,54.4,55.2C336.7,420.2,312.3,444.8,282.2,444.8L282.2,444.8z"></path>
  </svg>
);

// Draggable hook
const useDraggable = (initialPosition: { x: number; y: number }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLButtonElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!dragRef.current) return;
      
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newPosition = {
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      };

      // Get window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const buttonSize = 55; // chat button size

      // Get header height (assuming header is around 64px)
      const headerHeight = 64;

      // Constrain within viewport
      const constrainedPosition = {
        x: Math.max(0, Math.min(newPosition.x, windowWidth - buttonSize)),
        y: Math.max(headerHeight, Math.min(newPosition.y, windowHeight - buttonSize)),
      };

      setPosition(constrainedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const element = dragRef.current;
    if (element) {
      element.addEventListener('mousedown', handleMouseDown);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (element) {
        element.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  return { position, dragRef, isDragging };
};

// Generate a consistent color based on user ID
const getUserColor = (userId: string): string => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-teal-500 to-emerald-500',
    'from-green-500 to-lime-500',
    'from-yellow-500 to-amber-500',
    'from-orange-500 to-red-500',
    'from-red-500 to-pink-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'CLOSED':
      return 'from-gray-500 to-gray-600'; // Xám
    case 'RESOLVED':
      return 'from-green-500 to-emerald-500'; // Xanh lá
    case 'WAITING_FOR_ADMIN':
      return 'from-yellow-500 to-amber-500'; // Vàng
    case 'WAITING_FOR_USER':
      return 'from-orange-500 to-amber-600'; // Cam
    case 'ACTIVE':
    default:
      return 'from-cyan-500 to-blue-500'; // Cyan / xanh dương
  }
};

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: string;
  status: string;
  messages: Message[];
}

export const SupportChat: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Initialize draggable position near Zalo button (right side)
  const { position, dragRef, isDragging } = useDraggable({
    x: window.innerWidth - 88, // 1.5rem + 55px button width
    y: window.innerHeight - 252, // mini player (72px) + 180px
  });

  useEffect(() => {
    if (!user) return;

    // Initialize Socket.IO connection
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SupportChat] Connected to Socket.IO');
    });

    socket.on('connected', (data) => {
      console.log('[SupportChat] Socket connected:', data);
    });

    socket.on('new-message', (data) => {
      console.log('[FRONTEND] new-message received:', data);
      if (conversation && data.conversationId === conversation.id) {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message],
          };
        });
      }
    });

    socket.on('conversation-closed', (data) => {
      console.log('[SupportChat] Conversation closed:', data);
      if (conversation && data.conversationId === conversation.id) {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status || 'CLOSED',
          };
        });
      }
    });

    socket.on('conversation-status-changed', (data) => {
      console.log('[SupportChat] Conversation status changed:', data);
      if (conversation && data.conversationId === conversation.id) {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status,
          };
        });
      }
    });

    socket.on('error', (error) => {
      console.error('[SupportChat] Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const loadConversation = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await apiRequest('/support/conversations/me');
      // Handle both array and object with items property
      const conversations = Array.isArray(response) ? response : (response?.items || []);
      
      if (conversations.length > 0) {
        // Find the first non-closed conversation
        const activeConv = conversations.find((c: any) => c.status !== 'CLOSED');
        if (activeConv) {
          await socketRef.current?.emit('join-conversation', { conversationId: activeConv.id });
          setConversation(activeConv);
        } else {
          // All conversations are closed, create new one
          const newConv = await apiRequest('/support/conversations', {
            method: 'POST',
            body: JSON.stringify({
              subject: 'Hỗ trợ chung',
              category: 'OTHER',
              message: 'Xin chào, tôi cần hỗ trợ.',
            }),
          });
          await socketRef.current?.emit('join-conversation', { conversationId: newConv.id });
          setConversation(newConv);
        }
      } else {
        // Create new conversation
        const newConv = await apiRequest('/support/conversations', {
          method: 'POST',
          body: JSON.stringify({
            subject: 'Hỗ trợ chung',
            category: 'OTHER',
            message: 'Xin chào, tôi cần hỗ trợ.',
          }),
        });
        await socketRef.current?.emit('join-conversation', { conversationId: newConv.id });
        setConversation(newConv);
      }
    } catch (error) {
      console.error('[SupportChat] Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!conversation) {
      await loadConversation();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversation || !user) return;

    try {
      const response = await apiRequest(`/support/conversations/${conversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: message,
        }),
      });

      setConversation(response);
      setMessage('');
    } catch (error) {
      console.error('[SupportChat] Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        ref={dragRef}
        onClick={handleOpen}
        className={`chatBtn fixed cursor-pointer ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
        }}
        title="Chat hỗ trợ - Kéo để di chuyển"
      >
        <ChatIcon />
        <span className="tooltip">Chat</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md sm:w-96 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 lg:w-[450px] lg:max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r p-3 sm:p-4 flex items-center justify-between ${
        conversation ? getStatusColor(conversation.status) : getUserColor(user?.id || 'default')
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7">
            <ChatIcon />
          </div>
          <div className="flex flex-col">
            <h3 className="text-white font-semibold text-xs sm:text-sm">Hỗ trợ trực tuyến</h3>
            {conversation && (
              <span className="text-[10px] sm:text-xs text-white/80">
                {conversation.status === 'CLOSED'
                  ? 'Đã đóng'
                  : conversation.status === 'RESOLVED'
                  ? 'Đã giải quyết'
                  : conversation.status === 'WAITING_FOR_ADMIN'
                  ? 'Đang chờ admin'
                  : conversation.status === 'WAITING_FOR_USER'
                  ? 'Đang chờ bạn'
                  : 'Đang hoạt động'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleToggleMinimize}
            className="text-white hover:bg-white/20 p-1.5 sm:p-1 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-1.5 sm:p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[60vh] sm:h-96 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-slate-800/50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="loader-wrapper">
                  <div className="loader"></div>
                  <span className="loader-letter">Đ</span>
                  <span className="loader-letter">A</span>
                  <span className="loader-letter">N</span>
                  <span className="loader-letter">G</span>
                  <span className="loader-letter"> </span>
                  <span className="loader-letter">T</span>
                  <span className="loader-letter">Ả</span>
                  <span className="loader-letter">I</span>
                </div>
              </div>
            ) : conversation && conversation.messages.length > 0 ? (
              conversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderRole === 'USER' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-2xl ${
                      msg.senderRole === 'USER'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-medium mb-1">{msg.senderName}</div>
                    <div className="text-xs sm:text-sm break-words">{msg.content}</div>
                    <div className="text-[10px] sm:text-xs opacity-70 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm sm:text-base text-center px-4">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 bg-slate-800 border-t border-slate-700">
            {conversation?.status === 'CLOSED' ? (
              <div className="text-center text-slate-400 text-xs sm:text-sm py-2">
                Cuộc hội thoại đã được đóng. Vui lòng tạo cuộc hội thoại mới nếu cần hỗ trợ thêm.
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-slate-700 text-white placeholder-slate-400 px-3 sm:px-4 py-2 sm:py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-cyan-500 text-sm sm:text-base"
                  disabled={!conversation}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !conversation}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 sm:p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
