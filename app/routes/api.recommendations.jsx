/* eslint-env node */
import {unauthenticated} from '../shopify.server';

const RECOMMENDATION_METAFIELD = {
  namespace: 'custom',
  key: 'recommended_products',
};

export async function action({request}) {
  try {
    if (request.method === 'OPTIONS') {
      return responseJson({});
    }
    const body = await request.json();
    const {orderId, orderNumber, checkoutToken} = body;
    const shop =
      body.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const storefrontUrl =
      body.storefrontUrl || `https://${shop}`;

    if (!shop) {
      return responseJson({
        success: false,
        message:
          'Shop domain is required to create an Admin API client',
      });
    }

    if (!orderId && !checkoutToken && !orderNumber) {
      return responseJson({
        success: false,
        message: 'Order ID, order number, or checkout token is required',
      });
    }

    const adminOrderId =
      orderId ? normalizeOrderId(orderId) : '';

    const {admin} =
      await unauthenticated.admin(shop);

    const orderData = adminOrderId
      ? await fetchOrderById(
          admin,
          adminOrderId,
        )
      : null;

    let order =
      orderData?.data?.order;

    if (!order && checkoutToken) {
      const orderSearchData = await fetchOrderByQuery(
        admin,
        `checkout_token:${checkoutToken}`,
      );
      order = orderSearchData?.data?.orders?.nodes?.[0];
    }

    if (!order && orderNumber) {
      const query = String(orderNumber).startsWith('#')
        ? `name:${orderNumber}`
        : `name:#${orderNumber}`;
      const orderSearchData = await fetchOrderByQuery(admin, query);
      order = orderSearchData?.data?.orders?.nodes?.[0];
    }

    if (!order && orderData?.errors?.length) {
      return responseJson({
        success: false,
        message: graphQLErrorMessage(orderData),
        orderId,
        adminOrderId,
      });
    }

    if (!order) {
      return responseJson({
        success: false,
        message: 'Order not found',
        orderId,
        adminOrderId,
      });
    }

    const purchasedProducts = (order?.lineItems?.nodes || [])
      .map((lineItem) => lineItem?.variant?.product)
      .filter((product) => product?.id);

    if (!purchasedProducts.length) {
      return responseJson({
        success: false,
        message: 'No product found',
      });
    }

    const purchasedProductIds = new Set(
      purchasedProducts.map((product) => product.id),
    );
    const recommendedProducts = new Map();

    for (const purchasedProduct of purchasedProducts) {
      const metafield = purchasedProduct.metafield;
      const referencedProducts = [
        ...(metafield?.references?.nodes || []),
        ...(metafield?.reference ? [metafield.reference] : []),
      ].filter(Boolean);

      for (const product of referencedProducts) {
        if (!product?.id || purchasedProductIds.has(product.id)) {
          continue;
        }

        if (!recommendedProducts.has(product.id)) {
          recommendedProducts.set(product.id, {
            id: product.id,
            title: product.title,
            handle: product.handle,
            url:
              product.onlineStoreUrl ||
              buildProductUrl(storefrontUrl, product.handle),
            image: product.featuredImage?.url || '',
          });
        }
      }
    }

    return responseJson({
      success: true,
      order: {
        id: order.id,
        name: order.name,
      },
      sourceProducts: purchasedProducts.map((product) => ({
        id: product.id,
        title: product.title,
      })),
      products: Array.from(recommendedProducts.values()).slice(0, 8),
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : 'Unexpected recommendation error';

    return responseJson({
      success: false,
      message,
    });
  }
}

async function fetchOrderById(admin, adminOrderId) {
  const orderResponse = await admin.graphql(
      `
        query GetOrder($id: ID!) {
          order(id: $id) {
            id
            name

            lineItems(first: 50) {
              nodes {
                title

                variant {
                  product {
                    id
                    title

                    metafield(
                      namespace: "${RECOMMENDATION_METAFIELD.namespace}"
                      key: "${RECOMMENDATION_METAFIELD.key}"
                    ) {
                      reference {
                        ... on Product {
                          id
                          title
                          handle
                          onlineStoreUrl

                          featuredImage {
                            url
                          }
                        }
                      }

                      references(first: 10) {
                        nodes {
                          ... on Product {
                            id
                            title
                            handle
                            onlineStoreUrl

                            featuredImage {
                              url
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          id: adminOrderId,
        },
      },
    );

  return orderResponse.json();
}

async function fetchOrderByQuery(admin, query) {
  const orderResponse = await admin.graphql(
    `
      query FindOrder($query: String!) {
        orders(first: 1, query: $query, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            name

            lineItems(first: 50) {
              nodes {
                title

                variant {
                  product {
                    id
                    title

                    metafield(
                      namespace: "${RECOMMENDATION_METAFIELD.namespace}"
                      key: "${RECOMMENDATION_METAFIELD.key}"
                    ) {
                      reference {
                        ... on Product {
                          id
                          title
                          handle
                          onlineStoreUrl

                          featuredImage {
                            url
                          }
                        }
                      }

                      references(first: 10) {
                        nodes {
                          ... on Product {
                            id
                            title
                            handle
                            onlineStoreUrl

                            featuredImage {
                              url
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        query,
      },
    },
  );

  return orderResponse.json();
}

function normalizeOrderId(orderId) {
  const value = String(orderId || '').trim();

  if (!value) return '';

  if (/^\d+$/.test(value)) {
    return `gid://shopify/Order/${value}`;
  }

  return value.replace(
    'gid://shopify/OrderIdentity/',
    'gid://shopify/Order/',
  );
}

function graphQLErrorMessage(data) {
  const message = data.errors
    .map((error) => error?.message)
    .filter(Boolean)
    .join(', ');

  return message || 'Could not load order from Shopify';
}

function responseJson(data) {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        'Content-Type':
          'application/json',

        'Access-Control-Allow-Origin':
          '*',

        'Access-Control-Allow-Methods':
          'POST, OPTIONS',

        'Access-Control-Allow-Headers':
          'Content-Type',
      },
    },
  );
}

function buildProductUrl(storefrontUrl, handle) {
  if (!handle) {
    return storefrontUrl;
  }

  try {
    return new URL(
      `/products/${handle}`,
      storefrontUrl,
    ).toString();
  } catch {
    return `https://${storefrontUrl}/products/${handle}`;
  }
}

export async function loader() {
  return responseJson({});
}
