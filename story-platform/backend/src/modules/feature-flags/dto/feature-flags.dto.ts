import { IsBoolean, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateFeatureFlagDto {
  @ApiProperty({ example: true, description: 'Trạng thái bật/tắt của tính năng' })
  @IsBoolean({ message: 'Trạng thái bật/tắt phải là kiểu boolean.' })
  @IsNotEmpty({ message: 'Trạng thái bật/tắt không được để trống.' })
  isEnabled: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Phiên bản kỳ vọng để chống xung đột (Optimistic Lock)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expectedVersion?: number;
}
