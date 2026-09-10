import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { adminRepository } from '../services/repositories/AdminRepository';

const TIMEOUT_MS = 60000; // 1 minute timeout

export interface UseStoriesState {
  stories: any[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasTimedOut: boolean;
}

export function useStories() {
  const [state, setState] = useState<UseStoriesState>({
    stories: [],
    isLoading: true,
    isLoadingMore: false,
    error: null,
    hasTimedOut: false,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchStories = useCallback(async (isInitial = true) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isInitial) {
      setState(prev => ({ ...prev, isLoading: true, error: null, hasTimedOut: false }));
    } else {
      setState(prev => ({ ...prev, isLoadingMore: true, error: null }));
    }

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: new Error('Hệ thống đang gặp sự cố. Vui lòng chờ trong giây lát...'),
          hasTimedOut: true,
        }));
      }
    }, TIMEOUT_MS);

    try {
      // Fetch from repository
      const fetchedStories = await adminRepository.fetchPublicStoriesApi();
      
      // Ensure fetchedStories is an array
      const storiesArray = Array.isArray(fetchedStories) ? fetchedStories : [];
      if (!Array.isArray(fetchedStories)) {
        console.warn('[useStories] fetchedStories is not an array', fetchedStories);
      }
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          stories: isInitial ? storiesArray : [...prev.stories, ...storiesArray],
          isLoading: false,
          isLoadingMore: false,
          error: null,
          hasTimedOut: false,
        }));
      }
    } catch (error) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: error instanceof Error ? error : new Error('Không thể tải dữ liệu'),
          hasTimedOut: false,
        }));
      }
    }
  }, []);

  const retry = useCallback(() => {
    fetchStories(true);
  }, [fetchStories]);

  const loadMore = useCallback(() => {
    fetchStories(false);
  }, [fetchStories]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStories(true);

    const handleSync = () => {
      if (mountedRef.current) {
        const fetchedStories = adminRepository.getPublicStories();
        const storiesArray = Array.isArray(fetchedStories) ? fetchedStories : [];
        setState(prev => ({
          ...prev,
          stories: storiesArray,
          isLoading: false,
          error: null,
          hasTimedOut: false,
        }));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'toptruyenaudio:admin-data:v1' || e.key === 'toptruyenaudio:admin-stories:v1') {
        if (mountedRef.current) {
          const fetchedStories = adminRepository.getPublicStories();
          const storiesArray = Array.isArray(fetchedStories) ? fetchedStories : [];
          setState(prev => ({
            ...prev,
            stories: storiesArray,
            isLoading: false,
            error: null,
            hasTimedOut: false,
          }));
        }
      }
    };

    window.addEventListener('toptruyenaudio_admin_sync', handleSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('toptruyenaudio_admin_sync', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchStories]);

  return useMemo(() => ({
    ...state,
    retry,
    loadMore,
  }), [state, retry, loadMore]);
}
