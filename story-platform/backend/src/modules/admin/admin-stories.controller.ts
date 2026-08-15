import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UsePipes,
  UploadedFile,
  Get,
  Query,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { AdminCreateStoryDto } from '../stories/dto/story.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Admin Stories (ADMIN)')
@Controller('admin/stories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.OWNER_ADMIN)
@ApiBearerAuth()
export class AdminStoriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @Post('analyze-video')
  @ApiOperation({ summary: 'Phân tích mã iframe YouTube để lấy thông tin video' })
  async analyzeVideo(@Body() body: { iframeCodes: string[] }) {
    if (!body.iframeCodes || !Array.isArray(body.iframeCodes) || body.iframeCodes.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'iframeCodes is required and must be a non-empty array',
      });
    }

    const youtubeApiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    const results: any[] = [];

    for (let i = 0; i < body.iframeCodes.length; i++) {
      const iframeCode = body.iframeCodes[i];

      // Extract src attribute from iframe
      const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) {
        results.push({
          error: `Iframe ${i + 1}: Không tìm thấy thuộc tính src`,
          iframeCode,
        });
        continue;
      }

      const src = srcMatch[1];

      // Extract YouTube video ID from embed URL
      const youtubeRegex = /(?:youtube\.com\/embed\/|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = src.match(youtubeRegex);

      if (!match) {
        results.push({
          error: `Iframe ${i + 1}: src không phải YouTube embed URL (${src})`,
          iframeCode,
        });
        continue;
      }

      const videoId = match[1];
      let title = '';
      let description = '';
      let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      let embedUrl = `https://www.youtube.com/embed/${videoId}`;

      // Extract title from iframe if available
      const titleMatch = iframeCode.match(/title=["']([^"']+)["']/i);
      if (titleMatch && titleMatch[1] && titleMatch[1] !== 'Video Player') {
        title = titleMatch[1];
      }

      try {
        // Fetch title and thumbnail from YouTube oEmbed (no API key required)
        const oembedResponse = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        
        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          title = oembedData.title || title;
          thumbnail = oembedData.thumbnail_url || thumbnail;
        }
      } catch (error) {
        console.error('Failed to fetch oEmbed data:', error);
      }

      // Fetch description from YouTube Data API (requires API key)
      if (youtubeApiKey) {
        try {
          const dataApiResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${youtubeApiKey}`
          );
          
          if (dataApiResponse.ok) {
            const data = await dataApiResponse.json();
            if (data.items && data.items.length > 0) {
              description = data.items[0].snippet?.description || '';
              if (!title) {
                title = data.items[0].snippet?.title || '';
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch YouTube Data API:', error);
        }
      }

      results.push({
        platform: 'youtube',
        videoId,
        embedUrl,
        thumbnail,
        title: title || `Video YouTube #${i + 1}`,
        description,
        authorName: '',
        iframeCode,
      });
    }

    return results;
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả truyện' })
  async getAllStories() {
    try {
      const stories = await this.prisma.story.findMany({
        include: {
          chapters: true,
          genres: {
            include: {
              genre: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: stories,
        message: 'Đã lấy danh sách truyện thành công',
      };
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw new BadRequestException({
        code: 'FETCH_STORIES_ERROR',
        message: error.message || 'Lỗi khi lấy danh sách truyện',
      });
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo truyện mới' })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, whitelist: true, forbidNonWhitelisted: true }))
  async createStory(@Body() dto: AdminCreateStoryDto) {
    try {
      console.log('[createStory] Received DTO:', dto);

      // Generate unique slug if not provided
      let slug = dto.slug || dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      
      // Check if slug already exists - return 409 Conflict if it does
      const existingStory = await this.prisma.story.findUnique({ where: { slug } });
      if (existingStory) {
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: `Slug '${slug}' đã tồn tại. Vui lòng chọn slug khác hoặc để hệ thống tự động tạo.`,
          fields: { slug: 'Slug đã tồn tại' },
        });
      }
      
      // If slug was provided by user and conflicts, we don't auto-generate
      // Only auto-generate if the slug was derived from title and conflicts
      if (!dto.slug) {
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          const conflictStory = await this.prisma.story.findUnique({ where: { slug } });
          if (!conflictStory) break;
          slug = `${slug}-${Date.now()}-${attempts}`;
          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new BadRequestException({
            code: 'SLUG_GENERATION_FAILED',
            message: 'Could not generate unique slug',
          });
        }
      }

      // Extract iframeUrl from iframeCode if not provided
      let iframeUrl = dto.iframeUrl;
      let iframeCode = dto.iframeCode;
      let thumbnailUrl = dto.coverUrl;

      if (iframeCode && !iframeUrl) {
        const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          iframeUrl = srcMatch[1];
        }
      }

      // Auto-extract YouTube thumbnail if video story and no coverUrl
      if (iframeUrl && (!thumbnailUrl)) {
        const youtubeRegex = /(?:youtube\.com\/embed\/|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = iframeUrl.match(youtubeRegex);
        if (match) {
          const videoId = match[1];
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      const story = await this.prisma.$transaction(async (tx) => {
        const newStory = await tx.story.create({
          data: {
            title: dto.title.trim(),
            slug,
            authorName: dto.authorName.trim(),
            narratorName: dto.narratorName?.trim() || '',
            summary: dto.summary?.trim() || '',
            storyline: dto.storyline?.trim() || dto.summary?.trim() || '',
            audioContent: dto.audioContent?.trim() || 'Đang cập nhật',
            coverUrl: thumbnailUrl,
            storyStatus: dto.storyStatus || 'ONGOING',
            publishStatus: dto.publishStatus || 'PUBLISHED',
            iframeUrl,
            iframeCode,
            isVideoStory: typeof dto.isVideoStory === 'boolean' ? dto.isVideoStory : false,
          },
        });

        // Create genre relations if genreIds provided
        if (dto.genreIds && Array.isArray(dto.genreIds) && dto.genreIds.length > 0) {
          const genreRelations = dto.genreIds.map((genreId) => ({
            storyId: newStory.id,
            genreId,
          }));
          await tx.genreToStory.createMany({
            data: genreRelations,
          });
        }

        return newStory;
      });

      return {
        success: true,
        data: story,
        message: 'Đã tạo truyện thành công',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating story:', error);
      throw new BadRequestException({
        code: 'CREATE_STORY_ERROR',
        message: error.message || 'Lỗi khi tạo truyện',
      });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật truyện' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('coverFile'))
  async updateStory(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    try {
      // Check if story exists
      const existingStory = await this.prisma.story.findUnique({ where: { id } });
      if (!existingStory) {
        throw new NotFoundException({
          code: 'STORY_NOT_FOUND',
          message: `Không tìm thấy truyện với ID: ${id}`,
        });
      }

      let coverUrl = body.coverUrl;

      if (coverFile) {
        const ext = coverFile.originalname.split('.').pop();
        const filename = `covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        coverUrl = await this.storage.uploadFile('media', filename, coverFile.buffer, coverFile.mimetype);
      }

      const dataToUpdate: any = {
        title: body.title,
        slug: body.slug,
        authorName: body.authorName,
        narratorName: body.narratorName,
        summary: body.summary,
        storyline: body.storyline,
        storyStatus: body.storyStatus,
        publishStatus: body.publishStatus,
      };

      if (body.iframeUrl !== undefined) dataToUpdate.iframeUrl = body.iframeUrl;
      if (body.iframeCode !== undefined) dataToUpdate.iframeCode = body.iframeCode;
      if (body.audioContent !== undefined) dataToUpdate.audioContent = body.audioContent;
      if (body.isVideoStory !== undefined) dataToUpdate.isVideoStory = body.isVideoStory === 'true' || body.isVideoStory === true;
      if (body.accessLevel !== undefined) dataToUpdate.accessLevel = body.accessLevel;

      if (coverUrl) {
        dataToUpdate.coverUrl = coverUrl;
      }

      // Check slug conflict if slug is being changed
      if (body.slug && body.slug !== existingStory.slug) {
        const slugConflict = await this.prisma.story.findUnique({ where: { slug: body.slug } });
        if (slugConflict) {
          throw new ConflictException({
            code: 'SLUG_ALREADY_EXISTS',
            message: `Slug '${body.slug}' đã tồn tại. Vui lòng chọn slug khác.`,
            fields: { slug: 'Slug đã tồn tại' },
          });
        }
      }

      const updatedStory = await this.prisma.$transaction(async (tx) => {
        // Update story
        const story = await tx.story.update({
          where: { id },
          data: dataToUpdate,
        });

        // Handle genre relations if genreIds is provided in body
        if (body.genreIds !== undefined) {
          // Delete existing genre relations
          await tx.genreToStory.deleteMany({ where: { storyId: id } });

          // Create new genre relations if genreIds is not empty
          if (Array.isArray(body.genreIds) && body.genreIds.length > 0) {
            const genreRelations = body.genreIds.map((genreId: string) => ({
              storyId: id,
              genreId,
            }));
            await tx.genreToStory.createMany({
              data: genreRelations,
            });
          }
        }

        return story;
      });

      return {
        success: true,
        data: updatedStory,
        message: 'Đã cập nhật truyện thành công',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Error updating story:', error);
      throw new BadRequestException({
        code: 'UPDATE_STORY_ERROR',
        message: error.message || 'Lỗi khi cập nhật truyện',
      });
    }
  }

  @Post(':id/chapters')
  @ApiOperation({ summary: 'Thêm chương mới' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audioFile'))
  async addChapter(
    @Param('id') storyId: string,
    @Body() body: any,
    @UploadedFile() audioFile?: Express.Multer.File,
  ) {
    let audioUrl = body.audioUrl;

    if (audioFile) {
      const ext = audioFile.originalname.split('.').pop();
      const filename = `audio/${storyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      audioUrl = await this.storage.uploadFile('media', filename, audioFile.buffer, audioFile.mimetype);
    }

    return this.prisma.chapter.create({
      data: {
        storyId,
        number: parseInt(body.number, 10),
        title: body.title,
        audioUrl,
        durationSeconds: parseInt(body.durationSeconds, 10) || 0,
        accessLevel: body.accessLevel || 'FREE',
      },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa truyện' })
  async deleteStory(@Param('id') id: string) {
    try {
      // Check if story exists
      const existingStory = await this.prisma.story.findUnique({ where: { id } });
      if (!existingStory) {
        throw new NotFoundException({
          code: 'STORY_NOT_FOUND',
          message: `Không tìm thấy truyện với ID: ${id}`,
        });
      }

      // Use transaction to delete all related records
      await this.prisma.$transaction(async (tx) => {
        // Delete chapters (has cascade, but explicit for clarity)
        await tx.chapter.deleteMany({ where: { storyId: id } });
        
        // Delete listening progress (has cascade on chapter, but explicit for storyId)
        await tx.listeningProgress.deleteMany({ where: { storyId: id } });
        
        // Delete story-genre relations (GenreToStory)
        await tx.genreToStory.deleteMany({ where: { storyId: id } });
        
        // Delete content rights
        await tx.contentRights.deleteMany({ where: { storyId: id } });
        
        // Delete the story itself (this will cascade delete chapters due to schema)
        await tx.story.delete({ where: { id } });
      });

      return {
        success: true,
        message: 'Đã xóa truyện thành công',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting story:', error);
      throw new BadRequestException({
        code: 'DELETE_STORY_ERROR',
        message: error.message || 'Lỗi khi xóa truyện',
      });
    }
  }
}
