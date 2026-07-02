import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';
import {limitText, trimText} from '../../shared/text';
import {fetchActiveBlock} from '../../shared/blocks';
import {claimExtensionRender} from '../../shared/render-once';

export default () => {
  try {
    if (!claimExtensionRender('discount')) return;

    render(<Extension />, document.body);
  } catch (error) {
    console.error('Extension failed to render:', error);
    // Graceful fallback - render nothing rather than breaking page
  }
};

function Extension() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchActiveBlock('discount')
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
        <s-stack gap="small">
          <s-skeleton-paragraph />
          <s-skeleton-paragraph />
        </s-stack>
      </s-box>
    );
  }

  if (!config) return null;

  const title = limitText(
    trimText(config.title) || 'Discount code',
    48,
  );
  const description = limitText(
    textFromHtml(config.description) || 'Use this code on your next purchase:',
    120,
  );
  const discountCode = limitText(
    trimText(config.discountCode),
    32,
  );

  if (!discountCode) return null;

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="small">
        <s-text type="strong">{title}</s-text>

        <s-text>
          {description}
        </s-text>

        <s-box padding="small" border="base" borderRadius="base">
          <s-text type="strong">{discountCode}</s-text>
        </s-box>
      </s-stack>
    </s-box>
  );
}

function textFromHtml(value) {
  return trimText(String(value || '').replace(/<[^>]*>/g, ' '));
}
