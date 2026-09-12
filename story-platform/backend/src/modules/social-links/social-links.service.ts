import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-links.dto';

@Injectable()
export class SocialLinksService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.socialMediaLink.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async getActive() {
    return this.prisma.socialMediaLink.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async create(dto: CreateSocialLinkDto) {
    // Check if platform already exists
    const existing = await this.prisma.socialMediaLink.findUnique({
      where: { platform: dto.platform },
    });

    if (existing) {
      throw new NotFoundException(`Platform ${dto.platform} already exists`);
    }

    return this.prisma.socialMediaLink.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateSocialLinkDto) {
    const link = await this.prisma.socialMediaLink.findUnique({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException('Social media link not found');
    }

    // If updating platform, check if it conflicts with existing
    if (dto.platform && dto.platform !== link.platform) {
      const existing = await this.prisma.socialMediaLink.findUnique({
        where: { platform: dto.platform },
      });

      if (existing) {
        throw new NotFoundException(`Platform ${dto.platform} already exists`);
      }
    }

    // Filter out undefined values
    const updateData: any = {};
    if (dto.platform !== undefined) updateData.platform = dto.platform;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.url !== undefined) updateData.url = dto.url;
    if (dto.iconUrl !== undefined) updateData.iconUrl = dto.iconUrl;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.order !== undefined) updateData.order = dto.order;

    return this.prisma.socialMediaLink.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const link = await this.prisma.socialMediaLink.findUnique({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException('Social media link not found');
    }

    return this.prisma.socialMediaLink.delete({
      where: { id },
    });
  }

  async toggle(id: string) {
    const link = await this.prisma.socialMediaLink.findUnique({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException('Social media link not found');
    }

    return this.prisma.socialMediaLink.update({
      where: { id },
      data: { isActive: !link.isActive },
    });
  }
}
