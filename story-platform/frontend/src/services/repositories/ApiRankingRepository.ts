import { UserActivityRanking, CreatorRanking, ActivityBadge } from '../../types';
import { RankingRepository, localRankingRepository } from './RankingRepository';
import { apiRequest } from '../apiClient';

export class ApiRankingRepository implements RankingRepository {
  async getUserRankings(period: 'today' | 'week' | 'month' | 'all' = 'week'): Promise<UserActivityRanking[]> {
    try {
      const res = await apiRequest<any>(`/listening/rankings/users?period=${period}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.rankings)) return res.rankings;
      if (res && Array.isArray(res.users)) return res.users;
      if (res && Array.isArray(res.data)) return res.data;
      return await localRankingRepository.getUserRankings(period);
    } catch (err) {
      console.warn('API Ranking failed, falling back to local rankings:', err);
      return localRankingRepository.getUserRankings(period);
    }
  }

  async getCreatorRankings(): Promise<CreatorRanking[]> {
    try {
      const res = await apiRequest<any>('/listening/rankings/creators');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.creators)) return res.creators;
      if (res && Array.isArray(res.rankings)) return res.rankings;
      if (res && Array.isArray(res.data)) return res.data;
      return await localRankingRepository.getCreatorRankings();
    } catch (err) {
      return localRankingRepository.getCreatorRankings();
    }
  }

  async getActivityBadges(): Promise<ActivityBadge[]> {
    try {
      const res = await apiRequest<any>('/listening/rankings/badges');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.badges)) return res.badges;
      if (res && Array.isArray(res.data)) return res.data;
      return await localRankingRepository.getActivityBadges();
    } catch (err) {
      return localRankingRepository.getActivityBadges();
    }
  }

  async getCurrentUserActivity(userId: string): Promise<UserActivityRanking | null> {
    try {
      const res = await apiRequest<any>('/listening/me/metrics');
      if (res && res.userId) return res;
      if (res && res.data && res.data.userId) return res.data;
      return await localRankingRepository.getCurrentUserActivity(userId);
    } catch (err) {
      return localRankingRepository.getCurrentUserActivity(userId);
    }
  }

  async recordActivityPoints(
    userId: string,
    points: number,
    type: 'LISTEN' | 'REVIEW' | 'COMPLETE'
  ): Promise<UserActivityRanking> {
    return localRankingRepository.recordActivityPoints(userId, points, type);
  }
}

