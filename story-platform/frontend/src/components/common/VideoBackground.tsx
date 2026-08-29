import React, { useState, useEffect } from 'react';

export const VideoBackground: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const videoSrc = isMobile ? '/branding/loopmobile.mp4' : '/branding/loop.mp4';

  return (
    <>
      <video
        key={videoSrc}
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setIsLoaded(true)}
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-slate-950/70 z-0 pointer-events-none" />
      {/* Gradient overlay for dark fantasy theme */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950/80 z-0 pointer-events-none" />
    </>
  );
};
