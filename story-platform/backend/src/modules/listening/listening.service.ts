import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
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
       return this.prisma.listeningSession.create({
         data: {
           profileId: userId, storyId: story.id, chapterId: chapter.id,
           startedAt: new Date(), lastHeartbeatAt: new Date(),
           lastPositionSeconds: dto.startPosition || 0, playbackRate: dto.playbackRate || 1,
           status: ListeningSessionStatus.ACTIVE,
         }
       });
    }
    return { id: 'mock-session', status: ListeningSessionStatus.ACTIVE };
  }

  async handleHeartbeat(userId: string, sessionId: string, dto: HeartbeatDto) {
    if (this.isMemoryProvider) return { id: sessionId, status: ListeningSessionStatus.ACTIVE };
    
    const session = await this.prisma.listeningSession.findUnique({ where: { id: sessionId } });
    if (!session || session.profileId !== userId) throw new NotFoundException('Session not found');
    if (session.status && session.status !== ListeningSessionStatus.ACTIVE) throw new BadRequestException('Session is no longer active');
    
    const now = new Date();
    const diffSeconds = session.lastHeartbeatAt ? (now.getTime() - session.lastHeartbeatAt.getTime()) / 1000 : 0;
    
    if (diffSeconds > this.HEARTBEAT_MAX_GAP_SECONDS) {
      return this.prisma.listeningSession.update({
        where: { id: sessionId },
        data: {
          lastHeartbeatAt: now,
          lastPositionSeconds: dto.currentPosition
        }
      });
    }
    
    const updatedSession = await this.prisma.listeningSession.update({
      where: { id: sessionId },
      data: {
        validListeningSeconds: { increment: diffSeconds },
        audioContentSecondsPlayed: { increment: diffSeconds * (dto.playbackRate || session.playbackRate) },
        lastHeartbeatAt: now,
        lastPositionSeconds: dto.currentPosition,
        playbackRate: dto.playbackRate || session.playbackRate,
        playQualifiedAt: (!session.playQualifiedAt && (session.validListeningSeconds + diffSeconds) >= this.QUALIFIED_PLAY_THRESHOLD_SECONDS) ? now : session.playQualifiedAt,
      }
    });
    
    if (!session.playQualifiedAt && updatedSession.playQualifiedAt) {
      if (session.storyId && session.chapterId) {
        await Promise.all([
          this.storiesService.incrementListenCount(session.storyId),
          this.storiesService.incrementChapterListenCount(session.storyId, session.chapterId),
        ]).catch(err => console.error('Failed to increment listen counts:', err));
      }
    }
    return updatedSession;
  }

  async completeSession(userId: string, sessionId: string) {
    if (this.isMemoryProvider) return { id: sessionId, status: ListeningSessionStatus.COMPLETED };
    const session = await this.prisma.listeningSession.findUnique({ where: { id: sessionId } });
    if (!session || session.profileId !== userId) throw new NotFoundException('Session not found');
    return this.prisma.listeningSession.update({
      where: { id: sessionId },
      data: {
        status: ListeningSessionStatus.COMPLETED,
        endedAt: new Date(),
        completedAt: new Date(),
      }
    });
  }

  async getUserHistory(userId: string) {
    if (this.isMemoryProvider) return [];
    return this.prisma.listeningSession.findMany({
      where: { profileId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async getUserMetrics(userId: string) {
    if (this.isMemoryProvider) return { totalListeningSeconds: 0, totalPlays: 0, completedCount: 0 };
    const stats = await this.prisma.listeningSession.aggregate({
      where: { profileId: userId },
      _sum: { validListeningSeconds: true },
    });
    const totalPlays = await this.prisma.listeningSession.count({
      where: { profileId: userId, playQualifiedAt: { not: null } }
    });
    const completedCount = await this.prisma.listeningSession.count({
      where: { profileId: userId, status: ListeningSessionStatus.COMPLETED }
    });
    return { totalListeningSeconds: stats._sum.validListeningSeconds || 0, totalPlays, completedCount };
  }

  // --- Progress logic using InMemory or MongoDB ---
  async getListeningProgress(userId: string) {
    if (!isValidProgressId(userId)) return [];
    if (this.isMemoryProvider) return this.memoryRepo.find(userId);
    return this.prisma.listeningProgress.findMany({ where: { profileId: userId } });
  }

  async getListeningProgressByChapter(userId: string, chapterId: string) {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return null;
    if (this.isMemoryProvider) return this.memoryRepo.findOne(userId, chapterId);
    return this.prisma.listeningProgress.findFirst({ where: { profileId: userId, chapterId } });
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

    const existing = await this.prisma.listeningProgress.findFirst({ where: { profileId: userId, chapterId } });
    
    let nextVersion = 1;
    if (existing) {
       if (dto.version && dto.version < existing.version) {
          return existing;
       }
       nextVersion = (existing.version || 1) + 1;
    }

    return this.prisma.listeningProgress.upsert({
      where: { id: existing?.id || 'new_dummy_id_triggering_create' },
      update: { storyId: dto.storyId, positionSeconds: dto.positionSeconds, durationSeconds: dto.durationSeconds, progressPercent, completed: isCompleted, playbackMode: dto.playbackMode as any, playbackRate: dto.playbackRate, lastPlayedAt: new Date(), version: nextVersion },
      create: { profileId: userId, chapterId, storyId: dto.storyId, positionSeconds: dto.positionSeconds, durationSeconds: dto.durationSeconds, progressPercent, completed: isCompleted, playbackMode: dto.playbackMode as any, playbackRate: dto.playbackRate, lastPlayedAt: new Date(), version: nextVersion },
    });
  }

  async clearListeningProgress(userId: string) {
    if (!isValidProgressId(userId)) return { deletedCount: 0 };
    if (this.isMemoryProvider) {
      await this.memoryRepo.deleteMany(userId);
      return { deletedCount: 1 };
    }
    const res = await this.prisma.listeningProgress.deleteMany({ where: { profileId: userId } });
    return { deletedCount: res.count };
  }

  async deleteListeningProgress(userId: string, chapterId: string) {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return { deletedCount: 0 };
    if (this.isMemoryProvider) {
      await this.memoryRepo.deleteOne(userId, chapterId);
      return { deletedCount: 1 };
    }
    const res = await this.prisma.listeningProgress.deleteMany({ where: { profileId: userId, chapterId } });
    return { deletedCount: res.count };
  }
}
