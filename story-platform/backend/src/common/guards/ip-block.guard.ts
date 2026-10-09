import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { getClientIp } from '../helpers/ip.helper';

/**
 * IP Block Guard
 * 
 * Checks if the client IP is blocked before allowing the request to proceed.
 * If IP is blocked, returns 403 Forbidden.
 */
@Injectable()
export class IpBlockGuard implements CanActivate {
  private readonly logger = new Logger(IpBlockGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ipAddress = getClientIp(request);

    if (!ipAddress || ipAddress === 'UNKNOWN') {
      // If IP cannot be determined, allow the request (don't block)
      return true;
    }

    try {
      const blockedIp = await this.prisma.blockedIp.findUnique({
        where: { ipAddress },
      });

      if (blockedIp) {
        // Check if block has expired
        if (blockedIp.expiresAt && blockedIp.expiresAt < new Date()) {
          // Auto-unblock expired blocks
          await this.prisma.blockedIp.delete({
            where: { id: blockedIp.id },
          });
          this.logger.log(`Auto-unblocked expired IP: ${ipAddress}`);
          return true;
        }

        // IP is blocked
        this.logger.warn(`Blocked IP attempted access: ${ipAddress} - Reason: ${blockedIp.reason || 'No reason'}`);

        throw new ForbiddenException({
          code: 'IP_BLOCKED',
          message: 'Địa chỉ IP của bạn đã bị chặn. Vui lòng liên hệ hỗ trợ nếu bạn nghĩ đây là lỗi.',
          ipAddress,
          reason: blockedIp.reason,
          expiresAt: blockedIp.expiresAt,
        });
      }

      return true;
    } catch (error) {
      // If error is not our ForbiddenException, log and allow (fail open)
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Error checking IP block status: ${error.message}`);
      // Fail open - allow request if check fails
      return true;
    }
  }
}
