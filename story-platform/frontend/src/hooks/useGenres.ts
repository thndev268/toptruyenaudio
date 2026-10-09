import { useState, useEffect } from 'react';
import { adminRepository } from '../services/repositories/AdminRepository';

/**
 * Hook to retrieve categories/genres dynamically and update in real-time
 * when the admin sync event is triggered.
 */
export function useGenres() {
  const [genres, setGenres] = useState(() => {
    const fetchedGenres = adminRepository.getGenres();
    return Array.isArray(fetchedGenres) ? fetchedGenres : [];
  });

  useEffect(() => {
    const handleSync = () => {
      const fetchedGenres = adminRepository.getGenres();
      setGenres(Array.isArray(fetchedGenres) ? fetchedGenres : []);
    };

    // Listen to admin sync event for real-time reactivity
    window.addEventListener('toptruyenaudio_admin_sync', handleSync);
    
    // Fallback storage listener for cross-tab or cross-frame updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'toptruyenaudio:admin-data:v1') {
        const fetchedGenres = adminRepository.getGenres();
        setGenres(Array.isArray(fetchedGenres) ? fetchedGenres : []);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('toptruyenaudio_admin_sync', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return genres;
}
