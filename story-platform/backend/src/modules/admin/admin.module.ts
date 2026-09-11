import { Module } from '@nestjs/common';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RefreshSession, RefreshSessionSchema } from '../auth/schemas/refresh-session.schema';
import { UserSubscription, UserSubscriptionSchema } from '../subscriptions/schemas/user-subscription.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { AdminStoriesController } from './admin-stories.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuditLogsModule,
    AuthModule,
    StorageModule,
    SubscriptionsModule,
    NotificationsModule,
  ],
  controllers: [AdminController, AdminStoriesController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
