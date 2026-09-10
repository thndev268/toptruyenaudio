import React, { useEffect, useRef } from 'react';

interface GoogleAdProps {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({ slot, className = '', style = {} }) => {
  const adRef = useRef<HTMLModElement>(null);
  const adInitialized = useRef(false);

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

  return (
    <div className={`google-ad-container ${className}`} style={style}>
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
