import { IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AccountRole, AccountStatus, MembershipTier } from '../../../common/enums';

export class QueryUsersDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo tên, email hoặc ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AccountStatus, description: 'Lọc theo trạng thái' })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ enum: MembershipTier, description: 'Lọc theo gói FREE/PREMIUM' })
  @IsOptional()
  @IsEnum(MembershipTier)
  membershipTier?: MembershipTier;

  @ApiPropertyOptional({ enum: AccountRole, description: 'Lọc theo vai trò' })
  @IsOptional()
  @IsEnum(AccountRole)
  role?: AccountRole;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Trường sắp xếp (createdAt, lastLoginAt, displayName)' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Thứ tự sắp xếp' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại (bắt đầu từ 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Số lượng mục trên mỗi trang (1-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UserMutationDto {
  @ApiProperty({ example: 'Vi phạm quy tắc bình luận xúc phạm nhiều lần', description: 'Lý do thực hiện' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do thực hiện hành động.' })
  reason: string;

  @ApiPropertyOptional({ example: 1, description: 'Phiên bản kỳ vọng để chống ghi đè (Optimistic Locking)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expectedVersion?: number;
}
