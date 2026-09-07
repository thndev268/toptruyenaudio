import { Controller, Post, Body, Headers, Get, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { SupportService } from '../support/support.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@ApiTags('Telegram Bot')
@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    @Inject(forwardRef(() => SupportService))
    private readonly supportService: SupportService,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Telegram webhook endpoint' })
  async handleWebhook(@Body() body: any, @Headers('x-telegram-bot-api-secret-token') secret: string) {
    // Verify webhook secret if configured
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (configuredSecret && secret !== configuredSecret) {
      console.error('[Telegram] Invalid webhook secret');
      return { ok: false };
    }

    const update = this.telegramService.parseWebhookUpdate(body);
    if (!update) {
      return { ok: false };
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return { ok: true };
    }

    // Handle text messages
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      
      // Handle /start command
      if (text === '/start') {
        await this.handleStartCommand(update.message);
        return { ok: true };
      }
      
      // Handle /help command
      if (text === '/help') {
        await this.handleHelpCommand(update.message);
        return { ok: true };
      }
      
      // Handle admin messages
      await this.handleAdminMessage(update.message);
      return { ok: true };
    }

    return { ok: true };
  }

  @Post('set-webhook')
  @ApiOperation({ summary: 'Set Telegram webhook' })
  async setWebhook(@Body() body: { url: string }) {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      return { success: false, error: 'APP_URL not configured' };
    }

    const webhookUrl = body.url || `${appUrl}/telegram/webhook`;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    try {
      const result = await this.telegramService.setWebhook(webhookUrl);
      return { 
        success: true, 
        webhookUrl, 
        hasSecret: !!secret,
        result 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookUrl 
      };
    }
  }

  @Get('webhook-info')
  @ApiOperation({ summary: 'Get Telegram webhook info' })
  async getWebhookInfo() {
    try {
      const info = await this.telegramService.getWebhookInfo();
      return { success: true, info };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const { id, from, data, message } = callbackQuery;
    const conversationId = this.telegramService.extractConversationId(data);

    if (!conversationId) {
      await this.telegramService.answerCallbackQuery(id, 'Invalid action');
      return;
    }

    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conversation) {
      await this.telegramService.answerCallbackQuery(id, 'Conversation not found');
      return;
    }

    if (data.startsWith('reply_')) {
      // Admin clicked "Reply" - set conversation as active for next message
      await this.telegramService.answerCallbackQuery(id, '💬 Nhập tin nhắn trả lời của bạn...');

      // Store the trigger message ID to mark this conversation as active
      await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: {
          telegramMessageId: message.message_id, // Store the trigger message ID
        },
      });

      console.log(`[Telegram] Reply mode activated for conversation ${conversationId}, user: ${conversation.userName}`);

      // Send confirmation with detailed context
      await this.telegramService.sendToAdmin(
        `📝 <b>Đang trả lời cho:</b>\n\n` +
        `👤 <b>${conversation.userName}</b>\n` +
        `📌 <b>Chủ đề:</b> ${conversation.subject}\n\n` +
        `💬 Hãy gửi tin nhắn của bạn.`
      );
    } else if (data.startsWith('close_')) {
      // Admin clicked "Close conversation"
      const updatedConv = await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      await this.telegramService.answerCallbackQuery(id, '✅ Hội thoại đã đóng');
      
      // Notify user via Socket.IO
      await this.chatGateway.sendToUser(conversation.userId, 'conversation-closed', {
        conversationId: conversation.id,
        status: 'CLOSED',
        closedAt: updatedConv.closedAt?.toISOString(),
      });
      
      // Also send to conversation room
      await this.chatGateway.sendToConversation(conversation.id, 'conversation-closed', {
        conversationId: conversation.id,
        status: 'CLOSED',
        closedAt: updatedConv.closedAt?.toISOString(),
      });
      
      console.log(`[Telegram] Conversation ${conversationId} closed by admin`);
    }
  }

  private async handleStartCommand(message: any) {
    const userName = message.from?.first_name || message.from?.username || 'Người dùng';
    const chatId = message.chat.id;
    
    // Send response to user (not admin)
    await this.telegramService.sendMessage({
      chat_id: chatId,
      text: `🎧 <b>TOP TRUYỆN AUDIO</b>\n\n` +
        `Xin chào ${userName}! 👋\n\n` +
        `Bạn đang cần hỗ trợ vấn đề gì?\n\n` +
        `💬 Hãy gửi tin nhắn của bạn.\n` +
        `Đội ngũ CSKH sẽ tiếp nhận và phản hồi sớm nhất.\n\n` +
        `⏰ Thời gian hỗ trợ:\n` +
        `08:00 - 22:00`,
      parse_mode: 'HTML',
    });
    
    console.log(`[Telegram] /start command handled for user: ${userName}, chat: ${chatId}`);
  }

  private async handleHelpCommand(message: any) {
    const chatId = message.chat.id;
    
    // Send response to user (not admin)
    await this.telegramService.sendMessage({
      chat_id: chatId,
      text: `📚 <b>HƯỚNG DẪN HỖ TRỢ</b>\n\n` +
        `Bạn có thể gửi:\n` +
        `• Báo lỗi website\n` +
        `• Báo lỗi nghe truyện\n` +
        `• Vấn đề tài khoản\n` +
        `• Vấn đề gói Premium\n` +
        `• Góp ý / phản hồi\n\n` +
        `💬 Chỉ cần gửi nội dung cần hỗ trợ,\n` +
        `CSKH sẽ tiếp nhận.`,
      parse_mode: 'HTML',
    });
    
    console.log(`[Telegram] /help command handled for chat: ${chatId}`);
  }

  private async handleAdminMessage(message: any) {
    const { chat, text, reply_to_message } = message;

    // Only process messages from admin chat
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!adminChatId) {
      console.log('[Telegram] TELEGRAM_ADMIN_CHAT_ID not configured');
      return;
    }
    
    if (String(chat.id) !== adminChatId) {
      console.log('[Telegram] Message from non-admin chat, ignoring');
      return;
    }

    console.log('[TELEGRAM] Admin reply received');
    console.log('[TELEGRAM] reply_to_message.message_id =', reply_to_message?.message_id);
    console.log('[TELEGRAM] Message text =', text);

    let conversation: any = null;

    // If this is a reply to a conversation message, find the conversation by telegramMessageId
    if (reply_to_message) {
      console.log('[TELEGRAM] Looking for conversation by telegramMessageId:', reply_to_message.message_id);
      conversation = await this.prisma.supportConversation.findFirst({
        where: {
          telegramMessageId: reply_to_message.message_id,
        } as any,
      });
      
      if (conversation) {
        console.log('[TELEGRAM] Conversation found =', conversation.id);
        console.log('[TELEGRAM] User ID =', conversation.userId);
      } else {
        console.log('[TELEGRAM] Conversation not found by telegramMessageId, trying to parse from text');
        // Fallback: try to extract conversation ID from the replied message text
        if (reply_to_message.text) {
          const match = reply_to_message.text.match(/Conversation ID: <code>([a-z0-9]+)<\/code>/i);
          if (match && match[1]) {
            console.log('[TELEGRAM] Extracted conversation ID from text:', match[1]);
            conversation = await this.prisma.supportConversation.findUnique({
              where: { id: match[1] },
            });
            if (conversation) {
              console.log('[TELEGRAM] Conversation found by parsed ID =', conversation.id);
            }
          }
        }
      }
    } else {
      // If not a reply, check if there's an active conversation waiting for reply
      // Active conversation is one with telegramMessageId set (from the "Reply" button click)
      // Get the most recently updated one within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      console.log('[TELEGRAM] Looking for active conversation updated after:', fiveMinutesAgo);
      
      conversation = await this.prisma.supportConversation.findFirst({
        where: {
          telegramMessageId: { not: null },
          updatedAt: { gte: fiveMinutesAgo },
        } as any,
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }

    if (!conversation) {
      console.log('[TELEGRAM] Conversation not found, message not delivered');
      console.log('[TELEGRAM] Unhandled message from admin:', text);
      
      // Send error message to admin
      await this.telegramService.sendToAdmin(
        `❌ Không tìm thấy cuộc hội thoại để trả lời.\n\n` +
        `💬 Hãy nhấn nút "Trả lời" trên tin nhắn thông báo trước.`
      );
      return;
    }

    // Check if conversation is closed
    if (conversation.status === 'CLOSED') {
      console.log('[TELEGRAM] Conversation is closed, cannot send message');
      await this.telegramService.sendToAdmin(
        `❌ Cuộc hội thoại này đã đóng.\n\n` +
        `💬 ID: ${conversation.id}`
      );
      return;
    }

    // Save admin message to database
    const newMessage = await this.prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: 'ADMIN',
        senderRole: 'OWNER_ADMIN',
        senderName: 'Ban Quản Trị',
        content: text,
      },
    });

    console.log('[PRISMA] Admin message saved, ID:', newMessage.id);

    // Update conversation and clear the active state
    const updatedConv = await this.prisma.supportConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        userUnreadCount: { increment: 1 },
        status: 'WAITING_FOR_USER',
        telegramMessageId: null, // Clear active state
        telegramChatId: null, // Clear active chat ID
      },
    });

    console.log('[PRISMA] Conversation updated, status = WAITING_FOR_USER');

    // Emit Socket.IO event to user
    console.log('[SOCKET] Room = user:', conversation.userId);
    console.log('[SOCKET] Event = new-message');
    
    try {
      await this.chatGateway.sendToUser(conversation.userId, 'new-message', {
        conversationId: conversation.id,
        message: {
          id: newMessage.id,
          conversationId: conversation.id,
          senderId: 'ADMIN',
          senderRole: 'OWNER_ADMIN',
          senderName: 'Ban Quản Trị',
          content: text,
          createdAt: newMessage.createdAt.toISOString(),
        },
      });
      console.log('[SOCKET] new-message sent to user:', conversation.userId);
    } catch (socketError) {
      console.error('[SOCKET] Failed to send message to user:', socketError);
    }

    // Also send to conversation room
    console.log('[SOCKET] Room = conversation:', conversation.id);
    try {
      await this.chatGateway.sendToConversation(conversation.id, 'new-message', {
        conversationId: conversation.id,
        message: {
          id: newMessage.id,
          conversationId: conversation.id,
          senderId: 'ADMIN',
          senderRole: 'OWNER_ADMIN',
          senderName: 'Ban Quản Trị',
          content: text,
          createdAt: newMessage.createdAt.toISOString(),
        },
      });
      console.log('[SOCKET] new-message sent to conversation room:', conversation.id);
    } catch (socketError) {
      console.error('[SOCKET] Failed to send message to conversation room:', socketError);
    }

    console.log('[SOCKET] new-message emitted');

    // Send confirmation to admin
    await this.telegramService.sendToAdmin(`✅ Tin nhắn đã gửi đến người dùng ${conversation.userName}`);
  }
}
