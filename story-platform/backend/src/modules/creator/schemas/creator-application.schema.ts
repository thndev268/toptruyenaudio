import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApplicationStatus } from '../../../common/enums';

export type CreatorApplicationDocument = CreatorApplication & Document;

@Schema({ timestamps: true })
export class CreatorApplication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ApplicationStatus, default: ApplicationStatus.SUBMITTED })
  status: ApplicationStatus;

  @Prop({ required: true })
  legalName: string;

  @Prop({ required: true })
  penName: string;

  @Prop({ required: true })
  introduction: string;

  @Prop({ required: true })
  contentPlan: string;

  @Prop({ type: [String], default: [] })
  portfolioUrls: string[];

  @Prop({ default: true })
  rightsCommitment: boolean;

  @Prop({ default: Date.now })
  submittedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewerId?: Types.ObjectId;

  @Prop({ default: null })
  decisionReason?: string;

  @Prop({ default: null })
  decidedAt?: Date;
}

export const CreatorApplicationSchema = SchemaFactory.createForClass(CreatorApplication);
