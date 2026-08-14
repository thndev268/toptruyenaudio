const CACHE_NAME = 'top-truyen-audio-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/branding/top-truyen-audio-logo.svg',
  '/favicon.svg',
];

// Install event - Pre-cache core App Shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up legacy caches belonging ONLY to TOP TRUYỆN AUDIO
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('top-truyen-audio-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Safe network-first / cache-first strategies
self.addEventListener('fetch', (event) => {
  // 1. Strictly bypass non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 2. Strictly bypass cross-origin protocols (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // 3. Strictly bypass API endpoints and authorization-heavy requests
  if (
    url.pathname.startsWith('/api/') ||
    event.request.headers.has('Authorization')
  ) {
    return;
  }

  // 4. Strictly bypass dynamic user-sensitive / progress / membership paths
  const isSensitiveRoute = 
    url.pathname.includes('/account') ||
    url.pathname.includes('/profile') ||
    url.pathname.includes('/membership') ||
    url.pathname.includes('/history') ||
    url.pathname.includes('/progress');
  if (isSensitiveRoute) return;

  // 5. Strictly bypass heavy multimedia, streaming media, and external video frames
  const isMediaRequest =
    event.request.destination === 'audio' ||
    event.request.destination === 'video' ||
    url.pathname.match(/\.(mp3|m3u8|ts|mp4|webm|ogg)$/i) ||
    url.hostname.includes('youtube') ||
    url.hostname.includes('youtube-nocookie') ||
    url.hostname.includes('ytimg');
  if (isMediaRequest) return;

  // 6. Handle safe static assets (CSS, bundled JS, safe vector/raster images, web fonts)
  const isStaticAsset = 
    event.request.destination === 'image' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'font' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Only cache valid, non-opaque, successful basic/cors responses
            if (
              networkResponse && 
              networkResponse.status === 200 && 
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
            }
            return networkResponse;
          })
          .catch(() => {});
          
        return cachedResponse || fetchPromise.then(res => res || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // 7. HTML Navigation: Network-first, fall back to index.html for SPA client-side routing
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Only cache successful, safe basic/cors navigation responses
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
