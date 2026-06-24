import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";
import {trackThankYouClick} from '../../shared/analytics';
import {limitText, trimText} from '../../shared/text';
import {fetchActiveBlock} from '../../shared/blocks';
import {claimExtensionRender} from '../../shared/render-once';

export default () => {
  try {
    if (!claimExtensionRender('referral')) return;

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
    fetchActiveBlock('referral')
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

  const referralHeading = limitText(
    trimText(config.title) || 'Refer friends. Get rewards.',
    48,
  );
  const referralText = limitText(
    replaceReferralVariables(
      trimText(config.description) ||
        'Invite friends and earn rewards when they purchase.',
      config,
    ),
    180,
  );
  const referralCta = limitText(
    trimText(config.shareText) || 'Share',
    24,
  );
  const referralLink = trimText(config.referralLink);
  const referralCode = limitText(
    trimText(config.referralCode) || 'THANKYOU15',
    40,
  );
  const shareLabel = limitText(
    trimText(config.shareLabel) || 'Share now:',
    40,
  );

  const trackReferralClick = () => {
    trackThankYouClick(
      'referral_click',
      {
        ctaText: referralCta,
        ctaLink: referralLink,
        itemTitle: referralHeading,
        itemUrl: referralLink,
      },
    );
  };

  const trackCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode).catch(() => {});
    }

    trackThankYouClick(
      'referral_code_copy',
      {
        ctaText: 'Copy code',
        itemTitle: referralHeading,
        itemId: referralCode,
      },
    );
  };

  if (!referralLink && !referralCode) return null;

  return (
    <s-box padding="base" border="base" borderRadius="large">
      <s-stack gap="base">
        <s-box padding="small" background="subdued" borderRadius="base">
          <s-text type="strong">{referralHeading}</s-text>
        </s-box>
        <s-text>{referralText}</s-text>
        <s-stack gap="small">
          <s-text>{shareLabel}</s-text>

          <s-stack direction="inline" gap="small">
            {/* {referralLink && (
              <s-button
                href={referralLink}
                target="_blank"
                onClick={trackReferralClick}
              >
                {referralCta}
              </s-button>
            )} */}

            {referralCode && (
              <s-button variant="secondary" onClick={trackCopyCode}>
               {referralCode}
              </s-button>
            )}
          </s-stack>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

function replaceReferralVariables(value, config) {
  return value
    .replaceAll('{friend_reward}', trimText(config.friendReward) || '15%')
    .replaceAll('{advocate_reward}', trimText(config.advocateReward) || '$10')
    .replaceAll('{referral_code}', trimText(config.referralCode) || 'THANKYOU15')
    .replaceAll('{referral_link}', trimText(config.referralLink));
}
