import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RefreshSession, RefreshSessionDocument } from '../auth/schemas/refresh-session.schema';
import { UserSubscription, UserSubscriptionDocument } from '../subscriptions/schemas/user-subscription.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AccountStatus, AccountRole } from '../../common/enums';
import { QueryUsersDto, UserMutationDto } from './dto/admin-users.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshSession.name) private readonly refreshSessionModel: Model<RefreshSessionDocument>,
    @InjectModel(UserSubscription.name) private readonly subscriptionModel: Model<UserSubscriptionDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getUsers(queryDto: QueryUsersDto) {
    const query: any = {};

    // Filtering by search term (displayName, email, or _id)
    if (queryDto.search) {
      const term = queryDto.search.trim();
      const isObjectId = Types.ObjectId.isValid(term);

      if (isObjectId) {
        query.$or = [{ _id: new Types.ObjectId(term) }, { emailNormalized: new RegExp(term, 'i') }, { displayName: new RegExp(term, 'i') }];
      } else {
        query.$or = [{ emailNormalized: new RegExp(term, 'i') }, { displayName: new RegExp(term, 'i') }];
      }
    }

    if (queryDto.status) query.status = queryDto.status;
    if (queryDto.membershipTier) query.membershipTier = queryDto.membershipTier;
    if (queryDto.role) query.role = queryDto.role;

    if (queryDto.startDate || queryDto.endDate) {
      query.createdAt = {};
      if (queryDto.startDate) query.createdAt.$gte = new Date(queryDto.startDate);
      if (queryDto.endDate) query.createdAt.$lte = new Date(queryDto.endDate);
    }

    const page = queryDto.page || 1;
    const limit = Math.min(queryDto.limit || 20, 100);
    const skip = (page - 1) * limit;

    const sortField = queryDto.sortBy || 'createdAt';
    const sortDirection = queryDto.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return {
      items: users.map((u) => this.formatUser(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Mã người dùng không hợp lệ.' });
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    const subscription = await this.subscriptionModel.findOne({ userId: user._id }).exec();

    return {
      user: this.formatUser(user),
      subscription: subscription || {
        membershipTier: user.membershipTier,
        status: 'NONE',
        autoRenew: false,
      },
    };
  }

  async suspendUser(userId: string, adminId: string, dto: UserMutationDto, requestId?: string) {
    // Prohibit self-suspension
    if (userId === adminId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Tài khoản Quản trị tối cao (OWNER_ADMIN) không thể tự tạm khóa chính mình.',
      });
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    if (user.role === AccountRole.OWNER_ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Không thể tạm khóa tài khoản Quản trị tối cao.',
      });
    }

    if (dto.expectedVersion !== undefined && user.version !== dto.expectedVersion) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Hồ sơ người dùng đã bị sửa đổi bởi thao tác khác. Vui lòng làm mới trang.',
      });
    }

    user.status = AccountStatus.SUSPENDED;
    user.suspendedAt = new Date();
    user.suspendedReason = dto.reason;
    user.version += 1;
    await user.save();

    // Revoke all refresh token sessions
    await this.refreshSessionModel.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: `ACCOUNT_SUSPENDED: ${dto.reason}` },
    );

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'USER_SUSPENDED',
      resource: 'User',
      resourceId: user._id.toString(),
      entityName: user.displayName,
      reason: dto.reason,
      requestId,
    });

    return this.formatUser(user);
  }

  async unsuspendUser(userId: string, adminId: string, dto: UserMutationDto, requestId?: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    if (dto.expectedVersion !== undefined && user.version !== dto.expectedVersion) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Hồ sơ người dùng đã bị sửa đổi bởi thao tác khác. Vui lòng làm mới trang.',
      });
    }

    user.status = AccountStatus.ACTIVE;
    user.suspendedAt = undefined;
    user.suspendedReason = undefined;
    user.version += 1;
    await user.save();

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'USER_UNSUSPENDED',
      resource: 'User',
      resourceId: user._id.toString(),
      entityName: user.displayName,
      reason: dto.reason,
      requestId,
    });

    return this.formatUser(user);
  }

  async revokeUserSessions(userId: string, adminId: string, dto: UserMutationDto, requestId?: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
    }

    await this.refreshSessionModel.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: `ADMIN_REVOKED: ${dto.reason}` },
    );

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'USER_SESSIONS_REVOKED',
      resource: 'User',
      resourceId: user._id.toString(),
      entityName: user.displayName,
      reason: dto.reason,
      requestId,
    });

    return {
      success: true,
      message: `Đã thu hồi tất cả các phiên đăng nhập của người dùng ${user.displayName}.`,
    };
  }

  private formatUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      membershipTier: user.membershipTier,
      suspendedReason: user.suspendedReason,
      suspendedAt: user.suspendedAt ? user.suspendedAt.toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: (user as any).createdAt ? (user as any).createdAt.toISOString() : new Date().toISOString(),
      version: user.version,
    };
  }
}
