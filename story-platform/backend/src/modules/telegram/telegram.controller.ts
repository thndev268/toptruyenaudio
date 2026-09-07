import { Controller, Post, Body, Headers, Get } from '@nestjs/common';
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

    // Handle text messages from admin
    if (update.message && update.message.text) {
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
      // Admin clicked "Reply" - send a message to admin asking them to type their reply
      await this.telegramService.answerCallbackQuery(id, '💬 Nhập tin nhắn trả lời của bạn...');
      
      // Store the conversation ID in a temporary state for the next message
      await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: { 
          telegramMessageId: message.message_id,
          isTelegramLinked: true,
          telegramChatId: String(message.chat.id)
        },
      });
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

  private async handleAdminMessage(message: any) {
    const { chat, text, reply_to_message } = message;

    // Only process messages from admin chat
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (String(chat.id) !== adminChatId) {
      console.log('[Telegram] Message from non-admin chat, ignoring');
      return;
    }

    // If this is a reply to a conversation message, save it as admin response
    if (reply_to_message) {
      // Find the conversation associated with this message
      const conversation = await this.prisma.supportConversation.findFirst({
        where: {
          telegramMessageId: reply_to_message.message_id,
        },
      });

      if (conversation) {
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

        // Update conversation
        const updatedConv = await this.prisma.supportConversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            userUnreadCount: { increment: 1 },
            status: 'WAITING_FOR_USER',
            telegramMessageId: null, // Clear the temporary telegramMessageId
          },
        });

        console.log(`[Telegram] Admin reply saved for conversation ${conversation.id}`);
        
        // Emit Socket.IO event to user
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

        // Also send to conversation room
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

        // Send confirmation to admin
        await this.telegramService.sendToAdmin(`✅ Tin nhắn đã gửi đến người dùng ${conversation.userName}`);
        
        return;
      }
    }

    // If not a reply, it might be a new message - log it
    console.log('[Telegram] Unhandled message from admin:', text);
  }
}
