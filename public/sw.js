const CACHE_NAME = 'depth-study-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Do not aggressively cache authenticated/API requests.
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      if (request.mode === 'navigate') {
        return caches.match('/offline');
      }
      return Response.error();
    }),
  );
});
