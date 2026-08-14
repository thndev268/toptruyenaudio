import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PartnerApplication, PartnerApplicationDocument } from './schemas/partner-application.schema';

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(PartnerApplication.name) private appModel: Model<PartnerApplicationDocument>,
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
