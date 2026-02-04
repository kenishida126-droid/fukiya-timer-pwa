// ===== Fukiya Timer PWA : Offline Complete Service Worker =====

// キャッシュ名（更新時は必ず名前を変える）
const CACHE_NAME = 'fukiya-timer-pwa-v1';

// ① オフラインでも必ず表示したい「画面・UI」
const OFFLINE_URLS = [
  '/',
  '/index.html',

  '/official/',
  '/official/index.html',

  '/extra/',
  '/extra/index.html',

  '/other/',
  '/other/index.html',

  '/icon-192.png',
  '/icon-512.png'
];

// ② オフラインでも必ず鳴らしたい「音声（完全列挙）」
const AUDIO_URLS = [
  // official
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

  // extra
  '/extra/start-0.mp3',
  '/extra/30sec.mp3',
  '/extra/end.mp3',

  // other
  '/other/start-0.mp3',
  '/other/30sec.mp3',
  '/other/end.mp3'
];

// ===== install：初回インストール時に全キャッシュ =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        ...OFFLINE_URLS,
        ...AUDIO_URLS
      ]);
    })
  );
  self.skipWaiting();
});

// ===== activate：古いキャッシュを完全削除 =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ===== fetch：基本はキャッシュ優先 =====
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
