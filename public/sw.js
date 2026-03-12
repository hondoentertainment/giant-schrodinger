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

// Push notification support
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : 'You have a new notification!' };
  }

  const title = data.title || 'Venn with Friends';
  const options = {
    body: data.body || 'You have a new notification!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎯</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎯</text></svg>',
    tag: data.tag || 'venn-notification',
    data: data.url || '/',
    actions: data.actions || [
      { action: 'play', title: 'Play Now' },
      { action: 'dismiss', title: 'Later' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: data.tag === 'streak-reminder',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action buttons
  if (event.action === 'dismiss') return;

  const url = event.notification.data || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Handle push subscription change (key rotation)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Notify the app about the new subscription
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_SUBSCRIPTION_CHANGED',
              subscription: subscription.toJSON(),
            });
          });
        });
      })
  );
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
