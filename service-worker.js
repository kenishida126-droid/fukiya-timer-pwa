/* =========================================================
   Fukiya Timer PWA
   完全自動更新 / オフライン対応 service-worker.js
   改版時は CACHE_NAME を変更するだけ
========================================================= */

const CACHE_NAME = 'fukiya-timer-pwa-20260204';

/* オフラインでも必須なものだけ */
const PRECACHE_URLS = [
  '/',
  '/index.html',

  '/official/',
  '/official/index.html',
  '/extra/',
  '/extra/index.html',
  '/other/',
  '/other/index.html',

  // ===== official mp3 =====
  '/official/start-0.mp3',
  '/official/start-1.mp3',
  '/official/start-2.mp3',
  '/official/start-3.mp3',
  '/official/start-4.mp3',
  '/official/start-5.mp3',
  '/official/start-6.mp3',
  '/official/30sec.mp3',
  '/official/end.mp3',
  '/official/end_haneya.mp3',
  '/official/end_tandoku.mp3',
  '/official/clean.mp3',

  // ===== extra mp3 =====
  '/extra/start-0.mp3',
  '/extra/30sec.mp3',
  '/extra/end.mp3',

  // ===== other mp3 =====
  '/other/start-0.mp3',
  '/other/30sec.mp3',
  '/other/end.mp3',

  // icon
  '/icon-192.png',
  '/icon-512.png'
];

/* ===== install：一気にキャッシュ ===== */
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

/* ===== activate：古いキャッシュ完全削除 ===== */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/* ===== fetch：キャッシュ最優先（音声命） ===== */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
