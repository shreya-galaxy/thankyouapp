import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";
import {trackThankYouClick} from '../../shared/analytics';
import {limitText, trimText} from '../../shared/text';
import {fetchActiveBlock} from '../../shared/blocks';

export default () => {
  try {
    render(<Extension />, document.body);
  } catch (error) {
    console.error('Extension failed to render:', error);
    // Graceful fallback - render nothing rather than breaking page
  }
};

function Extension() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBlock('loyalty')
      .then((block) => {
        setConfig(block?.config || null);
      })
      .catch((error) => {
        console.error(error);
        setConfig(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!config) return null;

  const loyaltyHeading = limitText(
    trimText(config.title) || 'Earn rewards on every order',
    48,
  );
  const loyaltyText = limitText(
    trimText(config.description) ||
      'Join our loyalty program and start earning points today',
    160,
  );
  const loyaltyCta = limitText(
    trimText(config.buttonText) || 'Join now',
    24,
  );
  const loyaltyLink = trimText(config.buttonUrl);
  const pointsText = limitText(
    trimText(config.pointsText) || '2x points',
    40,
  );
  const validUntil = limitText(trimText(config.validUntil), 60);

  const trackLoyaltyClick = () => {
    trackThankYouClick(
      'loyalty_click',
      {
        ctaText: loyaltyCta,
        ctaLink: loyaltyLink,
        itemTitle: loyaltyHeading,
        itemUrl: loyaltyLink,
      },
    );
  };

  return (
    <s-box padding="base" border="base" borderRadius="large">
      <s-stack gap="base">
        <s-box padding="small" background="subdued" borderRadius="base">
          <s-text type="strong">{pointsText}</s-text>
        </s-box>
        <s-text type="strong">{loyaltyHeading}</s-text>
        <s-text>{loyaltyText}</s-text>

        {loyaltyLink && (
          <s-button
            href={loyaltyLink}
            target="_blank"
            onClick={trackLoyaltyClick}
          >
            {loyaltyCta}
          </s-button>
        )}

        {validUntil && <s-text>{validUntil}</s-text>}
      </s-stack>
    </s-box>
  );
}
