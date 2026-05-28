import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {
  useCallback,
  useEffect,
  useState,
} from 'preact/hooks';
import {apiUrl} from '../../shared/app-config';
import {trackThankYouClick} from '../../shared/analytics';
import {limitText} from '../../shared/text';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const orderConfirmation =
    shopify.orderConfirmation.current;

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecommendations = useCallback(async () => {
    try {
      const orderId =
        orderConfirmation?.order?.id;
      const orderNumber =
        orderConfirmation?.number;
      const shop = shopify.shop.myshopifyDomain;
      const storefrontUrl =
        shopify.shop.storefrontUrl;

      if (!orderId) {
        setError('Order ID not found');
        return;
      }

      const response = await fetch(
        apiUrl('/api/recommendations'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            orderNumber,
            shop,
            storefrontUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            'Could not load recommendations',
        );
        return;
      }

      setRecommendedProducts(
        data.products || [],
      );
    } catch (e) {
      console.error(e);

      setError(e?.message || 'Could not load recommendations');
    } finally {
      setLoading(false);
    }
  }, [orderConfirmation]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleProductClick = (product) => {
    trackThankYouClick(
      'recommended_product_click',
      {
        ctaText: limitText('View product', 24),
        ctaLink: product.url,
        itemId: product.id,
        itemTitle: product.title,
        itemUrl: product.url,
      },
    );
  };

  const heading = 'Recommended products';
  const subtitle =
    'Shown from metafields linked to every purchased product.';

  return (
    <s-stack gap="base">
      <s-box padding="base" border="base" borderRadius="base">
        <s-stack gap="small">
          <s-text appearance="headingMd">{heading}</s-text>
          <s-text>{subtitle}</s-text>
        </s-stack>
      </s-box>

      {loading ? (
        <s-box padding="base" border="base" borderRadius="base">
          <s-text>Loading recommendations...</s-text>
        </s-box>
      ) : error ? (
        <s-box padding="base" border="base" borderRadius="base">
          <s-text>{error}</s-text>
        </s-box>
      ) : !recommendedProducts.length ? (
        <s-box padding="base" border="base" borderRadius="base">
          <s-text>No recommendations found</s-text>
        </s-box>
      ) : (
        <s-grid
          gap="base"
          gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
        >
          {recommendedProducts.map((product) => (
            <s-box
              key={product.id}
              padding="base"
              border="base"
              borderRadius="base"
            >
              <s-stack gap="small">
                {product.image && (
                  <s-link
                    href={product.url}
                    target="_blank"
                    onClick={() =>
                      handleProductClick(product)
                    }
                  >
                    <s-image
                      src={product.image}
                      alt={product.title}
                      aspectRatio={1}
                      objectFit="cover"
                      inlineSize="fill"
                    />
                  </s-link>
                )}

                <s-text>{limitText(product.title, 60)}</s-text>

                <s-link
                  href={product.url}
                  target="_blank"
                  onClick={() =>
                    handleProductClick(product)
                  }
                >
                  {limitText('View product', 24)}
                </s-link>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
      )}
    </s-stack>
  );
}
