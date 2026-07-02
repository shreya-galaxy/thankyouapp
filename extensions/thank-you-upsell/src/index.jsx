import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {
  useCallback,
  useEffect,
  useState,
} from 'preact/hooks';
import {apiUrls} from '../../shared/app-config';
import {trackThankYouClick} from '../../shared/analytics';
import {limitText} from '../../shared/text';
import {fetchActiveBlock} from '../../shared/blocks';
import {claimExtensionRender} from '../../shared/render-once';
import {fetchWithTimeout} from '../../shared/fetch-with-timeout';

export default () => {
  try {
    if (!claimExtensionRender('upsell')) return;

    render(<Extension />, document.body);
  } catch (error) {
    console.error('Extension failed to render:', error);
    // Graceful fallback - render nothing rather than breaking page
  }
};

function Extension() {
  const orderConfirmation =
    shopify.orderConfirmation.current;

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockConfig, setBlockConfig] = useState(null);
  const [blockEnabled, setBlockEnabled] = useState(false);

  const loadRecommendations = useCallback(async () => {
    try {
      const orderId =
        signalValue(orderConfirmation?.order?.id);
      const orderNumber =
        signalValue(orderConfirmation?.number);
      const checkoutToken =
        signalValue(shopify.checkoutToken);
      const shop = shopDomain(shopify.shop);
      const storefrontUrl =
        shopUrl(shopify.shop);

      if (!orderId && !orderNumber && !checkoutToken) {
        setError('Order details not found');
        return;
      }

      if (!shop) {
        setError('Shop domain not found');
        return;
      }

      const data = await fetchRecommendations({
        orderId,
        orderNumber,
        checkoutToken,
        shop,
        storefrontUrl,
      });

      setRecommendedProducts(data.products || []);
    } catch (e) {
    // Log detailed error for debugging
    console.error('Failed to load recommendations:', {
      error: e.message,
      stack: e.stack
    });
    
    // User-friendly message
    setError(e?.message || 'Could not load recommendations');
  } finally {
    setLoading(false);
  }
  }, [orderConfirmation]);

  useEffect(() => {
    fetchActiveBlock('upsell')
      .then((block) => {
        if (!block) {
          setLoading(false);
          return;
        }

        setBlockEnabled(true);
        setBlockConfig(block.config || null);
        loadRecommendations();
      })
      .catch((error) => {
        console.error(error);
        setBlockConfig(null);
        setLoading(false);
      })
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

  const heading =
    blockConfig?.upsellHeading || 'Recommended products';
  const emptyMessage =
    blockConfig?.emptyMessage || 'No recommendations found';

  if (!blockEnabled && !loading) return null;

  return (
    <s-stack gap="base">
      {loading ? (
        <s-box padding="base" border="base" borderRadius="base">
          <s-skeleton-paragraph></s-skeleton-paragraph>
        </s-box>
      ) : error ? (
        <s-box padding="base" border="base" borderRadius="base">
          <s-text>{error}</s-text>
        </s-box>
      ) : !recommendedProducts.length ? (
        <s-box padding="base" border="base" borderRadius="base">
          <s-text>{emptyMessage}</s-text>
        </s-box>
      ) : (
        <>
        <s-box padding="base" border="base" borderRadius="base">
          <s-stack gap="small">
            <s-text>{heading}</s-text>
          </s-stack>
        </s-box>
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
                    rel="noopener noreferrer"
                  >
                    <s-image
                      src={product.image}
                      alt={`${product.title}${product.productType ? ` - ${product.productType}` : ''}`}
                      aspectRatio="1/1"
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
                  rel="noopener noreferrer"
                >
                  {limitText('View product', 24)}
                </s-link>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
        </>
      )}
    </s-stack>
  );
}

async function fetchRecommendations(payload) {
  const errors = [];

  for (const url of apiUrls('/api/recommendations')) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        errors.push(data?.message || `${response.status} from ${url}`);
        continue;
      }

      return data;
    } catch (error) {
      errors.push(error?.message || `Could not load ${url}`);
    }
  }

  throw new Error(
    errors.join(' | ') || 'Could not load recommendations',
  );
}

function shopDomain(shop) {
  return firstNormalized([
    shop?.myshopifyDomain,
    shop?.domain,
    shop?.storefrontUrl,
    shop?.storefrontUrl?.current,
  ]);
}

function signalValue(value) {
  return value?.current || value;
}

function shopUrl(shop) {
  const value = firstValue([
    shop?.storefrontUrl,
    shop?.storefrontUrl?.current,
    shop?.domain,
    shop?.myshopifyDomain,
  ]);

  if (!value) return '';

  return String(value).startsWith('http')
    ? String(value)
    : `https://${value}`;
}

function firstNormalized(values) {
  const value = firstValue(values);

  if (!value) return '';

  const text = String(value).trim();

  try {
    return new URL(text).hostname.toLowerCase();
  } catch (error) {
    return text
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }
}

function firstValue(values) {
  return values
    .map(signalValue)
    .find(
      (value) =>
        typeof value === 'string' ||
        value instanceof URL,
    );
}
