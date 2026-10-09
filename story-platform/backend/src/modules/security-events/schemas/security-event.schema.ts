import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { SecurityEventType, SecurityEventStatus } from '../../../common/enums';

export type SecurityEventDocument = SecurityEvent & Document;

@Schema({ timestamps: true })
export class SecurityEvent {
  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: SecurityEventType, required: true, index: true })
  type: SecurityEventType;

  @Prop({ type: String, enum: SecurityEventStatus, default: SecurityEventStatus.NEW, index: true })
  status: SecurityEventStatus;

  @Prop({ required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Prop({ required: true })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  targetUserId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: null })
  ipAddress?: string;

  @Prop({ default: Date.now, index: true })
  detectedAt: Date;

  @Prop({ default: null })
  investigatedAt?: Date;

  @Prop({ default: null })
  actionTaken?: string;

  @Prop({ default: null })
  resolvedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  resolvedByAdminId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: null })
  resolutionNote?: string;

  @Prop({ default: null })
  reason?: string;
}

export const SecurityEventSchema = SchemaFactory.createForClass(SecurityEvent);
