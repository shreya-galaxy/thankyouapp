/* global globalThis */
import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';
import {submitSubscriptionSignup} from '../../shared/subscription';
import {limitText, trimText} from '../../shared/text';
import {fetchActiveBlock} from '../../shared/blocks';
import {claimExtensionRender} from '../../shared/render-once';

export default () => {
  try {
    if (!claimExtensionRender('subscription')) return;

    render(<Extension />, document.body);
  } catch (error) {
    console.error('Extension failed to render:', error);
    // Graceful fallback - render nothing rather than breaking page
  }
};

function Extension() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('subdued');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActiveBlock('subscription')
      .then((block) => setConfig(block?.config || null))
      .catch((error) => {
        console.error(error);
        setConfig(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <s-box padding="base" border="base" borderRadius="base">
        <s-stack gap="base">
          <s-skeleton-paragraph />
          <s-skeleton-paragraph />
        </s-stack>
      </s-box>
    );
  }

  if (!config) return null;

  const heading = limitText(
    trimText(config.subscriptionHeading) || 'Never run out again',
    48,
  );
  const body = limitText(
    trimText(config.subscriptionBody) ||
      'Subscribe and get exclusive savings on every order',
    120,
  );
  const cta = String(
    limitText(
      trimText(config.buttonText) || 'Subscribe',
      24,
    )
  );
  const placeholder = limitText(
    trimText(config.emailPlaceholder) || 'Email address',
    60,
  );
  const successMessage = limitText(
    trimText(config.successMessage) || 'Thanks for subscribing.',
    100,
  );

  const handleSubmit = async () => {
    const normalizedEmail = trimText(email).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setTone('critical');
      setMessage('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setTone('subdued');
    setMessage('');

    const payload = thankYouPayload('subscription_signup', {
      email: normalizedEmail,
      ctaText: cta,
      itemId: normalizedEmail,
      itemTitle: heading,
      source: 'thank_you_subscription_signup',
      payloadEmail: normalizedEmail,
    });

    try {
      await submitSubscriptionSignup(payload);

      setTone('success');
      setMessage(successMessage);
      setEmail('');
    } catch (error) {
      setTone('critical');
      setMessage(
        error?.message || 'Could not subscribe this email address.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="base">
        <s-stack gap="small">
          <s-text type="strong">{heading}</s-text>
          <s-text>{body}</s-text>
        </s-stack>

        <s-text-field
          label={placeholder}
          type="email"
          value={email}
          onInput={(event) => setEmail(event.target.value)}
        />

        <s-button disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Subscribing...' : cta}
        </s-button>

        {message && <s-text color={tone}>{message}</s-text>}
      </s-stack>
    </s-box>
  );
}

function thankYouPayload(eventType, details = {}) {
  const extensionApi =
    typeof globalThis !== 'undefined' ? globalThis.shopify : shopify;
  const orderConfirmation = extensionApi.orderConfirmation.current;

  return {
    eventType,
    shop: shopDomain(extensionApi.shop),
    orderId: signalValue(orderConfirmation?.order?.id),
    orderNumber: signalValue(orderConfirmation?.number),
    source: `thank_you_${eventType}`,
    ...details,
  };
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
