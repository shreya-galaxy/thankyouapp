"use client";

import React, {useEffect, useState} from 'react';

type Config = any;
type BlocksApiResponse = {
  block?: {
    name: string;
    config: Config;
  };
};

const DEFAULT_APP_URL = 'https://thankyouapp-production-a309.up.railway.app';

declare global {
  interface Window {
    THANKYOU_APP_URL?: string;
    PUBLIC_APP_URL?: string;
  }
}

export default function ThankYouBlockClient({type, shop}:{type:'faq'|'image'|'video', shop?:string}){
  const [block, setBlock] = useState<null|{name:string,config:Config}>(null);
  const [error, setError] = useState<string|undefined>();

  useEffect(()=>{
    const appUrl =
      window.THANKYOU_APP_URL ||
      window.PUBLIC_APP_URL ||
      (import.meta as any).env?.PUBLIC_APP_URL ||
      DEFAULT_APP_URL;
    const shopDomain = shop || window.location.hostname;
    const candidates: string[] = [];

    if (!appUrl) {
      setError('PUBLIC_APP_URL is not configured');
      return;
    }

    candidates.push(`${appUrl.replace(/\/$/, '')}/api/blocks?shop=${encodeURIComponent(shopDomain)}&type=${encodeURIComponent(type)}`);

    let mounted = true;
    (async ()=>{
      for (const url of candidates){
        try{
          const res = await fetch(url, {cache: 'no-store'});
          if (!res.ok) continue;
          const data = (await res.json().catch(()=>null)) as BlocksApiResponse | null;
          if (data?.block){
            if (!mounted) return;
            setBlock({name: data.block.name, config: data.block.config});
            return;
          }
        }catch(err){
          // try next
        }
      }
      if (mounted) setError('No block found');
    })();
    return ()=>{mounted=false};
  },[type,shop]);

  if (error) return null;
  if (!block) return null;

  const config = typeof block.config === 'string' ? JSON.parse(block.config) : block.config;

  if (type === 'image' && config?.imageUrl){
    return (<div className="thankyou-block thankyou-image"><h3>{block.name}</h3><img src={config.imageUrl} alt={config.imageAlt||''} style={{maxWidth:'100%'}}/></div>);
  }

  if (type === 'video' && config?.videoUrl){
    return (<div className="thankyou-block thankyou-video"><h3>{block.name}</h3><video controls src={config.videoUrl} style={{maxWidth:'100%'}}/></div>);
  }

  if (type === 'faq' && Array.isArray(config?.items)){
    return (<div className="thankyou-block thankyou-faq"><h3>{block.name}</h3>{config.items.map((it:any,i:number)=>(<details key={i}><summary>{it.question}</summary><p>{it.answer}</p></details>))}</div>);
  }

  return null;
}
