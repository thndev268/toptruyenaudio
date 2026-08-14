import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { UserProfile, UserProfileSchema } from './schemas/user-profile.schema';
import { UserSubscription, UserSubscriptionSchema } from '../subscriptions/schemas/user-subscription.schema';
import { RefreshSession, RefreshSessionSchema } from '../auth/schemas/refresh-session.schema';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [

    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
