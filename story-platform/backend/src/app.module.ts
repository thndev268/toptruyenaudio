import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';

import { CommonModule } from './common/common.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PremiumModule } from './modules/premium/premium.module';
import { AdminModule } from './modules/admin/admin.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { SecurityEventsModule } from './modules/security-events/security-events.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SupportModule } from './modules/support/support.module';
import { StoriesModule } from './modules/stories/stories.module';
import { ListeningModule } from './modules/listening/listening.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BannersModule } from './modules/banners/banners.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './modules/storage/storage.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { ChatModule } from './modules/chat/chat.module';
import { BadgesModule } from './modules/badges/badges.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'standard',
          ttl: config.get('rateLimit.global.ttl') || 60000,
          limit: config.get('rateLimit.global.limit') || 500,
        },
        {
          name: 'auth',
          ttl: config.get('rateLimit.auth.ttl') || 60000,
          limit: config.get('rateLimit.auth.limit') || 200,
        },
        {
          name: 'support',
          ttl: config.get('rateLimit.support.ttl') || 60000,
          limit: config.get('rateLimit.support.limit') || 50,
        },
      ],
    }),
    CommonModule,
    IdempotencyModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    PremiumModule,
    AdminModule,
    FeatureFlagsModule,
    SecurityEventsModule,
    AuditLogsModule,
    SupportModule,
    StoriesModule,
    ListeningModule,
    CommentsModule,
    NotificationsModule,
    BannersModule,
    PrismaModule,
    StorageModule,
    TelegramModule,
    ChatModule,
    BadgesModule,
  ],
  providers: [
    // Tắt rate limiting trong development
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
