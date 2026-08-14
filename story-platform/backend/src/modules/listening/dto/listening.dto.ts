import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ example: 'story-slug' })
  @IsString()
  @IsNotEmpty()
  storySlug: string;

  @ApiProperty({ example: 'chapter-slug' })
  @IsString()
  @IsNotEmpty()
  chapterSlug: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  startPosition?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  playbackRate?: number;
}

export class HeartbeatDto {
  @ApiProperty({ example: 45 })
  @IsNumber()
  @IsNotEmpty()
  currentPosition: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  playbackRate?: number;
}

export class UpsertListeningProgressDto {
  @ApiProperty({ example: 'story-id' })
  @IsString()
  @IsNotEmpty()
  storyId: string;

  @ApiProperty({ example: 45.5 })
  @IsNumber()
  @IsNotEmpty()
  positionSeconds: number;

  @ApiProperty({ example: 600.0 })
  @IsNumber()
  @IsNotEmpty()
  durationSeconds: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  completed: boolean;

  @ApiProperty({ example: 'AUDIO', enum: ['AUDIO', 'VIDEO'] })
  @IsString()
  @IsNotEmpty()
  playbackMode: 'AUDIO' | 'VIDEO';

  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @IsNotEmpty()
  playbackRate: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  version?: number;
}
