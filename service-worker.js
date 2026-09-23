/* =========================================================
   Fukiya Timer PWA
   service-worker.js（最新 index.html 強制取得対応）
   配置場所：
   /fukiya-timer-pwa/service-worker.js
   ========================================================= */

const CACHE_NAME = 'fukiya-timer-pwa-20260923-10';

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
     ※ すべて「/fukiya-timer-pwa/」からの絶対パス */

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


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener('install', event => {
  event.waitUntil((async () => {

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


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener('activate', event => {
  event.waitUntil((async () => {

    // keep old caches; delete only after RECACHE

  })());

  self.clients.claim();
});


/* =========================================================
   MESSAGE
   ========================================================= */

self.addEventListener('message', event => {

  /* ---------------------------------------------------------
     GET_CACHE_STATUS
     --------------------------------------------------------- */

  if (event.data.type === 'GET_CACHE_STATUS') {

    if (event.source) {
      event.source.postMessage({
        type: 'CACHE_STATUS',
        cacheName: CACHE_NAME
      });
    }

    return;
  }


  /* ---------------------------------------------------------
     RECACHE
     --------------------------------------------------------- */

  if (event.data.type === 'RECACHE') {

    event.waitUntil((async () => {

      const clientsList = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
      });


      /* -------------------------------------------------------
         CACHE_START
         ------------------------------------------------------- */

      for (const client of clientsList) {
        client.postMessage({
          type: 'CACHE_START',
          cacheName: CACHE_NAME
        });
      }


     /* -------------------------------------------------------
        新しいキャッシュを取得
        ------------------------------------------------------- */
     /*
      * 既存キャッシュを一度削除してから、
      * PRECACHE_URLS の現在存在するファイルだけを
      * 新しく取得する。
      *
      * これにより、GitHubから削除されたファイルが
      * 古いキャッシュとして残り続けることを防ぐ。
      */
      await caches.delete(CACHE_NAME);
      const cache = await caches.open(CACHE_NAME);

      for (const url of PRECACHE_URLS) {

        try {

          /*
           * 毎回異なるURLを使用して、
           * HTTP/CDN等に残っている同一URLのキャッシュを
           * 使用しないようにする。
           */
          const fetchUrl = `${url}?recache=${Date.now()}`;

          const response = await fetch(fetchUrl, {
            cache: 'no-store'
          });


          if (!response.ok) {
            throw new Error(`HTTP ${response.status} : ${url}`);
          }


          /*
           * CacheStorageには元のURLで保存する。
           */
          await cache.put(url, response);


          console.log("OK :", url);

        } catch (e) {

          console.error("NG :", url);
          console.error(e);

        }

      }


      /* -------------------------------------------------------
         古いPWAキャッシュを削除
         ------------------------------------------------------- */

      const keys = await caches.keys();

      await Promise.all(
        keys.filter(k =>
          k.startsWith('fukiya-timer-pwa-') &&
          k !== CACHE_NAME
        ).map(k => caches.delete(k))
      );


      /* -------------------------------------------------------
         CACHE_UPDATED
         ------------------------------------------------------- */

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


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener('fetch', event => {

  const url = new URL(event.request.url);


  /* ---------------------------------------------------------
     index.html
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     MP3
     --------------------------------------------------------- */

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


  /* ---------------------------------------------------------
     その他
     --------------------------------------------------------- */

  event.respondWith(
    caches.match(event.request).then(
      res => res || fetch(event.request)
    )
  );

});
