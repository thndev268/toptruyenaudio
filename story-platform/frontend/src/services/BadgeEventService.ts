import {
  BadgeEventType,
  UserBadgeAssignment,
  BadgeEventInput,
} from '../types/badges';
import { BadgeRepository } from './repositories/BadgeRepository';
import { LocalBadgeRepository } from './repositories/LocalBadgeRepository';

export type BadgeAwardListener = (assignment: UserBadgeAssignment) => void;

export class BadgeEventService {
  private repository: BadgeRepository;
  private listeners: Set<BadgeAwardListener> = new Set();

  constructor(repository?: BadgeRepository) {
    this.repository = repository || new LocalBadgeRepository();
  }

  /**
   * Subscribe to new badge awards triggered by events
   */
  public onBadgeAwarded(listener: BadgeAwardListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(assignments: UserBadgeAssignment[]): void {
    if (assignments.length === 0) return;
    assignments.forEach((assignment) => {
      this.listeners.forEach((listener) => {
        try {
          listener(assignment);
        } catch (e) {
          console.error('[BadgeEventService] Error in award listener:', e);
        }
      });
    });
  }

  /**
   * Process and record an automated badge-triggering event
   */
  public async processEvent(input: BadgeEventInput): Promise<UserBadgeAssignment[]> {
    try {
      const incrementValue = input.incrementValue ?? 1;
      const newlyAwarded = await this.repository.recordEvent(
        input.eventType,
        incrementValue
      );

      if (newlyAwarded.length > 0) {
        this.notifyListeners(newlyAwarded);
      }

      return newlyAwarded;
    } catch (error) {
      console.error('[BadgeEventService] Failed to process badge event:', input, error);
      return [];
    }
  }

  /**
   * Convenience trigger when chapters are completed
   */
  public async recordChaptersCompleted(
    incrementValue: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'CHAPTERS_COMPLETED',
      incrementValue,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convenience trigger when listening time is recorded (in minutes)
   */
  public async recordListeningMinutes(
    minutes: number,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'LISTENING_MINUTES_REACHED',
      incrementValue: minutes,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convenience trigger when a full story is completed
   */
  public async recordStoriesCompleted(
    incrementValue: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'STORIES_COMPLETED',
      incrementValue,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convenience trigger when comments are posted
   */
  public async recordCommentsPosted(
    incrementValue: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'COMMENTS_POSTED',
      incrementValue,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convenience trigger when reviews are posted
   */
  public async recordReviewsPosted(
    incrementValue: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'VALID_REVIEWS_POSTED',
      incrementValue,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convenience trigger when stories are added to favorites
   */
  public async recordFavoritesAdded(
    incrementValue: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'FAVORITES_ADDED',
      incrementValue,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convenience trigger when playlists are created
   */
  public async recordPlaylistsCreated(
    incrementValue: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'PLAYLISTS_CREATED',
      incrementValue,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convenience trigger for consecutive listening days streak
   */
  public async recordConsecutiveListeningDays(
    days: number = 1,
    metadata?: Record<string, any>
  ): Promise<UserBadgeAssignment[]> {
    const userId = localStorage.getItem('toptruyen_current_user_id') || 'user-1';
    return this.processEvent({
      userId,
      eventType: 'CONSECUTIVE_LISTENING_DAYS',
      incrementValue: days,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}

export const badgeEventService = new BadgeEventService();
