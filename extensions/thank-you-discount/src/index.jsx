import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useState} from 'preact/hooks';
import {limitText, trimText} from '../../shared/text';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [copied, setCopied] = useState(false);

  const discountCode = limitText(
    trimText(shopify.settings.current.discount_code) || 'No code available',
    32,
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code', error);
    }
  };

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="small">
        <s-text type="strong">Discount code</s-text>

        <s-text>
          Use this code on your next purchase:
        </s-text>

        <s-box padding="small" border="base" borderRadius="base">
          <s-text type="strong">{discountCode}</s-text>
        </s-box>

        {/* <s-button onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Code'}
        </s-button> */}
      </s-stack>
    </s-box>
  );
}