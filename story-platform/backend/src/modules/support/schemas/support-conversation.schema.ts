import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SupportConversationDocument = SupportConversation & Document;

export type SupportCategory = 'ACCOUNT' | 'PREMIUM' | 'AUDIO' | 'CONTENT' | 'TECHNICAL' | 'OTHER';
export type SupportStatus = 'OPEN' | 'WAITING_FOR_ADMIN' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
export type SupportPriority = 'NORMAL' | 'HIGH';

@Schema({ timestamps: true })
export class SupportConversation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  userName: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  subject: string;

  @Prop({ required: true, enum: ['ACCOUNT', 'PREMIUM', 'AUDIO', 'CONTENT', 'TECHNICAL', 'OTHER'], default: 'OTHER' })
  category: SupportCategory;

  @Prop({ required: true, enum: ['OPEN', 'WAITING_FOR_ADMIN', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true })
  status: SupportStatus;

  @Prop({ required: true, enum: ['NORMAL', 'HIGH'], default: 'NORMAL' })
  priority: SupportPriority;

  @Prop({ required: true, default: Date.now, index: true })
  lastMessageAt: Date;

  @Prop({ required: true, default: 0 })
  userUnreadCount: number;

  @Prop({ required: true, default: 1 })
  adminUnreadCount: number;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop({ default: 1 })
  version: number;
}

export const SupportConversationSchema = SchemaFactory.createForClass(SupportConversation);
SupportConversationSchema.index({ userId: 1, lastMessageAt: -1 });
SupportConversationSchema.index({ status: 1, lastMessageAt: -1 });
