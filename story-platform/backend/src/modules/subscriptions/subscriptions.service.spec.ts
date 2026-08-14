import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlanId, MembershipTier, SubscriptionStatus } from '../../common/enums';
import { ServiceUnavailableException, BadRequestException } from '@nestjs/common';

describe('SubscriptionsService Transaction & Plan Standards', () => {
  let service: SubscriptionsService;
  let mockSubscriptionModel: any;
  let mockPlanModel: any;
  let mockLedgerModel: any;
  let mockUserModel: any;
  let mockAuditLogs: any;
  let mockIdempotency: any;
  let mockConnection: any;

  beforeEach(() => {
    mockSubscriptionModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    mockPlanModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { id: SubscriptionPlanId.PREMIUM_MONTHLY, name: '1 Month' },
          { id: SubscriptionPlanId.PREMIUM_QUARTERLY, name: '3 Months' },
          { id: SubscriptionPlanId.PREMIUM_SEMIANNUAL, name: '6 Months' },
          { id: SubscriptionPlanId.PREMIUM_ANNUAL, name: '12 Months' },
        ]),
      }),
      updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };

    mockLedgerModel = {
      create: jest.fn().mockResolvedValue([{ _id: 'ledger_1' }]),
      find: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
    };

    mockAuditLogs = {
      log: jest.fn().mockResolvedValue({}),
    };

    mockIdempotency = {
      processOrGetCached: jest.fn().mockImplementation(async (params) => {
        const res = await params.handler();
        return { status: res.status, body: res.body, fromCache: false };
      }),
    };

    mockConnection = {
      startSession: jest.fn(),
    };

    service = new SubscriptionsService(
      mockSubscriptionModel,
      mockPlanModel,
      mockLedgerModel,
      mockUserModel,
      mockAuditLogs,
      mockIdempotency,
      mockConnection,
    );
  });

  it('throws 503 TRANSACTION_NOT_SUPPORTED when MongoDB does not support transactions', async () => {
    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'user_1', displayName: 'User One', version: 1 }),
    });

    mockSubscriptionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        userId: 'user_1',
        membershipTier: MembershipTier.FREE,
        status: SubscriptionStatus.NONE,
        version: 1,
      }),
    });

    // Mock startSession to simulate non-replica set Mongo error on withTransaction
    mockConnection.startSession.mockResolvedValue({
      withTransaction: jest.fn().mockRejectedValue({
        name: 'MongoServerError',
        code: 20,
        message: 'Transaction numbers are only allowed on a replica set member or mongos',
      }),
      endSession: jest.fn().mockResolvedValue({}),
    });

    await expect(
      service.grantPremium({
        userId: 'user_1',
        adminId: 'admin_1',
        planId: SubscriptionPlanId.PREMIUM_MONTHLY,
        reason: 'Testing transaction failure',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('converts legacy alias PREMIUM_SEMI_ANNUAL to PREMIUM_SEMIANNUAL and grants premium', async () => {
    const mockUser = {
      _id: 'user_1',
      displayName: 'User One',
      membershipTier: MembershipTier.FREE,
      version: 1,
      save: jest.fn().mockResolvedValue({}),
    };

    const mockSub: any = {
      userId: 'user_1',
      membershipTier: MembershipTier.FREE,
      status: SubscriptionStatus.NONE,
      planId: null,
      version: 1,
      save: jest.fn().mockResolvedValue({}),
    };

    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    });

    mockSubscriptionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockSub),
    });

    const mockSession = {
      withTransaction: jest.fn().mockImplementation(async (cb) => {
        await cb();
      }),
      endSession: jest.fn().mockResolvedValue({}),
    };

    mockConnection.startSession.mockResolvedValue(mockSession);

    const res = await service.grantPremium({
      userId: 'user_1',
      adminId: 'admin_1',
      planId: 'PREMIUM_SEMI_ANNUAL' as any, // Legacy alias
      reason: 'Testing alias conversion',
    });

    expect(res.success).toBe(true);
    expect(mockSub.planId).toBe(SubscriptionPlanId.PREMIUM_SEMIANNUAL);
    expect(mockSub.membershipTier).toBe(MembershipTier.PREMIUM);
  });
});
