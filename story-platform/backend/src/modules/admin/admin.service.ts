import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AccountStatus, AccountRole } from '../../common/enums';
import { QueryUsersDto, UserMutationDto } from './dto/admin-users.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getUsers(queryDto: QueryUsersDto) {
    const where: any = {};

    // Filtering by search term (displayName, email, or id)
    if (queryDto.search) {
      const term = queryDto.search.trim();
      where.OR = [
        { emailNormalized: { contains: term, mode: 'insensitive' } },
        { displayName: { contains: term, mode: 'insensitive' } },
        { id: term },
      ];
    }

    if (queryDto.status) where.status = queryDto.status;
    if (queryDto.membershipTier) where.membershipTier = queryDto.membershipTier;
    if (queryDto.role) where.role = queryDto.role;

    if (queryDto.startDate || queryDto.endDate) {
      where.createdAt = {};
      if (queryDto.startDate) where.createdAt.gte = new Date(queryDto.startDate);
      if (queryDto.endDate) where.createdAt.lte = new Date(queryDto.endDate);
    }

    const page = queryDto.page || 1;
    const limit = Math.min(queryDto.limit || 20, 100);
    const skip = (page - 1) * limit;

    const sortField = queryDto.sortBy || 'createdAt';
    const sortDirection = queryDto.sortOrder === 'asc' ? 'asc' : 'desc';

    const [users, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        orderBy: { [sortField]: sortDirection },
        skip,
        take: limit,
      }),
      this.prisma.profile.count({ where }),
    ]);

    return {
      items: users.map((u) => this.formatUser(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    const subscription = await this.prisma.userSubscription.findFirst({ where: { profileId: userId } });

    return {
      user: this.formatUser(user),
      subscription: subscription || {
        membershipTier: user.membershipTier,
        status: 'NONE',
        autoRenew: false,
      },
    };
  }

  async suspendUser(userId: string, adminId: string, dto: UserMutationDto, requestId?: string) {
    // Prohibit self-suspension
    if (userId === adminId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Tài khoản Quản trị tối cao (OWNER_ADMIN) không thể tự tạm khóa chính mình.',
      });
    }

    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    if (user.role === AccountRole.OWNER_ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Không thể tạm khóa tài khoản Quản trị tối cao.',
      });
    }

    if (dto.expectedVersion !== undefined && user.version !== dto.expectedVersion) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Hồ sơ người dùng đã bị sửa đổi bởi thao tác khác. Vui lòng làm mới trang.',
      });
    }

    const updated = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        status: AccountStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendedReason: dto.reason,
        version: { increment: 1 },
      },
    });

    // Revoke all refresh token sessions
    await this.prisma.refreshSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: `ACCOUNT_SUSPENDED: ${dto.reason}` },
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'USER_SUSPENDED',
      resource: 'User',
      resourceId: userId,
      entityName: user.displayName || undefined,
      reason: dto.reason,
      requestId,
    });

    return this.formatUser(updated);
  }

  async unsuspendUser(userId: string, adminId: string, dto: UserMutationDto, requestId?: string) {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    if (dto.expectedVersion !== undefined && user.version !== dto.expectedVersion) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Hồ sơ người dùng đã bị sửa đổi bởi thao tác khác. Vui lòng làm mới trang.',
      });
    }

    const updated = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        status: AccountStatus.ACTIVE,
        suspendedAt: null,
        suspendedReason: null,
        version: { increment: 1 },
      },
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'USER_UNSUSPENDED',
      resource: 'User',
      resourceId: userId,
      entityName: user.displayName || undefined,
      reason: dto.reason,
      requestId,
    });

    return this.formatUser(updated);
  }

  async revokeUserSessions(userId: string, adminId: string, dto: UserMutationDto, requestId?: string) {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    await this.prisma.refreshSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: `ADMIN_REVOKED: ${dto.reason}` },
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'USER_SESSIONS_REVOKED',
      resource: 'User',
      resourceId: userId,
      entityName: user.displayName || undefined,
      reason: dto.reason,
      requestId,
    });

    return {
      success: true,
      message: `Đã thu hồi tất cả các phiên đăng nhập của người dùng ${user.displayName}.`,
    };
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      membershipTier: user.membershipTier,
      suspendedReason: user.suspendedReason,
      suspendedAt: user.suspendedAt ? user.suspendedAt.toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      version: user.version,
    };
  }
}
