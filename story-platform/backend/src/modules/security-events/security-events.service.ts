import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SecurityEvent, SecurityEventDocument } from './schemas/security-event.schema';
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
    @InjectModel(SecurityEvent.name) private readonly securityEventModel: Model<SecurityEventDocument>,
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
      await this.securityEventModel.updateOne({ title: sample.title }, { $setOnInsert: sample }, { upsert: true }).exec();
    }
  }

  async getAllEvents(status?: SecurityEventStatus, severity?: string) {
    const query: any = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const items = await this.securityEventModel
      .find(query)
      .sort({ detectedAt: -1 })
      .populate('resolvedByAdminId', 'displayName email')
      .exec();

    if (!items || items.length === 0) {
      await this.seedSampleEvents();
      return this.getAllEvents(status, severity);
    }

    return items.map((item) => this.formatEvent(item));
  }

  async getEventById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Mã cảnh báo không hợp lệ.' });
    }

    const event = await this.securityEventModel.findById(id).populate('resolvedByAdminId', 'displayName email').exec();
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    return this.formatEvent(event);
  }

  async startInvestigation(id: string, adminId: string, requestId?: string) {
    const event = await this.securityEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status, SecurityEventStatus.INVESTIGATING);

    event.status = SecurityEventStatus.INVESTIGATING;
    event.investigatedAt = new Date();
    await event.save();

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'SECURITY_EVENT_INVESTIGATION_STARTED',
      resource: 'SecurityEvent',
      resourceId: event._id.toString(),
      entityName: event.title,
      reason: 'Bắt đầu quá trình xác minh cảnh báo an ninh',
      requestId,
    });

    return this.formatEvent(event);
  }

  async executeAction(id: string, adminId: string, actionTaken: string, reason: string, requestId?: string) {
    const event = await this.securityEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status, SecurityEventStatus.ACTION_REQUIRED);

    event.status = SecurityEventStatus.ACTION_REQUIRED;
    event.actionTaken = actionTaken;
    await event.save();

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'SECURITY_EVENT_ACTION_EXECUTED',
      resource: 'SecurityEvent',
      resourceId: event._id.toString(),
      entityName: event.title,
      reason,
      requestId,
      metadata: { actionTaken },
    });

    return this.formatEvent(event);
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

    const event = await this.securityEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status, status);

    event.status = status;
    event.resolutionNote = resolutionNote.trim();
    event.actionTaken = actionTaken.trim();
    event.resolvedAt = new Date();
    (event as any).resolvedByAdminId = new Types.ObjectId(adminId);
    event.reason = reason.trim();
    await event.save();

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: status === SecurityEventStatus.RESOLVED ? 'SECURITY_EVENT_RESOLVED' : 'SECURITY_EVENT_FALSE_POSITIVE',
      resource: 'SecurityEvent',
      resourceId: event._id.toString(),
      entityName: event.title,
      reason,
      requestId,
      metadata: { resolutionNote, actionTaken },
    });

    return this.formatEvent(event);
  }

  async reopenEvent(id: string, adminId: string, reason: string, requestId?: string) {
    const event = await this.securityEventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy cảnh báo an ninh.' });
    }

    this.validateTransition(event.status, SecurityEventStatus.REOPENED);

    event.status = SecurityEventStatus.REOPENED;
    event.reason = reason;
    await event.save();

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'SECURITY_EVENT_REOPENED',
      resource: 'SecurityEvent',
      resourceId: event._id.toString(),
      entityName: event.title,
      reason,
      requestId,
    });

    return this.formatEvent(event);
  }

  private formatEvent(event: SecurityEventDocument) {
    return {
      id: event._id.toString(),
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
      resolvedBy: (event.resolvedByAdminId as any)?.displayName || null,
      resolutionNote: event.resolutionNote,
      reason: event.reason,
    };
  }
}
