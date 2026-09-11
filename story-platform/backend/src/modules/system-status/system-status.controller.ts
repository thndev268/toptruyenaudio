import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemStatusService, SystemStatusResponse } from './system-status.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountRole } from '../../common/enums';

@ApiTags('System Status (Admin)')
@Controller('admin/system-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.OWNER_ADMIN)
@ApiBearerAuth()
export class SystemStatusController {
  constructor(private readonly systemStatusService: SystemStatusService) {}

  @Get()
  @ApiOperation({ summary: 'Get system status and health information (Admin only)' })
  async getSystemStatus(): Promise<SystemStatusResponse> {
    return this.systemStatusService.getSystemStatus();
  }
}
