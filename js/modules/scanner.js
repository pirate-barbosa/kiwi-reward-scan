/**
 * Scanner — Manages the html5-qrcode camera lifecycle.
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
 * Start (or restart) the QR scanner camera.
 */
export function startScanner() {
  showScanner();
  isScanning = true;

  html5QrCode = new Html5Qrcode('reader');
  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
    onScanSuccess,
    function () { /* ignore scan errors */ }
  ).catch(function (err) {
    console.error('Camera error:', err);
    showCameraError();
  });
}

// Expose reset globally so the onclick in HTML can call it
window.resetScanner = function () {
  startScanner();
};
