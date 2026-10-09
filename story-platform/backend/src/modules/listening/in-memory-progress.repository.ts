import { Injectable } from '@nestjs/common';
import { UpsertListeningProgressDto } from './dto/listening.dto';
import { ListeningProgress } from './schemas/listening-progress.schema';

export function createProgressKey(userId: string, chapterId: string): string {
  return `${userId}:${chapterId}`;
}

export function isValidProgressId(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'guest' && trimmed !== 'null' && trimmed !== 'undefined';
}

@Injectable()
export class InMemoryListeningProgressRepository {
  private progresses: Map<string, ListeningProgress> = new Map();

  private getKey(userId: string, chapterId: string): string {
    return createProgressKey(userId, chapterId);
  }

  async find(userId: string): Promise<ListeningProgress[]> {
    if (!isValidProgressId(userId)) return [];
    const result: ListeningProgress[] = [];
    const prefix = `${userId}:`;
    for (const [key, val] of this.progresses.entries()) {
      if (key.startsWith(prefix)) {
        result.push(val);
      }
    }
    return result;
  }

  async findOne(userId: string, chapterId: string): Promise<ListeningProgress | null> {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return null;
    return this.progresses.get(this.getKey(userId, chapterId)) || null;
  }

  async upsert(userId: string, chapterId: string, dto: UpsertListeningProgressDto): Promise<ListeningProgress | null> {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) {
      return null;
    }
    const key = this.getKey(userId, chapterId);
    let progressPercent = 0;
    if (dto.durationSeconds > 0) {
      progressPercent = (dto.positionSeconds / dto.durationSeconds) * 100;
    }
    if (progressPercent > 100) progressPercent = 100;
    if (progressPercent < 0) progressPercent = 0;

    const remainingSeconds = dto.durationSeconds - dto.positionSeconds;
    const isCompleted = dto.completed || (dto.durationSeconds > 0 && (remainingSeconds <= 15 || progressPercent >= 95));

    const existing = this.progresses.get(key);
    let nextVersion = 1;
    if (existing) {
      // Version check logic
      if (dto.version && dto.version < (existing as any).version) {
        return existing;
      }
      nextVersion = ((existing as any).version || 1) + 1;
    }

    const doc: any = {
      userId,
      storyId: dto.storyId,
      chapterId,
      positionSeconds: dto.positionSeconds,
      durationSeconds: dto.durationSeconds,
      progressPercent,
      completed: isCompleted,
      playbackMode: dto.playbackMode,
      playbackRate: dto.playbackRate,
      lastPlayedAt: new Date(),
      version: nextVersion
    };

    this.progresses.set(key, doc);
    return doc;
  }

  async deleteMany(userId: string): Promise<void> {
    if (!isValidProgressId(userId)) return;
    const keysToDelete: string[] = [];
    const prefix = `${userId}:`;
    for (const key of this.progresses.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(k => this.progresses.delete(k));
  }

  async deleteOne(userId: string, chapterId: string): Promise<void> {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return;
    this.progresses.delete(this.getKey(userId, chapterId));
  }
}

