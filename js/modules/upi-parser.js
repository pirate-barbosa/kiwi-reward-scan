/**
 * UPI Parser — Decodes a UPI deep-link URI into structured data.
 */
import { MCC_DATABASE } from '../constants/mcc-database.js';

/**
 * Parse a UPI URI string and return structured payment data.
 *
 * @param  {string} uri  The raw scanned text (expected to start with "upi://")
 * @return {object|null} Parsed UPI data, or null if not a valid UPI URI
 */
export function parseUPI(uri) {
  if (!uri || !uri.toLowerCase().startsWith('upi://')) return null;

  const questionMark = uri.indexOf('?');
  if (questionMark === -1) {
    return { raw: uri, params: {}, isMerchant: false };
  }

  const queryString = uri.substring(questionMark + 1);
  const params = {};
  const searchParams = new URLSearchParams(queryString);

  searchParams.forEach(function (value, key) {
    params[key.toLowerCase()] = decodeURIComponent(value);
  });

  const mcc = params.mc || null;
  const isMerchant = !!mcc;

  return {
    raw: uri,
    params: params,
    payeeAddress: params.pa || null,
    payeeName: params.pn || null,
    merchantCode: mcc,
    merchantCategory: mcc ? (MCC_DATABASE[mcc] || 'Unknown Category') : null,
    amount: params.am || null,
    currency: params.cu || 'INR',
    transactionNote: params.tn || null,
    transactionId: params.tid || null,
    transactionRef: params.tr || null,
    isMerchant: isMerchant
  };
}
