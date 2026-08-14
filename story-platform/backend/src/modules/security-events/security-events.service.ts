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
    };
  }
}
