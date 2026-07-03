/* eslint-env node */
import prisma from '../db.server';
import {unauthenticated} from '../shopify.server';

const EMAIL_MARKETING_CONSENT = {
  marketingState: 'SUBSCRIBED',
  marketingOptInLevel: 'SINGLE_OPT_IN',
};

export async function action({request}) {
  try {
    if (request.method === 'OPTIONS') {
      return responseJson({});
    }

    const body = await parseRequestBody(request);
    const email = normalizeEmail(body.email || body.payloadEmail || body.itemId);
    const shop = normalizeShop(body.shop || process.env.SHOPIFY_SHOP_DOMAIN);

    if (!shop) {
      return responseJson({
        success: false,
        message: 'Shop is required',
      });
    }

    if (!email) {
      return responseJson({
        success: false,
        message: 'A valid email address is required',
      });
    }

    const {admin} = await unauthenticated.admin(shop);
    const customer = await createOrSubscribeCustomer(admin, email);
    const click = await recordSubscriptionSignup(shop, email, body, customer?.id);

    return responseJson({
      success: true,
      id: click.id,
      customerId: customer?.id || null,
    });
  } catch (error) {
    console.error(error);

    return responseJson({
      success: false,
      message: error instanceof Error ? error.message : 'Could not subscribe customer',
    });
  }
}

export async function loader() {
  return responseJson({});
}

async function createOrSubscribeCustomer(admin, email) {
  let createData = await createCustomer(admin, {
    email,
    emailMarketingConsent: subscribedEmailMarketingConsent(),
  });

  if (createData?.errors?.length) {
    createData = await createCustomer(admin, {email});
  }

  const createdCustomer = createData?.data?.customerCreate?.customer;
  const createErrors = createData?.data?.customerCreate?.userErrors || [];

  if (createdCustomer?.id) {
    await subscribeExistingCustomer(admin, createdCustomer.id);
    return createdCustomer;
  }

  const existingCustomer = await findCustomerByEmail(admin, email);

  if (existingCustomer?.id) {
    await subscribeExistingCustomer(admin, existingCustomer.id);
    return existingCustomer;
  }

  if (createData?.errors?.length) {
    throw new Error(graphQLErrorMessage(createData));
  }

  if (createErrors.length) {
    throw new Error(createErrors.map((error) => error.message).join(' '));
  }

  throw new Error('Customer could not be created.');
}

async function createCustomer(admin, input) {
  return graphqlJson(
    admin,
    `
      mutation CreateSubscribedCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {input},
  );
}

async function findCustomerByEmail(admin, email) {
  const data = await graphqlJson(
    admin,
    `
      query FindCustomerByEmail($query: String!) {
        customers(first: 1, query: $query) {
          nodes {
            id
            email
          }
        }
      }
    `,
    {
      query: `email:'${email.replace(/'/g, "\\'")}'`,
    },
  );

  if (data?.errors?.length) {
    throw new Error(graphQLErrorMessage(data));
  }

  return data?.data?.customers?.nodes?.[0] || null;
}

async function subscribeExistingCustomer(admin, customerId) {
  const data = await graphqlJson(
    admin,
    `
      mutation SubscribeCustomerEmail($input: CustomerEmailMarketingConsentUpdateInput!) {
        customerEmailMarketingConsentUpdate(input: $input) {
          customer {
            id
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      input: {
        customerId,
        emailMarketingConsent: subscribedEmailMarketingConsent(),
      },
    },
  );

  if (data?.errors?.length) {
    return subscribeExistingCustomerWithUpdate(admin, customerId);
  }

  const errors =
    data?.data?.customerEmailMarketingConsentUpdate?.userErrors || [];

  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join(' '));
  }
}

async function subscribeExistingCustomerWithUpdate(admin, customerId) {
  const data = await graphqlJson(
    admin,
    `
      mutation SubscribeCustomerEmailWithUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      input: {
        id: customerId,
        emailMarketingConsent: subscribedEmailMarketingConsent(),
      },
    },
  );

  const errors = data?.data?.customerUpdate?.userErrors || [];

  if (data?.errors?.length) {
    throw new Error(graphQLErrorMessage(data));
  }

  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join(' '));
  }
}

function subscribedEmailMarketingConsent() {
  return {
    ...EMAIL_MARKETING_CONSENT,
    consentUpdatedAt: new Date().toISOString(),
  };
}

async function recordSubscriptionSignup(shop, email, body, customerId) {
  return prisma.subscriptionClick.create({
    data: {
      shop,
      eventType: body.eventType || 'subscription_signup',
      orderId: body.orderId || null,
      orderNumber: body.orderNumber || null,
      ctaText: body.ctaText || null,
      ctaLink: body.ctaLink || null,
      itemId: customerId || email,
      itemTitle: body.itemTitle || email,
      itemUrl: body.itemUrl || null,
      source: body.source || 'thank_you_subscription_signup',
      payload: JSON.stringify({...body, email, customerId}),
    },
  });
}

async function graphqlJson(admin, query, variables) {
  const response = await admin.graphql(query, {variables});

  return response.json();
}

function responseJson(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function parseRequestBody(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  const text = await request.text();

  return text ? JSON.parse(text) : {};
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function normalizeShop(value) {
  if (!value) return '';

  const text = String(value).trim();

  if (!text) return '';

  try {
    return new URL(text).hostname.toLowerCase();
  } catch (error) {
    return text
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }
}

function graphQLErrorMessage(data) {
  return (
    data?.errors
      ?.map((error) => error.message)
      .filter(Boolean)
      .join(' ') || 'Shopify Admin API request failed.'
  );
}
