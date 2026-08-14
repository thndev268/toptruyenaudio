import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AffiliateEventType } from '../../../common/enums';

export type AffiliateEventDocument = AffiliateEvent & Document;

@Schema({ timestamps: true })
export class AffiliateEvent {
  @Prop({ required: true, index: true })
  referralCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  partnerId: Types.ObjectId;

  @Prop({ required: true })
  visitorId: string;

  @Prop({ type: String, enum: AffiliateEventType, required: true })
  type: AffiliateEventType;

  @Prop({ type: Types.ObjectId, ref: 'PaymentOrder', default: null })
  orderId?: Types.ObjectId;
}

export const AffiliateEventSchema = SchemaFactory.createForClass(AffiliateEvent);
