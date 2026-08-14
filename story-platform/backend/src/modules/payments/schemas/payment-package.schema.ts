import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentPackageDocument = PaymentPackage & Document;

@Schema({ timestamps: true })
export class PaymentPackage {
  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  priceVnd: number;

  @Prop({ required: true })
  creditAmount: number;

  @Prop({ default: true })
  status: boolean;
}

export const PaymentPackageSchema = SchemaFactory.createForClass(PaymentPackage);
