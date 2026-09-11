import { Module } from '@nestjs/common';
import { SystemStatusService } from './system-status.service';
import { SystemStatusController } from './system-status.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, StorageModule, TelegramModule],
  controllers: [SystemStatusController],
  providers: [SystemStatusService],
  exports: [SystemStatusService],
})
export class SystemStatusModule {}
