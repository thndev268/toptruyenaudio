import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GenreStatus } from '../../../common/enums';

export type GenreDocument = Genre & Document;

@Schema({ timestamps: true })
export class Genre {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: String, enum: GenreStatus, default: GenreStatus.ACTIVE })
  status: GenreStatus;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const GenreSchema = SchemaFactory.createForClass(Genre);
