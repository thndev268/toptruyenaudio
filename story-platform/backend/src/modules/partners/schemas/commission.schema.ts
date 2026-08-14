import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CommissionStatus } from '../../../common/enums';

export type CommissionDocument = Commission & Document;

@Schema({ timestamps: true })
export class Commission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  partnerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PaymentOrder', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  baseAmountVnd: number;

  @Prop({ required: true })
  rateBps: number;

  @Prop({ required: true })
  amountVnd: number;

  @Prop({ type: String, enum: CommissionStatus, default: CommissionStatus.PENDING })
  status: CommissionStatus;

  @Prop({ default: null })
  availableAt?: Date;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);
