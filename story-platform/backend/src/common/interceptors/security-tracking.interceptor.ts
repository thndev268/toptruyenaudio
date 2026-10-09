import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { SecurityDetectionService, DetectionContext, DetectionResult } from '../../modules/security-events/security-detection.service';
import { getClientIp, getCountryFromRequest, getUserAgentFromRequest } from '../helpers/ip.helper';

/**
 * Security Tracking Interceptor
 * 
 * Automatically tracks security events based on detection rules.
 * Only logs events when suspicious activity is detected to avoid DB overload.
 */
@Injectable()
export class SecurityTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityTrackingInterceptor.name);

  // Paths to skip security tracking (public endpoints, health checks, etc.)
  private readonly SKIP_PATHS = [
    '/api/v1/docs',
    '/api/v1/health',
    '/api/v1/public',
  ];

  // Status codes that always trigger security event logging
  private readonly ALWAYS_LOG_STATUS_CODES = [401, 403, 429, 500];

  constructor(
    private readonly prisma: PrismaService,
    private readonly securityDetectionService: SecurityDetectionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    // Skip tracking for certain paths
    if (this.shouldSkipPath(request.path)) {
      return next.handle();
    }

    const startTime = Date.now();
    const ipAddress = getClientIp(request);
    const country = getCountryFromRequest(request);
    const userAgent = getUserAgentFromRequest(request);

    // Get user ID if authenticated
    const userId = (request as any).user?.sub || (request as any).user?.id || null;

    return next.handle().pipe(
      tap({
        next: async () => {
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          // Only log if suspicious activity detected or status code is notable
          if (this.shouldLogSecurityEvent(statusCode, request)) {
            await this.handleSecurityEvent({
              ipAddress,
              userId,
              endpoint: request.path,
              method: request.method,
              statusCode,
              userAgent: userAgent || undefined,
              country: country || undefined,
            });
          }
        },
        error: async (error) => {
          const statusCode = error.status || 500;
          
          // Log errors as potential security events
          await this.handleSecurityEvent({
            ipAddress,
            userId,
            endpoint: request.path,
            method: request.method,
            statusCode,
            userAgent: userAgent || undefined,
            country: country || undefined,
          });
        },
      }),
    );
  }

  /**
   * Check if path should be skipped from security tracking
   */
  private shouldSkipPath(path: string): boolean {
    return this.SKIP_PATHS.some(skipPath => path.startsWith(skipPath));
  }

  /**
   * Determine if security event should be logged based on status code
   */
  private shouldLogSecurityEvent(statusCode: number, request: Request): boolean {
    // Always log notable status codes
    if (this.ALWAYS_LOG_STATUS_CODES.includes(statusCode)) {
      return true;
    }

    // Log 4xx errors (except 404 which can be normal)
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 404) {
      return true;
    }

    // Log 5xx errors
    if (statusCode >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Handle security event detection and logging
   */
  private async handleSecurityEvent(context: DetectionContext): Promise<void> {
    try {
      // Run detection rules
      const detectionResult = await this.securityDetectionService.detectSuspiciousActivity(context);

      // Only log to DB if detection says so
      if (detectionResult.shouldLog) {
        await this.logSecurityEvent(context, detectionResult);
      }
    } catch (error) {
      // Don't let security tracking errors break the application
      this.logger.error('Security tracking error:', error);
    }
  }

  /**
   * Log security event to database
   */
  private async logSecurityEvent(
    context: DetectionContext,
    detectionResult: DetectionResult,
  ): Promise<void> {
    try {
      const { ipAddress, userId, endpoint, method, statusCode, userAgent, country } = context;

      // Determine event type based on context
      const eventType = this.determineEventType(context, detectionResult);

      // Determine title
      const title = this.determineEventTitle(context, detectionResult);

      await this.prisma.securityEvent.create({
        data: {
          title,
          type: eventType,
          status: 'NEW',
          severity: detectionResult.riskLevel,
          description: detectionResult.reason,
          ipAddress,
          country,
          userAgent,
          endpoint,
          method,
          statusCode,
          action: detectionResult.action,
          riskLevel: detectionResult.riskLevel,
          reason: detectionResult.reason,
          requestCount: detectionResult.requestCount,
          metadata: {
            userId,
            timestamp: new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `Security event logged: ${detectionResult.riskLevel} - ${detectionResult.reason} - IP: ${ipAddress}`,
      );
    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Determine event type based on context
   */
  private determineEventType(
    context: DetectionContext,
    detectionResult: DetectionResult,
  ): string {
    const { statusCode, endpoint } = context;
    const { reason } = detectionResult;

    if (reason.includes('login')) {
      return 'FAILED_LOGIN';
    }

    if (reason.includes('SQL injection')) {
      return 'SQL_INJECTION';
    }

    if (reason.includes('path traversal')) {
      return 'PATH_TRAVERSAL';
    }

    if (reason.includes('suspicious endpoint')) {
      return 'SUSPICIOUS_PATH';
    }

    if (reason.includes('auth failure')) {
      return 'AUTH_FAILURE';
    }

    if (reason.includes('error requests')) {
      return 'API_ERROR_ABUSE';
    }

    if (reason.includes('different users')) {
      return 'MULTIPLE_USERS_SAME_IP';
    }

    if (reason.includes('IP switched')) {
      return 'USER_IP_CHANGE';
    }

    if (statusCode === 401) {
      return 'UNAUTHORIZED_ACCESS';
    }

    if (statusCode === 403) {
      return 'FORBIDDEN_ACCESS';
    }

    if (statusCode === 429) {
      return 'RATE_LIMIT_EXCEEDED';
    }

    if (statusCode && statusCode >= 500) {
      return 'SERVER_ERROR';
    }

    return 'SUSPICIOUS_ACTIVITY';
  }

  /**
   * Determine event title
   */
  private determineEventTitle(
    context: DetectionContext,
    detectionResult: DetectionResult,
  ): string {
    const { ipAddress, statusCode } = context;
    const { riskLevel, reason } = detectionResult;

    if (riskLevel === 'CRITICAL') {
      return `🔴 CRITICAL: ${reason}`;
    }

    if (riskLevel === 'HIGH') {
      return `🟠 HIGH: ${reason}`;
    }

    if (riskLevel === 'MEDIUM') {
      return `🟡 MEDIUM: ${reason}`;
    }

    return `⚪ LOW: ${reason}`;
  }
}
