import { Injectable, NotFoundException, BadRequestException, ConflictException, HttpException } from '@nestjs/common';
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
  error: number;
  message: string;
  data: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    expiredAt: string | null;
    checkoutUrl: string;
    qrCode: string;
  };
  timestamp: string;
}

interface PayOSPaymentStatus {
  error: number;
  message: string;
  data: {
    orderCode: number;
    amount: number;
    status: string; // PENDING, PAID, CANCELLED, EXPIRED
    transactionCode?: string;
  };
  timestamp: string;
}

@Injectable()
export class PremiumService {
  private readonly payOSBaseUrl = 'https://pay-8dip.onrender.com';
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Get JWT token from database (configured by admin)
   * Admin manually logs into PayOS, gets token, and pastes it in admin panel
   */
  private async getPayOSToken(): Promise<string> {
    // Get the active PayOS config from database
    const config = await this.prisma.payOSConfig.findFirst({
      where: { isActive: true },
    });

    if (!config || !config.gatewayToken) {
      throw new BadRequestException({ 
        code: 'PAYOS_TOKEN_NOT_CONFIGURED', 
        message: 'PayOS Gateway Token chưa được cấu hình. Admin cần đăng nhập vào PayOS và dán token vào phần cấu hình thanh toán.' 
      });
    }

    if (config.tokenStatus !== 'ACTIVE' || !config.isValid) {
      throw new BadRequestException({ 
        code: 'PAYOS_TOKEN_INVALID', 
        message: 'PayOS Gateway Token không hợp lệ hoặc đã hết hạn. Admin cần cập nhật token mới.' 
      });
    }

    return config.gatewayToken;
  }

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
  async createPayment(userId: string, packageCode: string, requestId?: string) {
    // 1. Xác thực user
    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    // 2. Tìm SubscriptionPlan từ database bằng code
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: packageCode },
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

      const payOSResponse = await this.callPayOSAPI('/api/v1/payment/create', payOSRequest);

      // 6. Cập nhật Payment với thông tin từ PayOS
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          checkoutUrl: payOSResponse.data.checkoutUrl,
          qrCode: payOSResponse.data.qrCode,
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
          qrCode: payOSResponse.data.qrCode,
          checkoutUrl: payOSResponse.data.checkoutUrl,
          status: payOSResponse.data.status,
        },
        message: 'Đã tạo yêu cầu thanh toán thành công',
      };
    } catch (error) {
      // Rollback payment nếu gọi PayOS thất bại
      await this.prisma.payment.delete({
        where: { id: payment.id },
      });
      
      // Check if it's a specific PayOS error
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error; // Re-throw specific errors
      }
      
      console.error('PayOS API call failed:', error);
      throw new BadRequestException({ 
        code: 'PAYOS_ERROR', 
        message: 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      if (payOSStatus.data.status === 'PAID') {
        await this.processSuccessfulPayment(payment, userId, requestId);
      } else if (payOSStatus.data.status === 'CANCELLED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });
      } else if (payOSStatus.data.status === 'EXPIRED') {
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

      if (!updatedPayment) {
        throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Không tìm thấy thanh toán.' });
      }

      return {
        success: true,
        data: {
          orderCode: updatedPayment.orderCode,
          status: payOSStatus.data.status,
          planName: updatedPayment.planName,
          amount: updatedPayment.amount,
          paidAt: updatedPayment.paidAt,
        },
        message: `Trạng thái thanh toán: ${payOSStatus.data.status}`,
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
      await this.callPayOSAPI(`/api/v1/payment/${parseInt(orderCode)}/cancel`, {}, 'PATCH');

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
    const subscription = await this.prisma.userSubscription.findFirst({
      where: { profileId: userId },
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
    // Get JWT token (cached server-side)
    const token = await this.getPayOSToken();

    const url = `${this.payOSBaseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`PayOS API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Check if PayOS response has error field
    if (result.error !== 0 && result.error !== undefined) {
      throw new Error(`PayOS API error: ${result.message || 'Unknown error'}`);
    }
    
    return result;
  }

  private async getPayOSPaymentStatus(orderCode: number): Promise<PayOSPaymentStatus> {
    return this.callPayOSAPI(`/api/v1/payment/${orderCode}/status`, {}, 'GET');
  }

  /**
   * Kiểm tra trạng thái cổng thanh toán PayOS
   * Dùng cho admin dashboard để kiểm tra xem token có cấu hình và gateway có reachable không
   */
  async getGatewayStatus() {
    const config = await this.prisma.payOSConfig.findFirst({
      where: { isActive: true },
    });

    const configured = !!(config && config.gatewayToken);
    let reachable = false;
    let tokenStatus = 'NOT_CONFIGURED';
    let lastCheckedAt: string | null = null;

    if (configured && config && config.gatewayToken) {
      tokenStatus = config.tokenStatus;
      lastCheckedAt = config.lastValidatedAt?.toISOString() || null;
      
      if (config.tokenStatus === 'ACTIVE' && config.isValid) {
        try {
          // Test token by making a simple call to gateway
          await this.testGatewayToken(config.gatewayToken);
          reachable = true;
        } catch (error) {
          reachable = false;
          // Update status if token is invalid
          await this.prisma.payOSConfig.update({
            where: { id: config.id },
            data: { isValid: false, tokenStatus: 'INVALID' },
          });
        }
      }
    }

    return {
      success: true,
      data: {
        configured,
        reachable,
        tokenStatus,
        lastCheckedAt,
      },
    };
  }

  /**
   * Admin lưu Gateway Token vào database
   */
  async saveGatewayToken(token: string, adminId: string) {
    // Delete existing config if any
    await this.prisma.payOSConfig.deleteMany();

    // Test token validity before saving
    const isValid = await this.testGatewayToken(token);

    // Create new config
    const config = await this.prisma.payOSConfig.create({
      data: {
        clientId: 'MANUAL_CONFIG', // Placeholder since we're using token directly
        clientSecret: 'MANUAL_CONFIG', // Placeholder
        gatewayToken: token,
        tokenStatus: isValid ? 'ACTIVE' : 'INVALID',
        isValid: isValid,
        lastValidatedAt: new Date(),
        lastValidatedBy: adminId,
        isActive: true,
      },
    });

    // Log audit
    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'PAYOS_TOKEN_CONFIGURED',
      resource: 'PayOSConfig',
      resourceId: config.id,
      entityName: 'PayOS Gateway Token',
      reason: isValid ? 'Token hợp lệ đã được cấu hình' : 'Token không hợp lệ nhưng đã được lưu',
    });

    return {
      success: true,
      data: {
        id: config.id,
        tokenStatus: config.tokenStatus,
        isValid: config.isValid,
        lastValidatedAt: config.lastValidatedAt?.toISOString() || null,
      },
      message: isValid ? 'Đã lưu Gateway Token thành công' : 'Đã lưu token nhưng token không hợp lệ',
    };
  }

  /**
   * Test validity of a gateway token
   */
  private async testGatewayToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.payOSBaseUrl}/api/v1/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderCode: 999999999999, // Test order code
          amount: 1,
          description: 'TEST_TOKEN_VALIDITY',
          cancelUrl: 'https://test.com/cancel',
          returnUrl: 'https://test.com/success',
        }),
      });

      // If we get 401, token is invalid/expired
      if (response.status === 401) {
        return false;
      }

      // Other errors might still mean token is valid (e.g., validation errors)
      return true;
    } catch (error) {
      console.error('Error testing gateway token:', error);
      return false;
    }
  }

  /**
   * Admin test current gateway token
   */
  async testCurrentGatewayToken(adminId: string) {
    const config = await this.prisma.payOSConfig.findFirst({
      where: { isActive: true },
    });

    if (!config || !config.gatewayToken) {
      throw new BadRequestException({ 
        code: 'PAYOS_TOKEN_NOT_CONFIGURED', 
        message: 'Chưa cấu hình Gateway Token' 
      });
    }

    const isValid = await this.testGatewayToken(config.gatewayToken);

    // Update config status
    await this.prisma.payOSConfig.update({
      where: { id: config.id },
      data: {
        isValid: isValid,
        tokenStatus: isValid ? 'ACTIVE' : 'INVALID',
        lastValidatedAt: new Date(),
        lastValidatedBy: adminId,
      },
    });

    // Log audit
    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'PAYOS_TOKEN_TESTED',
      resource: 'PayOSConfig',
      resourceId: config.id,
      entityName: 'PayOS Gateway Token',
      reason: isValid ? 'Token hợp lệ' : 'Token không hợp lệ',
    });

    return {
      success: true,
      data: {
        isValid,
        tokenStatus: isValid ? 'ACTIVE' : 'INVALID',
        lastValidatedAt: new Date().toISOString(),
      },
      message: isValid ? 'Gateway Token hợp lệ' : 'Gateway Token không hợp lệ hoặc đã hết hạn',
    };
  }
}