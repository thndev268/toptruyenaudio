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
import { CreateGenreDto, UpdateGenreDto } from './dto/genre.dto';
import { PayOSConfigDto } from './dto/payos-config.dto';

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

  async deleteUser(userId: string, adminId: string, reason: string, requestId?: string) {
    // Prohibit self-deletion
    if (userId === adminId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Tài khoản Quản trị tối cao (OWNER_ADMIN) không thể tự xóa chính mình.',
      });
    }

    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    if (user.role === AccountRole.OWNER_ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Không thể xóa tài khoản Quản trị tối cao.',
      });
    }

    // Delete user and all related data using transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete related records
      await tx.refreshSession.deleteMany({ where: { userId } });
      await tx.listeningProgress.deleteMany({ where: { profileId: userId } });
      await tx.listeningSession.deleteMany({ where: { profileId: userId } });
      await tx.userSubscription.deleteMany({ where: { profileId: userId } });
      await tx.payment.deleteMany({ where: { userId } });
      await tx.supportConversation.deleteMany({ where: { userId } });
      await tx.securityEvent.deleteMany({ where: { resolvedByAdminId: userId } });
      await tx.wallet.deleteMany({ where: { profileId: userId } });
      await tx.creatorApplication.deleteMany({ where: { profileId: userId } });
      await tx.partnerApplication.deleteMany({ where: { profileId: userId } });

      // Delete the user profile
      await tx.profile.delete({ where: { id: userId } });
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'USER_DELETED',
      resource: 'User',
      resourceId: userId,
      entityName: user.displayName || undefined,
      reason,
      requestId,
    });

    return {
      success: true,
      message: `Đã xóa vĩnh viễn người dùng ${user.displayName}.`,
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

  // Genre Management
  async getGenres() {
    const genres = await this.prisma.genre.findMany({
      include: {
        _count: {
          select: {
            stories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    // Map to include storyCount
    const genresWithCount = genres.map(genre => ({
      ...genre,
      storyCount: genre._count.stories,
    }));
    
    return {
      success: true,
      data: genresWithCount,
      message: 'Đã lấy danh sách thể loại thành công',
    };
  }

  async createGenre(dto: CreateGenreDto) {
    const existing = await this.prisma.genre.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: `Slug '${dto.slug}' đã tồn tại. Vui lòng chọn slug khác.`,
      });
    }

    const genre = await this.prisma.genre.create({
      data: dto,
    });

    return {
      success: true,
      data: genre,
      message: 'Đã tạo thể loại thành công',
    };
  }

  async updateGenre(id: string, dto: UpdateGenreDto) {
    const existing = await this.prisma.genre.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        code: 'GENRE_NOT_FOUND',
        message: 'Không tìm thấy thể loại.',
      });
    }

    const updated = await this.prisma.genre.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      data: updated,
      message: 'Đã cập nhật thể loại thành công',
    };
  }

  async deleteGenre(id: string) {
    const existing = await this.prisma.genre.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        code: 'GENRE_NOT_FOUND',
        message: 'Không tìm thấy thể loại.',
      });
    }

    // Delete genre relations first
    await this.prisma.genreToStory.deleteMany({ where: { genreId: id } });

    // Delete genre
    await this.prisma.genre.delete({ where: { id } });

    return {
      success: true,
      message: 'Đã xóa thể loại thành công',
    };
  }

  async getGenreWithStories(id: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: {
        stories: {
          include: {
            story: true,
          },
        },
      },
    });

    if (!genre) {
      throw new NotFoundException({
        code: 'GENRE_NOT_FOUND',
        message: 'Không tìm thấy thể loại.',
      });
    }

    return {
      success: true,
      data: genre,
      message: 'Đã lấy thể loại và danh sách truyện thành công',
    };
  }

  async getDashboardMetrics(query: { timeFilter?: string; startDate?: string; endDate?: string }) {
    const { timeFilter = 'THIS_MONTH', startDate, endDate } = query;

    // Calculate date range based on filter
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = now;

    switch (timeFilter) {
      case 'TODAY':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'THIS_WEEK':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        dateFrom = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      case 'THIS_MONTH':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'ALL_TIME':
        dateFrom = new Date(0);
        break;
      case 'CUSTOM':
        if (startDate && endDate) {
          dateFrom = new Date(startDate);
          dateTo = new Date(endDate);
        } else {
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get metrics from database
    const [
      totalUsers,
      newUsers,
      totalStories,
      newStories,
      totalListeningSessions,
      listeningDuration,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),
      this.prisma.story.count(),
      this.prisma.story.count({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),
      this.prisma.listeningSession.count({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),
      this.prisma.listeningSession.aggregate({
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: {
          durationSeconds: true,
        },
      }),
      this.prisma.userSubscription.count(),
      this.prisma.userSubscription.count({
        where: {
          status: 'ACTIVE',
          endAt: { gte: now },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate hours from seconds
    const totalHours = Math.floor((listeningDuration._sum.durationSeconds || 0) / 3600);
    const hoursString = totalHours > 0 ? `${totalHours.toLocaleString('vi-VN')}h` : '0h';

    // Calculate revenue
    const revenue = totalRevenue._sum.amount || 0;
    const revenueString = revenue > 0 
      ? `${(revenue / 1000000).toFixed(1)}M đ` 
      : '0 đ';

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          new: newUsers,
        },
        stories: {
          total: totalStories,
          new: newStories,
        },
        listening: {
          sessions: totalListeningSessions,
          totalHours: hoursString,
          totalSeconds: listeningDuration._sum.durationSeconds || 0,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
        },
        revenue: {
          total: revenue,
          formatted: revenueString,
        },
        dateRange: {
          from: dateFrom.toISOString(),
          to: dateTo.toISOString(),
          filter: timeFilter,
        },
      },
    };
  }

  async getSubscriptions(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.userSubscription.findMany({
        include: {
          profile: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
          plan: {
            select: {
              name: true,
              price: true,
              durationDays: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userSubscription.count(),
    ]);

    // Get payment orders for revenue calculation
    const subscriptionIds = subscriptions.map(s => s.id);
    const paymentOrders = await this.prisma.payment.findMany({
      where: {
        // Note: This might need adjustment based on your actual data model
        // Assuming there's a relation between subscriptions and payments
      },
    });

    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      userName: sub.profile?.displayName || sub.profile?.email || 'Unknown',
      userEmail: sub.profile?.email || 'unknown@example.com',
      planName: sub.plan?.name || 'Unknown Plan',
      amountVnd: sub.plan?.price || 0,
      paymentMethod: 'VietQR', // Default, could be enhanced
      startedAt: sub.startAt ? sub.startAt.toISOString().split('T')[0] : 'N/A',
      expiresAt: sub.endAt ? sub.endAt.toISOString().split('T')[0] : 'N/A',
      status: sub.status,
    }));

    return {
      success: true,
      data: formattedSubscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Badges/Honorary Titles Management
  async getBadges() {
    const badges = await this.prisma.honoraryTitle.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: badges.map(b => ({
        id: b.id,
        code: b.code,
        name: b.name,
        description: b.description,
        iconUrl: b.iconUrl,
        effects: b.effects,
        isActive: b.isActive,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      message: 'Đã lấy danh sách badges thành công',
    };
  }

  async createBadge(body: { name: string; description: string; effects: any[]; isActive: boolean }) {
    const code = body.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const badge = await this.prisma.honoraryTitle.create({
      data: {
        code,
        name: body.name,
        description: body.description,
        effects: body.effects,
        isActive: body.isActive ?? true,
      },
    });

    return {
      success: true,
      data: badge,
      message: 'Đã tạo badge thành công',
    };
  }

  async updateBadge(id: string, body: { name: string; description: string; effects: any[]; isActive: boolean }) {
    const badge = await this.prisma.honoraryTitle.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        effects: body.effects,
        isActive: body.isActive,
      },
    });

    return {
      success: true,
      data: badge,
      message: 'Đã cập nhật badge thành công',
    };
  }

  async deleteBadge(id: string) {
    await this.prisma.honoraryTitle.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Đã xóa badge thành công',
    };
  }

  async assignBadgeToUser(badgeId: string, userId: string) {
    // Check if badge exists
    const badge = await this.prisma.honoraryTitle.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy danh hiệu.' });
    }

    // Check if user exists
    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    // Assign badge to user
    await this.prisma.userTitle.upsert({
      where: {
        profileId_titleId: {
          profileId: userId,
          titleId: badgeId,
        },
      },
      update: {
        assignedAt: new Date(),
      },
      create: {
        profileId: userId,
        titleId: badgeId,
        assignedBy: 'ADMIN',
      },
    });

    return {
      success: true,
      message: 'Đã gán badge cho người dùng thành công',
    };
  }

  async revokeBadgeFromUser(badgeId: string, userId: string) {
    await this.prisma.userTitle.deleteMany({
      where: {
        profileId: userId,
        titleId: badgeId,
      },
    });

    return {
      success: true,
      message: 'Đã thu hồi badge từ người dùng thành công',
    };
  }

  // PayOS Configuration Management
  async getPayOSConfig() {
    const config = await this.prisma.payOSConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      return {
        success: true,
        data: null,
        message: 'Chưa cấu hình PayOS',
      };
    }

    // Return masked sensitive data
    return {
      success: true,
      data: {
        id: config.id,
        clientId: config.clientId,
        apiKey: this.maskSensitiveData(config.apiKey),
        checksumKey: config.checksumKey ? this.maskSensitiveData(config.checksumKey) : null,
        isActive: config.isActive,
        configuredAt: config.configuredAt,
        updatedAt: config.updatedAt,
      },
      message: 'Đã lấy cấu hình PayOS thành công',
    };
  }

  async createPayOSConfig(adminId: string, dto: PayOSConfigDto, requestId?: string) {
    // Deactivate existing configs
    await this.prisma.payOSConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new config
    const config = await this.prisma.payOSConfig.create({
      data: {
        clientId: dto.clientId,
        apiKey: dto.apiKey,
        checksumKey: dto.checksumKey,
        isActive: true,
        configuredBy: adminId,
      },
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'PAYOS_CONFIG_CREATED',
      resource: 'PayOSConfig',
      resourceId: config.id,
      entityName: 'PayOS Configuration',
      reason: 'Admin configured PayOS credentials',
      requestId,
    });

    return {
      success: true,
      data: {
        id: config.id,
        clientId: config.clientId,
        apiKey: this.maskSensitiveData(config.apiKey),
        checksumKey: config.checksumKey ? this.maskSensitiveData(config.checksumKey) : null,
        isActive: config.isActive,
        configuredAt: config.configuredAt,
      },
      message: 'Đã cấu hình PayOS thành công',
    };
  }

  async updatePayOSConfig(id: string, adminId: string, dto: PayOSConfigDto, requestId?: string) {
    const existing = await this.prisma.payOSConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PAYOS_CONFIG_NOT_FOUND',
        message: 'Không tìm thấy cấu hình PayOS.',
      });
    }

    const updated = await this.prisma.payOSConfig.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        apiKey: dto.apiKey,
        checksumKey: dto.checksumKey,
        updatedAt: new Date(),
      },
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'PAYOS_CONFIG_UPDATED',
      resource: 'PayOSConfig',
      resourceId: id,
      entityName: 'PayOS Configuration',
      reason: 'Admin updated PayOS credentials',
      requestId,
    });

    return {
      success: true,
      data: {
        id: updated.id,
        clientId: updated.clientId,
        apiKey: this.maskSensitiveData(updated.apiKey),
        checksumKey: updated.checksumKey ? this.maskSensitiveData(updated.checksumKey) : null,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt,
      },
      message: 'Đã cập nhật cấu hình PayOS thành công',
    };
  }

  async deletePayOSConfig(id: string, adminId: string, requestId?: string) {
    const existing = await this.prisma.payOSConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PAYOS_CONFIG_NOT_FOUND',
        message: 'Không tìm thấy cấu hình PayOS.',
      });
    }

    await this.prisma.payOSConfig.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'PAYOS_CONFIG_DELETED',
      resource: 'PayOSConfig',
      resourceId: id,
      entityName: 'PayOS Configuration',
      reason: 'Admin deleted PayOS credentials',
      requestId,
    });

    return {
      success: true,
      message: 'Đã xóa cấu hình PayOS thành công',
    };
  }

  private maskSensitiveData(data: string): string {
    if (!data || data.length <= 8) {
      return '****';
    }
    return data.substring(0, 4) + '****' + data.substring(data.length - 4);
  }
}