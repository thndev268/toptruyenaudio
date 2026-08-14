import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
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
  @ApiOperation({ summary: 'Phân tích URL video từ YouTube hoặc các nền tảng khác' })
  async analyzeVideo(@Body() body: { videoUrl: string }) {
    if (!body.videoUrl) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Video URL is required',
      });
    }

    // Validate URL format
    try {
      new URL(body.videoUrl);
    } catch {
      throw new BadRequestException({
        code: 'INVALID_URL',
        message: 'Invalid URL format',
      });
    }

    // YouTube URL analysis
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = body.videoUrl.match(youtubeRegex);

    if (match) {
      const videoId = match[1];
      const youtubeApiKey = this.configService.get<string>('YOUTUBE_API_KEY');

      let title = '';
      let description = '';
      let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      let embedUrl = `https://www.youtube.com/embed/${videoId}`;

      try {
        // Fetch title and thumbnail from YouTube oEmbed (no API key required)
        const oembedResponse = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        
        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          title = oembedData.title || '';
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

      return {
        platform: 'youtube',
        videoId,
        embedUrl,
        thumbnail,
        title,
        description,
        authorName: '', // Can be extracted from oEmbed if needed
      };
    }

    // For other platforms, return basic info
    return {
      platform: 'unknown',
      videoUrl: body.videoUrl,
      embedUrl: body.videoUrl,
      title: '',
      description: '',
      thumbnail: '',
      authorName: '',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo truyện mới' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('coverFile'))
  async createStory(
    @Body() body: any,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    let coverUrl = body.coverUrl;

    if (coverFile) {
      const ext = coverFile.originalname.split('.').pop();
      const filename = `covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      coverUrl = await this.storage.uploadFile('media', filename, coverFile.buffer, coverFile.mimetype);
    }

    const generatedSlug = body.slug || (body.title ? body.title.toLowerCase().replace(/ /g, '-') : `story-${Date.now()}`);

    return this.prisma.story.create({
      data: {
        title: body.title || 'Không có tiêu đề',
        slug: generatedSlug,
        authorName: body.authorName,
        narratorName: body.narratorName,
        summary: body.summary,
        coverUrl,
        storyStatus: body.storyStatus || 'ONGOING',
        publishStatus: body.publishStatus || 'PUBLISHED',
        iframeUrl: body.iframeUrl,
        iframeCode: body.iframeCode,
        audioContent: body.audioContent,
        isVideoStory: body.isVideoStory === 'true' || body.isVideoStory === true,
      },
    });
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
      storyStatus: body.storyStatus,
      publishStatus: body.publishStatus,
    };

    if (body.iframeUrl !== undefined) dataToUpdate.iframeUrl = body.iframeUrl;
    if (body.iframeCode !== undefined) dataToUpdate.iframeCode = body.iframeCode;
    if (body.audioContent !== undefined) dataToUpdate.audioContent = body.audioContent;
    if (body.isVideoStory !== undefined) dataToUpdate.isVideoStory = body.isVideoStory === 'true' || body.isVideoStory === true;

    if (coverUrl) {
      dataToUpdate.coverUrl = coverUrl;
    }

    return this.prisma.story.update({
      where: { id },
      data: dataToUpdate,
    });
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
}
