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
    // Initialize default map from mock
    const initialMap: Record<string, UserActivityRanking> = {};
    [].forEach((item) => {
      initialMap[item.userId] = item;
    });
    return initialMap;
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
    return [];
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
