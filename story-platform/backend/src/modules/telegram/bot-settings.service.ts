import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdateBotSettingsDto {
  botEnabled?: boolean;
  aiEnabled?: boolean;
  aiTimeoutSeconds?: number;
  autoHandoffEnabled?: boolean;
  supportStartTime?: string;
  supportEndTime?: string;
  greetingMessage?: string;
  handoffMessage?: string;
  unknownMessage?: string;
  outsideHoursMessage?: string;
  closedMessage?: string;
}

const DEFAULT_SETTINGS = {
  botEnabled: true,
  aiEnabled: true,
  aiTimeoutSeconds: 5,
  autoHandoffEnabled: true,
  supportStartTime: '08:00',
  supportEndTime: '22:00',
  greetingMessage: '🎧 TOP TRUYỆN AUDIO\n\nXin chào! 👋\n\nBạn đang cần hỗ trợ vấn đề gì?\n\nHãy gửi nội dung cần hỗ trợ.\nĐội ngũ CSKH sẽ phản hồi sớm nhất.',
  handoffMessage: '👨‍💼 Yêu cầu của bạn đang được chuyển đến nhân viên CSKH.\n\nVui lòng chờ trong giây lát.',
  unknownMessage: '🤖 Bot chưa thể xử lý chính xác yêu cầu này.\n\nYêu cầu của bạn sẽ được chuyển đến CSKH để hỗ trợ.',
  outsideHoursMessage: '🌙 Hiện tại đội ngũ CSKH đã hết giờ hỗ trợ.\n\n⏰ Thời gian hỗ trợ:\n08:00 - 22:00\n\nYêu cầu của bạn đã được ghi nhận và sẽ được phản hồi khi CSKH hoạt động trở lại.',
  closedMessage: '✅ Hội thoại đã kết thúc.\n\nNếu bạn cần hỗ trợ thêm, vui lòng gửi tin nhắn mới.',
};

@Injectable()
export class BotSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.botSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await this.prisma.botSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateBotSettingsDto) {
    const currentSettings = await this.getSettings();

    // Validate aiTimeoutSeconds
    if (dto.aiTimeoutSeconds !== undefined) {
      if (!Number.isInteger(dto.aiTimeoutSeconds)) {
        throw new BadRequestException('aiTimeoutSeconds phải là số nguyên');
      }
      if (dto.aiTimeoutSeconds < 1) {
        throw new BadRequestException('aiTimeoutSeconds phải lớn hơn 0');
      }
      if (dto.aiTimeoutSeconds > 30) {
        throw new BadRequestException('aiTimeoutSeconds không được vượt quá 30 giây');
      }
    }

    // Validate supportStartTime and supportEndTime format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (dto.supportStartTime !== undefined) {
      if (!timeRegex.test(dto.supportStartTime)) {
        throw new BadRequestException('supportStartTime phải có định dạng HH:mm (ví dụ: 08:00)');
      }
    }

    if (dto.supportEndTime !== undefined) {
      if (!timeRegex.test(dto.supportEndTime)) {
        throw new BadRequestException('supportEndTime phải có định dạng HH:mm (ví dụ: 22:00)');
      }
    }

    // Validate message length
    const maxLength = 2000;
    if (dto.greetingMessage && dto.greetingMessage.length > maxLength) {
      throw new BadRequestException(`greetingMessage không được vượt quá ${maxLength} ký tự`);
    }
    if (dto.handoffMessage && dto.handoffMessage.length > maxLength) {
      throw new BadRequestException(`handoffMessage không được vượt quá ${maxLength} ký tự`);
    }
    if (dto.unknownMessage && dto.unknownMessage.length > maxLength) {
      throw new BadRequestException(`unknownMessage không được vượt quá ${maxLength} ký tự`);
    }
    if (dto.outsideHoursMessage && dto.outsideHoursMessage.length > maxLength) {
      throw new BadRequestException(`outsideHoursMessage không được vượt quá ${maxLength} ký tự`);
    }
    if (dto.closedMessage && dto.closedMessage.length > maxLength) {
      throw new BadRequestException(`closedMessage không được vượt quá ${maxLength} ký tự`);
    }

    // Update settings
    const updatedSettings = await this.prisma.botSettings.update({
      where: { id: currentSettings.id },
      data: dto,
    });

    return updatedSettings;
  }

  async isWithinSupportHours(): Promise<boolean> {
    const settings = await this.getSettings();
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes;

    const [startHours, startMinutes] = settings.supportStartTime.split(':').map(Number);
    const [endHours, endMinutes] = settings.supportEndTime.split(':').map(Number);
    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    return currentTime >= startTime && currentTime <= endTime;
  }
}
