import { apiRequest } from '../apiClient';

export interface Banner {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'PROMOTION';
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export class BannersRepository {
  private static instance: BannersRepository;
  private banners: Banner[] = [];
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): BannersRepository {
    if (!BannersRepository.instance) {
      BannersRepository.instance = new BannersRepository();
    }
    return BannersRepository.instance;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  async fetchBanners(userId?: string): Promise<Banner[]> {
    try {
      const response = await apiRequest<{ success: boolean; data: Banner[] }>(`/banners${userId ? '' : ''}`);
      if (response?.success && Array.isArray(response.data)) {
        this.banners = response.data;
        this.notifyListeners();
        return this.banners;
      }
      return [];
    } catch (error) {
      console.error('[BannersRepository] Failed to fetch banners:', error);
      return [];
    }
  }

  async dismissBanner(bannerId: string): Promise<void> {
    try {
      await apiRequest(`/banners/dismiss/${bannerId}`, { method: 'POST' });
      this.banners = this.banners.filter(b => b.id !== bannerId);
      this.notifyListeners();
    } catch (error) {
      console.error('[BannersRepository] Failed to dismiss banner:', error);
      throw error;
    }
  }

  getBanners(): Banner[] {
    return this.banners;
  }
}

export const bannersRepository = BannersRepository.getInstance();
