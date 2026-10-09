import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { SubscriptionPlanId } from '../../../common/enums';

export type PremiumGrantLedgerDocument = PremiumGrantLedger & Document;

@Schema({ timestamps: true })
export class PremiumGrantLedger {
  @Prop({ required: true, unique: true, index: true })
  idempotencyKey: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['GRANT', 'REVOKE', 'EXTEND'] })
  action: 'GRANT' | 'REVOKE' | 'EXTEND';

  @Prop({ type: String, enum: SubscriptionPlanId, default: null })
  planId?: SubscriptionPlanId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  grantedByAdminId: MongooseSchema.Types.ObjectId;

  @Prop({ default: 0 })
  durationDays: number;

  @Prop({ default: null })
  previousExpiresAt?: Date;

  @Prop({ default: null })
  newExpiresAt?: Date;

  @Prop({ required: true })
  reason: string;
}

export const PremiumGrantLedgerSchema = SchemaFactory.createForClass(PremiumGrantLedger);
