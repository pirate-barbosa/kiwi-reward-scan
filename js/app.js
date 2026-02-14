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
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js')
      .then(function (reg) {
        console.log('[SW] Registered, scope:', reg.scope);

        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'activated') {
              console.log('[SW] New version activated — refresh for updates.');
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('[SW] Registration failed:', err);
      });
  });
}
