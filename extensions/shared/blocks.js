/* global globalThis */
import {apiUrls} from './app-config';

export async function fetchActiveBlock(type) {
  const extensionApi =
    typeof globalThis !== 'undefined'
      ? /** @type {typeof globalThis & {shopify?: unknown}} */ (globalThis)
          .shopify
      : undefined;
  const shops = shopCandidates(extensionApi);

  if (!shops.length) {
    throw new Error('Shop domain is not available in the extension context');
  }

  const errors = [];

  for (const shop of shops) {
    const params = new URLSearchParams({type, shop});
    const urls = apiUrls(`/api/blocks?${params.toString()}`);

    for (const url of urls) {
      try {
        const response = await fetch(url);
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          errors.push(data?.message || `${response.status} from ${url}`);
          continue;
        }

        if (data.block) return data.block;
      } catch (error) {
        errors.push(error?.message || `Could not load ${url}`);
      }
    }
  }

  if (errors.length) {
    console.error(
      `Could not load ${type} app block`,
      errors.slice(0, 6),
    );
  }

  return null;
}

function shopCandidates(extensionApi) {
  const shop = extensionApi?.shop || {};
  const values = [
    shop.myshopifyDomain,
    shop.domain,
    shop.storefrontUrl,
    shop.storefrontUrl?.current,
  ];

  return values
    .map(normalizeShop)
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
}

function normalizeShop(value) {
  if (!value) return '';

  const text = String(value).trim();

  if (!text) return '';

  try {
    return new URL(text).hostname.toLowerCase();
  } catch (error) {
    return text
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }
}
