/**
 * App Entry Point — Boots the UPI QR Decoder application.
 *
 * NOTE: We intentionally do NOT auto-start the camera here.
 * iOS WebKit browsers require getUserMedia to be called from
 * a user gesture (tap/click). The user taps "Start Scanning"
 * which triggers startScanner() from scanner.js.
 */

// Import scanner module so it registers the global handlers
// (window.startScanner, window.resetScanner)
import './modules/scanner.js';

// ── Register Service Worker (enables offline support) ───────

/**
 * Ask the active service worker for its CACHE_VERSION via MessageChannel.
 * Updates the footer element so the running version is always visible.
 */
function displaySwVersion() {
  var controller = navigator.serviceWorker.controller;
  if (!controller) return;

  var channel = new MessageChannel();
  channel.port1.onmessage = function (event) {
    if (event.data && event.data.version) {
      var el = document.getElementById('appVersion');
      if (el) el.textContent = 'SW: ' + event.data.version;
    }
  };
  controller.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js')
      .then(function (reg) {
        console.log('[SW] Registered, scope:', reg.scope);

        // Display version if SW is already controlling the page
        displaySwVersion();

        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'activated') {
              console.log('[SW] New version activated — refresh for updates.');
              // Re-query version after the new SW takes over
              displaySwVersion();
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('[SW] Registration failed:', err);
      });

    // Also refresh version when a new SW claims the page
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      displaySwVersion();
    });
  });
}
