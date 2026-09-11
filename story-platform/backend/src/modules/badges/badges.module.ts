import { Module } from '@nestjs/common';
import { BadgeAwardingService } from './badge-awarding.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BadgeAwardingService, PrismaService],
  exports: [BadgeAwardingService],
})
export class BadgesModule {}
