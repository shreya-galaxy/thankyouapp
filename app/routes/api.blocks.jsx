/* eslint-env node */
import {isBlockType, parseBlockConfig} from '../models/thankYouBlock';
import {getActiveBlock} from '../models/thankYouBlock.server';

export async function loader({request}) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  const type = url.searchParams.get('type');

  if (!shop || !isBlockType(type)) {
    return responseJson({
      success: false,
      message: 'Shop and valid block type are required',
    });
  }

  const block = await getActiveBlock(shop, type);

  if (!block) {
    return responseJson({
      success: true,
      block: null,
    });
  }

  return responseJson({
    success: true,
    block: {
      id: block.id,
      type: block.type,
      name: block.name,
      status: block.status,
      config: parseBlockConfig(block.config),
      updatedAt: block.updatedAt.toISOString(),
    },
  });
}

export async function action({request}) {
  if (request.method === 'OPTIONS') {
    return responseJson({});
  }

  return loader({request});
}

function responseJson(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
