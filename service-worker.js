/* =========================================================
   Fukiya Timer PWA
   service-worker.js（最新 index.html 強制取得対応）
   配置場所：
   /fukiya-timer-pwa/service-worker.js
   ========================================================= */

const CACHE_NAME = 'fukiya-timer-pwa-20260920-10';

/* --- install 時に一気にキャッシュする対象 ---
   ※ すべて「/fukiya-timer-pwa/」からの絶対パス */
const PRECACHE_URLS = [
  '/fukiya-timer-pwa/',
  '/fukiya-timer-pwa/index.html',

  '/fukiya-timer-pwa/official/',
  '/fukiya-timer-pwa/official/index.html',
  '/fukiya-timer-pwa/official/landscape.html',
  '/fukiya-timer-pwa/extra/',
  '/fukiya-timer-pwa/extra/index.html',
  '/fukiya-timer-pwa/gemini/',
  '/fukiya-timer-pwa/gemini/index.html',

  // official images
  '/fukiya-timer-pwa/official/key_lock.png',
  '/fukiya-timer-pwa/official/key_unlock.png',

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
  '/fukiya-timer-pwa/official/end_early.mp3',
  '/fukiya-timer-pwa/official/clean.mp3',
  '/fukiya-timer-pwa/official/whistle_end.mp3',
  '/fukiya-timer-pwa/official/whistle_start.mp3',

  // extra
  '/fukiya-timer-pwa/extra/start-0.mp3',
  '/fukiya-timer-pwa/extra/30sec.mp3',
  '/fukiya-timer-pwa/extra/end.mp3',

  // gemini
  '/fukiya-timer-pwa/gemini/start-0.mp3',
  '/fukiya-timer-pwa/gemini/30sec.mp3',
  '/fukiya-timer-pwa/gemini/end.mp3',

/* --- @test.html(癒やしのページ版)向けファイル群 ---
   ※ すべて「/fukiya-timer-pwa/」からの絶対パス 
      当初「/fukiya-timer/」としてたが無意味と判明  */
  '/fukiya-timer/',
  '/fukiya-timer-pwa/@test.html',
  '/fukiya-timer-pwa/@music-1.mp3',
  '/fukiya-timer-pwa/@music-2.mp3',
  '/fukiya-timer-pwa/@music-3.mp3',
  '/fukiya-timer-pwa/@music-4.mp3',
  '/fukiya-timer-pwa/@music-5.mp3',
  '/fukiya-timer-pwa/@music-6.mp3',
  '/fukiya-timer-pwa/@music-7.mp3',
  '/fukiya-timer-pwa/@music-8.mp3',
  '/fukiya-timer-pwa/@music-9.mp3',
  '/fukiya-timer-pwa/@music-10.mp3',
  '/fukiya-timer-pwa/@music-11.mp3',
  '/fukiya-timer-pwa/@music-12.mp3',
  '/fukiya-timer-pwa/@music-13.mp3',
  '/fukiya-timer-pwa/@music-14.mp3',
  '/fukiya-timer-pwa/@music-15.mp3',
  '/fukiya-timer-pwa/@music-16.mp3',
  '/fukiya-timer-pwa/@music-17.mp3',
  '/fukiya-timer-pwa/@music-18.mp3',
  '/fukiya-timer-pwa/@music-19.mp3',
  '/fukiya-timer-pwa/@music-20.mp3',
  '/fukiya-timer-pwa/@video.mp4',
  '/fukiya-timer-pwa/@wallpaper-1.jpg',
  '/fukiya-timer-pwa/@wallpaper-2.jpg',
  '/fukiya-timer-pwa/@wallpaper-3.jpg',
  '/fukiya-timer-pwa/@wallpaper-4.jpg',
  '/fukiya-timer-pwa/@wallpaper-5.jpg',
  '/fukiya-timer-pwa/@wallpaper-6.jpg',
  '/fukiya-timer-pwa/@wallpaper-7.jpg',
  '/fukiya-timer-pwa/@wallpaper-8.jpg',
  '/fukiya-timer-pwa/@wallpaper-9.jpg',
  '/fukiya-timer-pwa/@wallpaper-10.jpg',
  '/fukiya-timer-pwa/@wallpaper-11.jpg',
  '/fukiya-timer-pwa/@wallpaper-12.jpg',
  '/fukiya-timer-pwa/@wallpaper-13.jpg',
  '/fukiya-timer-pwa/@wallpaper-14.jpg',
  '/fukiya-timer-pwa/@wallpaper-15.jpg',
  '/fukiya-timer-pwa/@wallpaper-16.jpg',
  '/fukiya-timer-pwa/@wallpaper-17.jpg',
  '/fukiya-timer-pwa/@wallpaper-18.jpg',
  '/fukiya-timer-pwa/@wallpaper-19.jpg',
  '/fukiya-timer-pwa/@wallpaper-20.jpg'
];

/* ---------------------------------------------------------
   install
   ・install時は自動Cachingしない
--------------------------------------------------------- */
self.addEventListener('install', event => {
  event.waitUntil((async () => {

    /*
     * 新しいCACHE_NAMEのService Workerがinstallされたことを
     * クライアントへ通知する。
     *
     * ここではCachingを行わない。
     * 実際のCachingはMENUの「Request reCaching」から開始する。
     */
    const clientsList = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });

    for (const client of clientsList) {
      client.postMessage({
        type: 'CACHE_AVAILABLE',
        cacheName: CACHE_NAME
      });
    }

  })());

  self.skipWaiting();
});

/* ---------------------------------------------------------
   activate
   ・install時には古いキャッシュを削除しない
   ・RECACHE完了後に古いキャッシュを削除する
--------------------------------------------------------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {

      /*
       * install / activateの時点では旧CACHEを残す。
       *
       * Request reCaching実行後、新CACHEのCachingが完了した時点で
       * RECACHE処理内から旧CACHEを削除する。
       */

    })()
  );

  self.clients.claim();
});

/* ---------------------------------------------------------
   message
   ・現在のCACHE状態を問い合わせ
   ・Request reCachingを受信したらCaching開始
--------------------------------------------------------- */
self.addEventListener('message', event => {

  if (!event.data) return;

  if (event.data.type === 'GET_CACHE_STATUS') {

    if (event.source) {
      event.source.postMessage({
        type: 'CACHE_STATUS',
        cacheName: CACHE_NAME
      });
    }

    return;
  }

  if (event.data.type === 'RECACHE') {

    event.waitUntil((async () => {

      const clientsList = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
      });

      /* Caching開始をMENUへ通知 */
      for (const client of clientsList) {
        client.postMessage({
          type: 'CACHE_START',
          cacheName: CACHE_NAME
        });
      }

      /*
       * 新しいCACHE_NAMEを作成して、
       * PRECACHE_URLSを1つずつCachingする。
       *
       * cache.add()は使用しない。
       * HTTPキャッシュを利用せず、ネットワークから
       * 強制的に再取得してCache Storageへ保存する。
       */
      const cache = await caches.open(CACHE_NAME);

      for (const url of PRECACHE_URLS) {
        try {

          const response = await fetch(url, {
            cache: 'reload'
          });

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status} : ${url}`
            );
          }

          await cache.put(url, response);

          console.log("OK :", url);

        } catch (e) {

          console.error("NG :", url);
          console.error(e);

        }
      }

      /*
       * 新CACHEのCaching完了後、
       * Fukiya Timer PWAの旧CACHEを削除する。
       */
      const keys = await caches.keys();

      await Promise.all(
        keys.filter(k =>
          k.startsWith('fukiya-timer-pwa-') &&
          k !== CACHE_NAME
        ).map(k => caches.delete(k))
      );

      /* Caching完了をMENUへ通知 */
      const updatedClients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
      });

      for (const client of updatedClients) {
        client.postMessage({
          type: 'CACHE_UPDATED',
          cacheName: CACHE_NAME
        });
      }

    })());

  }

});

/* ---------------------------------------------------------
   fetch
   ・mp3 はキャッシュ優先
   ・index.html は常にネットワーク優先
   ・それ以外はキャッシュ優先 → ネットワーク
--------------------------------------------------------- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // index.html は常に最新を取得
  if (
    url.pathname.endsWith('index.html') ||
    url.pathname === '/fukiya-timer-pwa/'
  ) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // mp3 はキャッシュ優先（Range 対応）
  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(url.pathname).then(
          res => res || fetch(event.request)
        )
      )
    );
    return;
  }

  // それ以外はキャッシュ優先 → ネットワーク
  event.respondWith(
    caches.match(event.request).then(
      res => res || fetch(event.request)
    )
  );
});
