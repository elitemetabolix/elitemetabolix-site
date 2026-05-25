/* Elite Metabolix — minimal, safe service worker.
   Strategy: network-first for pages (so clients always get their LATEST plan
   when online), with a cached offline fallback. Does NOT cache logged-in data
   responses, so no stale or cross-client data is ever served. */

const CACHE = 'em-shell-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = ['/offline.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET page navigations; let everything else (API, auth) pass through.
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
