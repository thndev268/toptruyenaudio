import { Controller, Get, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

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
    const isDbConnected = this.connection.readyState === 1;
    let transactionSupport = 'NOT_SUPPORTED';

    if (isDbConnected) {
      try {
        const session = await this.connection.startSession();
        try {
          await session.withTransaction(async () => {
            // no-op check for transaction support
          });
          transactionSupport = 'SUPPORTED';
        } catch (txErr) {
          transactionSupport = 'NOT_SUPPORTED';
        } finally {
          await session.endSession();
        }
      } catch (err) {
        transactionSupport = 'NOT_SUPPORTED';
      }
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
        mongodb: isDbConnected ? 'CONNECTED' : 'NOT_CONNECTED',
        mongodbTransactions: transactionSupport,
        redis: 'OPTIONAL',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
