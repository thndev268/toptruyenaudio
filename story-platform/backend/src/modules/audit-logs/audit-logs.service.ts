import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
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
    return this.prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        performedByAdminId: params.performedByAdminId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        entityName: params.entityName || '',
        reason: params.reason || '',
        requestId: params.requestId || '',
        metadata: params.metadata || {},
      },
    });
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
    const where: any = {};

    if (filter.action) where.action = filter.action;
    if (filter.resource) where.resource = filter.resource;
    if (filter.resourceId) where.resourceId = filter.resourceId;
    if (filter.requestId) where.requestId = filter.requestId;
    if (filter.performedByAdminId) {
      where.performedByAdminId = filter.performedByAdminId;
    }

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = new Date(filter.startDate);
      if (filter.endDate) where.timestamp.lte = new Date(filter.endDate);
    }

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Needs fixing because Prisma AuditLog doesn't have a direct relation to Profile in the provided schema,
    // but we can query it manually if needed. For now we will return just performedByAdminId.
    return {
      items: items.map((item) => ({
        id: item.id,
        timestamp: item.timestamp.toISOString(),
        performedBy: item.performedByAdminId, // Missing join
        performedByEmail: undefined,
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
