import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialLinksService } from './social-links.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountRole } from '../../common/enums';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-links.dto';

@ApiTags('Social Media Links Management (OWNER_ADMIN)')
@Controller('admin/social-links')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.OWNER_ADMIN)
@ApiBearerAuth()
export class SocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả social media links' })
  async getAll() {
    return this.socialLinksService.getAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy social media links đang active (cho public)' })
  async getActive() {
    return this.socialLinksService.getActive();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo social media link mới' })
  async create(@Body() dto: CreateSocialLinkDto) {
    return this.socialLinksService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật social media link' })
  async update(@Param('id') id: string, @Body() dto: UpdateSocialLinkDto) {
    return this.socialLinksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa social media link' })
  async delete(@Param('id') id: string) {
    return this.socialLinksService.delete(id);
  }

  @Put(':id/toggle')
  @ApiOperation({ summary: 'Bật/tắt social media link' })
  async toggle(@Param('id') id: string) {
    return this.socialLinksService.toggle(id);
  }
}
