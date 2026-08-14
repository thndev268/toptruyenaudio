import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly idempotencyService: IdempotencyService,
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
      const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id: plan.id } });
      if (!existing) {
        await this.prisma.subscriptionPlan.create({ data: plan as any });
      }
    }
  }

  async getPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany();
    if (!plans || plans.length === 0) {
      await this.seedDefaultPlans();
      return this.prisma.subscriptionPlan.findMany();
    }
    return plans;
  }

  async getUserSubscription(userId: string) {
    let sub = await this.prisma.userSubscription.findFirst({ where: { profileId: userId } });
    if (!sub) {
      sub = await this.prisma.userSubscription.create({
        data: {
          profileId: userId,
          membershipTier: MembershipTier.FREE,
          status: SubscriptionStatus.NONE,
          autoRenew: false,
        }
      });
    }

    // Check if subscription has expired based on server time
    const now = new Date();
    if (sub.status === SubscriptionStatus.ACTIVE && sub.expiresAt && sub.expiresAt < now) {
      sub = await this.prisma.userSubscription.update({
        where: { id: sub!.id },
        data: {
          status: SubscriptionStatus.EXPIRED,
          membershipTier: MembershipTier.FREE,
        }
      });

      await this.prisma.profile.update({
        where: { id: userId },
        data: { membershipTier: MembershipTier.FREE },
      });
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
      const user = await this.prisma.profile.findUnique({ where: { id: userId } });
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
      let currentSub = await this.prisma.userSubscription.findFirst({ where: { profileId: userId } });
      if (!currentSub) {
        currentSub = await this.prisma.userSubscription.create({
          data: {
            profileId: userId,
            membershipTier: MembershipTier.FREE,
            status: SubscriptionStatus.NONE,
          }
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
      let resultLedger: any;
      try {
        await this.prisma.$transaction(async (tx) => {
          currentSub = await tx.userSubscription.update({
            where: { id: currentSub!.id },
            data: {
              membershipTier: MembershipTier.PREMIUM,
              planId: plan.id,
              status: SubscriptionStatus.ACTIVE,
              source: SubscriptionSource.ADMIN_GRANT,
              startedAt: (!currentSub!.startedAt || currentSub!.status !== SubscriptionStatus.ACTIVE) ? serverNow : currentSub!.startedAt,
              expiresAt: newExpiresAt,
              autoRenew: false,
              version: { increment: 1 }
            }
          });

          await tx.profile.update({
            where: { id: userId },
            data: {
              membershipTier: MembershipTier.PREMIUM,
              version: { increment: 1 }
            }
          });

          resultLedger = await tx.premiumGrantLedger.create({
            data: {
              idempotencyKey: effectiveKey,
              profileId: userId,
              grantedBy: adminId,
              grantedByAdminId: adminId,
              reason: 'Admin grant premium',
              daysGranted: durationMonths * 30,
              action: actionType,
              planId: plan.id,
              durationDays: durationMonths * 30,
              previousExpiresAt,
              newExpiresAt,
            }
          });
        });
      } catch (e: any) {
        throw e;
      }

      await this.auditLogsService.log({
        performedByAdminId: adminId,
        action: isExtend ? 'PREMIUM_EXTENDED' : 'PREMIUM_GRANTED',
        resource: 'UserSubscription',
        resourceId: user.id,
        entityName: user.displayName || undefined,
        reason,
        requestId,
        metadata: { planId: plan.id, durationMonths, newExpiresAt: newExpiresAt.toISOString() },
      });

      const responsePayload = {
        success: true,
        subscription: currentSub,
        user: {
          id: user.id,
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
      const user = await this.prisma.profile.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy người dùng.' });
      }

      let currentSub = await this.prisma.userSubscription.findFirst({ where: { profileId: userId } });
      if (!currentSub || currentSub.status !== SubscriptionStatus.ACTIVE) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Người dùng hiện tại không có quyền Premium đang hoạt động.',
        });
      }

      const serverNow = new Date();
      const previousExpiresAt = currentSub.expiresAt;

      let ledger: any;

      try {
        await this.prisma.$transaction(async (tx) => {
          currentSub = await tx.userSubscription.update({
            where: { id: currentSub!.id },
            data: {
              membershipTier: MembershipTier.FREE,
              status: SubscriptionStatus.CANCELLED,
              cancelledAt: serverNow,
              autoRenew: false,
              version: { increment: 1 }
            }
          });

          await tx.profile.update({
            where: { id: userId },
            data: {
              membershipTier: MembershipTier.FREE,
              version: { increment: 1 }
            }
          });

          ledger = await tx.premiumGrantLedger.create({
            data: {
              idempotencyKey: effectiveKey,
              profileId: userId,
              grantedBy: adminId,
              grantedByAdminId: adminId,
              reason: reason || 'Revoke premium',
              daysGranted: 0,
              action: 'REVOKE',
              planId: currentSub!.planId,
              durationDays: 0,
              previousExpiresAt,
              newExpiresAt: serverNow,
            }
          });
        });
      } catch (e: any) {
        throw e;
      }

      await this.auditLogsService.log({
        performedByAdminId: adminId,
        action: 'PREMIUM_REVOKED',
        resource: 'UserSubscription',
        resourceId: user.id,
        entityName: user.displayName || undefined,
        reason,
        requestId,
        metadata: { previousExpiresAt: previousExpiresAt.toISOString() },
      });

      const responsePayload = {
        success: true,
        subscription: currentSub,
        user: {
          id: user.id,
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
    const ledger = await this.prisma.premiumGrantLedger.findMany({
      where: { profileId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return ledger.map((entry) => ({
      id: entry.id,
      idempotencyKey: entry.idempotencyKey,
      userId: entry.profileId,
      action: entry.action,
      planId: entry.planId,
      grantedBy: entry.grantedBy,
      durationDays: entry.durationDays,
      previousExpiresAt: entry.previousExpiresAt ? entry.previousExpiresAt.toISOString() : null,
      newExpiresAt: entry.newExpiresAt ? entry.newExpiresAt.toISOString() : null,
      reason: entry.reason,
      createdAt: entry.createdAt ? entry.createdAt.toISOString() : new Date().toISOString(),
    }));
  }
}
