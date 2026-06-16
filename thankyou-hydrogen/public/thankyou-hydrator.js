// Hydrates .thankyou-placeholder elements by fetching app API and injecting HTML
// Hydrates .thankyou-placeholder elements by fetching app API and injecting HTML
// Instrumentation: when a fetch fails or no block is found, the placeholder
// will show a short error message so it's visible without opening DevTools.
(function(){
  async function fetchBlock(shop, type){
    const appUrl = window.THANKYOU_APP_URL || window.PUBLIC_APP_URL || '';
    const candidates = [];

    if (!appUrl) {
      return {
        block: null,
        error: 'PUBLIC_APP_URL is not configured for the Hydrogen thank-you preview',
      };
    }

    candidates.push(`${appUrl.replace(/\/$/, '')}/api/blocks?shop=${encodeURIComponent(shop)}&type=${encodeURIComponent(type)}`);

    let lastError = null;
    for (const url of candidates){
      try{
        const res = await fetch(url, {cache:'no-store'});
        if (!res.ok) {
          lastError = `HTTP ${res.status} ${res.statusText} for ${url}`;
          continue;
        }
        const data = await res.json().catch((e)=>{ lastError = `invalid-json from ${url}`; return null; });
        if (data?.block) return {block: data.block, error: null};
        // if API responded but no block, record that
        lastError = `no block returned from ${url}`;
      }catch(e){
        lastError = `${e && e.message ? e.message : String(e)} for ${url}`;
      }
    }
    return {block: null, error: lastError};
  }

  function renderBlockInto(el, block){
    if (!block) return;
    try{
      const config = typeof block.config === 'string' ? JSON.parse(block.config) : block.config;
      if (el.dataset.type === 'image' && config?.imageUrl){
        el.innerHTML = `<h3>${escapeHtml(block.name)}</h3><img src="${escapeAttr(config.imageUrl)}" alt="${escapeAttr(config.imageAlt||'')}" style="max-width:100%"/>`;
      } else if (el.dataset.type === 'video' && config?.videoUrl){
        el.innerHTML = `<h3>${escapeHtml(block.name)}</h3><video controls src="${escapeAttr(config.videoUrl)}" style="max-width:100%"></video>`;
      } else if (el.dataset.type === 'faq' && Array.isArray(config?.items)){
        el.innerHTML = `<h3>${escapeHtml(block.name)}</h3>` + config.items.map(it=>`<details><summary>${escapeHtml(it.question)}</summary><p>${escapeHtml(it.answer)}</p></details>`).join('');
      }
    }catch(e){console.error('renderBlockInto',e)}
  }

  function showError(el, msg){
    el.innerHTML = `<div class="thankyou-error" style="color:#9b2c2c;background:#fff5f5;padding:8px;border-radius:6px;border:1px solid #fecaca">Error: ${escapeHtml(msg||'unknown')}</div>`;
  }

  function escapeHtml(s){
    if (!s) return '';
    return String(s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }

  function escapeAttr(s){ return escapeHtml(s); }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const els = Array.from(document.querySelectorAll('.thankyou-placeholder'));
    if (!els.length) return;
    for (const el of els){
      const type = el.dataset.type;
      const shop = el.dataset.shop || window.location.hostname;
      try{
        const result = await fetchBlock(shop,type);
        if (result.error){
          showError(el, result.error);
        } else if (result.block){
          renderBlockInto(el,result.block);
        } else {
          showError(el, 'no active block');
        }
      }catch(e){
        console.error('hydrate block',e);
        showError(el, e && e.message ? e.message : String(e));
      }
    }
  });
})();
