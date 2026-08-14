import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { UserSubscription, UserSubscriptionDocument } from './schemas/user-subscription.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from './schemas/subscription-plan.schema';
import { PremiumGrantLedger, PremiumGrantLedgerDocument } from './schemas/premium-grant-ledger.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { calculateSubscriptionExpiry, PLAN_DURATION_MONTHS_MAP } from './utils/subscription-expiry.calculator';
import {
  SubscriptionPlanId,
  SubscriptionStatus,
  MembershipTier,
  SubscriptionSource,
} from '../../common/enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(UserSubscription.name) private readonly subscriptionModel: Model<UserSubscriptionDocument>,
    @InjectModel(SubscriptionPlan.name) private readonly planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(PremiumGrantLedger.name) private readonly ledgerModel: Model<PremiumGrantLedgerDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly auditLogsService: AuditLogsService,
    private readonly idempotencyService: IdempotencyService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async seedDefaultPlans() {
    const defaultPlans = [
      {
        id: SubscriptionPlanId.PREMIUM_MONTHLY,
        name: 'Premium Tháng',
        durationDays: 30,
        priceVnd: 59000,
        benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
      },
      {
        id: SubscriptionPlanId.PREMIUM_QUARTERLY,
        name: 'Premium 3 Tháng',
        durationDays: 90,
        priceVnd: 150000,
        originalPriceVnd: 177000,
        savingsVnd: 27000,
        benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
      },
      {
        id: SubscriptionPlanId.PREMIUM_SEMIANNUAL,
        name: 'Premium 6 Tháng',
        durationDays: 180,
        priceVnd: 270000,
        originalPriceVnd: 354000,
        savingsVnd: 84000,
        isRecommended: true,
        benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
      },
      {
        id: SubscriptionPlanId.PREMIUM_ANNUAL,
        name: 'Premium 12 Tháng',
        durationDays: 365,
        priceVnd: 480000,
        originalPriceVnd: 708000,
        savingsVnd: 228000,
        isBestDeal: true,
        benefits: ['AD_FREE', 'HIGH_QUALITY_AUDIO', 'PREMIUM_CATALOG', 'EARLY_ACCESS', 'UNLIMITED_PLAYLISTS', 'PREMIUM_COMMENT_BADGE', 'PRIORITY_SUPPORT'],
      },
    ];

    for (const plan of defaultPlans) {
      await this.planModel.updateOne({ id: plan.id }, { $setOnInsert: plan }, { upsert: true }).exec();
    }
  }

  async getPlans() {
    const plans = await this.planModel.find().exec();
    if (!plans || plans.length === 0) {
      await this.seedDefaultPlans();
      return this.planModel.find().exec();
    }
    return plans;
  }

  async getUserSubscription(userId: string) {
    let sub = await this.subscriptionModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!sub) {
      sub = await this.subscriptionModel.create({
        userId: new Types.ObjectId(userId),
        membershipTier: MembershipTier.FREE,
        status: SubscriptionStatus.NONE,
        autoRenew: false,
      });
    }

    // Check if subscription has expired based on server time
    const now = new Date();
    if (sub.status === SubscriptionStatus.ACTIVE && sub.expiresAt && sub.expiresAt < now) {
      sub.status = SubscriptionStatus.EXPIRED;
      sub.membershipTier = MembershipTier.FREE;
      await sub.save();

      await this.userModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        { membershipTier: MembershipTier.FREE },
      );
    }

    return sub;
  }

  async grantPremium(params: {
    userId: string;
    adminId: string;
    planId: SubscriptionPlanId;
    reason: string;
    idempotencyKey?: string;
    expectedVersion?: number;
    requestId?: string;
  }) {
    const { userId, adminId, planId, reason, idempotencyKey, expectedVersion, requestId } = params;

    let normalizedPlanId = planId;
    if ((planId as string) === 'PREMIUM_SEMI_ANNUAL') {
      normalizedPlanId = SubscriptionPlanId.PREMIUM_SEMIANNUAL;
    }

    const effectiveKey = idempotencyKey || `ik_grant_${userId}_${normalizedPlanId}_${Date.now()}`;

    const executeGrant = async () => {
      // Resolve Plan
      const plans = await this.getPlans();
      const plan = plans.find((p) => p.id === normalizedPlanId || p.id === planId);
      if (!plan) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Gói cước Premium không hợp lệ.',
        });
      }

      // Resolve User
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Không tìm thấy người dùng.',
        });
      }

      if (expectedVersion !== undefined && user.version !== expectedVersion) {
        throw new ConflictException({
          code: 'VERSION_CONFLICT',
          message: 'Thông tin người dùng đã bị thay đổi bởi thao tác khác. Vui lòng làm mới trang.',
        });
      }

      // UTC Month calculation
      const serverNow = new Date();
      let currentSub = await this.subscriptionModel.findOne({ userId: user._id }).exec();
      if (!currentSub) {
        currentSub = new this.subscriptionModel({
          userId: user._id,
          membershipTier: MembershipTier.FREE,
          status: SubscriptionStatus.NONE,
        });
      }

      const previousExpiresAt = currentSub.expiresAt;
      let baseTime = serverNow;

      if (currentSub.status === SubscriptionStatus.ACTIVE && currentSub.expiresAt && currentSub.expiresAt > serverNow) {
        baseTime = currentSub.expiresAt;
      }

      const durationMonths = PLAN_DURATION_MONTHS_MAP[normalizedPlanId] || 1;
      const newExpiresAt = calculateSubscriptionExpiry(baseTime, durationMonths);

      const isExtend = currentSub.status === SubscriptionStatus.ACTIVE && currentSub.expiresAt && currentSub.expiresAt > serverNow;
      const actionType = isExtend ? 'EXTEND' : 'GRANT';

      // Transaction execution
      let session;
      try {
        session = await this.connection.startSession();
      } catch (err) {
        throw new ServiceUnavailableException({
          code: 'TRANSACTION_NOT_SUPPORTED',
          message: 'Hệ thống yêu cầu MongoDB Replica Set (Transactions) để thực hiện giao dịch này.',
        });
      }

      let resultLedger: any;

      try {
        await session.withTransaction(async () => {
          currentSub.membershipTier = MembershipTier.PREMIUM;
          currentSub.planId = plan.id;
          currentSub.status = SubscriptionStatus.ACTIVE;
          currentSub.source = SubscriptionSource.ADMIN_GRANT;
          if (!currentSub.startedAt || currentSub.status !== SubscriptionStatus.ACTIVE) {
            currentSub.startedAt = serverNow;
          }
          currentSub.expiresAt = newExpiresAt;
          currentSub.autoRenew = false;
          currentSub.version += 1;
          await currentSub.save({ session });

          user.membershipTier = MembershipTier.PREMIUM;
          user.version += 1;
          await user.save({ session });

          const ledgerEntries = await this.ledgerModel.create(
            [
              {
                idempotencyKey: effectiveKey,
                userId: user._id,
                action: actionType,
                planId: plan.id,
                grantedByAdminId: new Types.ObjectId(adminId),
                durationDays: Math.round((newExpiresAt.getTime() - baseTime.getTime()) / 86400000),
                previousExpiresAt,
                newExpiresAt,
                reason,
              },
            ],
            { session },
          );
          resultLedger = ledgerEntries[0];
        });
      } catch (e: any) {
        if (
          e instanceof ServiceUnavailableException ||
          e?.message?.includes('Transaction numbers are only allowed') ||
          e?.message?.includes('replica set') ||
          e?.codeName === 'TransactionNotSupported' ||
          (e?.name === 'MongoServerError' && e?.code === 20)
        ) {
          throw new ServiceUnavailableException({
            code: 'TRANSACTION_NOT_SUPPORTED',
            message: 'Hệ thống yêu cầu MongoDB Replica Set (Transactions) để thực hiện giao dịch này.',
          });
        }
        throw e;
      } finally {
        await session.endSession();
      }

      await this.auditLogsService.log({
        performedByAdminId: adminId,
        action: isExtend ? 'PREMIUM_EXTENDED' : 'PREMIUM_GRANTED',
        resource: 'UserSubscription',
        resourceId: user._id.toString(),
        entityName: user.displayName,
        reason,
        requestId,
        metadata: { planId: plan.id, durationMonths, newExpiresAt: newExpiresAt.toISOString() },
      });

      const responsePayload = {
        success: true,
        subscription: currentSub,
        user: {
          id: user._id.toString(),
          displayName: user.displayName,
          email: user.email,
          membershipTier: user.membershipTier,
        },
        ledger: resultLedger,
      };

      return { status: 200, body: responsePayload };
    };

    const idempotencyResult = await this.idempotencyService.processOrGetCached({
      actorId: adminId,
      operation: 'PREMIUM_GRANT',
      key: effectiveKey,
      resourceId: userId,
      payload: { userId, planId: normalizedPlanId, reason },
      handler: executeGrant,
    });

    return idempotencyResult.body;
  }

  async revokePremium(params: {
    userId: string;
    adminId: string;
    reason: string;
    idempotencyKey?: string;
    requestId?: string;
  }) {
    const { userId, adminId, reason, idempotencyKey, requestId } = params;
    const effectiveKey = idempotencyKey || `ik_revoke_${userId}_${Date.now()}`;

    const executeRevoke = async () => {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
      }

      const currentSub = await this.subscriptionModel.findOne({ userId: user._id }).exec();
      if (!currentSub || currentSub.status !== SubscriptionStatus.ACTIVE) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Người dùng hiện tại không có quyền Premium đang hoạt động.',
        });
      }

      const serverNow = new Date();
      const previousExpiresAt = currentSub.expiresAt;

      let session;
      try {
        session = await this.connection.startSession();
      } catch (err) {
        throw new ServiceUnavailableException({
          code: 'TRANSACTION_NOT_SUPPORTED',
          message: 'Hệ thống yêu cầu MongoDB Replica Set (Transactions) để thực hiện giao dịch này.',
        });
      }

      let ledger: any;

      try {
        await session.withTransaction(async () => {
          currentSub.membershipTier = MembershipTier.FREE;
          currentSub.status = SubscriptionStatus.CANCELLED;
          currentSub.cancelledAt = serverNow;
          currentSub.autoRenew = false;
          currentSub.version += 1;
          await currentSub.save({ session });

          user.membershipTier = MembershipTier.FREE;
          user.version += 1;
          await user.save({ session });

          const ledgerEntries = await this.ledgerModel.create(
            [
              {
                idempotencyKey: effectiveKey,
                userId: user._id,
                action: 'REVOKE',
                planId: currentSub.planId,
                grantedByAdminId: new Types.ObjectId(adminId),
                durationDays: 0,
                previousExpiresAt,
                newExpiresAt: serverNow,
                reason,
              },
            ],
            { session },
          );
          ledger = ledgerEntries[0];
        });
      } catch (e: any) {
        if (
          e instanceof ServiceUnavailableException ||
          e?.message?.includes('Transaction numbers are only allowed') ||
          e?.message?.includes('replica set') ||
          e?.codeName === 'TransactionNotSupported' ||
          (e?.name === 'MongoServerError' && e?.code === 20)
        ) {
          throw new ServiceUnavailableException({
            code: 'TRANSACTION_NOT_SUPPORTED',
            message: 'Hệ thống yêu cầu MongoDB Replica Set (Transactions) để thực hiện giao dịch này.',
          });
        }
        throw e;
      } finally {
        await session.endSession();
      }

      await this.auditLogsService.log({
        performedByAdminId: adminId,
        action: 'PREMIUM_REVOKED',
        resource: 'UserSubscription',
        resourceId: user._id.toString(),
        entityName: user.displayName,
        reason,
        requestId,
      });

      const responsePayload = {
        success: true,
        subscription: currentSub,
        user: {
          id: user._id.toString(),
          membershipTier: user.membershipTier,
        },
        ledger,
      };

      return { status: 200, body: responsePayload };
    };

    const idempotencyResult = await this.idempotencyService.processOrGetCached({
      actorId: adminId,
      operation: 'PREMIUM_REVOKE',
      key: effectiveKey,
      resourceId: userId,
      payload: { userId, reason },
      handler: executeRevoke,
    });

    return idempotencyResult.body;
  }

  async getGrantLedger(userId: string) {
    const ledger = await this.ledgerModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('grantedByAdminId', 'displayName email')
      .exec();

    return ledger.map((entry) => ({
      id: entry._id.toString(),
      idempotencyKey: entry.idempotencyKey,
      userId: entry.userId.toString(),
      action: entry.action,
      planId: entry.planId,
      grantedBy: (entry.grantedByAdminId as any)?.displayName || 'OWNER_ADMIN',
      durationDays: entry.durationDays,
      previousExpiresAt: entry.previousExpiresAt ? entry.previousExpiresAt.toISOString() : null,
      newExpiresAt: entry.newExpiresAt ? entry.newExpiresAt.toISOString() : null,
      reason: entry.reason,
      createdAt: (entry as any).createdAt ? (entry as any).createdAt.toISOString() : new Date().toISOString(),
    }));
  }
}
