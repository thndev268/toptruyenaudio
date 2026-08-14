import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReportTargetType, ReportStatus } from '../../../common/enums';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ type: String, enum: ReportTargetType, required: true })
  targetType: ReportTargetType;

  @Prop({ required: true })
  targetId: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: '' })
  details: string;

  @Prop({ type: String, enum: ReportStatus, default: ReportStatus.OPEN })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  resolvedBy?: Types.ObjectId;

  @Prop({ default: null })
  resolutionNote?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
