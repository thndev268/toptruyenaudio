import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RefreshSessionDocument = RefreshSession & Document;

@Schema({ timestamps: true })
export class RefreshSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, index: true })
  familyId: string;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ default: false, index: true })
  isRevoked: boolean;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: null })
  revokedAt?: Date;

  @Prop({ default: null })
  revokedReason?: string;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);

RefreshSessionSchema.index({ userId: 1, isRevoked: 1 });
