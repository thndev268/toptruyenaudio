import { apiRequest } from '../apiClient';
import { ListeningProgress } from '../../types';
export { createProgressKey, isValidProgressId } from '../storage';

export async function fetchProgress(): Promise<ListeningProgress[]> {
  try {
    return await apiRequest('/listening/me/progress');
  } catch (e) {
    console.error('Failed to fetch progress from API', e);
    return [];
  }
}

export async function saveProgress(chapterId: string, progress: any): Promise<ListeningProgress | null> {
  try {
    return await apiRequest(`/listening/me/progress/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(progress)
    });
  } catch (e) {
    console.error('Failed to save progress to API', e);
    return null;
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await apiRequest('/listening/me/progress', {
      method: 'DELETE'
    });
  } catch (e) {
    console.error('Failed to clear progress', e);
  }
}

export async function deleteProgress(chapterId: string): Promise<void> {
  try {
    await apiRequest(`/listening/me/progress/${chapterId}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error('Failed to delete progress', e);
  }
}
