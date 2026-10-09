import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SubscriptionPlanId } from '../../../common/enums';

export class GrantPremiumDto {
  @ApiProperty({ enum: SubscriptionPlanId, example: SubscriptionPlanId.PREMIUM_SEMIANNUAL, description: 'Mã gói cước Premium' })
  @IsEnum(SubscriptionPlanId, { message: 'Gói cước Premium không hợp lệ.' })
  planId: SubscriptionPlanId;

  @ApiProperty({ example: 'Khách hàng VIP nhận ưu đãi đặc biệt', description: 'Lý do cấp/gia hạn Premium' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do cấp/gia hạn Premium không được để trống.' })
  reason: string;

  @ApiPropertyOptional({ example: 1, description: 'Phiên bản kỳ vọng để tránh ghi đè (Optimistic Concurrency)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expectedVersion?: number;
}

export class RevokePremiumDto {
  @ApiProperty({ example: 'Phát hiện hủy đơn gian lận', description: 'Lý do thu hồi quyền Premium' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do thu hồi Premium không được để trống.' })
  reason: string;
}
