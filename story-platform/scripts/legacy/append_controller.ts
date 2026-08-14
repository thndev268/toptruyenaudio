import * as fs from 'fs';
const file = 'story-platform/backend/src/modules/listening/listening.controller.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace imports
content = content.replace(/StartSessionDto, HeartbeatDto/, 'StartSessionDto, HeartbeatDto, UpsertListeningProgressDto');
content = content.replace(/import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs\/common';/, "import { Controller, Post, Patch, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';");

const methods = `
  @Get('me/progress')
  @ApiOperation({ summary: 'Lấy tiến độ nghe/xem của người dùng' })
  async getListeningProgress(@CurrentUser() user: any) {
    return this.listeningService.getListeningProgress(user.id);
  }

  @Get('me/progress/:chapterId')
  @ApiOperation({ summary: 'Lấy tiến độ nghe/xem theo tập' })
  async getListeningProgressByChapter(@CurrentUser() user: any, @Param('chapterId') chapterId: string) {
    return this.listeningService.getListeningProgressByChapter(user.id, chapterId);
  }

  @Put('me/progress/:chapterId')
  @ApiOperation({ summary: 'Cập nhật tiến độ nghe/xem' })
  async upsertListeningProgress(
    @CurrentUser() user: any,
    @Param('chapterId') chapterId: string,
    @Body() dto: UpsertListeningProgressDto,
  ) {
    return this.listeningService.upsertListeningProgress(user.id, chapterId, dto);
  }

  @Delete('me/progress/:chapterId')
  @ApiOperation({ summary: 'Xóa tiến độ nghe/xem của tập' })
  async deleteListeningProgressByChapter(@CurrentUser() user: any, @Param('chapterId') chapterId: string) {
    return this.listeningService.deleteListeningProgress(user.id, chapterId);
  }

  @Delete('me/progress')
  @ApiOperation({ summary: 'Xóa toàn bộ tiến độ' })
  async deleteAllListeningProgress(@CurrentUser() user: any) {
    return this.listeningService.deleteListeningProgress(user.id);
  }
}
`;

content = content.replace(/\n\}\s*$/, methods);
fs.writeFileSync(file, content);
