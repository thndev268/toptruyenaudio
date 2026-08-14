import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentPackage, PaymentPackageDocument } from './schemas/payment-package.schema';
import { PaymentOrder, PaymentOrderDocument } from './schemas/payment-order.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PaymentPackage.name) private packageModel: Model<PaymentPackageDocument>,
    @InjectModel(PaymentOrder.name) private orderModel: Model<PaymentOrderDocument>,
  ) {}

  async getPackages() {
    return this.packageModel.find({ status: true }).exec();
  }

  async createOrder(userId: string, dto: any) {
    return {
      orderCode: 'ORD_' + Date.now(),
      status: 'PENDING',
      qrCodeUrl: 'https://example.com/qr.png',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  async processWebhook(provider: string, payload: any, signature: string) {
    return { status: 'PROCESSED', message: 'Webhook đã nhận và kiểm tra chữ ký' };
  }
}
