/**
 * Service Worker — Cache-first strategy for full offline support.
 *
 * Bump CACHE_VERSION when you deploy new code so the old cache is replaced.
 */

const CACHE_VERSION = 'upi-decoder-v8';

/**
 * All local assets that make up the app shell.
 * These are pre-cached on install so the app works fully offline.
 */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/constants/mcc-database.js',
  './js/constants/kiwi-excluded.js',
  './js/modules/upi-parser.js',
  './js/modules/kiwi-checker.js',
  './js/modules/ui-renderer.js',
  './js/modules/scanner.js',
  './js/modules/history.js',
  './vendor/html5-qrcode.min.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

/* ── Install: pre-cache the app shell ────────────────────── */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      // Activate immediately, don't wait for old tabs to close
      return self.skipWaiting();
    })
  );
});

/* ── Activate: clean up old caches ───────────────────────── */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_VERSION; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      // Take control of all open tabs immediately
      return self.clients.claim();
    })
  );
});

/* ── Message: respond with cache version for UI display ──── */
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

/* ── Fetch: cache-first, falling back to network ─────────── */
self.addEventListener('fetch', function (event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not in cache — try network, then cache the response for next time
      return fetch(event.request).then(function (networkResponse) {
        // Only cache successful same-origin or CORS responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function () {
        // Both cache and network failed — return a simple offline fallback
        // (only relevant for navigation requests to unknown pages)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
