const CACHE = 'trackday-v3';
const ASSETS = [
  '/TrackdayManager/TrackdayManager.html',
  '/TrackdayManager/manifest.json',
  '/TrackdayManager/icon.svg',
  '/TrackdayManager/css/app.css',
  '/TrackdayManager/js/data.js',
  '/TrackdayManager/js/screen-fahrzeuge.js',
  '/TrackdayManager/js/screen-wizard.js',
  '/TrackdayManager/js/screen-setup.js',
  '/TrackdayManager/js/screen-zeiten.js',
  '/TrackdayManager/js/export-import.js',
  '/TrackdayManager/js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/TrackdayManager/TrackdayManager.html')))
  );
});
