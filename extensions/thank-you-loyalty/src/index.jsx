import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {trackThankYouClick} from '../../shared/analytics';
import {limitText, trimText} from '../../shared/text';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const s = shopify.settings.current;
  const loyaltyHeading = limitText(
    trimText(s.loyalty_heading) || 'Earn rewards on every order',
    48,
  );
  const loyaltyText = limitText(
    trimText(s.loyalty_text) ||
      'Join our loyalty program and start earning points today',
    120,
  );
  const loyaltyCta = limitText(
    trimText(s.loyalty_cta_text) || 'Join Now',
    24,
  );

  const trackLoyaltyClick = () => {
    trackThankYouClick(
      'loyalty_click',
      {
        ctaText: loyaltyCta,
        ctaLink: s.loyalty_cta_link,
        itemTitle: loyaltyHeading,
        itemUrl: s.loyalty_cta_link,
      },
    );
  };

  if (!s.loyalty_cta_link) return null;

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="small">
        <s-text type="strong">{loyaltyHeading}</s-text>
        <s-text>{loyaltyText}</s-text>

        <s-button
          href={s.loyalty_cta_link}
          target="_blank"
          onClick={trackLoyaltyClick}
        >
          {loyaltyCta}
        </s-button>
      </s-stack>
    </s-box>
  );
}
