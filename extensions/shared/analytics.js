/* global globalThis, process */

import {apiUrls} from './app-config';

export function trackThankYouClick(eventType, details = {}) {
  try {
    const extensionApi =
      typeof globalThis !== 'undefined' ? globalThis.shopify : shopify;
    const orderConfirmation = extensionApi.orderConfirmation.current;
    const payload = {
      eventType,
      shop: shopDomain(extensionApi.shop),
      orderId: signalValue(orderConfirmation?.order?.id),
      orderNumber: signalValue(orderConfirmation?.number),
      source: `thank_you_${eventType}`,
      ...details,
    };

    // Publish to Shopify analytics - silent fail
    extensionApi.analytics?.publish(
      `thankyou_app:${eventType}`,
      payload,
    )?.catch(() => {
      // Silent fail - analytics should never break UX
    });

    // Send to backend - silent fail
    sendAnalytics(payload);
  } catch (error) {
    // Silent fail - analytics should never break functionality
    // Only log in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.warn('Analytics tracking failed:', error);
    }
  }
}

async function sendAnalytics(payload) {
  for (const url of apiUrls('/api/analytics-click')) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) return;
    } catch (error) {
      // Try the next configured app URL.
    }
  }
}

function shopDomain(shop) {
  return firstNormalized([
    shop?.myshopifyDomain,
    shop?.domain,
    shop?.storefrontUrl,
    shop?.storefrontUrl?.current,
  ]);
}

function signalValue(value) {
  return value?.current || value;
}

function firstNormalized(values) {
  const value = values.map(signalValue).find(Boolean);

  if (!value) return '';

  const text = String(value).trim();

  try {
    return new URL(text).hostname.toLowerCase();
  } catch (error) {
    return text
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }
}
