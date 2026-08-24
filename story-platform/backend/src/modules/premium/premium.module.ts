import { Module } from '@nestjs/common';
import { PremiumController } from './premium.controller';
import { PremiumService } from './premium.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [PremiumController],
  providers: [PremiumService],
  exports: [PremiumService],
})
export class PremiumModule {}