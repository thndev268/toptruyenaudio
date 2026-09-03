import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipTier } from '../../common/enums';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic(query: any) {
    const { genre, search, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const stories = await this.prisma.story.findMany({
      where: {
        publishStatus: 'PUBLISHED',
        ...(genre && {
          genres: { some: { genre: { slug: genre } } },
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { authorName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        genres: {
          include: { genre: true },
        },
        _count: {
          select: { chapters: true },
        },
        chapters: {
          where: { publishStatus: 'PUBLISHED' },
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            title: true,
            slug: true,
            durationSeconds: true,
            accessLevel: true,
          },
        },
      },
      orderBy: { listenCount: 'desc' },
      skip,
      take: Number(limit),
    });

    // Transform genres from GenreToStory[] to Genre[] for consistent API response
    // Add totalChapters count
    return stories.map(story => ({
      ...story,
      genres: story.genres ? story.genres.map(g => g.genre) : [],
      totalChapters: story._count.chapters || 0,
    }));
  }

  async findBySlug(slug: string) {
    const story = await this.prisma.story.findFirst({
      where: { slug, publishStatus: 'PUBLISHED' },
      include: {
        genres: {
          include: { genre: true },
        },
        chapters: {
          where: { publishStatus: 'PUBLISHED' },
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            title: true,
            slug: true,
            durationSeconds: true,
            accessLevel: true,
          },
        },
      },
    });

    if (!story) throw new NotFoundException('Truyện không tồn tại hoặc chưa xuất bản');
    return story;
  }

  async findChaptersByStorySlug(slug: string, user?: any) {
    const story = await this.prisma.story.findFirst({
      where: { slug, publishStatus: 'PUBLISHED' },
    });
    if (!story) throw new NotFoundException('Truyện không tồn tại hoặc chưa xuất bản');

    const chapters = await this.prisma.chapter.findMany({
      where: { storyId: story.id, publishStatus: 'PUBLISHED' },
      orderBy: { number: 'asc' },
    });

    // Unauthenticated: trả về metadata + flag requiresAuthentication
    if (!user) {
      return chapters.map(chapter => ({
        id: chapter.id,
        storyId: chapter.storyId,
        number: chapter.number,
        title: chapter.title,
        slug: chapter.slug,
        durationSeconds: chapter.durationSeconds,
        isFree: chapter.accessLevel === 'FREE',
        canListen: false,
        requiresAuthentication: true,
      }));
    }

    // Authenticated: trả về metadata + canListen flag (không expose audioUrl)
    return chapters.map(chapter => {
      const isFree = chapter.accessLevel === 'FREE';
      const isPremium = user.membershipTier === MembershipTier.PREMIUM;
      const canListen = isFree || isPremium;
      return {
        id: chapter.id,
        storyId: chapter.storyId,
        number: chapter.number,
        title: chapter.title,
        slug: chapter.slug,
        durationSeconds: chapter.durationSeconds,
        isFree,
        canListen,
        requiresPremium: !isFree && !isPremium,
      };
    });
  }

  async getChapterAccess(storySlug: string, chapterSlug: string, user: any) {
    const story = await this.prisma.story.findFirst({
      where: { slug: storySlug, publishStatus: 'PUBLISHED' },
    });
    if (!story) {
      this.logger.warn(`Story not found with slug: ${storySlug}`);
      throw new NotFoundException('Truyện không tồn tại hoặc chưa xuất bản');
    }

    const chapter = await this.prisma.chapter.findFirst({
      where: {
        storyId: story.id,
        slug: chapterSlug,
        publishStatus: 'PUBLISHED',
      },
    });
    if (!chapter) {
      this.logger.warn(`Chapter not found with slug: ${chapterSlug} for story: ${storySlug}`);
      throw new NotFoundException('Chương không tồn tại');
    }

    // Guest user - only allow FREE content with 15 minute limit
    if (!user) {
      const isFree = chapter.accessLevel === 'FREE';
      if (!isFree) {
        return {
          canListen: false,
          requiresAuth: true,
          denialReason: 'AUTH_REQUIRED',
          chapter: {
            title: chapter.title,
            number: chapter.number,
          },
        };
      }
      return {
        canListen: true,
        audioUrl: chapter.audioUrl,
        title: chapter.title,
        number: chapter.number,
        storyTitle: story.title,
        isGuest: true,
        guestLimitMinutes: 15,
      };
    }

    // Kiểm tra account bị suspended (defense-in-depth)
    if (user.status === 'SUSPENDED') {
      return {
        canListen: false,
        denialReason: 'ACCOUNT_SUSPENDED',
      };
    }

    const isFree = chapter.accessLevel === 'FREE';
    const isPremium = user.membershipTier === MembershipTier.PREMIUM;

    // Premium content yêu cầu subscription (chỉ kiểm tra cấp chapter)
    if (!isFree && !isPremium) {
      return {
        canListen: false,
        requiresPremium: true,
        denialReason: 'PREMIUM_REQUIRED',
        chapter: {
          title: chapter.title,
          number: chapter.number,
        },
      };
    }

    return {
      canListen: true,
      audioUrl: chapter.audioUrl,
      title: chapter.title,
      number: chapter.number,
      storyTitle: story.title,
    };
  }

  async incrementListenCount(storyId: string) {
    return this.prisma.story.update({
      where: { id: storyId },
      data: { listenCount: { increment: 1 } },
    });
  }

  async incrementChapterListenCount(storyId: string, chapterId: string) {
    // Chapter model không có listenCount trong schema Prisma hiện tại.
    // Log để theo dõi, không throw error để tránh crash listening flow.
    this.logger.warn(
      `incrementChapterListenCount called (storyId=${storyId}, chapterId=${chapterId}) ` +
      `but Chapter model has no listenCount field in Prisma schema. Skipping.`,
    );
  }
}
