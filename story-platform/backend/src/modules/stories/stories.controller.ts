import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Public Stories & Readers')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các bộ truyện công khai' })
  async getPublicStories(@Query() query: any) {
    return this.storiesService.findAllPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một bộ truyện theo Slug' })
  async getStoryDetails(@Param('slug') slug: string) {
    return this.storiesService.findBySlug(slug);
  }

  @Get(':slug/chapters')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách các chương của bộ truyện (Metadata)' })
  async getStoryChapters(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.storiesService.findChaptersByStorySlug(slug, user);
  }

  @Get(':slug/chapters/:chapterSlug/access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy quyền truy cập và URL audio của chương' })
  async getChapterAccess(
    @Param('slug') slug: string,
    @Param('chapterSlug') chapterSlug: string,
    @CurrentUser() user: any
  ) {
    return this.storiesService.getChapterAccess(slug, chapterSlug, user);
  }
}
