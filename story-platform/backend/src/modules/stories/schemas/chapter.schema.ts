import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PublishStatus } from '../../../common/enums';

export type ChapterDocument = Chapter & Document;

@Schema({ timestamps: true })
export class Chapter {
  @Prop({ type: Types.ObjectId, ref: 'Story', required: true, index: true })
  storyId: Types.ObjectId;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ default: null })
  contentText?: string;

  @Prop({ default: null })
  audioUrl?: string;

  @Prop({ type: Object, default: { provider: null, externalId: null } })
  video: {
    provider?: string;
    externalId?: string;
  };

  @Prop({ default: null })
  durationSeconds?: number;

  @Prop({ default: true })
  isFree: boolean;

  @Prop({ default: 0 })
  priceVnd: number;

  @Prop({ type: String, enum: PublishStatus, default: PublishStatus.DRAFT })
  publishStatus: PublishStatus;

  @Prop({ default: null })
  publishedAt?: Date;

  @Prop({ default: 0 })
  listenCount: number;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
ChapterSchema.index({ storyId: 1, number: 1 }, { unique: true });
