import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DetectionResult {
  shouldLog: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'ALLOWED' | 'WARNING' | 'BLOCKED';
  reason: string;
  requestCount?: number;
}

export interface DetectionContext {
  ipAddress: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string | null;
  country?: string | null;
}

@Injectable()
export class SecurityDetectionService {
  private readonly logger = new Logger(SecurityDetectionService.name);
  
  // In-memory tracking for recent events (avoid DB hits for every request)
  private readonly loginFailures = new Map<string, { count: number; firstSeen: Date }>();
  private readonly errorRequests = new Map<string, { count: number; firstSeen: Date }>();
  private readonly authFailures = new Map<string, { count: number; firstSeen: Date }>();
  private readonly suspiciousPaths = new Map<string, { count: number; firstSeen: Date }>();
  private readonly ipUserMap = new Map<string, Set<string>>();
  private readonly userIpMap = new Map<string, Set<string>>();

  // Cleanup interval (5 minutes)
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {
    // Start cleanup interval
    setInterval(() => this.cleanupOldRecords(), this.CLEANUP_INTERVAL);
  }

  /**
   * Detect suspicious activity based on request context
   */
  async detectSuspiciousActivity(context: DetectionContext): Promise<DetectionResult> {
    const { ipAddress, userId, endpoint, method, statusCode } = context;

    // Default: no suspicious activity
    const defaultResult: DetectionResult = {
      shouldLog: false,
      riskLevel: 'LOW',
      action: 'ALLOWED',
      reason: 'Normal request',
    };

    if (!ipAddress || ipAddress === 'UNKNOWN') {
      return defaultResult;
    }

    // Check if IP is blocked
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
      } else {
        return {
          shouldLog: true,
          riskLevel: 'HIGH',
          action: 'BLOCKED',
          reason: `IP blocked: ${blockedIp.reason || 'No reason provided'}`,
        };
      }
    }

    // Track user-IP mapping
    if (userId) {
      this.trackUserIpMapping(userId, ipAddress);
    }

    // Detect suspicious path scanning
    const pathResult = this.detectSuspiciousPath(endpoint);
    if (pathResult.shouldLog) {
      return pathResult;
    }

    // Detect SQL injection patterns
    const sqlResult = this.detectSqlInjection(endpoint);
    if (sqlResult.shouldLog) {
      return sqlResult;
    }

    // Detect path traversal
    const traversalResult = this.detectPathTraversal(endpoint);
    if (traversalResult.shouldLog) {
      return traversalResult;
    }

    // Detect 401/403 abuse
    if (statusCode === 401 || statusCode === 403) {
      const authResult = this.detectAuthFailureAbuse(ipAddress);
      if (authResult.shouldLog) {
        return authResult;
      }
    }

    // Detect API error abuse
    if (statusCode && statusCode >= 400) {
      const errorResult = this.detectErrorAbuse(ipAddress);
      if (errorResult.shouldLog) {
        return errorResult;
      }
    }

    // Detect multiple users from same IP
    const multiUserResult = this.detectMultipleUsersSameIp(ipAddress);
    if (multiUserResult.shouldLog) {
      return multiUserResult;
    }

    // Detect user IP change
    if (userId) {
      const ipChangeResult = this.detectUserIpChange(userId);
      if (ipChangeResult.shouldLog) {
        return ipChangeResult;
      }
    }

    return defaultResult;
  }

  /**
   * Record login failure for detection
   */
  recordLoginFailure(ipAddress: string): DetectionResult {
    const now = new Date();
    const existing = this.loginFailures.get(ipAddress);

    if (existing) {
      existing.count++;
      
      // Check thresholds
      const timeDiff = now.getTime() - existing.firstSeen.getTime();
      const timeDiffMinutes = timeDiff / (1000 * 60);

      if (timeDiffMinutes <= 5) {
        if (existing.count >= 20) {
          return {
            shouldLog: true,
            riskLevel: 'CRITICAL',
            action: 'WARNING',
            reason: `${existing.count} failed login attempts in ${Math.round(timeDiffMinutes)} minutes`,
            requestCount: existing.count,
          };
        } else if (existing.count >= 10) {
          return {
            shouldLog: true,
            riskLevel: 'HIGH',
            action: 'WARNING',
            reason: `${existing.count} failed login attempts in ${Math.round(timeDiffMinutes)} minutes`,
            requestCount: existing.count,
          };
        } else if (existing.count >= 5) {
          return {
            shouldLog: true,
            riskLevel: 'MEDIUM',
            action: 'WARNING',
            reason: `${existing.count} failed login attempts in ${Math.round(timeDiffMinutes)} minutes`,
            requestCount: existing.count,
          };
        }
      } else {
        // Reset if too old
        existing.count = 1;
        existing.firstSeen = now;
      }
    } else {
      this.loginFailures.set(ipAddress, { count: 1, firstSeen: now });
    }

    return {
      shouldLog: false,
      riskLevel: 'LOW',
      action: 'ALLOWED',
      reason: 'Normal login failure',
    };
  }

  /**
   * Detect suspicious path scanning
   */
  private detectSuspiciousPath(endpoint?: string): DetectionResult {
    if (!endpoint) {
      return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'No endpoint' };
    }

    const suspiciousPatterns = [
      '/wp-admin',
      '/wp-login.php',
      '/.env',
      '/phpmyadmin',
      '/admin',
      '/etc/passwd',
      '/config.php',
      '/web.config',
      '.git',
      '/.git',
      '/svn',
      '/.svn',
    ];

    const lowerEndpoint = endpoint.toLowerCase();
    const isSuspicious = suspiciousPatterns.some(pattern => 
      lowerEndpoint.includes(pattern.toLowerCase())
    );

    if (isSuspicious) {
      const ipAddress = 'unknown'; // Would need context
      const existing = this.suspiciousPaths.get(ipAddress);

      if (existing) {
        existing.count++;
        if (existing.count >= 5) {
          return {
            shouldLog: true,
            riskLevel: 'CRITICAL',
            action: 'WARNING',
            reason: `Suspicious endpoint scanning: ${endpoint}`,
            requestCount: existing.count,
          };
        }
      } else {
        this.suspiciousPaths.set(ipAddress, { count: 1, firstSeen: new Date() });
      }

      return {
        shouldLog: true,
        riskLevel: 'HIGH',
        action: 'WARNING',
        reason: `Suspicious endpoint: ${endpoint}`,
      };
    }

    return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'Normal endpoint' };
  }

  /**
   * Detect SQL injection patterns
   */
  private detectSqlInjection(endpoint?: string): DetectionResult {
    if (!endpoint) {
      return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'No endpoint' };
    }

    const sqlPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /information_schema/i,
      /sleep\(/i,
      /benchmark\(/i,
      /waitfor\s+delay/i,
      /;\s*drop/i,
      /'\s*or\s*'/i,
      /'\s*and\s*'/i,
      /exec\s*\(/i,
    ];

    const isSqlInjection = sqlPatterns.some(pattern => pattern.test(endpoint));

    if (isSqlInjection) {
      return {
        shouldLog: true,
        riskLevel: 'CRITICAL',
        action: 'WARNING',
        reason: `SQL injection pattern detected: ${endpoint}`,
      };
    }

    return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'No SQL injection' };
  }

  /**
   * Detect path traversal patterns
   */
  private detectPathTraversal(endpoint?: string): DetectionResult {
    if (!endpoint) {
      return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'No endpoint' };
    }

    const traversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e/i,
      /%252e%252e/i,
      /\.\.%2f/i,
      /\.\.%5c/i,
    ];

    const isTraversal = traversalPatterns.some(pattern => pattern.test(endpoint));

    if (isTraversal) {
      return {
        shouldLog: true,
        riskLevel: 'CRITICAL',
        action: 'WARNING',
        reason: `Path traversal pattern detected: ${endpoint}`,
      };
    }

    return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'No path traversal' };
  }

  /**
   * Detect 401/403 abuse from same IP
   */
  private detectAuthFailureAbuse(ipAddress: string): DetectionResult {
    const now = new Date();
    const existing = this.authFailures.get(ipAddress);

    if (existing) {
      existing.count++;
      
      const timeDiff = now.getTime() - existing.firstSeen.getTime();
      const timeDiffMinutes = timeDiff / (1000 * 60);

      if (timeDiffMinutes <= 1 && existing.count >= 20) {
        return {
          shouldLog: true,
          riskLevel: 'HIGH',
          action: 'WARNING',
          reason: `${existing.count} auth failures in ${Math.round(timeDiffMinutes)} minute(s)`,
          requestCount: existing.count,
        };
      }
    } else {
      this.authFailures.set(ipAddress, { count: 1, firstSeen: now });
    }

    return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'Normal auth failure' };
  }

  /**
   * Detect API error abuse
   */
  private detectErrorAbuse(ipAddress: string): DetectionResult {
    const now = new Date();
    const existing = this.errorRequests.get(ipAddress);

    if (existing) {
      existing.count++;
      
      const timeDiff = now.getTime() - existing.firstSeen.getTime();
      const timeDiffMinutes = timeDiff / (1000 * 60);

      if (timeDiffMinutes <= 1 && existing.count >= 30) {
        return {
          shouldLog: true,
          riskLevel: 'HIGH',
          action: 'WARNING',
          reason: `${existing.count} error requests in ${Math.round(timeDiffMinutes)} minute(s)`,
          requestCount: existing.count,
        };
      }
    } else {
      this.errorRequests.set(ipAddress, { count: 1, firstSeen: now });
    }

    return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'Normal error' };
  }

  /**
   * Detect multiple users from same IP
   */
  private detectMultipleUsersSameIp(ipAddress: string): DetectionResult {
    const users = this.ipUserMap.get(ipAddress);
    
    if (users && users.size >= 20) {
      return {
        shouldLog: true,
        riskLevel: 'MEDIUM',
        action: 'WARNING',
        reason: `${users.size} different users from same IP (possible shared network/NAT)`,
        requestCount: users.size,
      };
    }

    return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'Normal IP usage' };
  }

  /**
   * Detect user IP change (rapid IP switching)
   */
  private detectUserIpChange(userId: string): DetectionResult {
    const ips = this.userIpMap.get(userId);
    
    if (ips && ips.size >= 5) {
      return {
        shouldLog: true,
        riskLevel: 'MEDIUM',
        action: 'WARNING',
        reason: `User switched between ${ips.size} different IPs recently (possible VPN/mobile network)`,
        requestCount: ips.size,
      };
    }

    return { shouldLog: false, riskLevel: 'LOW', action: 'ALLOWED', reason: 'Normal IP usage' };
  }

  /**
   * Track user-IP mapping for detection
   */
  private trackUserIpMapping(userId: string, ipAddress: string): void {
    // Track IPs per user
    if (!this.userIpMap.has(userId)) {
      this.userIpMap.set(userId, new Set());
    }
    this.userIpMap.get(userId)!.add(ipAddress);

    // Track users per IP
    if (!this.ipUserMap.has(ipAddress)) {
      this.ipUserMap.set(ipAddress, new Set());
    }
    this.ipUserMap.get(ipAddress)!.add(userId);
  }

  /**
   * Cleanup old tracking records to prevent memory leaks
   */
  private cleanupOldRecords(): void {
    const now = new Date();
    const cutoffTime = now.getTime() - this.CLEANUP_INTERVAL;

    // Clean login failures
    for (const [ip, data] of this.loginFailures.entries()) {
      if (data.firstSeen.getTime() < cutoffTime) {
        this.loginFailures.delete(ip);
      }
    }

    // Clean error requests
    for (const [ip, data] of this.errorRequests.entries()) {
      if (data.firstSeen.getTime() < cutoffTime) {
        this.errorRequests.delete(ip);
      }
    }

    // Clean auth failures
    for (const [ip, data] of this.authFailures.entries()) {
      if (data.firstSeen.getTime() < cutoffTime) {
        this.authFailures.delete(ip);
      }
    }

    // Clean suspicious paths
    for (const [ip, data] of this.suspiciousPaths.entries()) {
      if (data.firstSeen.getTime() < cutoffTime) {
        this.suspiciousPaths.delete(ip);
      }
    }

    // Clean user-IP mappings (older than 10 minutes)
    const userIpCutoff = now.getTime() - (10 * 60 * 1000);
    for (const [userId, ips] of this.userIpMap.entries()) {
      if (ips.size === 0) {
        this.userIpMap.delete(userId);
      }
    }

    for (const [ip, users] of this.ipUserMap.entries()) {
      if (users.size === 0) {
        this.ipUserMap.delete(ip);
      }
    }

    this.logger.debug('Security detection cleanup completed');
  }
}
