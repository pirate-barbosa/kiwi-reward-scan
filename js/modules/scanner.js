/**
 * Scanner — Manages the html5-qrcode camera lifecycle.
 *
 * iOS WebKit (Safari, DuckDuckGo, Chrome on iPhone) requires getUserMedia
 * to be called from a user-gesture handler (tap/click). We therefore expose
 * `startScanner` to be called from a button click, never automatically.
 */
import { parseUPI } from './upi-parser.js';
import { showResults, showScanner, showCameraError } from './ui-renderer.js';

let html5QrCode = null;
let isScanning = false;

/**
 * Called by html5-qrcode when a QR code is successfully decoded.
 * @param {string} decodedText  Raw text from the QR code
 */
function onScanSuccess(decodedText) {
  if (!isScanning) return;
  isScanning = false;

  // Haptic feedback (if supported)
  if (navigator.vibrate) navigator.vibrate(100);

  // Stop camera
  if (html5QrCode) {
    html5QrCode.stop()
      .then(function () { html5QrCode.clear(); })
      .catch(function () { /* swallow */ });
  }

  var data = parseUPI(decodedText);
  if (!data) {
    // Not a UPI QR — still show the raw text
    data = {
      raw: decodedText,
      params: {},
      payeeAddress: null,
      payeeName: null,
      merchantCode: null,
      merchantCategory: null,
      amount: null,
      currency: 'INR',
      transactionNote: null,
      isMerchant: false
    };
  }

  showResults(data);
}

/**
 * Patch the video element after html5-qrcode creates it.
 * iOS requires playsinline for inline video playback.
 */
function patchVideoElement() {
  var video = document.querySelector('#reader video');
  if (video) {
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', 'true');
  }
}

/**
 * Start the QR scanner camera.
 * MUST be called from a user-gesture (tap/click) for iOS compatibility.
 */
export function startScanner() {
  showScanner();
  isScanning = true;

  // Clean up any previous instance
  if (html5QrCode) {
    try { html5QrCode.clear(); } catch (e) { /* ignore */ }
  }

  html5QrCode = new Html5Qrcode('reader');

  // Use relaxed constraints for maximum iOS compatibility:
  // - No aspectRatio (let the device pick its native ratio)
  // - facingMode as a preference, not a hard requirement
  html5QrCode.start(
    { facingMode: 'environment' },
    {
      fps: 10,
      qrbox: function (viewfinderWidth, viewfinderHeight) {
        var size = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
        return { width: Math.floor(size), height: Math.floor(size) };
      }
    },
    onScanSuccess,
    function () { /* ignore per-frame scan misses */ }
  ).then(function () {
    // Once camera is running, patch the video element for iOS
    patchVideoElement();
  }).catch(function (err) {
    console.error('Camera error:', err);
    showCameraError();
  });
}

// Expose globally for onclick handlers in HTML
window.startScanner = function () {
  startScanner();
};

window.resetScanner = function () {
  startScanner();
};
