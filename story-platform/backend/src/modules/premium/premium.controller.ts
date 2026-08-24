import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Premium & Payments')
@Controller('premium')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  /**
   * Lấy danh sách gói Premium đang active
   * Frontend chỉ dùng để hiển thị, không được tự quyết định giá
   */
  @Get('plans')
  @ApiOperation({ summary: 'Lấy danh sách gói Premium đang active' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách gói Premium thành công' })
  async getActivePlans() {
    return this.premiumService.getActivePlans();
  }

  /**
   * Tạo payment request mới
   * Frontend chỉ gửi packageId, backend tự xác định giá và thời hạn từ database
   */
  @Post('payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tạo yêu cầu thanh toán mới' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        packageCode: {
          type: 'string',
          description: 'Code của gói Premium (PREMIUM_MONTHLY, PREMIUM_QUARTERLY, v.v.)',
          example: 'PREMIUM_MONTHLY',
        },
      },
      required: ['packageCode'],
    },
  })
  @ApiResponse({ status: 200, description: 'Đã tạo yêu cầu thanh toán thành công' })
  @ApiResponse({ status: 404, description: 'Gói Premium không tồn tại' })
  async createPayment(@Request() req, @Body() body: { packageCode: string }) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.premiumService.createPayment(userId, body.packageCode, req.id);
  }

  /**
   * Kiểm tra trạng thái payment
   * Backend kiểm tra trạng thái thật từ PayOS và xử lý business logic
   */
  @Get('payments/:orderCode/status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái thanh toán' })
  @ApiParam({ name: 'orderCode', description: 'Mã đơn hàng', example: '12345678901234' })
  @ApiResponse({ status: 200, description: 'Kiểm tra trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy payment' })
  async checkPaymentStatus(@Request() req, @Param('orderCode') orderCode: string) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.premiumService.checkPaymentStatus(userId, orderCode, req.id);
  }

  /**
   * Hủy payment
   */
  @Post('payments/:orderCode/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hủy yêu cầu thanh toán' })
  @ApiParam({ name: 'orderCode', description: 'Mã đơn hàng', example: '12345678901234' })
  @ApiResponse({ status: 200, description: 'Đã hủy thanh toán thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy payment đang chờ thanh toán' })
  async cancelPayment(@Request() req, @Param('orderCode') orderCode: string) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.premiumService.cancelPayment(userId, orderCode, req.id);
  }

  /**
   * Lấy lịch sử giao dịch của user
   */
  @Get('payments/history')
  @ApiOperation({ summary: 'Lấy lịch sử giao dịch của user' })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử giao dịch thành công' })
  async getUserPaymentHistory(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    return this.premiumService.getUserPaymentHistory(userId, page, limit);
  }

  /**
   * Lấy subscription hiện tại của user
   */
  @Get('subscription')
  @ApiOperation({ summary: 'Lấy subscription hiện tại của user' })
  @ApiResponse({ status: 200, description: 'Lấy subscription thành công' })
  async getUserSubscription(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.premiumService.getUserSubscription(userId);
  }
}