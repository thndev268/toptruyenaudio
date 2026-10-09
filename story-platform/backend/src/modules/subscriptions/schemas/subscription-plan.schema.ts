import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SubscriptionPlanId } from '../../../common/enums';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({ timestamps: true })
export class SubscriptionPlan {
  @Prop({ required: true, unique: true, type: String, enum: SubscriptionPlanId })
  id: SubscriptionPlanId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  durationDays: number;

  @Prop({ required: true, min: 0 })
  priceVnd: number;

  @Prop({ default: null })
  originalPriceVnd?: number;

  @Prop({ default: null })
  savingsVnd?: number;

  @Prop({ default: false })
  isRecommended?: boolean;

  @Prop({ default: false })
  isBestDeal?: boolean;

  @Prop({ type: [String], default: [] })
  benefits: string[];
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
