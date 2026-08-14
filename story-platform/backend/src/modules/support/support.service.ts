import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SupportConversation,
  SupportConversationDocument,
} from './schemas/support-conversation.schema';
import {
  SupportMessage,
  SupportMessageDocument,
} from './schemas/support-message.schema';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateSupportStatusDto,
} from './dto/support.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportConversation.name)
    private readonly conversationModel: Model<SupportConversationDocument>,
    @InjectModel(SupportMessage.name)
    private readonly messageModel: Model<SupportMessageDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createConversation(
    userId: string,
    userName: string,
    dto: CreateConversationDto,
  ) {
    const conv = new this.conversationModel({
      userId: new Types.ObjectId(userId),
      userName,
      subject: dto.subject,
      category: dto.category || 'OTHER',
      status: 'WAITING_FOR_ADMIN',
      priority: dto.priority || 'NORMAL',
      lastMessageAt: new Date(),
      userUnreadCount: 0,
      adminUnreadCount: 1,
    });
    const savedConv = await conv.save();

    const msg = new this.messageModel({
      conversationId: savedConv._id,
      senderId: new Types.ObjectId(userId),
      senderRole: 'USER',
      senderName: userName,
      content: dto.message,
      createdAt: new Date(),
    });
    await msg.save();

    return this.formatConversation(savedConv, [msg]);
  }

  async getConversationsForUser(userId: string) {
    const convs = await this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastMessageAt: -1 })
      .exec();

    // Reset user unread count for fetched items if needed
    const convIds = convs.map((c) => c._id);
    const messages = await this.messageModel
      .find({ conversationId: { $in: convIds }, hiddenAt: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();

    const msgMap = new Map<string, SupportMessageDocument[]>();
    messages.forEach((m) => {
      const cid = m.conversationId.toString();
      if (!msgMap.has(cid)) msgMap.set(cid, []);
      msgMap.get(cid)!.push(m);
    });

    return convs.map((c) =>
      this.formatConversation(c, msgMap.get(c._id.toString()) || []),
    );
  }

  async getConversationByIdForUser(userId: string, conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('ID cuộc hội thoại không hợp lệ');
    }

    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conv.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem cuộc hội thoại này');
    }

    // Mark userUnreadCount as 0
    if (conv.userUnreadCount > 0) {
      conv.userUnreadCount = 0;
      await conv.save();
    }

    const messages = await this.messageModel
      .find({
        conversationId: conv._id,
        hiddenAt: { $exists: false },
      })
      .sort({ createdAt: 1 })
      .exec();

    return this.formatConversation(conv, messages);
  }

  async addMessageFromUser(
    userId: string,
    userName: string,
    conversationId: string,
    dto: CreateMessageDto,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('ID cuộc hội thoại không hợp lệ');
    }

    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conv.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền gửi tin nhắn vào hội thoại này');
    }

    if (conv.status === 'CLOSED') {
      throw new BadRequestException('Cuộc hội thoại đã đóng, không thể gửi thêm tin nhắn');
    }

    // Check clientMessageId idempotency
    if (dto.clientMessageId) {
      const existing = await this.messageModel
        .findOne({ conversationId: conv._id, clientMessageId: dto.clientMessageId })
        .exec();
      if (existing) {
        const messages = await this.messageModel
          .find({ conversationId: conv._id, hiddenAt: { $exists: false } })
          .sort({ createdAt: 1 })
          .exec();
        return this.formatConversation(conv, messages);
      }
    }

    const msg = new this.messageModel({
      conversationId: conv._id,
      senderId: new Types.ObjectId(userId),
      senderRole: 'USER',
      senderName: userName,
      clientMessageId: dto.clientMessageId,
      content: dto.content,
      createdAt: new Date(),
    });
    await msg.save();

    conv.lastMessageAt = new Date();
    conv.status = 'WAITING_FOR_ADMIN';
    conv.adminUnreadCount += 1;
    await conv.save();

    const messages = await this.messageModel
      .find({ conversationId: conv._id, hiddenAt: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();

    return this.formatConversation(conv, messages);
  }

  // --- Admin Methods ---

  async getConversationsForAdmin(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }) {
    const query: any = {};
    if (params.status) query.status = params.status;
    if (params.category) query.category = params.category;
    if (params.search) {
      query.$or = [
        { subject: { $regex: params.search, $options: 'i' } },
        { userName: { $regex: params.search, $options: 'i' } },
      ];
    }

    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [convs, total] = await Promise.all([
      this.conversationModel
        .find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.conversationModel.countDocuments(query).exec(),
    ]);

    const convIds = convs.map((c) => c._id);
    const messages = await this.messageModel
      .find({ conversationId: { $in: convIds }, hiddenAt: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();

    const msgMap = new Map<string, SupportMessageDocument[]>();
    messages.forEach((m) => {
      const cid = m.conversationId.toString();
      if (!msgMap.has(cid)) msgMap.set(cid, []);
      msgMap.get(cid)!.push(m);
    });

    return {
      items: convs.map((c) =>
        this.formatConversation(c, msgMap.get(c._id.toString()) || []),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversationByIdForAdmin(conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('ID cuộc hội thoại không hợp lệ');
    }

    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    // Reset adminUnreadCount
    if (conv.adminUnreadCount > 0) {
      conv.adminUnreadCount = 0;
      await conv.save();
    }

    const messages = await this.messageModel
      .find({ conversationId: conv._id, hiddenAt: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();

    return this.formatConversation(conv, messages);
  }

  async addMessageFromAdmin(
    adminId: string,
    adminName: string,
    conversationId: string,
    dto: CreateMessageDto,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('ID cuộc hội thoại không hợp lệ');
    }

    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (dto.clientMessageId) {
      const existing = await this.messageModel
        .findOne({ conversationId: conv._id, clientMessageId: dto.clientMessageId })
        .exec();
      if (existing) {
        const messages = await this.messageModel
          .find({ conversationId: conv._id, hiddenAt: { $exists: false } })
          .sort({ createdAt: 1 })
          .exec();
        return this.formatConversation(conv, messages);
      }
    }

    const msg = new this.messageModel({
      conversationId: conv._id,
      senderId: new Types.ObjectId(adminId),
      senderRole: 'OWNER_ADMIN',
      senderName: adminName || 'Ban Quản Trị (OWNER_ADMIN)',
      clientMessageId: dto.clientMessageId,
      content: dto.content,
      createdAt: new Date(),
    });
    await msg.save();

    conv.lastMessageAt = new Date();
    conv.status = 'WAITING_FOR_USER';
    conv.userUnreadCount += 1;
    await conv.save();

    const messages = await this.messageModel
      .find({ conversationId: conv._id, hiddenAt: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();

    return this.formatConversation(conv, messages);
  }

  async updateConversationStatusByAdmin(
    adminId: string,
    conversationId: string,
    dto: UpdateSupportStatusDto,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('ID cuộc hội thoại không hợp lệ');
    }

    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    const oldStatus = conv.status;
    conv.status = dto.status;
    if (dto.status === 'RESOLVED') {
      conv.resolvedAt = new Date();
    } else if (dto.status === 'CLOSED') {
      conv.closedAt = new Date();
    }
    await conv.save();

    await this.auditLogsService.log({
      performedByAdminId: adminId,
      action: 'UPDATE_SUPPORT_STATUS',
      resource: 'SupportConversation',
      resourceId: conv._id.toString(),
      entityName: conv.subject,
      reason: dto.reason || `Chuyển trạng thái từ ${oldStatus} sang ${dto.status}`,
    });

    const messages = await this.messageModel
      .find({ conversationId: conv._id, hiddenAt: { $exists: false } })
      .sort({ createdAt: 1 })
      .exec();

    return this.formatConversation(conv, messages);
  }

  private formatConversation(
    conv: SupportConversationDocument,
    messages: SupportMessageDocument[],
  ) {
    return {
      id: conv._id.toString(),
      userId: conv.userId.toString(),
      userName: conv.userName,
      subject: conv.subject,
      category: conv.category,
      status: conv.status,
      priority: conv.priority,
      lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : new Date().toISOString(),
      userUnreadCount: conv.userUnreadCount,
      adminUnreadCount: conv.adminUnreadCount,
      resolvedAt: conv.resolvedAt ? conv.resolvedAt.toISOString() : undefined,
      closedAt: conv.closedAt ? conv.closedAt.toISOString() : undefined,
      createdAt: (conv as any).createdAt ? (conv as any).createdAt.toISOString() : new Date().toISOString(),
      updatedAt: (conv as any).updatedAt ? (conv as any).updatedAt.toISOString() : new Date().toISOString(),
      messages: messages.map((m) => ({
        id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        senderId: m.senderId.toString(),
        senderRole: m.senderRole,
        senderName: m.senderName,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}
