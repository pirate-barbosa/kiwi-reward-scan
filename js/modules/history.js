/**
 * Scan History — Persists scan records in localStorage.
 *
 * Each record stores the essential decoded fields plus a timestamp.
 * The list is capped to avoid unbounded growth.
 */

var STORAGE_KEY = 'upi_scan_history';
var MAX_RECORDS = 50;

/* ── Read / Write helpers ───────────────────────────────── */

function loadHistory() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) { /* storage full — silently skip */ }
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Add a scan record to history.
 * @param {object} data        Parsed UPI data from upi-parser.js
 * @param {object} eligibility Kiwi eligibility result from kiwi-checker.js
 */
export function addScanRecord(data, eligibility) {
  var record = {
    id: Date.now() + '-' + Math.random().toString(36).substring(2, 8),
    timestamp: new Date().toISOString(),
    payeeName: data.payeeName || null,
    payeeAddress: data.payeeAddress || null,
    merchantCode: data.merchantCode || null,
    merchantCategory: data.merchantCategory || null,
    amount: data.amount || null,
    currency: data.currency || 'INR',
    isMerchant: !!data.isMerchant,
    kiwiEligible: eligibility.eligible
  };

  var records = loadHistory();
  records.unshift(record);        // newest first
  if (records.length > MAX_RECORDS) {
    records = records.slice(0, MAX_RECORDS);
  }
  saveHistory(records);
  return records;
}

/**
 * Return all saved scan records (newest first).
 * @return {Array}
 */
export function getHistory() {
  return loadHistory();
}

/**
 * Delete all saved scan records.
 */
export function clearHistory() {
  saveHistory([]);
}
