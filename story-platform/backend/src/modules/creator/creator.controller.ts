import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreatorService } from './creator.service';

@ApiTags('Creator Studio & Applications')
@ApiBearerAuth()
@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Post('applications')
  @ApiOperation({ summary: 'Gửi hồ sơ đăng ký trở thành Tác giả / Creator' })
  async submitApplication(@Body() body: any) {
    return this.creatorService.submitApplication('mock_user_id', body);
  }

  @Get('application')
  @ApiOperation({ summary: 'Xem trạng thái đơn đăng ký Creator của mình' })
  async getMyApplication() {
    return this.creatorService.getMyApplication('mock_user_id');
  }
}
