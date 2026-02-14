/**
 * UI Renderer — All DOM manipulation and HTML rendering logic.
 */
import { checkKiwiEligibility } from './kiwi-checker.js';

/* ── DOM element cache ───────────────────────────────────── */
const DOM = {
  results:          document.getElementById('results'),
  emptyState:       document.getElementById('emptyState'),
  landingState:     document.getElementById('landingState'),
  typeBadge:        document.getElementById('typeBadge'),
  merchantInfoCards:document.getElementById('merchantInfoCards'),
  kiwiRewardsCard:  document.getElementById('kiwiRewardsCard'),
  fullUpiUrl:       document.getElementById('fullUpiUrl'),
  paramsTableBody:  document.getElementById('paramsTableBody'),
  urlBody:          document.getElementById('urlBody'),
  urlToggle:        document.getElementById('urlToggle'),
  paramsBody:       document.getElementById('paramsBody'),
  paramsToggle:     document.getElementById('paramsToggle'),
  scannerSection:   document.getElementById('scannerSection')
};

/* ── Helpers ─────────────────────────────────────────────── */

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Render functions ────────────────────────────────────── */

function renderTypeBadge(isMerchant) {
  if (isMerchant) {
    DOM.typeBadge.innerHTML =
      '<div class="type-badge type-badge--merchant">' +
        '<div class="type-badge__icon">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
        '</div>' +
        '<div class="type-badge__text">' +
          '<span class="type-badge__label">UPI Type</span>' +
          'Merchant QR Code' +
        '</div>' +
      '</div>';
  } else {
    DOM.typeBadge.innerHTML =
      '<div class="type-badge type-badge--personal">' +
        '<div class="type-badge__icon">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '</div>' +
        '<div class="type-badge__text">' +
          '<span class="type-badge__label">UPI Type</span>' +
          'Personal / P2P QR Code' +
        '</div>' +
      '</div>';
  }
}

function renderMerchantInfo(data) {
  var html = '';

  if (data.isMerchant) {
    html += '<div class="info-card">' +
      '<div class="info-card__label">Merchant Name</div>' +
      '<div class="info-card__value">' + escapeHtml(data.payeeName || 'Unknown Merchant') + '</div>' +
    '</div>';

    html += '<div class="info-grid">' +
      '<div class="info-card">' +
        '<div class="info-card__label">MCC Code</div>' +
        '<div class="info-card__value info-card__value--large">' + escapeHtml(data.merchantCode) + '</div>' +
      '</div>' +
      '<div class="info-card">' +
        '<div class="info-card__label">Merchant Type</div>' +
        '<div class="info-card__value">' + escapeHtml(data.merchantCategory) + '</div>' +
      '</div>' +
    '</div>';
  } else {
    html += '<div class="info-card">' +
      '<div class="info-card__label">Payee Name</div>' +
      '<div class="info-card__value">' + escapeHtml(data.payeeName || 'Not specified') + '</div>' +
    '</div>';
  }

  if (data.payeeAddress) {
    html += '<div class="info-card">' +
      '<div class="info-card__label">UPI ID (VPA)</div>' +
      '<div class="info-card__value info-card__value--mono">' + escapeHtml(data.payeeAddress) + '</div>' +
    '</div>';
  }

  if (data.amount) {
    html += '<div class="info-card">' +
      '<div class="info-card__label">Amount</div>' +
      '<div class="info-card__value">' + escapeHtml(data.currency) + ' ' + escapeHtml(data.amount) + '</div>' +
    '</div>';
  }

  if (data.transactionNote) {
    html += '<div class="info-card">' +
      '<div class="info-card__label">Transaction Note</div>' +
      '<div class="info-card__value info-card__value--muted">' + escapeHtml(data.transactionNote) + '</div>' +
    '</div>';
  }

  DOM.merchantInfoCards.innerHTML = html;
}

function renderKiwiRewards(mcc) {
  var result = checkKiwiEligibility(mcc);
  var html = '';

  if (result.eligible === true) {
    html =
      '<div class="kiwi-card kiwi-card--eligible">' +
        '<div class="kiwi-card__header">' +
          '<div class="kiwi-card__icon">&#10003;</div>' +
          '<div>' +
            '<div class="kiwi-card__subtitle">Kiwi Rewards</div>' +
            '<div class="kiwi-card__title">Eligible for Rewards</div>' +
          '</div>' +
        '</div>' +
        '<div class="kiwi-card__body">' +
          result.reason + '<br/><br/>' +
          '<strong>Scan &amp; Pay:</strong> Up to 1.5% cashback (6 Kiwis per Rs.100)<br/>' +
          '<strong>Online:</strong> 0.5% cashback (2 Kiwis per Rs.100)<br/>' +
          '<strong>Note:</strong> Kiwis earned on multiples of Rs.100 only. Monthly cap: 1% of credit limit.' +
        '</div>' +
      '</div>';
  } else if (result.eligible === false) {
    html =
      '<div class="kiwi-card kiwi-card--excluded">' +
        '<div class="kiwi-card__header">' +
          '<div class="kiwi-card__icon">&#10007;</div>' +
          '<div>' +
            '<div class="kiwi-card__subtitle">Kiwi Rewards</div>' +
            '<div class="kiwi-card__title">Not Eligible</div>' +
          '</div>' +
        '</div>' +
        '<div class="kiwi-card__body">' +
          result.reason +
          '<div class="kiwi-excluded-category">' +
            '<span>Excluded Category: ' + escapeHtml(result.excludedCategory) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  } else {
    html =
      '<div class="kiwi-card kiwi-card--na">' +
        '<div class="kiwi-card__header">' +
          '<div class="kiwi-card__icon">?</div>' +
          '<div>' +
            '<div class="kiwi-card__subtitle">Kiwi Rewards</div>' +
            '<div class="kiwi-card__title">Cannot Determine</div>' +
          '</div>' +
        '</div>' +
        '<div class="kiwi-card__body">' +
          result.reason + '<br/><br/>' +
          'P2P transactions may still earn surprise rewards via Kiwi app (up to 20 per month).' +
        '</div>' +
      '</div>';
  }

  DOM.kiwiRewardsCard.innerHTML = html;
}

function renderUpiUrl(raw) {
  DOM.fullUpiUrl.textContent = raw;
}

function renderParams(params) {
  var html = '';
  var keys = Object.keys(params).sort();
  for (var i = 0; i < keys.length; i++) {
    html += '<tr><td>' + escapeHtml(keys[i]) + '</td><td>' + escapeHtml(params[keys[i]]) + '</td></tr>';
  }
  DOM.paramsTableBody.innerHTML = html;
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Display the full scan results and hide the scanner.
 * @param {object} data  Parsed UPI data from upi-parser.js
 */
export function showResults(data) {
  DOM.landingState.style.display = 'none';
  DOM.emptyState.style.display = 'none';
  DOM.results.classList.add('visible');
  DOM.scannerSection.style.display = 'none';

  // Collapse expanded sections on new scan
  DOM.urlBody.classList.remove('expanded');
  DOM.urlToggle.innerHTML = 'Show &#9662;';
  DOM.paramsBody.classList.remove('expanded');
  DOM.paramsToggle.innerHTML = 'Show &#9662;';

  renderTypeBadge(data.isMerchant);
  renderMerchantInfo(data);
  renderKiwiRewards(data.merchantCode);
  renderUpiUrl(data.raw);
  renderParams(data.params);
}

/**
 * Reset the UI back to scanner mode.
 * Called when user taps "Start Scanning" or "Scan Another".
 */
export function showScanner() {
  DOM.landingState.style.display = 'none';
  DOM.scannerSection.style.display = 'block';
  DOM.results.classList.remove('visible');
  DOM.emptyState.style.display = 'block';
}

/**
 * Display a camera error message in the empty-state area.
 */
export function showCameraError() {
  DOM.emptyState.innerHTML =
    '<div class="empty-state__icon" style="color:var(--accent-rose);">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
    '</div>' +
    '<p class="empty-state__text" style="color:var(--accent-rose);">Camera access denied or not available.<br/>Please allow camera permissions.</p>';
}

/* ── Toggle handlers (exposed to global for inline onclick) ── */

window.toggleUrlExpand = function () {
  var body = DOM.urlBody;
  var toggle = DOM.urlToggle;
  if (body.classList.contains('expanded')) {
    body.classList.remove('expanded');
    toggle.innerHTML = 'Show &#9662;';
  } else {
    body.classList.add('expanded');
    toggle.innerHTML = 'Hide &#9652;';
  }
};

window.toggleParamsExpand = function () {
  var body = DOM.paramsBody;
  var toggle = DOM.paramsToggle;
  if (body.classList.contains('expanded')) {
    body.classList.remove('expanded');
    toggle.innerHTML = 'Show &#9662;';
  } else {
    body.classList.add('expanded');
    toggle.innerHTML = 'Hide &#9652;';
  }
};
