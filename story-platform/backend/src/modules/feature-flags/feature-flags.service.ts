import {
  Injectable,
  ConflictException,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeatureFlag, FeatureFlagDocument } from './schemas/feature-flag.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectModel(FeatureFlag.name) private readonly featureFlagModel: Model<FeatureFlagDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async seedDefaultFlags() {
    const defaults = [
      {
        key: 'premiumEnabled',
        name: 'Hệ Thống Gói Cước Premium',
        descriptionVi: 'Cho phép hiển thị và kích hoạt quyền nghe truyện Premium',
        category: 'PREMIUM',
        isEnabled: true,
        isLocked: false,
      },
      {
        key: 'commentsEnabled',
        name: 'Bình Luận & Đánh Giá Audio',
        descriptionVi: 'Bật tính năng gửi bình luận và đánh giá trên từng bộ truyện',
        category: 'COMMUNITY',
        isEnabled: true,
        isLocked: false,
      },
      {
        key: 'creatorApplicationsEnabled',
        name: 'Đăng Ký Giọng Đọc Creator',
        descriptionVi: 'Mở cổng nộp đơn đăng ký làm Giọng đọc / Creator',
        category: 'CREATOR',
        isEnabled: true,
        isLocked: false,
      },
      {
        key: 'earlyAccessEnabled',
        name: 'Nghe Trước Tập Mới (Early Access)',
        descriptionVi: 'Cho phép thành viên Premium nghe trước các tập mới phát hành',
        category: 'AUDIO',
        isEnabled: true,
        isLocked: false,
      },
      {
        key: 'playlistsEnabled',
        name: 'Danh Sách Phát Cá Nhân (Playlists)',
        descriptionVi: 'Cho phép người dùng tạo và quản lý playlist phát audio',
        category: 'AUDIO',
        isEnabled: true,
        isLocked: false,
      },
      {
        key: 'maintenanceBannerEnabled',
        name: 'Thông Báo Bảo Trì Hệ Thống',
        descriptionVi: 'Hiển thị thanh thông báo bảo trì trên giao diện website',
        category: 'SYSTEM',
        isEnabled: false,
        isLocked: false,
      },
      {
        key: 'referralsEnabled',
        name: 'Chương Trình Giới Thiệu (Referrals)',
        descriptionVi: 'Tính năng tiếp thị liên kết & giới thiệu bạn bè (Đã bị khóa ở giai đoạn hiện tại)',
        category: 'MARKETING',
        isEnabled: false,
        isLocked: true, // Permanent Lock in Phase 1
      },
    ];

    for (const flag of defaults) {
      await this.featureFlagModel.updateOne({ key: flag.key }, { $setOnInsert: flag }, { upsert: true }).exec();
    }
  }

  async getAllFlags() {
    const flags = await this.featureFlagModel.find().exec();
    if (!flags || flags.length === 0) {
      await this.seedDefaultFlags();
      return this.featureFlagModel.find().exec();
    }
    return flags.map((f) => this.formatFlag(f));
  }

  async updateFlag(params: {
    key: string;
    isEnabled: boolean;
    expectedVersion?: number;
    adminId: string;
    requestId?: string;
  }) {
    const { key, isEnabled, expectedVersion, adminId, requestId } = params;

    const flag = await this.featureFlagModel.findOne({ key }).exec();
    if (!flag) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Feature flag "${key}" không tồn tại.`,
      });
    }

    // Locked feature flag constraint (referrals)
    if (flag.isLocked || flag.key === 'referralsEnabled') {
      if (isEnabled === true) {
        throw new UnprocessableEntityException({
          code: 'FEATURE_FLAG_LOCKED',
          message: 'Tính năng Giới thiệu (referralsEnabled) bị khóa ở giai đoạn hiện tại và không thể bật.',
        });
      }
    }

    // Optimistic Version Lock Check
    if (expectedVersion !== undefined && flag.version !== expectedVersion) {
      throw new ConflictException({
        code: 'FEATURE_FLAG_VERSION_CONFLICT',
        message: 'Cấu hình Feature Flag đã bị thay đổi bởi thao tác khác. Vui lòng tải lại dữ liệu.',
      });
    }

    flag.isEnabled = isEnabled;
    flag.version += 1;
    (flag as any).lastModifiedByAdminId = new Types.ObjectId(adminId);
    await flag.save();

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'FEATURE_FLAG_UPDATED',
      resource: 'FeatureFlag',
      resourceId: flag.key,
      entityName: flag.name,
      reason: `Thay đổi trạng thái ${flag.key} thành ${isEnabled}`,
      requestId,
      metadata: { key: flag.key, isEnabled, newVersion: flag.version },
    });

    return this.formatFlag(flag);
  }

  private formatFlag(flag: FeatureFlagDocument) {
    return {
      key: flag.key,
      name: flag.name,
      descriptionVi: flag.descriptionVi,
      category: flag.category,
      isEnabled: flag.isEnabled,
      isLocked: flag.isLocked,
      version: flag.version,
      updatedAt: (flag as any).updatedAt ? (flag as any).updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
