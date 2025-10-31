const CACHE_NAME = 'hokkabaz-v1';
const STATIC_CACHE = 'hokkabaz-static-v1';
const DYNAMIC_CACHE = 'hokkabaz-dynamic-v1';

// Cache edilecek statik dosyalar
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/globals.css'
];

// Cache edilecek API endpoint'leri
const API_CACHE_PATTERNS = [
  /^\/api\/campaigns/,
  /^\/api\/bonuses/,
  /^\/api\/page-articles/
];

// Cache edilmeyecek dosyalar
const EXCLUDE_PATTERNS = [
  /^\/api\/admin/,
  /^\/admin/,
  /\.hot-update\./,
  /_next\/webpack-hmr/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Admin sayfalarını cache'leme
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }

  // Statik dosyalar için cache-first stratejisi
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((fetchResponse) => {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
              return fetchResponse;
            });
        })
    );
    return;
  }

  // API istekleri için network-first stratejisi
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // HTML sayfalar için network-first stratejisi
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => {
              return response || caches.match('/');
            });
        })
    );
  }
});