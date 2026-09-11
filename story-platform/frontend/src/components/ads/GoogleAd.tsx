import React, { useEffect, useRef, useState } from 'react';

interface GoogleAdProps {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({ slot, className = '', style = {} }) => {
  const adRef = useRef<HTMLModElement>(null);
  const adInitialized = useRef(false);
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    if (adInitialized.current) return;

    try {
      if (adRef.current && !adRef.current.hasAttribute('data-ad-status')) {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
        adInitialized.current = true;
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  useEffect(() => {
    if (!adRef.current) return;

    // Use MutationObserver to detect data-ad-status changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
          const adElement = adRef.current;
          if (adElement) {
            const adStatus = adElement.getAttribute('data-ad-status');
            if (adStatus === 'unfilled' || adStatus === 'unfill-optimized') {
              // Collapse wrapper for unfilled or unfill-optimized
              setIsUnfilled(true);
            } else if (adStatus === 'filled') {
              // Show wrapper when ad is filled
              setIsUnfilled(false);
            }
          }
        }
      });
    });

    // Start observing data-ad-status attribute
    observer.observe(adRef.current, {
      attributes: true,
      attributeFilter: ['data-ad-status']
    });

    // Also check periodically for ad status (fallback)
    const checkInterval = setInterval(() => {
      const adElement = adRef.current;
      if (adElement) {
        const adStatus = adElement.getAttribute('data-ad-status');
        if (adStatus === 'unfilled' || adStatus === 'unfill-optimized') {
          setIsUnfilled(true);
          clearInterval(checkInterval);
        } else if (adStatus === 'filled') {
          setIsUnfilled(false);
          clearInterval(checkInterval);
        }
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      observer.disconnect();
      clearInterval(checkInterval);
    };
  }, []);

  // Container style: collapse only when ad is unfilled
  const containerStyle: React.CSSProperties = {
    ...style,
    minHeight: isUnfilled ? '0' : 'auto',
    height: isUnfilled ? '0' : 'auto',
    overflow: isUnfilled ? 'hidden' : 'visible',
    transition: 'height 0.3s ease',
  };

  return (
    <div
      className={`google-ad-container ${className}`}
      style={containerStyle}
    >
      {/* <ins> must be rendered normally for AdSense to work */}
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1888581498904623"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
