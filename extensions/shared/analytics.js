import {apiUrl} from './app-config';

export function trackThankYouClick(eventType, details = {}) {
  try {
    const orderConfirmation = shopify.orderConfirmation.current;
    const payload = {
      eventType,
      shop: shopify.shop.myshopifyDomain,
      orderId: orderConfirmation?.order?.id,
      orderNumber: orderConfirmation?.number,
      source: `thank_you_${eventType}`,
      ...details,
    };

    // Publish to Shopify analytics - silent fail
    shopify.analytics.publish(
      `thankyou_app:${eventType}`,
      payload,
    ).catch(() => {
      // Silent fail - analytics should never break UX
    });

    // Send to backend - silent fail
    fetch(apiUrl('/api/analytics-click'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silent fail - analytics should never break UX
    });
    
  } catch (error) {
    // Silent fail - analytics should never break functionality
    // Only log in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.warn('Analytics tracking failed:', error);
    }
  }
}
