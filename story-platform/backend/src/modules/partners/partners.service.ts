import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async applyForPartner(creatorId: string, dto: any) {
    return { status: 'SUBMITTED', message: 'Hồ sơ Đối tác đã được ghi nhận' };
  }

  async getDashboard(partnerId: string) {
    return {
      totalEarningsVnd: 0,
      activeCampaigns: 0,
      totalClicks: 0,
    };
  }
}
