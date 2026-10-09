import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getPackages() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true } });
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
