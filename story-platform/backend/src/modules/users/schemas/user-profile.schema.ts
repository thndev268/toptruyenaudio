import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProfileDocument = UserProfile & Document;

@Schema({ timestamps: true })
export class UserProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: null })
  dateOfBirth?: Date;

  @Prop({ default: 'VN' })
  countryCode: string;

  @Prop({ type: Object, default: { theme: 'dark', fontSize: 16, readerBg: '#0f172a' } })
  preferences: {
    theme: string;
    fontSize: number;
    readerBg: string;
  };

  @Prop({ type: Object, default: { email: true } })
  notification: {
    email: boolean;
  };
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
