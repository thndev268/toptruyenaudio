import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatorApplication, CreatorApplicationDocument } from './schemas/creator-application.schema';

@Injectable()
export class CreatorService {
  constructor(
    @InjectModel(CreatorApplication.name) private appModel: Model<CreatorApplicationDocument>,
  ) {}

  async submitApplication(userId: string, dto: any) {
    return { status: 'SUBMITTED', message: 'Hồ sơ Creator đã gửi thành công' };
  }

  async getMyApplication(userId: string) {
    return this.appModel.findOne({ userId }).exec();
  }
}
