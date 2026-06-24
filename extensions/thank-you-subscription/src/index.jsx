import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {trackThankYouClick} from '../../shared/analytics';
import {limitText, trimText} from '../../shared/text';
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
  const s = shopify.settings.current;

  if (!s.subscription_cta_link) return null;

  const heading = limitText(
    trimText(s.subscription_heading1) || 'Never run out again',
    48,
  );
  const body = limitText(
    trimText(s.subscription_heading2) ||
      'Subscribe and get exclusive savings on every order',
    120,
  );
  const cta = String(
    limitText(
      trimText(s.subscription_cta_text) || 'Subscribe & Save',
      24,
    )
  );

  const handleClick = () => {
    const payload = {
      ctaText: cta,
      ctaLink: s.subscription_cta_link,
    };

    trackThankYouClick(
      'subscription_click',
      payload,
    );
  };

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="base">
        <s-stack gap="small">
          <s-text type="strong">{heading}</s-text>
          <s-text>{body}</s-text>
        </s-stack>

        <s-button
          href={s.subscription_cta_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          {cta}
        </s-button>
      </s-stack>
    </s-box>
  );
}
