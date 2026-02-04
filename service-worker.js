const CACHE_NAME = 'fukiya-timer-cache-v1';

// オフラインでも表示したい「画面だけ」
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

// インストール時：最低限だけキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュ掃除（安全）
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

// 通信優先 → 失敗したらキャッシュ
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
