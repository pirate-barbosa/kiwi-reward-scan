/**
 * Scanner — Manages the html5-qrcode camera lifecycle and gallery scanning.
 *
 * iOS WebKit (Safari, DuckDuckGo, Chrome on iPhone) requires getUserMedia
 * to be called from a user-gesture handler (tap/click). We therefore expose
 * `startScanner` to be called from a button click, never automatically.
 */
import { parseUPI } from './upi-parser.js';
import { showResults, showScanner, showCameraError, showLanding } from './ui-renderer.js';

let html5QrCode = null;
let isScanning = false;

/* ── Shared decode handler ───────────────────────────────── */

/**
 * Process decoded QR text — shared between camera and gallery scanning.
 * Includes haptic feedback for a satisfying physical confirmation.
 * @param {string} decodedText  Raw text from the QR code
 */
function processDecodedText(decodedText) {
  // Haptic feedback: double-pulse pattern
  if (navigator.vibrate) {
    navigator.vibrate([60, 40, 90]);
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

/* ── Camera scanning ─────────────────────────────────────── */

/**
 * Called by html5-qrcode when a QR code is successfully decoded from camera.
 * @param {string} decodedText  Raw text from the QR code
 */
function onScanSuccess(decodedText) {
  if (!isScanning) return;
  isScanning = false;

  // Stop camera
  if (html5QrCode) {
    html5QrCode.stop()
      .then(function () { html5QrCode.clear(); })
      .catch(function () { /* swallow */ });
  }

  processDecodedText(decodedText);
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

  html5QrCode = new Html5Qrcode('reader', {
    // Only scan QR codes — skip all other barcode formats for much faster decoding
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    // Use the native BarcodeDetector API when available (Chrome/Edge on Android)
    // for hardware-accelerated scanning
    useBarCodeDetectorIfSupported: true
  });

  // Use relaxed constraints for maximum iOS compatibility:
  // - No aspectRatio (let the device pick its native ratio)
  // - facingMode as a preference, not a hard requirement
  html5QrCode.start(
    { facingMode: 'environment' },
    {
      fps: 15,
      qrbox: function (viewfinderWidth, viewfinderHeight) {
        var size = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
        return { width: Math.floor(size), height: Math.floor(size) };
      },
      // UPI QR codes are physical prints/stickers — no need to scan mirror images.
      // Skipping flipped scanning halves the decode work per frame.
      disableFlip: true
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

/* ── Gallery / image scanning ────────────────────────────── */

/**
 * Scan a QR code from an uploaded image file.
 * Uses html5-qrcode's scanFile API — no camera needed.
 * @param {HTMLInputElement} inputEl  The file input element
 */
function scanFromGalleryFile(inputEl) {
  var file = inputEl.files && inputEl.files[0];
  if (!file) return;

  // Grab reference before resetting input (so same file can be re-selected)
  var fileRef = file;
  inputEl.value = '';

  var galleryScanner = new Html5Qrcode('readerGallery', {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    useBarCodeDetectorIfSupported: true
  });
  galleryScanner.scanFile(fileRef, false)
    .then(function (decodedText) {
      galleryScanner.clear();
      processDecodedText(decodedText);
    })
    .catch(function () {
      galleryScanner.clear();
      showGalleryError();
    });
}

/**
 * Show a brief error toast when gallery scan fails.
 */
function showGalleryError() {
  var el = document.getElementById('galleryError');
  if (el) {
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 4000);
  }
}

/* ── Expose globally for onclick handlers in HTML ────────── */

window.startScanner = function () {
  startScanner();
};

window.resetScanner = function () {
  // Stop any running camera first
  if (html5QrCode && isScanning) {
    isScanning = false;
    html5QrCode.stop()
      .then(function () { html5QrCode.clear(); })
      .catch(function () { /* swallow */ });
  }
  showLanding();
};

window.scanFromGallery = function (inputEl) {
  scanFromGalleryFile(inputEl);
};
