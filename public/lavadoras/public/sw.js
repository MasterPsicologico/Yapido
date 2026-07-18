/* Lavadoras SW — offline-first mínimo. */
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `lav-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lav-runtime-${CACHE_VERSION}`;
const API_CACHE = `lav-api-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/washer',
  '/stores',
  '/products',
  '/profile',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => undefined),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request, cacheName) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && res.status === 200) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip Next internals.
  if (url.pathname.startsWith('/_next/data')) return;
  if (url.pathname.startsWith('/__nextjs')) return;
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/offline-snapshot')) {
      event.respondWith(staleWhileRevalidate(request, API_CACHE));
      return;
    }
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
