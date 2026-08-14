import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RefreshSession, RefreshSessionDocument } from './schemas/refresh-session.schema';
import { UserSubscription, UserSubscriptionDocument } from '../subscriptions/schemas/user-subscription.schema';
import { AccountRole, AccountStatus, MembershipTier, SubscriptionStatus } from '../../common/enums';
import { RegisterDto, LoginDto, ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';
import { PasswordHasherService } from '../../common/services/password-hasher.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshSession.name) private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    @InjectModel(UserSubscription.name) private readonly subscriptionModel: Model<UserSubscriptionDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const emailNormalized = dto.email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ emailNormalized }).exec();
    if (existing) {
      throw new ConflictException({
        code: 'VALIDATION_ERROR',
        message: 'Email này đã được đăng ký trên hệ thống.',
        fields: { email: 'Email đã tồn tại' },
      });
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = new this.userModel({
      email: dto.email.trim(),
      emailNormalized,
      passwordHash,
      displayName: dto.displayName.trim(),
      role: AccountRole.USER,
      status: AccountStatus.ACTIVE,
      membershipTier: MembershipTier.FREE,
    });

    await user.save();

    // Create default subscription record
    await this.subscriptionModel.create({
      userId: user._id,
      membershipTier: MembershipTier.FREE,
      status: SubscriptionStatus.NONE,
      autoRenew: false,
    });

    // Sync to Supabase PostgreSQL database
    try {
      await this.prisma.profile.create({
        data: {
          id: user._id.toString(),
          email: user.email,
          emailNormalized: user.emailNormalized,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          membershipTier: user.membershipTier,
        }
      });
    } catch (prismaError) {
      console.error('Failed to sync user to Supabase PostgreSQL:', prismaError);
      // Continue even if sync fails, as MongoDB is the primary storage
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const emailNormalized = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ emailNormalized }).exec();

    // Generic error to prevent email enumeration
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    const isMatch = await this.passwordHasher.verify(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    // Automatic transparent rehash from legacy bcrypt to Argon2id
    if (this.passwordHasher.needsRehash(user.passwordHash)) {
      user.passwordHash = await this.passwordHasher.hash(dto.password);
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

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Mã làm mới phiên (Refresh Token) không được tìm thấy.',
      });
    }

    const tokenHash = await this.hashToken(refreshToken);
    const session = await this.refreshSessionModel.findOne({ tokenHash }).exec();

    if (!session) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Phiên đăng nhập không tồn tại hoặc đã hết hạn.',
      });
    }

    // Token reuse detection -> Revoke whole family!
    if (session.isRevoked) {
      await this.refreshSessionModel.updateMany(
        { familyId: session.familyId },
        { isRevoked: true, revokedAt: new Date(), revokedReason: 'TOKEN_REUSE_DETECTED' },
      );
      throw new ForbiddenException({
        code: 'REFRESH_TOKEN_REUSE',
        message: 'Cảnh báo an ninh: Phát hiện mã đăng nhập bị lạm dụng. Toàn bộ phiên làm việc đã bị thu hồi.',
      });
    }

    if (session.expiresAt < new Date()) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      session.revokedReason = 'EXPIRED';
      await session.save();
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }

    const user = await this.userModel.findById(session.userId).exec();
    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'USER_SUSPENDED',
        message: 'Tài khoản không hoạt động hoặc đã bị khóa.',
      });
    }

    // Rotate token
    session.isRevoked = true;
    session.revokedAt = new Date();
    session.revokedReason = 'ROTATED';
    await session.save();

    const newTokens = await this.generateTokens(user._id.toString(), user.email, user.role, session.familyId);

    return {
      user: this.sanitizeUser(user),
      tokens: newTokens,
    };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      const tokenHash = await this.hashToken(refreshToken);
      await this.refreshSessionModel.updateOne(
        { tokenHash },
        { isRevoked: true, revokedAt: new Date(), revokedReason: 'USER_LOGOUT' },
      );
    }
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.refreshSessionModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'LOGOUT_ALL' },
    );
    return { success: true };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Không tìm thấy người dùng.',
      });
    }

    const subscription = await this.subscriptionModel.findOne({ userId: user._id }).exec();

    return {
      user: this.sanitizeUser(user),
      subscription: subscription || {
        membershipTier: user.membershipTier,
        status: SubscriptionStatus.NONE,
        autoRenew: false,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Người dùng không tồn tại' });
    }

    if (dto.displayName) user.displayName = dto.displayName.trim();
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    user.version += 1;
    await user.save();

    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Người dùng không tồn tại' });
    }

    const isMatch = await this.passwordHasher.verify(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Mật khẩu hiện tại không chính xác.',
        fields: { oldPassword: 'Mật khẩu cũ không đúng' },
      });
    }

    user.passwordHash = await this.passwordHasher.hash(dto.newPassword);
    user.version += 1;
    await user.save();

    // Revoke all other refresh sessions after password change
    await this.logoutAll(userId);

    return { success: true, message: 'Đổi mật khẩu thành công. Tất cả phiên đăng nhập khác đã được thu hồi.' };
  }

  // Bootstrap single OWNER_ADMIN account via CLI command only
  async bootstrapOwnerAdmin(email: string, password: string, displayName: string = 'Chủ Sở Hữu (Owner Admin)') {
    const existingAdmin = await this.userModel.findOne({ role: AccountRole.OWNER_ADMIN }).exec();
    if (existingAdmin) {
      throw new ConflictException('Hệ thống đã tồn tại tài khoản OWNER_ADMIN. Không thể khởi tạo thêm tài khoản quản trị viên.');
    }

    const emailNormalized = email.trim().toLowerCase();
    const existingEmail = await this.userModel.findOne({ emailNormalized }).exec();
    if (existingEmail) {
      throw new ConflictException(`Email ${email} đã được sử dụng bởi tài khoản khác.`);
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const admin = new this.userModel({
      email: email.trim(),
      emailNormalized,
      passwordHash,
      displayName,
      role: AccountRole.OWNER_ADMIN,
      status: AccountStatus.ACTIVE,
      membershipTier: MembershipTier.PREMIUM,
    });

    await admin.save();

    await this.subscriptionModel.create({
      userId: admin._id,
      membershipTier: MembershipTier.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 100 * 365 * 86400000), // 100 years
      autoRenew: true,
    });

    return admin;
  }

  private async generateTokens(userId: string, email: string, role: string, existingFamilyId?: string) {
    const familyId = existingFamilyId || `fam_${Math.random().toString(36).substring(2, 10)}`;

    const accessSecret = this.configService.get<string>('jwt.accessSecret') || 'dev_access_secret_key_change_in_prod';
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'dev_refresh_secret_key_change_in_prod';

    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { secret: accessSecret, expiresIn: '15m' },
    );

    const refreshTokenRaw = `rt_${userId}_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    const tokenHash = await this.hashToken(refreshTokenRaw);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshSessionModel.create({
      userId: new Types.ObjectId(userId),
      familyId,
      tokenHash,
      isRevoked: false,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresInSeconds: 900, // 15 minutes
    };
  }

  private async hashToken(token: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  sanitizeUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      membershipTier: user.membershipTier,
      suspendedReason: user.suspendedReason,
      suspendedAt: user.suspendedAt ? user.suspendedAt.toISOString() : undefined,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
      createdAt: (user as any).createdAt ? (user as any).createdAt.toISOString() : new Date().toISOString(),
      version: user.version,
    };
  }
}
