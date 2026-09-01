import { Controller, Get, Post, Body, UseGuards, Query, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng' })
  async getUserNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Post('mark-read/:id')
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('delete/:id')
  @ApiOperation({ summary: 'Xóa thông báo' })
  async deleteNotification(@CurrentUser('id') userId: string, @Param('id') notificationId: string) {
    return this.notificationsService.deleteNotification(userId, notificationId);
  }

  // Admin endpoints
  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Gửi thông báo broadcast đến người dùng' })
  async sendBroadcast(@Body() body: {
    title: string;
    content: string;
    type?: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER';
    targetAudience?: 'ALL' | 'REGULAR' | 'PREMIUM' | 'CREATOR' | 'SPECIFIC_USER';
    targetUserId?: string;
  }) {
    return this.notificationsService.sendBroadcast(body);
  }

  @Post('draft')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Tạo nháp thông báo' })
  async createDraft(@Body() body: {
    title: string;
    content: string;
    type?: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER';
    targetAudience?: 'ALL' | 'REGULAR' | 'PREMIUM' | 'CREATOR' | 'SPECIFIC_USER';
    targetUserId?: string;
  }) {
    return this.notificationsService.createDraft(body);
  }

  @Post('schedule')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Lên lịch gửi thông báo' })
  async scheduleNotification(@Body() body: {
    notificationId: string;
    scheduledAt: string;
  }) {
    return this.notificationsService.scheduleNotification({
      notificationId: body.notificationId,
      scheduledAt: new Date(body.scheduledAt),
      adminId: 'admin', // Will be replaced with actual admin ID from CurrentUser
    });
  }

  @Post('cancel/:id')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Hủy thông báo đã lên lịch' })
  async cancelNotification(@Param('id') notificationId: string) {
    return this.notificationsService.cancelNotification(notificationId, 'admin');
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông báo (chỉ nháp hoặc đã lên lịch)' })
  async updateNotification(
    @Param('id') notificationId: string,
    @Body() body: {
      title?: string;
      content?: string;
      type?: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER';
      targetAudience?: 'ALL' | 'REGULAR' | 'PREMIUM' | 'CREATOR' | 'SPECIFIC_USER';
      targetUserId?: string;
      scheduledAt?: string;
    }
  ) {
    return this.notificationsService.updateNotification(notificationId, {
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Lấy tất cả thông báo (Admin)' })
  async getAllNotifications(@Query() query: {
    page?: number;
    limit?: number;
    type?: 'NEW_USER' | 'NEW_STORY' | 'NEW_CHAPTER' | 'PROMOTION' | 'SYSTEM' | 'OTHER';
    status?: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
    targetAudience?: 'ALL' | 'REGULAR' | 'PREMIUM' | 'CREATOR' | 'SPECIFIC_USER';
  }) {
    return this.notificationsService.getAllNotifications(query);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Lấy thống kê thông báo (Admin)' })
  async getNotificationStats() {
    return this.notificationsService.getNotificationStats();
  }
}
