const CACHE_NAME = 'orbital-insight-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install: Cache critical app shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Coordinate network vs cache strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignore cross-origin non-HTTP/HTTPS protocols (like chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  // Cache-First strategy for assets (JS, CSS, images, fonts, JSON content factsheets)
  const isStaticAsset = 
    requestUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|otf|json)$/) ||
    requestUrl.hostname.includes('fonts.googleapis.com') ||
    requestUrl.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          return new Response('Asset unavailable offline', { status: 503 });
        });
      })
    );
  } else {
    // Network-First fallback to cache for document index.html and dynamic API routes
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fall back to main page frame
            return caches.match('/').then((rootResponse) => {
              if (rootResponse) return rootResponse;
              return new Response('Offline content unavailable', { status: 503 });
            });
          });
        })
    );
  }
});
