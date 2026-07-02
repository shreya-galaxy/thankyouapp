import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const env = context.env as unknown as Record<string, string | undefined>;
  const appOrigin = getOrigin(
    env.PUBLIC_APP_URL || env.PUBLIC_APP_PREVIEW_URL || env.LOCAL_APP_URL,
  );
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    connectSrc: [
      "'self'",
      'https://monorail-edge.shopifysvc.com',
      'https://*.myshopify.com',
      'https://*.shopify.com',
      'https://*.trycloudflare.com',
      'https://thankyouapp-production-a309.up.railway.app/',
      ...(appOrigin ? [appOrigin] : []),
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

function getOrigin(url?: string) {
  if (!url) return '';

  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}
