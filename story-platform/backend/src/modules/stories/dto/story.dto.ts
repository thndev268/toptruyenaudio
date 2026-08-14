import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { StoryStatus, PublishStatus, AgeRating } from '../../../common/enums';

export class CreateStoryDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  summary: string;

  @IsString()
  authorName: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsArray()
  genreIds?: string[];

  @IsOptional()
  @IsEnum(StoryStatus)
  storyStatus?: StoryStatus;

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;

  @IsOptional()
  @IsEnum(AgeRating)
  ageRating?: AgeRating;
}

export class UpdateStoryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsArray()
  genreIds?: string[];

  @IsOptional()
  @IsEnum(StoryStatus)
  storyStatus?: StoryStatus;

  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;

  @IsOptional()
  @IsEnum(AgeRating)
  ageRating?: AgeRating;
}
