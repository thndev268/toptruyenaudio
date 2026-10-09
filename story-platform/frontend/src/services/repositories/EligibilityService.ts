import { EligibilityResult } from '../../types/reviews';
import { ListeningProgress } from '../../types';

import { STORAGE_KEYS } from '../storage';

export const VALID_LISTENING_STORAGE_KEY = STORAGE_KEYS.VALID_LISTENING;

export class EligibilityService {
  /**
   * Reads or initializes the mock valid listening seconds per story from localStorage.
   * Format: Record<storyId, validListeningSeconds>
   */
  static getValidListeningSecondsMap(): Record<string, number> {
    try {
      const raw = localStorage.getItem(VALID_LISTENING_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
      console.warn('[EligibilityService] Error reading valid listening seconds map', e);
      return {};
    }
  }

  static setValidListeningSeconds(storyId: string, seconds: number): void {
    try {
      const current = this.getValidListeningSecondsMap();
      current[storyId] = Math.max(0, seconds);
      localStorage.setItem(VALID_LISTENING_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('[EligibilityService] Failed to set valid listening seconds', e);
    }
  }

  /**
   * Calculates eligibility based on prompt specification.
   * 
   * @param storyId ID of story
   * @param userId Logged in user ID (or null/empty for guest)
   * @param totalDurationSeconds Total duration of story in seconds
   * @param progressMap AudioPlayerContext listeningProgressMap
   * @param history AudioPlayerContext listeningHistory
   */
  static checkEligibility(
    storyId: string,
    userId: string | null | undefined,
    totalDurationSeconds: number,
    progressMap?: Record<string, ListeningProgress>,
    history?: ListeningProgress[]
  ): EligibilityResult {
    // Guest is never eligible
    if (!userId) {
      const required = totalDurationSeconds < 1800
        ? Math.ceil(totalDurationSeconds * 0.7)
        : 1800;

      return {
        canRate: false,
        canComment: false,
        validListeningSeconds: 0,
        requiredListeningSeconds: required,
        remainingSeconds: required,
        verifiedListener: false,
      };
    }

    // Required listening seconds: 30 minutes (1800s) or 70% if total duration < 30m
    const THIRTY_MINUTES_SECONDS = 1800;
    const requiredListeningSeconds = totalDurationSeconds > 0 && totalDurationSeconds < THIRTY_MINUTES_SECONDS
      ? Math.ceil(totalDurationSeconds * 0.7)
      : THIRTY_MINUTES_SECONDS;

    // 1. Get explicit accumulated valid listening time from mock storage
    const validListeningMap = this.getValidListeningSecondsMap();
    let validSeconds = validListeningMap[storyId] ?? 0;

    // 2. Count completed chapters for story from listening history & progress map
    let completedChaptersCount = 0;
    if (progressMap) {
      Object.values(progressMap).forEach((prog) => {
        if (prog.storyId === storyId && prog.completed) {
          completedChaptersCount++;
        }
      });
    }

    if (history) {
      const historyCompleted = history.filter((h) => h.storyId === storyId && h.completed);
      completedChaptersCount = Math.max(completedChaptersCount, historyCompleted.length);
    }

    // Determine eligibility
    const canRate = validSeconds >= requiredListeningSeconds;
    const canComment = canRate;

    // Verified Listener: >= 60 minutes (3600s) OR completed >= 2 chapters
    const verifiedListener = validSeconds >= 3600 || completedChaptersCount >= 2;

    const remainingSeconds = Math.max(0, requiredListeningSeconds - validSeconds);

    return {
      canRate,
      canComment,
      validListeningSeconds: validSeconds,
      requiredListeningSeconds,
      remainingSeconds,
      verifiedListener,
    };
  }
}
