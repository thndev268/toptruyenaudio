import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { LedgerEntryType } from '../../../common/enums';

export type LedgerEntryDocument = LedgerEntry & Document;

@Schema({ timestamps: true })
export class LedgerEntry {
  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true, index: true })
  walletId: Types.ObjectId;

  @Prop({ type: String, enum: LedgerEntryType, required: true })
  entryType: LedgerEntryType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  referenceType: string;

  @Prop({ required: true })
  referenceId: string;

  @Prop({ required: true, unique: true, index: true })
  idempotencyKey: string;

  @Prop({ required: true })
  description: string;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
