import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiRequest } from './apiClient';
import { storage } from './storage';

describe('apiClient & localStorage preservation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('preserves user preferences and listening history in localStorage', () => {
    // 1. Set user preferences and history
    storage.savePreferences({ volume: 0.5, isMuted: true });
    storage.saveListeningHistory([{ id: 'story_1', title: 'Truyện Hán Sở' }], 'test_user');

    // 2. Verify preferences and history are saved
    const savedPrefs = storage.getPreferences();
    expect(savedPrefs.volume).toBe(0.5);
    expect(savedPrefs.isMuted).toBe(true);

    const savedHistory = storage.getListeningHistory('test_user');
    expect(savedHistory).toHaveLength(1);
    expect(savedHistory[0].title).toBe('Truyện Hán Sở');
  });
});
