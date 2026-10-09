import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';

@ApiTags('Wallets & Ledger')
@ApiBearerAuth()
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Xem số dư ví và chi tiết tài khoản ví của người dùng' })
  async getMyWallet() {
    return this.walletsService.getMyWallet('mock_user_id');
  }

  @Post('withdrawals')
  @ApiOperation({ summary: 'Tạo yêu cầu rút tiền về tài khoản ngân hàng' })
  async requestWithdrawal(@Body() body: any) {
    return this.walletsService.requestWithdrawal('mock_user_id', body);
  }
}
