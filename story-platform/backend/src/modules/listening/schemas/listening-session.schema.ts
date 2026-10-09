import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ListeningSessionStatus } from '../../../common/enums';

export type ListeningSessionDocument = ListeningSession & Document;

@Schema({ timestamps: true })
export class ListeningSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Story', required: true, index: true })
  storyId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chapter', required: true, index: true })
  chapterId: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  lastHeartbeatAt: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ default: 0 })
  validListeningSeconds: number;

  @Prop({ default: 0 })
  audioContentSecondsPlayed: number;

  @Prop({ default: 0 })
  lastPositionSeconds: number;

  @Prop({ default: 1 })
  playbackRate: number;

  @Prop({
    type: String,
    enum: ListeningSessionStatus,
    default: ListeningSessionStatus.ACTIVE,
    index: true,
  })
  status: ListeningSessionStatus;

  @Prop()
  playQualifiedAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const ListeningSessionSchema = SchemaFactory.createForClass(ListeningSession);

// Indexes for performance
ListeningSessionSchema.index({ userId: 1, updatedAt: -1 });
ListeningSessionSchema.index({ storyId: 1, updatedAt: -1 });
ListeningSessionSchema.index({ chapterId: 1, updatedAt: -1 });
ListeningSessionSchema.index({ status: 1, lastHeartbeatAt: 1 });
