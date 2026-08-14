import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Story, StoryDocument } from './schemas/story.schema';
import { Chapter, ChapterDocument } from './schemas/chapter.schema';
import { Genre, GenreDocument } from './schemas/genre.schema';
import { PublishStatus, MembershipTier } from '../../common/enums';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
  ) {}

  async findAllPublic(query: any) {
    return this.storyModel.find({ publishStatus: 'PUBLISHED' }).exec();
  }

  async findBySlug(slug: string) {
    const story = await this.storyModel.findOne({ slug, publishStatus: 'PUBLISHED' }).exec();
    if (!story) throw new NotFoundException('Truyện không tồn tại hoặc chưa xuất bản');
    return story;
  }

  async findChaptersByStorySlug(slug: string, user?: any) {
    const story = await this.findBySlug(slug);
    const chapters = await this.chapterModel.find({ storyId: story._id, publishStatus: PublishStatus.PUBLISHED }).sort({ number: 1 }).exec();
    
    // If no user, return sanitized metadata only
    if (!user) {
      return chapters.map(chapter => ({
        id: chapter._id,
        storyId: chapter.storyId,
        number: chapter.number,
        title: chapter.title,
        slug: chapter.slug,
        durationSeconds: chapter.durationSeconds,
        isFree: chapter.isFree,
        canListen: false,
        requiresAuthentication: true,
      }));
    }

    // For authenticated users, they see metadata + canListen flag
    // But we still don't return audioUrl here to prevent easy scraping/leaks via list endpoint
    return chapters.map(chapter => {
      const canListen = chapter.isFree || user.membershipTier === MembershipTier.PREMIUM;
      return {
        id: chapter._id,
        storyId: chapter.storyId,
        number: chapter.number,
        title: chapter.title,
        slug: chapter.slug,
        durationSeconds: chapter.durationSeconds,
        isFree: chapter.isFree,
        canListen,
        requiresPremium: !chapter.isFree && user.membershipTier !== MembershipTier.PREMIUM,
      };
    });
  }

  async getChapterAccess(storySlug: string, chapterSlug: string, user: any) {
    const story = await this.findBySlug(storySlug);
    const chapter = await this.chapterModel.findOne({ 
      storyId: story._id, 
      slug: chapterSlug,
      publishStatus: PublishStatus.PUBLISHED 
    }).exec();

    if (!chapter) throw new NotFoundException('Chương không tồn tại');

    // Authentication is required (Guarded by JwtAuthGuard)
    // Check membership for Premium content
    if (!chapter.isFree && user.membershipTier !== MembershipTier.PREMIUM) {
      return {
        canListen: false,
        requiresPremium: true,
        denialReason: 'PREMIUM_REQUIRED',
        chapter: {
          title: chapter.title,
          number: chapter.number,
        }
      };
    }

    // Check account status (Defense-in-depth)
    if (user.status === 'SUSPENDED') {
      return {
        canListen: false,
        denialReason: 'ACCOUNT_SUSPENDED'
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
    return this.storyModel.updateOne(
      { _id: storyId },
      { $inc: { 'stats.listenCount': 1 } }
    ).exec();
  }

  async incrementChapterListenCount(storyId: string, chapterId: string) {
    return this.chapterModel.updateOne(
      { _id: chapterId, storyId },
      { $inc: { listenCount: 1 } }
    ).exec();
  }
}
