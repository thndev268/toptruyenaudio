import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getMyWallet(ownerId: string) {
    return this.prisma.wallet.findFirst({ where: { profileId: ownerId } });
  }

  async requestWithdrawal(userId: string, dto: any) {
    return { status: 'PENDING', message: 'Yêu cầu rút tiền đã được tạo và chờ xét duyệt' };
  }
}
