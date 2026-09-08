import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { BotSettingsService } from './bot-settings.service';
import { BotKnowledgeService } from './bot-knowledge.service';
import { KnowledgeDocumentService } from './knowledge-document.service';
import { AiService } from './ai.service';
import { SupportModule } from '../support/support.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SupportModule), ChatModule, StorageModule],
  controllers: [TelegramController],
  providers: [TelegramService, BotSettingsService, BotKnowledgeService, KnowledgeDocumentService, AiService],
  exports: [TelegramService, BotSettingsService, BotKnowledgeService, KnowledgeDocumentService, AiService],
})
export class TelegramModule {}
