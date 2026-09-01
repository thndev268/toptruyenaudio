import {
  Injectable,
  ConflictException,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
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
      {
        key: 'newUserNotificationEnabled',
        name: 'Thông Báo Thành Viên Mới',
        descriptionVi: 'Tự động tạo thông báo khi có thành viên mới đăng ký',
        category: 'NOTIFICATION',
        isEnabled: true,
        isLocked: false,
      },
    ];

    for (const flag of defaults) {
      await this.prisma.featureFlag.upsert({
        where: { key: flag.key },
        update: {},
        create: flag,
      });
    }
  }

  async getAllFlags() {
    const flags = await this.prisma.featureFlag.findMany();
    if (!flags || flags.length === 0) {
      await this.seedDefaultFlags();
      return this.prisma.featureFlag.findMany();
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

    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
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

    const updatedFlag = await this.prisma.featureFlag.update({
      where: { key },
      data: {
        isEnabled,
        version: { increment: 1 },
      },
    });

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'FEATURE_FLAG_UPDATED',
      resource: 'FeatureFlag',
      resourceId: updatedFlag.key,
      entityName: updatedFlag.name || '',
      reason: `Thay đổi trạng thái ${updatedFlag.key} thành ${isEnabled}`,
      requestId,
      metadata: { key: updatedFlag.key, isEnabled, newVersion: updatedFlag.version },
    });

    return this.formatFlag(updatedFlag);
  }

  private formatFlag(flag: any) {
    return {
      key: flag.key,
      name: flag.name,
      descriptionVi: flag.descriptionVi,
      category: flag.category,
      isEnabled: flag.isEnabled,
      isLocked: flag.isLocked,
      version: flag.version,
      updatedAt: flag.updatedAt ? flag.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
