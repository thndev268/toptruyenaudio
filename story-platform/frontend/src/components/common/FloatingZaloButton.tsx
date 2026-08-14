import React, { useState, useEffect } from 'react';
import { siteSettingsService, ZaloSettings } from '../../services/siteSettings';

// Custom SVG icon for Zalo
const ZaloIcon = ({ className = "w-9 h-auto" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="25 36 46 16" 
    fill="white" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M36.55 36.55H25.387V40.075H31.883L25.387 47.852V51.375H36.55V47.852H30.055L36.55 40.075V36.55Z" />
    <path d="M43.717 36.55C39.83 36.55 36.675 39.705 36.675 43.592C36.675 47.479 39.83 50.634 43.717 50.634C47.604 50.634 50.759 47.479 50.759 43.592C50.759 39.705 47.604 36.55 43.717 36.55ZM43.717 47.11C41.775 47.11 40.2 45.535 40.2 43.592C40.2 41.65 41.775 40.075 43.717 40.075C45.659 40.075 47.234 41.65 47.234 43.592C47.234 45.535 45.659 47.11 43.717 47.11Z" />
    <path d="M53.93 36.55H50.405V51.375H53.93V36.55Z" />
    <path d="M63.435 36.55C59.548 36.55 56.393 39.705 56.393 43.592C56.393 47.479 59.548 50.634 63.435 50.634C67.322 50.634 70.477 47.479 70.477 43.592C70.477 39.705 67.322 36.55 63.435 36.55ZM63.435 47.11C61.493 47.11 59.918 45.535 59.918 43.592C59.918 41.65 61.493 40.075 63.435 40.075C65.377 40.075 66.952 41.65 66.952 43.592C66.952 45.535 65.377 47.11 63.435 47.11Z" />
  </svg>
);

export const FloatingZaloButton: React.FC = () => {
  const [settings, setSettings] = useState<ZaloSettings>(siteSettingsService.getZaloSettings());

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(siteSettingsService.getZaloSettings());
    };

    window.addEventListener('siteSettingsChanged', handleSettingsChange);
    return () => {
      window.removeEventListener('siteSettingsChanged', handleSettingsChange);
    };
  }, []);

  if (!settings.isEnabled || !settings.link) {
    return null;
  }

  // Basic validation for Zalo link
  let isValidLink = false;
  try {
    const url = new URL(settings.link);
    if (url.protocol === 'https:' && url.hostname.endsWith('zalo.me')) {
      isValidLink = true;
    }
  } catch (e) {
    // Invalid URL
  }

  if (!isValidLink) {
    return null;
  }

  const positionClass = settings.position === 'left' ? 'left-4 md:left-8' : 'right-4 md:right-8';

  return (
    <a
      href={settings.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${positionClass} z-40 flex items-center justify-center w-14 h-14 bg-[#0068FF] rounded-full shadow-[0_4px_20px_rgba(0,104,255,0.4)] hover:shadow-[0_6px_25px_rgba(0,104,255,0.5)] hover:-translate-y-1 transition-all duration-300 group safe-area-bottom`}
      style={{
        bottom: 'calc(var(--mini-player-height, 72px) + env(safe-area-inset-bottom) + 84px)',
      }}
      aria-label={settings.displayName || "Liên hệ Zalo"}
      title={settings.displayName || "Liên hệ Zalo"}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        <ZaloIcon />
        {/* Pulse effect */}
        <span className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></span>
      </div>
      
      {/* Tooltip */}
      {settings.displayName && (
        <span className={`absolute ${settings.position === 'left' ? 'left-full ml-3' : 'right-full mr-3'} px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700/50`}>
          {settings.displayName}
          {/* Arrow */}
          <span className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-slate-700/50 rotate-45 ${settings.position === 'left' ? '-left-1 border-b border-l' : '-right-1 border-t border-r'}`}></span>
        </span>
      )}
    </a>
  );
};
