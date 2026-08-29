import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  priority?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  className = '',
}) => {
  const logoUrl = '/branding/logotoptruyen.png';

  return (
    <Link
      to="/"
      aria-label="Về trang chủ TOP TRUYỆN AUDIO"
      className={`flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg ${className}`}
    >
      <img
        src={logoUrl}
        alt="TOP TRUYỆN AUDIO"
        className="w-10 h-10 object-contain shrink-0"
        width="40"
        height="40"
      />
      {variant !== 'icon' && (
        <div className="flex flex-col">
          {variant === 'full' ? (
            <>
              <span className="font-black text-white text-lg leading-tight tracking-wide">
                TOP TRUYỆN
              </span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-sm leading-none flex items-center gap-1 uppercase tracking-widest">
                AUDIO
                <span className="flex items-end gap-[2px] h-3 ml-1">
                  <span className="w-1 h-3 bg-fuchsia-500 rounded-full inline-block"></span>
                  <span className="w-1 h-2 bg-pink-500 rounded-full inline-block"></span>
                  <span className="w-1 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                </span>
              </span>
            </>
          ) : (
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-lg leading-tight tracking-wide uppercase">
              TOP AUDIO
            </span>
          )}
        </div>
      )}
    </Link>
  );
};
