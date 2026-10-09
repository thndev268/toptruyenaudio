import { IdempotencyService } from './idempotency.service';
import { ConflictException } from '@nestjs/common';

describe('IdempotencyService', () => {
  let idempotencyService: IdempotencyService;
  let mockIdempotencyModel: any;

  beforeEach(() => {
    mockIdempotencyModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    idempotencyService = new IdempotencyService(mockIdempotencyModel);
  });

  it('should execute handler and store result on first call', async () => {
    mockIdempotencyModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockIdempotencyModel.create.mockResolvedValue({});

    const handler = jest.fn().mockResolvedValue({ status: 200, body: { success: true } });

    const result = await idempotencyService.processOrGetCached({
      actorId: 'admin_123',
      operation: 'PREMIUM_GRANT',
      key: 'ik_key_001',
      resourceId: 'user_456',
      payload: { planId: 'PREMIUM_MONTHLY' },
      handler,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.fromCache).toBe(false);
    expect(result.body).toEqual({ success: true });
    expect(mockIdempotencyModel.create).toHaveBeenCalled();
  });

  it('should return cached result on double-click with identical payload', async () => {
    const payload = { planId: 'PREMIUM_MONTHLY' };
    const requestHash = idempotencyService.calculateHash(payload);

    mockIdempotencyModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        requestHash,
        responseStatus: 200,
        responseBody: { success: true, isCached: true },
      }),
    });

    const handler = jest.fn();

    const result = await idempotencyService.processOrGetCached({
      actorId: 'admin_123',
      operation: 'PREMIUM_GRANT',
      key: 'ik_key_001',
      resourceId: 'user_456',
      payload,
      handler,
    });

    expect(handler).not.toHaveBeenCalled();
    expect(result.fromCache).toBe(true);
    expect(result.body).toEqual({ success: true, isCached: true });
  });

  it('should throw 409 IDEMPOTENCY_CONFLICT when key is reused with different payload', async () => {
    mockIdempotencyModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        requestHash: 'different_hash_value',
        responseStatus: 200,
        responseBody: { success: true },
      }),
    });

    const handler = jest.fn();

    await expect(
      idempotencyService.processOrGetCached({
        actorId: 'admin_123',
        operation: 'PREMIUM_GRANT',
        key: 'ik_key_001',
        resourceId: 'user_456',
        payload: { planId: 'PREMIUM_ANNUAL' }, // Different payload!
        handler,
      }),
    ).rejects.toThrow(ConflictException);

    expect(handler).not.toHaveBeenCalled();
  });
});
