// LocalStorage Persistence Adapter for TOP TRUYỆN AUDIO Frontend

import { AudioQuality } from '../types';

export function createProgressKey(userId: string, chapterId: string): string {
  return `${userId}:${chapterId}`;
}

export function isValidProgressId(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'guest' && trimmed !== 'null' && trimmed !== 'undefined';
}

// Versioned Keys Schema
export const STORAGE_KEYS = {
  PREFERENCES: 'toptruyenaudio:preferences:v1',
  LISTENING_PROGRESS: 'toptruyenaudio:listening-progress:v1',
  LISTENING_HISTORY: 'toptruyenaudio:listening-history:v1',
  FAVORITES: 'toptruyenaudio:favorites:v1',
  MOCK_AUTH: 'toptruyenaudio:mock-auth:v1',
  SUBSCRIPTION: 'toptruyenaudio:subscription:v1',
  SUBSCRIPTION_ORDERS: 'toptruyenaudio:subscription-orders:v1',
  PLAYLISTS: 'toptruyenaudio:playlists:v1',
  PLAYLIST_ITEMS: 'toptruyenaudio:playlist-items:v1',
  REVIEWS: 'toptruyenaudio:reviews:v1',
  REVIEW_VOTES: 'toptruyenaudio:review-votes:v1',
  COMMENTS: 'toptruyenaudio:comments:v1',
  VALID_LISTENING: 'toptruyenaudio:valid-listening:v1',
  USER_ACTIVITY: 'toptruyenaudio:user-activity:v1',
  RANKING_PREFS: 'toptruyenaudio:ranking-preferences:v1',
  CURRENT_AUDIO: 'toptruyenaudio:current-audio:v1',
};

// Legacy keys mapping for migration
const LEGACY_STORYFLOW_KEYS = {
  PREFERENCES: 'storyflow:preferences:v1',
  LISTENING_PROGRESS: 'storyflow:listening-progress:v1',
  LISTENING_HISTORY: 'storyflow:listening-history:v1',
  FAVORITES: 'storyflow:favorites:v1',
  MOCK_AUTH: 'storyflow:mock-auth:v1',
  MOCK_WALLET: 'storyflow:mock-wallet:v1',
  PLAYLISTS: 'storyflow:playlists:v1',
  PLAYLIST_ITEMS: 'storyflow:playlist-items:v1',
  REVIEWS: 'storyflow:reviews:v1',
  COMMENTS: 'storyflow:comments:v1',
  USER_ACTIVITY: 'storyflow:user-activity:v1',
  RANKING_PREFS: 'storyflow:ranking-preferences:v1',
};

export interface UserPreferencesStorage {
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  autoPlayNext: boolean;
  sleepTimer: number;
  isDataSaverMode?: boolean;
  audioQuality?: AudioQuality;
  lastStoryId?: string;
  lastChapterId?: string;
  lastTime?: number;
}

export interface CurrentAudioStorage {
  storyId: string;
  chapterId: string;
  storySlug: string;
  chapterNumber: number;
  timestamp: number;
}

export interface MockAuthStorage {
  role: 'GUEST' | 'USER' | 'CREATOR' | 'PARTNER' | 'ADMIN';
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

class StorageAdapter {
  getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to parse key "${key}", returning default.`, e);
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageAdapter] Failed to write key "${key}".`, e);
    }
  }

  // Preferences
  getPreferences(): UserPreferencesStorage {
    const prefs = this.getItem<UserPreferencesStorage>(STORAGE_KEYS.PREFERENCES, {
      volume: 0.8,
      isMuted: false,
      playbackRate: 1.0,
      autoPlayNext: true,
      sleepTimer: 0,
    });
    // Sanitize preferences so volume <= 0 is never paired with isMuted = false
    if (prefs.volume !== undefined && prefs.volume <= 0 && !prefs.isMuted) {
      prefs.isMuted = true;
    }
    if (prefs.volume === undefined || Number.isNaN(prefs.volume)) {
      prefs.volume = 0.8;
    }
    return prefs;
  }

  savePreferences(prefs: Partial<UserPreferencesStorage>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    if (updated.volume !== undefined && updated.volume <= 0 && !updated.isMuted) {
      updated.isMuted = true;
    }
    this.setItem(STORAGE_KEYS.PREFERENCES, updated);
  }

  // Favorites
  getFavorites(userId?: string): string[] {
    const key = isValidProgressId(userId) ? `${STORAGE_KEYS.FAVORITES}:${userId}` : STORAGE_KEYS.FAVORITES;
    return this.getItem<string[]>(key, []);
  }

  saveFavorites(favorites: string[], userId?: string): void {
    const key = isValidProgressId(userId) ? `${STORAGE_KEYS.FAVORITES}:${userId}` : STORAGE_KEYS.FAVORITES;
    this.setItem(key, favorites);
  }

  // Auth Mock
  getAuth(): MockAuthStorage {
    return this.getItem<MockAuthStorage>(STORAGE_KEYS.MOCK_AUTH, {
      role: 'GUEST',
      user: null,
    });
  }

  saveAuth(auth: MockAuthStorage): void {
    this.setItem(STORAGE_KEYS.MOCK_AUTH, auth);
  }

  // Listening Progress & History
  getProgressMap(userId?: string): Record<string, any> {
    if (!isValidProgressId(userId)) return {};
    const key = `${STORAGE_KEYS.LISTENING_PROGRESS}:${userId}`;
    const rawMap = this.getItem<Record<string, any>>(key, {});
    
    // Ensure all keys in map match createProgressKey(userId, chapterId)
    const sanitizedMap: Record<string, any> = {};
    for (const [k, val] of Object.entries(rawMap)) {
      if (!val) continue;
      const chId = val.chapterId || (k.includes(':') ? k.split(':')[1] : k);
      if (isValidProgressId(chId)) {
        const pk = createProgressKey(userId!, chId);
        sanitizedMap[pk] = { ...val, userId: userId!, chapterId: chId };
      }
    }
    return sanitizedMap;
  }

  saveProgressMap(map: Record<string, any>, userId?: string): void {
    if (!isValidProgressId(userId)) return;
    const sanitizedMap: Record<string, any> = {};
    for (const [k, val] of Object.entries(map || {})) {
      if (!val) continue;
      const chId = val.chapterId || (k.includes(':') ? k.split(':')[1] : k);
      if (isValidProgressId(chId)) {
        const pk = createProgressKey(userId!, chId);
        sanitizedMap[pk] = { ...val, userId: userId!, chapterId: chId };
      }
    }
    const key = `${STORAGE_KEYS.LISTENING_PROGRESS}:${userId}`;
    this.setItem(key, sanitizedMap);
  }

  getProgressItem(userId: string, chapterId: string): any | null {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return null;
    const pk = createProgressKey(userId, chapterId);
    const map = this.getProgressMap(userId);
    return map[pk] || null;
  }

  saveProgressItem(userId: string, chapterId: string, progress: any): void {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return;
    const pk = createProgressKey(userId, chapterId);
    const map = this.getProgressMap(userId);
    map[pk] = { ...progress, userId, chapterId };
    this.saveProgressMap(map, userId);
  }

  deleteProgressItem(userId: string, chapterId: string): void {
    if (!isValidProgressId(userId) || !isValidProgressId(chapterId)) return;
    const pk = createProgressKey(userId, chapterId);
    const map = this.getProgressMap(userId);
    delete map[pk];
    delete map[chapterId];
    this.saveProgressMap(map, userId);
  }

  getListeningHistory(userId?: string): any[] {
    if (!isValidProgressId(userId)) return [];
    const key = `${STORAGE_KEYS.LISTENING_HISTORY}:${userId}`;
    return this.getItem<any[]>(key, []);
  }

  saveListeningHistory(history: any[], userId?: string): void {
    if (!isValidProgressId(userId)) return;
    const key = `${STORAGE_KEYS.LISTENING_HISTORY}:${userId}`;
    this.setItem(key, history);
  }

  // Current Audio State
  getCurrentAudio(): CurrentAudioStorage | null {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.CURRENT_AUDIO);
      if (!item) return null;
      return JSON.parse(item) as CurrentAudioStorage;
    } catch (e) {
      console.warn('[StorageAdapter] Failed to parse current audio', e);
      return null;
    }
  }

  saveCurrentAudio(audio: CurrentAudioStorage): void {
    this.setItem(STORAGE_KEYS.CURRENT_AUDIO, audio);
  }

  clearCurrentAudio(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_AUDIO);
  }

  // Reset
  clearHistoryAndProgress(userId?: string): void {
    try {
      if (isValidProgressId(userId)) {
        localStorage.removeItem(`${STORAGE_KEYS.LISTENING_PROGRESS}:${userId}`);
        localStorage.removeItem(`${STORAGE_KEYS.LISTENING_HISTORY}:${userId}`);
      } else {
        localStorage.removeItem(STORAGE_KEYS.LISTENING_PROGRESS);
        localStorage.removeItem(STORAGE_KEYS.LISTENING_HISTORY);
      }
    } catch (e) {
      console.error(e);
    }
  }

  resetAllMockData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error(e);
    }
  }

  // Migration for legacy progress data
  runProgressMigration(): void {
    try {
      const MIGRATION_KEY = 'toptruyenaudio:progress-migrated:v3';
      if (localStorage.getItem(MIGRATION_KEY)) return;

      const authData = this.getAuth();
      const currentUserId = authData?.user?.id && isValidProgressId(authData.user.id) ? authData.user.id : null;

      // Unpartitioned legacy keys
      const legacyProgressKeys = [
        STORAGE_KEYS.LISTENING_PROGRESS,
        LEGACY_STORYFLOW_KEYS.LISTENING_PROGRESS,
        'storyflow:listening-progress:v1',
        'toptruyenaudio:listening-progress',
      ];

      legacyProgressKeys.forEach((legKey) => {
        const raw = localStorage.getItem(legKey);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && currentUserId) {
            const userMap = this.getProgressMap(currentUserId);
            let updated = false;

            Object.entries(parsed).forEach(([k, val]: [string, any]) => {
              if (!val || typeof val !== 'object') return;
              const chId = val.chapterId || (k.includes(':') ? k.split(':')[1] : k);
              if (isValidProgressId(chId)) {
                const pk = createProgressKey(currentUserId, chId);
                userMap[pk] = { ...val, userId: currentUserId, chapterId: chId };
                updated = true;
              }
            });

            if (updated) {
              this.saveProgressMap(userMap, currentUserId);
            }
          }
        } catch (e) {
          console.warn('[Migration] Error parsing legacy progress key:', legKey, e);
        }
        localStorage.removeItem(legKey);
      });

      // Remove any GUEST or unpartitioned orphaned keys
      localStorage.removeItem(`${STORAGE_KEYS.LISTENING_PROGRESS}:guest`);
      localStorage.removeItem(`${STORAGE_KEYS.LISTENING_PROGRESS}:GUEST`);

      localStorage.setItem(MIGRATION_KEY, 'true');
      console.log('[Migration] Successfully migrated listening progress cache to createProgressKey schema.');
    } catch (err) {
      console.error('[Migration] Failed progress migration:', err);
    }
  }

  // Migration from StoryFlow to TOP TRUYỆN AUDIO
  runMigrations(): void {
    try {
      const migrated = localStorage.getItem('toptruyenaudio:migrated:v2');
      if (!migrated) {
        // Map of old keys to new keys
        const migrations = [
          { old: LEGACY_STORYFLOW_KEYS.PREFERENCES, new: STORAGE_KEYS.PREFERENCES },
          { old: LEGACY_STORYFLOW_KEYS.LISTENING_PROGRESS, new: STORAGE_KEYS.LISTENING_PROGRESS },
          { old: LEGACY_STORYFLOW_KEYS.LISTENING_HISTORY, new: STORAGE_KEYS.LISTENING_HISTORY },
          { old: LEGACY_STORYFLOW_KEYS.FAVORITES, new: STORAGE_KEYS.FAVORITES },
          { old: LEGACY_STORYFLOW_KEYS.MOCK_AUTH, new: STORAGE_KEYS.MOCK_AUTH },
          { old: LEGACY_STORYFLOW_KEYS.PLAYLISTS, new: STORAGE_KEYS.PLAYLISTS },
          { old: LEGACY_STORYFLOW_KEYS.PLAYLIST_ITEMS, new: STORAGE_KEYS.PLAYLIST_ITEMS },
          { old: LEGACY_STORYFLOW_KEYS.REVIEWS, new: STORAGE_KEYS.REVIEWS },
          { old: LEGACY_STORYFLOW_KEYS.COMMENTS, new: STORAGE_KEYS.COMMENTS },
          { old: LEGACY_STORYFLOW_KEYS.USER_ACTIVITY, new: STORAGE_KEYS.USER_ACTIVITY },
          { old: LEGACY_STORYFLOW_KEYS.RANKING_PREFS, new: STORAGE_KEYS.RANKING_PREFS },
        ];

        migrations.forEach((m) => {
          const oldData = localStorage.getItem(m.old);
          if (oldData && !localStorage.getItem(m.new)) {
            localStorage.setItem(m.new, oldData);
            localStorage.removeItem(m.old);
          }
        });

        // Final cleanup of wallet
        localStorage.removeItem(LEGACY_STORYFLOW_KEYS.MOCK_WALLET);
        
        localStorage.setItem('toptruyenaudio:migrated:v2', 'true');
        console.log('[Migration] Successfully migrated StoryFlow data to TOP TRUYỆN AUDIO schema.');
      }

      this.runProgressMigration();
    } catch (e) {
      console.error('[Migration] Error running migrations', e);
    }
  }
}

export const storage = new StorageAdapter();

// Run migrations on init if in browser
if (typeof window !== 'undefined') {
  storage.runMigrations();
}

