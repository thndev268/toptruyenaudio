import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ListeningSession, ListeningSessionDocument } from './schemas/listening-session.schema';
import { ListeningProgress, ListeningProgressDocument } from './schemas/listening-progress.schema';
import { StoriesService } from '../stories/stories.service';
import { StartSessionDto, HeartbeatDto, UpsertListeningProgressDto } from './dto/listening.dto';
import { ListeningSessionStatus, MembershipTier } from '../../common/enums';
import { InMemoryListeningProgressRepository, isValidProgressId } from './in-memory-progress.repository';


@Injectable()
export class ListeningService {
  private readonly HEARTBEAT_MAX_GAP_SECONDS = 45;
  private readonly QUALIFIED_PLAY_THRESHOLD_SECONDS = 30;
  private isMemoryProvider: boolean;

  constructor(
    @InjectModel(ListeningSession.name) private sessionModel: Model<ListeningSessionDocument>,
    @InjectModel(ListeningProgress.name) private progressModel: Model<ListeningProgressDocument>,
    private storiesService: StoriesService,
    private memoryRepo: InMemoryListeningProgressRepository,
    private configService: ConfigService
  ) {
    // Check if DATA_PROVIDER=memory, default to memory if MONGODB_URI is absent
    const dataProvider = this.configService.get<string>('DATA_PROVIDER');
    const mongoUri = this.configService.get<string>('mongodbUri') || process.env.MONGODB_URI;
    this.isMemoryProvider = dataProvider === 'memory' || !mongoUri || mongoUri.includes('127.0.0.1');
    if (this.isMemoryProvider) {
      console.warn('DATABASE_READY_NOT_CONNECTED: MongoDB NOT_CONNECTED. Using InMemoryListeningProgressRepository (DEMO_ONLY).');
    }
  }

  // --- Session logic omitted for brevity, keeping same logic ---
  async startSession(userId: string, dto: StartSessionDto) {
    const story = await this.storiesService.findBySlug(dto.storySlug);
    const chapters = await this.storiesService.findChaptersByStorySlug(dto.storySlug, { membershipTier: MembershipTier.PREMIUM });
    const chapter = chapters.find(c => c.slug === dto.chapterSlug);
    
    if (!chapter) throw new NotFoundException('Chapter not found');
    
    if (!this.isMemoryProvider) {
       const session = new this.sessionModel({
         userId, storyId: story.id, chapterId: chapter.id,
         startedAt: new Date(), lastHeartbeatAt: new Date(),
         lastPositionSeconds: dto.startPosition || 0, playbackRate: dto.playbackRate || 1,
         status: ListeningSessionStatus.ACTIVE,
       });
       return session.save();
    }
    return { id: 'mock-session', status: ListeningSessionStatus.ACTIVE };
  }

  async handleHeartbeat(userId: string, sessionId: string, dto: HeartbeatDto) {
    if (this.isMemoryProvider) return { id: sessionId, status: ListeningSessionStatus.ACTIVE };
    
    const session = await this.sessionModel.findOne({ _id: sessionId, userId }).exec();
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== ListeningSessionStatus.ACTIVE) throw new BadRequestException('Session is no longer active');
    
    const now = new Date();
    const diffSeconds = (now.getTime() - session.lastHeartbeatAt.getTime()) / 1000;
    
    if (diffSeconds > this.HEARTBEAT_MAX_GAP_SECONDS) {
      session.lastHeartbeatAt = now;
      session.lastPositionSeconds = dto.currentPosition;
      return session.save();
    }
    
    session.validListeningSeconds += diffSeconds;
    session.audioContentSecondsPlayed += diffSeconds * (dto.playbackRate || session.playbackRate);
    session.lastHeartbeatAt = now;
    session.lastPositionSeconds = dto.currentPosition;
    session.playbackRate = dto.playbackRate || session.playbackRate;
    
    if (!session.playQualifiedAt && session.validListeningSeconds >= this.QUALIFIED_PLAY_THRESHOLD_SECONDS) {
      session.playQualifiedAt = now;
      await Promise.all([
        this.storiesService.incrementListenCount(session.storyId),
        this.storiesService.incrementChapterListenCount(session.storyId, session.chapterId),
      ]).catch(err => console.error('Failed to increment listen counts:', err));
    }
    return session.save();
  }

  async completeSession(userId: string, sessionId: string) {
    if (this.isMemoryProvider) return { id: sessionId, status: ListeningSessionStatus.COMPLETED };
    const session = await this.sessionModel.findOne({ _id: sessionId, userId }).exec();
    if (!session) throw new NotFoundException('Session not found');
    session.status = ListeningSessionStatus.COMPLETED;
    session.endedAt = new Date();
    session.completedAt = new Date();
    return session.save();
  }

  async getUserHistory(userId: string) {
    if (this.isMemoryProvider) return [];
    return this.sessionModel.find({ userId }).sort({ updatedAt: -1 }).limit(50).populate('storyId').populate('chapterId').exec();
  }

  async getUserMetrics(userId: string) {
    if (this.isMemoryProvider) return { totalListeningSeconds: 0, totalPlays: 0, completedCount: 0 };
    const stats = await this.sessionModel.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalSeconds: { $sum: '$validListeningSeconds' }, totalPlays: { $sum: { $cond: [{ $ifNull: ['$playQualifiedAt', false] }, 1, 0] } }, completedCount: { $sum: { $cond: [{ $eq: ['$status', ListeningSessionStatus.COMPLETED] }, 1, 0] } } } }
    ]);
    const result = stats[0] || { totalSeconds: 0, totalPlays: 0, completedCount: 0 };
    return { totalListeningSeconds: result.totalSeconds, totalPlays: result.totalPlays, completedCount: result.completedCount };
  }

  // --- Progress logic using InMemory or MongoDB ---
  async getListeningProgress(userId: string) {
    if (!isValidProgressId(userId)) return [];
    if (this.isMemoryProvider) return this.memoryRepo.find(userId);
    return this.progressModel.find({ userId }).exec();
  }

  async getListeningProgressByChapter(userId: string, chapterId: string) {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return null;
    if (this.isMemoryProvider) return this.memoryRepo.findOne(userId, chapterId);
    return this.progressModel.findOne({ userId, chapterId }).exec();
  }

  async upsertListeningProgress(userId: string, chapterId: string, dto: UpsertListeningProgressDto) {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) {
      throw new BadRequestException('Invalid userId or chapterId for progress storage');
    }
    if (this.isMemoryProvider) return this.memoryRepo.upsert(userId, chapterId, dto);

    let progressPercent = 0;
    if (dto.durationSeconds > 0) progressPercent = (dto.positionSeconds / dto.durationSeconds) * 100;
    if (progressPercent > 100) progressPercent = 100;
    if (progressPercent < 0) progressPercent = 0;

    const remainingSeconds = dto.durationSeconds - dto.positionSeconds;
    const isCompleted = dto.completed || (dto.durationSeconds > 0 && (remainingSeconds <= 15 || progressPercent >= 95));

    const existing = await this.progressModel.findOne({ userId, chapterId }).exec();
    
    let nextVersion = 1;
    if (existing) {
       if (dto.version && dto.version < (existing as any).version) {
          return existing;
       }
       nextVersion = ((existing as any).version || 1) + 1;
    }

    return this.progressModel.findOneAndUpdate(
      { userId, chapterId },
      { $set: { storyId: dto.storyId, positionSeconds: dto.positionSeconds, durationSeconds: dto.durationSeconds, progressPercent, completed: isCompleted, playbackMode: dto.playbackMode, playbackRate: dto.playbackRate, lastPlayedAt: new Date(), version: nextVersion } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }

  async clearListeningProgress(userId: string) {
    if (!isValidProgressId(userId)) return { deletedCount: 0 };
    if (this.isMemoryProvider) {
      await this.memoryRepo.deleteMany(userId);
      return { deletedCount: 1 };
    }
    return this.progressModel.deleteMany({ userId }).exec();
  }

  async deleteListeningProgress(userId: string, chapterId: string) {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return { deletedCount: 0 };
    if (this.isMemoryProvider) {
      await this.memoryRepo.deleteOne(userId, chapterId);
      return { deletedCount: 1 };
    }
    return this.progressModel.deleteOne({ userId, chapterId }).exec();
  }
}
