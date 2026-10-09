import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FeatureFlagDocument = FeatureFlag & Document;

@Schema({ timestamps: true })
export class FeatureFlag {
  @Prop({ required: true, unique: true, index: true, trim: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  descriptionVi: string;

  @Prop({ required: true, default: 'SYSTEM' })
  category: string;

  @Prop({ required: true, default: false })
  isEnabled: boolean;

  @Prop({ default: false })
  isLocked: boolean;

  @Prop({ default: 1 })
  version: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  lastModifiedByAdminId?: MongooseSchema.Types.ObjectId;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
