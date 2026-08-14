import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface PwaInstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isGuideOpen: boolean;
  installPwa: () => Promise<void>;
  openGuide: () => void;
  closeGuide: () => void;
  showNotice: boolean;
  dismissNotice: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined);

const DISMISS_KEY = 'toptruyenaudio:pwa-install-dismissed-at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const PwaInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [showNotice, setShowNotice] = useState<boolean>(false);

  // useRef to store the browser's beforeinstallprompt event safely
  const deferredPromptRef = useRef<any>(null);

  // Helper to check standalone mode
  const checkIsStandalone = (): boolean => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect standalone mode
    const standalone = checkIsStandalone();
    if (standalone) {
      setIsInstalled(true);
      setCanInstall(false);
      setShowNotice(false);
      return;
    }

    // 2. Detect device type
    const userAgent = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /Android/i.test(userAgent);
    
    setIsIos(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    const isIframe = window.self !== window.top;
    const isDevUrl = window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost');

    if (isIOSDevice || isAndroidDevice || isIframe || isDevUrl) {
      // Mobile devices or preview/dev environments are usually installable
      setCanInstall(true);
    } else {
      // Chrome/Edge/Android check if we captured deferredPromptEvent early
      const earlyEvent = (window as any).deferredPromptEvent;
      if (earlyEvent) {
        deferredPromptRef.current = earlyEvent;
        setCanInstall(true);
      }
    }

    // 3. Listeners for capturing install prompts & installation success
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setIsInstalled(true);
      setCanInstall(false);
      setShowNotice(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Determine if the login/register notice should be shown
  useEffect(() => {
    if (isInstalled || !canInstall) {
      setShowNotice(false);
      return;
    }

    const dismissedAtStr = localStorage.getItem(DISMISS_KEY);
    if (dismissedAtStr) {
      const dismissedAt = parseInt(dismissedAtStr, 10);
      const now = Date.now();

      if (!isNaN(dismissedAt) && now - dismissedAt < SEVEN_DAYS_MS) {
        setShowNotice(false);
        return;
      }
    }

    setShowNotice(true);
  }, [canInstall, isInstalled]);

  const installPwa = async () => {
    if (isInstalled) return;
    // Always show the manual guide as requested by the user
    setIsGuideOpen(true);
  };

  const openGuide = () => {
    setIsGuideOpen(true);
  };

  const closeGuide = () => {
    setIsGuideOpen(false);
  };

  const dismissNotice = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowNotice(false);
  };

  return (
    <PwaInstallContext.Provider
      value={{
        canInstall,
        isInstalled,
        isIos,
        isAndroid,
        isGuideOpen,
        installPwa,
        openGuide,
        closeGuide,
        showNotice,
        dismissNotice,
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = (): PwaInstallContextValue => {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error('usePwaInstall must be used within a PwaInstallProvider');
  }
  return context;
};
