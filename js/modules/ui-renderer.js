/**
 * UI Renderer — All DOM manipulation and HTML rendering logic.
 */
import { checkKiwiEligibility } from './kiwi-checker.js';
import { addScanRecord, getHistory, clearHistory } from './history.js';

/* ── DOM element cache ───────────────────────────────────── */
const DOM = {
  results:            document.getElementById('results'),
  emptyState:         document.getElementById('emptyState'),
  landingState:       document.getElementById('landingState'),
  typeBadge:          document.getElementById('typeBadge'),
  merchantInfoCards:  document.getElementById('merchantInfoCards'),
  kiwiRewardsCard:    document.getElementById('kiwiRewardsCard'),
  fullUpiUrl:         document.getElementById('fullUpiUrl'),
  paramsTableBody:    document.getElementById('paramsTableBody'),
  urlBody:            document.getElementById('urlBody'),
  urlToggle:          document.getElementById('urlToggle'),
  paramsBody:         document.getElementById('paramsBody'),
  paramsToggle:       document.getElementById('paramsToggle'),
  scannerSection:     document.getElementById('scannerSection'),
  cashbackCalculator: document.getElementById('cashbackCalculator'),
  cashbackContent:    document.getElementById('cashbackContent'),
  payActions:         document.getElementById('payActions'),
  payActionsContent:  document.getElementById('payActionsContent'),
  historySection:     document.getElementById('historySection'),
  historyList:        document.getElementById('historyList')
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

/* ── Render: Type Badge ──────────────────────────────────── */

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

/* ── Render: Merchant / Payee Info ───────────────────────── */

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

/* ── Render: Kiwi Rewards Eligibility ────────────────────── */

function renderKiwiRewards(eligibility) {
  var html = '';

  if (eligibility.eligible === true) {
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
          eligibility.reason + '<br/><br/>' +
          '<strong>Scan &amp; Pay:</strong> Up to 1.5% cashback (6 Kiwis per Rs.100)<br/>' +
          '<strong>Online:</strong> 0.5% cashback (2 Kiwis per Rs.100)<br/>' +
          '<strong>Note:</strong> Kiwis earned on multiples of Rs.100 only. Monthly cap: 1% of credit limit.' +
        '</div>' +
      '</div>';
  } else if (eligibility.eligible === false) {
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
          eligibility.reason +
          '<div class="kiwi-excluded-category">' +
            '<span>Excluded Category: ' + escapeHtml(eligibility.excludedCategory) + '</span>' +
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
          eligibility.reason + '<br/><br/>' +
          'P2P transactions may still earn surprise rewards via Kiwi app (up to 20 per month).' +
        '</div>' +
      '</div>';
  }

  DOM.kiwiRewardsCard.innerHTML = html;
}

/* ── Render: Cashback Calculator ─────────────────────────── */

function renderCashbackCalculator(eligible, amount) {
  if (eligible !== true) {
    DOM.cashbackCalculator.style.display = 'none';
    return;
  }

  DOM.cashbackCalculator.style.display = 'block';
  var prefill = amount ? parseFloat(amount) : '';

  DOM.cashbackContent.innerHTML =
    '<div class="calc-card">' +
      '<div class="calc-input-row">' +
        '<span class="calc-currency">\u20B9</span>' +
        '<input type="number" id="calcAmount" class="calc-input" placeholder="Enter payment amount" inputmode="decimal" value="' + prefill + '" oninput="updateCalc()" />' +
      '</div>' +
      '<div id="calcResults" class="calc-results">' +
        (prefill ? '' : '<p class="calc-hint">Enter an amount to see your Kiwi rewards</p>') +
      '</div>' +
    '</div>';

  if (prefill) {
    updateCalculation(prefill);
  }
}

function updateCalculation(amount) {
  var resultsEl = document.getElementById('calcResults');
  if (!resultsEl) return;

  if (!amount || amount <= 0) {
    resultsEl.innerHTML = '<p class="calc-hint">Enter an amount to see your Kiwi rewards</p>';
    return;
  }

  var eligibleAmount = Math.floor(amount / 100) * 100;
  var scanPayKiwis = Math.floor(amount / 100) * 6;
  var scanPayCashback = (scanPayKiwis * 0.25).toFixed(2);
  var onlineKiwis = Math.floor(amount / 100) * 2;
  var onlineCashback = (onlineKiwis * 0.25).toFixed(2);

  var noteHtml = '';
  if (eligibleAmount < amount) {
    noteHtml = '<p class="calc-note">Calculated on \u20B9' + eligibleAmount + ' (nearest multiple of \u20B9100)</p>';
  }

  resultsEl.innerHTML =
    '<div class="calc-grid">' +
      '<div class="calc-result-card calc-result-card--primary">' +
        '<div class="calc-result-label">Scan &amp; Pay</div>' +
        '<div class="calc-result-kiwis">' + scanPayKiwis + ' Kiwis</div>' +
        '<div class="calc-result-cashback">\u20B9' + scanPayCashback + ' cashback</div>' +
      '</div>' +
      '<div class="calc-result-card">' +
        '<div class="calc-result-label">Online</div>' +
        '<div class="calc-result-kiwis">' + onlineKiwis + ' Kiwis</div>' +
        '<div class="calc-result-cashback">\u20B9' + onlineCashback + ' cashback</div>' +
      '</div>' +
    '</div>' +
    noteHtml;
}

window.updateCalc = function () {
  var input = document.getElementById('calcAmount');
  if (input) {
    updateCalculation(parseFloat(input.value));
  }
};

/* ── Render: Quick Pay Actions ───────────────────────────── */

/**
 * List of UPI apps with their plain URL schemes (no payment params).
 *
 * Opening apps cleanly — without a payment intent — avoids fraud-detection
 * warnings that many UPI apps show for intents originating from web pages.
 * The user scans the physical QR code directly inside the opened app.
 */
function getUpiApps() {
  return [
    { name: 'Kiwi',     scheme: 'kiwi://',     color: '#34d399', id: 'kiwi' },
    { name: 'GPay',     scheme: 'tez://',      color: '#4285F4', id: 'gpay' },
    { name: 'PhonePe',  scheme: 'phonepe://',  color: '#5F259F', id: 'phonepe' },
    { name: 'Paytm',    scheme: 'paytm://',    color: '#00BAF2', id: 'paytm' },
    { name: 'CRED',     scheme: 'cred://',     color: '#D4D4D4', id: 'cred' },
    { name: 'BHIM',     scheme: 'bhim://',     color: '#00897B', id: 'bhim' }
  ];
}

function renderPayActions(data, eligible) {
  // Only show pay actions for valid UPI URIs
  if (!data || !data.raw || !data.raw.toLowerCase().startsWith('upi://')) {
    DOM.payActions.style.display = 'none';
    return;
  }

  DOM.payActions.style.display = 'block';
  var apps = getUpiApps();
  var vpa = data.payeeAddress || '';
  var copyBtnHtml = vpa
    ? '<button class="copy-vpa-btn" onclick="copyVpa(\'' + escapeHtml(vpa.replace(/'/g, "\\'")) + '\')">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
        'Copy UPI ID <span class="copy-vpa-btn__vpa">' + escapeHtml(vpa) + '</span>' +
      '</button>'
    : '';
  var html = '';

  if (eligible === true) {
    // Kiwi-eligible — show Kiwi prominently, then other apps
    html =
      '<a href="kiwi://" class="pay-btn pay-btn--kiwi">' +
        '<div class="pay-btn__left">' +
          '<div class="pay-btn__icon pay-btn__icon--kiwi">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' +
          '</div>' +
          '<div>' +
            '<div class="pay-btn__title">Open Kiwi</div>' +
            '<div class="pay-btn__subtitle">Scan QR in Kiwi for 1.5% cashback</div>' +
          '</div>' +
        '</div>' +
        '<svg class="pay-btn__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</a>' +
      copyBtnHtml +
      '<p class="pay-hint">Or open another app &amp; scan QR there</p>' +
      renderAppGrid(apps, 'kiwi');
  } else {
    // Not eligible or P2P — show all apps in a grid
    html =
      '<p class="pay-section-intro">Open an app &amp; scan the QR code there</p>' +
      renderAppGrid(apps, null) +
      copyBtnHtml;
  }

  DOM.payActionsContent.innerHTML = html;
}

function renderAppGrid(apps, excludeId) {
  var html = '<div class="pay-apps-grid">';
  for (var i = 0; i < apps.length; i++) {
    if (excludeId && apps[i].id === excludeId) continue;
    html +=
      '<a href="' + escapeHtml(apps[i].scheme) + '" class="pay-app-btn" style="--app-color:' + apps[i].color + ';">' +
        '<div class="pay-app-btn__icon" style="background: color-mix(in srgb, ' + apps[i].color + ' 15%, transparent);">' +
          '<span style="color:' + apps[i].color + '; font-weight:800; font-size:16px;">' + apps[i].name.charAt(0) + '</span>' +
        '</div>' +
        '<span class="pay-app-btn__name">' + apps[i].name + '</span>' +
      '</a>';
  }
  html += '</div>';
  return html;
}

/* ── Render: Raw UPI URL & Params ────────────────────────── */

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

/* ── Render: Scan History ─────────────────────────────────── */

function formatRelativeTime(isoString) {
  var now = Date.now();
  var then = new Date(isoString).getTime();
  var diff = Math.floor((now - then) / 1000);

  if (diff < 60)   return 'Just now';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';

  // Older than a week — show date
  var d = new Date(isoString);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()];
}

function renderHistory() {
  var records = getHistory();

  if (!records || records.length === 0) {
    DOM.historySection.style.display = 'none';
    return;
  }

  DOM.historySection.style.display = 'block';

  var html =
    '<div class="history-header">' +
      '<span class="section-title" style="margin-bottom:0;">Scan History</span>' +
      '<button class="history-clear-btn" onclick="clearScanHistory()">Clear</button>' +
    '</div>';

  html += '<div class="history-items">';

  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var name = escapeHtml(r.payeeName || r.payeeAddress || 'Unknown');
    var time = formatRelativeTime(r.timestamp);
    var amountHtml = r.amount
      ? '<span class="history-item__amount">' + escapeHtml(r.currency || 'INR') + ' ' + escapeHtml(r.amount) + '</span>'
      : '<span class="history-item__amount history-item__amount--empty">No amount</span>';

    var kiwiDot = '';
    if (r.kiwiEligible === true) {
      kiwiDot = '<span class="history-item__kiwi history-item__kiwi--yes" title="Kiwi eligible">&#10003;</span>';
    } else if (r.kiwiEligible === false) {
      kiwiDot = '<span class="history-item__kiwi history-item__kiwi--no" title="Not eligible">&#10007;</span>';
    } else {
      kiwiDot = '<span class="history-item__kiwi history-item__kiwi--na" title="Unknown">?</span>';
    }

    var typeLabel = r.isMerchant ? 'Merchant' : 'P2P';

    html +=
      '<div class="history-item">' +
        '<div class="history-item__left">' +
          kiwiDot +
          '<div class="history-item__info">' +
            '<div class="history-item__name">' + name + '</div>' +
            '<div class="history-item__meta">' +
              '<span class="history-item__type">' + typeLabel + '</span>' +
              (r.merchantCategory ? ' &middot; ' + escapeHtml(r.merchantCategory) : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="history-item__right">' +
          amountHtml +
          '<span class="history-item__time">' + time + '</span>' +
        '</div>' +
      '</div>';
  }

  html += '</div>';
  DOM.historyList.innerHTML = html;
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
  DOM.historySection.style.display = 'none';

  // Collapse expanded sections on new scan
  DOM.urlBody.classList.remove('expanded');
  DOM.urlToggle.innerHTML = 'Show &#9662;';
  DOM.paramsBody.classList.remove('expanded');
  DOM.paramsToggle.innerHTML = 'Show &#9662;';

  // Compute eligibility once, pass to renderers
  var eligibility = checkKiwiEligibility(data.merchantCode);

  renderTypeBadge(data.isMerchant);
  renderMerchantInfo(data);
  renderKiwiRewards(eligibility);
  renderCashbackCalculator(eligibility.eligible, data.amount);
  renderPayActions(data, eligibility.eligible);
  renderUpiUrl(data.raw);
  renderParams(data.params);

  // Persist to scan history
  addScanRecord(data, eligibility);
}

/**
 * Reset the UI back to scanner mode.
 * Called when user taps "Start Scanning".
 */
export function showScanner() {
  DOM.landingState.style.display = 'none';
  DOM.scannerSection.style.display = 'block';
  DOM.historySection.style.display = 'none';
  DOM.results.classList.remove('visible');
  DOM.emptyState.style.display = 'block';
}

/**
 * Show the landing state (initial screen with Camera / Gallery options).
 * Called when user taps "Scan Another" from results.
 */
export function showLanding() {
  DOM.landingState.style.display = 'block';
  DOM.scannerSection.style.display = 'none';
  DOM.results.classList.remove('visible');
  DOM.emptyState.style.display = 'none';
  renderHistory();
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

/* ── History handler (exposed to global for inline onclick) ─── */

window.clearScanHistory = function () {
  clearHistory();
  renderHistory();
};

/* ── Copy VPA handler (exposed to global for inline onclick) ── */

window.copyVpa = function (vpa) {
  if (!vpa) return;

  // Use the Clipboard API (supported in iOS Safari 13.4+, all modern browsers)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(vpa).then(function () {
      showCopyToast(vpa);
    }).catch(function () {
      fallbackCopy(vpa);
    });
  } else {
    fallbackCopy(vpa);
  }
};

function fallbackCopy(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showCopyToast(text);
}

function showCopyToast(vpa) {
  // Remove any existing toast
  var existing = document.getElementById('copyToast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'copyToast';
  toast.className = 'copy-toast';
  toast.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
    'UPI ID copied!';
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(function () {
    toast.classList.add('copy-toast--visible');
  });

  // Auto-dismiss
  setTimeout(function () {
    toast.classList.remove('copy-toast--visible');
    setTimeout(function () { toast.remove(); }, 300);
  }, 2500);
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

/* ── Initial render: show history on first load ──────────── */
renderHistory();
