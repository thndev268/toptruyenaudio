import { Controller, Post, Body, Headers, Get, Put, Inject, forwardRef, UseGuards, Patch, UseInterceptors, UploadedFile, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { SupportService } from '../support/support.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BotSettingsService, UpdateBotSettingsDto } from './bot-settings.service';
import { KnowledgeDocumentService } from './knowledge-document.service';
import { AiService } from './ai.service';
import { FileInterceptor } from '@nestjs/platform-express';

interface ReplySession {
  adminChatId: string;
  conversationId: string;
  userName: string;
  subject: string;
  expiresAt: Date;
}

@ApiTags('Telegram Bot')
@Controller('telegram')
export class TelegramController {
  private replySessions = new Map<string, ReplySession>(); // adminChatId -> ReplySession
  private readonly SESSION_EXPIRY_MINUTES = 30; // Session expires after 30 minutes

  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SupportService))
    private readonly supportService: SupportService,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly botSettingsService: BotSettingsService,
    private readonly knowledgeDocumentService: KnowledgeDocumentService,
    private readonly aiService: AiService,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Telegram webhook endpoint' })
  async handleWebhook(@Body() body: any, @Headers('x-telegram-bot-api-secret-token') secret: string) {
    console.log('[TELEGRAM WEBHOOK] UPDATE RECEIVED');
    console.log('[TELEGRAM WEBHOOK] update:', JSON.stringify(body));
    
    // Verify webhook secret if configured
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    console.log('[TELEGRAM WEBHOOK] configuredSecret exists:', !!configuredSecret);
    console.log('[TELEGRAM WEBHOOK] received secret:', !!secret);
    if (configuredSecret && secret !== configuredSecret) {
      console.error('[Telegram] Invalid webhook secret');
      return { ok: false };
    }

    const update = this.telegramService.parseWebhookUpdate(body);
    if (!update) {
      console.error('[TELEGRAM WEBHOOK] Failed to parse update');
      return { ok: false };
    }

    console.log('[TELEGRAM WEBHOOK] Parsed update has callback_query:', !!update.callback_query);
    console.log('[TELEGRAM WEBHOOK] Parsed update has message:', !!update.message);

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      console.log('[TELEGRAM WEBHOOK] Routing to handleCallbackQuery');
      await this.handleCallbackQuery(update.callback_query);
      return { ok: true };
    }

    // Handle text messages
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      console.log('[TELEGRAM WEBHOOK] Message text:', text);
      
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
      
      // Check if message is from admin
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (adminChatId && String(update.message.chat.id) === adminChatId) {
        // Handle admin messages
        await this.handleAdminMessage(update.message);
      } else {
        // Handle user messages with AI
        await this.handleUserMessage(update.message);
      }
      return { ok: true };
    }

    return { ok: true };
  }

  @Post('set-webhook')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set Telegram webhook (Admin only)' })
  async setWebhook(@Body() body: { url?: string }) {
    const configuredWebhookUrl =
      this.configService.get<string>('telegram.webhookUrl') ||
      process.env.TELEGRAM_WEBHOOK_URL;

    let webhookUrl: string;

    if (configuredWebhookUrl) {
      webhookUrl = body.url || configuredWebhookUrl;
    } else {
      const appUrl =
        this.configService.get<string>('appUrl') ||
        process.env.APP_URL;

      if (!appUrl) {
        return {
          success: false,
          error: 'APP_URL not configured',
        };
      }

      const apiPrefix =
        this.configService.get<string>('apiPrefix') ||
        process.env.API_PREFIX ||
        '/api/v1';

      webhookUrl =
        body.url || `${appUrl}${apiPrefix}/telegram/webhook`;
    }

    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    console.log('[Telegram] Setting webhook:', webhookUrl);
    console.log('[Telegram] Has secret:', !!secret);

    try {
      const result = await this.telegramService.setWebhook(webhookUrl, secret);
      return { 
        success: true, 
        webhookUrl, 
        hasSecret: !!secret,
        result 
      };
    } catch (error) {
      console.error('[Telegram] Failed to set webhook:', error);
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

  @Get('admin/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Telegram settings (Admin only)' })
  async getSettings() {
    return {
      isEnabled: !!process.env.TELEGRAM_BOT_TOKEN,
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    };
  }

  @Put('admin/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Telegram settings (Admin only)' })
  async updateSettings(@Body() body: {
    isEnabled: boolean;
    botToken: string;
    adminChatId: string;
    webhookSecret: string;
  }) {
    // In production, these should be stored in database or secure config
    // For now, we'll just return success (actual implementation would update env/config)
    console.log('[Telegram] Settings update requested:', {
      isEnabled: body.isEnabled,
      hasBotToken: !!body.botToken,
      hasAdminChatId: !!body.adminChatId,
      hasWebhookSecret: !!body.webhookSecret,
    });

    // Note: In a real implementation, you would update environment variables or database
    // This is a placeholder that logs the settings
    return {
      success: true,
      message: 'Settings updated (Note: In production, this would update config/database)',
    };
  }

  @Get('admin/bot-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Bot settings (Admin only)' })
  async getBotSettings() {
    return this.botSettingsService.getSettings();
  }

  @Patch('admin/bot-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Bot settings (Admin only)' })
  async updateBotSettings(@Body() dto: UpdateBotSettingsDto) {
    return this.botSettingsService.updateSettings(dto);
  }

  @Post('admin/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test Telegram connection (Admin only)' })
  async testConnection(@Body() body: { botToken: string; adminChatId: string }) {
    try {
      const apiUrl = `https://api.telegram.org/bot${body.botToken}/getMe`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.ok) {
        // Try to send a test message
        const testMessageUrl = `https://api.telegram.org/bot${body.botToken}/sendMessage`;
        const testResponse = await fetch(testMessageUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: body.adminChatId,
            text: '✅ Test connection successful! Telegram Bot is working.',
          }),
        });
        const testData = await testResponse.json();

        if (testData.ok) {
          return {
            success: true,
            message: 'Kết nối thành công! Đã gửi tin nhắn test đến admin.',
          };
        } else {
          return {
            success: false,
            message: `Bot hoạt động nhưng không thể gửi tin nhắn: ${testData.description}`,
          };
        }
      } else {
        return {
          success: false,
          message: `Bot Token không hợp lệ: ${data.description}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Lỗi kết nối: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    console.log('[TELEGRAM CALLBACK] RECEIVED');
    console.log('[TELEGRAM CALLBACK] callbackQuery:', JSON.stringify(callbackQuery));
    
    const { id, from, data, message } = callbackQuery;
    console.log('[TELEGRAM CALLBACK] data:', callbackQuery.data);
    console.log('[TELEGRAM CALLBACK] from:', callbackQuery.from?.id);
    console.log('[TELEGRAM CALLBACK] messageId:', callbackQuery.message?.message_id);
    
    const conversationId = this.telegramService.extractConversationId(data);
    console.log('[Telegram] Extracted conversation ID:', conversationId);

    if (!conversationId) {
      console.log('[Telegram] Invalid conversation ID from callback data:', data);
      await this.telegramService.answerCallbackQuery(id, 'Invalid action');
      return;
    }

    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conversation) {
      console.log('[Telegram] Conversation not found:', conversationId);
      await this.telegramService.answerCallbackQuery(id, 'Conversation not found');
      return;
    }

    console.log('[Telegram] Conversation found:', conversation.id, 'Status:', conversation.status);

    if (data.startsWith('reply_')) {
      // Admin clicked "Reply" - create reply session
      console.log('[Telegram CALLBACK] Admin clicked Reply button');
      
      // Verify admin is authorized
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      console.log('[Telegram CALLBACK] TELEGRAM_ADMIN_CHAT_ID:', adminChatId);
      console.log('[Telegram CALLBACK] from.id:', from.id);
      console.log('[Telegram CALLBACK] String(from.id):', String(from.id));
      
      if (!adminChatId) {
        console.log('[Telegram] TELEGRAM_ADMIN_CHAT_ID not configured');
        await this.telegramService.answerCallbackQuery(id, 'Admin chat ID not configured');
        return;
      }

      if (String(from.id) !== adminChatId) {
        console.log('[Telegram] Unauthorized user tried to reply:', from.id);
        await this.telegramService.answerCallbackQuery(id, '⚠️ Bạn không có quyền trả lời');
        return;
      }

      // Create reply session
      const replySession: ReplySession = {
        adminChatId: String(from.id),
        conversationId: conversationId,
        userName: conversation.userName,
        subject: conversation.subject,
        expiresAt: new Date(Date.now() + this.SESSION_EXPIRY_MINUTES * 60 * 1000),
      };

      this.replySessions.set(String(from.id), replySession);
      console.log('[Telegram CALLBACK] Creating reply session');
      console.log('[Telegram CALLBACK] conversationId =', conversationId);
      console.log('[Telegram CALLBACK] adminChatId =', String(from.id));
      console.log('[Telegram CALLBACK] session created:', replySession);

      console.log('[Telegram CALLBACK] Calling answerCallbackQuery');
      await this.telegramService.answerCallbackQuery(id, '💬 Đang chuyển sang chế độ trả lời...');
      console.log('[Telegram CALLBACK] answerCallbackQuery completed');

      console.log('[Telegram CALLBACK] Sending confirmation to admin');
      // Send confirmation with detailed context
      await this.telegramService.sendToAdmin(
        `💬 <b>ĐANG TRẢ LỜI</b>\n\n` +
        `👤 <b>Người dùng:</b> ${conversation.userName}\n` +
        `📌 <b>Chủ đề:</b> ${conversation.subject}\n` +
        `🆔 <b>Conversation:</b> <code>${conversationId}</code>\n\n` +
        `✏️ <b>Hãy nhập nội dung phản hồi.</b>\n\n` +
        `⏰ Phiên trả lời hết hạn sau ${this.SESSION_EXPIRY_MINUTES} phút.`
      );
      console.log('[Telegram CALLBACK] Confirmation sent');
    } else if (data.startsWith('close_')) {
      // Admin clicked "Close conversation"
      console.log('[Telegram] Admin clicked Close button');
      
      // Verify admin is authorized
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (!adminChatId) {
        console.log('[Telegram] TELEGRAM_ADMIN_CHAT_ID not configured');
        await this.telegramService.answerCallbackQuery(id, 'Admin chat ID not configured');
        return;
      }

      if (String(from.id) !== adminChatId) {
        console.log('[Telegram] Unauthorized user tried to close:', from.id);
        await this.telegramService.answerCallbackQuery(id, '⚠️ Bạn không có quyền đóng hội thoại');
        return;
      }

      const updatedConv = await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      await this.telegramService.answerCallbackQuery(id, '✅ Hội thoại đã đóng');
      
      // Send confirmation to admin
      await this.telegramService.sendToAdmin(
        `✅ <b>Đã đóng hội thoại</b>\n\n` +
        `🆔 Conversation: <code>${conversationId}</code>\n` +
        `👤 Người dùng: ${conversation.userName}\n` +
        `📌 Chủ đề: ${conversation.subject}`
      );
      
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

  private async handleUserMessage(message: any) {
    const { chat, text, from } = message;
    const chatId = chat.id;
    const userName = from?.first_name || from?.username || 'Người dùng';
    const userId = String(chat.id); // Use chat ID as user ID for Telegram users

    console.log(`[Telegram] User message from ${userName} (${userId}):`, text);

    // Get bot settings
    const botSettings = await this.botSettingsService.getSettings();
    console.log('[Telegram] Bot settings:', JSON.stringify(botSettings));

    // Check if bot is enabled
    if (!botSettings.botEnabled) {
      console.log('[Telegram] Bot is disabled, skipping auto-reply');
      // Still create support conversation
      await this.handoffToSupport(userId, userName, text, 'Bot disabled');
      return;
    }

    // Check support hours
    const isWithinSupportHours = await this.botSettingsService.isWithinSupportHours();
    if (!isWithinSupportHours) {
      console.log('[Telegram] Outside support hours');
      await this.telegramService.sendMessage({
        chat_id: chatId,
        text: botSettings.outsideHoursMessage || '🌙 Hiện tại đội ngũ CSKH đã hết giờ hỗ trợ.',
        parse_mode: 'HTML',
      });
      return;
    }

    // Check if AI is enabled
    if (!botSettings.aiEnabled) {
      console.log('[Telegram] AI is disabled, handoff to support');
      await this.handoffToSupport(userId, userName, text, 'AI disabled');
      return;
    }

    // Check if user is requesting human support
    const humanRequestKeywords = ['gặp nhân viên', 'gặp cskh', 'nhân viên hỗ trợ', 'người thật', 'admin hỗ trợ', 'cần người hỗ trợ'];
    const lowerText = text.toLowerCase();
    if (humanRequestKeywords.some(keyword => lowerText.includes(keyword))) {
      console.log('[Telegram] User requested human support');
      await this.handoffToSupport(userId, userName, text, 'User requested human');
      return;
    }

    // Get knowledge chunks
    const knowledgeChunks = await this.knowledgeDocumentService.getReadyChunks();
    console.log(`[Telegram] Retrieved ${knowledgeChunks.length} knowledge chunks`);

    if (knowledgeChunks.length === 0) {
      console.log('[Telegram] No knowledge chunks available, handoff to support');
      await this.handoffToSupport(userId, userName, text, 'No knowledge base');
      return;
    }

    // Get conversation context
    const conversationContext = await this.getConversationContext(userId);
    console.log(`[Telegram] Retrieved ${conversationContext.length} context messages`);

    // Call AI with timeout
    const timeoutMs = (botSettings.aiTimeoutSeconds || 5) * 1000;
    console.log(`[Telegram] Calling AI with ${timeoutMs}ms timeout`);

    const aiResponse = await this.aiService.generateAnswer(
      {
        userMessage: text,
        knowledgeChunks,
        conversationContext,
      },
      timeoutMs,
    );

    console.log('[Telegram] AI response:', JSON.stringify(aiResponse));

    // Check if AI wants to handoff
    if (aiResponse.shouldHandoff || !aiResponse.answer) {
      console.log('[Telegram] AI requested handoff or no answer');
      await this.handoffToSupport(userId, userName, text, aiResponse.answer || 'AI handoff');
      return;
    }

    // Send AI response to user
    await this.telegramService.sendMessage({
      chat_id: chatId,
      text: aiResponse.answer,
      parse_mode: 'HTML',
    });

    // Save AI message to support conversation if exists
    await this.saveMessageToConversation(userId, userName, text, aiResponse.answer, 'AI');

    console.log('[Telegram] AI response sent successfully');
  }

  private async handoffToSupport(userId: string, userName: string, userMessage: string, reason: string) {
    console.log(`[Telegram] Handoff to support for user ${userId}. Reason: ${reason}`);

    // Find or create conversation
    let conversation = await this.prisma.supportConversation.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'WAITING_FOR_ADMIN', 'WAITING_FOR_USER'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await this.prisma.supportConversation.create({
        data: {
          userId,
          userName,
          subject: 'Hỗ trợ từ Telegram Bot',
          category: 'OTHER',
          status: 'WAITING_FOR_ADMIN',
          priority: 'NORMAL',
          lastMessageAt: new Date(),
          userUnreadCount: 0,
          adminUnreadCount: 1,
          telegramChatId: userId,
          isTelegramLinked: true,
          messages: {
            create: {
              senderId: userId,
              senderRole: 'USER',
              senderName: userName,
              content: userMessage,
            },
          },
        },
      });
      console.log(`[Telegram] Created new conversation ${conversation.id}`);
    } else {
      // Add message to existing conversation
      await this.prisma.supportMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          senderRole: 'USER',
          senderName: userName,
          content: userMessage,
        },
      });
      
      await this.prisma.supportConversation.update({
        where: { id: conversation.id },
        data: {
          status: 'WAITING_FOR_ADMIN',
          lastMessageAt: new Date(),
          adminUnreadCount: { increment: 1 },
          telegramChatId: userId,
          isTelegramLinked: true,
        },
      });
      console.log(`[Telegram] Added message to existing conversation ${conversation.id}`);
    }

    // Get bot settings for handoff message
    const botSettings = await this.botSettingsService.getSettings();

    // Send handoff message to user
    await this.telegramService.sendMessage({
      chat_id: userId,
      text: botSettings.handoffMessage || '👨‍💼 Yêu cầu của bạn đang được chuyển đến nhân viên CSKH.',
      parse_mode: 'HTML',
    });

    // Notify admin via Telegram
    await this.telegramService.sendToAdmin(
      `📨 <b>YÊU CẦU HỖ TRỢ</b>\n\n` +
      `👤 <b>Người dùng:</b> ${userName}\n` +
      `📌 <b>Chủ đề:</b> ${conversation.subject}\n` +
      `💬 <b>Nội dung:</b>\n${userMessage}\n\n` +
      `🆔 <b>Conversation:</b> <code>${conversation.id}</code>\n` +
      `🤖 <b>Bot:</b> ${reason}`,
      [
        [
          { text: '💬 Trả lời', callback_data: `reply_${conversation.id}` },
          { text: '❌ Đóng hội thoại', callback_data: `close_${conversation.id}` },
        ],
      ],
    );

    console.log(`[Telegram] Handoff completed for conversation ${conversation.id}`);
  }

  private async getConversationContext(userId: string): Promise<string[]> {
    const conversation = await this.prisma.supportConversation.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'WAITING_FOR_ADMIN', 'WAITING_FOR_USER'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!conversation || !conversation.messages) {
      return [];
    }

    return conversation.messages
      .reverse()
      .map((msg) => `${msg.senderRole}: ${msg.content}`);
  }

  private async saveMessageToConversation(userId: string, userName: string, userMessage: string, aiResponse: string, senderRole: string) {
    // Find active conversation
    const conversation = await this.prisma.supportConversation.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'WAITING_FOR_ADMIN', 'WAITING_FOR_USER'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      // Create new conversation
      const newConv = await this.prisma.supportConversation.create({
        data: {
          userId,
          userName,
          subject: 'Hỗ trợ từ Telegram Bot',
          category: 'OTHER',
          status: 'ACTIVE',
          priority: 'NORMAL',
          lastMessageAt: new Date(),
          userUnreadCount: 0,
          adminUnreadCount: 0,
          messages: {
            createMany: {
              data: [
                {
                  senderId: userId,
                  senderRole: 'USER',
                  senderName: userName,
                  content: userMessage,
                },
                {
                  senderId: 'AI',
                  senderRole: 'AI',
                  senderName: 'AI Bot',
                  content: aiResponse,
                },
              ],
            },
          },
        },
      });
      console.log(`[Telegram] Created new conversation for AI messages: ${newConv.id}`);
    } else {
      // Add messages to existing conversation
      await this.prisma.supportMessage.createMany({
        data: [
          {
            conversationId: conversation.id,
            senderId: userId,
            senderRole: 'USER',
            senderName: userName,
            content: userMessage,
          },
          {
            conversationId: conversation.id,
            senderId: 'AI',
            senderRole: 'AI',
            senderName: 'AI Bot',
            content: aiResponse,
          },
        ],
      });

      await this.prisma.supportConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
        },
      });
    }
  }

  private async handleAdminMessage(message: any) {
    const { chat, text } = message;

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

    console.log('[TELEGRAM] Admin message received:', text);
    const adminChatIdStr = String(chat.id);

    // Check if admin has an active reply session
    const replySession = this.replySessions.get(adminChatIdStr);
    
    if (!replySession) {
      console.log('[TELEGRAM] No active reply session for admin');
      await this.telegramService.sendToAdmin(
        `⚠️ <b>Bạn chưa chọn hội thoại để trả lời.</b>\n\n` +
        `💬 Vui lòng bấm nút "Trả lời" trên tin nhắn thông báo của hội thoại cần phản hồi.`
      );
      return;
    }

    // Check if session has expired
    if (new Date() > replySession.expiresAt) {
      console.log('[TELEGRAM] Reply session expired');
      this.replySessions.delete(adminChatIdStr);
      await this.telegramService.sendToAdmin(
        `⚠️ <b>Phiên trả lời đã hết hạn.</b>\n\n` +
        `💬 Vui lòng bấm nút "Trả lời" lại trên tin nhắn thông báo.`
      );
      return;
    }

    console.log('[TELEGRAM] Using reply session:', replySession);

    // Find conversation from session
    const conversation = await this.prisma.supportConversation.findUnique({
      where: { id: replySession.conversationId },
    });

    if (!conversation) {
      console.log('[TELEGRAM] Conversation not found:', replySession.conversationId);
      this.replySessions.delete(adminChatIdStr);
      await this.telegramService.sendToAdmin(
        `❌ <b>Không tìm thấy hội thoại.</b>\n\n` +
        `🆔 ID: ${replySession.conversationId}`
      );
      return;
    }

    // Check if conversation is closed
    if (conversation.status === 'CLOSED') {
      console.log('[TELEGRAM] Conversation is closed, cannot send message');
      this.replySessions.delete(adminChatIdStr);
      await this.telegramService.sendToAdmin(
        `❌ <b>Cuộc hội thoại này đã đóng.</b>\n\n` +
        `🆔 ID: ${conversation.id}\n` +
        `👤 Người dùng: ${conversation.userName}`
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

    // Update conversation
    const updatedConv = await this.prisma.supportConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        userUnreadCount: { increment: 1 },
        status: 'WAITING_FOR_USER',
      },
    });

    console.log('[PRISMA] Conversation updated, status = WAITING_FOR_USER');

    // Emit Socket.IO event to user
    console.log('[SOCKET] Sending to user:', conversation.userId);
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
    console.log('[SOCKET] Sending to conversation room:', conversation.id);
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

    // Clear the reply session after successful send
    this.replySessions.delete(adminChatIdStr);
    console.log('[TELEGRAM] Reply session cleared for admin:', adminChatIdStr);

    // Send confirmation to admin
    await this.telegramService.sendToAdmin(
      `✅ <b>Đã gửi phản hồi</b>\n\n` +
      `👤 <b>Người dùng:</b> ${conversation.userName}\n` +
      `🆔 <b>Conversation:</b> <code>${conversation.id}</code>\n\n` +
      `💬 <b>Nội dung:</b>\n${text}`
    );
  }

  // ==================== KNOWLEDGE DOCUMENT ENDPOINTS ====================

  @Get('knowledge/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all knowledge documents' })
  async getKnowledgeDocuments() {
    return this.knowledgeDocumentService.getDocuments();
  }

  @Get('knowledge/documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get knowledge document by ID' })
  async getKnowledgeDocumentById(@Param('id') id: string) {
    return this.knowledgeDocumentService.getDocumentById(id);
  }

  @Post('knowledge/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload knowledge document' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadKnowledgeDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.knowledgeDocumentService.uploadDocument(file);
  }

  @Delete('knowledge/documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete knowledge document' })
  async deleteKnowledgeDocument(@Param('id') id: string) {
    return this.knowledgeDocumentService.deleteDocument(id);
  }

  @Post('knowledge/sync-website-context')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync website-context.txt from source code (Admin only)' })
  async syncWebsiteContext() {
    return this.knowledgeDocumentService.syncWebsiteContext();
  }
}
