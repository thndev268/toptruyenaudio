/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { storage, STORAGE_KEYS } from '../services/storage';

describe('StorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should run migrations from StoryFlow to TOP TRUYỆN AUDIO', () => {
    // Setup legacy data
    const legacyKey = 'storyflow:favorites:v1';
    const legacyData = JSON.stringify(['story-legacy-1']);
    localStorage.setItem(legacyKey, legacyData);

    // Run migration
    storage.runMigrations();

    // Check new data
    const newData = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    expect(newData).toBe(legacyData);

    // Check legacy data removed
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it('should not migrate if already migrated', () => {
    localStorage.setItem('toptruyenaudio:migrated:v2', 'true');
    localStorage.setItem('storyflow:favorites:v1', JSON.stringify(['old']));
    
    storage.runMigrations();
    
    expect(localStorage.getItem(STORAGE_KEYS.FAVORITES)).toBeNull();
  });

  it('should handle preferences correctly', () => {
    const prefs = { volume: 0.5, isMuted: true };
    storage.savePreferences(prefs);
    
    const saved = storage.getPreferences();
    expect(saved.volume).toBe(0.5);
    expect(saved.isMuted).toBe(true);
  });
});
