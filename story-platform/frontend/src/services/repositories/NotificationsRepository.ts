import { apiRequest } from '../apiClient';

export interface Notification {
  id: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER' | 'SPECIFIC_USER';
  targetUserId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationInput {
  title: string;
  content: string;
  targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER' | 'SPECIFIC_USER';
  targetUserId?: string;
}

export class NotificationsRepository {
  private static instance: NotificationsRepository;
  private notifications: Notification[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): NotificationsRepository {
    if (!NotificationsRepository.instance) {
      NotificationsRepository.instance = new NotificationsRepository();
    }
    return NotificationsRepository.instance;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  async fetchNotifications(userId?: string): Promise<Notification[]> {
    try {
      console.log('[NotificationsRepository] Fetching notifications for userId:', userId);
      const response = await apiRequest<{ success: boolean; data: Notification[] }>('/notifications');
      console.log('[NotificationsRepository] Response:', response);
      if (response?.success && Array.isArray(response.data)) {
        this.notifications = response.data;
        console.log('[NotificationsRepository] Fetched notifications count:', this.notifications.length);
        this.notifyListeners();
        return this.notifications;
      }
      console.warn('[NotificationsRepository] Invalid response format:', response);
      return [];
    } catch (error) {
      console.error('[NotificationsRepository] Failed to fetch notifications:', error);
      return [];
    }
  }

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    try {
      console.log('[NotificationsRepository] Creating notification:', input);
      const response = await apiRequest<{ success: boolean; data: Notification }>('/notifications', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      
      if (response?.success && response.data) {
        this.notifications.unshift(response.data);
        this.notifyListeners();
        
        // Trigger sync event to update UI
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
        }
        
        return response.data;
      }
      throw new Error('Failed to create notification');
    } catch (error) {
      console.error('[NotificationsRepository] Failed to create notification:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiRequest(`/notifications/mark-read/${notificationId}`, { method: 'POST' });
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'POST' });
      this.notifications.forEach(n => n.isRead = true);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiRequest(`/notifications/delete/${notificationId}`, { method: 'POST' });
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }
}

export const notificationsRepository = NotificationsRepository.getInstance();
