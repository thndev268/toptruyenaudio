import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SupportMessageDocument = SupportMessage & Document;

@Schema({ timestamps: true })
export class SupportMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SupportConversation', required: true, index: true })
  conversationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  @Prop({ required: true, enum: ['USER', 'OWNER_ADMIN'] })
  senderRole: 'USER' | 'OWNER_ADMIN';

  @Prop({ required: true, trim: true })
  senderName: string;

  @Prop({ index: true, sparse: true })
  clientMessageId?: string;

  @Prop({ required: true, trim: true, maxlength: 4000 })
  content: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop()
  editedAt?: Date;

  @Prop()
  hiddenAt?: Date;
}

export const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);
SupportMessageSchema.index({ conversationId: 1, createdAt: 1 });
