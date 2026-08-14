import { useState, useEffect } from 'react';
import { adminRepository } from '../services/repositories/AdminRepository';

/**
 * Hook to retrieve public stories dynamically and update in real-time
 * when the admin sync event is triggered (e.g. from server API updates).
 */
export function useStories() {
  const [stories, setStories] = useState(() => adminRepository.getPublicStories());

  useEffect(() => {
    const handleSync = () => {
      setStories(adminRepository.getPublicStories());
    };

    // Listen to admin sync event for real-time reactivity
    window.addEventListener('toptruyenaudio_admin_sync', handleSync);
    
    // Fallback storage listener for cross-tab or cross-frame updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'toptruyenaudio:admin-data:v1' || e.key === 'toptruyenaudio:admin-stories:v1') {
        setStories(adminRepository.getPublicStories());
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('toptruyenaudio_admin_sync', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return stories;
}
