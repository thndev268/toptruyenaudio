import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';

@ApiTags('Partner Portal')
@ApiBearerAuth()
@Controller('partner')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('applications')
  @ApiOperation({ summary: 'Gửi hồ sơ đăng ký tham gia chương trình Đối tác' })
  async apply(@Body() body: any) {
    return this.partnersService.applyForPartner('mock_creator_id', body);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Xem tổng quan báo cáo thu nhập & chiến dịch đối tác' })
  async getDashboard() {
    return this.partnersService.getDashboard('mock_partner_id');
  }
}
