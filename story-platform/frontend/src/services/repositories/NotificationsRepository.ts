import { apiRequest } from '../api';

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
      const response = await apiRequest<{ success: boolean; data: Notification[] }>('/notifications');
      if (response?.success && Array.isArray(response.data)) {
        this.notifications = response.data;
        this.notifyListeners();
        return this.notifications;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiRequest(`/notifications/mark-read/${notificationId}`, 'POST');
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
      await apiRequest('/notifications/mark-all-read', 'POST');
      this.notifications.forEach(n => n.isRead = true);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiRequest(`/notifications/delete/${notificationId}`, 'POST');
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
