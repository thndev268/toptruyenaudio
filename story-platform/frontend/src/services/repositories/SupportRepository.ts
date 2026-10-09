import { apiRequest, getDataSourceMode } from '../apiClient';

export interface SupportMessage {
  id: string;
  conversationId?: string;
  senderId?: string;
  senderRole: 'USER' | 'ADMIN' | 'OWNER_ADMIN' | 'AI';
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}

export interface SupportConversation {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_ADMIN' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  priority?: 'NORMAL' | 'HIGH';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AutoResponderSettings {
  enabled: boolean;
  message: string;
}

const SUPPORT_STORAGE_KEY = 'toptruyenaudio:support:v1';
const AUTO_RESPONDER_KEY = 'toptruyenaudio:support:auto_responder:v1';

export const defaultAutoResponderSettings: AutoResponderSettings = {
  enabled: true,
  message:
    'Chào bạn! Hiện tại Ban Quản Trị đang vắng mặt hoặc đang bận xử lý hệ thống. Yêu cầu hỗ trợ của bạn đã được tiếp nhận và xếp vào hàng đợi ưu tiên. Quản trị viên sẽ trực tiếp phản hồi ngay khi quay lại (dự kiến trong 15 - 30 phút). Cảm ơn bạn đã kiên nhẫn!',
};

export function getAutoResponderSettings(): AutoResponderSettings {
  try {
    const raw = localStorage.getItem(AUTO_RESPONDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse auto responder settings', e);
  }
  return defaultAutoResponderSettings;
}

export function saveAutoResponderSettings(settings: AutoResponderSettings): void {
  try {
    localStorage.setItem(AUTO_RESPONDER_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
  } catch (e) {
    console.error('Failed to save auto responder settings', e);
  }
}

export class LocalSupportRepository {
  private getStorageData(): SupportConversation[] {
    try {
      const raw = localStorage.getItem(SUPPORT_STORAGE_KEY);
      if (!raw) return this.getInitialMockData();
      return JSON.parse(raw);
    } catch {
      return this.getInitialMockData();
    }
  }

  private saveStorageData(data: SupportConversation[]): void {
    try {
      localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
    } catch (e) {
      console.error('Failed to save support data to localStorage', e);
    }
  }

  private getInitialMockData(): SupportConversation[] {
    const mock: SupportConversation[] = [
      {
        id: 'tkt-001',
        userId: 'bich.nguyen@gmail.com',
        userName: 'Nguyễn Thị Bích',
        subject: 'Đã thanh toán gói 1 năm nhưng tài khoản chưa lên Premium',
        category: 'PREMIUM',
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        messages: [
          {
            id: 'msg-001',
            senderRole: 'USER',
            senderName: 'Nguyễn Thị Bích',
            content: 'Tôi đã chuyển khoản qua VietQR lúc 19:30 ngày 06/08 với mã GD VCB-99482, nhờ admin kiểm tra kích hoạt giúp.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'tkt-002',
        userId: 'quan.hoang@gmail.com',
        userName: 'Hoàng Minh Quân',
        subject: 'Góp ý: Tính năng hẹn giờ tắt tự động rất tiện lợi',
        category: 'AUDIO_PLAYBACK',
        priority: 'NORMAL',
        status: 'RESOLVED',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        messages: [
          {
            id: 'msg-002a',
            senderRole: 'USER',
            senderName: 'Hoàng Minh Quân',
            content: 'Tính năng hẹn giờ tắt khi hết tập hoạt động rất tốt, cảm ơn đội ngũ phát triển.',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: 'msg-002b',
            senderRole: 'ADMIN',
            senderName: 'Ban Quản Trị (OWNER_ADMIN)',
            content: 'Cảm ơn bạn đã đồng hành và ủng hộ TOP TRUYỆN AUDIO!',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'ticket-1',
        userId: 'usr-1',
        userName: 'Thành Viên Audio',
        subject: 'Yêu cầu kiểm tra âm thanh tập 3 truyện Bóng Đêm',
        category: 'AUDIO_PLAYBACK',
        priority: 'NORMAL',
        status: 'RESOLVED',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        messages: [
          {
            id: 'msg-1',
            senderRole: 'USER',
            senderName: 'Thành Viên Audio',
            content: 'Chào Admin, tập 3 truyện Bóng Đêm nghe đến phút 12:30 bị dừng đột ngột. Nhờ Admin kiểm tra giúp.',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
          },
          {
            id: 'msg-2',
            senderRole: 'ADMIN',
            senderName: 'Ban Quản Trị (OWNER_ADMIN)',
            content: 'Chào bạn, cảm ơn bạn đã phản hồi. Bộ phận kỹ thuật đang xử lý lại luồng âm thanh cho tập này và sẽ hoàn tất trong ít phút.',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ],
      },
    ];
    this.saveStorageData(mock);
    return mock;
  }

  async getConversations(userId: string): Promise<SupportConversation[]> {
    const all = this.getStorageData();
    return all.filter((c) => c.userId === userId || userId === 'admin');
  }

  async createConversation(userId: string, userName: string, subject: string, message: string): Promise<SupportConversation> {
    const all = this.getStorageData();
    const newConv: SupportConversation = {
      id: 'ticket-' + Date.now().toString(36),
      userId,
      userName,
      subject,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-' + Date.now().toString(36),
          senderRole: 'USER',
          senderName: userName,
          content: message,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    all.unshift(newConv);
    this.saveStorageData(all);

    // Auto responder check
    const autoSettings = getAutoResponderSettings();
    if (autoSettings.enabled) {
      setTimeout(() => {
        const latestAll = this.getStorageData();
        const latestIdx = latestAll.findIndex((c) => c.id === newConv.id);
        if (latestIdx !== -1) {
          latestAll[latestIdx].messages.push({
            id: 'auto-reply-' + Date.now().toString(36),
            senderRole: 'ADMIN',
            senderName: 'Ban Quản Trị (Tự Động Bot)',
            content: autoSettings.message,
            createdAt: new Date().toISOString(),
          });
          latestAll[latestIdx].status = 'IN_PROGRESS';
          latestAll[latestIdx].updatedAt = new Date().toISOString();
          this.saveStorageData(latestAll);
        }
      }, 600);
    }

    return newConv;
  }

  async sendMessage(conversationId: string, senderRole: 'USER' | 'ADMIN' | 'OWNER_ADMIN', senderName: string, content: string): Promise<SupportConversation> {
    const all = this.getStorageData();
    const index = all.findIndex((c) => c.id === conversationId);
    if (index === -1) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }

    const newMsg: SupportMessage = {
      id: 'msg-' + Date.now().toString(36),
      senderRole,
      senderName,
      content,
      createdAt: new Date().toISOString(),
    };

    all[index].messages.push(newMsg);
    all[index].updatedAt = new Date().toISOString();

    if (senderRole === 'USER') {
      const autoSettings = getAutoResponderSettings();
      if (autoSettings.enabled) {
        setTimeout(() => {
          const latestAll = this.getStorageData();
          const latestIdx = latestAll.findIndex((c) => c.id === conversationId);
          if (latestIdx !== -1) {
            latestAll[latestIdx].messages.push({
              id: 'auto-reply-' + Date.now().toString(36),
              senderRole: 'ADMIN',
              senderName: 'Ban Quản Trị (Tự Động Bot)',
              content: autoSettings.message,
              createdAt: new Date().toISOString(),
            });
            latestAll[latestIdx].status = 'IN_PROGRESS';
            latestAll[latestIdx].updatedAt = new Date().toISOString();
            this.saveStorageData(latestAll);
          }
        }, 800);
      }
    } else {
      all[index].status = 'IN_PROGRESS';
    }

    this.saveStorageData(all);
    return all[index];
  }

  async updateConversationStatus(conversationId: string, status: SupportConversation['status']): Promise<SupportConversation | null> {
    const all = this.getStorageData();
    const index = all.findIndex((c) => c.id === conversationId);
    if (index === -1) return null;

    all[index].status = status;
    all[index].updatedAt = new Date().toISOString();
    this.saveStorageData(all);
    return all[index];
  }
}

export class ApiSupportRepository {
  private localFallback = new LocalSupportRepository();

  async getConversations(userId: string): Promise<SupportConversation[]> {
    try {
      const data = await apiRequest('/support/conversations/me', { method: 'GET' });
      if (Array.isArray(data)) {
        return data.map((c) => this.mapBackendToFrontend(c));
      }
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
    }
    return this.localFallback.getConversations(userId);
  }

  async createConversation(userId: string, userName: string, subject: string, message: string): Promise<SupportConversation> {
    try {
      const res = await apiRequest('/support/conversations', {
        method: 'POST',
        body: JSON.stringify({ subject, message }),
      });
      if (res && (res.id || res._id)) {
        return this.mapBackendToFrontend(res);
      }
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
    }
    return this.localFallback.createConversation(userId, userName, subject, message);
  }

  async sendMessage(conversationId: string, senderRole: 'USER' | 'ADMIN' | 'OWNER_ADMIN', senderName: string, content: string): Promise<SupportConversation> {
    try {
      const endpoint = senderRole === 'USER'
        ? `/support/conversations/${conversationId}/messages`
        : `/admin/support/conversations/${conversationId}/messages`;
      
      const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ content, clientMessageId }),
      });
      if (res && (res.id || res._id)) {
        return this.mapBackendToFrontend(res);
      }
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
    }
    return this.localFallback.sendMessage(conversationId, senderRole, senderName, content);
  }

  async getAdminConversations(): Promise<{ items: SupportConversation[] }> {
    try {
      const res = await apiRequest('/admin/support/conversations', { method: 'GET' });
      if (res && Array.isArray(res.items)) {
        return {
          items: res.items.map((c: any) => this.mapBackendToFrontend(c)),
        };
      }
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
    }
    const items = await this.localFallback.getConversations('admin');
    return { items };
  }

  async updateConversationStatus(conversationId: string, status: string, reason?: string) {
    try {
      const res = await apiRequest(`/admin/support/conversations/${conversationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      if (res && (res.id || res._id)) {
        return this.mapBackendToFrontend(res);
      }
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
    }
    return this.localFallback.updateConversationStatus(conversationId, status as any);
  }

  private mapBackendToFrontend(conv: any): SupportConversation {
    return {
      id: conv.id || conv._id,
      userId: conv.userId,
      userName: conv.userName,
      subject: conv.subject,
      category: conv.category,
      status: conv.status,
      priority: conv.priority,
      createdAt: conv.createdAt || new Date().toISOString(),
      updatedAt: conv.updatedAt || conv.lastMessageAt || new Date().toISOString(),
      messages: Array.isArray(conv.messages)
        ? conv.messages.map((m: any) => ({
            id: m.id || m._id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            senderRole: m.senderRole === 'OWNER_ADMIN' ? 'ADMIN' : m.senderRole,
            senderName: m.senderName,
            content: m.content,
            createdAt: m.createdAt,
          }))
        : [],
    };
  }
}

export const supportRepository = new ApiSupportRepository();
