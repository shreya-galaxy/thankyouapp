import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState} from "preact/hooks";
import {trackThankYouClick} from '../../shared/analytics';
import {hasText, limitText} from '../../shared/text';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const s = shopify.settings.current;

  const faqs = Array.from({length: 10}, (_, index) => {
    const position = index + 1;

    return {
      q: s[`faq_q${position}`],
      a: s[`faq_a${position}`],
    };
  }).filter((faq) => hasText(faq.q) && hasText(faq.a));

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    const faq = faqs[index];
    const isOpen = openIndex === index;

    if (!isOpen) {
      trackThankYouClick(
        'faq_click',
        {ctaText: faq.q, itemTitle: faq.q},
      );
    }

    setOpenIndex(isOpen ? null : index);
  };

  return (
    <s-stack gap="base">
      <s-box padding="base" border="base" borderRadius="base">
        <s-stack gap="small">
          <s-text type="strong">Frequently asked questions</s-text>
          {/* <s-text>
            Answer shopper questions without sending them away from the thank-you page.
          </s-text> */}
        </s-stack>
      </s-box>

      {faqs.length ? (
        faqs.map((faq, i) => (
          <s-box
            key={i}
            padding="base"
            border="base"
            borderRadius="base"
          >
            <s-stack gap="small">
              <s-button
                variant="secondary"
                inlineSize="fill"
                onClick={() => toggleFAQ(i)}
              >
                {openIndex === i ? '- ' : '+ '}
                {limitText(faq.q, 64)}
              </s-button>

              {openIndex === i && (
                <s-box paddingInlineStart="base">
                  <s-text>{faq.a}</s-text>
                </s-box>
              )}
            </s-stack>
          </s-box>
        ))
      ) : (
        <s-box padding="base" border="base" borderRadius="base">
          <s-text>No FAQs configured</s-text>
        </s-box>
      )}
    </s-stack>
  );
}
