import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus } from '../../../common/enums';

export type PaymentOrderDocument = PaymentOrder & Document;

@Schema({ timestamps: true })
export class PaymentOrder {
  @Prop({ required: true, unique: true, index: true })
  orderCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PaymentPackage', required: true })
  packageId: Types.ObjectId;

  @Prop({ required: true })
  expectedAmountVnd: number;

  @Prop({ required: true })
  creditAmount: number;

  @Prop({ required: true })
  provider: string;

  @Prop({ default: null })
  providerTxnId?: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true, unique: true, index: true })
  idempotencyKey: string;

  @Prop({ default: null })
  paidAt?: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);
