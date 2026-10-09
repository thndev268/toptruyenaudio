import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useBodyScrollLock = (isLocked: boolean) => {
  const scrollOffset = useRef(0);
  const location = useLocation();
  const initialPathname = useRef(location.pathname);

  useEffect(() => {
    if (isLocked) {
      initialPathname.current = location.pathname;
    }
  }, [isLocked, location.pathname]);

  useEffect(() => {
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };

    if (isLocked) {
      scrollOffset.current = window.scrollY;
      
      // Calculate scrollbar width to prevent layout jump
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollOffset.current}px`;
      document.body.style.width = '100%';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.top = originalStyle.top;
      document.body.style.width = originalStyle.width;
      document.body.style.paddingRight = originalStyle.paddingRight;
      
      // Only restore scroll if we haven't navigated to a different page
      if (isLocked && window.location.pathname === initialPathname.current) {
        window.scrollTo({
          top: scrollOffset.current,
          behavior: 'auto'
        });
      }
    };
  }, [isLocked]);
};
