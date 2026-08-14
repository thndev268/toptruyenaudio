import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(params: {
    performedByAdminId: string;
    action: string;
    resource: string;
    resourceId: string;
    entityName?: string;
    reason?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }) {
    const entry = new this.auditLogModel({
      timestamp: new Date(),
      performedByAdminId: new Types.ObjectId(params.performedByAdminId),
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      entityName: params.entityName || '',
      reason: params.reason || '',
      requestId: params.requestId || '',
      metadata: params.metadata || {},
    });

    return entry.save();
  }

  async getLogs(filter: {
    action?: string;
    resource?: string;
    resourceId?: string;
    performedByAdminId?: string;
    startDate?: string;
    endDate?: string;
    requestId?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};

    if (filter.action) query.action = filter.action;
    if (filter.resource) query.resource = filter.resource;
    if (filter.resourceId) query.resourceId = filter.resourceId;
    if (filter.requestId) query.requestId = filter.requestId;

    if (filter.performedByAdminId && Types.ObjectId.isValid(filter.performedByAdminId)) {
      query.performedByAdminId = new Types.ObjectId(filter.performedByAdminId);
    }

    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = new Date(filter.startDate);
      if (filter.endDate) query.timestamp.$lte = new Date(filter.endDate);
    }

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedByAdminId', 'displayName email role')
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return {
      items: items.map((item) => ({
        id: item._id.toString(),
        timestamp: item.timestamp.toISOString(),
        performedBy: (item.performedByAdminId as any)?.displayName || 'OWNER_ADMIN',
        performedByEmail: (item.performedByAdminId as any)?.email,
        action: item.action,
        resource: item.resource,
        resourceId: item.resourceId,
        entityName: item.entityName,
        reason: item.reason,
        requestId: item.requestId,
        metadata: item.metadata,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
