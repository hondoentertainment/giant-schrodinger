const CACHE_NAME = 'venn-v1';

const SHELL_FILES = ['/', '/index.html'];

// Only cache same-origin static assets matching these extensions
const CACHEABLE_EXT = /\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|ico|webp|json)(\?|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    // Network-first for navigation requests
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  } else {
    // Cache-first for same-origin static assets only
    const url = new URL(request.url);
    const isCacheable = url.origin === self.location.origin && CACHEABLE_EXT.test(url.pathname);

    if (!isCacheable) {
      event.respondWith(fetch(request));
      return;
    }

    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
  }
});
