import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {limitText, trimText} from '../../shared/text';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const discountCode = limitText(
    trimText(shopify.settings.current.discount_code) || 'No code available',
    32,
  );

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="small">
        <s-text type="strong">Discount code</s-text>
        <s-text>Use this code on your next purchase:</s-text>
        <s-box padding="small" border="base" borderRadius="base">
          <s-text type="strong">{discountCode}</s-text>
        </s-box>
      </s-stack>
    </s-box>
  );
}
