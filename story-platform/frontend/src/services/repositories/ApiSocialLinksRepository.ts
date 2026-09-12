import { apiRequest } from '../apiClient';
import { SocialLink } from './SocialLinksRepository';

export class ApiSocialLinksRepository {
  async getAll(): Promise<SocialLink[]> {
    try {
      const res = await apiRequest<{ items: SocialLink[] }>('/admin/social-links');
      if (res && Array.isArray(res.items)) {
        return res.items;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch social links:', err);
      return [];
    }
  }

  async create(link: Omit<SocialLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialLink> {
    return apiRequest<SocialLink>('/admin/social-links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async update(id: string, link: Partial<SocialLink>): Promise<SocialLink> {
    return apiRequest<SocialLink>(`/admin/social-links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(link),
    });
  }

  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/admin/social-links/${id}`, {
      method: 'DELETE',
    });
  }

  async toggle(id: string): Promise<SocialLink> {
    return apiRequest<SocialLink>(`/admin/social-links/${id}/toggle`, {
      method: 'PUT',
    });
  }
}

export const apiSocialLinksRepository = new ApiSocialLinksRepository();
