// Service Worker Version: 20260602104308
const CACHE_NAME = 'fruitbox-20260602104308';
const STATIC_ASSETS = ['/fruitBox/', '/fruitBox/index.html', '/fruitBox/manifest.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then((cached) => cached || caches.match('/fruitBox/index.html')))); });