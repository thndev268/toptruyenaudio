import { apiRequest } from '../apiClient';

export interface SocialLink {
  id: string;
  platform: string;
  name: string;
  url: string;
  iconUrl?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLinksRepository {
  getActiveLinks(): Promise<SocialLink[]>;
}

class ApiSocialLinksRepository implements SocialLinksRepository {
  async getActiveLinks(): Promise<SocialLink[]> {
    try {
      const res = await apiRequest<{ data: SocialLink[] }>('/social-links');
      if (res && res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch social links:', err);
      return [];
    }
  }
}

class LocalSocialLinksRepository implements SocialLinksRepository {
  private links: SocialLink[] = [];

  async getActiveLinks(): Promise<SocialLink[]> {
    return this.links.filter(link => link.isActive).sort((a, b) => a.order - b.order);
  }

  setLinks(links: SocialLink[]) {
    this.links = links;
  }
}

const DATA_SOURCE_MODE = import.meta.env.VITE_DATA_SOURCE_MODE || 'API';
const localRepository = new LocalSocialLinksRepository();

export const socialLinksRepository: SocialLinksRepository =
  DATA_SOURCE_MODE === 'API' ? new ApiSocialLinksRepository() : localRepository;

export { localRepository };
