/**
 * App Entry Point — Boots the UPI QR Decoder application.
 */
import { startScanner } from './modules/scanner.js';

// ── Bootstrap ───────────────────────────────────────────────
startScanner();

// ── PWA Service Worker (minimal, for Add to Home Screen) ────
if ('serviceWorker' in navigator) {
  var sw =
    "self.addEventListener('install', function(e) { self.skipWaiting(); });" +
    "self.addEventListener('fetch', function(e) {});";
  var blob = new Blob([sw], { type: 'text/javascript' });
  navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(function () {});
}
