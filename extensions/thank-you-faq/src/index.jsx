import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";
import {trackThankYouClick} from '../../shared/analytics';
import {hasText, limitText} from '../../shared/text';
import {fetchActiveBlock} from '../../shared/blocks';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [faqs, setFaqs] = useState([]);
  const [heading, setHeading] = useState('');
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBlock('faq')
      .then((block) => {
        const items = block?.config?.items || [];

        setHeading(block?.config?.heading || '');
        setFaqs(
          items
            .map((item) => ({
              q: item.question,
              a: item.answer,
            }))
            .filter((faq) => hasText(faq.q) && hasText(faq.a)),
        );
      })
      .catch((error) => {
        console.error(error);
        setHeading('');
        setFaqs([]);
      })
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return null;
  if (!faqs.length) return null;

  return (
    <s-box padding="base">
      <s-stack gap="small">

        {heading && (
          <s-box paddingBlockEnd="small" paddingInlineStart="small">
            <s-text type="strong">{limitText(heading, 80)}</s-text>
          </s-box>
        )}

        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <s-box
              key={i}
              // borderRadius="large"
              background="base"
              // border="base"
            >
              <s-stack gap="none">

               <s-button
                variant="secondary"
                inlineSize="fill"
                onClick={() => toggleFAQ(i)}
              >
                <s-stack direction="inline" gap="base">
                <s-text type="strong">
                  {limitText(faq.q, 72)}
                </s-text>

                <s-text>
                  {isOpen ? '⌄' : '›'}
                </s-text>
              </s-stack>
              </s-button>

               {isOpen && (
                  <s-box padding="base" paddingBlockStart="small">
                    <s-stack gap="small">
                      <s-divider />
                      <s-text>
                        {faq.a}
                      </s-text>
                    </s-stack>
                  </s-box>
                )}

              </s-stack>
            </s-box>
          );
        })}

      </s-stack>
    </s-box>
  );
}