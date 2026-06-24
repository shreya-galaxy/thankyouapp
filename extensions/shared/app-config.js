// Application URL used by extensions to call the app API.
// Prefer build-time values so Shopify CLI preview/deploy can point extensions
// at the currently running app instead of a stale tunnel.
const IMPORT_META_ENV =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : {};

const PROCESS_ENV =
  typeof process !== 'undefined' && process.env ? process.env : {};

const BUILD_APP_URL =
  IMPORT_META_ENV.THANKYOU_APP_URL ||
  IMPORT_META_ENV.PUBLIC_APP_URL ||
  IMPORT_META_ENV.SHOPIFY_APP_URL ||
  IMPORT_META_ENV.HOST ||
  PROCESS_ENV.THANKYOU_APP_URL ||
  PROCESS_ENV.PUBLIC_APP_URL ||
  PROCESS_ENV.SHOPIFY_APP_URL ||
  PROCESS_ENV.HOST ||
  '';

const FALLBACK_APP_URLS = [
  'https://thankyouapp-production.up.railway.app',
  'https://sat-energy-independently-intervals.trycloudflare.com',
];

const DEFAULT_APP_URL = BUILD_APP_URL || FALLBACK_APP_URLS[0];

function uniqueUrls(urls) {
  return urls
    .filter(Boolean)
    .map((url) => String(url).trim().replace(/\/$/, ''))
    .filter(Boolean)
    .filter((url, index, all) => all.indexOf(url) === index);
}

function runtimeAppUrl() {
  try {
    // Extensions run in browser contexts; prefer explicit globals if present.
    if (typeof window !== 'undefined') {
      if (window.THANKYOU_APP_URL) return window.THANKYOU_APP_URL;
      if (window.PUBLIC_APP_URL) return window.PUBLIC_APP_URL;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_APP_URL;
}

export const APP_URL = runtimeAppUrl();
export const APP_URLS = uniqueUrls([
  APP_URL,
  BUILD_APP_URL,
  ...FALLBACK_APP_URLS,
]);

export function apiUrl(path) {
  return `${APP_URL.replace(/\/$/, '')}${path}`;
}

export function apiUrls(path) {
  return APP_URLS.map((url) => `${url}${path}`);
}
