import { Module } from '@nestjs/common';
import { SecurityEventsController } from './security-events.controller';
import { SecurityEventsService } from './security-events.service';
import { SecurityDetectionService } from './security-detection.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
  ],
  controllers: [SecurityEventsController],
  providers: [SecurityEventsService, SecurityDetectionService],
  exports: [SecurityEventsService, SecurityDetectionService],
})
export class SecurityEventsModule {}
