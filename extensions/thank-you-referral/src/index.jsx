import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {trackThankYouClick} from '../../shared/analytics';
import {limitText, trimText} from '../../shared/text';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const s = shopify.settings.current;
  const referralHeading = limitText(
    trimText(s.referral_heading) || 'Give ₹, Get ₹',
    48,
  );
  const referralText = limitText(
    trimText(s.referral_text) ||
      'Invite friends and earn rewards when they purchase',
    120,
  );
  const referralCta = limitText(
    trimText(s.referral_cta_text) || 'Refer a Friend',
    24,
  );

  const trackReferralClick = () => {
    trackThankYouClick(
      'referral_click',
      {
        ctaText: referralCta,
        ctaLink: s.referral_cta_link,
        itemTitle: referralHeading,
        itemUrl: s.referral_cta_link,
      },
    );
  };

  if (!s.referral_cta_link) return null;

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="small">
        <s-text type="strong">{referralHeading}</s-text>
        <s-text>{referralText}</s-text>

        <s-button
          href={s.referral_cta_link}
          target="_blank"
          onClick={trackReferralClick}
        >
          {referralCta}
        </s-button>
      </s-stack>
    </s-box>
  );
}
