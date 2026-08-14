import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserProfile, UserProfileDocument } from './schemas/user-profile.schema';
import { UserSubscription, UserSubscriptionDocument } from '../subscriptions/schemas/user-subscription.schema';
import { RefreshSession, RefreshSessionDocument } from '../auth/schemas/refresh-session.schema';
import { PasswordHasherService } from '../../common/services/password-hasher.service';
import { AccountRole, AccountStatus, MembershipTier, SubscriptionStatus } from '../../common/enums';
import { UpdateMyProfileDto, ChangeMyPasswordDto, UserProfileResponse } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfileDocument>,
    @InjectModel(UserSubscription.name) private readonly subscriptionModel: Model<UserSubscriptionDocument>,
    @InjectModel(RefreshSession.name) private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ emailNormalized: email.trim().toLowerCase() }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async getUserProfileResponse(userId: string): Promise<UserProfileResponse> {
    const user = await this.userModel.findById(userId).exec();
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

    const subscription = await this.subscriptionModel.findOne({ userId: user._id as any }).exec();

    return this.buildUserProfileResponse(user, subscription);
  }

  async updateProfile(userId: string, dto: UpdateMyProfileDto): Promise<UserProfileResponse> {
    const user = await this.userModel.findById(userId).exec();
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

    // Check optimistic concurrency version conflict
    if (dto.expectedVersion !== undefined && user.version !== dto.expectedVersion) {
      throw new ConflictException({
        code: 'PROFILE_VERSION_CONFLICT',
        message: 'Dữ liệu hồ sơ đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại trang.',
      });
    }

    let modified = false;

    if (dto.displayName !== undefined) {
      const trimmed = dto.displayName.trim();
      if (trimmed.length < 2 || trimmed.length > 60) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Tên hiển thị phải dài từ 2 đến 60 ký tự.',
        });
      }
      user.displayName = trimmed;
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
        const existing = await this.userModel.findOne({
          username: trimmedUsername,
          _id: { $ne: user._id },
        }).exec();

        if (existing) {
          throw new ConflictException({
            code: 'USERNAME_ALREADY_EXISTS',
            message: 'Tên người dùng này đã được người khác sử dụng.',
          });
        }
        user.username = trimmedUsername;
        modified = true;
      }
    }

    if (modified) {
      user.version += 1;
      await user.save();
    }

    return this.getUserProfileResponse(userId);
  }

  async changePassword(userId: string, dto: ChangeMyPasswordDto): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).exec();
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

    const isMatch = await this.passwordHasher.verify(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'CURRENT_PASSWORD_INCORRECT',
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }

    const isSamePassword = await this.passwordHasher.verify(dto.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ConflictException({
        code: 'PASSWORD_REUSE_NOT_ALLOWED',
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      });
    }

    user.passwordHash = await this.passwordHasher.hash(dto.newPassword);
    user.passwordChangedAt = new Date();
    user.version += 1;
    await user.save();

    // Revoke all refresh sessions for this user across all devices
    await this.refreshSessionModel.updateMany(
      { userId: user._id as any, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'PASSWORD_CHANGED' },
    );

    return { message: 'Đổi mật khẩu thành công. Tất cả phiên đăng nhập khác đã được thu hồi.' };
  }

  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserProfileResponse> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản người dùng.',
      });
    }

    user.avatarUrl = avatarUrl || undefined;
    user.version += 1;
    await user.save();

    return this.getUserProfileResponse(userId);
  }

  buildUserProfileResponse(user: UserDocument, subscription: UserSubscriptionDocument | null): UserProfileResponse {
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
      id: user._id.toString(),
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
      createdAt: (user as any).createdAt ? (user as any).createdAt.toISOString() : serverNow.toISOString(),
      updatedAt: (user as any).updatedAt ? (user as any).updatedAt.toISOString() : serverNow.toISOString(),
      version: user.version,
    };
  }
}
