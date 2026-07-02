import React from 'react';
import {Image} from '@shopify/hydrogen';

type Props = {
  type: 'faq' | 'image' | 'video';
  shop?: string;
};

type BlocksApiResponse = {
  block?: {
    id?: string;
    type?: string;
    name: string;
    config: any;
  };
};

const DEFAULT_APP_URL = 'https://thankyouapp-production-a309.up.railway.app';

async function tryFetchJson(urls: string[]) {
  let lastError: unknown = null;
  for (const u of urls) {
    try {
      const res = await fetch(u, {cache: 'no-store'});
      if (!res.ok) {
        lastError = new Error(`non-200 from ${u}: ${res.status}`);
        continue;
      }
      return await res.json().catch((e) => {
        lastError = e;
        return null;
      });
    } catch (err) {
      lastError = err;
      console.error(`ThankYouBlock: fetch failed for ${u}`, err);
    }
  }

  throw lastError;
}

export default async function ThankYouBlock({type, shop}: Props) {
  const shopDomain = shop || process.env.PUBLIC_STORE_DOMAIN;
  if (!shopDomain) return null;

  const candidates: string[] = [];

  // Primary public app URL (production or configured)
  for (const appUrl of [
    process.env.PUBLIC_APP_URL,
    DEFAULT_APP_URL,
    process.env.PUBLIC_APP_PREVIEW_URL,
    process.env.LOCAL_APP_URL,
  ]) {
    if (!appUrl) continue;
    const u = new URL('/api/blocks', appUrl);
    u.searchParams.set('shop', shopDomain);
    u.searchParams.set('type', type);
    candidates.push(u.toString());
  }

  try {
    const data = (await tryFetchJson(candidates)) as BlocksApiResponse | null;
    const block = data?.block;
    if (!block) return null;
    try {
      console.info('ThankYouBlock: fetched block', {id: block.id, type: block.type, name: block.name});
    } catch (e) {
      // ignore logging errors
    }

    const config = typeof block.config === 'string' ? JSON.parse(block.config) : block.config;

    if (type === 'image' && config?.imageUrl) {
      return (
        <div className="thankyou-block thankyou-image">
          <h3>{block.name}</h3>
          <Image data={{src: config.imageUrl, altText: config.imageAlt || ''}} width={600} height={400} />
        </div>
      );
    }

    if (type === 'video' && config?.videoUrl) {
      return (
        <div className="thankyou-block thankyou-video">
          <h3>{block.name}</h3>
          <video controls src={config.videoUrl} style={{maxWidth: '100%'}} />
        </div>
      );
    }

    if (type === 'faq' && Array.isArray(config?.items)) {
      return (
        <div className="thankyou-block thankyou-faq">
          <h3>{block.name}</h3>
          <div>
            {config.items.map((it: any, i: number) => (
              <details key={i}>
                <summary>{it.question}</summary>
                <p>{it.answer}</p>
              </details>
            ))}
          </div>
        </div>
      );
    }

    return null;
  } catch (err) {
    console.error('ThankYouBlock: all fetch attempts failed', {candidates, err});
    return null;
  }
}
