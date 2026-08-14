import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { QueryUsersDto, UserMutationDto } from './dto/admin-users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums';
import { AuthService } from '../auth/auth.service';

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
  @ApiOperation({ summary: 'Tìm kiếm, lọc và phân trang danh sách người dùng' })
  async getUsers(@Query() queryDto: QueryUsersDto) {
    return this.adminService.getUsers(queryDto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Xem chi tiết thông tin hồ sơ và gói cước người dùng' })
  async getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
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
}
