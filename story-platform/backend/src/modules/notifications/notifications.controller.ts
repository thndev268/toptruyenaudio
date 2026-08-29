import { Controller, Get, Post, Body, UseGuards, Query, Param } from '@nestjs/common';
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
    targetAudience: 'ALL' | 'PREMIUM' | 'CREATOR' | 'PARTNER' | 'SPECIFIC_USER';
    targetUserId?: string;
  }) {
    return this.notificationsService.sendBroadcast(body);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiOperation({ summary: 'Lấy tất cả thông báo (Admin)' })
  async getAllNotifications(@Query() query: { page?: number; limit?: number }) {
    return this.notificationsService.getAllNotifications(query);
  }
}
