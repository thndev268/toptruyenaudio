import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationType = 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER' | 'WARNING' | 'ERROR' | 'SUPPORT';
export type NotificationStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
export type TargetAudience = 'ALL' | 'REGULAR' | 'PREMIUM' | 'CREATOR' | 'SPECIFIC_USER';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true, membershipTier: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all notifications that match user's audience
    const notifications = await this.prisma.notification.findMany({
      where: {
        status: 'SENT',
        OR: [
          { targetUserId: userId },
          { targetAudience: 'ALL' },
          { targetAudience: 'REGULAR' },
          { targetAudience: 'PREMIUM' },
          { targetAudience: 'CREATOR' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter based on user's role and membership
    const filtered = notifications.filter((notif) => {
      if (notif.targetUserId === userId) return true;
      if (notif.targetAudience === 'ALL') return true;
      if (notif.targetAudience === 'REGULAR') return true;
      if (notif.targetAudience === 'PREMIUM' && user.membershipTier === 'PREMIUM') return true;
      if (notif.targetAudience === 'CREATOR' && (user.role === 'CREATOR' || user.role === 'OWNER_ADMIN')) return true;
      return false;
    });

    // Get user's notification read status
    const notificationIds = filtered.map(n => n.id);
    const userNotifications = await this.prisma.userNotification.findMany({
      where: {
        userId,
        notificationId: { in: notificationIds },
      },
    });

    const readStatusMap = new Map(userNotifications.map(un => [un.notificationId, un.isRead]));

    // Combine notifications with read status
    const result = filtered.map(notif => ({
      ...notif,
      isRead: readStatusMap.get(notif.id) || false,
    }));

    return {
      success: true,
      data: result,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Create or update UserNotification record
    await this.prisma.userNotification.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
      update: {
        isRead: true,
        readAt: new Date(),
      },
      create: {
        notificationId,
        userId,
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Đã đánh dấu thông báo đã đọc',
    };
  }

  async markAllAsRead(userId: string) {
    // Get all sent notifications for this user
    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true, membershipTier: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notifications = await this.prisma.notification.findMany({
      where: {
        status: 'SENT',
        OR: [
          { targetUserId: userId },
          { targetAudience: 'ALL' },
          { targetAudience: 'REGULAR' },
          { targetAudience: 'PREMIUM' },
          { targetAudience: 'CREATOR' },
        ],
      },
    });

    const filtered = notifications.filter((notif) => {
      if (notif.targetUserId === userId) return true;
      if (notif.targetAudience === 'ALL') return true;
      if (notif.targetAudience === 'REGULAR') return true;
      if (notif.targetAudience === 'PREMIUM' && user.membershipTier === 'PREMIUM') return true;
      if (notif.targetAudience === 'CREATOR' && (user.role === 'CREATOR' || user.role === 'OWNER_ADMIN')) return true;
      return false;
    });

    const notificationIds = filtered.map(n => n.id);

    // Create UserNotification records for all unread notifications
    for (const notificationId of notificationIds) {
      await this.prisma.userNotification.upsert({
        where: {
          notificationId_userId: {
            notificationId,
            userId,
          },
        },
        update: {
          isRead: true,
          readAt: new Date(),
        },
        create: {
          notificationId,
          userId,
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return {
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc',
    };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const userNotification = await this.prisma.userNotification.findUnique({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
    });

    if (!userNotification) {
      throw new NotFoundException('Notification not found or not assigned to user');
    }

    await this.prisma.userNotification.delete({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
    });

    return {
      success: true,
      message: 'Đã xóa thông báo',
    };
  }

  async sendBroadcast(body: {
    title: string;
    content: string;
    type?: NotificationType;
    targetAudience?: TargetAudience;
    targetUserId?: string;
    createdBy?: string;
  }) {
    // Check for duplicate notification (same title, content, audience within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await this.prisma.notification.findFirst({
      where: {
        title: body.title,
        content: body.content,
        targetAudience: body.targetAudience || 'ALL',
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
        type: body.type || 'SYSTEM',
        targetAudience: body.targetAudience || 'ALL',
        targetUserId: body.targetUserId,
        status: 'SENT',
        sentAt: new Date(),
        createdBy: body.createdBy,
      },
    });

    return {
      success: true,
      data: notification,
      message: 'Đã gửi thông báo broadcast thành công',
    };
  }

  async createDraft(body: {
    title: string;
    content: string;
    type?: NotificationType;
    targetAudience?: TargetAudience;
    targetUserId?: string;
    createdBy?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type || 'SYSTEM',
        targetAudience: body.targetAudience || 'ALL',
        targetUserId: body.targetUserId,
        status: 'DRAFT',
        createdBy: body.createdBy,
      },
    });

    return {
      success: true,
      data: notification,
      message: 'Đã tạo nháp thông báo',
    };
  }

  async scheduleNotification(body: {
    notificationId: string;
    scheduledAt: Date;
    adminId: string;
  }) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: body.notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.status !== 'DRAFT') {
      throw new BadRequestException('Only draft notifications can be scheduled');
    }

    if (body.scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const updated = await this.prisma.notification.update({
      where: { id: body.notificationId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: body.scheduledAt,
      },
    });

    return {
      success: true,
      data: updated,
      message: 'Đã lên lịch gửi thông báo',
    };
  }

  async cancelNotification(notificationId: string, adminId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.status === 'SENT' || notification.status === 'SENDING') {
      throw new BadRequestException('Cannot cancel sent or sending notifications');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'CANCELLED',
      },
    });

    return {
      success: true,
      data: updated,
      message: 'Đã hủy thông báo',
    };
  }

  async updateNotification(notificationId: string, body: {
    title?: string;
    content?: string;
    type?: NotificationType;
    targetAudience?: TargetAudience;
    targetUserId?: string;
    scheduledAt?: Date;
  }) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.status === 'SENT' || notification.status === 'SENDING') {
      throw new BadRequestException('Cannot update sent or sending notifications');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: body,
    });

    return {
      success: true,
      data: updated,
      message: 'Đã cập nhật thông báo',
    };
  }

  async getAllNotifications(query: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    status?: NotificationStatus;
    targetAudience?: TargetAudience;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.targetAudience) where.targetAudience = query.targetAudience;

    const [notifications, total, userCounts] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.getUserCountsData(),
    ]);

    return {
      success: true,
      data: notifications.map(n => {
        let recipientCount = 0;
        if (n.targetAudience === 'ALL') {
          recipientCount = userCounts.total;
        } else if (n.targetAudience === 'PREMIUM') {
          recipientCount = userCounts.premium;
        } else if (n.targetAudience === 'CREATOR') {
          recipientCount = userCounts.creator;
        } else if (n.targetAudience === 'SPECIFIC_USER') {
          recipientCount = 1;
        } else {
          recipientCount = userCounts.total;
        }
        return {
          ...n,
          recipientCount,
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getUserCountsData() {
    const [total, premium, creator] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({ where: { membershipTier: 'PREMIUM' } }),
      this.prisma.profile.count({ where: { role: 'CREATOR' } }),
    ]);
    return { total, premium, creator };
  }

  async getNotificationStats() {
    const [total, sent, scheduled, draft, cancelled] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { status: 'SENT' } }),
      this.prisma.notification.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.notification.count({ where: { status: 'DRAFT' } }),
      this.prisma.notification.count({ where: { status: 'CANCELLED' } }),
    ]);

    return {
      success: true,
      data: {
        total,
        sent,
        scheduled,
        draft,
        cancelled,
      },
    };
  }

  async getUserCounts() {
    const [total, premium, creator, partner] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({ where: { membershipTier: 'PREMIUM' } }),
      this.prisma.profile.count({ where: { role: 'CREATOR' } }),
      this.prisma.profile.count({ where: { role: 'PARTNER' } }),
    ]);

    return {
      success: true,
      data: {
        total,
        premium,
        creator,
        partner,
      },
    };
  }
}
