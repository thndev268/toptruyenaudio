import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { SupportCategory, SupportStatus, SupportPriority } from '../schemas/support-conversation.schema';

export class CreateConversationDto {
  @ApiProperty({ example: 'Yêu cầu kiểm tra gói Premium' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiPropertyOptional({ enum: ['ACCOUNT', 'PREMIUM', 'AUDIO', 'CONTENT', 'TECHNICAL', 'OTHER'], default: 'OTHER' })
  @IsOptional()
  @IsEnum(['ACCOUNT', 'PREMIUM', 'AUDIO', 'CONTENT', 'TECHNICAL', 'OTHER'])
  category?: SupportCategory;

  @ApiProperty({ example: 'Tôi đã thanh toán nhưng chưa nâng cấp Premium.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ enum: ['NORMAL', 'HIGH'], default: 'NORMAL' })
  @IsOptional()
  @IsEnum(['NORMAL', 'HIGH'])
  priority?: SupportPriority;
}

export class CreateMessageDto {
  @ApiProperty({ example: 'Cảm ơn admin đã phản hồi.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  content: string;

  @ApiPropertyOptional({ example: 'client-msg-123' })
  @IsOptional()
  @IsString()
  clientMessageId?: string;
}

export class UpdateSupportStatusDto {
  @ApiProperty({ enum: ['OPEN', 'WAITING_FOR_ADMIN', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'] })
  @IsEnum(['OPEN', 'WAITING_FOR_ADMIN', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'])
  status: SupportStatus;

  @ApiPropertyOptional({ example: 'Đã xử lý xong vấn đề của người dùng' })
  @IsOptional()
  @IsString()
  reason?: string;
}
