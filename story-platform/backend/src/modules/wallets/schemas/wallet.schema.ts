import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WalletType, WalletStatus } from '../../../common/enums';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: String, enum: WalletType, required: true })
  type: WalletType;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: 0 })
  frozenBalance: number;

  @Prop({ default: 'VND' })
  currency: string;

  @Prop({ type: String, enum: WalletStatus, default: WalletStatus.ACTIVE })
  status: WalletStatus;

  @Prop({ default: 0 })
  version: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
WalletSchema.index({ ownerId: 1, type: 1 }, { unique: true });
