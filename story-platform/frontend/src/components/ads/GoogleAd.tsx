import React, { useEffect, useRef, useState } from 'react';

interface GoogleAdProps {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({ slot, className = '', style = {} }) => {
  const adRef = useRef<HTMLModElement>(null);
  const adInitialized = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasContent, setHasContent] = useState(false);

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

    // Use MutationObserver to detect when AdSense fills the ad slot
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const adElement = adRef.current;
          if (adElement) {
            // Check if ad has content or has been filled
            const hasChildren = adElement.children.length > 0;
            const hasIframe = adElement.querySelector('iframe');
            const adStatus = adElement.getAttribute('data-ad-status');
            
            if (hasChildren || hasIframe || adStatus === 'filled') {
              setHasContent(true);
              setAdLoaded(true);
            }
          }
        }
      });
    });

    // Start observing
    observer.observe(adRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ad-status']
    });

    // Also check periodically for ad status
    const checkInterval = setInterval(() => {
      const adElement = adRef.current;
      if (adElement) {
        const adStatus = adElement.getAttribute('data-ad-status');
        if (adStatus === 'filled') {
          setHasContent(true);
          setAdLoaded(true);
          clearInterval(checkInterval);
        } else if (adStatus === 'unfilled') {
          // Ad was not filled, keep it collapsed
          clearInterval(checkInterval);
        }
      }
    }, 500);

    // Cleanup
    return () => {
      observer.disconnect();
      clearInterval(checkInterval);
    };
  }, []);

  // Container style: collapsed until ad has content
  const containerStyle: React.CSSProperties = {
    ...style,
    minHeight: hasContent ? 'auto' : '0',
    height: hasContent ? 'auto' : '0',
    overflow: 'hidden',
    transition: 'height 0.3s ease',
  };

  return (
    <div 
      className={`google-ad-container ${className}`} 
      style={containerStyle}
    >
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
