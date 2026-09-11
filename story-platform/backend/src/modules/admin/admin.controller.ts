import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { QueryUsersDto, UserMutationDto } from './dto/admin-users.dto';
import { CreateGenreDto, UpdateGenreDto } from './dto/genre.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole, SubscriptionPlanId } from '../../common/enums';
import { AuthService } from '../auth/auth.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@ApiTags('Admin User Management (OWNER_ADMIN)')
@Throttle({ support: {} })
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.OWNER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản OWNER_ADMIN hiện tại' })
  async getAdminMe(@CurrentUser('id') adminId: string) {
    return this.authService.getCurrentUser(adminId);
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Đăng xuất tài khoản OWNER_ADMIN khỏi tất cả các thiết bị' })
  async logoutAll(@CurrentUser('id') adminId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(adminId);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return { message: 'Đã đăng xuất tài khoản Quản trị khỏi tất cả thiết bị.' };
  }

  @Get('users')
  @SkipThrottle()
  @ApiOperation({ summary: 'Tìm kiếm, lọc và phân trang danh sách người dùng' })
  async getUsers(@Query() queryDto: QueryUsersDto) {
    return this.adminService.getUsers(queryDto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Xem chi tiết thông tin hồ sơ và gói cước người dùng' })
  async getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Get('users/:userId/badges')
  @ApiOperation({ summary: 'Lấy danh sách badges của người dùng' })
  async getUserBadges(@Param('userId') userId: string) {
    return this.adminService.getUserBadges(userId);
  }

  @Post('users/:userId/suspend')
  @ApiOperation({ summary: 'Tạm khóa tài khoản người dùng' })
  async suspendUser(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UserMutationDto,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.adminService.suspendUser(userId, adminId, dto, requestId);
  }

  @Post('users/:userId/unsuspend')
  @ApiOperation({ summary: 'Mở khóa tài khoản người dùng' })
  async unsuspendUser(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UserMutationDto,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.adminService.unsuspendUser(userId, adminId, dto, requestId);
  }

  @Post('users/:userId/revoke-sessions')
  @ApiOperation({ summary: 'Thu hồi tất cả các phiên đăng nhập của người dùng' })
  async revokeSessions(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UserMutationDto,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.adminService.revokeUserSessions(userId, adminId, dto, requestId);
  }

  @Post('users/:userId/grant-premium')
  @SkipThrottle()
  @ApiOperation({ summary: 'Cấp Premium cho người dùng' })
  async grantPremium(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { planId: string; days: number; reason: string },
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.subscriptionsService.grantPremium({
      userId,
      adminId,
      planId: body.planId as SubscriptionPlanId,
      reason: body.reason,
      requestId,
    });
  }

  @Delete('users/:userId')
  @SkipThrottle()
  @ApiOperation({ summary: 'Xóa vĩnh viễn người dùng' })
  async deleteUser(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.adminService.deleteUser(userId, adminId, body.reason, requestId);
  }

  // Genre Management
  @Get('genres')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy danh sách tất cả thể loại' })
  async getGenres() {
    return this.adminService.getGenres();
  }

  @Post('genres')
  @ApiOperation({ summary: 'Tạo thể loại mới' })
  async createGenre(@Body() dto: CreateGenreDto) {
    return this.adminService.createGenre(dto);
  }

  @Put('genres/:id')
  @ApiOperation({ summary: 'Cập nhật thể loại' })
  async updateGenre(@Param('id') id: string, @Body() dto: UpdateGenreDto) {
    return this.adminService.updateGenre(id, dto);
  }

  @Delete('genres/:id')
  @ApiOperation({ summary: 'Xóa thể loại' })
  async deleteGenre(@Param('id') id: string) {
    return this.adminService.deleteGenre(id);
  }

  @Get('genres/:id/stories')
  @ApiOperation({ summary: 'Lấy thể loại và danh sách truyện' })
  async getGenreWithStories(@Param('id') id: string) {
    return this.adminService.getGenreWithStories(id);
  }

  @Get('video-settings')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy cấu hình hiển thị video iframe' })
  async getVideoSettings() {
    return {
      success: true,
      settings: {
        showIframeByDefault: false,
        hideIframeWithCSS: true,
        allowUserToggleIframe: true,
        autoPlayVideo: false,
      },
    };
  }

  @Post('video-settings')
  @ApiOperation({ summary: 'Cập nhật cấu hình hiển thị video iframe' })
  async updateVideoSettings(@Body() body: { settings: any }) {
    return {
      success: true,
      message: 'Đã cập nhật cấu hình hiển thị video iframe thành công.',
      settings: body.settings,
    };
  }

  @Get('dashboard/metrics')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy metrics thống kê cho dashboard' })
  async getDashboardMetrics(@Query() query: { timeFilter?: string; startDate?: string; endDate?: string }) {
    return this.adminService.getDashboardMetrics(query);
  }

  @Get('user-counts')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy số lượng người dùng theo loại' })
  async getUserCounts() {
    return this.adminService.getUserCounts();
  }

  @Get('subscriptions')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy danh sách subscription records cho Premium screen' })
  async getSubscriptions(@Query() query: { page?: number; limit?: number }) {
    return this.adminService.getSubscriptions(query);
  }

  @Get('badges')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy danh sách badges/honorary titles' })
  async getBadges() {
    return this.adminService.getBadges();
  }

  @Post('badges')
  @ApiOperation({ summary: 'Tạo badge/honorary title mới' })
  async createBadge(@Body() body: any) {
    return this.adminService.createBadge(body);
  }

  @Put('badges/:id')
  @ApiOperation({ summary: 'Cập nhật badge/honorary title' })
  async updateBadge(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateBadge(id, body);
  }

  @Delete('badges/:id')
  @ApiOperation({ summary: 'Xóa badge/honorary title' })
  async deleteBadge(@Param('id') id: string) {
    return this.adminService.deleteBadge(id);
  }

  @Post('badges/:badgeId/assign/:userId')
  @ApiOperation({ summary: 'Gán badge cho người dùng' })
  async assignBadgeToUser(@Param('badgeId') badgeId: string, @Param('userId') userId: string) {
    return this.adminService.assignBadgeToUser(badgeId, userId);
  }

  @Delete('badges/:badgeId/revoke/:userId')
  @ApiOperation({ summary: 'Thu hồi badge từ người dùng' })
  async revokeBadgeFromUser(@Param('badgeId') badgeId: string, @Param('userId') userId: string) {
    return this.adminService.revokeBadgeFromUser(badgeId, userId);
  }

  @Get('comments')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy danh sách tất cả bình luận cho admin' })
  async getComments(@Query() query: { status?: string; page?: number; limit?: number }) {
    return this.adminService.getComments(query);
  }

  @Patch('comments/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái bình luận' })
  async updateCommentStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string }
  ) {
    return this.adminService.updateCommentStatus(id, body.status, body.reason);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Xóa bình luận' })
  async deleteComment(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.deleteComment(id, body.reason);
  }

  @Get('active-users')
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy danh sách người dùng tích cực nhất' })
  async getActiveUsers(@Query() query: { limit?: number; timeRange?: string }) {
    return this.adminService.getActiveUsers(query);
  }
}
