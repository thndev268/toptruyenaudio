import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentPackage, PaymentPackageSchema } from './schemas/payment-package.schema';
import { PaymentOrder, PaymentOrderSchema } from './schemas/payment-order.schema';
import { WebhookEvent, WebhookEventSchema } from './schemas/webhook-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentPackage.name, schema: PaymentPackageSchema },
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
      { name: WebhookEvent.name, schema: WebhookEventSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
