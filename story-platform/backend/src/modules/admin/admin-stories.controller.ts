import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@ApiTags('Admin Stories (ADMIN)')
@Controller('admin/stories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.OWNER_ADMIN)
@ApiBearerAuth()
export class AdminStoriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
