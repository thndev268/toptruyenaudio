import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type BannerType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PROMOTION';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBanners(userId?: string) {
    const now = new Date();
    
    // Get all active banners
    const banners = await this.prisma.bannerNotification.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // If userId is provided, filter out banners that the user has dismissed
    if (userId) {
      const dismissedBanners = await this.prisma.userBannerDismissal.findMany({
        where: {
          userId,
          expiresAt: { gte: now }, // Only consider dismissals that haven't expired
        },
        select: { bannerId: true },
      });

      const dismissedBannerIds = new Set(dismissedBanners.map(d => d.bannerId));
      
      return banners.filter(banner => !dismissedBannerIds.has(banner.id));
    }

    return banners;
  }

  async dismissBanner(userId: string, bannerId: string) {
    const banner = await this.prisma.bannerNotification.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    // Calculate expiration time (3 hours from now)
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    // Create or update the dismissal record
    await this.prisma.userBannerDismissal.upsert({
      where: {
        bannerId_userId: {
          bannerId,
          userId,
        },
      },
      update: {
        dismissedAt: new Date(),
        expiresAt,
      },
      create: {
        bannerId,
        userId,
        dismissedAt: new Date(),
        expiresAt,
      },
    });

    return {
      success: true,
      message: 'Banner dismissed for 3 hours',
    };
  }

  async createBanner(body: {
    title: string;
    content: string;
    imageUrl?: string;
    type?: BannerType;
    backgroundColor?: string;
    textColor?: string;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    priority?: number;
    createdBy?: string;
  }) {
    const banner = await this.prisma.bannerNotification.create({
      data: {
        title: body.title,
        content: body.content,
        imageUrl: body.imageUrl,
        type: body.type || 'INFO',
        backgroundColor: body.backgroundColor || '#0f172a',
        textColor: body.textColor || '#ffffff',
        isActive: body.isActive !== undefined ? body.isActive : true,
        startDate: body.startDate,
        endDate: body.endDate,
        priority: body.priority || 0,
        createdBy: body.createdBy,
      },
    });

    return {
      success: true,
      data: banner,
      message: 'Banner created successfully',
    };
  }

  async updateBanner(bannerId: string, body: {
    title?: string;
    content?: string;
    imageUrl?: string;
    type?: BannerType;
    backgroundColor?: string;
    textColor?: string;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    priority?: number;
  }) {
    const banner = await this.prisma.bannerNotification.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    const updated = await this.prisma.bannerNotification.update({
      where: { id: bannerId },
      data: body,
    });

    return {
      success: true,
      data: updated,
      message: 'Banner updated successfully',
    };
  }

  async deleteBanner(bannerId: string) {
    const banner = await this.prisma.bannerNotification.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    await this.prisma.bannerNotification.delete({
      where: { id: bannerId },
    });

    // Also delete all dismissal records for this banner
    await this.prisma.userBannerDismissal.deleteMany({
      where: { bannerId },
    });

    return {
      success: true,
      message: 'Banner deleted successfully',
    };
  }

  async getAllBanners(query: {
    page?: number;
    limit?: number;
    type?: BannerType;
    isActive?: boolean;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [banners, total] = await Promise.all([
      this.prisma.bannerNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.bannerNotification.count({ where }),
    ]);

    return {
      success: true,
      data: banners,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBannerStats() {
    const [total, active, inactive] = await Promise.all([
      this.prisma.bannerNotification.count(),
      this.prisma.bannerNotification.count({ where: { isActive: true } }),
      this.prisma.bannerNotification.count({ where: { isActive: false } }),
    ]);

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
      },
    };
  }
}
