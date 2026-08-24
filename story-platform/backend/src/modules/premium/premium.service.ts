import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

// PayOS types
interface PayOSPaymentRequest {
  orderCode: number;
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
}

interface PayOSPaymentResponse {
  orderCode: number;
  amount: number;
  description: string;
  qrCode: string;
  checkoutUrl: string;
  status: string;
}

interface PayOSPaymentStatus {
  orderCode: number;
  amount: number;
  status: string; // PENDING, PAID, CANCELLED, EXPIRED
  transactionCode?: string;
}

@Injectable()
export class PremiumService {
  private readonly payOSBaseUrl = 'https://pay-8dip.onrender.com';
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Lấy danh sách các gói Premium đang active
   * Frontend chỉ nhận danh sách này để hiển thị, không được tự quyết định giá
   */
  async getActivePlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        durationDays: true,
        benefits: true,
      },
      orderBy: { price: 'asc' },
    });

    return {
      success: true,
      data: plans,
      message: 'Đã lấy danh sách gói Premium thành công',
    };
  }

  /**
   * Tạo payment request mới
   * Frontend chỉ gửi packageId, backend tự xác định giá và thời hạn từ database
   */
  async createPayment(userId: string, packageId: string, requestId?: string) {
    // 1. Xác thực user
    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    // 2. Tìm SubscriptionPlan từ database
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: packageId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'Gói Premium không tồn tại hoặc đã bị vô hiệu hóa.' });
    }

    // 3. Tạo orderCode duy nhất
    const orderCode = this.generateOrderCode();

    // 4. Tạo Payment record với status PENDING
    const payment = await this.prisma.payment.create({
      data: {
        orderCode: orderCode.toString(),
        userId,
        packageId: plan.id,
        planName: plan.name,
        amount: plan.price,
        durationDays: plan.durationDays,
        description: `Mua gói ${plan.name}`,
        status: 'PENDING',
      },
    });

    // 5. Gọi PayOS API để tạo payment
    try {
      const payOSRequest: PayOSPaymentRequest = {
        orderCode: parseInt(orderCode),
        amount: Math.round(plan.price),
        description: `Mua gói ${plan.name} - ${plan.durationDays} ngày`,
        cancelUrl: `${process.env.FRONTEND_URL}/premium/cancel`,
        returnUrl: `${process.env.FRONTEND_URL}/premium/success`,
      };

      const payOSResponse = await this.callPayOSAPI('/payment-requests', payOSRequest);

      // 6. Cập nhật Payment với thông tin từ PayOS
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          checkoutUrl: payOSResponse.checkoutUrl,
          qrCode: payOSResponse.qrCode,
        },
      });

      // 7. Ghi audit log
      await this.auditLogsService.log({
        performedByAdminId: userId,
        action: 'PAYMENT_CREATED',
        resource: 'Payment',
        resourceId: payment.id,
        entityName: payment.orderCode,
        reason: `Tạo payment cho gói ${plan.name}`,
        requestId,
      });

      return {
        success: true,
        data: {
          orderCode: updatedPayment.orderCode,
          planName: updatedPayment.planName,
          amount: updatedPayment.amount,
          durationDays: updatedPayment.durationDays,
          qrCode: updatedPayment.qrCode,
          checkoutUrl: updatedPayment.checkoutUrl,
          status: updatedPayment.status,
        },
        message: 'Đã tạo yêu cầu thanh toán thành công',
      };
    } catch (error) {
      // Rollback payment nếu gọi PayOS thất bại
      await this.prisma.payment.delete({
        where: { id: payment.id },
      });
      throw new BadRequestException({ code: 'PAYOS_ERROR', message: 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.' });
    }
  }

  /**
   * Kiểm tra trạng thái payment
   * Backend kiểm tra trạng thái thật từ PayOS và xử lý business logic
   */
  async checkPaymentStatus(userId: string, orderCode: string, requestId?: string) {
    // 1. Tìm payment thuộc user
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderCode,
        userId,
      },
      include: {
        plan: true,
      },
    });

    if (!payment) {
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Không tìm thấy payment.' });
    }

    // 2. Nếu đã PAID, trả về trạng thái hiện tại (không xử lý lại)
    if (payment.status === 'PAID') {
      return {
        success: true,
        data: {
          orderCode: payment.orderCode,
          status: payment.status,
          planName: payment.planName,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
        message: 'Thanh toán đã hoàn tất',
      };
    }

    // 3. Kiểm tra trạng thái thật từ PayOS
    try {
      const payOSStatus = await this.getPayOSPaymentStatus(parseInt(orderCode));

      // 4. Nếu PayOS trả về PAID, xử lý business logic trong transaction
      if (payOSStatus.status === 'PAID') {
        await this.processSuccessfulPayment(payment, userId, requestId);
      } else if (payOSStatus.status === 'CANCELLED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });
      } else if (payOSStatus.status === 'EXPIRED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'EXPIRED',
          },
        });
      }

      // 5. Trả về trạng thái hiện tại
      const updatedPayment = await this.prisma.payment.findUnique({
        where: { id: payment.id },
      });

      return {
        success: true,
        data: {
          orderCode: updatedPayment.orderCode,
          status: updatedPayment.status,
          planName: updatedPayment.planName,
          amount: updatedPayment.amount,
          paidAt: updatedPayment.paidAt,
        },
        message: `Trạng thái thanh toán: ${updatedPayment.status}`,
      };
    } catch (error) {
      throw new BadRequestException({ code: 'PAYOS_CHECK_ERROR', message: 'Không thể kiểm tra trạng thái thanh toán.' });
    }
  }

  /**
   * Hủy payment
   */
  async cancelPayment(userId: string, orderCode: string, requestId?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderCode,
        userId,
        status: 'PENDING',
      },
    });

    if (!payment) {
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Không tìm thấy payment đang chờ thanh toán.' });
    }

    try {
      // Gọi PayOS để hủy
      await this.callPayOSAPI(`/payment-requests/${parseInt(orderCode)}/cancel`, {}, 'PATCH');

      // Cập nhật status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      await this.auditLogsService.log({
        performedByAdminId: userId,
        action: 'PAYMENT_CANCELLED',
        resource: 'Payment',
        resourceId: payment.id,
        entityName: payment.orderCode,
        reason: 'User hủy thanh toán',
        requestId,
      });

      return {
        success: true,
        message: 'Đã hủy thanh toán thành công',
      };
    } catch (error) {
      throw new BadRequestException({ code: 'CANCEL_ERROR', message: 'Không thể hủy thanh toán.' });
    }
  }

  /**
   * Xử lý khi thanh toán thành công - ATOMIC TRANSACTION
   * Đây là logic quan trọng nhất - chỉ được chạy 1 lần cho mỗi orderCode
   */
  private async processSuccessfulPayment(payment: any, userId: string, requestId?: string) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Kiểm tra lại status trong transaction để tránh race condition
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
      });

      if (!currentPayment) {
        throw new ConflictException({ code: 'PAYMENT_NOT_FOUND', message: 'Payment không tồn tại.' });
      }

      // 2. Nếu đã PAID, không xử lý lại (chống gia hạn 2 lần)
      if (currentPayment.status === 'PAID') {
        return;
      }

      // 3. Update Payment status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // 4. Update hoặc tạo UserSubscription
      const now = new Date();
      const existingSubscription = await tx.userSubscription.findFirst({
        where: { profileId: userId },
      });

      if (existingSubscription) {
        // User đã có subscription - gia hạn
        let newEndAt = now;
        newEndAt.setDate(newEndAt.getDate() + payment.durationDays);

        // Nếu còn thời gian, cộng thêm vào thời gian hiện tại
        if (existingSubscription.endAt && existingSubscription.endAt > now) {
          const remainingDays = Math.floor((existingSubscription.endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          newEndAt.setDate(newEndAt.getDate() + remainingDays);
        }

        await tx.userSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: payment.packageId,
            status: 'ACTIVE',
            startAt: existingSubscription.startAt || now,
            endAt: newEndAt,
          },
        });
      } else {
        // User chưa có subscription - tạo mới
        const newEndAt = new Date();
        newEndAt.setDate(newEndAt.getDate() + payment.durationDays);

        await tx.userSubscription.create({
          data: {
            profileId: userId,
            planId: payment.packageId,
            status: 'ACTIVE',
            startAt: now,
            endAt: newEndAt,
          },
        });
      }

      // 5. Tạo PaymentHistory
      await tx.paymentHistory.create({
        data: {
          userId,
          paymentId: payment.id,
          orderCode: payment.orderCode,
          type: 'PREMIUM_PURCHASE',
          amount: payment.amount,
          packageId: payment.packageId,
          status: 'PAID',
        },
      });

      // 6. Cập nhật Profile membershipTier
      await tx.profile.update({
        where: { id: userId },
        data: {
          membershipTier: 'PREMIUM',
          premiumExpiresAt: existingSubscription?.endAt && existingSubscription.endAt > now 
            ? (() => {
                const newEnd = new Date(existingSubscription.endAt);
                newEnd.setDate(newEnd.getDate() + payment.durationDays);
                return newEnd;
              })()
            : (() => {
                const newEnd = new Date();
                newEnd.setDate(newEnd.getDate() + payment.durationDays);
                return newEnd;
              })(),
        },
      });
    });

    // 7. Ghi audit log (sau transaction thành công)
    await this.auditLogsService.log({
      performedByAdminId: userId,
      action: 'PAYMENT_SUCCESS',
      resource: 'Payment',
      resourceId: payment.id,
      entityName: payment.orderCode,
      reason: `Thanh toán thành công gói ${payment.planName}`,
      requestId,
    });
  }

  /**
   * Lấy lịch sử giao dịch của user
   */
  async getUserPaymentHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      this.prisma.paymentHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentHistory.count({ where: { userId } }),
    ]);

    return {
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy subscription hiện tại của user
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return {
        success: true,
        data: null,
        message: 'Người dùng chưa có gói Premium',
      };
    }

    // Kiểm tra xem subscription có còn hiệu lực không
    const now = new Date();
    const isActive = subscription.status === 'ACTIVE' && subscription.endAt && subscription.endAt > now;

    return {
      success: true,
      data: {
        ...subscription,
        isActive,
        daysRemaining: subscription.endAt 
          ? Math.max(0, Math.floor((subscription.endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
      },
    };
  }

  // Helper methods

  private generateOrderCode(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${timestamp}${random}`;
  }

  private async callPayOSAPI(endpoint: string, data: any, method = 'POST'): Promise<any> {
    const url = `${this.payOSBaseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-client-id': process.env.PAYOS_CLIENT_ID,
      'x-api-key': process.env.PAYOS_API_KEY,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`PayOS API error: ${response.status}`);
    }

    return response.json();
  }

  private async getPayOSPaymentStatus(orderCode: number): Promise<PayOSPaymentStatus> {
    return this.callPayOSAPI(`/payment-requests/${orderCode}`, {}, 'GET');
  }
}