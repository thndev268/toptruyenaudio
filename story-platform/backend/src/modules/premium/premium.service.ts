import { Injectable, NotFoundException, BadRequestException, ConflictException, HttpException } from '@nestjs/common';
import PayOS = require('@payos/node');
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

interface PayOSPaymentLink {
  orderCode: number;
  amount: number;
  description: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

interface GatewayPaymentResponse {
  error: number;
  message: string;
  data: PayOSPaymentLink;
  timestamp: string;
}

interface GatewayPaymentStatus {
  error: number;
  message: string;
  data: {
    orderCode: number;
    amount?: number;
    status: string;
    transactionCode?: string;
  };
  timestamp: string;
}

@Injectable()
export class PremiumService {
  private readonly payOSBaseUrl = process.env.PAYOS_GATEWAY_URL || 'https://pay-8dip.onrender.com';
  private payOSClient: PayOS | null = null;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private getDirectPayOSClient(): PayOS | null {
    if (this.payOSClient) {
      return this.payOSClient;
    }

    const clientId = process.env.PAYOS_CLIENT_ID || process.env.CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY || process.env.API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY || process.env.CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      return null;
    }

    this.payOSClient = new PayOS(clientId, apiKey, checksumKey);
    return this.payOSClient;
  }

  private getPaymentUrls() {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      returnUrl: process.env.RETURN_URL || `${frontendUrl}/premium/success`,
      cancelUrl: process.env.CANCEL_URL || `${frontendUrl}/premium/cancel`,
    };
  }

  /**
   * Get JWT token from database (configured by admin)
   * Admin manually logs into PayOS, gets token, and pastes it in admin panel
   */
  private async getPayOSToken(): Promise<string> {
    if (this.getDirectPayOSClient()) {
      throw new BadRequestException({
        code: 'GATEWAY_TOKEN_NOT_REQUIRED',
        message: 'Đang dùng PayOS trực tiếp, không cần Gateway Token.',
      });
    }

    const config = await this.prisma.payOSConfig.findFirst({
      where: { isActive: true },
    });

    if (!config || !config.gatewayToken) {
      throw new BadRequestException({ 
        code: 'PAYOS_NOT_CONFIGURED', 
        message: 'Chưa cấu hình thanh toán. Cần thiết lập CLIENT_ID/API_KEY/CHECKSUM_KEY trong .env hoặc Gateway Token trong Admin.' 
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

    // 3. Tạo orderCode duy nhất (PayOS yêu cầu số nguyên trong phạm vi an toàn)
    const orderCode = this.generateOrderCode();

    // 4. Tạo Payment record với status PENDING
    const payment = await this.prisma.payment.create({
      data: {
        orderCode,
        userId,
        packageId: plan.id,
        planName: plan.name,
        amount: plan.price,
        durationDays: plan.durationDays,
        description: `Mua gói ${plan.name}`,
        status: 'PENDING',
      },
    });

    // 5. Gọi PayOS để tạo payment link
    try {
      const description = this.buildPayOSDescription(plan);
      const { returnUrl, cancelUrl } = this.getPaymentUrls();
      const payOSResponse = await this.createPayOSPaymentLink({
        orderCode: Number(orderCode),
        amount: Math.round(plan.price),
        description,
        cancelUrl,
        returnUrl,
      });

      const gatewayOrderCode = String(payOSResponse.orderCode);

      // 6. Cập nhật Payment với thông tin từ PayOS
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          orderCode: gatewayOrderCode,
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
          qrCode: payOSResponse.qrCode,
          checkoutUrl: payOSResponse.checkoutUrl,
          status: payOSResponse.status,
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
      const payOSErrorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException({ 
        code: 'PAYOS_ERROR', 
        message: payOSErrorMessage.includes('Mô tả') || payOSErrorMessage.includes('description')
          ? payOSErrorMessage
          : 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.',
        details: payOSErrorMessage,
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

    // 3. Kiểm tra trạng thái thật từ PayOS — lỗi poll không được chặn UI
    let gatewayStatus = payment.status;
    try {
      const payOSStatus = await this.getPayOSPaymentStatus(orderCode);
      gatewayStatus = this.normalizePayOSStatus(
        payOSStatus.status,
        payOSStatus.amountPaid,
        payment.amount,
      );
    } catch (error) {
      console.error('PayOS status check failed:', error);
      return {
        success: true,
        data: {
          orderCode: payment.orderCode,
          status: payment.status,
          planName: payment.planName,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
        message: `Trạng thái thanh toán: ${payment.status}`,
      };
    }

    try {
      if (gatewayStatus === 'PAID') {
        await this.processSuccessfulPayment(payment, userId, requestId);
      } else if (gatewayStatus === 'CANCELLED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });
      } else if (gatewayStatus === 'EXPIRED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'EXPIRED',
          },
        });
      }

      const updatedPayment = await this.prisma.payment.findUnique({
        where: { id: payment.id },
      });

      if (!updatedPayment) {
        throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'Không tìm thấy thanh toán.' });
      }

      const finalStatus = updatedPayment.status === 'PAID' ? 'PAID' : gatewayStatus;

      return {
        success: true,
        data: {
          orderCode: updatedPayment.orderCode,
          status: finalStatus,
          planName: updatedPayment.planName,
          amount: updatedPayment.amount,
          paidAt: updatedPayment.paidAt,
        },
        message: `Trạng thái thanh toán: ${finalStatus}`,
      };
    } catch (error) {
      console.error('Payment status processing failed:', error);
      throw new BadRequestException({
        code: 'PAYOS_CHECK_ERROR',
        message: 'Không thể cập nhật trạng thái thanh toán.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PayOS gọi webhook khi thanh toán thành công — không phụ thuộc polling frontend.
   */
  async handlePayOSWebhook(body: unknown) {
    console.log('[PayOS Webhook] Received webhook:', JSON.stringify(body));
    
    const client = this.getDirectPayOSClient();
    if (!client) {
      console.error('[PayOS Webhook] PayOS client not configured - missing credentials');
      return { success: false, message: 'PayOS chưa được cấu hình' };
    }

    try {
      const webhookData = client.verifyPaymentWebhookData(body as any);
      console.log('[PayOS Webhook] Verified webhook data:', webhookData);
      
      const orderCode = String(webhookData.orderCode);
      const payment = await this.prisma.payment.findFirst({
        where: { orderCode },
      });

      if (!payment) {
        console.warn(`[PayOS Webhook] Payment not found for orderCode: ${orderCode}`);
        return { success: false, message: 'Order not found locally' };
      }

      console.log(`[PayOS Webhook] Found payment: ${payment.id}, current status: ${payment.status}`);

      if (payment.status !== 'PAID') {
        console.log(`[PayOS Webhook] Processing successful payment for order: ${orderCode}`);
        await this.processSuccessfulPayment(payment, payment.userId);
        console.log(`[PayOS Webhook] Successfully processed payment for order: ${orderCode}`);
      } else {
        console.log(`[PayOS Webhook] Payment already PAID for order: ${orderCode}`);
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      console.error('[PayOS Webhook] Verify/process failed:', error);
      return { success: false, message: 'Webhook processing failed', error: error instanceof Error ? error.message : 'Unknown error' };
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
      await this.cancelPayOSPayment(orderCode);

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

    try {
      await this.auditLogsService.log({
        performedByAdminId: userId,
        action: 'PAYMENT_SUCCESS',
        resource: 'Payment',
        resourceId: payment.id,
        entityName: payment.orderCode,
        reason: `Thanh toán thành công gói ${payment.planName}`,
        requestId,
      });
    } catch (error) {
      console.error('Audit log PAYMENT_SUCCESS failed:', error);
    }
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

  /** PayOS giới hạn description tối đa 25 ký tự */
  private buildPayOSDescription(plan: { code: string; durationDays: number }): string {
    const desc = `Premium ${plan.durationDays} ngay`;
    return desc.slice(0, 25);
  }

  private normalizePayOSStatus(status: string, amountPaid?: number, amount?: number): string {
    const normalized = (status || '').toUpperCase();
    if (['PAID', 'SUCCESS', 'COMPLETED'].includes(normalized)) {
      return 'PAID';
    }
    if (amountPaid != null && amount != null && amountPaid >= amount && amountPaid > 0) {
      return 'PAID';
    }
    if (normalized === 'CANCELLED' || normalized === 'CANCELED') {
      return 'CANCELLED';
    }
    if (normalized === 'EXPIRED') {
      return 'EXPIRED';
    }
    return normalized || 'PENDING';
  }

  private generateOrderCode(): string {
    const seconds = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 1000);
    return String(seconds * 1000 + random);
  }

  private async createPayOSPaymentLink(input: {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
  }): Promise<PayOSPaymentLink> {
    const directClient = this.getDirectPayOSClient();
    if (directClient) {
      const result = await directClient.createPaymentLink(input);
      return {
        orderCode: result.orderCode,
        amount: result.amount,
        description: result.description,
        status: result.status,
        checkoutUrl: result.checkoutUrl,
        qrCode: result.qrCode,
      };
    }

    const gatewayResponse = await this.callGatewayAPI<GatewayPaymentResponse>(
      '/api/v1/payment/create',
      {
        amount: input.amount,
        description: input.description,
        cancelUrl: input.cancelUrl,
        returnUrl: input.returnUrl,
      },
    );

    return gatewayResponse.data;
  }

  private async getPayOSPaymentStatus(orderCode: string): Promise<{ status: string; amountPaid?: number }> {
    const directClient = this.getDirectPayOSClient();
    if (directClient) {
      const result = await directClient.getPaymentLinkInformation(Number(orderCode));
      return { status: result.status, amountPaid: result.amountPaid };
    }

    const gatewayResponse = await this.callGatewayAPI<GatewayPaymentStatus>(
      `/api/v1/payment/${orderCode}/status`,
      {},
      'GET',
    );

    return { status: gatewayResponse.data.status };
  }

  private async cancelPayOSPayment(orderCode: string): Promise<void> {
    const directClient = this.getDirectPayOSClient();
    if (directClient) {
      await directClient.cancelPaymentLink(orderCode);
      return;
    }

    await this.callGatewayAPI(`/api/v1/payment/${orderCode}/cancel`, {}, 'POST');
  }

  private async callGatewayAPI<T>(endpoint: string, data: Record<string, unknown>, method = 'POST'): Promise<T> {
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

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`PayOS Gateway error: ${response.status} - ${result?.message || 'Unknown error'}`);
    }
    
    if (result.error !== 0 && result.error !== undefined) {
      throw new Error(`PayOS Gateway error: ${result.message || 'Unknown error'}`);
    }
    
    return result as T;
  }

  /**
   * Kiểm tra trạng thái cổng thanh toán PayOS
   * Dùng cho admin dashboard để kiểm tra xem token có cấu hình và gateway có reachable không
   */
  async getGatewayStatus() {
    const directConfigured = !!this.getDirectPayOSClient();

    if (directConfigured) {
      return {
        success: true,
        data: {
          configured: true,
          reachable: true,
          tokenStatus: 'ACTIVE',
          lastCheckedAt: new Date().toISOString(),
          mode: 'DIRECT',
        },
      };
    }

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
        mode: 'GATEWAY',
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