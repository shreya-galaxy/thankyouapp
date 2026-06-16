export async function createMetafieldDefinitions(admin: any) {
  const definitions = [
    {
      name: "Recommended Products",
      namespace: "custom",
      key: "recommended_products",
      ownerType: "PRODUCT",
      type: "list.product_reference",
    },
    // {
    //   name: "Recommended Collection",
    //   namespace: "custom",
    //   key: "recommended_collection",
    //   ownerType: "PRODUCT",
    //   type: "collection_reference",
    // },
  ];

  const response = await admin.graphql(`
    query {
      metafieldDefinitions(first: 250, ownerType: PRODUCT) {
        nodes {
          namespace
          key
        }
      }
    }
  `);

  const data = await response.json();

  const existingDefinitions =
    data?.data?.metafieldDefinitions?.nodes || [];

  for (const definition of definitions) {
    const exists = existingDefinitions.some(
      (item: any) =>
        item.namespace === definition.namespace &&
        item.key === definition.key
    );

    if (!exists) {
      await admin.graphql(
        `
        mutation CreateMetafieldDefinition(
          $definition: MetafieldDefinitionInput!
        ) {
          metafieldDefinitionCreate(definition: $definition) {
            createdDefinition {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
        `,
        {
          variables: {
            definition,
          },
        }
      );
    }
  }
}