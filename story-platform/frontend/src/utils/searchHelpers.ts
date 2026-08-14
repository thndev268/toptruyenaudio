import { adminRepository } from '../services/repositories/AdminRepository';

export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

export function matchesSearchKeyword(target: string | string[], keyword: string): boolean {
  if (!keyword || !keyword.trim()) return true;
  const normKeyword = normalizeVietnamese(keyword);

  if (Array.isArray(target)) {
    return target.some((item) => normalizeVietnamese(item).includes(normKeyword));
  }

  if (!target) return false;
  return normalizeVietnamese(target).includes(normKeyword);
}

export interface FilterState {
  q: string;
  genre: string;
  status: string; // 'all' | 'ONGOING' | 'COMPLETED'
  access: string; // 'all' | 'FREE' | 'PREMIUM'
  duration: string; // 'all' | 'under5' | '5to20' | '20to50' | 'over50'
  creator: string;
  sort: string; // 'listens' | 'trending' | 'rating' | 'newest' | 'az'
}

export const DEFAULT_FILTERS: FilterState = {
  q: '',
  genre: 'all',
  status: 'all',
  access: 'all',
  duration: 'all',
  creator: '',
  sort: 'listens',
};

export function countActiveAdvancedFilters(filters: FilterState): number {
  let count = 0;
  if (filters.genre && filters.genre !== 'all') count++;
  if (filters.status && filters.status !== 'all') count++;
  if (filters.access && filters.access !== 'all') count++;
  if (filters.duration && filters.duration !== 'all') count++;
  if (filters.creator && filters.creator.trim() !== '') count++;
  if (filters.sort && filters.sort !== 'listens') count++;
  return count;
}

export function filterStoryList<T extends {
  title: string;
  authorName: string;
  narratorName: string;
  summary: string;
  genres: string[];
  storyStatus?: string;
  chapters: Array<{ durationSeconds: number; accessLevel: string }>;
  stats: { listenCount: number; viewCount: number };
  rating: number;
  publishedAt: string;
}>(stories: T[], filters: FilterState): T[] {
  return stories.filter((story) => {
    // 1. Search Query
    if (filters.q && filters.q.trim()) {
      const matchesTitle = matchesSearchKeyword(story.title, filters.q);
      const matchesAuthor = matchesSearchKeyword(story.authorName, filters.q);
      const matchesNarrator = matchesSearchKeyword(story.narratorName, filters.q);
      const matchesSummary = matchesSearchKeyword(story.summary, filters.q);
      const matchesGenres = matchesSearchKeyword(story.genres, filters.q);

      if (!matchesTitle && !matchesAuthor && !matchesNarrator && !matchesSummary && !matchesGenres) {
        return false;
      }
    }

    // 2. Genre
    if (filters.genre && filters.genre !== 'all') {
      const targetGenreObj = adminRepository.getGenres().find(
        (mg) =>
          normalizeVietnamese(mg.name) === normalizeVietnamese(filters.genre) ||
          mg.slug === filters.genre ||
          mg.id === filters.genre
      );
      const targetGenreName = targetGenreObj ? targetGenreObj.name : filters.genre;

      const hasGenre = story.genres.some(
        (g) =>
          normalizeVietnamese(g) === normalizeVietnamese(targetGenreName) ||
          normalizeVietnamese(g) === normalizeVietnamese(filters.genre)
      );
      if (!hasGenre) return false;
    }

    // 3. Status
    if (filters.status && filters.status !== 'all') {
      if (story.storyStatus && story.storyStatus !== filters.status) {
        return false;
      }
    }

    // 4. Access Level
    if (filters.access && filters.access !== 'all') {
      if (filters.access === 'FREE') {
        const isAllFree = story.chapters.every((c) => c.accessLevel === 'FREE');
        if (!isAllFree) return false;
      } else if (filters.access === 'PREMIUM') {
        const hasPremium = story.chapters.some((c) => c.accessLevel === 'PREMIUM');
        if (!hasPremium) return false;
      }
    }

    // 5. Duration
    if (filters.duration && filters.duration !== 'all') {
      const totalSeconds = story.chapters.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
      const totalHours = totalSeconds / 3600;

      if (filters.duration === 'under5' && totalHours >= 5) return false;
      if (filters.duration === '5to20' && (totalHours < 5 || totalHours > 20)) return false;
      if (filters.duration === '20to50' && (totalHours < 20 || totalHours > 50)) return false;
      if (filters.duration === 'over50' && totalHours <= 50) return false;
    }

    // 6. Creator / Author / Narrator text filter
    if (filters.creator && filters.creator.trim()) {
      const matchesAuthor = matchesSearchKeyword(story.authorName, filters.creator);
      const matchesNarrator = matchesSearchKeyword(story.narratorName, filters.creator);
      if (!matchesAuthor && !matchesNarrator) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sort) {
      case 'trending':
        return (b.stats?.viewCount || 0) * b.rating - (a.stats?.viewCount || 0) * a.rating;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      case 'az':
        return a.title.localeCompare(b.title, 'vi');
      case 'listens':
      default:
        return (b.stats?.listenCount || 0) - (a.stats?.listenCount || 0);
    }
  });
}
