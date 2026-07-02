/* global globalThis, process */

// Application URL used by extensions to call the app API.
// Prefer build-time values so Shopify CLI preview/deploy can point extensions
// at the currently running app instead of a stale tunnel.
const PROCESS_ENV =
  typeof process !== 'undefined' && process.env ? process.env : {};

const GLOBAL_ENV =
  typeof globalThis !== 'undefined'
    ? {
        THANKYOU_APP_URL: globalThis.THANKYOU_APP_URL,
        PUBLIC_APP_URL: globalThis.PUBLIC_APP_URL,
        SHOPIFY_APP_URL: globalThis.SHOPIFY_APP_URL,
        HOST: globalThis.HOST,
      }
    : {};

const SHOPIFY_ENV =
  typeof globalThis !== 'undefined' && globalThis.shopify
    ? {
        APP_URL: globalThis.shopify.appUrl,
        EXTENSION_APP_URL: globalThis.shopify.extension?.appUrl,
        CONFIG_APP_URL: globalThis.shopify.config?.appUrl,
      }
    : {};

const BUILD_APP_URL =
  GLOBAL_ENV.THANKYOU_APP_URL ||
  GLOBAL_ENV.PUBLIC_APP_URL ||
  GLOBAL_ENV.SHOPIFY_APP_URL ||
  GLOBAL_ENV.HOST ||
  SHOPIFY_ENV.APP_URL ||
  SHOPIFY_ENV.EXTENSION_APP_URL ||
  SHOPIFY_ENV.CONFIG_APP_URL ||
  PROCESS_ENV.THANKYOU_APP_URL ||
  PROCESS_ENV.PUBLIC_APP_URL ||
  PROCESS_ENV.SHOPIFY_APP_URL ||
  PROCESS_ENV.HOST ||
  '';

const FALLBACK_APP_URLS = [
  'https://thankyouapp-production-a309.up.railway.app',
  'https://thankyouapp-production-a309.up.railway.app',
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
