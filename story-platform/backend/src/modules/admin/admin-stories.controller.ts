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
import { GoogleGenerativeAI } from '@google/generative-ai';
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
      } catch (error: any) {
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
        } catch (error: any) {
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

      // Transform genres from GenreToStory[] to Genre[]
      const transformedStories = stories.map(story => ({
        ...story,
        genres: story.genres ? story.genres.map(g => g.genre) : [],
      }));

      return {
        success: true,
        data: transformedStories,
        message: 'Đã lấy danh sách truyện thành công',
      };
    } catch (error: any) {
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
          // Filter out null/undefined values from genreIds
          const validGenreIds = dto.genreIds.filter((genreId: any) => genreId !== null && genreId !== undefined && genreId !== '');
          
          if (validGenreIds.length > 0) {
            const genreRelations = validGenreIds.map((genreId) => ({
              storyId: newStory.id,
              genreId,
            }));
            await tx.genreToStory.createMany({
              data: genreRelations,
            });
          }
        }

        // Use user-provided duration or default to 1800 seconds (30 minutes)
        let videoDuration = dto.videoDurationSeconds || 1800;

        // Create Chapter 1 for every story (default chapter)
        const chapter = await tx.chapter.create({
          data: {
            storyId: newStory.id,
            number: 1,
            title: `Tập 1: ${newStory.title}`,
            slug: `${newStory.slug}-tap-1`,
            videoIframeUrl: iframeUrl,
            iframeCode: iframeCode,
            durationSeconds: videoDuration,
            accessLevel: 'FREE',
            publishStatus: 'PUBLISHED',
          },
        });
        return { ...newStory, firstChapterId: chapter.id };
      });

      // Fetch story with genres for response
      const storyWithGenres = await this.prisma.story.findUnique({
        where: { id: story.id },
        include: {
          chapters: true,
          genres: {
            include: {
              genre: true,
            },
          },
        },
      });

      if (!storyWithGenres) {
        throw new NotFoundException({
          code: 'STORY_NOT_FOUND',
          message: `Không tìm thấy truyện vừa tạo với ID: ${story.id}`,
        });
      }

      // Transform genres from GenreToStory[] to Genre[] in response
      const transformedStory = storyWithGenres.genres ? {
        ...storyWithGenres,
        genres: storyWithGenres.genres.map(g => g.genre),
      } : storyWithGenres;

      return {
        success: true,
        data: transformedStory,
        message: 'Đã tạo truyện thành công',
      };
    } catch (error: any) {
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
      
      // Parse genreIds if sent as JSON string from FormData
      let genreIds = body.genreIds;
      console.log('[updateStory] Received genreIds from request:', genreIds);
      if (typeof genreIds === 'string') {
        try {
          genreIds = JSON.parse(genreIds);
          console.log('[updateStory] Parsed genreIds:', genreIds);
        } catch (e: any) {
          console.error('[updateStory] Failed to parse genreIds:', e);
          genreIds = undefined;
        }
      }

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
        console.log('[updateStory] Handling genre relations, genreIds:', genreIds);
        if (genreIds !== undefined) {
          // Delete existing genre relations
          const deleteResult = await tx.genreToStory.deleteMany({ where: { storyId: id } });
          console.log('[updateStory] Deleted existing genre relations:', deleteResult.count);

          // Create new genre relations if genreIds is not empty
          if (Array.isArray(genreIds) && genreIds.length > 0) {
            // Filter out null/undefined values from genreIds
            const validGenreIds = genreIds.filter((genreId: any) => genreId !== null && genreId !== undefined && genreId !== '');
            
            if (validGenreIds.length > 0) {
              const genreRelations = validGenreIds.map((genreId: string) => ({
                storyId: id,
                genreId,
              }));
              console.log('[updateStory] Creating new genre relations:', genreRelations);
              await tx.genreToStory.createMany({
                data: genreRelations,
              });
              console.log('[updateStory] Created genre relations successfully');
            } else {
              console.log('[updateStory] All genreIds are invalid (null/undefined/empty), skipping creation');
            }
          } else {
            console.log('[updateStory] genreIds is empty or not an array, skipping creation');
          }
        } else {
          console.log('[updateStory] genreIds is undefined, not updating genre relations');
        }

        // Fetch story with genres for response
        const storyWithGenres = await tx.story.findUnique({
          where: { id },
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        });

        if (!storyWithGenres) {
          throw new NotFoundException({
            code: 'STORY_NOT_FOUND',
            message: `Không tìm thấy truyện với ID: ${id}`,
          });
        }

        // Transform genres from GenreToStory[] to Genre[]
        const transformedStory = {
          ...storyWithGenres,
          genres: storyWithGenres.genres ? storyWithGenres.genres.map(g => g.genre) : [],
        };

        return transformedStory;
      });

      return {
        success: true,
        data: updatedStory,
        message: 'Đã cập nhật truyện thành công',
      };
    } catch (error: any) {
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

  @Get(':id/chapters')
  @ApiOperation({ summary: 'Lấy danh sách chương của truyện' })
  async getChapters(@Param('id') id: string) {
    try {
      const chapters = await this.prisma.chapter.findMany({
        where: { storyId: id },
        orderBy: { number: 'asc' },
      });
      return {
        success: true,
        data: chapters,
      };
    } catch (error: any) {
      console.error('Error fetching chapters:', error);
      throw new BadRequestException({
        code: 'FETCH_CHAPTERS_ERROR',
        message: 'Lỗi khi lấy danh sách chương',
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
    // Check if story exists
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException({
        code: 'STORY_NOT_FOUND',
        message: `Không tìm thấy truyện với ID: ${storyId}`,
      });
    }

    let audioUrl = body.audioUrl;
    if (audioFile) {
      const ext = audioFile.originalname.split('.').pop();
      const filename = `audio/${storyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      audioUrl = await this.storage.uploadFile('media', filename, audioFile.buffer, audioFile.mimetype);
    }

    // Auto-increment chapter number if not provided
    let chapterNumber = parseInt(body.number, 10);
    if (!chapterNumber || chapterNumber <= 0) {
      const lastChapter = await this.prisma.chapter.findFirst({
        where: { storyId },
        orderBy: { number: 'desc' },
      });
      chapterNumber = lastChapter ? lastChapter.number + 1 : 1;
    }

    // Extract iframeUrl from iframeCode if provided
    let iframeUrl = body.videoIframeUrl;
    let iframeCode = body.iframeCode;
    if (iframeCode && !iframeUrl) {
      const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
      if (srcMatch) {
        iframeUrl = srcMatch[1];
      }
    }

    const chapter = await this.prisma.chapter.create({
      data: {
        storyId,
        number: chapterNumber,
        title: body.title || `Tập ${chapterNumber}`,
        slug: `${story.slug}-tap-${chapterNumber}`,
        audioUrl,
        videoIframeUrl: iframeUrl,
        iframeCode: iframeCode,
        durationSeconds: parseInt(body.durationSeconds, 10) || 1800,
        accessLevel: body.accessLevel || 'FREE',
        publishStatus: 'PUBLISHED',
        audioContent: body.audioContent || '',
      },
    });

    return {
      success: true,
      data: chapter,
      message: 'Đã tạo chương thành công',
    };
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
    } catch (error: any) {
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

  @Delete(':storyId/chapters/:chapterId')
  @ApiOperation({ summary: 'Xóa một chapter' })
  async deleteChapter(@Param('storyId') storyId: string, @Param('chapterId') chapterId: string) {
    try {
      // Check if chapter exists
      const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId } });
      if (!chapter) {
        throw new NotFoundException({
          code: 'CHAPTER_NOT_FOUND',
          message: `Không tìm thấy chapter với ID: ${chapterId}`,
        });
      }

      // Delete chapter (listening progress will cascade delete)
      await this.prisma.chapter.delete({ where: { id: chapterId } });

      return {
        success: true,
        message: 'Đã xóa chapter thành công',
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting chapter:', error);
      throw new BadRequestException({
        code: 'DELETE_CHAPTER_ERROR',
        message: error.message || 'Lỗi khi xóa chapter',
      });
    }
  }

  @Put(':storyId/chapters/:chapterId')
  @ApiOperation({ summary: 'Cập nhật thông tin chapter' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audioFile'))
  async updateChapter(
    @Param('storyId') storyId: string,
    @Param('chapterId') chapterId: string,
    @Body() body: any,
    @UploadedFile() audioFile?: Express.Multer.File,
  ) {
    try {
      // Check if chapter exists
      const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId } });
      if (!chapter) {
        throw new NotFoundException({
          code: 'CHAPTER_NOT_FOUND',
          message: `Không tìm thấy chapter với ID: ${chapterId}`,
        });
      }

      // Verify chapter belongs to the story
      if (chapter.storyId !== storyId) {
        throw new BadRequestException({
          code: 'CHAPTER_STORY_MISMATCH',
          message: 'Chapter không thuộc về story này',
        });
      }

      let audioUrl = body.audioUrl;
      if (audioFile) {
        const ext = audioFile.originalname.split('.').pop();
        const filename = `audio/${storyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        audioUrl = await this.storage.uploadFile('media', filename, audioFile.buffer, audioFile.mimetype);
      }

      // Extract iframeUrl from iframeCode if provided
      let iframeUrl = body.videoIframeUrl;
      let iframeCode = body.iframeCode;
      if (iframeCode && !iframeUrl) {
        const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          iframeUrl = srcMatch[1];
        }
      }

      const dataToUpdate: any = {
        number: body.number ? parseInt(body.number, 10) : undefined,
        title: body.title,
        slug: body.slug,
        audioUrl: audioUrl || undefined,
        videoIframeUrl: iframeUrl || undefined,
        iframeCode: iframeCode || undefined,
        durationSeconds: body.durationSeconds ? parseInt(body.durationSeconds, 10) : undefined,
        accessLevel: body.accessLevel,
        audioContent: body.audioContent,
      };

      // Remove undefined values
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === undefined) {
          delete dataToUpdate[key];
        }
      });

      const updatedChapter = await this.prisma.chapter.update({
        where: { id: chapterId },
        data: dataToUpdate,
      });

      return {
        success: true,
        data: updatedChapter,
        message: 'Đã cập nhật chapter thành công',
      };
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error updating chapter:', error);
      throw new BadRequestException({
        code: 'UPDATE_CHAPTER_ERROR',
        message: error.message || 'Lỗi khi cập nhật chapter',
      });
    }
  }

  @Delete(':storyId/chapters/batch')
  @ApiOperation({ summary: 'Xóa nhiều chapter cùng lúc' })
  async deleteChaptersBatch(
    @Param('storyId') storyId: string,
    @Body() body: { chapterIds: string[]; reason?: string }
  ) {
    try {
      const { chapterIds } = body;

      if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'chapterIds is required and must be a non-empty array',
        });
      }

      // Delete chapters (listening progress will cascade delete)
      const result = await this.prisma.chapter.deleteMany({
        where: {
          id: { in: chapterIds },
          storyId,
        },
      });

      return {
        success: true,
        message: `Đã xóa thành công ${result.count} chapter`,
        deletedCount: result.count,
      };
    } catch (error: any) {
      console.error('Error deleting chapters batch:', error);
      throw new BadRequestException({
        code: 'DELETE_CHAPTERS_ERROR',
        message: error.message || 'Lỗi khi xóa chapters',
      });
    }
  }

  // --- Genre Management ---

  @Post('genres')
  @ApiOperation({ summary: 'Tạo thể loại mới' })
  async createGenre(@Body() body: { name: string; slug: string; description: string; iconName?: string }) {
    try {
      const { name, slug, description, iconName } = body;

      if (!name || !slug) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'name và slug là bắt buộc',
        });
      }

      // Check if genre already exists
      const existing = await this.prisma.genre.findFirst({
        where: {
          OR: [
            { slug },
            { name: { equals: name, mode: 'insensitive' } },
          ],
        },
      });

      if (existing) {
        throw new ConflictException({
          code: 'GENRE_EXISTS',
          message: 'Thể loại này đã tồn tại',
        });
      }

      const genre = await this.prisma.genre.create({
        data: {
          name,
          slug: slug.toLowerCase().replace(/\s+/g, '-'),
          description,
          iconName: iconName || 'Disc',
        },
      });

      return {
        success: true,
        data: genre,
        message: 'Đã tạo thể loại mới thành công',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Error creating genre:', error);
      throw new BadRequestException({
        code: 'CREATE_GENRE_ERROR',
        message: error.message || 'Lỗi khi tạo thể loại',
      });
    }
  }

  @Delete('genres/:genreId')
  @ApiOperation({ summary: 'Xóa thể loại' })
  async deleteGenre(@Param('genreId') genreId: string) {
    try {
      // Check if genre exists
      const genre = await this.prisma.genre.findUnique({
        where: { id: genreId },
      });

      if (!genre) {
        throw new NotFoundException({
          code: 'GENRE_NOT_FOUND',
          message: 'Không tìm thấy thể loại',
        });
      }

      // Check if genre is used by any stories
      const storyCount = await this.prisma.genreToStory.count({
        where: { genreId },
      });

      if (storyCount > 0) {
        throw new BadRequestException({
          code: 'GENRE_IN_USE',
          message: `Thể loại đang được sử dụng bởi ${storyCount} truyện. Vui lòng xóa liên kết trước.`,
        });
      }

      // Delete genre
      await this.prisma.genre.delete({
        where: { id: genreId },
      });

      return {
        success: true,
        message: 'Đã xóa thể loại thành công',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting genre:', error);
      throw new BadRequestException({
        code: 'DELETE_GENRE_ERROR',
        message: error.message || 'Lỗi khi xóa thể loại',
      });
    }
  }

  @Post('suggest-genres')
  @ApiOperation({ summary: 'AI gợi ý thể loại cho truyện dựa trên tiêu đề và cốt truyện' })
  async suggestGenres(@Body() body: { title: string; summary?: string }) {
    try {
      const { title, summary } = body;

      if (!title || !title.trim()) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Tiêu đề là bắt buộc',
        });
      }

      // Check for API key
      const apiKey = process.env.GEMINI_API_KEY;
      console.log('[suggestGenres] GEMINI_API_KEY exists:', !!apiKey);
      
      if (!apiKey || apiKey.trim() === '') {
        console.error('[suggestGenres] GEMINI_API_KEY is not configured');
        throw new BadRequestException({
          code: 'API_KEY_MISSING',
          message: 'Chưa cấu hình GEMINI_API_KEY trong môi trường backend',
        });
      }

      console.log('[suggestGenres] Starting AI genre suggestion for title:', title);

      // Call AI service to suggest genres
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

      const context = summary ? `Tiêu đề: "${title}"\nCốt truyện: "${summary}"` : `Tiêu đề: "${title}"`;
      
      const prompt = `Dựa trên thông tin sau, hãy gợi ý 3-5 thể loại phù hợp nhất cho bộ truyện audio:

${context}

Danh sách thể loại trong hệ thống:
- Cao Võ
- Chuyển Chức
- Dị Giới
- Dị Năng
- Đô Thị
- Hệ Thống
- Huyền Huyễn
- Kinh Dị
- Mạt Thế
- Ngôn Tình
- Ngự Thú
- Phản Diện
- Tiên Hiệp
- Trọng Sinh
- Tu Tiên
- Võng Du

Yêu cầu:
- Chỉ trả về tên thể loại từ danh sách trên
- Trả về dưới dạng JSON array: ["Thể loại 1", "Thể loại 2", "Thể loại 3"]
- Chọn thể loại phù hợp nhất với nội dung
- Không thêm giải thích hay văn bản khác`;

      console.log('[suggestGenres] Prompt created, calling AI model...');

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log('[suggestGenres] AI response:', response);

      // Parse JSON response
      let suggestedGenres: string[] = [];
      try {
        // Extract JSON from response (might have markdown formatting)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestedGenres = JSON.parse(jsonMatch[0]);
        } else {
          suggestedGenres = JSON.parse(response);
        }
      } catch (parseError) {
        console.error('[suggestGenres] Error parsing AI response:', parseError);
        // Fallback: extract genres from text
        const genreMatches = response.match(/([A-ZÀ-Ỹ][a-zà-ỹ\s\/]+)/g);
        if (genreMatches) {
          suggestedGenres = genreMatches.slice(0, 5);
        }
      }

      console.log('[suggestGenres] Suggested genres:', suggestedGenres);

      return {
        success: true,
        data: { genres: suggestedGenres },
        message: 'Đã gợi ý thể loại thành công',
      };
    } catch (error: any) {
      console.error('[suggestGenres] Error occurred:', error.message);
      console.error('[suggestGenres] Error stack:', error.stack);
      throw new BadRequestException({
        code: 'SUGGEST_GENRES_ERROR',
        message: error.message || 'Lỗi khi gợi ý thể loại',
      });
    }
  }

  @Post('generate-summary')
  @ApiOperation({ summary: 'Tạo cốt truyện tự động bằng AI từ tiêu đề' })
  async generateSummary(@Body() body: { title: string }) {
    try {
      console.log('[generateSummary] === Starting AI Summary Generation ===');
      const { title } = body;
      console.log('[generateSummary] Received title:', title);

      if (!title || !title.trim()) {
       console.error('[generateSummary] Validation error: title is empty');
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Tiêu đề là bắt buộc',
        });
      }

      // Check for API key
      const apiKey = process.env.GEMINI_API_KEY;
      console.log('[generateSummary] GEMINI_API_KEY exists:', !!apiKey);
      console.log('[generateSummary] GEMINI_API_KEY length:', apiKey?.length || 0);
      
      if (!apiKey || apiKey.trim() === '') {
        console.error('[generateSummary] GEMINI_API_KEY is not configured');
        throw new BadRequestException({
          code: 'API_KEY_MISSING',
          message: 'Chưa cấu hình GEMINI_API_KEY trong môi trường backend',
        });
      }

      console.log('[generateSummary] Initializing GoogleGenerativeAI...');
      
      // Call AI service to generate summary
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

      const prompt = `Tạo một cốt truyện hấp dẫn và chi tiết (khoảng 200-250 từ) cho bộ truyện audio với tiêu đề: "${title}". 

Yêu cầu:
- Viết bằng tiếng Việt, văn phong lôi cuốn, giàu cảm xúc
- Bắt đầu bằng một tình huống hoặc bí mật thú vị để thu hút người nghe
- Mô tả bối cảnh, nhân vật chính và xung đột cốt lõi
- Gợi mở sự kiện quan trọng hoặc bước ngoặt trong câu chuyện
- Kết thúc bằng một câu hỏi hoặc sự tò mò để kích thích người nghe muốn tiếp tục
- Phù hợp với thể loại truyện audio, tập trung vào điểm nhấn và cảm xúc
- Tránh quá dài dòng, giữ ngắn gọn nhưng đầy đủ ý nghĩa

Cốt truyện nên khiến người nghe cảm thấy như đang sống trong câu chuyện.`;
      console.log('[generateSummary] Prompt created, calling AI model...');

      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      console.log('[generateSummary] Successfully generated summary, length:', summary.length);
      console.log('[generateSummary] Summary preview:', summary.substring(0, 100) + '...');

      return {
        success: true,
        data: { summary: summary.trim() },
        message: 'Đã tạo cốt truyện thành công',
      };
    } catch (error: any) {
      console.error('[generateSummary] Error occurred:', error.message);
      console.error('[generateSummary] Error stack:', error.stack);
      throw new BadRequestException({
        code: 'GENERATE_SUMMARY_ERROR',
        message: error.message || 'Lỗi khi tạo cốt truyện tự động',
      });
    }
  }
}
