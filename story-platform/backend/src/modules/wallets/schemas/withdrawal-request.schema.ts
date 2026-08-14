import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WithdrawalStatus } from '../../../common/enums';

export type WithdrawalRequestDocument = WithdrawalRequest & Document;

@Schema({ timestamps: true })
export class WithdrawalRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId: Types.ObjectId;

  @Prop({ required: true })
  amountVnd: number;

  @Prop({ type: Object, required: true })
  bankAccountInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };

  @Prop({ type: String, enum: WithdrawalStatus, default: WithdrawalStatus.REQUESTED })
  status: WithdrawalStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  processedBy?: Types.ObjectId;

  @Prop({ default: null })
  processedAt?: Date;

  @Prop({ default: null })
  rejectionReason?: string;
}

export const WithdrawalRequestSchema = SchemaFactory.createForClass(WithdrawalRequest);
