import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreatorService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async submitApplication(userId: string, dto: any) {
    return { status: 'SUBMITTED', message: 'Hồ sơ Creator đã gửi thành công' };
  }

  async getMyApplication(userId: string) {
    return this.prisma.creatorApplication.findFirst({ where: { profileId: userId } });
  }
}
