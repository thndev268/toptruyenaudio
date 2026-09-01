import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number; // Duration in ms
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onComplete, 
  duration = 2000 
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const percentage = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(percentage);

      if (percentage < 100) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 300); // Small delay before hiding
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black">
      {/* Video Background */}
      <video
        src="/branding/video_loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: 0.6,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            TOP TRUYỆN AUDIO
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            Đang tải trải nghiệm nghe truyện...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          {/* Progress Bar Background */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            {/* Progress Bar Fill */}
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress Text */}
          <div className="flex justify-between items-center text-white/90 text-sm">
            <span>Đang tải...</span>
            <span className="font-mono font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
