type GraphqlClient = {
  graphql: (
    query: string,
    options?: {variables?: Record<string, unknown>},
  ) => Promise<Response>;
};

export async function checkoutEditorUrl(shop: string, admin?: GraphqlClient) {
  const storeHandle = storeHandleFromShop(shop);
  const settingsUrl = `https://admin.shopify.com/store/${storeHandle}/settings/checkout`;
  const checkoutProfileId = admin ? await getCheckoutProfileId(admin) : "";

  if (!checkoutProfileId) {
    return settingsUrl;
  }

  return `${settingsUrl}/editor/profiles/${checkoutProfileId}?page=thank-you`;
}

function storeHandleFromShop(shop: string) {
  return shop
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.myshopify\.com$/i, "")
    .split(".")[0];
}

async function getCheckoutProfileId(admin: GraphqlClient) {
  try {
    const response = await admin.graphql(`
      query CheckoutProfiles {
        checkoutProfiles(first: 1, query: "is_published:true") {
          nodes {
            id
          }
        }
      }
    `);
    const data = (await response.json()) as {
      data?: {
        checkoutProfiles?: {
          nodes?: Array<{id?: string}>;
        };
      };
    };
    const gid = data?.data?.checkoutProfiles?.nodes?.[0]?.id;

    return typeof gid === "string" ? gid.split("/").pop() || "" : "";
  } catch (error) {
    console.error("Could not resolve checkout profile editor URL", error);
    return "";
  }
}
