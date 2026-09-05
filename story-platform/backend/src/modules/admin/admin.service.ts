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

    const subscription = await this.prisma.userSubscription.findFirst({
      where: { profileId: userId },
      include: {
        plan: true,
      },
    });

    // Calculate days remaining and percentage
    let daysRemaining = 0;
    let percentageRemaining = 0;
    if (subscription && subscription.endAt) {
      const now = new Date();
      daysRemaining = Math.max(0, Math.floor((subscription.endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const totalDays = subscription.startAt && subscription.endAt
        ? Math.floor((subscription.endAt.getTime() - subscription.startAt.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      percentageRemaining = totalDays > 0 ? Math.round((daysRemaining / totalDays) * 100) : 0;
    }

    return {
      user: this.formatUser(user),
      subscription: subscription ? {
        ...subscription,
        daysRemaining,
        percentageRemaining,
      } : {
        membershipTier: user.membershipTier,
        status: 'NONE',
        autoRenew: false,
        daysRemaining: 0,
        percentageRemaining: 0,
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
      storiesByGenre,
      topStoriesByListening,
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
      // Story distribution by genre
      this.prisma.genreToStory.groupBy({
        by: ['genreId'],
        _count: {
          storyId: true,
        },
      }),
      // Top stories by listening time
      this.prisma.listeningSession.groupBy({
        by: ['storyId'],
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: {
          durationSeconds: true,
        },
        orderBy: {
          _sum: {
            durationSeconds: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Get genre names for distribution
    const genreIds = storiesByGenre.map(g => g.genreId);
    const genres = await this.prisma.genre.findMany({
      where: { id: { in: genreIds } },
    });

    const genreDistribution = storiesByGenre.map(g => {
      const genre = genres.find(gen => gen.id === g.genreId);
      return {
        genreName: genre?.name || 'Unknown',
        count: g._count.storyId,
      };
    }).sort((a, b) => b.count - a.count);

    // Get story titles for top listening
    const storyIds = topStoriesByListening.map(s => s.storyId).filter((id): id is string => id !== null);
    const stories = await this.prisma.story.findMany({
      where: { id: { in: storyIds } },
      select: { id: true, title: true },
    });

    const topListeningStories = topStoriesByListening.map(s => {
      const story = stories.find(st => st.id === s.storyId);
      return {
        storyTitle: story?.title || 'Unknown',
        totalHours: Math.floor((s._sum.durationSeconds || 0) / 3600),
      };
    });

    // Calculate hours from seconds
    const totalHours = Math.floor((listeningDuration._sum.durationSeconds || 0) / 3600);
    const hoursString = totalHours > 0 ? `${totalHours.toLocaleString('vi-VN')}h` : '0h';

    // Calculate revenue
    const revenue = totalRevenue._sum.amount || 0;

    return {
      users: {
        total: totalUsers,
        new: newUsers,
      },
      stories: {
        total: totalStories,
        new: newStories,
        genreDistribution,
        topListeningStories,
      },
      listening: {
        totalSessions: totalListeningSessions,
        totalHours: hoursString,
        totalSeconds: listeningDuration._sum.durationSeconds || 0,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
      },
      revenue: {
        total: revenue,
        formatted: `${revenue.toLocaleString('vi-VN')}đ`,
      },
      dateRange: {
        filter: timeFilter,
        from: dateFrom,
        to: dateTo,
      },
    };
  }

  async getUserCounts() {
    const now = new Date();
    
    const [
      totalUsers,
      premiumUsers,
      creatorUsers,
      partnerUsers,
    ] = await Promise.all([
      this.prisma.profile.count(),
      this.prisma.profile.count({
        where: { membershipTier: 'PREMIUM' },
      }),
      this.prisma.profile.count({
        where: { role: { in: ['CREATOR', 'OWNER_ADMIN'] } },
      }),
      this.prisma.profile.count({
        where: { role: 'PARTNER' },
      }),
    ]);

    return {
      total: totalUsers,
      premium: premiumUsers,
      creator: creatorUsers,
      partner: partnerUsers,
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: badges.map(b => ({
        id: b.id,
        code: b.code,
        name: b.name,
        description: b.description,
        level: 'COMMON', // Default level since database column doesn't exist yet
        icon: b.iconUrl || 'Award', // Map iconUrl to icon for frontend compatibility
        iconUrl: b.iconUrl,
        effects: b.effects || [],
        isActive: b.isActive,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      message: 'Đã lấy danh sách badges thành công',
    };
  }

  async createBadge(body: any) {
    const code = body.code || body.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    
    // Only include fields that exist in HonoraryTitle model
    const createData: any = {
      code,
      name: body.name,
      description: body.description,
      isActive: body.isActive ?? true,
    };
    
    if (body.iconUrl !== undefined) createData.iconUrl = body.iconUrl;
    if (body.effects !== undefined) createData.effects = body.effects;

    const badge = await this.prisma.honoraryTitle.create({
      data: createData,
    });

    return {
      success: true,
      data: badge,
      message: 'Đã tạo badge thành công',
    };
  }

  async getActiveUsers(query: { limit?: number; timeRange?: string }) {
    const limit = Math.min(query.limit || 10, 50);
    const timeRange = query.timeRange || '7d';
    
    // Calculate date based on time range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get listening sessions and calculate total listening time per user
    const sessions = await this.prisma.listeningSession.findMany({
      where: {
        startedAt: { gte: startDate },
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        profile: true,
      },
    });

    // Aggregate listening time per user
    const userListeningTime = new Map<string, number>();
    const userChaptersCount = new Map<string, number>();
    const userStoriesCount = new Map<string, Set<string>>();

    sessions.forEach(session => {
      const userId = session.profileId;
      const validMinutes = Math.floor(session.validListeningSeconds / 60);
      
      userListeningTime.set(userId, (userListeningTime.get(userId) || 0) + validMinutes);
      userChaptersCount.set(userId, (userChaptersCount.get(userId) || 0) + 1);
      
      if (session.storyId) {
        if (!userStoriesCount.has(userId)) {
          userStoriesCount.set(userId, new Set());
        }
        userStoriesCount.get(userId)!.add(session.storyId);
      }
    });

    // Sort users by total listening time
    const sortedUsers = Array.from(userListeningTime.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    // Get user profiles with listening statistics
    const userIds = sortedUsers.map(([userId]) => userId);
    const profiles = await this.prisma.profile.findMany({
      where: {
        id: { in: userIds },
        status: 'ACTIVE',
      },
    });

    // Format user activity data
    const activeUsers = profiles.map(profile => {
      const totalMinutes = userListeningTime.get(profile.id) || 0;
      const totalHours = Math.round(totalMinutes / 60);
      const chaptersListened = userChaptersCount.get(profile.id) || 0;
      const storiesListened = userStoriesCount.get(profile.id)?.size || 0;
      
      // Calculate level based on listening hours
      const level = Math.floor(totalHours / 10) + 1;
      
      return {
        userId: profile.id,
        displayName: profile.displayName || profile.email?.split('@')[0] || 'Người dùng',
        avatarUrl: profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        level,
        activityPoints: totalMinutes,
        validListeningMinutes: totalMinutes,
        completedStories: storiesListened,
        listenHistoryCount: chaptersListened,
        helpfulReviews: 0,
        activeDays: Math.ceil(totalHours / 2), // Estimate active days
        rank: sortedUsers.findIndex(([id]) => id === profile.id) + 1,
        achievements: [
          totalHours > 100 ? 'Master Listener' : null,
          totalHours > 50 ? 'Regular Listener' : null,
          totalHours > 10 ? 'New Listener' : null,
        ].filter(Boolean),
      };
    });

    return activeUsers;
  }

  async updateBadge(id: string, body: any) {
    // Build update data object with only fields that exist in the database schema
    const updateData: any = {};
    
    // Only update fields that exist in HonoraryTitle model
    if (body.code !== undefined) updateData.code = body.code;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.iconUrl !== undefined) updateData.iconUrl = body.iconUrl;
    if (body.effects !== undefined) updateData.effects = body.effects;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const badge = await this.prisma.honoraryTitle.update({
      where: { id },
      data: updateData,
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

  // Comments Management
  async getComments(query: { status?: string; storyId?: string; page?: number; limit?: number }) {
    const where: any = {};
    
    if (query.status) {
      where.status = query.status;
    }
    
    if (query.storyId) {
      where.storyId = query.storyId;
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 200);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          profile: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          story: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    const formattedComments = comments.map((c) => ({
      id: c.id,
      storyId: c.storyId,
      storyTitle: c.story?.title || 'Unknown',
      userName: c.profile?.displayName || c.profile?.email?.split('@')[0] || 'Unknown',
      userEmail: c.profile?.email || '',
      content: c.content,
      rating: 0,
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      reportCount: 0,
      status: c.status === 'APPROVED' ? 'ACTIVE' : c.status === 'HIDDEN' ? 'HIDDEN' : 'FLAGGED',
      isPinned: false,
    }));

    return {
      success: true,
      data: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCommentStatus(id: string, status: string, reason?: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Không tìm thấy bình luận.',
      });
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: {
        status: status === 'ACTIVE' ? 'APPROVED' : status,
      },
    });

    return {
      success: true,
      message: 'Đã cập nhật trạng thái bình luận thành công',
      data: updated,
    };
  }

  async deleteComment(id: string, reason?: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Không tìm thấy bình luận.',
      });
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Đã xóa bình luận thành công',
    };
  }
}