import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: {
    inline_keyboard: any[][];
  };
}

interface TelegramWebhookUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    text?: string;
    reply_to_message?: {
      message_id: number;
      text?: string;
      from?: {
        id: number;
        first_name?: string;
      };
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      username?: string;
    };
    data: string;
    message: {
      message_id: number;
      chat: { id: number };
    };
  };
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly adminChatId: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID') || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(message: TelegramMessage): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, message);
      this.logger.log(`[Telegram] Message sent to chat ${message.chat_id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send Telegram message:', error);
      if (axios.isAxiosError(error)) {
        this.logger.error(`[Telegram] API Error: ${error.response?.data?.description || error.message}`);
      }
      throw error;
    }
  }

  async sendToAdmin(text: string, replyMarkup?: any): Promise<any> {
    if (!this.botToken || !this.adminChatId) {
      this.logger.warn('Telegram bot token or admin chat ID not configured');
      return null;
    }

    return this.sendMessage({
      chat_id: this.adminChatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  }

  async sendReplyButtons(conversationId: string, userName: string, subject?: string, message?: string): Promise<any> {
    const text = `📨 <b>Phản hồi từ người dùng:</b> ${userName}\n\n` +
      `<b>Chủ đề:</b> ${subject || 'Không có'}\n\n` +
      `<b>Nội dung:</b>\n${message || 'Không có'}\n\n` +
      `Conversation ID: <code>${conversationId}</code>`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '💬 Trả lời', callback_data: `reply_${conversationId}` },
          { text: '❌ Đóng hội thoại', callback_data: `close_${conversationId}` },
        ],
      ],
    };

    return this.sendToAdmin(text, replyMarkup);
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert: boolean = true): Promise<any> {
    try {
      await axios.post(`${this.apiUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text: text || '',
        show_alert: showAlert,
      });
    } catch (error) {
      this.logger.error('Failed to answer callback query:', error);
    }
  }

  async setWebhook(webhookUrl: string): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/setWebhook`, {
        url: webhookUrl,
      });
      this.logger.log(`Webhook set to: ${webhookUrl}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  async getWebhookInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/getWebhookInfo`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get webhook info:', error);
      throw error;
    }
  }

  parseWebhookUpdate(body: any): TelegramWebhookUpdate | null {
    try {
      return body as TelegramWebhookUpdate;
    } catch (error) {
      this.logger.error('Failed to parse webhook update:', error);
      return null;
    }
  }

  extractConversationId(callbackData: string): string | null {
    if (callbackData.startsWith('reply_')) {
      return callbackData.replace('reply_', '');
    }
    if (callbackData.startsWith('close_')) {
      return callbackData.replace('close_', '');
    }
    return null;
  }
}
