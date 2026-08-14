import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StoryStatus, PublishStatus, AgeRating, ContentType } from '../../../common/enums';

export type StoryDocument = Story & Document;

@Schema({ timestamps: true })
export class Story {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ required: true })
  summary: string;

  @Prop({ default: null })
  coverUrl?: string;

  @Prop({ required: true })
  authorName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  authorId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Genre' }] })
  genreIds: Types.ObjectId[];

  @Prop({ type: [String], enum: ContentType, default: [ContentType.TEXT] })
  contentTypes: ContentType[];

  @Prop({ type: String, enum: StoryStatus, default: StoryStatus.ONGOING })
  storyStatus: StoryStatus;

  @Prop({ type: String, enum: PublishStatus, default: PublishStatus.DRAFT })
  publishStatus: PublishStatus;

  @Prop({ type: String, enum: AgeRating, default: AgeRating.ALL })
  ageRating: AgeRating;

  @Prop({ type: Types.ObjectId, ref: 'ContentRights', default: null })
  rightsId?: Types.ObjectId;

  @Prop({ default: null })
  publishedAt?: Date;

  @Prop({ type: Object, default: { chapterCount: 0, viewCount: 0, favoriteCount: 0, listenCount: 0 } })
  stats: {
    chapterCount: number;
    viewCount: number;
    favoriteCount: number;
    listenCount: number;
  };
}

export const StorySchema = SchemaFactory.createForClass(Story);
