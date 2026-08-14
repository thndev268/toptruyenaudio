import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';

import { CommonModule } from './common/common.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { SecurityEventsModule } from './modules/security-events/security-events.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SupportModule } from './modules/support/support.module';
import { StoriesModule } from './modules/stories/stories.module';
import { ListeningModule } from './modules/listening/listening.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('mongodbUri') || 'mongodb://127.0.0.1:27017/toptruyen',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'standard',
          ttl: config.get('rateLimit.global.ttl') || 60000,
          limit: config.get('rateLimit.global.limit') || 100,
        },
        {
          name: 'auth',
          ttl: config.get('rateLimit.auth.ttl') || 60000,
          limit: config.get('rateLimit.auth.limit') || 10,
        },
        {
          name: 'support',
          ttl: config.get('rateLimit.support.ttl') || 60000,
          limit: config.get('rateLimit.support.limit') || 20,
        },
      ],
    }),
    CommonModule,
    IdempotencyModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    AdminModule,
    FeatureFlagsModule,
    SecurityEventsModule,
    AuditLogsModule,
    SupportModule,
    StoriesModule,
    ListeningModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
