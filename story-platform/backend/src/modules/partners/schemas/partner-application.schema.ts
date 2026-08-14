import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PartnerApplicationStatus } from '../../../common/enums';

export type PartnerApplicationDocument = PartnerApplication & Document;

@Schema({ timestamps: true })
export class PartnerApplication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  creatorId: Types.ObjectId;

  @Prop({ type: String, enum: PartnerApplicationStatus, default: PartnerApplicationStatus.SUBMITTED })
  status: PartnerApplicationStatus;

  @Prop({ required: true })
  channelName: string;

  @Prop({ required: true })
  channelUrl: string;

  @Prop({ required: true })
  platform: string;

  @Prop({ type: Object, default: {} })
  metricsSnapshot: Record<string, any>;

  @Prop({ default: 1000 })
  commissionBps: number;

  @Prop({ default: null, unique: true, sparse: true })
  referralCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewerId?: Types.ObjectId;

  @Prop({ default: null })
  decisionReason?: string;

  @Prop({ default: null })
  approvedAt?: Date;
}

export const PartnerApplicationSchema = SchemaFactory.createForClass(PartnerApplication);
