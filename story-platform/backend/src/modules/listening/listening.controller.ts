import { Controller, Post, Patch, Get, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ListeningService } from './listening.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { StartSessionDto, HeartbeatDto, UpsertListeningProgressDto } from './dto/listening.dto';

@ApiTags('Listening Analytics & Session')
@Controller('listening')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ListeningController {
  constructor(private readonly listeningService: ListeningService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Bắt đầu một phiên nghe mới' })
  async startSession(@CurrentUser() user: any, @Body() dto: StartSessionDto) {
    return this.listeningService.startSession(user.id, dto);
  }

  @Patch('sessions/:id/heartbeat')
  @ApiOperation({ summary: 'Gửi heartbeat để cập nhật tiến độ và thời gian nghe' })
  async heartbeat(
    @CurrentUser() user: any,
    @Param('id') sessionId: string,
    @Body() dto: HeartbeatDto,
  ) {
    return this.listeningService.handleHeartbeat(user.id, sessionId, dto);
  }

  @Post('sessions/:id/complete')
  @ApiOperation({ summary: 'Đánh dấu phiên nghe đã hoàn thành' })
  async completeSession(@CurrentUser() user: any, @Param('id') sessionId: string) {
    return this.listeningService.completeSession(user.id, sessionId);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Lấy lịch sử nghe thực tế từ server' })
  async getMyHistory(@CurrentUser() user: any) {
    return this.listeningService.getUserHistory(user.id);
  }

  @Get('me/metrics')
  @ApiOperation({ summary: 'Lấy tổng hợp chỉ số nghe của người dùng' })
  async getMyMetrics(@CurrentUser() user: any) {
    return this.listeningService.getUserMetrics(user.id);
  }
  @Get('me/progress')
  @ApiOperation({ summary: 'Lấy tiến độ nghe/xem của người dùng' })
  async getListeningProgress(@CurrentUser() user: any) {
    return this.listeningService.getListeningProgress(user.id);
  }

  @Get('me/progress/:chapterId')
  @ApiOperation({ summary: 'Lấy tiến độ nghe/xem theo tập' })
  async getListeningProgressByChapter(@CurrentUser() user: any, @Param('chapterId') chapterId: string) {
    return this.listeningService.getListeningProgressByChapter(user.id, chapterId);
  }

  @Put('me/progress/:chapterId')
  @ApiOperation({ summary: 'Cập nhật tiến độ nghe/xem' })
  async upsertListeningProgress(
    @CurrentUser() user: any,
    @Param('chapterId') chapterId: string,
    @Body() dto: UpsertListeningProgressDto,
  ) {
    return this.listeningService.upsertListeningProgress(user.id, chapterId, dto);
  }

  @Delete('me/progress/:chapterId')
  @ApiOperation({ summary: 'Xóa tiến độ nghe/xem của tập' })
  async deleteListeningProgressByChapter(@CurrentUser() user: any, @Param('chapterId') chapterId: string) {
    return this.listeningService.deleteListeningProgress(user.id, chapterId);
  }

  @Delete('me/progress')
  @ApiOperation({ summary: 'Xóa toàn bộ tiến độ' })
  async deleteAllListeningProgress(@CurrentUser() user: any) {
    return this.listeningService.clearListeningProgress(user.id);
  }

  @Get('rankings/users')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy bảng xếp hạng người dùng theo thời gian nghe' })
  async getUserRankings(@Query('period') period: string = 'week', @Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit) || 10;
    return this.listeningService.getUserRankings(period, limitNum);
  }
}
