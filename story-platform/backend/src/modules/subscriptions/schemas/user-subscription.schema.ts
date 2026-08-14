import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { MembershipTier, SubscriptionPlanId, SubscriptionStatus, SubscriptionSource } from '../../../common/enums';

export type UserSubscriptionDocument = UserSubscription & Document;

@Schema({ timestamps: true })
export class UserSubscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: MembershipTier, default: MembershipTier.FREE, index: true })
  membershipTier: MembershipTier;

  @Prop({ type: String, enum: SubscriptionPlanId, default: null })
  planId?: SubscriptionPlanId;

  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.NONE, index: true })
  status: SubscriptionStatus;

  @Prop({ type: String, enum: SubscriptionSource, default: SubscriptionSource.ADMIN_GRANT })
  source: SubscriptionSource;

  @Prop({ default: null })
  startedAt?: Date;

  @Prop({ default: null, index: true })
  expiresAt?: Date;

  @Prop({ default: false })
  autoRenew: boolean;

  @Prop({ default: null })
  cancelledAt?: Date;

  @Prop({ default: 1 })
  version: number;
}

export const UserSubscriptionSchema = SchemaFactory.createForClass(UserSubscription);
