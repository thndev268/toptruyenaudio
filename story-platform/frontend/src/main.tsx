import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { PwaInstallProvider } from './context/PwaInstallContext';

// Handle cross-origin iframe / third-party script errors gracefully
window.addEventListener('error', (event) => {
  if (event.message === 'Script error.' || event.message === 'Script error') {
    // Suppress unhandled cross-origin noise from third-party scripts/iframes
    console.warn('[TopTruyenAudio] Cross-origin script event intercepted safely:', event.filename);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Script error')) {
    event.preventDefault();
  }
});

// Safe PWA Service Worker Registration
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  // Capture PWA installation prompt event early to prevent missing it
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPromptEvent = e;
  });

  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('PWA Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.warn('PWA Service Worker registration skipped or failed:', error);
        });
    } catch (e) {
      console.warn('Service worker setup ignored:', e);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaInstallProvider>
      <App />
    </PwaInstallProvider>
  </StrictMode>,
);

