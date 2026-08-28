import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateCommentDto, UpdateCommentDto, GetCommentsDto } from './dto/comment.dto';

@ApiTags('Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Lấy danh sách bình luận
   */
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bình luận theo story hoặc chapter' })
  @ApiQuery({ name: 'storyId', required: false, description: 'ID của story' })
  @ApiQuery({ name: 'chapterId', required: false, description: 'ID của chapter' })
  @ApiQuery({ name: 'filter', required: false, enum: ['ALL', 'VERIFIED_ONLY', 'HELPFUL', 'NEWEST'], description: 'Bộ lọc' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng tối đa' })
  @ApiQuery({ name: 'offset', required: false, description: 'Vị trí bắt đầu' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bình luận thành công' })
  async getComments(@Query() dto: GetCommentsDto) {
    return this.commentsService.getComments(dto);
  }

  /**
   * Lấy số lượng bình luận (public endpoint)
   */
  @Public()
  @SkipThrottle()
  @Get('count')
  @ApiOperation({ summary: 'Lấy số lượng bình luận theo story hoặc chapter' })
  @ApiQuery({ name: 'storyId', required: false, description: 'ID của story' })
  @ApiQuery({ name: 'chapterId', required: false, description: 'ID của chapter' })
  @ApiResponse({ status: 200, description: 'Lấy số lượng bình luận thành công' })
  async getCommentCount(@Query('storyId') storyId?: string, @Query('chapterId') chapterId?: string) {
    return this.commentsService.getCommentCount(storyId, chapterId);
  }

  /**
   * Tạo bình luận mới
   */
  @Post()
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @ApiResponse({ status: 201, description: 'Tạo bình luận thành công' })
  async createComment(@Request() req, @Body() dto: CreateCommentDto) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.commentsService.createComment(userId, dto);
  }

  /**
   * Cập nhật bình luận
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @ApiParam({ name: 'id', description: 'ID của bình luận' })
  @ApiResponse({ status: 200, description: 'Cập nhật bình luận thành công' })
  async updateComment(@Request() req, @Param('id') id: string, @Body() dto: UpdateCommentDto) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.commentsService.updateComment(id, userId, dto);
  }

  /**
   * Xóa bình luận
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiParam({ name: 'id', description: 'ID của bình luận' })
  @ApiResponse({ status: 200, description: 'Xóa bình luận thành công' })
  async deleteComment(@Request() req, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.commentsService.deleteComment(id, userId);
  }

  /**
   * Vote helpful cho bình luận
   */
  @Post(':id/vote-helpful')
  @ApiOperation({ summary: 'Vote helpful cho bình luận' })
  @ApiParam({ name: 'id', description: 'ID của bình luận' })
  @ApiResponse({ status: 200, description: 'Vote thành công' })
  async voteHelpful(@Request() req, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.commentsService.voteHelpful(id, userId);
  }
}
