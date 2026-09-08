import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateSupportStatusDto,
} from './dto/support.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { TelegramService } from '../telegram/telegram.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createConversation(
    userId: string,
    userName: string,
    dto: CreateConversationDto,
  ) {
    const conv = await this.prisma.supportConversation.create({
      data: {
        userId,
        userName,
        subject: dto.subject,
        category: dto.category || 'OTHER',
        status: 'WAITING_FOR_ADMIN',
        priority: dto.priority || 'NORMAL',
        lastMessageAt: new Date(),
        userUnreadCount: 0,
        adminUnreadCount: 1,
        messages: {
          create: {
            senderId: userId,
            senderRole: 'USER',
            senderName: userName,
            content: dto.message,
          }
        }
      },
      include: {
        messages: true
      }
    });

    console.log(`[SupportService] New conversation created: ${conv.id} for user: ${userId}`);

    // Check if outside support hours (08:00 - 22:00)
    const now = new Date();
    const hour = now.getHours();
    const isOutsideHours = hour < 8 || hour >= 22;

    // Send automatic confirmation message to user
    try {
      let autoMessage = `🎧 TOP TRUYỆN AUDIO\n\n✅ Đã tiếp nhận yêu cầu hỗ trợ của bạn.\n\n📌 Chủ đề:\n${dto.subject}\n\n💬 Nội dung:\n${dto.message}\n\n⏳ Nhân viên CSKH sẽ phản hồi sớm nhất.`;
      
      if (isOutsideHours) {
        autoMessage = `🌙 TOP TRUYỆN AUDIO\n\nHiện tại đội ngũ CSKH đã hết giờ hỗ trợ.\n\n⏰ Thời gian hỗ trợ:\n08:00 - 22:00\n\n✅ Yêu cầu của bạn vẫn đã được ghi nhận.\n\nChúng tôi sẽ phản hồi khi đội ngũ CSKH hoạt động trở lại.`;
        console.log(`[SupportService] Outside support hours, sending after-hours message`);
      }
      
      await this.prisma.supportMessage.create({
        data: {
          conversationId: conv.id,
          senderId: 'SYSTEM',
          senderRole: 'SYSTEM',
          senderName: 'Hệ thống',
          content: autoMessage,
        },
      });
      console.log(`[SupportService] Automatic confirmation message sent for conversation ${conv.id}`);
    } catch (error) {
      console.error('[SupportService] Failed to send automatic message:', error);
    }

    // Send notification to Telegram admin
    try {
      const telegramResult = await this.telegramService.sendReplyButtons(conv.id, userName, dto.subject, dto.message);
      
      // Store the Telegram message ID for reply tracking
      if (telegramResult && telegramResult.ok && telegramResult.result) {
        await this.prisma.supportConversation.update({
          where: { id: conv.id },
          data: {
            telegramMessageId: telegramResult.result.message_id,
          },
        });
        console.log(`[TELEGRAM] Notification sent`);
        console.log(`[TELEGRAM] message_id =`, telegramResult.result.message_id);
        console.log(`[PRISMA] telegramMessageId saved for conversation ${conv.id}`);
      }
    } catch (error) {
      console.error('[SupportService] Failed to send Telegram notification:', error);
      // Don't fail the conversation creation if Telegram fails
    }

    return this.formatConversation(conv, conv.messages);
  }

  async getConversationsForUser(userId: string) {
    const convs = await this.prisma.supportConversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          where: { hiddenAt: null },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return convs.map((c) =>
      this.formatConversation(c, c.messages),
    );
  }

  async getConversationByIdForUser(userId: string, conversationId: string) {
    let conv = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conv.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem cuộc hội thoại này');
    }

    if (conv.userUnreadCount > 0) {
      conv = await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: { userUnreadCount: 0 }
      });
    }

    const messages = await this.prisma.supportMessage.findMany({
      where: { conversationId, hiddenAt: null },
      orderBy: { createdAt: 'asc' }
    });

    return this.formatConversation(conv, messages);
  }

  async addMessage(
    userId: string,
    userName: string,
    conversationId: string,
    dto: CreateMessageDto,
  ) {
    const conv = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conv.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền gửi tin nhắn vào hội thoại này');
    }

    if (conv.status === 'CLOSED') {
      throw new BadRequestException('Cuộc hội thoại đã đóng, không thể gửi thêm tin nhắn');
    }

    // Update status if user replies after admin response
    let statusUpdate: any = {};
    if (conv.status === 'WAITING_FOR_USER') {
      statusUpdate.status = 'WAITING_FOR_ADMIN';
      console.log(`[SupportService] User replied, changing status from WAITING_FOR_USER to WAITING_FOR_ADMIN`);
    }

    if (dto.clientMessageId) {
      const existing = await this.prisma.supportMessage.findFirst({
        where: { conversationId, clientMessageId: dto.clientMessageId }
      });
      if (existing) {
        const messages = await this.prisma.supportMessage.findMany({
          where: { conversationId, hiddenAt: null },
          orderBy: { createdAt: 'asc' }
        });
        return this.formatConversation(conv, messages);
      }
    }

    const updatedConv = await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        ...statusUpdate,
        adminUnreadCount: { increment: 1 },
        messages: {
          create: {
            senderId: userId,
            senderRole: 'USER',
            senderName: userName,
            clientMessageId: dto.clientMessageId,
            content: dto.content,
          }
        }
      },
      include: { messages: { where: { hiddenAt: null }, orderBy: { createdAt: 'asc' } } }
    });

    // Send Socket.IO event to conversation room
    const newMessage = updatedConv.messages[updatedConv.messages.length - 1];
    await this.chatGateway.sendToConversation(conversationId, 'new-message', {
      conversationId,
      message: {
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        senderRole: newMessage.senderRole,
        senderName: newMessage.senderName,
        content: newMessage.content,
        createdAt: newMessage.createdAt.toISOString(),
      },
    });

    console.log(`[SupportService] User message sent, conversation: ${conversationId}, notifying Telegram admin`);

    // Send notification to Telegram admin for follow-up messages with inline keyboard
    try {
      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '💬 Trả lời', callback_data: `reply_${conversationId}` },
            { text: '❌ Đóng hội thoại', callback_data: `close_${conversationId}` },
          ],
        ],
      };

      const telegramResult = await this.telegramService.sendToAdmin(
        `💬 <b>Tin nhắn mới từ ${conv.userName}:</b>\n\n` +
        `${dto.content}\n\n` +
        `🆔 Conversation: <code>${conversationId}</code>`,
        replyMarkup
      );

      // Store the Telegram message ID for reply tracking
      if (telegramResult && telegramResult.ok && telegramResult.result) {
        await this.prisma.supportConversation.update({
          where: { id: conversationId },
          data: {
            telegramMessageId: telegramResult.result.message_id,
          },
        });
        console.log(`[SupportService] Telegram notification sent, message_id = ${telegramResult.result.message_id} saved for conversation ${conversationId}`);
      }
      console.log(`[SupportService] Telegram notification with buttons sent for follow-up message`);
    } catch (error) {
      console.error('[SupportService] Failed to send Telegram notification for follow-up:', error);
    }

    return this.formatConversation(updatedConv, updatedConv.messages);
  }

  // --- Admin Methods ---

  async getConversationsForAdmin(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { subject: { contains: params.search, mode: 'insensitive' } },
        { userName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [convs, total] = await Promise.all([
      this.prisma.supportConversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            where: { hiddenAt: null },
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      this.prisma.supportConversation.count({ where }),
    ]);

    return {
      items: convs.map((c) =>
        this.formatConversation(c, c.messages),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversationByIdForAdmin(conversationId: string) {
    let conv = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conv.adminUnreadCount > 0) {
      conv = await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: { adminUnreadCount: 0 }
      });
    }

    const messages = await this.prisma.supportMessage.findMany({
      where: { conversationId, hiddenAt: null },
      orderBy: { createdAt: 'asc' }
    });

    return this.formatConversation(conv, messages);
  }

  async addMessageFromAdmin(
    adminId: string,
    adminName: string,
    conversationId: string,
    dto: CreateMessageDto,
  ) {
    const conv = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (dto.clientMessageId) {
      const existing = await this.prisma.supportMessage.findFirst({
        where: { conversationId, clientMessageId: dto.clientMessageId }
      });
      if (existing) {
        const messages = await this.prisma.supportMessage.findMany({
          where: { conversationId, hiddenAt: null },
          orderBy: { createdAt: 'asc' }
        });
        return this.formatConversation(conv, messages);
      }
    }

    const updatedConv = await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        status: 'WAITING_FOR_USER',
        userUnreadCount: { increment: 1 },
        messages: {
          create: {
            senderId: adminId,
            senderRole: 'OWNER_ADMIN',
            senderName: adminName || 'Ban Quản Trị (OWNER_ADMIN)',
            clientMessageId: dto.clientMessageId,
            content: dto.content,
          }
        }
      },
      include: { messages: { where: { hiddenAt: null }, orderBy: { createdAt: 'asc' } } }
    });

    // Send Socket.IO event to user
    const newMessage = updatedConv.messages[updatedConv.messages.length - 1];
    await this.chatGateway.sendToUser(conv.userId, 'new-message', {
      conversationId,
      message: {
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        senderRole: newMessage.senderRole,
        senderName: newMessage.senderName,
        content: newMessage.content,
        createdAt: newMessage.createdAt.toISOString(),
      },
    });

    // Also send to conversation room
    await this.chatGateway.sendToConversation(conversationId, 'new-message', {
      conversationId,
      message: {
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        senderRole: newMessage.senderRole,
        senderName: newMessage.senderName,
        content: newMessage.content,
        createdAt: newMessage.createdAt.toISOString(),
      },
    });

    return this.formatConversation(updatedConv, updatedConv.messages);
  }

  async updateConversationStatusByAdmin(
    adminId: string,
    conversationId: string,
    dto: UpdateSupportStatusDto,
  ) {
    const conv = await this.prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    const oldStatus = conv.status;
    const dataToUpdate: any = { status: dto.status };
    if (dto.status === 'RESOLVED') {
      dataToUpdate.resolvedAt = new Date();
    } else if (dto.status === 'CLOSED') {
      dataToUpdate.closedAt = new Date();
    }

    const updatedConv = await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: dataToUpdate
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'UPDATE_SUPPORT_STATUS',
      resource: 'SupportConversation',
      resourceId: updatedConv.id,
      entityName: updatedConv.subject,
      reason: dto.reason || `Chuyển trạng thái từ ${oldStatus} sang ${dto.status}`,
    });

    // Notify user via Socket.IO about status change
    await this.chatGateway.sendToUser(conv.userId, 'conversation-status-changed', {
      conversationId: updatedConv.id,
      status: updatedConv.status,
      oldStatus: oldStatus,
    });

    // Also send to conversation room
    await this.chatGateway.sendToConversation(updatedConv.id, 'conversation-status-changed', {
      conversationId: updatedConv.id,
      status: updatedConv.status,
      oldStatus: oldStatus,
    });

    const messages = await this.prisma.supportMessage.findMany({
      where: { conversationId, hiddenAt: null },
      orderBy: { createdAt: 'asc' }
    });

    return this.formatConversation(updatedConv, messages);
  }

  private formatConversation(
    conv: any,
    messages: any[],
  ) {
    return {
      id: conv.id,
      userId: conv.userId,
      userName: conv.userName,
      subject: conv.subject,
      category: conv.category,
      status: conv.status,
      priority: conv.priority,
      lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : new Date().toISOString(),
      userUnreadCount: conv.userUnreadCount,
      adminUnreadCount: conv.adminUnreadCount,
      resolvedAt: conv.resolvedAt ? conv.resolvedAt.toISOString() : undefined,
      closedAt: conv.closedAt ? conv.closedAt.toISOString() : undefined,
      createdAt: conv.createdAt ? conv.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: conv.updatedAt ? conv.updatedAt.toISOString() : new Date().toISOString(),
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderRole: m.senderRole,
        senderName: m.senderName,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}
