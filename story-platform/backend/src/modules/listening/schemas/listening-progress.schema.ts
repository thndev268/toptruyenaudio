import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ListeningProgressDocument = ListeningProgress & Document;

@Schema({ timestamps: true, collection: 'listening_progresses' })
export class ListeningProgress {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true, ref: 'Story' })
  storyId: string;

  @Prop({ type: String, required: true, ref: 'Chapter' })
  chapterId: string;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  positionSeconds: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  durationSeconds: number;

  @Prop({ type: Number, required: true, default: 0, min: 0, max: 100 })
  progressPercent: number;

  @Prop({ type: Boolean, required: true, default: false })
  completed: boolean;

  @Prop({ type: String, required: true, enum: ['AUDIO', 'VIDEO'], default: 'AUDIO' })
  playbackMode: string;

  @Prop({ type: Number, required: true, default: 1.0 })
  playbackRate: number;

  @Prop({ type: Date, required: true, default: Date.now })
  lastPlayedAt: Date;

  @Prop({ type: Number, required: true, default: 1 })
  version: number;
}

export const ListeningProgressSchema = SchemaFactory.createForClass(ListeningProgress);

ListeningProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });
ListeningProgressSchema.index({ userId: 1, storyId: 1, lastPlayedAt: -1 });
