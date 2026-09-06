import { Controller, Get, Post, Param, Query, UseGuards, BadRequestException, Body } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Public Stories & Readers')
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các bộ truyện công khai' })
  async getPublicStories(@Query() query: any) {
    try {
      console.log('[StoriesController] Fetching public stories with query:', query);
      const result = await this.storiesService.findAllPublic(query);
      console.log('[StoriesController] Returning stories count:', Array.isArray(result) ? result.length : 'not array');
      return result;
    } catch (error) {
      console.error('[StoriesController] Error fetching public stories:', error);
      throw error;
    }
  }

  @Get('genres/all')
  @ApiOperation({ summary: 'Lấy danh sách tất cả thể loại' })
  async getAllGenres() {
    try {
      const genres = await this.prisma.genre.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: genres,
        message: 'Đã lấy danh sách thể loại thành công',
      };
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw new BadRequestException({
        code: 'FETCH_GENRES_ERROR',
        message: error instanceof Error ? error.message : 'Lỗi khi lấy danh sách thể loại',
      });
    }
  }

  @Post(':id/increment-listen')
  @ApiOperation({ summary: 'Tăng lượt nghe của truyện' })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async incrementListenCount(@Param('id') id: string) {
    try {
      await this.storiesService.incrementListenCount(id);
      return {
        success: true,
        message: 'Đã tăng lượt nghe thành công',
      };
    } catch (error) {
      console.error('Error incrementing listen count:', error);
      throw new BadRequestException({
        success: false,
        message: 'Không thể tăng lượt nghe',
      });
    }
  }

  @Get('genres/:slug')
  @ApiOperation({ summary: 'Lấy danh sách truyện theo thể loại' })
  async getStoriesByGenre(@Param('slug') slug: string, @Query() query: any) {
    try {
      const genre = await this.prisma.genre.findUnique({ where: { slug } });
      if (!genre) {
        throw new BadRequestException({
          code: 'GENRE_NOT_FOUND',
          message: `Không tìm thấy thể loại với slug: ${slug}`,
        });
      }

      const { page = 1, limit = 20 } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const [stories, total] = await Promise.all([
        this.prisma.story.findMany({
          where: {
            genres: {
              some: {
                genreId: genre.id,
              },
            },
            publishStatus: 'PUBLISHED',
          },
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: Number(limit),
        }),
        this.prisma.story.count({
          where: {
            genres: {
              some: {
                genreId: genre.id,
              },
            },
            publishStatus: 'PUBLISHED',
          },
        }),
      ]);

      return {
        success: true,
        data: stories,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
        genre,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error fetching stories by genre:', error);
      throw new BadRequestException({
        code: 'FETCH_STORIES_BY_GENRE_ERROR',
        message: error instanceof Error ? error.message : 'Lỗi khi lấy danh sách truyện theo thể loại',
      });
    }
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
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Lấy quyền truy cập và URL audio của chương' })
  async getChapterAccess(
    @Param('slug') slug: string,
    @Param('chapterSlug') chapterSlug: string,
    @CurrentUser() user: any
  ) {
    return this.storiesService.getChapterAccess(slug, chapterSlug, user);
  }

  @Post(':slug/chapters/first-from-iframe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo chapter đầu tiên từ iframe cho video story' })
  async createFirstChapterFromIframe(
    @Param('slug') slug: string,
    @CurrentUser() user: any
  ) {
    const story = await this.prisma.story.findUnique({
      where: { slug },
      include: { chapters: true },
    });

    if (!story) {
      throw new BadRequestException({
        code: 'STORY_NOT_FOUND',
        message: 'Không tìm thấy truyện',
      });
    }

    if (story.chapters.length > 0) {
      throw new BadRequestException({
        code: 'CHAPTERS_ALREADY_EXIST',
        message: 'Truyện này đã có chapters',
      });
    }

    if (!story.iframeCode && !story.iframeUrl) {
      throw new BadRequestException({
        code: 'NO_IFRAME',
        message: 'Truyện không có iframe',
      });
    }

    const chapter = await this.prisma.chapter.create({
      data: {
        storyId: story.id,
        number: 1,
        title: `Tập 1: ${story.title}`,
        slug: `${story.slug}-tap-1`,
        videoIframeUrl: story.iframeUrl,
        iframeCode: story.iframeCode,
        durationSeconds: 1800,
        accessLevel: 'FREE',
        publishStatus: 'PUBLISHED',
      },
    });

    return {
      success: true,
      data: chapter,
      message: 'Đã tạo chapter đầu tiên từ iframe',
    };
  }
}
