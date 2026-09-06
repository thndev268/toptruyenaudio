import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { GrantPremiumDto, RevokePremiumDto } from './dto/subscriptions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums';

@ApiTags('Premium Subscriptions')
@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('subscription-plans')
  @ApiOperation({ summary: 'Lấy danh sách 4 gói cước Premium khả dụng' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('subscriptions/me')
  @ApiOperation({ summary: 'Lấy thông tin gói Premium của người dùng hiện tại' })
  async getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getUserSubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscriptions/sync')
  @ApiOperation({ summary: 'Đồng bộ membershipTier từ subscription status' })
  async syncMembershipTier(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.syncMembershipTier(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @Post('admin/users/:userId/subscription/grant')
  @ApiOperation({ summary: 'OWNER_ADMIN cấp hoặc gia hạn quyền Premium cho người dùng' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Mã chống trùng lặp ghi nhận thao tác' })
  async grantPremium(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: GrantPremiumDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Req() req?: Request,
  ) {
    const requestId = (req?.headers['x-request-id'] as string) || (req as any)?.id;
    return this.subscriptionsService.grantPremium({
      userId,
      adminId,
      planId: dto.planId,
      reason: dto.reason,
      idempotencyKey,
      expectedVersion: dto.expectedVersion,
      requestId,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @Post('admin/users/:userId/subscription/revoke')
  @ApiOperation({ summary: 'OWNER_ADMIN thu hồi quyền Premium của người dùng' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  async revokePremium(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: RevokePremiumDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Req() req?: Request,
  ) {
    const requestId = (req?.headers['x-request-id'] as string) || (req as any)?.id;
    return this.subscriptionsService.revokePremium({
      userId,
      adminId,
      reason: dto.reason,
      idempotencyKey,
      requestId,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @Get('admin/users/:userId/subscription/ledger')
  @ApiOperation({ summary: 'Lấy nhật ký lịch sử cấp/gia hạn/thu hồi Premium (PremiumGrantLedger)' })
  async getGrantLedger(@Param('userId') userId: string) {
    return this.subscriptionsService.getGrantLedger(userId);
  }
}
