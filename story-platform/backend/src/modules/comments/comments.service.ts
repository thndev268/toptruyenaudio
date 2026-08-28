import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto, GetCommentsDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
