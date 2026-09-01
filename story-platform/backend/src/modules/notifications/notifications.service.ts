import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          { targetAudience: 'ALL' },
          { targetAudience: 'PREMIUM' },
          { targetAudience: 'CREATOR' },
          { targetAudience: 'PARTNER' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user's role and premium status to filter
    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true, membershipTier: true },
    });

    const filtered = notifications.filter((notif) => {
      if (notif.targetUserId === userId) return true;
      if (notif.targetAudience === 'ALL') return true;
      if (notif.targetAudience === 'PREMIUM' && user?.membershipTier === 'PREMIUM') return true;
      if (notif.targetAudience === 'CREATOR' && (user?.role === 'CREATOR' || user?.role === 'OWNER_ADMIN')) return true;
      if (notif.targetAudience === 'PARTNER' && (user?.role === 'PARTNER' || user?.role === 'OWNER_ADMIN')) return true;
      return false;
    });

    return {
      success: true,
      data: filtered,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      success: true,
      message: 'Đã đánh dấu thông báo đã đọc',
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        targetUserId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc',
    };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
      message: 'Đã xóa thông báo',
    };
  }

  async sendBroadcast(body: {
    title: string;
    content: string;
    targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER' | 'SPECIFIC_USER';
    targetUserId?: string;
  }) {
    // Check for duplicate notification (same title, content, audience within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await this.prisma.notification.findFirst({
      where: {
        title: body.title,
        content: body.content,
        targetAudience: body.targetAudience,
        targetUserId: body.targetUserId,
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
    });

    if (duplicate) {
      console.log('[NotificationsService] Skipping duplicate notification creation');
      return {
        success: true,
        data: duplicate,
        message: 'Thông báo đã tồn tại (trùng lặp)',
      };
    }

    const notification = await this.prisma.notification.create({
      data: {
        title: body.title,
        content: body.content,
        targetAudience: body.targetAudience,
        targetUserId: body.targetUserId,
        isRead: false,
      },
    });

    return {
      success: true,
      data: notification,
      message: 'Đã gửi thông báo broadcast thành công',
    };
  }

  async getAllNotifications(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count(),
    ]);

    return {
      success: true,
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
