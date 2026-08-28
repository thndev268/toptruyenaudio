import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  storyId!: string;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsBoolean()
  hasSpoiler?: boolean;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsBoolean()
  hasSpoiler?: boolean;
}

export class GetCommentsDto {
  @IsOptional()
  @IsString()
  storyId?: string;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsString()
  filter?: 'ALL' | 'VERIFIED_ONLY' | 'HELPFUL' | 'NEWEST';

  @IsOptional()
  limit?: string;

  @IsOptional()
  offset?: string;
}
