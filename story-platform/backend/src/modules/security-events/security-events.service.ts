import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { SecurityEventType, SecurityEventStatus } from '../../common/enums';

const ALLOWED_TRANSITIONS: Record<SecurityEventStatus, SecurityEventStatus[]> = {
  [SecurityEventStatus.NEW]: [SecurityEventStatus.INVESTIGATING],
  [SecurityEventStatus.INVESTIGATING]: [
    SecurityEventStatus.ACTION_REQUIRED,
    SecurityEventStatus.WAITING_FOR_USER,
    SecurityEventStatus.RESOLVED,
    SecurityEventStatus.FALSE_POSITIVE,
  ],
  [SecurityEventStatus.ACTION_REQUIRED]: [
    SecurityEventStatus.INVESTIGATING,
    SecurityEventStatus.WAITING_FOR_USER,
    SecurityEventStatus.RESOLVED,
  ],
  [SecurityEventStatus.WAITING_FOR_USER]: [
    SecurityEventStatus.INVESTIGATING,
    SecurityEventStatus.RESOLVED,
    SecurityEventStatus.FALSE_POSITIVE,
  ],
  [SecurityEventStatus.RESOLVED]: [SecurityEventStatus.REOPENED],
  [SecurityEventStatus.FALSE_POSITIVE]: [SecurityEventStatus.REOPENED],
  [SecurityEventStatus.REOPENED]: [SecurityEventStatus.INVESTIGATING],
};

@Injectable()
export class SecurityEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private validateTransition(currentStatus: SecurityEventStatus, targetStatus: SecurityEventStatus) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new ConflictException({
        code: 'INVALID_STATE_TRANSITION',
        message: `Không thể chuyển trạng thái cảnh báo an ninh từ '${currentStatus}' sang '${targetStatus}'.`,
      });
    }
  }

  async seedSampleEvents() {
    const samples = [
      {
        title: 'Cảnh báo lạm dụng Refresh Token (Token Reuse)',
        type: SecurityEventType.REFRESH_TOKEN_REUSE,
        status: SecurityEventStatus.NEW,
        severity: 'HIGH',
        description: 'Phát hiện cùng một Refresh Token được gửi lại từ địa chỉ IP bất thường.',
        ipAddress: '113.161.45.12',
        detectedAt: new Date(Date.now() - 3600000),
      },
      {
        title: 'Bất thường tần suất đăng nhập thất bại',
        type: SecurityEventType.FAILED_LOGINS_SPIKE,
        status: SecurityEventStatus.NEW,
        severity: 'MEDIUM',
        description: 'Phát hiện hơn 15 lần nhập sai mật khẩu liên tiếp trong 2 phút.',
        ipAddress: '14.232.180.99',
        detectedAt: new Date(Date.now() - 7200000),
      },
    ];

    for (const sample of samples) {
      const existing = await this.prisma.securityEvent.findFirst({ where: { title: sample.title } });
      if (!existing) {
        await this.prisma.securityEvent.create({ data: sample as any });
      }
    }
  }

  async getAllEvents(status?: SecurityEventStatus, severity?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const items = await this.prisma.securityEvent.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      include: { profile: { select: { displayName: true, email: true } } },
    });

    if (!items || items.length === 0) {
      await this.seedSampleEvents();
      return this.getAllEvents(status, severity);
    }

    return items.map((item) => this.formatEvent(item));
  }

  async getEventById(id: string) {
    const event = await this.prisma.securityEvent.findUnique({
      where: { id },
      include: { profile: { select: { displayName: true, email: true } } },
    });
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    return this.formatEvent(event);
  }

  async startInvestigation(id: string, adminId: string, requestId?: string) {
    const event = await this.prisma.securityEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status as SecurityEventStatus, SecurityEventStatus.INVESTIGATING);

    const updatedEvent = await this.prisma.securityEvent.update({
      where: { id },
      data: {
        status: SecurityEventStatus.INVESTIGATING,
        investigatedAt: new Date(),
      }
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'SECURITY_EVENT_INVESTIGATION_STARTED',
      resource: 'SecurityEvent',
      resourceId: updatedEvent.id,
      entityName: updatedEvent.title,
      reason: 'Bắt đầu quá trình xác minh cảnh báo an ninh',
      requestId,
    });

    return this.formatEvent(updatedEvent);
  }

  async executeAction(id: string, adminId: string, actionTaken: string, reason: string, requestId?: string) {
    const event = await this.prisma.securityEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status as SecurityEventStatus, SecurityEventStatus.ACTION_REQUIRED);

    const updatedEvent = await this.prisma.securityEvent.update({
      where: { id },
      data: {
        status: SecurityEventStatus.ACTION_REQUIRED,
        actionTaken,
      }
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'SECURITY_EVENT_ACTION_EXECUTED',
      resource: 'SecurityEvent',
      resourceId: updatedEvent.id,
      entityName: updatedEvent.title,
      reason,
      requestId,
      metadata: { actionTaken },
    });

    return this.formatEvent(updatedEvent);
  }

  async resolveEvent(params: {
    id: string;
    adminId: string;
    status: SecurityEventStatus.RESOLVED | SecurityEventStatus.FALSE_POSITIVE;
    resolutionNote: string;
    actionTaken: string;
    reason: string;
    requestId?: string;
  }) {
    const { id, adminId, status, resolutionNote, actionTaken, reason, requestId } = params;

    if (!resolutionNote?.trim() || !actionTaken?.trim() || !reason?.trim()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Bắt buộc phải nhập đầy đủ Kết luận (resolutionNote), Biện pháp xử lý (actionTaken) và Lý do (reason) khi đóng cảnh báo an ninh.',
      });
    }

    const event = await this.prisma.securityEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status as SecurityEventStatus, status);

    const updatedEvent = await this.prisma.securityEvent.update({
      where: { id },
      data: {
        status,
        resolutionNote: resolutionNote.trim(),
        actionTaken: actionTaken.trim(),
        resolvedAt: new Date(),
        resolvedByAdminId: adminId,
        reason: reason.trim(),
      }
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: status === SecurityEventStatus.RESOLVED ? 'SECURITY_EVENT_RESOLVED' : 'SECURITY_EVENT_FALSE_POSITIVE',
      resource: 'SecurityEvent',
      resourceId: updatedEvent.id,
      entityName: updatedEvent.title,
      reason,
      requestId,
      metadata: { resolutionNote, actionTaken },
    });

    return this.formatEvent(updatedEvent);
  }

  async reopenEvent(id: string, adminId: string, reason: string, requestId?: string) {
    const event = await this.prisma.securityEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status as SecurityEventStatus, SecurityEventStatus.REOPENED);

    const updatedEvent = await this.prisma.securityEvent.update({
      where: { id },
      data: {
        status: SecurityEventStatus.REOPENED,
        reason,
      }
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'SECURITY_EVENT_REOPENED',
      resource: 'SecurityEvent',
      resourceId: updatedEvent.id,
      entityName: updatedEvent.title,
      reason,
      requestId,
    });

    return this.formatEvent(updatedEvent);
  }

  private formatEvent(event: any) {
    return {
      id: event.id,
      title: event.title,
      type: event.type,
      status: event.status,
      severity: event.severity,
      description: event.description,
      ipAddress: event.ipAddress,
      detectedAt: event.detectedAt ? event.detectedAt.toISOString() : new Date().toISOString(),
      investigatedAt: event.investigatedAt ? event.investigatedAt.toISOString() : null,
      actionTaken: event.actionTaken,
      resolvedAt: event.resolvedAt ? event.resolvedAt.toISOString() : null,
      resolvedBy: (event.profile as any)?.displayName || null,
      resolutionNote: event.resolutionNote,
      reason: event.reason,
      endpoint: event.endpoint,
      method: event.method,
      statusCode: event.statusCode,
      action: event.action,
      riskLevel: event.riskLevel,
      userAgent: event.userAgent,
      country: event.country,
    };
  }

  // ==================== NEW SECURITY CENTER APIs ====================

  /**
   * Get security statistics
   */
  async getSecurityStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      highRiskCount,
      criticalRiskCount,
      blockedIpsCount,
      failedLoginsCount,
      suspiciousIpsCount,
      eventsToday,
      eventsLast24h,
    ] = await Promise.all([
      this.prisma.securityEvent.count(),
      this.prisma.securityEvent.count({ where: { riskLevel: 'HIGH' } }),
      this.prisma.securityEvent.count({ where: { riskLevel: 'CRITICAL' } }),
      this.prisma.blockedIp.count({ where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
      this.prisma.securityEvent.count({ where: { type: 'FAILED_LOGIN' } }),
      this.prisma.securityEvent.groupBy({
        by: ['ipAddress'],
        having: { ipAddress: { not: null } },
        _count: { ipAddress: true },
      }).then(results => results.filter(r => r._count.ipAddress >= 5).length),
      this.prisma.securityEvent.count({ where: { createdAt: { gte: today } } }),
      this.prisma.securityEvent.count({ where: { createdAt: { gte: yesterday } } }),
    ]);

    return {
      totalEvents,
      highRisk: highRiskCount,
      criticalRisk: criticalRiskCount,
      blockedIps: blockedIpsCount,
      failedLogins: failedLoginsCount,
      suspiciousIps: suspiciousIpsCount,
      eventsToday,
      eventsLast24h,
    };
  }

  /**
   * Get security events with pagination and filters
   */
  async getEventsPaginated(params: {
    page?: number;
    limit?: number;
    riskLevel?: string;
    action?: string;
    ipAddress?: string;
    statusCode?: number;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      riskLevel,
      action,
      ipAddress,
      statusCode,
      startDate,
      endDate,
      search,
    } = params;

    const where: any = {};

    if (riskLevel) where.riskLevel = riskLevel;
    if (action) where.action = action;
    if (ipAddress) where.ipAddress = ipAddress;
    if (statusCode) where.statusCode = statusCode;
    if (startDate) where.createdAt = { ...where.createdAt, gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Math.min(limit, 100),
        include: { profile: { select: { displayName: true, email: true } } },
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return {
      data: data.map(item => this.formatEvent(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get top suspicious IPs
   */
  async getTopSuspiciousIps(limit: number = 20) {
    const results = await this.prisma.securityEvent.groupBy({
      by: ['ipAddress'],
      where: { ipAddress: { not: null } },
      _count: { ipAddress: true },
      orderBy: { _count: { ipAddress: 'desc' } },
      take: limit,
    });

    const ipDetails = await Promise.all(
      results.map(async (result) => {
        const events = await this.prisma.securityEvent.findMany({
          where: { ipAddress: result.ipAddress },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });

        const highRiskCount = await this.prisma.securityEvent.count({
          where: { ipAddress: result.ipAddress, riskLevel: 'HIGH' },
        });

        const criticalCount = await this.prisma.securityEvent.count({
          where: { ipAddress: result.ipAddress, riskLevel: 'CRITICAL' },
        });

        const blocked = await this.prisma.blockedIp.findUnique({
          where: { ipAddress: result.ipAddress || undefined },
        });

        return {
          ip: result.ipAddress,
          eventCount: result._count.ipAddress,
          highRiskCount,
          criticalCount,
          lastSeen: events[0]?.createdAt || null,
          blocked: !!blocked,
          blockedReason: blocked?.reason || null,
          blockedExpiresAt: blocked?.expiresAt || null,
        };
      }),
    );

    return ipDetails;
  }

  /**
   * Get IP details
   */
  async getIpDetails(ipAddress: string) {
    const events = await this.prisma.securityEvent.findMany({
      where: { ipAddress },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (events.length === 0) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy dữ liệu cho IP này.' });
    }

    const blocked = await this.prisma.blockedIp.findUnique({
      where: { ipAddress },
    });

    // Get unique users from this IP
    const uniqueUsers = new Set<string>();
    events.forEach(event => {
      const userId = (event.metadata as any)?.userId;
      if (userId) uniqueUsers.add(userId);
    });

    // Get user details
    const users = await Promise.all(
      Array.from(uniqueUsers).map(async (userId) => {
        const user = await this.prisma.profile.findUnique({
          where: { id: userId },
          select: { id: true, displayName: true, email: true },
        });
        return user;
      }),
    );

    // Get unique endpoints
    const endpoints = new Set<string>();
    events.forEach(event => {
      if (event.endpoint) endpoints.add(event.endpoint);
    });

    const highRiskCount = events.filter(e => e.riskLevel === 'HIGH').length;
    const criticalCount = events.filter(e => e.riskLevel === 'CRITICAL').length;

    return {
      ipAddress,
      status: blocked ? 'BLOCKED' : 'ACTIVE',
      blocked,
      firstSeen: events[events.length - 1]?.createdAt || null,
      lastSeen: events[0]?.createdAt || null,
      totalEvents: events.length,
      highRiskCount,
      criticalCount,
      users: users.filter(u => u !== null),
      uniqueEndpoints: Array.from(endpoints),
      recentEvents: events.slice(0, 10).map(e => this.formatEvent(e)),
    };
  }

  /**
   * Get user security details
   */
  async getUserSecurityDetails(userId: string) {
    const events = await this.prisma.securityEvent.findMany({
      where: {
        metadata: {
          path: ['userId'],
          equals: userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, email: true, status: true },
    });

    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy user.' });
    }

    // Get unique IPs for this user
    const uniqueIps = new Set<string>();
    events.forEach(event => {
      if (event.ipAddress) uniqueIps.add(event.ipAddress);
    });

    const failedLoginsCount = events.filter(e => e.type === 'FAILED_LOGIN').length;
    const highRiskCount = events.filter(e => e.riskLevel === 'HIGH').length;
    const criticalCount = events.filter(e => e.riskLevel === 'CRITICAL').length;

    return {
      user,
      recentIps: Array.from(uniqueIps).slice(0, 10),
      totalSecurityEvents: events.length,
      failedLogins: failedLoginsCount,
      highRiskCount,
      criticalCount,
      recentEvents: events.slice(0, 10).map(e => this.formatEvent(e)),
    };
  }

  /**
   * Block IP address
   */
  async blockIp(params: {
    ipAddress: string;
    reason: string;
    duration?: string; // '1h', '6h', '24h', '7d', or null for permanent
    adminId: string;
    requestId?: string;
  }) {
    const { ipAddress, reason, duration, adminId, requestId } = params;

    // Validate IP
    if (!ipAddress || ipAddress === 'UNKNOWN') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Địa chỉ IP không hợp lệ.',
      });
    }

    // Check if already blocked
    const existing = await this.prisma.blockedIp.findUnique({
      where: { ipAddress },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_BLOCKED',
        message: 'IP này đã bị block.',
      });
    }

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (duration) {
      const now = new Date();
      const durationMap: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      };

      const durationMs = durationMap[duration];
      if (durationMs) {
        expiresAt = new Date(now.getTime() + durationMs);
      }
    }

    // Create block record
    const blockedIp = await this.prisma.blockedIp.create({
      data: {
        ipAddress,
        reason: reason.trim(),
        blockedBy: adminId,
        expiresAt,
      },
    });

    // Log audit
    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'IP_BLOCKED',
      resource: 'BlockedIp',
      resourceId: blockedIp.id,
      entityName: ipAddress,
      reason: reason.trim(),
      requestId,
      metadata: { duration, expiresAt },
    });

    return {
      ipAddress,
      reason: blockedIp.reason,
      blockedAt: blockedIp.createdAt,
      expiresAt,
      blockedBy: adminId,
    };
  }

  /**
   * Unblock IP address
   */
  async unblockIp(params: {
    ipAddress: string;
    adminId: string;
    requestId?: string;
  }) {
    const { ipAddress, adminId, requestId } = params;

    const blockedIp = await this.prisma.blockedIp.findUnique({
      where: { ipAddress },
    });

    if (!blockedIp) {
      throw new NotFoundException({
        code: 'NOT_BLOCKED',
        message: 'IP này không bị block.',
      });
    }

    await this.prisma.blockedIp.delete({
      where: { ipAddress },
    });

    // Log audit
    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'IP_UNBLOCKED',
      resource: 'BlockedIp',
      resourceId: blockedIp.id,
      entityName: ipAddress,
      reason: 'Admin unblocked IP',
      requestId,
    });

    return {
      ipAddress,
      unblockedAt: new Date(),
      unblockedBy: adminId,
    };
  }

  /**
   * Get all blocked IPs
   */
  async getBlockedIps() {
    const now = new Date();

    const blockedIps = await this.prisma.blockedIp.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return blockedIps.map(ip => ({
      id: ip.id,
      ipAddress: ip.ipAddress,
      reason: ip.reason,
      blockedBy: ip.blockedBy,
      blockedAt: ip.createdAt,
      expiresAt: ip.expiresAt,
      isExpired: ip.expiresAt ? ip.expiresAt < now : false,
    }));
  }

  /**
   * Delete security event
   */
  async deleteEvent(id: string, adminId: string, requestId?: string) {
    const event = await this.prisma.securityEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Không tìm thấy cảnh báo an ninh.',
      });
    }

    await this.prisma.securityEvent.delete({
      where: { id },
    });

    // Log audit
    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'SECURITY_EVENT_DELETED',
      resource: 'SecurityEvent',
      resourceId: id,
      entityName: event.title,
      reason: 'Admin deleted security event',
      requestId,
    });

    return { id, deletedAt: new Date() };
  }
}
