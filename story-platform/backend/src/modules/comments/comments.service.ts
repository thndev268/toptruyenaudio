import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto, GetCommentsDto } from './dto/comment.dto';
import { ProfanityFilterService } from './profanity-filter.service';
import { OpenAIModerationService } from './openai-moderation.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profanityFilter: ProfanityFilterService,
    private readonly openaiModeration: OpenAIModerationService
  ) {}

  /**
   * Lấy danh sách bình luận theo story hoặc chapter
   */
  async getComments(dto: GetCommentsDto) {
    const { storyId, chapterId, filter = 'NEWEST', limit = '20', offset = '0' } = dto;

    if (!storyId && !chapterId) {
      throw new BadRequestException('Cần cung cấp storyId hoặc chapterId');
    }

    const parsedLimit = parseInt(limit, 10) || 20;
    const parsedOffset = parseInt(offset, 10) || 0;

    const where: any = {
      status: 'APPROVED',
    };

    if (storyId) {
      where.storyId = storyId;
    }

    if (chapterId) {
      where.chapterId = chapterId;
    }

    // Lấy các bình luận top-level (không có parentId)
    const topLevelComments = await this.prisma.comment.findMany({
      where: {
        ...where,
        parentId: null,
      },
      include: {
        profile: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            profile: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: this.getOrderBy(filter),
      take: parsedLimit,
      skip: parsedOffset,
    });

    // Đếm tổng số bình luận
    const total = await this.prisma.comment.count({
      where,
    });

    return {
      success: true,
      data: topLevelComments,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total,
      },
    };
  }

  /**
   * Lấy số lượng bình luận theo story hoặc chapter
   */
  async getCommentCount(storyId?: string, chapterId?: string) {
    if (!storyId && !chapterId) {
      throw new BadRequestException('Cần cung cấp storyId hoặc chapterId');
    }

    const where: any = {
      status: 'APPROVED',
    };

    if (storyId) {
      where.storyId = storyId;
    }

    if (chapterId) {
      where.chapterId = chapterId;
    }

    const count = await this.prisma.comment.count({
      where,
    });

    return {
      success: true,
      data: { count },
    };
  }

  /**
   * Tạo bình luận mới
   */
  async createComment(userId: string, dto: CreateCommentDto) {
    const { storyId, chapterId, content, hasSpoiler, parentId } = dto;

    // Kiểm tra user có bị block comment không
    const user = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Kiểm tra nếu user đang bị block
    if ((user as any).commentBlockedUntil && (user as any).commentBlockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        ((user as any).commentBlockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      throw new BadRequestException(
        `Bạn đã bị chặn bình luận do vi phạm quy định. Vui lòng thử lại sau ${remainingMinutes} phút.`
      );
    }

    // Kiểm tra nội dung có từ ngữ không phù hợp
    const profanityCheck = this.profanityFilter.checkProfanity(content);

    if (profanityCheck.containsProfanity) {
      // Tăng số lần cảnh báo
      const warningCount = ((user as any).commentWarningCount || 0) + 1;
      
      // Xác định thời gian block dựa trên số lần vi phạm
      let blockDuration: number | null = null;
      if (warningCount >= 5) {
        blockDuration = 7 * 24 * 60 * 60 * 1000; // 7 ngày
      } else if (warningCount >= 3) {
        blockDuration = 24 * 60 * 60 * 1000; // 1 ngày
      } else if (warningCount >= 2) {
        blockDuration = 60 * 60 * 1000; // 1 giờ
      }

      const blockedUntil = blockDuration ? new Date(Date.now() + blockDuration) : null;

      // Cập nhật user với cảnh báo mới
      await this.prisma.profile.update({
        where: { id: userId },
        data: {
          commentWarningCount: warningCount,
          commentBlockedUntil: blockedUntil,
          lastCommentWarningAt: new Date(),
        },
      });

      // Tạo thông báo cảnh báo cho user
      await this.prisma.userNotification.create({
        data: {
          notificationId: 'system-warning',
          userId,
          isRead: false,
        },
      });

      // Nếu bị block, throw error
      if (blockDuration !== null) {
        const remainingHours = Math.ceil(blockDuration / (1000 * 60 * 60));
        throw new BadRequestException(
          `Bình luận của bạn chứa từ ngữ không phù hợp. Bạn đã bị chặn bình luận trong ${remainingHours} giờ do vi phạm quy định ${warningCount} lần.`
        );
      }

      // Nếu chưa bị block, chỉ cảnh báo và từ chối comment này
      throw new BadRequestException(
        `Bình luận của bạn chứa từ ngữ không phù hợp (${profanityCheck.detectedWords.join(', ')}). Đây là lần cảnh báo thứ ${warningCount}. Vui lòng sử dụng ngôn ngữ lịch sự.`
      );
    }

    // Kiểm tra nội dung với OpenAI Moderation API (nếu được bật)
    if (this.openaiModeration.isEnabled()) {
      const moderationResult = await this.openaiModeration.moderateContent(content);
      
      if (moderationResult.flagged) {
        // Tăng số lần cảnh báo
        const warningCount = ((user as any).commentWarningCount || 0) + 1;
        
        // Xác định thời gian block dựa trên số lần vi phạm
        let blockDuration: number | null = null;
        if (warningCount >= 5) {
          blockDuration = 7 * 24 * 60 * 60 * 1000; // 7 ngày
        } else if (warningCount >= 3) {
          blockDuration = 24 * 60 * 60 * 1000; // 1 ngày
        } else if (warningCount >= 2) {
          blockDuration = 60 * 60 * 1000; // 1 giờ
        }

        const blockedUntil = blockDuration ? new Date(Date.now() + blockDuration) : null;

        // Cập nhật user với cảnh báo mới
        await this.prisma.profile.update({
          where: { id: userId },
          data: {
            commentWarningCount: warningCount,
            commentBlockedUntil: blockedUntil,
            lastCommentWarningAt: new Date(),
          },
        });

        // Tạo thông báo cảnh báo cho user
        await this.prisma.userNotification.create({
          data: {
            notificationId: 'system-warning',
            userId,
            isRead: false,
          },
        });

        // Nếu bị block, throw error
        if (blockDuration !== null) {
          const remainingHours = Math.ceil(blockDuration / (1000 * 60 * 60));
          throw new BadRequestException(
            `Bình luận của bạn chứa nội dung không phù hợp (${moderationResult.detectedCategories.join(', ')}). Bạn đã bị chặn bình luận trong ${remainingHours} giờ do vi phạm quy định ${warningCount} lần.`
          );
        }

        // Nếu chưa bị block, chỉ cảnh báo và từ chối comment này
        throw new BadRequestException(
          `Bình luận của bạn chứa nội dung không phù hợp (${moderationResult.detectedCategories.join(', ')}). Đây là lần cảnh báo thứ ${warningCount}. Vui lòng sử dụng ngôn ngữ lịch sự.`
        );
      }
    }

    // Kiểm tra story tồn tại
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Không tìm thấy câu chuyện');
    }

    // Nếu có chapterId, kiểm tra chapter tồn tại
    if (chapterId) {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
      });

      if (!chapter) {
        throw new NotFoundException('Không tìm thấy tập');
      }
    }

    // Nếu có parentId, kiểm tra parent comment tồn tại
    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Không tìm thấy bình luận cha');
      }
    }

    // Kiểm tra user đã nghe story này chưa (để đánh dấu verifiedListener)
    const listeningProgress = await this.prisma.listeningProgress.findFirst({
      where: {
        profileId: userId,
        storyId,
      },
    });

    const verifiedListener = !!listeningProgress;

    const comment = await this.prisma.comment.create({
      data: {
        storyId,
        chapterId,
        userId,
        parentId,
        content,
        hasSpoiler: hasSpoiler || false,
        verifiedListener,
        status: 'APPROVED', // Auto-approve cho demo
      },
      include: {
        profile: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      data: comment,
      message: 'Đã tạo bình luận thành công',
    };
  }

  /**
   * Cập nhật bình luận
   */
  async updateComment(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bình luận này');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        hasSpoiler: dto.hasSpoiler,
      },
      include: {
        profile: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updated,
      message: 'Đã cập nhật bình luận thành công',
    };
  }

  /**
   * Xóa bình luận
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    // Xóa comment và tất cả replies
    await this.prisma.comment.deleteMany({
      where: {
        OR: [
          { id: commentId },
          { parentId: commentId },
        ],
      },
    });

    return {
      success: true,
      message: 'Đã xóa bình luận thành công',
    };
  }

  /**
   * Vote helpful cho comment
   */
  async voteHelpful(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    // Kiểm tra user đã vote chưa (sử dụng một bảng votes riêng hoặc đơn giản hóa)
    // Ở đây đơn giản hóa bằng cách tăng helpfulCount
    // Trong thực tế nên có bảng CommentVote để track user đã vote chưa

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      data: {
        helpfulCount: updated.helpfulCount,
        voted: true,
      },
      message: 'Đã vote thành công',
    };
  }

  /**
   * Helper function để xác định order by dựa trên filter
   */
  private getOrderBy(filter: string) {
    switch (filter) {
      case 'HELPFUL':
        return { helpfulCount: 'desc' as const };
      case 'VERIFIED_ONLY':
        return { verifiedListener: 'desc' as const };
      case 'NEWEST':
      default:
        return { createdAt: 'desc' as const };
    }
  }

  /**
   * Lấy danh sách từ ngữ lọc
   */
  getProfanityWords() {
    return {
      success: true,
      data: this.profanityFilter.getProfanityList(),
    };
  }

  /**
   * Thêm từ ngữ lọc
   */
  addProfanityWord(word: string) {
    if (!word || word.trim().length === 0) {
      throw new BadRequestException('Từ ngữ không được để trống');
    }
    this.profanityFilter.addProfanityWord(word.trim());
    return {
      success: true,
      message: 'Đã thêm từ ngữ lọc thành công',
      data: { word: word.trim() },
    };
  }

  /**
   * Xóa từ ngữ lọc
   */
  removeProfanityWord(word: string) {
    this.profanityFilter.removeProfanityWord(word);
    return {
      success: true,
      message: 'Đã xóa từ ngữ lọc thành công',
      data: { word },
    };
  }
}
