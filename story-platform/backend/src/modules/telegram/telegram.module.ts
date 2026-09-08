import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { BotSettingsService } from './bot-settings.service';
import { SupportModule } from '../support/support.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SupportModule), ChatModule],
  controllers: [TelegramController],
  providers: [TelegramService, BotSettingsService],
  exports: [TelegramService, BotSettingsService],
})
export class TelegramModule {}
