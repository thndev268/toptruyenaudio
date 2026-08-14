import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setAccessToken, getAccessToken, apiRequest } from './apiClient';
import { storage, STORAGE_KEYS } from './storage';

describe('apiClient & localStorage preservation', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    vi.restoreAllMocks();
  });

  it('preserves user preferences and listening history in localStorage when access token is cleared', () => {
    // 1. Set user preferences and history
    storage.savePreferences({ volume: 0.5, isMuted: true });
    storage.saveListeningHistory([{ id: 'story_1', title: 'Truyện Hán Sở' }], 'test_user');
    setAccessToken('valid_jwt_token');

    expect(getAccessToken()).toBe('valid_jwt_token');

    // 2. Clear token (logout / 401 unauthenticated)
    setAccessToken(null);

    // 3. Token removed, but preferences and history REMAIN intact
    expect(getAccessToken()).toBeNull();

    const savedPrefs = storage.getPreferences();
    expect(savedPrefs.volume).toBe(0.5);
    expect(savedPrefs.isMuted).toBe(true);

    const savedHistory = storage.getListeningHistory('test_user');
    expect(savedHistory).toHaveLength(1);
    expect(savedHistory[0].title).toBe('Truyện Hán Sở');
  });

  it('performs single-flight refresh on concurrent 401 requests', async () => {
    setAccessToken('expired_token');

    let refreshCallCount = 0;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/auth/refresh')) {
        refreshCallCount++;
        // Delay slightly to simulate async network flight
        await new Promise((r) => setTimeout(r, 20));
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            data: { tokens: { accessToken: 'new_refreshed_access_token' } },
          }),
        };
      }

      // Main API endpoints returning 401 on first attempt if expired_token
      if (url.includes('/stories') || url.includes('/profile')) {
        const headers = init?.headers as Record<string, string> | undefined;
        const authHeader = headers?.Authorization;
        if (authHeader === 'Bearer new_refreshed_access_token') {
          return {
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ data: { success: true } }),
          };
        }

        return {
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: { code: 'UNAUTHENTICATED', message: 'Token expired' } }),
        };
      }

      return { ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({}) };
    }) as any;

    // Trigger two concurrent requests that both get 401
    const req1 = apiRequest('/stories');
    const req2 = apiRequest('/profile');

    const [res1, res2] = await Promise.all([req1, req2]);

    expect(res1).toEqual({ success: true });
    expect(res2).toEqual({ success: true });

    // Single-flight guarantee: refresh endpoint called EXACTLY ONCE
    expect(refreshCallCount).toBe(1);
    expect(getAccessToken()).toBe('new_refreshed_access_token');
  });
});
