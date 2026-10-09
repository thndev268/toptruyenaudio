import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTopOnNavigation = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Check if there is a main scroll container or use window
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};
