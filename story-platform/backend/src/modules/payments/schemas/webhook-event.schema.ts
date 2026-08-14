import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookEventDocument = WebhookEvent & Document;

@Schema({ timestamps: true })
export class WebhookEvent {
  @Prop({ required: true })
  provider: string;

  @Prop({ required: true, unique: true, index: true })
  providerEventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ default: false })
  signatureValid: boolean;

  @Prop({ required: true })
  payloadHash: string;

  @Prop({ default: null })
  orderCode?: string;

  @Prop({ default: 'RECEIVED' })
  status: string;

  @Prop({ default: 0 })
  attemptCount: number;

  @Prop({ default: null })
  processedAt?: Date;

  @Prop({ default: null })
  errorCode?: string;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
