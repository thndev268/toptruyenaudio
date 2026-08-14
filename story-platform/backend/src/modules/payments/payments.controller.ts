import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments & Gateways')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('packages')
  @ApiOperation({ summary: 'Lấy danh sách gói nạp tiền khả dụng' })
  async getPackages() {
    return this.paymentsService.getPackages();
  }

  @Post('orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo đơn nạp tiền (kèm idempotencyKey phòng chống trùng lặp)' })
  async createOrder(@Body() body: any) {
    return this.paymentsService.createOrder('mock_user_id', body);
  }

  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Endpoint nhận webhook xác thực từ cổng thanh toán' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentsService.processWebhook(provider, body, signature);
  }
}
