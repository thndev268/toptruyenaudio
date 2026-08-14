import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
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
}
