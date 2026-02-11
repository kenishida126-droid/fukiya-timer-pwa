/* =========================================================
   Fukiya Timer PWA
   service-worker.js（最終・音声完全オフライン対応）
   配置場所：
   /fukiya-timer-pwa/service-worker.js
   ========================================================= */

const CACHE_NAME = 'fukiya-timer-pwa-20260211-2';

/* --- install 時に一気にキャッシュする対象 ---
   ※ すべて「/fukiya-timer-pwa/」からの絶対パス */
const PRECACHE_URLS = [
  '/fukiya-timer-pwa/',
  '/fukiya-timer-pwa/index.html',

  '/fukiya-timer-pwa/official/',
  '/fukiya-timer-pwa/official/index.html',
  '/fukiya-timer-pwa/extra/',
  '/fukiya-timer-pwa/extra/index.html',
  '/fukiya-timer-pwa/other/',
  '/fukiya-timer-pwa/other/index.html',
  '/fukiya-timer-pwa/gemini/',
  '/fukiya-timer-pwa/gemini/index.html',

  // official mp3
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

  // extra
  '/fukiya-timer-pwa/extra/start-0.mp3',
  '/fukiya-timer-pwa/extra/30sec.mp3',
  '/fukiya-timer-pwa/extra/end.mp3',

  // other
  '/fukiya-timer-pwa/other/start-0.mp3',
  '/fukiya-timer-pwa/other/30sec.mp3',
  '/fukiya-timer-pwa/other/end.mp3',

  // gemini
  '/fukiya-timer-pwa/gemini/start-0.mp3',
  '/fukiya-timer-pwa/gemini/30sec.mp3',
  '/fukiya-timer-pwa/gemini/end.mp3'
];

/* ---------------------------------------------------------
   install
   ・ここで「一気に全部キャッシュ」
--------------------------------------------------------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* ---------------------------------------------------------
   activate
   ・古いキャッシュを完全削除
--------------------------------------------------------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {

      // ① 古いキャッシュを完全削除
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      );

      // ② 画面に「更新完了」を通知 ← ★ここが追加点
      const clientsList = await self.clients.matchAll({ type: 'window' });
      for (const client of clientsList) {
        client.postMessage({
          type: 'CACHE_UPDATED',
          cacheName: CACHE_NAME
        });
      }

    })()
  );

  // ③ 新SWを即支配
  self.clients.claim();
});

/* ---------------------------------------------------------
   fetch
   ・mp3 は強制的にキャッシュから返す（Range対策）
   ・それ以外は cache → network
--------------------------------------------------------- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(url.pathname).then(res => res || fetch(event.request))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
