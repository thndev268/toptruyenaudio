import { apiRequest } from '../apiClient';

export interface Banner {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
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
    console.log('[BANNER API] fetching banners');
    try {
      const response = await apiRequest<Banner[]>('banners');
      console.log('[BANNER API] response:', response);
      
      // Backend returns array directly, not wrapped in { success, data }
      if (Array.isArray(response)) {
        this.banners = response;
        this.notifyListeners();
        console.log('[BANNER API] banners count:', this.banners.length);
        return this.banners;
      }
      
      console.log('[BANNER API] response is not array, returning empty');
      return [];
    } catch (error) {
      console.error('[BANNER API ERROR]', error);
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
