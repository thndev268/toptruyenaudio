import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AccountRole, MembershipTier, AccountStatus } from '../../../common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { getters: true, virtuals: true } })
export class User {
  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  emailNormalized: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  username?: string;

  @Prop({ default: null })
  avatarUrl?: string;

  @Prop({ type: String, enum: AccountRole, default: AccountRole.USER, index: true })
  role: AccountRole;

  @Prop({ type: String, enum: AccountStatus, default: AccountStatus.ACTIVE, index: true })
  status: AccountStatus;

  @Prop({ type: String, enum: MembershipTier, default: MembershipTier.FREE, index: true })
  membershipTier: MembershipTier;

  @Prop({ default: null })
  emailVerifiedAt?: Date;

  @Prop({ default: null })
  suspendedAt?: Date;

  @Prop({ default: null })
  suspendedReason?: string;

  @Prop({ default: null })
  lastLoginAt?: Date;

  @Prop({ default: null })
  passwordChangedAt?: Date;

  @Prop({ default: 1 })
  version: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure index for createdAt
UserSchema.index({ createdAt: -1 });

// Partial unique index to enforce SINGLE OWNER_ADMIN constraint
UserSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: AccountRole.OWNER_ADMIN } },
);
