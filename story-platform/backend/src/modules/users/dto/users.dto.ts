import { IsString, IsOptional, MinLength, MaxLength, Matches, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountRole, MembershipTier, SubscriptionStatus, AccountStatus, SubscriptionPlanId } from '../../../common/enums';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Tên hiển thị (2-60 ký tự)' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên hiển thị phải có ít nhất 2 ký tự.' })
  @MaxLength(60, { message: 'Tên hiển thị tối đa 60 ký tự.' })
  displayName?: string;

  @ApiPropertyOptional({ example: 'user_a', description: 'Tên người dùng (chỉ chữ cái, số, gạch dưới)' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Tên người dùng phải có ít nhất 3 ký tự.' })
  @MaxLength(30, { message: 'Tên người dùng tối đa 30 ký tự.' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Tên người dùng chỉ được chứa chữ cái, chữ số và dấu gạch dưới (_).' })
  username?: string;

  @ApiPropertyOptional({ example: '/api/v1/users/avatars/avatar_123.jpg', description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 1, description: 'Phiên bản kỳ vọng để kiểm tra optimistic concurrency' })
  @IsOptional()
  @IsNumber({}, { message: 'Phiên bản kỳ vọng phải là chữ số.' })
  expectedVersion?: number;
}

export class ChangeMyPasswordDto {
  @ApiProperty({ example: 'OldPass123!', description: 'Mật khẩu hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống.' })
  @MinLength(1, { message: 'Mật khẩu hiện tại phải có ít nhất 1 ký tự.' })
  currentPassword: string;

  @ApiProperty({ example: 'NewPass123!', description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
  newPassword: string;

  @ApiPropertyOptional({ example: 'NewPass123!', description: 'Xác nhận mật khẩu mới' })
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}

export interface UserProfileMembership {
  tier: MembershipTier;
  subscriptionStatus: SubscriptionStatus;
  planId?: SubscriptionPlanId;
  startedAt?: string;
  expiresAt?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  role: AccountRole;
  accountStatus: AccountStatus;
  membership: UserProfileMembership;
  createdAt: string;
  updatedAt: string;
  version: number;
}
