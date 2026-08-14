import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  actorId?: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  targetCollection: string;

  @Prop({ required: true })
  targetId: string;

  @Prop({ type: Object, default: {} })
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };

  @Prop({ default: null })
  ipAddress?: string;

  @Prop({ default: null })
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
