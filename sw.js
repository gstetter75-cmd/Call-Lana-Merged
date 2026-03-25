// Service Worker for Call Lana PWA
const CACHE_NAME = 'calllana-v1';
const SHELL_ASSETS = [
  '/Call-Lana-Merged/css/common.css',
  '/Call-Lana-Merged/js/logger.js',
  '/Call-Lana-Merged/js/supabase-init.js',
  '/Call-Lana-Merged/js/auth.js',
  '/Call-Lana-Merged/js/db.js',
  '/Call-Lana-Merged/js/auth-guard.js',
  '/Call-Lana-Merged/js/config.js',
  '/Call-Lana-Merged/js/dashboard-components.js',
  '/Call-Lana-Merged/logo-nav.png',
  '/Call-Lana-Merged/logo-nav.webp',
  '/Call-Lana-Merged/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and Supabase API calls
  if (event.request.method !== 'GET' || url.hostname.includes('supabase')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Network-first for HTML, cache-first for assets
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return fetch(event.request).catch(() => cached || new Response('Offline', { status: 503 }));
      }
      return cached || fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
