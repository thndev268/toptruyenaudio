import { UserActivityRanking, CreatorRanking, ActivityBadge } from '../../types';
import { STORAGE_KEYS } from '../storage';

const USER_ACTIVITY_KEY = STORAGE_KEYS.USER_ACTIVITY;
const RANKING_PREF_KEY = STORAGE_KEYS.RANKING_PREFS;

export interface RankingRepository {
  getUserRankings(period?: 'today' | 'week' | 'month' | 'all'): Promise<UserActivityRanking[]>;
  getCreatorRankings(): Promise<CreatorRanking[]>;
  getActivityBadges(): Promise<ActivityBadge[]>;
  getCurrentUserActivity(userId: string): Promise<UserActivityRanking | null>;
  recordActivityPoints(userId: string, points: number, type: 'LISTEN' | 'REVIEW' | 'COMPLETE'): Promise<UserActivityRanking>;
}

class LocalRankingRepository implements RankingRepository {
  private getStoredActivity(): Record<string, UserActivityRanking> {
    try {
      const data = localStorage.getItem(USER_ACTIVITY_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('[RankingRepository] Error reading user activity from localStorage', e);
    }
    // Initialize empty map
    return {};
  }

  private saveStoredActivity(map: Record<string, UserActivityRanking>): void {
    try {
      localStorage.setItem(USER_ACTIVITY_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('[RankingRepository] Error saving user activity to localStorage', e);
    }
  }

  async getUserRankings(period: 'today' | 'week' | 'month' | 'all' = 'week'): Promise<UserActivityRanking[]> {
    const activityMap = this.getStoredActivity();
    const list = Object.values(activityMap);

    // Sort by points descending
    list.sort((a, b) => b.activityPoints - a.activityPoints);

    // Update rank positions
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }

  async getCreatorRankings(): Promise<CreatorRanking[]> {
    // Sample author data as requested
    const creators = [
      {
        creatorId: 'cau-bau-audio',
        name: 'Cầu Bầu Audio',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'AUTHOR' as const,
        storyCount: 15,
        totalListens: 125000,
        growthPercent: 23,
        rating: 4.8,
      },
      {
        creatorId: 'qua-trung-audio',
        name: 'Quả Trứng Audio',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'AUTHOR' as const,
        storyCount: 12,
        totalListens: 98000,
        growthPercent: 18,
        rating: 4.7,
      },
      {
        creatorId: 'review-audio',
        name: 'Review Audio',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        role: 'AUTHOR' as const,
        storyCount: 8,
        totalListens: 75000,
        growthPercent: 15,
        rating: 4.6,
      },
      {
        creatorId: 'audio-studio',
        name: 'Audio Studio',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        role: 'AUTHOR' as const,
        storyCount: 10,
        totalListens: 62000,
        growthPercent: 12,
        rating: 4.5,
      },
      {
        creatorId: 'audio-master',
        name: 'Audio Master',
        avatarUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&auto=format&fit=crop&q=80',
        role: 'AUTHOR' as const,
        storyCount: 6,
        totalListens: 45000,
        growthPercent: 8,
        rating: 4.4,
      },
    ];

    // Add rank property
    return creators.map((creator, index) => ({
      ...creator,
      rank: index + 1,
    }));
  }

  async getActivityBadges(): Promise<ActivityBadge[]> {
    return [];
  }

  async getCurrentUserActivity(userId: string): Promise<UserActivityRanking | null> {
    const activityMap = this.getStoredActivity();
    if (activityMap[userId]) {
      return activityMap[userId];
    }

    // Default entry for logged-in user if not existing
    const newUserActivity: UserActivityRanking = {
      userId,
      displayName: 'Bạn (Thành Viên Audio)',
      avatarUrl: undefined,
      level: 1,
      activityPoints: 120,
      validListeningMinutes: 35,
      completedStories: 1,
      helpfulReviews: 2,
      activeDays: 3,
      rank: 6,
      achievements: ['Người Nghe Mới'],
    };

    activityMap[userId] = newUserActivity;
    this.saveStoredActivity(activityMap);
    return newUserActivity;
  }

  async recordActivityPoints(
    userId: string,
    pointsToAdd: number,
    type: 'LISTEN' | 'REVIEW' | 'COMPLETE'
  ): Promise<UserActivityRanking> {
    const activityMap = this.getStoredActivity();
    let current = activityMap[userId];

    if (!current) {
      current = {
        userId,
        displayName: 'Bạn (Thành Viên Audio)',
        level: 1,
        activityPoints: 0,
        validListeningMinutes: 0,
        completedStories: 0,
        helpfulReviews: 0,
        activeDays: 1,
        rank: 99,
      };
    }

    // Cap maximum daily points addition to prevent spam
    const cappedPoints = Math.min(pointsToAdd, 300);
    current.activityPoints += cappedPoints;

    if (type === 'LISTEN') {
      current.validListeningMinutes += Math.round(cappedPoints / 5);
    } else if (type === 'COMPLETE') {
      current.completedStories += 1;
    } else if (type === 'REVIEW') {
      current.helpfulReviews += 1;
    }

    current.level = Math.floor(current.activityPoints / 500) + 1;
    activityMap[userId] = current;
    this.saveStoredActivity(activityMap);

    return current;
  }
}

export const localRankingRepository = new LocalRankingRepository();

import { ApiRankingRepository } from './ApiRankingRepository';
import { getDataSourceMode } from '../apiClient';

export const rankingRepository = getDataSourceMode() === 'API' 
  ? new ApiRankingRepository() 
  : localRankingRepository;
