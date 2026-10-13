// Service Worker: macht die App offline nutzbar.
// Strategie "Netz zuerst": Mit Internet kommt immer die neueste Version,
// ohne Internet die zuletzt gespeicherte.

const CACHE = 'lern-app-v4';
const DATEIEN = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'fonts/andika-latin-400.woff2',
  'fonts/playwrite-de-grund-latin-400.woff2',
  'fonts/playwrite-de-la-latin-400.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    // 'no-cache' fragt immer beim Server nach, statt den Zwischenspeicher des Browsers
    // zu nutzen – sonst kämen Änderungen erst nach Minuten an.
    fetch(e.request, { cache: 'no-cache' })
      .then((antwort) => {
        const kopie = antwort.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
