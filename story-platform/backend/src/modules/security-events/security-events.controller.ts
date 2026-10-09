import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { SecurityEventsService } from './security-events.service';
import { ActionSecurityEventDto, ResolveSecurityEventDto, ReopenSecurityEventDto } from './dto/security-events.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole, SecurityEventStatus } from '../../common/enums';

@ApiTags('Security & Fraud Warnings')
@Controller('admin/security-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.OWNER_ADMIN)
@ApiBearerAuth()
export class SecurityEventsController {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  @Get()
  @ApiOperation({ summary: 'OWNER_ADMIN lấy danh sách các cảnh báo an ninh & gian lận' })
  @ApiQuery({ name: 'status', enum: SecurityEventStatus, required: false })
  @ApiQuery({ name: 'severity', required: false })
  async getAllEvents(
    @Query('status') status?: SecurityEventStatus,
    @Query('severity') severity?: string,
  ) {
    return this.securityEventsService.getAllEvents(status, severity);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get security statistics for Security Center' })
  async getSecurityStats() {
    return this.securityEventsService.getSecurityStats();
  }

  @Get('events')
  @ApiOperation({ summary: 'Get security events with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'riskLevel', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'ipAddress', required: false })
  @ApiQuery({ name: 'statusCode', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getEventsPaginated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('action') action?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('statusCode') statusCode?: string,
    @Query('search') search?: string,
  ) {
    return this.securityEventsService.getEventsPaginated({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      riskLevel,
      action,
      ipAddress,
      statusCode: statusCode ? parseInt(statusCode) : undefined,
      search,
    });
  }

  @Get('top-suspicious-ips')
  @ApiOperation({ summary: 'Get top suspicious IPs' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopSuspiciousIps(@Query('limit') limit?: string) {
    return this.securityEventsService.getTopSuspiciousIps(limit ? parseInt(limit) : 20);
  }

  @Get('blocked-ips')
  @ApiOperation({ summary: 'Get all blocked IPs' })
  async getBlockedIps() {
    return this.securityEventsService.getBlockedIps();
  }

  @Get('ip/:ipAddress')
  @ApiOperation({ summary: 'Get IP details' })
  async getIpDetails(@Param('ipAddress') ipAddress: string) {
    return this.securityEventsService.getIpDetails(ipAddress);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user security details' })
  async getUserSecurityDetails(@Param('userId') userId: string) {
    return this.securityEventsService.getUserSecurityDetails(userId);
  }

  @Post('block-ip')
  @ApiOperation({ summary: 'Block IP address' })
  async blockIp(
    @Body() dto: { ipAddress: string; reason: string; duration?: string },
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const requestId =(req.headers['x-request-id'] as string) || (req as any).id;
    return this.securityEventsService.blockIp({
      ...dto,
      adminId,
      requestId,
    });
  }

  @Post('unblock-ip')
  @ApiOperation({ summary: 'Unblock IP address' })
  async unblockIp(
    @Body() dto: { ipAddress: string },
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.securityEventsService.unblockIp({
      ...dto,
      adminId,
      requestId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết cảnh báo an ninh' })
  async getEventById(@Param('id') id: string) {
    return this.securityEventsService.getEventById(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Bắt đầu quá trình xác minh/điều tra cảnh báo an ninh' })
  async startInvestigation(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.securityEventsService.startInvestigation(id, adminId, requestId);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'Thực thi hành động can thiệp an ninh (khóa phiên/tài khoản)' })
  async executeAction(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ActionSecurityEventDto,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.securityEventsService.executeAction(id, adminId, dto.actionTaken, dto.reason, requestId);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Hoàn tất giải quyết cảnh báo an ninh (RESOLVED hoặc FALSE_POSITIVE)' })
  async resolveEvent(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ResolveSecurityEventDto,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.securityEventsService.resolveEvent({
      id,
      adminId,
      status: dto.status,
      resolutionNote: dto.resolutionNote,
      actionTaken: dto.actionTaken,
      reason: dto.reason,
      requestId,
    });
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Mở lại cảnh báo an ninh đã đóng' })
  async reopenEvent(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReopenSecurityEventDto,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.securityEventsService.reopenEvent(id, adminId, dto.reason, requestId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete security event' })
  async deleteEvent(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const requestId = (req.headers['x-request-id'] as string) || (req as any).id;
    return this.securityEventsService.deleteEvent(id, adminId, requestId);
  }
}
