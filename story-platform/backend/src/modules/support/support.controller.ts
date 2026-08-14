import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateSupportStatusDto,
} from './dto/support.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Support / Chat với Admin')
@Throttle({ support: {} })
@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // --- USER ENDPOINTS ---

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('support/conversations')
  @ApiOperation({ summary: 'Tạo yêu cầu hỗ trợ / cuộc hội thoại mới với Admin' })
  async createConversation(
    @CurrentUser('id') userId: string,
    @CurrentUser('displayName') userName: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.supportService.createConversation(userId, userName || 'Người dùng', dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('support/conversations/me')
  @ApiOperation({ summary: 'Lấy danh sách các cuộc hội thoại hỗ trợ của tôi' })
  async getMyConversations(@CurrentUser('id') userId: string) {
    return this.supportService.getConversationsForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('support/conversations/:conversationId')
  @ApiOperation({ summary: 'Lấy chi tiết cuộc hội thoại hỗ trợ của tôi' })
  async getMyConversationById(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.supportService.getConversationByIdForUser(userId, conversationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('support/conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn phản hồi từ người dùng' })
  async addUserMessage(
    @CurrentUser('id') userId: string,
    @CurrentUser('displayName') userName: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportService.addMessageFromUser(
      userId,
      userName || 'Người dùng',
      conversationId,
      dto,
    );
  }

  // --- ADMIN ENDPOINTS (OWNER_ADMIN ONLY) ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('admin/support/conversations')
  @ApiOperation({ summary: 'OWNER_ADMIN: Lấy danh sách toàn bộ các cuộc hội thoại hỗ trợ' })
  async getAdminConversations(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.supportService.getConversationsForAdmin({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      category,
      search,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('admin/support/conversations/:conversationId')
  @ApiOperation({ summary: 'OWNER_ADMIN: Lấy chi tiết cuộc hội thoại hỗ trợ' })
  async getAdminConversationById(@Param('conversationId') conversationId: string) {
    return this.supportService.getConversationByIdForAdmin(conversationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @Post('admin/support/conversations/:conversationId/messages')
  @ApiOperation({ summary: 'OWNER_ADMIN: Phản hồi tin nhắn trực tiếp cho người dùng' })
  async addAdminMessage(
    @CurrentUser('id') adminId: string,
    @CurrentUser('displayName') adminName: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportService.addMessageFromAdmin(
      adminId,
      adminName || 'Ban Quản Trị (OWNER_ADMIN)',
      conversationId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch('admin/support/conversations/:conversationId/status')
  @ApiOperation({ summary: 'OWNER_ADMIN: Cập nhật trạng thái cuộc hội thoại (RESOLVED, CLOSED...)' })
  async updateConversationStatus(
    @CurrentUser('id') adminId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateSupportStatusDto,
  ) {
    return this.supportService.updateConversationStatusByAdmin(adminId, conversationId, dto);
  }
}
