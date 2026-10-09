import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OwnerType, RightsType, ReviewStatus } from '../../../common/enums';

export type ContentRightsDocument = ContentRights & Document;

@Schema({ timestamps: true })
export class ContentRights {
  @Prop({ type: String, enum: OwnerType, required: true })
  ownerType: OwnerType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: String, enum: RightsType, required: true })
  rightsType: RightsType;

  @Prop({ default: true })
  commercialUse: boolean;

  @Prop({ default: false })
  modificationAllowed: boolean;

  @Prop({ default: null })
  sourceUrl?: string;

  @Prop({ type: [String], default: [] })
  evidenceFileUrls: string[];

  @Prop({ default: null })
  licenseName?: string;

  @Prop({ default: null })
  validFrom?: Date;

  @Prop({ default: null })
  validUntil?: Date;

  @Prop({ type: String, enum: ReviewStatus, default: ReviewStatus.PENDING })
  reviewStatus: ReviewStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy?: Types.ObjectId;

  @Prop({ default: null })
  reviewedAt?: Date;

  @Prop({ default: null })
  reviewNote?: string;
}

export const ContentRightsSchema = SchemaFactory.createForClass(ContentRights);
