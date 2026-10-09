import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, IsUrl } from 'class-validator';

export class CreateSocialLinkDto {
  @ApiProperty({ description: 'Platform name (INSTAGRAM, LINKEDIN, WHATSAPP, YOUTUBE, etc.)' })
  @IsString()
  platform: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Full URL to the social media page' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Optional custom icon URL', required: false })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({ description: 'Whether the link is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Display order', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateSocialLinkDto {
  @ApiProperty({ description: 'Platform name', required: false })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({ description: 'Display name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Full URL to the social media page', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url?: string;

  @ApiProperty({ description: 'Optional custom icon URL', required: false })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({ description: 'Whether the link is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Display order', required: false })
  @IsOptional()
  @IsInt()
  order?: number;
}
