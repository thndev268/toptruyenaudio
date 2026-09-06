import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordHasherService } from '../../common/services/password-hasher.service';
import { AccountRole, AccountStatus, MembershipTier, SubscriptionStatus } from '../../common/enums';
import { UpdateMyProfileDto, ChangeMyPasswordDto, UserProfileResponse } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.profile.findUnique({ where: { emailNormalized: email.trim().toLowerCase() } });
  }

  async findById(id: string) {
    return this.prisma.profile.findUnique({ where: { id } });
  }

  async getUserProfileResponse(userId: string): Promise<UserProfileResponse> {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy thông tin tài khoản người dùng.',
      });
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: 'USER_SUSPENDED',
        message: `Tài khoản của bạn đã bị tạm khóa. Lý do: ${user.suspendedReason || 'Vi phạm điều khoản'}.`,
      });
    }

    if (user.status === AccountStatus.DISABLED) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Tài khoản của bạn đã bị vô hiệu hóa.',
      });
    }

    const subscription = await this.prisma.userSubscription.findFirst({ where: { profileId: userId } });

    const response = this.buildUserProfileResponse(user, subscription);

    // Sync membershipTier in database if it differs from effective tier
    if (response.membership.tier !== user.membershipTier) {
      await this.prisma.profile.update({
        where: { id: userId },
        data: { membershipTier: response.membership.tier },
      });
    }

    return response;
  }

  async updateProfile(userId: string, dto: UpdateMyProfileDto): Promise<UserProfileResponse> {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản người dùng.',
      });
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: 'USER_SUSPENDED',
        message: 'Tài khoản của bạn đang bị tạm khóa.',
      });
    }

    // Check optimistic concurrency version conflict (only if expectedVersion is provided)
    if (dto.expectedVersion !== undefined && dto.expectedVersion !== null && user.version !== dto.expectedVersion) {
      throw new ConflictException({
        code: 'PROFILE_VERSION_CONFLICT',
        message: 'Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại trang.',
      });
    }

    const updateData: any = {};
    let modified = false;

    if (dto.displayName !== undefined) {
      const trimmed = dto.displayName.trim();
      if (trimmed.length < 2 || trimmed.length > 60) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Tên hiển thị phải dài từ 2 đến 60 ký tự.',
        });
      }
      updateData.displayName = trimmed;
      modified = true;
    }

    if (dto.username !== undefined) {
      const trimmedUsername = dto.username.trim().toLowerCase();
      if (trimmedUsername) {
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'Tên người dùng chỉ được chứa chữ cái, chữ số và dấu gạch dưới (_).',
          });
        }
        // Check uniqueness
        const existing = await this.prisma.profile.findFirst({
          where: {
            username: trimmedUsername,
            NOT: { id: userId },
          },
        });

        if (existing) {
          throw new ConflictException({
            code: 'USERNAME_ALREADY_EXISTS',
            message: 'Tên người dùng này đã được người khác sử dụng.',
          });
        }
        updateData.username = trimmedUsername;
        modified = true;
      }
    }

    if (dto.avatarUrl !== undefined) {
      const trimmedAvatarUrl = dto.avatarUrl.trim();
      updateData.avatarUrl = trimmedAvatarUrl || null;
      modified = true;
    }

    if (modified) {
      updateData.version = { increment: 1 };
      await this.prisma.profile.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return this.getUserProfileResponse(userId);
  }

  async changePassword(userId: string, dto: ChangeMyPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản người dùng.',
      });
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: 'USER_SUSPENDED',
        message: 'Tài khoản của bạn đang bị tạm khóa.',
      });
    }

    if (dto.confirmPassword !== undefined && dto.confirmPassword !== dto.newPassword) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Xác nhận mật khẩu mới không khớp.',
      });
    }

    const isMatch = await this.passwordHasher.verify(dto.currentPassword, user.passwordHash!);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'CURRENT_PASSWORD_INCORRECT',
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    const isSamePassword = await this.passwordHasher.verify(dto.newPassword, user.passwordHash!);
    if (isSamePassword) {
      throw new ConflictException({
        code: 'PASSWORD_REUSE_NOT_ALLOWED',
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      });
    }

    const newHash = await this.passwordHasher.hash(dto.newPassword);
    await this.prisma.profile.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Revoke all refresh sessions for this user across all devices
    await this.prisma.refreshSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date(), revokedReason: 'PASSWORD_CHANGED' },
    });

    return { message: 'Đổi mật khẩu thành công. Tất cả phiên đăng nhập khác đã được thu hồi.' };
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserProfileResponse> {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản người dùng.',
      });
    }

    await this.prisma.profile.update({
      where: { id: userId },
      data: {
        avatarUrl: avatarUrl || null,
        version: { increment: 1 },
      },
    });

    return this.getUserProfileResponse(userId);
  }

  buildUserProfileResponse(user: any, subscription: any | null): UserProfileResponse {
    const serverNow = new Date();

    const isPremiumActive =
      subscription &&
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.expiresAt &&
      new Date(subscription.expiresAt).getTime() > serverNow.getTime();

    const effectiveTier = isPremiumActive ? MembershipTier.PREMIUM : MembershipTier.FREE;
    let effectiveStatus = subscription?.status || SubscriptionStatus.NONE;

    if (subscription && subscription.status === SubscriptionStatus.ACTIVE && !isPremiumActive) {
      effectiveStatus = SubscriptionStatus.EXPIRED;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      username: user.username || undefined,
      avatarUrl: user.avatarUrl || undefined,
      role: user.role,
      accountStatus: user.status,
      membership: {
        tier: effectiveTier,
        subscriptionStatus: effectiveStatus,
        planId: isPremiumActive ? subscription?.planId : undefined,
        startedAt: isPremiumActive && subscription?.startedAt ? subscription.startedAt.toISOString() : undefined,
        expiresAt: isPremiumActive && subscription?.expiresAt ? subscription.expiresAt.toISOString() : undefined,
      },
      createdAt: user.createdAt ? user.createdAt.toISOString() : serverNow.toISOString(),
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : serverNow.toISOString(),
      version: user.version,
    };
  }
}
