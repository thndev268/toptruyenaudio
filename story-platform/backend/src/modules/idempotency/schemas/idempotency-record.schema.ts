import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IdempotencyRecordDocument = IdempotencyRecord & Document;

@Schema({ timestamps: true })
export class IdempotencyRecord {
  @Prop({ required: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true })
  actorId: string;

  @Prop({ required: true, trim: true })
  operation: string;

  @Prop({ required: true, trim: true })
  resourceId: string;

  @Prop({ required: true })
  requestHash: string;

  @Prop({ required: true })
  responseStatus: number;

  @Prop({ type: Object, required: true })
  responseBody: any;

  @Prop({ required: true, expires: 86400 * 7 }) // TTL index 7 days
  expiresAt: Date;
}

export const IdempotencyRecordSchema = SchemaFactory.createForClass(IdempotencyRecord);

// Compound unique index by actorId + operation + key
IdempotencyRecordSchema.index(
  { actorId: 1, operation: 1, key: 1 },
  { unique: true },
);
