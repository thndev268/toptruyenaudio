import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { IdempotencyRecord, IdempotencyRecordDocument } from './schemas/idempotency-record.schema';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectModel(IdempotencyRecord.name)
    private readonly idempotencyModel: Model<IdempotencyRecordDocument>,
  ) {}

  calculateHash(payload: any): string {
    const jsonStr = JSON.stringify(payload || {});
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  async processOrGetCached<T>(params: {
    actorId: string;
    operation: string;
    key: string;
    resourceId: string;
    payload: any;
    handler: () => Promise<{ status: number; body: T }>;
    ttlDays?: number;
  }): Promise<{ status: number; body: T; fromCache: boolean }> {
    const { actorId, operation, key, resourceId, payload, handler, ttlDays = 7 } = params;

    const requestHash = this.calculateHash(payload);

    // 1. Check existing record
    const existing = await this.idempotencyModel
      .findOne({ actorId, operation, key })
      .exec();

    if (existing) {
      if (existing.requestHash === requestHash) {
        return {
          status: existing.responseStatus,
          body: existing.responseBody as T,
          fromCache: true,
        };
      } else {
        throw new ConflictException({
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key đã được sử dụng cho giao dịch khác hoặc dữ liệu gửi lên không khớp.',
        });
      }
    }

    // 2. Execute handler
    const result = await handler();

    // 3. Save idempotency record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    try {
      await this.idempotencyModel.create({
        key,
        actorId,
        operation,
        resourceId,
        requestHash,
        responseStatus: result.status,
        responseBody: result.body,
        expiresAt,
      });
    } catch (err: any) {
      // Catch MongoDB duplicate key error (11000) for race condition
      if (err.code === 11000 || err.message?.includes('E11000')) {
        const raced = await this.idempotencyModel.findOne({ actorId, operation, key }).exec();
        if (raced && raced.requestHash === requestHash) {
          return {
            status: raced.responseStatus,
            body: raced.responseBody as T,
            fromCache: true,
          };
        } else {
          throw new ConflictException({
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'Idempotency-Key đã được sử dụng cho giao dịch khác.',
          });
        }
      }
      throw err;
    }

    return {
      status: result.status,
      body: result.body,
      fromCache: false,
    };
  }
}
