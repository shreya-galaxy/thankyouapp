import {apiUrl} from './app-config';

export function trackThankYouClick(eventType, details = {}) {
  const orderConfirmation =
    shopify.orderConfirmation.current;
  const payload = {
    eventType,
    shop: shopify.shop.myshopifyDomain,
    orderId: orderConfirmation?.order?.id,
    orderNumber: orderConfirmation?.number,
    source: `thank_you_${eventType}`,
    ...details,
  };

  shopify.analytics.publish(
    `thankyou_app:${eventType}`,
    payload,
  );

  fetch(apiUrl('/api/analytics-click'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => {
    console.error(
      `Failed to track ${eventType}`,
      error,
    );
  });
}
