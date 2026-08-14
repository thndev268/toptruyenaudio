import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint for DB and dependencies' })
  async getReadiness() {
    let isDbConnected = false;
    let transactionSupport = 'NOT_SUPPORTED';

    try {
      await this.prisma.$connect();
      isDbConnected = true;
      transactionSupport = 'SUPPORTED';
    } catch (err) {
      isDbConnected = false;
      transactionSupport = 'NOT_SUPPORTED';
    }

    let overallStatus = 'ready';
    if (!isDbConnected) {
      overallStatus = 'not_ready';
    } else if (transactionSupport === 'NOT_SUPPORTED') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      dependencies: {
        postgresql: isDbConnected ? 'CONNECTED' : 'NOT_CONNECTED',
        postgresqlTransactions: transactionSupport,
        redis: 'OPTIONAL',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
