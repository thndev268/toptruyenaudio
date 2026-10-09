import { Controller, Get, Post, Body, UseGuards, Query, Param, Patch, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums';
import { BannersService } from './banners.service';
import { StorageService } from '../storage/storage.service';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách banner đang hoạt động' })
  async getActiveBanners(@CurrentUser('id') userId?: string) {
    return this.bannersService.getActiveBanners(userId);
  }

  @Post('dismiss/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đóng banner trong 3 giờ' })
  async dismissBanner(@CurrentUser('id') userId: string, @Param('id') bannerId: string) {
    return this.bannersService.dismissBanner(userId, bannerId);
  }

  // Admin endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo banner mới' })
  async createBanner(@Body() body: {
    title: string;
    content: string;
    imageUrl?: string;
    type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PROMOTION';
    backgroundColor?: string;
    textColor?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    priority?: number;
  }) {
    return this.bannersService.createBanner({
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật banner' })
  async updateBanner(
    @Param('id') bannerId: string,
    @Body() body: {
      title?: string;
      content?: string;
      imageUrl?: string;
      type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PROMOTION';
      backgroundColor?: string;
      textColor?: string;
      isActive?: boolean;
      startDate?: string;
      endDate?: string;
      priority?: number;
    }
  ) {
    return this.bannersService.updateBanner(bannerId, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa banner' })
  async deleteBanner(@Param('id') bannerId: string) {
    return this.bannersService.deleteBanner(bannerId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả banner (Admin)' })
  async getAllBanners(@Query() query: {
    page?: number;
    limit?: number;
    type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PROMOTION';
    isActive?: boolean;
  }) {
    return this.bannersService.getAllBanners(query);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thống kê banner (Admin)' })
  async getBannerStats() {
    return this.bannersService.getBannerStats();
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.OWNER_ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh banner' })
  async uploadBannerImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Upload to Supabase Storage
    const fileName = `banner-${Date.now()}-${file.originalname}`;
    const publicUrl = await this.storageService.uploadFile(
      'banners',
      fileName,
      file.buffer,
      file.mimetype,
    );

    return {
      success: true,
      data: { url: publicUrl },
      message: 'Image uploaded successfully',
    };
  }
}
