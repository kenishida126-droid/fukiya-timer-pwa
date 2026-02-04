// ================================
// Fukiya Timer PWA
// 完全オフライン対応・最終版
// ================================

const CACHE_NAME = 'fukiya-timer-pwa-20260204-2';

// HTML & 必須リソース（壁紙は含めない）
const PRECACHE_URLS = [
  '/fukiya-timer-pwa/',
  '/fukiya-timer-pwa/index.html',

  '/fukiya-timer-pwa/official/',
  '/fukiya-timer-pwa/official/index.html',

  '/fukiya-timer-pwa/extra/',
  '/fukiya-timer-pwa/extra/index.html',

  '/fukiya-timer-pwa/other/',
  '/fukiya-timer-pwa/other/index.html',

  '/fukiya-timer-pwa/icon-192.png',
  '/fukiya-timer-pwa/icon-512.png',

  // ---------- official mp3 ----------
  '/fukiya-timer-pwa/official/start-0.mp3',
  '/fukiya-timer-pwa/official/start-1.mp3',
  '/fukiya-timer-pwa/official/start-2.mp3',
  '/fukiya-timer-pwa/official/start-3.mp3',
  '/fukiya-timer-pwa/official/start-4.mp3',
  '/fukiya-timer-pwa/official/start-5.mp3',
  '/fukiya-timer-pwa/official/start-6.mp3',
  '/fukiya-timer-pwa/official/30sec.mp3',
  '/fukiya-timer-pwa/official/end.mp3',
  '/fukiya-timer-pwa/official/end_haneya.mp3',
  '/fukiya-timer-pwa/official/end_tandoku.mp3',
  '/fukiya-timer-pwa/official/clean.mp3',

  // ---------- extra mp3 ----------
  '/fukiya-timer-pwa/extra/start-0.mp3',
  '/fukiya-timer-pwa/extra/30sec.mp3',
  '/fukiya-timer-pwa/extra/end.mp3',

  // ---------- other mp3 ----------
  '/fukiya-timer-pwa/other/start-0.mp3',
  '/fukiya-timer-pwa/other/30sec.mp3',
  '/fukiya-timer-pwa/other/end.mp3'
];

// ---------- install：一気にキャッシュ ----------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ---------- activate：旧キャッシュ完全削除 ----------
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

// ---------- fetch：キャッシュ優先（オフライン最優先） ----------
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
