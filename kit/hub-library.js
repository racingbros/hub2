/* release stamp — written from /VERSION by tools/sync-kit.js */
const HUB_VERSION = '2.0.4';

/* ════════════════════════════════════════
   HUB 2.0 — TOOL REGISTRY
   ════════════════════════════════════════ */
const TOOL_INFO = {
  'BIG.html':                 { desc:'Brand identity guideline — premium edition, 18 pages.',            formats:[] },
  'DISTRIBUTORS_GLOBAL.html': { desc:'World distributor map + list per division. Exports embeddable HTML.', formats:['csv','svg'] },
  'DISTRIBUTORS_TAIWAN.html': { desc:'Taiwan test-ride dealer map per brand. Exports embeddable HTML.',   formats:['csv','svg'] },
  'PUBSYS.html':              { desc:'Spec-table publisher: CSV in, styled tables and packs out.',       formats:['csv','tsv','svg','zip','pubsys'] },
  'POST_CREATOR.html':        { desc:'Layered social-post composer built on SVG templates.',             formats:['svg','png','jpg'] },
  'RDPM.html':                { desc:'Download-page menu manager. EN / 繁 links, dead-link check.',       formats:['html'] },
  'DNG_TO_PNG.html':          { desc:'Batch-convert DNG packs to resized PNG, repacked as ZIP.',          formats:['dng','zip','tif'] },
  'MANUAL_CREATOR.html':      { desc:'Block-based product manual builder with HTML / ZIP export.',        formats:['zip','csv'] },
  'READER.html':              { desc:'Catalogue flip-reader for page images and HTML pages.',            formats:['jpg','png','html'] },
  'PE.html':                  { desc:'Watermark and branding for photos and short video.',               formats:['jpg','png','mp4','mov'] },
  'PVP_VIEWER.html':          { desc:'Shock-dyno PVP plotter: force, velocity, displacement.',           formats:['pvp'] },
};
/* every extension each tool can open (open-with list) */
const OPENS = {
  'PE.html':                  ['jpg','jpeg','png','webp','gif','bmp','avif','mp4','mov','webm','m4v'],
  'DNG_TO_PNG.html':          ['dng','tif','tiff','zip','jpg','jpeg','png','webp'],
  'PVP_VIEWER.html':          ['pvp'],
  'PUBSYS.html':              ['pubsys','zip','csv','tsv','txt','svg'],
  'MANUAL_CREATOR.html':      ['zip','csv'],
  'POST_CREATOR.html':        ['svg','jpg','jpeg','png','webp'],
  'DISTRIBUTORS_TAIWAN.html': ['csv','svg'],
  'DISTRIBUTORS_GLOBAL.html': ['csv','svg'],
  'RDPM.html':                ['html','htm'],
  'READER.html':              ['html','htm','jpg','jpeg','png','webp','gif'],
};
/* default target per extension ('@view' = built-in viewer/editor) */
const DEFAULT_OPEN = {
  pvp:'PVP_VIEWER.html', dng:'DNG_TO_PNG.html', tif:'DNG_TO_PNG.html', tiff:'DNG_TO_PNG.html',
  pubsys:'PUBSYS.html', tsv:'PUBSYS.html',
  jpg:'PE.html', jpeg:'PE.html', png:'PE.html', webp:'PE.html', gif:'PE.html', bmp:'PE.html', avif:'PE.html',
  mp4:'PE.html', mov:'PE.html', webm:'PE.html', m4v:'PE.html',
  txt:'@view',
};
const KINDS = {
  image:['jpg','jpeg','png','webp','gif','bmp','avif','heic','heif','ico'],
  raw:['dng','tif','tiff','cr2','cr3','nef','arw','raf','orf','rw2'],
  video:['mp4','mov','webm','m4v','avi','mkv','wmv'],
  audio:['mp3','wav','aac','flac','ogg','m4a'],
  vector:['svg','ai','eps'],
  table:['csv','tsv','xlsx','xls','numbers','ods'],
  doc:['pdf','doc','docx','ppt','pptx','key','pages','odt','odf','rtf'],
  web:['html','htm'],
  data:['json','xml','yml','yaml'],
  text:['txt','md','log','ini','cfg','css','js','ts','srt','vtt'],
  archive:['zip','pubsys','rar','7z','gz','tar'],
  dyno:['pvp'],
  font:['ttf','otf','woff','woff2'],
  cad:['step','stp','iges','igs','stl','obj','3mf','dxf','dwg','sldprt','f3d'],
};
const FILTERS = [
  ['all','ALL'], ['image','IMAGES', ['image','raw']], ['video','VIDEO', ['video','audio']],
  ['table','TABLES', ['table','data']], ['vector','VECTOR', ['vector']], ['doc','DOCS', ['doc','web','text']],
  ['archive','PACKS', ['archive','dyno']], ['other','OTHER', null],
];
const TEXT_EDITABLE = new Set(['txt','md','log','ini','cfg','css','js','ts','json','xml','yml','yaml','csv','tsv','svg','html','htm','srt','vtt']);
const EXT_KIND = {};
Object.entries(KINDS).forEach(([k,list])=>list.forEach(e=>EXT_KIND[e]=k));
function extOf(n){ const m=/\.([a-z0-9]+)$/i.exec(n||''); return m ? m[1].toLowerCase() : ''; }
function kindOf(n){ return EXT_KIND[extOf(n)] || 'other'; }
function fmtSize(b){
  if(b==null) return '';
  if(b<1024) return b+' B';
  const u=['KB','MB','GB','TB']; let i=-1; do{ b/=1024; i++; }while(b>=1024 && i<u.length-1);
  return (b>=100?b.toFixed(0):b>=10?b.toFixed(1):b.toFixed(2))+' '+u[i];
}
function fmtDate(t){
  if(!t) return '';
  const d=new Date(t), p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function toolByPath(path){ return state.tools.find(t=>t.path===path) || null; }
function toolsFor(ext){
  return Object.entries(OPENS).filter(([,l])=>l.includes(ext)).map(([p])=>toolByPath(p)).filter(Boolean);
}
const ICON_FOLDER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M3 6h7l2 2h9v11H3z"/></svg>';

/* ════════════════════════════════════════
   HUB 2.0 — BRIDGE (hub side)
   ════════════════════════════════════════ */
const Bridge = (()=>{
  const ready = new Set();
  const queue = new Map();
  const caps = {};   /* toolId → extensions the tool can SAVE back (glue/<TOOL>.js) */
  const THEME_KEY = 'hub2_theme_v1';
  const VAR_KEYS = ['bg','surface','surface-2','border','border-strong','text','text-dim','text-mute','accent','accent-text','hover'];
  function frames(){ return [...document.querySelectorAll('#panels iframe[data-tool-id]')]; }
  function frameFor(id){ return frames().find(f=>f.dataset.toolId===id) || null; }
  function idFor(src){ const f=frames().find(f=>f.contentWindow===src); return f ? f.dataset.toolId : null; }
  function themePayload(){
    /* stock RACING / PIT WHITE schemes equal the kit defaults → send only the mode;
       any other scheme or custom color travels as explicit values */
    const custom = !['racing','pit'].includes(state.scheme) || Object.keys(state.customColors||{}).length;
    const vars = {};
    if(custom){ const cs = getComputedStyle(document.documentElement); VAR_KEYS.forEach(k=>{ const v = cs.getPropertyValue('--'+k).trim(); if(v) vars[k]=v; }); }
    return { theme: state.theme, vars, font: state.font===FONTS[0].value ? null : state.font };
  }
  function post(win, msg){ try{ win && win.postMessage(msg,'*'); }catch(e){} }
  function broadcastTheme(){
    const t = themePayload();
    try{ localStorage.setItem(THEME_KEY, JSON.stringify(t)); }catch(e){}
    frames().forEach(f=>post(f.contentWindow,{ type:'hub2:theme', theme:t }));
  }
  function libMsg(){ return { type:'hub2:lib', connected: Library.connected(), saveExports: !!state.lib.saveExports }; }
  function broadcastLib(){ frames().forEach(f=>post(f.contentWindow, libMsg())); }
  function flush(id){
    const q = queue.get(id); const f = frameFor(id);
    if(!q || !q.length || !f) return;
    queue.delete(id);
    q.forEach(file=>post(f.contentWindow,{ type:'hub2:open', file, id:Math.random().toString(36).slice(2) }));
  }
  function send(id, file){
    if(!queue.has(id)) queue.set(id,[]);
    queue.get(id).push(file);
    if(ready.has(id)) flush(id);
    else setTimeout(()=>{
      if(queue.get(id)?.includes(file)){
        queue.delete(id);
        toast('TOOL DID NOT RESPOND — IS IT A HUB 2.0 TOOL?');
      }
    }, 15000);
  }
  function forget(id){ ready.delete(id); }
  window.addEventListener('message', async e=>{
    const d = e.data; if(!d || typeof d.type!=='string' || !d.type.startsWith('hub2:')) return;
    const id = idFor(e.source); if(!id) return;
    const tool = state.tools.find(t=>t.id===id);
    if(d.type==='hub2:ready'){
      ready.add(id);
      caps[id] = Array.isArray(d.saves) ? d.saves : [];
      Library.refreshFilebar();
      post(e.source,{ type:'hub2:theme', theme: themePayload() });
      post(e.source, libMsg());
      flush(id);
    } else if(d.type==='hub2:palette'){
      try{ window.focus(); }catch(err){}
      Palette.open();
    } else if(d.type==='hub2:save-unsupported'){
      Library.saveFailed(id);
      toast(`${tool?tool.name:'TOOL'} CANNOT SAVE .${String(d.ext||'').toUpperCase()} — USE ITS OWN EXPORT`);
    } else if(d.type==='hub2:open-failed'){
      toast(`${tool?tool.name:'TOOL'} CANNOT OPEN ${d.name}`);
    } else if(d.type==='hub2:save' && d.blob){
      const saved = await Library.saveExport(id, d.name, d.blob);
      if(saved) post(e.source,{ type:'hub2:saved', name:saved });
      else downloadBlob(d.blob, d.name);
    }
  });
  function canSave(id, ext){ return (caps[id]||[]).includes(ext); }
  function requestSave(id, ext){
    const f = frameFor(id);
    if(!f || !ready.has(id)){ toast('TOOL IS STILL LOADING'); return false; }
    post(f.contentWindow,{ type:'hub2:save-request', ext });
    return true;
  }
  return { send, forget, broadcastTheme, broadcastLib, canSave, requestSave };
})();
function downloadBlob(blob, name){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=name||'download';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}

/* ════════════════════════════════════════
   HUB 2.0 — LIBRARY
   Folder on disk (File System Access API). Chosen once,
   remembered in IndexedDB, re-allowed with one click per session.
   ════════════════════════════════════════ */
const Library = (()=>{
  const supported = typeof window.showDirectoryPicker === 'function';
  let root = null, perm = 'none', stack = [], entries = [], sel = null;
  let query = '', filter = 'all', el = null, loading = false, rootCount = null;
  const thumbs = new Map();
  const picked = new Set();   /* multi-selection (ctrl / shift click) */
  let anchor = null;          /* shift-range anchor */
  let trashCount = 0;
  const TRASH = '.trash', DRAG_T = 'application/x-hub2-lib';
  const lastOpen = {};   /* toolId → { dir, path, name, ext, t, restored } — mirrored to state.lib.links so it survives reloads */
  function persistLinks(){
    const out = {};
    Object.entries(lastOpen).forEach(([id,lo])=>{ out[id] = { path: lo.path, name: lo.name, ext: lo.ext, t: lo.t }; });
    state.lib.links = out; saveState();
  }
  function restoreLinks(){
    Object.entries(state.lib.links||{}).forEach(([id,l])=>{
      if(!lastOpen[id] && l && l.name && state.tools.some(t=>t.id===id)) lastOpen[id] = { dir:null, path:l.path||[], name:l.name, ext:l.ext, t:l.t, restored:true };
    });
  }
  async function dirOf(lo){
    if(lo.dir) return lo.dir;
    try{ let d = root; for(const p of lo.path) d = await d.getDirectoryHandle(p); lo.dir = d; return d; }catch(e){ return null; }
  }
  let dragDepth = 0;

  const cwd = ()=> stack.length ? stack[stack.length-1].handle : root;
  const connected = ()=> !!root && perm==='granted';

  /* ── persistence of the folder handle ── */
  async function idbHandle(op, value){
    const db = await openDB();
    return new Promise((res,rej)=>{
      const tx = db.transaction('handles', op==='get'?'readonly':'readwrite');
      const st = tx.objectStore('handles');
      const r = op==='get' ? st.get('library') : op==='del' ? st.delete('library') : st.put({ id:'library', handle:value });
      r.onsuccess = ()=>res(op==='get' ? (r.result?.handle||null) : true);
      r.onerror = ()=>rej(r.error);
    });
  }
  async function init(){
    restoreLinks(); decorateTabs();
    if(!supported){ refreshChrome(); return; }
    try{
      root = await idbHandle('get');
      if(root){
        perm = await root.queryPermission({ mode:'readwrite' });
        if(perm==='granted') await load();
      }
    }catch(e){ root = null; perm = 'none'; }
    refreshChrome(); refreshFilebar();
  }
  async function connect(){
    if(!supported) return;
    try{
      const h = await window.showDirectoryPicker({ id:'hub2-library', mode:'readwrite' });
      root = h; perm = 'granted'; stack = []; sel = null;
      await idbHandle('put', h);
      await load();
      toast('LIBRARY CONNECTED  ·  '+h.name.toUpperCase());
    }catch(e){ if(e && e.name!=='AbortError') toast('COULD NOT OPEN FOLDER'); }
    refreshChrome();
  }
  async function reconnect(){
    if(!root) return connect();
    try{ perm = await root.requestPermission({ mode:'readwrite' }); }catch(e){ perm='denied'; }
    if(perm==='granted') await load();
    refreshChrome();
  }
  function refreshChrome(){
    render();
    updateBadges();
    refreshMenu();
    Bridge.broadcastLib();
  }
  function updateBadges(){
    const c = document.getElementById('lib-tab-count');
    if(c) c.textContent = connected() && rootCount!=null ? String(rootCount) : (root ? '!' : '–');
    const m = document.getElementById('menu-lib-status');
    if(m) m.textContent = statusLine();
  }
  function statusLine(){
    if(!supported) return 'NEEDS CHROME OR EDGE';
    if(!root) return 'NOT CONNECTED — CLICK TO SET UP';
    if(perm!=='granted') return 'CLICK TO RECONNECT  ·  '+root.name.toUpperCase();
    return `${root.name.toUpperCase()}  ·  ${rootCount??0} ITEM${rootCount===1?'':'S'}`;
  }

  /* ── reading ── */
  let idxCache = null;
  async function load(){
    const dir = cwd(); if(!dir) return;
    loading = true; idxCache = null;
    const list = [];
    try{
      for await (const [name, h] of dir.entries()){
        if(name.startsWith('.') || name.startsWith('~$') || name==='desktop.ini' || name==='Thumbs.db') continue;
        const path = stack.map(s=>s.name);
        if(h.kind==='directory'){ list.push({ name, handle:h, dir:true, kind:'folder', ext:'', size:null, mtime:0, path, dirHandle:dir }); continue; }
        let f=null; try{ f = await h.getFile(); }catch(e){}
        list.push({ name, handle:h, dir:false, kind:kindOf(name), ext:extOf(name), size:f?f.size:null, mtime:f?f.lastModified:0, type:f?f.type:'' , file:f, path, dirHandle:dir });
      }
    }catch(e){
      if(e && e.name==='NotAllowedError'){ perm='prompt'; }
      else if(e && e.name==='NotFoundError'){ stack=[]; }
    }
    thumbs.forEach(u=>URL.revokeObjectURL(u)); thumbs.clear();
    entries = list;
    if(!stack.length) rootCount = list.length;
    loading = false;
    if(sel && !entries.find(x=>x.name===sel)) sel = null;
    [...picked].forEach(n=>{ if(!entries.find(x=>x.name===n)) picked.delete(n); });
    trashCount = await countTrash();
    render(); updateBadges();
    /* content sniffing for ambiguous formats → accurate OPENS IN column */
    const amb = list.filter(x=>x.file && ['zip','csv','html','htm'].includes(x.ext));
    if(amb.length){
      await Promise.all(amb.map(async x=>{ x.sniff = await sniff(x, x.file); }));
      if(entries===list) render();
    }
    /* table / pack previews for grid cards */
    const pv = list.filter(x=>x.file && ['csv','tsv','zip','pubsys'].includes(x.ext) && x.size < 4*1024*1024);
    if(pv.length){
      await Promise.all(pv.map(x=>makePreview(x).catch(()=>{})));
      if(entries===list && state.lib.view==='grid') render();
    }
  }
  function visible(){
    const q = query.trim().toLowerCase();
    const fdef = FILTERS.find(f=>f[0]===filter);
    const known = new Set(FILTERS.filter(f=>f[2]).flatMap(f=>f[2]));
    const list = entries.filter(x=>{
      if(q && !x.name.toLowerCase().includes(q)) return false;
      if(filter==='all') return true;
      if(x.dir) return false;
      if(filter==='other') return !known.has(x.kind);
      return !!(fdef && fdef[2] && fdef[2].includes(x.kind));
    });
    const key = state.lib.sort || 'name', dir = state.lib.asc ? 1 : -1;
    list.sort((a,b)=>{
      if(a.dir!==b.dir) return a.dir ? -1 : 1;
      let r = 0;
      if(key==='size') r = (a.size||0)-(b.size||0);
      else if(key==='date') r = a.mtime-b.mtime;
      else if(key==='type') r = (a.ext||'').localeCompare(b.ext||'') || a.name.localeCompare(b.name,undefined,{numeric:true});
      else r = a.name.localeCompare(b.name, undefined, { numeric:true, sensitivity:'base' });
      return r*dir;
    });
    return list;
  }
  /* ── previews for grid cards + details pane ── */
  function parseCSVRows(t, max, sep){
    const rows = []; let row = [], f = '', q = false;
    for(let i=0;i<t.length && rows.length<max;i++){
      const c = t[i];
      if(q){ if(c==='"'){ if(t[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; }
      else if(c==='"') q=true;
      else if(c===sep){ row.push(f); f=''; }
      else if(c==='\n' || c==='\r'){ if(c==='\r' && t[i+1]==='\n') i++; row.push(f); rows.push(row); row=[]; f=''; }
      else f+=c;
    }
    if((f || row.length) && rows.length<max){ row.push(f); rows.push(row); }
    return rows;
  }
  async function makePreview(x){
    if(x.preview) return x.preview;
    const f = x.file || await x.handle.getFile();
    let p = null;
    if(['csv','tsv'].includes(x.ext)){
      const t = (await f.slice(0, 64*1024).text()).replace(/^\ufeff/,'');
      const rows = parseCSVRows(t, 8, x.ext==='tsv'?'\t':',');
      const lines = (await f.slice(0, Math.min(f.size, 4*1024*1024)).text()).split(/\r?\n/).filter(Boolean).length;
      p = { kind:'table', rows, info: `${Math.max(0,lines-1)} ROWS · ${(rows[0]||[]).length} COLS` };
    } else if(['zip','pubsys'].includes(x.ext)){
      const names = await zipNames(f);
      p = { kind:'list', items: names.filter(n=>!n.endsWith('/')).slice(0, 14), info: `${names.filter(n=>!n.endsWith('/')).length} FILES IN PACK` };
    } else if(x.kind==='image' || x.ext==='svg'){
      const url = thumbFor(Object.assign({}, x, { file:f }));
      let dims = '';
      if(x.ext==='svg'){
        const t = await f.slice(0, 8192).text();
        const vb = /viewBox=["']\s*[\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(t);
        const w = /<svg[^>]*\swidth=["']([\d.]+)/i.exec(t), h = /<svg[^>]*\sheight=["']([\d.]+)/i.exec(t);
        if(w && h) dims = `${Math.round(w[1])} × ${Math.round(h[1])}`; else if(vb) dims = `${Math.round(vb[1])} × ${Math.round(vb[2])} (VIEWBOX)`;
      } else if(url){
        dims = await new Promise(res=>{ const im = new Image(); im.onload=()=>res(`${im.naturalWidth} × ${im.naturalHeight} PX`); im.onerror=()=>res(''); im.src=url; });
      }
      p = { kind:'image', url, info: dims };
    } else if(x.kind==='video'){
      const url = URL.createObjectURL(f);
      const meta = await new Promise(res=>{ const v=document.createElement('video'); v.preload='metadata'; v.onloadedmetadata=()=>res(`${v.videoWidth} × ${v.videoHeight} · ${Math.round(v.duration)} S`); v.onerror=()=>res(''); v.src=url; });
      URL.revokeObjectURL(url);
      p = { kind:'info', info: meta };
    } else if(x.ext==='html' || x.ext==='htm'){
      const t = await f.slice(0, 256*1024).text();
      const ti = /<title[^>]*>([^<]*)<\/title>/i.exec(t);
      p = { kind:'text', text: ti ? ti[1].trim() : '(no title)', info: 'HTML PAGE' };
    } else if(TEXT_EDITABLE.has(x.ext) || x.kind==='text' || x.kind==='data'){
      const t = await f.slice(0, 4096).text();
      p = { kind:'text', text: t.split(/\r?\n/).slice(0, 14).join('\n'), info: '' };
    } else {
      p = { kind:'info', info: '' };
    }
    x.preview = p; return p;
  }
  function previewBox(x, big){
    const p = x.preview;
    if(!p) return `<div class="pv pv-wait">${escapeHtml((x.ext||'?').toUpperCase())}</div>`;
    if(p.kind==='image' && p.url) return `<div class="pv pv-img"><img src="${p.url}" alt=""></div>`;
    if(p.kind==='table') return `<div class="pv pv-tbl"><table>${p.rows.slice(0, big?8:5).map((r,i)=>`<tr>${r.slice(0, big?6:4).map(c=>i?`<td>${escapeHtml(c)}</td>`:`<th>${escapeHtml(c)}</th>`).join('')}</tr>`).join('')}</table></div>`;
    if(p.kind==='list') return `<div class="pv pv-list">${p.items.slice(0, big?14:6).map(n=>`<div>${escapeHtml(n)}</div>`).join('')}</div>`;
    if(p.kind==='text') return `<div class="pv pv-text"><pre>${escapeHtml(p.text)}</pre></div>`;
    return `<div class="pv pv-wait">${escapeHtml((x.ext||'?').toUpperCase())}</div>`;
  }
  function detailsHTML(x){
    if(!x || x.dir) return '';
    const star = isStar(x.path, x.name), lo = lastOpenedOf(x.path, x.name);
    const p = x.preview;
    const rows = [
      ['TYPE', (x.ext||'—').toUpperCase()+(x.sniff?'  ·  '+x.sniff.why:'')],
      ['SIZE', fmtSize(x.size)],
      ['MODIFIED', fmtDate(x.mtime)],
      p && p.info ? [p.kind==='image'?'DIMENSIONS':'CONTENT', p.info] : null,
      ['OPENS IN', defaultLabel(x)],
      ['LAST OPENED', lo ? fmtDate(lo) : '—'],
      ['FOLDER', [root?root.name:'LIBRARY', ...(x.path||[])].join(' / ')],
    ].filter(Boolean);
    return `<div class="ld-prev">${previewBox(x, true)}</div>
      <div class="ld-head"><span class="ld-name">${escapeHtml(x.name)}</span>
        <button class="star ${star?'on':''}" data-d="star" title="${star?'Unstar':'Star'}">${star?'★':'☆'}</button></div>
      <dl class="ld-meta">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>
      <div class="ld-acts"><button class="lbtn primary" data-d="open">OPEN</button><button class="lbtn" data-d="more">OPEN WITH…</button><button class="lbtn icon" data-d="dl" title="DOWNLOAD"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M12 3v13M6 11l6 6 6-6M4 21h16"/></svg></button></div>`;
  }
  function paintDetails(){
    const aside = el && el.querySelector('#lib-details'); if(!aside) return;
    const x = picked.size > 1 ? null : entries.find(e=>e.name===sel && !e.dir);
    el.querySelector('#lib-split')?.classList.toggle('has-details', !!x);
    if(!x){ aside.innerHTML=''; return; }
    aside.innerHTML = detailsHTML(x);
    aside.querySelectorAll('[data-d]').forEach(b=>b.onclick = e=>{
      const a = b.dataset.d;
      if(a==='open') open(x);
      else if(a==='star') toggleStar(x);
      else if(a==='dl') download(x);
      else { const bb=b.getBoundingClientRect(); showCtx(x, bb.left, bb.bottom+4); }
    });
    if(!x.preview) makePreview(x).then(()=>{ if(sel===x.name) paintDetails(); }).catch(()=>{});
  }
  function thumbFor(x){
    if(x.dir || !x.file) return null;
    if(!(x.kind==='image' || x.ext==='svg')) return null;
    if(x.size > 25*1024*1024) return null;
    const k = x.name+'|'+x.mtime;
    if(!thumbs.has(k)) thumbs.set(k, URL.createObjectURL(x.file));
    return thumbs.get(k);
  }

  /* ── target resolution ── */
  async function sniff(x, file){
    const ext = x.ext;
    try{
      if(ext==='zip'){
        const names = await zipNames(file);
        if(names.some(n=>/\.dng$/i.test(n))) return { path:'DNG_TO_PNG.html', why:'DNG PACK' };
        if(names.includes('project.json') && names.some(n=>/MANUAL_CREATOR\.html$/i.test(n))) return { path:'MANUAL_CREATOR.html', why:'MANUAL PROJECT' };
        if(names.includes('manifest.json')) return { path:'PUBSYS.html', why:'PUBSYS PACK' };
      } else if(ext==='csv'){
        const head = (await file.slice(0,4096).text()).replace(/^﻿/,'').split(/\r?\n/)[0].toLowerCase();
        if(/^"?city"?,/.test(head)) return { path:'DISTRIBUTORS_TAIWAN.html', why:'STORE LIST · CITY' };
        if(/^"?region"?,/.test(head)) return { path:'DISTRIBUTORS_GLOBAL.html', why:'STORE LIST · COUNTRY' };
        if(head.includes('brand') && head.includes('model')) return { path:'PUBSYS.html', why:'SPEC TABLE' };
      } else if(ext==='html' || ext==='htm'){
        const t = await file.slice(0, 2*1024*1024).text();
        if(/const\s+data\s*=/.test(t) && /currentLang/.test(t)) return { path:'RDPM.html', why:'DOWNLOAD MENU' };
        return { path:'READER.html', why:'HTML PAGE' };
      }
    }catch(e){}
    return null;
  }
  async function zipNames(file){
    const tailLen = Math.min(file.size, 66000);
    const tail = new DataView(await file.slice(file.size-tailLen).arrayBuffer());
    let eocd = -1;
    for(let i=tailLen-22;i>=0;i--){ if(tail.getUint32(i,true)===0x06054b50){ eocd=i; break; } }
    if(eocd<0) return [];
    const cdSize = tail.getUint32(eocd+12,true), cdOff = tail.getUint32(eocd+16,true);
    if(cdOff+cdSize > file.size) return [];
    const cd = new DataView(await file.slice(cdOff, cdOff+cdSize).arrayBuffer());
    const names = [], dec = new TextDecoder();
    let p = 0;
    while(p+46 <= cd.byteLength && cd.getUint32(p,true)===0x02014b50 && names.length<5000){
      const nl = cd.getUint16(p+28,true), xl = cd.getUint16(p+30,true), cl = cd.getUint16(p+32,true);
      names.push(dec.decode(new Uint8Array(cd.buffer, cd.byteOffset+p+46, nl)));
      p += 46+nl+xl+cl;
    }
    return names;
  }
  async function open(x, forcePath){
    if(!x) return;
    if(x.dir){ stack.push({ name:x.name, handle:x.handle }); sel=null; picked.clear(); await load(); return; }
    let file; try{ file = await x.handle.getFile(); }catch(e){ toast('FILE IS NO LONGER AVAILABLE'); return load(); }
    if(forcePath==='@view') return viewer(x, file);
    if(forcePath){ const t = toolByPath(forcePath); if(t) return sendTo(t, x, file); }
    const tools = toolsFor(x.ext);
    const remembered = state.lib.assoc[x.ext];
    if(remembered==='@view') return viewer(x, file);
    if(remembered && toolByPath(remembered)) return sendTo(toolByPath(remembered), x, file);
    const hit = x.sniff || await sniff(x, file);
    if(hit && toolByPath(hit.path)) return sendTo(toolByPath(hit.path), x, file);
    const def = DEFAULT_OPEN[x.ext];
    if(def==='@view') return viewer(x, file);
    if(def && toolByPath(def)) return sendTo(toolByPath(def), x, file);
    if(tools.length===1) return sendTo(tools[0], x, file);
    if(tools.length>1) return chooser(x, file, tools);
    return viewer(x, file);
  }
  async function sendTo(tool, x, file){
    const path = x.path || stack.map(s=>s.name);
    lastOpen[tool.id] = { dir: x.dirHandle || cwd(), path, name: x.name, ext: x.ext, t: Date.now() };
    persistLinks();
    addRecent(path, x.name, x.ext, tool.path);
    decorateTabs();
    await setActive(tool.id);
    Bridge.send(tool.id, file);
  }
  /* ── recent + starred (persisted in state.lib, keyed by folder path inside the library) ── */
  const keyOf = (path, name)=> [...(path||[]), name].join('/');
  function addRecent(path, name, ext, tool){
    const k = keyOf(path, name);
    const r = (state.lib.recent||[]).filter(e=>keyOf(e.path,e.name)!==k);
    r.unshift({ path, name, ext, tool, t: Date.now() });
    state.lib.recent = r.slice(0, 12); saveState(); refreshMenu();
  }
  function isStar(path, name){ return (state.lib.stars||[]).includes(keyOf(path, name)); }
  function toggleStar(x){
    const k = keyOf(x.path||stack.map(s=>s.name), x.name);
    const st = new Set(state.lib.stars||[]);
    if(st.has(k)){ st.delete(k); toast('UNSTARRED  ·  '+x.name); } else { st.add(k); toast('STARRED  ·  '+x.name); }
    state.lib.stars = [...st]; saveState(); render(); refreshMenu();
  }
  function lastOpenedOf(path, name){ const k = keyOf(path, name); const e = (state.lib.recent||[]).find(e=>keyOf(e.path,e.name)===k); return e ? e.t : 0; }
  async function resolve(path, name){
    if(!connected()) return null;
    try{
      let d = root; for(const p of path) d = await d.getDirectoryHandle(p);
      const h = await d.getFileHandle(name);
      return { name, handle:h, dir:false, kind:kindOf(name), ext:extOf(name), path, dirHandle:d };
    }catch(e){ return null; }
  }
  async function reveal(path, name){
    if(!connected()){ setActive('library'); return; }
    stack = []; let d = root;
    try{ for(const p of path||[]){ d = await d.getDirectoryHandle(p); stack.push({ name:p, handle:d }); } }catch(e){ stack = []; }
    sel = name; picked.clear(); query=''; filter='all';
    if(state.activeTab==='library') await load(); else await setActive('library');
    setTimeout(()=>el && el.querySelector(`[data-n="${cssEsc(name)}"]`)?.scrollIntoView({ block:'center' }), 60);
  }
  async function openKey(k, toolPath){
    if(!connected()){ setActive('library'); toast(root ? 'ALLOW LIBRARY ACCESS FIRST' : 'CONNECT THE LIBRARY FOLDER FIRST'); return; }
    const parts = String(k).split('/'), name = parts.pop();
    const x = await resolve(parts, name);
    if(!x){
      toast('NOT FOUND  ·  '+name);
      state.lib.recent = (state.lib.recent||[]).filter(e=>keyOf(e.path,e.name)!==k);
      saveState(); render(); refreshMenu(); return;
    }
    open(x, toolPath && toolByPath(toolPath) ? toolPath : undefined);
  }
  function ago(t){
    const s = Math.max(1, Math.round((Date.now()-t)/1000));
    if(s<60) return 'NOW'; const m = Math.round(s/60); if(m<60) return m+' MIN';
    const h = Math.round(m/60); if(h<24) return h+' H'; const d = Math.round(h/24); return d+' D';
  }
  function chip(path, name, ext, sub, tool){
    const k = keyOf(path, name);
    return `<button class="qchip" data-rk="${escapeAttr(k)}" data-rt="${escapeAttr(tool||'')}" title="${escapeAttr((path.length?path.join(' / ')+' / ':'')+name)}">
      <span class="ftag">${escapeHtml(ext||'—')}</span><span class="qn">${escapeHtml(name)}</span><span class="qs">${escapeHtml(sub||'')}</span></button>`;
  }
  function quickHTML(compact){
    const stars = (state.lib.stars||[]).map(k=>{ const p=k.split('/'), n=p.pop(); return chip(p, n, extOf(n), '★', ''); });
    const rec = (state.lib.recent||[]).slice(0, compact?6:10).map(e=>{ const t=toolByPath(e.tool); return chip(e.path, e.name, e.ext, (t?t.name+' · ':'')+ago(e.t), e.tool); });
    if(!stars.length && !rec.length) return '';
    return `<div class="quick ${compact?'compact':''}">
      ${stars.length?`<div class="qrow"><span class="qlab">STARRED</span><div class="qlist">${stars.join('')}</div></div>`:''}
      ${rec.length?`<div class="qrow"><span class="qlab">RECENT</span><div class="qlist">${rec.join('')}</div></div>`:''}
    </div>`;
  }
  function bindQuick(scope){
    scope.querySelectorAll('[data-rk]').forEach(b=>{
      b.onclick = ()=>openKey(b.dataset.rk, b.dataset.rt || undefined);
    });
  }
  function menuStrip(){ return connected() ? quickHTML(true) : ''; }
  function refreshMenu(){
    const box = document.getElementById('menu-quick');
    if(box){ box.innerHTML = menuStrip(); bindQuick(box); }
  }
  /* ── open-file bar + tab badges ── */
  const pending = {};   /* toolId → { mode:'over'|'copy', t } while a SAVE is in flight */
  function decorateTabs(){
    state.tools.forEach(t=>{
      const tab = document.querySelector(`#tab-bar .tab[data-tab="${cssEsc(t.id)}"]`); if(!tab) return;
      let sp = tab.querySelector('.tab-file');
      const lo = lastOpen[t.id];
      if(!lo){ sp && sp.remove(); return; }
      if(!sp){ sp = document.createElement('span'); sp.className='tab-file'; tab.appendChild(sp); }
      sp.textContent = lo.name; sp.title = 'Open from LIBRARY: '+keyOf(lo.path, lo.name);
    });
  }
  function refreshFilebar(){
    const bar = document.getElementById('filebar'); if(!bar) return;
    const id = state.activeTab, lo = lastOpen[id], tool = state.tools.find(t=>t.id===id);
    if(!lo || !tool){ bar.hidden = true; bar.innerHTML=''; return; }
    const can = Bridge.canSave(id, lo.ext);
    const crumbs = [root?root.name:'LIBRARY', ...lo.path].map(p=>`<span>${escapeHtml(p.toUpperCase())}</span><i>/</i>`).join('');
    bar.hidden = false;
    bar.innerHTML = `
      <span class="fb-lab">LIBRARY FILE</span>
      <span class="fb-path">${crumbs}<b>${escapeHtml(lo.name)}</b></span>
      <span class="fb-meta">${lo.restored ? 'LINKED FROM LAST SESSION · REOPEN LOADS THE FILE' : 'OPENED '+fmtDate(lo.t).slice(11)}${pending[id]?'  ·  SAVING…':''}</span>
      <span class="fb-acts">
        <button class="lbtn sm primary" data-fb="over" ${can?'':'disabled'} title="${can?'Write the tool\'s current work back over '+escapeAttr(lo.name):'This tool has no save for .'+escapeAttr(lo.ext)+' — its own exports still land in the library'}">SAVE</button>
        <button class="lbtn sm" data-fb="copy" ${can?'':'disabled'} title="Save as a new file next to the original">SAVE COPY</button>
        <button class="lbtn sm" data-fb="reopen" title="Load the file from the LIBRARY into the tool again (drops unsaved changes in the tool)">REOPEN</button>
        <button class="lbtn sm" data-fb="show" title="Show in LIBRARY">SHOW</button>
        <button class="lbtn sm icon" data-fb="close" title="Detach this file from the tool">✕</button>
      </span>`;
    bar.querySelectorAll('[data-fb]').forEach(b=>b.onclick = ()=>{
      const a = b.dataset.fb;
      if(a==='over' || a==='copy'){
        if(!connected()){ toast('ALLOW LIBRARY ACCESS FIRST'); setActive('library'); return; }
        pending[id] = { mode:a, t:Date.now() };
        if(!Bridge.requestSave(id, lo.ext)) delete pending[id];
        refreshFilebar();
        setTimeout(()=>{ if(pending[id] && Date.now()-pending[id].t>=60000){ delete pending[id]; refreshFilebar(); } }, 60500);
      } else if(a==='show'){
        reveal(lo.path, lo.name);
      } else if(a==='reopen'){
        (async()=>{ const x = await resolve(lo.path, lo.name); if(!x){ toast('NOT FOUND  ·  '+lo.name); return; }
          const tool = state.tools.find(t=>t.id===id); if(tool) sendTo(tool, x, await x.handle.getFile()); })();
      } else if(a==='close'){ delete lastOpen[id]; persistLinks(); decorateTabs(); refreshFilebar(); }
    });
  }
  function saveFailed(id){ delete pending[id]; refreshFilebar(); }
  function defaultLabel(x){
    if(x.dir) return 'OPEN FOLDER';
    const r = state.lib.assoc[x.ext] || (x.sniff && x.sniff.path) || DEFAULT_OPEN[x.ext];
    if(r==='@view') return TEXT_EDITABLE.has(x.ext) ? 'TEXT EDITOR' : 'QUICK VIEW';
    const t = r && toolByPath(r);
    if(t) return t.name;
    const tools = toolsFor(x.ext);
    if(tools.length===1) return tools[0].name;
    if(tools.length>1) return 'CHOOSE…';
    return TEXT_EDITABLE.has(x.ext) ? 'TEXT EDITOR' : 'QUICK VIEW';
  }

  /* ── writing ── */
  function cleanName(n){ return String(n||'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').trim() || 'file'; }
  async function exists(dir, name){
    try{ await dir.getFileHandle(name); return true; }catch(e){}
    try{ await dir.getDirectoryHandle(name); return true; }catch(e){}
    return false;
  }
  async function uniqueName(dir, name){
    if(!(await exists(dir,name))) return name;
    const m = /^(.*?)(\.[^.]+)?$/.exec(name), base=m[1], ext=m[2]||'';
    for(let i=2;i<999;i++){ const n=`${base} (${i})${ext}`; if(!(await exists(dir,n))) return n; }
    return `${base} ${Date.now()}${ext}`;
  }
  async function writeFile(dir, name, data){
    const fh = await dir.getFileHandle(name, { create:true });
    const w = await fh.createWritable();
    await w.write(data); await w.close();
    return fh;
  }
  async function saveExport(toolId, name, blob){
    const pd = pending[toolId] && Date.now()-pending[toolId].t < 60000 ? pending[toolId] : null;
    if(!connected() || (!state.lib.saveExports && !pd)) return null;
    const lo = lastOpen[toolId];
    const dir = (lo && await dirOf(lo)) || root;
    let n = cleanName(name);
    try{
      if(pd && lo){
        /* SAVE: overwrite the opened file (same base name if the tool exports another extension); SAVE COPY: new file beside it */
        delete pending[toolId];
        const base = lo.name.replace(/\.[^.]+$/,''), ex = extOf(n) || lo.ext;
        n = pd.mode==='over' ? (ex===lo.ext ? lo.name : base+'.'+ex) : await uniqueName(dir, base+' (edited).'+ex);
        if(pd.mode==='over'){ lo.t = Date.now(); lo.restored = false; persistLinks(); }
        refreshFilebar();
      }
      else if(!(lo && lo.name===n)) n = await uniqueName(dir, n);
      await writeFile(dir, n, blob);
      if(dir===cwd()) await load(); else if(dir===root){ rootCount = null; }
      toast((lo && lo.name===n ? 'UPDATED IN LIBRARY  ·  ' : 'SAVED TO LIBRARY  ·  ')+n);
      return n;
    }catch(e){
      if(e && e.name==='NotAllowedError'){ perm='prompt'; refreshChrome(); }
      toast('LIBRARY WRITE FAILED — DOWNLOADING INSTEAD');
      return null;
    }
  }
  async function importFiles(files, dir){
    dir = dir || cwd();
    if(!connected()){ toast('CONNECT THE LIBRARY FOLDER FIRST'); setActive('library'); return 0; }
    let n = 0;
    for(const f of files){
      try{ const nm = await uniqueName(dir, cleanName(f.name)); await writeFile(dir, nm, f); n++; }catch(e){}
    }
    return n;
  }
  async function copyDir(src, dest){
    const target = await dest.getDirectoryHandle(await uniqueName(dest, cleanName(src.name)), { create:true });
    let n = 0;
    for await (const [name, h] of src.entries()){
      if(h.kind==='directory') n += await copyDir(h, target);
      else { try{ await writeFile(target, cleanName(name), await h.getFile()); n++; }catch(e){} }
    }
    return n;
  }
  async function importDataTransfer(dt, dir){
    if(!connected()){ toast('CONNECT THE LIBRARY FOLDER FIRST'); setActive('library'); return; }
    dir = dir || cwd();
    const items = [...(dt.items||[])].filter(i=>i.kind==='file');
    let n = 0;
    if(items.length && typeof items[0].getAsFileSystemHandle==='function'){
      const handles = await Promise.all(items.map(i=>i.getAsFileSystemHandle().catch(()=>null)));
      for(const h of handles){
        if(!h) continue;
        try{
          if(h.kind==='directory') n += await copyDir(h, dir);
          else { const f = await h.getFile(); await writeFile(dir, await uniqueName(dir, cleanName(f.name)), f); n++; }
        }catch(e){}
      }
    } else {
      n = await importFiles([...(dt.files||[])], dir);
    }
    if(dir===cwd()) await load(); else if(dir===root){ stack=[]; await load(); }
    toast(n ? `ADDED ${n} FILE${n===1?'':'S'} TO LIBRARY` : 'NOTHING WAS ADDED');
  }
  function targets(x){ return x && picked.has(x.name) && picked.size>1 ? entries.filter(e=>picked.has(e.name)) : (x ? [x] : entries.filter(e=>picked.has(e.name))); }
  async function remove(x){
    const items = targets(x); if(!items.length) return;
    const label = items.length===1 ? `"${items[0].name}"` : items.length+' ITEMS';
    showConfirm({ title:'MOVE TO TRASH', msg:`MOVE ${label} TO THE LIBRARY TRASH? YOU CAN RESTORE FROM TRASH LATER.`, okLabel:'MOVE TO TRASH', danger:true,
      onOk: async ()=>{ const n = await trashItems(items); toast(n ? `MOVED ${n} TO TRASH` : 'NOTHING WAS MOVED'); picked.clear(); sel = null; await load(); }});
  }
  /* ── move / copy primitives (FileSystemHandle.move when the browser has it, copy + remove otherwise) ── */
  async function copyInto(h, dest, name){
    if(h.kind==='directory'){
      const t = await dest.getDirectoryHandle(name, { create:true });
      for await (const [n, c] of h.entries()) await copyInto(c, t, n);
    } else await writeFile(dest, name, await h.getFile());
  }
  async function moveHandle(x, fromDir, dest, name){
    if(typeof x.handle.move==='function'){ try{ await x.handle.move(dest, name); return; }catch(e){ /* fall back */ } }
    await copyInto(x.handle, dest, name);
    await fromDir.removeEntry(x.name, { recursive:true });
  }
  function rekey(oldPath, oldName, newPath, newName){
    const ok = keyOf(oldPath, oldName), nk = keyOf(newPath, newName);
    let ch = false;
    (state.lib.recent||[]).forEach(e=>{ if(keyOf(e.path,e.name)===ok){ e.path=newPath; e.name=newName; ch=true; } });
    state.lib.stars = (state.lib.stars||[]).map(k=>{ if(k===ok){ ch=true; return nk; } return k; });
    Object.values(lastOpen).forEach(lo=>{ if(keyOf(lo.path, lo.name)===ok){ lo.path=newPath; lo.name=newName; lo.dir=null; ch=true; } });
    if(ch){ persistLinks(); refreshMenu(); decorateTabs(); refreshFilebar(); }
  }
  async function moveItems(items, dest, destPath){
    const here = stack.map(s=>s.name);
    if(keyOf(destPath,'')===keyOf(here,'')) return 0;
    let n = 0;
    for(const x of items){
      const own = [...(x.path||here), x.name];
      if(x.dir && keyOf(destPath,'').startsWith(keyOf(own,''))){ toast('A FOLDER CANNOT MOVE INTO ITSELF'); continue; }
      try{
        const nm = await uniqueName(dest, x.name);
        await moveHandle(x, x.dirHandle || cwd(), dest, nm);
        if(!x.dir) rekey(x.path||here, x.name, destPath, nm);
        n++;
      }catch(e){ toast('MOVE FAILED  ·  '+x.name); }
    }
    return n;
  }
  /* ── trash: LIBRARY/.trash + .trash/index.json (original location) ── */
  async function trashDir(create){ try{ return await root.getDirectoryHandle(TRASH, { create:!!create }); }catch(e){ return null; } }
  async function readTrashIndex(td){
    try{ return JSON.parse(await (await (await td.getFileHandle('index.json')).getFile()).text()) || {}; }catch(e){ return {}; }
  }
  async function writeTrashIndex(td, idx){ await writeFile(td, 'index.json', JSON.stringify(idx, null, 1)); }
  async function countTrash(){ const td = connected() ? await trashDir(false) : null; if(!td) return 0; return Object.keys(await readTrashIndex(td)).length; }
  async function trashItems(items){
    const td = await trashDir(true); if(!td) return 0;
    const idx = await readTrashIndex(td); const here = stack.map(s=>s.name); let n = 0;
    for(const x of items){
      const tn = Date.now().toString(36)+Math.random().toString(36).slice(2,6)+'__'+x.name;
      try{
        await moveHandle(x, x.dirHandle || cwd(), td, tn);
        idx[tn] = { path: x.path||here, name: x.name, dir: !!x.dir, t: Date.now(), size: x.size||null };
        n++;
      }catch(e){}
    }
    await writeTrashIndex(td, idx);
    return n;
  }
  async function restoreTrash(tn){
    const td = await trashDir(false); if(!td) return false;
    const idx = await readTrashIndex(td); const it = idx[tn]; if(!it) return false;
    let d = root; for(const p of it.path) d = await d.getDirectoryHandle(p, { create:true });
    const h = it.dir ? await td.getDirectoryHandle(tn) : await td.getFileHandle(tn);
    const nm = await uniqueName(d, it.name);
    await moveHandle({ handle:h, name:tn }, td, d, nm);
    delete idx[tn]; await writeTrashIndex(td, idx);
    return nm;
  }
  async function purgeTrash(tn){
    const td = await trashDir(false); if(!td) return;
    const idx = await readTrashIndex(td);
    for(const k of (tn ? [tn] : Object.keys(idx))){ try{ await td.removeEntry(k, { recursive:true }); }catch(e){} delete idx[k]; }
    if(!tn){ for await (const [k] of td.entries()){ if(k!=='index.json'){ try{ await td.removeEntry(k, { recursive:true }); }catch(e){} } } }
    await writeTrashIndex(td, idx);
  }
  /* small self-contained modal used by MOVE TO… and TRASH */
  function sheet(title, sub, bodyHTML, footHTML){
    let m = document.getElementById('lib-sheet');
    if(!m){ m = document.createElement('div'); m.id='lib-sheet'; m.className='lmodal'; document.body.appendChild(m);
      m.addEventListener('click', e=>{ if(e.target===m || e.target.closest('[data-close]')) m.classList.remove('show'); }); }
    m.innerHTML = `<div class="lbox"><div class="lbox-head"><div class="lbox-title">${escapeHtml(title)}<small>${escapeHtml(sub||'')}</small></div><button class="lbtn icon" data-close aria-label="Close">✕</button></div>
      <div class="lbox-body">${bodyHTML}</div>${footHTML?`<div class="lbox-foot">${footHTML}</div>`:''}</div>`;
    m.classList.add('show'); return m;
  }
  async function folderTree(){
    const out = [{ path:[], name:(root.name||'LIBRARY'), depth:0 }];
    async function walk(d, path, depth){
      if(depth>4) return;
      const kids = [];
      for await (const [n, h] of d.entries()) if(h.kind==='directory' && !n.startsWith('.')) kids.push([n,h]);
      kids.sort((a,b)=>a[0].localeCompare(b[0], undefined, { numeric:true }));
      for(const [n,h] of kids){ out.push({ path:[...path, n], name:n, depth }); await walk(h, [...path, n], depth+1); }
    }
    await walk(root, [], 1);
    return out;
  }
  /* every file in the library (for the command palette); skips dot-folders such as .trash */
  async function indexAll(){
    if(!connected()) return [];
    if(idxCache && Date.now()-idxCache.t < 15000) return idxCache.list;
    const out = [];
    async function walk(d, path, depth){
      if(depth>6 || out.length>5000) return;
      for await (const [n, h] of d.entries()){
        if(n.startsWith('.')) continue;
        if(h.kind==='directory') await walk(h, [...path, n], depth+1);
        else out.push({ path, name:n, ext:extOf(n), kind:kindOf(n) });
      }
    }
    try{ await walk(root, [], 0); }catch(e){}
    idxCache = { t: Date.now(), list: out };
    return out;
  }
  async function moveDialog(x){
    const items = targets(x); if(!items.length) return;
    const tree = await folderTree(), here = keyOf(stack.map(s=>s.name),'');
    const m = sheet('MOVE TO', items.length===1 ? items[0].name : items.length+' ITEMS',
      `<div class="tree">${tree.map((f,i)=>`<button class="tree-row ${keyOf(f.path,'')===here?'here':''}" data-i="${i}" style="padding-left:${14+f.depth*18}px" ${keyOf(f.path,'')===here?'disabled':''}>${ICON_FOLDER}<span>${escapeHtml(f.depth? f.name : f.name.toUpperCase())}</span>${keyOf(f.path,'')===here?'<small>HERE</small>':''}</button>`).join('')}</div>`,
      `<span class="lcheck">${items.length} ITEM${items.length===1?'':'S'}</span><button class="lbtn" data-close>CANCEL</button>`);
    m.querySelectorAll('[data-i]').forEach(b=>b.onclick = async ()=>{
      const f = tree[+b.dataset.i]; let d = root; for(const p of f.path) d = await d.getDirectoryHandle(p);
      m.classList.remove('show');
      const n = await moveItems(items, d, f.path); picked.clear();
      toast(n ? `MOVED ${n} TO ${(f.path.length?f.path[f.path.length-1]:root.name).toUpperCase()}` : 'NOTHING WAS MOVED');
      await load();
    });
  }
  async function trashDialog(){
    const td = await trashDir(false); const idx = td ? await readTrashIndex(td) : {};
    const list = Object.entries(idx).sort((a,b)=>b[1].t-a[1].t);
    const body = list.length ? `<div class="trash-list">${list.map(([k,it])=>`<div class="trash-row" data-k="${escapeAttr(k)}">
        <span class="ficon k-${it.dir?'folder':kindOf(it.name)}">${it.dir?ICON_FOLDER:escapeHtml((extOf(it.name)||'?').slice(0,4).toUpperCase())}</span>
        <span class="tr-n"><b>${escapeHtml(it.name)}</b><small>${escapeHtml([root.name, ...it.path].join(' / ').toUpperCase())}  ·  ${escapeHtml(fmtDate(it.t))}${it.size?'  ·  '+fmtSize(it.size):''}</small></span>
        <button class="lbtn sm" data-t="restore">RESTORE</button><button class="lbtn sm icon" data-t="purge" title="Delete forever">✕</button></div>`).join('')}</div>`
      : `<div class="lv-info"><b>TRASH IS EMPTY</b>DELETED FILES WAIT HERE UNTIL YOU EMPTY THE TRASH</div>`;
    const m = sheet('TRASH', list.length+' ITEM'+(list.length===1?'':'S')+'  ·  '+(root?root.name:'')+' / .trash', body,
      list.length ? `<button class="lbtn" data-t="empty">EMPTY TRASH</button><button class="lbtn" data-close>CLOSE</button>` : '');
    m.querySelectorAll('[data-t]').forEach(b=>b.onclick = async ()=>{
      const t = b.dataset.t, k = b.closest('[data-k]')?.dataset.k;
      if(t==='restore'){ try{ const nm = await restoreTrash(k); toast('RESTORED  ·  '+nm); }catch(e){ toast('RESTORE FAILED'); } await load(); trashDialog(); }
      else if(t==='purge'){ showConfirm({ title:'DELETE FOREVER', msg:`DELETE "${idx[k].name}" PERMANENTLY? THIS CANNOT BE UNDONE.`, okLabel:'DELETE', danger:true, onOk: async ()=>{ await purgeTrash(k); await load(); trashDialog(); } }); }
      else if(t==='empty'){ showConfirm({ title:'EMPTY TRASH', msg:`PERMANENTLY DELETE ALL ${list.length} ITEMS IN THE TRASH? THIS CANNOT BE UNDONE.`, okLabel:'EMPTY TRASH', danger:true, onOk: async ()=>{ await purgeTrash(); await load(); m.classList.remove('show'); toast('TRASH EMPTIED'); } }); }
    });
  }
  async function downloadMany(x){
    const items = targets(x).filter(i=>!i.dir);
    for(const i of items){ await download(i); await new Promise(r=>setTimeout(r, 250)); }
  }
  async function rename(x){
    const nn = await promptName('RENAME', x.name); if(!nn || nn===x.name) return;
    const n = cleanName(nn);
    if(await exists(cwd(), n)){ toast('A FILE WITH THAT NAME EXISTS'); return; }
    try{
      if(typeof x.handle.move==='function') await x.handle.move(n);
      else if(!x.dir){ await writeFile(cwd(), n, await x.handle.getFile()); await cwd().removeEntry(x.name); }
      else { toast('FOLDER RENAME NOT SUPPORTED IN THIS BROWSER'); return; }
      sel = n; toast('RENAMED  ·  '+n);
    }catch(e){ toast('RENAME FAILED'); }
    await load();
  }
  async function newFolder(){
    const nn = await promptName('NEW FOLDER', 'NEW FOLDER'); if(!nn) return;
    try{ const n = await uniqueName(cwd(), cleanName(nn)); await cwd().getDirectoryHandle(n, { create:true }); sel=n; }catch(e){ toast('COULD NOT CREATE FOLDER'); }
    await load();
  }
  async function download(x){ try{ downloadBlob(await x.handle.getFile(), x.name); }catch(e){ toast('DOWNLOAD FAILED'); } }

  /* ── modals ── */
  function modal(id, show){ document.getElementById(id).classList.toggle('show', show); }
  document.querySelectorAll('.lmodal').forEach(m=>{
    m.addEventListener('click', e=>{ if(e.target===m || e.target.closest('[data-close]')) closeModal(m.id); });
  });
  function closeModal(id){
    if(id==='lib-viewer' && viewerState.dirty){
      showConfirm({ title:'DISCARD CHANGES', msg:'CLOSE WITHOUT SAVING? YOUR EDITS TO THIS FILE WILL BE LOST.', okLabel:'DISCARD', danger:true,
        onOk:()=>{ viewerState.dirty=false; closeModal(id); } });
      return;
    }
    modal(id,false);
    if(id==='lib-viewer') teardownViewer();
    if(id==='lib-prompt' && promptState.resolve){ promptState.resolve(null); promptState.resolve=null; }
  }
  const promptState = { resolve:null };
  function promptName(title, value){
    return new Promise(res=>{
      promptState.resolve = res;
      document.getElementById('lp-title').textContent = title;
      const inp = document.getElementById('lp-input'); inp.value = value||'';
      modal('lib-prompt', true);
      setTimeout(()=>{ inp.focus(); const dot = value ? value.lastIndexOf('.') : -1; inp.setSelectionRange(0, dot>0?dot:inp.value.length); }, 30);
    });
  }
  document.getElementById('lp-ok').onclick = ()=>{ const r=promptState.resolve; promptState.resolve=null; modal('lib-prompt',false); r && r(document.getElementById('lp-input').value.trim()); };
  document.getElementById('lp-input').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('lp-ok').click(); });

  function chooser(x, file, tools, hint){
    document.getElementById('lc-sub').textContent = x.name;
    document.getElementById('lc-remember').checked = false;
    const list = document.getElementById('lc-list');
    const opts = tools.map(t=>({ id:t.path, name:t.name, desc:(TOOL_INFO[t.path]||{}).desc||'' }));
    if(TEXT_EDITABLE.has(x.ext) || ['image','video','audio','doc'].includes(x.kind)) opts.push({ id:'@view', name: TEXT_EDITABLE.has(x.ext)?'TEXT EDITOR':'QUICK VIEW', desc:'Built into the hub. Edit and save back in place.' });
    list.innerHTML = opts.map(o=>`<button class="choose-item" data-p="${escapeAttr(o.id)}"><span><b>${escapeHtml(o.name)}</b><small>${escapeHtml(o.desc)}</small></span><span class="why">OPEN →</span></button>`).join('');
    list.querySelectorAll('[data-p]').forEach(b=>b.onclick = ()=>{
      const p = b.dataset.p;
      if(document.getElementById('lc-remember').checked){ state.lib.assoc[x.ext]=p; saveState(); }
      modal('lib-chooser', false);
      if(p==='@view') viewer(x, file); else sendTo(toolByPath(p), x, file);
    });
    modal('lib-chooser', true);
  }

  const viewerState = { url:null, x:null, dirty:false };
  function teardownViewer(){
    if(viewerState.url) URL.revokeObjectURL(viewerState.url);
    viewerState.url=null; viewerState.x=null; viewerState.dirty=false;
    document.getElementById('lv-body').innerHTML='';
  }
  async function viewer(x, file){
    teardownViewer();
    viewerState.x = x;
    const body = document.getElementById('lv-body');
    const save = document.getElementById('lv-save');
    const st = document.getElementById('lv-state');
    document.getElementById('lv-title').firstChild.textContent = x.name;
    document.getElementById('lv-sub').textContent = `${x.ext ? '.'+x.ext.toUpperCase()+'  ·  ' : ''}${fmtSize(file.size)}  ·  ${fmtDate(file.lastModified)}`;
    save.hidden = true; st.textContent = ''; st.classList.remove('dirty');
    document.getElementById('lv-download').onclick = ()=>downloadBlob(file, x.name);
    if(TEXT_EDITABLE.has(x.ext) && file.size < 8*1024*1024){
      const ta = document.createElement('textarea');
      ta.spellcheck = false; ta.value = await file.text();
      body.appendChild(ta);
      save.hidden = false; st.textContent = 'SAVED';
      ta.addEventListener('input', ()=>{ viewerState.dirty = true; st.textContent='UNSAVED CHANGES'; st.classList.add('dirty'); });
      ta.addEventListener('keydown', e=>{
        if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); save.click(); }
        if(e.key==='Tab'){ e.preventDefault(); const s=ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
      });
      save.onclick = async ()=>{
        try{ const w = await x.handle.createWritable(); await w.write(ta.value); await w.close();
          viewerState.dirty=false; st.textContent='SAVED'; st.classList.remove('dirty'); toast('SAVED  ·  '+x.name); load(); }
        catch(e){ toast('SAVE FAILED'); }
      };
      setTimeout(()=>ta.focus(), 30);
    } else {
      const url = viewerState.url = URL.createObjectURL(file);
      let node;
      if(x.kind==='image') { node = document.createElement('img'); node.src = url; node.alt = x.name; }
      else if(x.kind==='video'){ node = document.createElement('video'); node.src = url; node.controls = true; }
      else if(x.kind==='audio'){ node = document.createElement('audio'); node.src = url; node.controls = true; }
      else if(x.ext==='pdf'){ node = document.createElement('iframe'); node.src = url; node.title = x.name; }
      else {
        node = document.createElement('div'); node.className='lv-info';
        const tools = toolsFor(x.ext);
        node.innerHTML = `<b>.${escapeHtml((x.ext||'FILE').toUpperCase())}</b>${tools.length ? 'OPENS IN '+tools.map(t=>escapeHtml(t.name)).join(' / ') : 'NO HUB TOOL EDITS THIS FORMAT YET'}<br>STORED SAFELY IN THE LIBRARY · USE DOWNLOAD TO OPEN IT IN ITS OWN APP`;
      }
      body.appendChild(node);
    }
    modal('lib-viewer', true);
  }

  /* ── context menu ── */
  const ctx = document.getElementById('lib-ctx');
  function hideCtx(){ ctx.classList.remove('show'); }
  document.addEventListener('click', e=>{ if(!ctx.contains(e.target)) hideCtx(); });
  window.addEventListener('blur', hideCtx);
  function showCtx(x, px, py){
    if(!picked.has(x.name)){ picked.clear(); picked.add(x.name); anchor = x.name; }
    sel = x.name; paintSel();
    const items = [];
    items.push(['open', x.dir ? 'OPEN FOLDER' : 'OPEN', x.dir ? '' : defaultLabel(x)]);
    if(!x.dir){
      const tools = toolsFor(x.ext);
      if(tools.length){ items.push(['label','OPEN WITH']); tools.forEach(t=>items.push(['with:'+t.path, t.name, ''])); }
      items.push(['view', TEXT_EDITABLE.has(x.ext) ? 'EDIT AS TEXT' : 'QUICK VIEW', '']);
      items.push(['hr']);
      items.push(['star', isStar(x.path,x.name) ? 'UNSTAR' : 'STAR', '']);
      items.push(['download','DOWNLOAD','']);
    } else items.push(['hr']);
    items.push(['move', picked.size>1 && picked.has(x.name) ? `MOVE ${picked.size} TO…` : 'MOVE TO…', '']);
    items.push(['rename','RENAME','F2']);
    items.push(['delete', picked.size>1 && picked.has(x.name) ? `TRASH ${picked.size} ITEMS` : 'MOVE TO TRASH','DEL']);
    ctx.innerHTML = items.map(([k,l,h])=> k==='hr' ? '<hr>' : k==='label' ? `<div class="cx-label">${l}</div>` : `<button data-k="${escapeAttr(k)}">${escapeHtml(l)}<small>${escapeHtml(h||'')}</small></button>`).join('');
    ctx.querySelectorAll('[data-k]').forEach(b=>b.onclick = ()=>{
      hideCtx(); const k=b.dataset.k;
      if(k==='open') open(x);
      else if(k.startsWith('with:')) open(x, k.slice(5));
      else if(k==='view') open(x,'@view');
      else if(k==='download') download(x);
      else if(k==='star') toggleStar(x);
      else if(k==='rename') rename(x);
      else if(k==='move') moveDialog(x);
      else if(k==='delete') remove(x);
    });
    ctx.classList.add('show');
    const r = ctx.getBoundingClientRect();
    ctx.style.left = Math.min(px, innerWidth-r.width-8)+'px';
    ctx.style.top  = Math.min(py, innerHeight-r.height-8)+'px';
  }

  /* ── render ── */
  function mount(panel){ el = panel; render(); bindPanelDrop(panel); }
  function onShow(){ if(connected() && !loading) load(); else render(); }
  function head(){
    const cnt = entries.length, total = entries.reduce((a,x)=>a+(x.size||0),0);
    const meta = connected()
      ? `<b>${escapeHtml(root.name.toUpperCase())}</b>  ·  ${cnt} ITEM${cnt===1?'':'S'} HERE  ·  ${fmtSize(total)}`
      : (root ? 'PERMISSION NEEDED FOR THIS SESSION' : 'DRAG FILES OF ANY FORMAT IN · OPEN THEM IN THE RIGHT TOOL');
    const exp = state.lib.saveExports;
    return `
      <div id="lib-head">
        <div>
          <div class="eyebrow">RACINGBROS TOOLKIT · HUB ${HUB_VERSION}</div>
          <h1>LIBRARY</h1>
          <div id="lib-meta">${meta}</div>
        </div>
        <div id="lib-head-actions">
          ${connected() ? `
          <button class="lbtn primary" data-a="import"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M12 19V5M5 12l7-7 7 7"/></svg>ADD FILES</button>
          <button class="lbtn" data-a="mkdir">NEW FOLDER</button>
          <button class="lbtn toggle ${exp?'is-on':''}" data-a="exports" aria-pressed="${exp}" title="When on, files a tool exports are written into the library (next to the file you opened) instead of Downloads"><i></i>SAVE EXPORTS HERE</button>
          <button class="lbtn" data-a="trash" title="Deleted files — restore or empty">TRASH${trashCount?` <span class="cnt">${trashCount}</span>`:''}</button>
          <button class="lbtn icon" data-a="refresh" title="REFRESH"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg></button>
          <button class="lbtn" data-a="connect" title="Point the library at a different folder">CHANGE FOLDER</button>` : ''}
        </div>
      </div>`;
  }
  function bar(){
    const crumbs = [`<button data-crumb="-1">${escapeHtml((root?root.name:'LIBRARY').toUpperCase())}</button>`]
      .concat(stack.map((s,i)=>`<span class="sep">/</span><button data-crumb="${i}">${escapeHtml(s.name.toUpperCase())}</button>`)).join('');
    const counts = {}; entries.forEach(x=>{ counts[x.kind]=(counts[x.kind]||0)+1; });
    const known = new Set(FILTERS.filter(f=>f[2]).flatMap(f=>f[2]));
    const chips = FILTERS.filter(([k,,kinds])=> k==='all' || (kinds ? kinds.some(kk=>counts[kk]) : entries.some(x=>!x.dir && !known.has(x.kind))))
      .map(([k,l])=>`<button data-f="${k}" class="${filter===k?'on':''}">${l}</button>`).join('');
    return `
      <div id="lib-bar">
        <nav id="lib-crumbs">${stack.length?'<button data-crumb="up" title="UP ONE LEVEL">←</button>':''}${crumbs}</nav>
        <div id="lib-filter">${chips}</div>
        <input id="lib-search" type="search" placeholder="Search files" value="${escapeAttr(query)}" spellcheck="false">
        <div class="lib-seg">
          <button class="lbtn icon ${state.lib.view!=='grid'?'on':''}" data-a="view-list" title="LIST"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <button class="lbtn icon ${state.lib.view==='grid'?'on':''}" data-a="view-grid" title="GRID"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg></button>
        </div>
      </div>`;
  }
  function iconHTML(x, big){
    if(x.dir) return big ? `<div class="gthumb k-folder">${ICON_FOLDER}</div>` : `<span class="ficon k-folder">${ICON_FOLDER}</span>`;
    const t = thumbFor(x);
    const label = escapeHtml((x.ext||'?').slice(0,4).toUpperCase());
    if(big) return `<div class="gthumb k-${x.kind}">${t?`<img loading="lazy" src="${t}" alt="">`:label}</div>`;
    return `<span class="ficon k-${x.kind}">${t?`<img loading="lazy" src="${t}" alt="">`:label}</span>`;
  }
  function listHTML(list){
    const s = state.lib.sort||'name', cls = k=>`${s===k?'sorted':''} ${s===k&&state.lib.asc?'asc':''}`;
    return `<table id="lib-table"><thead><tr>
      <th class="${cls('name')}" data-sort="name">NAME</th>
      <th class="${cls('type')}" data-sort="type">TYPE</th>
      <th class="c-tool">OPENS IN</th>
      <th class="${cls('size')}" data-sort="size" style="text-align:right">SIZE</th>
      <th class="c-date ${cls('date')}" data-sort="date" style="text-align:right">MODIFIED</th>
      <th></th></tr></thead><tbody>${list.map(x=>`
      <tr class="row ${isPicked(x.name)?'sel':''}" data-n="${escapeAttr(x.name)}" tabindex="-1" draggable="true">
        <td class="c-name"><span class="nm">${iconHTML(x)}<span>${escapeHtml(x.name)}</span>${!x.dir && isStar(x.path,x.name)?'<i class="st-on" title="Starred">★</i>':''}</span></td>
        <td>${x.dir?'<span class="ftag">DIR</span>':`<span class="ftag">${escapeHtml(x.ext||'—')}</span>`}</td>
        <td class="c-tool">${x.dir?'':`<b>${escapeHtml(defaultLabel(x))}</b>`}</td>
        <td class="num">${x.dir?'':fmtSize(x.size)}</td>
        <td class="num c-date">${x.dir?'':fmtDate(x.mtime)}</td>
        <td class="c-act"><span class="acts">
          ${x.dir?'':`<button class="lbtn icon star ${isStar(x.path,x.name)?'on':''}" data-r="star" title="STAR">${isStar(x.path,x.name)?'★':'☆'}</button>`}
          <button class="lbtn" data-r="open">OPEN</button>
          <button class="lbtn icon" data-r="more" title="MORE">⋯</button>
        </span></td>
      </tr>`).join('')}</tbody></table>`;
  }
  function gridHTML(list){
    return `<div id="lib-grid">${list.map(x=>`
      <button class="gcard ${isPicked(x.name)?'sel':''}" data-n="${escapeAttr(x.name)}" draggable="true">
        ${!x.dir && x.preview && ['table','list'].includes(x.preview.kind) ? `<div class="gthumb">${previewBox(x)}</div>` : iconHTML(x,true)}
        ${!x.dir && isStar(x.path,x.name)?'<i class="gstar">★</i>':''}
        <span class="gmeta"><span class="gname">${escapeHtml(x.name)}</span>
        <span class="gsub"><span>${x.dir?'FOLDER':escapeHtml((x.ext||'—').toUpperCase())}</span><span>${x.dir?'':fmtSize(x.size)}</span></span></span>
      </button>`).join('')}</div>`;
  }
  function emptyHTML(){
    if(!supported) return `<div id="lib-empty">${ICON_FOLDER.replace('<svg','<svg class="big"')}<h2>LIBRARY NEEDS CHROME OR EDGE</h2><p>The library reads and writes a real folder on your computer. Firefox and Safari can't do that from a local file. Open <code>index.html</code> in Chrome or Edge.</p></div>`;
    if(!root) return `<div id="lib-empty">${ICON_FOLDER.replace('<svg','<svg class="big"')}<h2>CONNECT YOUR LIBRARY</h2><p>Choose the <code>LIBRARY</code> folder that sits next to <code>index.html</code> in HUB_2P0. Files of any format can live there. Double-click one to open it in the right tool, and what the tool exports is saved back beside it.</p><div class="row-btns"><button class="lbtn primary" data-a="connect">CHOOSE LIBRARY FOLDER</button></div></div>`;
    if(perm!=='granted') return `<div id="lib-empty">${ICON_FOLDER.replace('<svg','<svg class="big"')}<h2>RECONNECT ${escapeHtml(root.name.toUpperCase())}</h2><p>The browser asks once per session before the hub may read and write this folder.</p><div class="row-btns"><button class="lbtn primary" data-a="reconnect">ALLOW ACCESS</button><button class="lbtn" data-a="connect">CHOOSE ANOTHER FOLDER</button></div></div>`;
    if(!entries.length) return `<div id="lib-empty">${ICON_FOLDER.replace('<svg','<svg class="big"')}<h2>${stack.length?'THIS FOLDER IS EMPTY':'LIBRARY IS EMPTY'}</h2><p>Drag files or whole folders anywhere on this page, or drop them on the LIBRARY tab from any tool.</p><div class="row-btns"><button class="lbtn primary" data-a="import">ADD FILES</button></div></div>`;
    return `<div id="lib-empty"><h2>NO MATCHES</h2><p>Nothing here matches the current search or filter.</p><div class="row-btns"><button class="lbtn" data-a="clear">CLEAR FILTERS</button></div></div>`;
  }
  function render(){
    if(!el) return;
    const ready = connected();
    const list = ready ? visible() : [];
    const focusSearch = document.activeElement && document.activeElement.id==='lib-search';
    const caret = focusSearch ? document.activeElement.selectionStart : null;
    const scroll = el.querySelector('#lib-body')?.scrollTop || 0;
    el.innerHTML = head() + (ready ? bar() : '') + `
      <div id="lib-body" tabindex="0">${ready && !stack.length && !query && filter==='all' ? quickHTML(false) : ''}
        <div id="lib-selbar" hidden></div>
        <div id="lib-split"><div id="lib-main">${ready && list.length ? (state.lib.view==='grid' ? gridHTML(list) : listHTML(list)) : emptyHTML()}</div>
        ${ready && list.length ? '<aside id="lib-details"></aside>' : ''}</div>
        <div id="lib-drop"><div>DROP TO ADD TO LIBRARY<small>${escapeHtml(((stack.length?stack[stack.length-1].name:root?root.name:'LIBRARY')).toUpperCase())}</small></div></div>
      </div>
      <div id="lib-foot"><span><span class="dot ${ready?'ok':root?'warn':''}"></span>${escapeHtml(statusLine())}${ready&&state.lib.saveExports?'  ·  EXPORTS SAVE HERE':''}</span><span>DOUBLE-CLICK TO OPEN  ·  RIGHT-CLICK FOR MORE</span></div>`;
    const body = el.querySelector('#lib-body'); body.scrollTop = scroll;
    if(focusSearch){ const s = el.querySelector('#lib-search'); s.focus(); try{ s.setSelectionRange(caret,caret); }catch(e){} }
    wire(list);
    bindQuick(el);
    paintDetails();
  }
  function isPicked(n){ return picked.size ? picked.has(n) : n===sel; }
  function paintSel(){
    if(!el) return;
    el.querySelectorAll('[data-n]').forEach(r=>r.classList.toggle('sel', isPicked(r.dataset.n)));
    const sb = el.querySelector('#lib-selbar');
    if(sb){
      const n = picked.size;
      sb.hidden = n < 2;
      sb.innerHTML = n<2 ? '' : `<span class="sb-n">${n} SELECTED</span>
        <button class="lbtn sm" data-a="sel-move">MOVE TO…</button><button class="lbtn sm" data-a="sel-dl">DOWNLOAD</button>
        <button class="lbtn sm" data-a="sel-del">MOVE TO TRASH</button><button class="lbtn sm ghost" data-a="sel-clear">CLEAR</button>
        <span class="sb-hint">DRAG ONTO A FOLDER OR THE PATH ABOVE TO MOVE  ·  SHIFT / CTRL-CLICK TO ADJUST</span>`;
      sb.querySelectorAll('[data-a]').forEach(b=>b.onclick = ()=>{
        const a=b.dataset.a; if(a==='sel-move') moveDialog(null); else if(a==='sel-dl') downloadMany(null); else if(a==='sel-del') remove(null); else { picked.clear(); paintSel(); }
      });
    }
    paintDetails();
  }
  function wire(list){
    el.querySelectorAll('[data-a]').forEach(b=>b.onclick = ()=>{
      const a = b.dataset.a;
      if(a==='connect') connect();
      else if(a==='reconnect') reconnect();
      else if(a==='refresh') load();
      else if(a==='import') document.getElementById('lib-import-input').click();
      else if(a==='mkdir') newFolder();
      else if(a==='exports'){ state.lib.saveExports = !state.lib.saveExports; saveState(); refreshChrome(); toast(state.lib.saveExports?'TOOL EXPORTS → LIBRARY':'TOOL EXPORTS → DOWNLOADS'); }
      else if(a==='view-list'||a==='view-grid'){ state.lib.view = a==='view-grid'?'grid':'list'; saveState(); render(); }
      else if(a==='clear'){ query=''; filter='all'; render(); }
      else if(a==='trash') trashDialog();
      else if(a==='sel-move') moveDialog(null);
      else if(a==='sel-dl') downloadMany(null);
      else if(a==='sel-del') remove(null);
      else if(a==='sel-clear'){ picked.clear(); paintSel(); }
    });
    el.querySelectorAll('[data-crumb]').forEach(b=>{
      b.onclick = ()=>{
        const c = b.dataset.crumb;
        if(c==='up') stack.pop(); else stack = stack.slice(0, parseInt(c,10)+1);
        sel=null; picked.clear(); load();
      };
      const c = b.dataset.crumb;
      const i = c==='up' ? stack.length-2 : parseInt(c,10);
      bindMoveTarget(b, async ()=>({ dest: i<0 ? root : stack[i].handle, path: stack.slice(0, i+1).map(s=>s.name) }));
    });
    el.querySelectorAll('[data-f]').forEach(b=>b.onclick = ()=>{ filter = b.dataset.f; render(); });
    el.querySelectorAll('[data-sort]').forEach(th=>th.onclick = ()=>{
      const k = th.dataset.sort;
      if(state.lib.sort===k) state.lib.asc = !state.lib.asc; else { state.lib.sort=k; state.lib.asc = k==='name'||k==='type'; }
      saveState(); render();
    });
    const s = el.querySelector('#lib-search');
    if(s) s.oninput = ()=>{ query = s.value; render(); };
    const byName = n => entries.find(x=>x.name===n);
    el.querySelectorAll('[data-n]').forEach(r=>{
      const x = byName(r.dataset.n);
      r.onclick = e=>{
        const act = e.target.closest('[data-r]');
        if(act){ e.stopPropagation(); if(act.dataset.r==='open') open(x); else if(act.dataset.r==='star') toggleStar(x); else { const bb=act.getBoundingClientRect(); showCtx(x, bb.left, bb.bottom+4); } return; }
        if(e.shiftKey && anchor){
          const vis = visible(), a = vis.findIndex(v=>v.name===anchor), b = vis.findIndex(v=>v.name===x.name);
          if(a>=0 && b>=0){ picked.clear(); vis.slice(Math.min(a,b), Math.max(a,b)+1).forEach(v=>picked.add(v.name)); }
        } else if(e.ctrlKey || e.metaKey){
          if(!picked.size && sel) picked.add(sel);
          picked.has(x.name) ? picked.delete(x.name) : picked.add(x.name); anchor = x.name;
        } else { picked.clear(); picked.add(x.name); anchor = x.name; }
        sel = x.name; paintSel();
      };
      r.ondragstart = e=>{
        if(!picked.has(x.name)){ picked.clear(); picked.add(x.name); sel = x.name; anchor = x.name; paintSel(); }
        e.dataTransfer.setData(DRAG_T, JSON.stringify([...picked]));
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging-items');
      };
      r.ondragend = ()=>{ el.classList.remove('dragging-items'); el.querySelectorAll('.drop-target').forEach(t=>t.classList.remove('drop-target')); };
      if(x.dir) bindMoveTarget(r, async ()=>({ dest: x.handle, path:[...(x.path||[]), x.name] }));
      r.ondblclick = e=>{ if(!e.target.closest('[data-r]')) open(x); };
      r.oncontextmenu = e=>{ e.preventDefault(); showCtx(x, e.clientX, e.clientY); };
    });
    const body = el.querySelector('#lib-body');
    body.onkeydown = e=>{
      if(e.target.id==='lib-search') return;
      const vis = visible(); const i = vis.findIndex(x=>x.name===sel);
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='a'){ e.preventDefault(); picked.clear(); vis.forEach(v=>picked.add(v.name)); paintSel(); return; }
      if(e.key==='Delete' && picked.size>1){ remove(null); return; }
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); const n = vis[Math.max(0,Math.min(vis.length-1, i+(e.key==='ArrowDown'?1:-1)))]; if(n){ sel=n.name; paintSel(); el.querySelector(`[data-n="${cssEsc(sel)}"]`)?.scrollIntoView({block:'nearest'}); } }
      else if(e.key==='Enter' && i>=0) open(vis[i]);
      else if(e.key==='Delete' && i>=0) remove(vis[i]);
      else if(e.key==='F2' && i>=0) rename(vis[i]);
      else if(e.key==='Backspace' && stack.length){ stack.pop(); sel=null; picked.clear(); load(); }
    };
  }
  function bindMoveTarget(node, where){
    node.addEventListener('dragover', e=>{ if(![...(e.dataTransfer.types||[])].includes(DRAG_T)) return; e.preventDefault(); e.dataTransfer.dropEffect='move'; node.classList.add('drop-target'); });
    node.addEventListener('dragleave', ()=>node.classList.remove('drop-target'));
    node.addEventListener('drop', async e=>{
      if(![...(e.dataTransfer.types||[])].includes(DRAG_T)) return;
      e.preventDefault(); e.stopPropagation(); node.classList.remove('drop-target');
      let names = []; try{ names = JSON.parse(e.dataTransfer.getData(DRAG_T)); }catch(err){}
      const items = entries.filter(x=>names.includes(x.name));
      const w = await where(); if(!w || !w.dest) return;
      const n = await moveItems(items, w.dest, w.path); picked.clear();
      toast(n ? `MOVED ${n} TO ${(w.path.length?w.path[w.path.length-1]:root.name).toUpperCase()}` : 'NOTHING WAS MOVED');
      await load();
    });
  }
  document.getElementById('lib-import-input').onchange = async e=>{
    const n = await importFiles([...e.target.files]); e.target.value='';
    await load(); if(n) toast(`ADDED ${n} FILE${n===1?'':'S'} TO LIBRARY`);
  };

  /* ── drag & drop ── */
  function hasFiles(e){ return e.dataTransfer && [...(e.dataTransfer.types||[])].includes('Files'); }
  function bindPanelDrop(panel){
    panel.addEventListener('dragenter', e=>{ if(!hasFiles(e)) return; e.preventDefault(); dragDepth++; panel.querySelector('#lib-drop')?.classList.add('show'); });
    panel.addEventListener('dragover', e=>{ if(!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
    panel.addEventListener('dragleave', ()=>{ dragDepth=Math.max(0,dragDepth-1); if(!dragDepth) panel.querySelector('#lib-drop')?.classList.remove('show'); });
    panel.addEventListener('drop', e=>{
      if(!hasFiles(e)) return; e.preventDefault(); dragDepth=0;
      panel.querySelector('#lib-drop')?.classList.remove('show');
      const target = e.target.closest && e.target.closest('[data-n]');
      const tx = target && entries.find(x=>x.name===target.dataset.n && x.dir);
      importDataTransfer(e.dataTransfer, tx ? tx.handle : null);
    });
  }
  function bindTabDrop(tab){
    let d=0;
    tab.addEventListener('dragenter', e=>{ if(!hasFiles(e)) return; e.preventDefault(); d++; tab.classList.add('lib-drop'); });
    tab.addEventListener('dragover', e=>{ if(!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
    tab.addEventListener('dragleave', ()=>{ d=Math.max(0,d-1); if(!d) tab.classList.remove('lib-drop'); });
    tab.addEventListener('drop', async e=>{
      if(!hasFiles(e)) return; e.preventDefault(); d=0; tab.classList.remove('lib-drop');
      const dt = e.dataTransfer;
      await importDataTransfer(dt, root);
      setActive('library');
    });
  }
  /* keep the browser from navigating away when a file misses a drop zone */
  window.addEventListener('dragover', e=>{ if(hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', e=>{ if(hasFiles(e)) e.preventDefault(); });

  function closeTop(){
    const m = [...document.querySelectorAll('.lmodal.show')].pop();
    if(m){ closeModal(m.id); return true; }
    if(ctx.classList.contains('show')){ hideCtx(); return true; }
    return false;
  }
  return { init, mount, onShow, statusLine, connected, saveExport, bindTabDrop, open, closeTop,
           refreshFilebar, decorateTabs, saveFailed, menuStrip, bindQuick, refreshMenu,
           openKey, trashDialog, connect, reconnect, isConnected: connected, rootName: ()=>root ? root.name : null,
           index: ()=>indexAll(), keyOf, reveal,
           toggleExports: ()=>{ state.lib.saveExports = !state.lib.saveExports; saveState(); refreshChrome(); toast(state.lib.saveExports?'TOOL EXPORTS → LIBRARY':'TOOL EXPORTS → DOWNLOADS'); },
           addFiles: ()=>{ if(!connected()){ setActive('library'); toast('CONNECT THE LIBRARY FOLDER FIRST'); return; } document.getElementById('lib-import-input').click(); } };
})();


/* ════════════════════════════════════════
   COMMAND PALETTE — Ctrl+K / ⌘K (also from inside a tool, via the bridge)
   tools · LIBRARY files in every folder · hub actions
   ════════════════════════════════════════ */
const Palette = (()=>{
  let box = null, input = null, list = null, items = [], cur = 0, files = null, seq = 0;
  const isOpen = ()=> !!box && box.classList.contains('show');
  function build(){
    box = document.createElement('div'); box.id = 'cmdk'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Command palette');
    box.innerHTML = `<div class="ck-box">
        <div class="ck-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>
          <input id="ck-q" type="text" autocomplete="off" spellcheck="false" placeholder="Jump to a tool, find a file, run a command…"><kbd>ESC</kbd></div>
        <div class="ck-list" id="ck-list" role="listbox"></div>
        <div class="ck-foot"><span><kbd>↑</kbd><kbd>↓</kbd> MOVE</span><span><kbd>ENTER</kbd> RUN</span><span><kbd>SHIFT</kbd>+<kbd>ENTER</kbd> SHOW IN LIBRARY</span><span class="ck-ver">HUB ${escapeHtml(HUB_VERSION)}</span></div>
      </div>`;
    document.body.appendChild(box);
    input = box.querySelector('#ck-q'); list = box.querySelector('#ck-list');
    box.addEventListener('mousedown', e=>{ if(e.target===box) close(); });
    input.addEventListener('input', ()=>{ cur = 0; refresh(); });
    input.addEventListener('keydown', e=>{
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); move(e.key==='ArrowDown'?1:-1); }
      else if(e.key==='PageDown'||e.key==='PageUp'){ e.preventDefault(); move(e.key==='PageDown'?8:-8); }
      else if(e.key==='Enter'){ e.preventDefault(); run(items[cur], e.shiftKey); }
      else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); close(); }
      else if(e.key==='Tab'){ e.preventDefault(); move(e.shiftKey?-1:1); }
    });
    list.addEventListener('mousemove', e=>{ const r = e.target.closest('[data-i]'); if(r && +r.dataset.i!==cur){ cur = +r.dataset.i; paint(); } });
    list.addEventListener('click', e=>{ const r = e.target.closest('[data-i]'); if(r) run(items[+r.dataset.i], e.shiftKey); });
  }
  function open(q){
    if(!box) build();
    if(isOpen()){ input.select(); return; }
    box.classList.add('show'); input.value = q||''; cur = 0; files = null;
    refresh();
    setTimeout(()=>input.focus(), 0);
    const my = ++seq;
    Library.index().then(f=>{ if(my!==seq) return; files = f; if(isOpen()) refresh(); }).catch(()=>{ files = []; });
  }
  function close(){ if(box){ box.classList.remove('show'); seq++; } }
  function toggle(){ isOpen() ? close() : open(); }
  function move(d){ if(!items.length) return; cur = Math.max(0, Math.min(items.length-1, cur+d)); paint(); }

  /* scoring: substring beats subsequence; word starts and short names rank higher */
  function score(q, s, fuzzy){
    if(!q) return 1;
    s = String(s||'').toLowerCase();
    const i = s.indexOf(q);
    if(i >= 0) return 1000 - i*4 - s.length*.5 + (i===0 || /[\s_\-./]/.test(s[i-1]) ? 300 : 0);
    if(!fuzzy) return -1;
    let k = 0, gaps = 0, last = -1;
    for(let j=0; j<s.length && k<q.length; j++) if(s[j]===q[k]){ if(last>=0) gaps += j-last-1; last = j; k++; }
    return k===q.length && gaps <= q.length*2 ? 400 - gaps*6 - s.length*.5 : -1;
  }
  function best(q, ...fields){ let b = -1; fields.forEach((f,i)=>{ const v = score(q, f, i===0); if(v>=0) b = Math.max(b, v - i*120); }); return b; }

  function toolItems(){
    const out = [
      { g:'GO TO', icon:'<span class="ck-num">⌂</span>', t:'MENU', s:'All tools', k:'home start', run:()=>setActive('menu') },
      { g:'GO TO', icon:`<span class="ck-num">${ICON_FOLDER}</span>`, t:'LIBRARY', s: Library.rootName() ? 'Browse files in '+Library.rootName() : 'Not connected yet', k:'files folder', run:()=>setActive('library') },
    ];
    state.tools.forEach((t,i)=>{
      const info = TOOL_INFO[t.path] || {};
      out.push({ g:'GO TO', icon:`<span class="ck-num">${String(i+1).padStart(2,'0')}</span>`, t:t.name, s: info.desc || t.path || '', k:[t.path, (info.formats||[]).join(' ')].join(' '),
        hint: state.activeTab===t.id ? 'OPEN' : '', run:()=>setActive(t.id) });
    });
    return out;
  }
  function actionItems(){
    const A = (t, s, k, run, ok=true)=> ok ? { g:'COMMANDS', icon:'<span class="ck-num">›</span>', t, s, k, run } : null;
    const fb = sel => { const b = document.querySelector('#filebar:not([hidden]) [data-fb="'+sel+'"]'); return b && !b.disabled ? b : null; };
    const conn = Library.isConnected(), hasRoot = !!Library.rootName();
    const lo = document.querySelector('#filebar:not([hidden]) .fb-path b');
    const fname = lo ? lo.textContent : '';
    return [
      A('SAVE', 'Write '+fname+' back to the LIBRARY', 'save file write', ()=>fb('over').click(), !!fb('over')),
      A('SAVE COPY', 'Save '+fname+' as a new file', 'save as copy duplicate', ()=>fb('copy').click(), !!fb('copy')),
      A('REOPEN FILE', 'Reload '+fname+' into the tool', 'reload revert', ()=>fb('reopen').click(), !!fb('reopen')),
      A('SHOW FILE IN LIBRARY', fname, 'reveal locate', ()=>fb('show').click(), !!fb('show')),
      ...Object.entries(SCHEMES).filter(([key])=>key!==state.scheme).map(([key,sc])=>
        A('COLOR SCHEME · '+sc.name, (sc.theme==='light'?'Light':'Dark')+' — hub and every tool', 'theme scheme mode appearance colour color '+sc.theme, ()=>setScheme(key))),
      A('ADD FILES TO LIBRARY', 'Import from your computer', 'import upload add', ()=>Library.addFiles(), conn),
      A((state.lib.saveExports?'STOP SAVING':'SAVE')+' TOOL EXPORTS TO LIBRARY', state.lib.saveExports?'Exports go to Downloads again':'Exports land in the current LIBRARY folder', 'exports downloads toggle', ()=>Library.toggleExports(), conn),
      A('OPEN TRASH', 'Restore or empty deleted files', 'trash bin deleted restore recycle', ()=>{ setActive('library'); Library.trashDialog(); }, conn),
      A('ALLOW LIBRARY ACCESS', 'Grant permission again', 'reconnect permission', ()=>{ setActive('library'); Library.reconnect(); }, hasRoot && !conn),
      A(hasRoot?'CHANGE LIBRARY FOLDER':'CONNECT LIBRARY FOLDER', 'Pick the LIBRARY folder next to index.html', 'connect choose folder', ()=>{ setActive('library'); Library.connect(); }),
      A('SETTINGS', 'Theme, colours, type, tools', 'developer panel settings preferences font', ()=>openDevp()),
    ].filter(Boolean);
  }
  function fileItem(f, g){
    const key = Library.keyOf(f.path, f.name);
    const ext = (f.ext||'?').slice(0,4).toUpperCase();
    return { g, icon:`<span class="ficon k-${f.kind||kindOf(f.name)}">${escapeHtml(ext)}</span>`, t:f.name, s:[Library.rootName()||'LIBRARY', ...f.path].join(' / '),
      hint: f.tool ? (toolByPath(f.tool)?.name || '') : '', file:true, key, tool:f.tool, mono:true,
      run:(show)=> show ? showFile(f) : Library.openKey(key, f.tool) };
  }
  function showFile(f){
    Library.reveal(f.path, f.name);
  }
  function refresh(){
    const q = input.value.trim().toLowerCase();
    const recents = (state.lib.recent||[]).map(r=>({ path:r.path||[], name:r.name, ext:r.ext, kind:kindOf(r.name), tool:r.tool }));
    let out = [];
    if(!q){
      if(Library.isConnected()) out = recents.slice(0,5).map(r=>fileItem(r,'RECENT'));
      out = out.concat(toolItems(), actionItems());
    } else {
      const scored = [];
      toolItems().forEach(it=>{ const v = best(q, it.t, it.k, it.s); if(v>=0) scored.push([v+60, it]); });
      actionItems().forEach(it=>{ const v = best(q, it.t, it.k); if(v>=0) scored.push([v, it]); });
      const seen = new Set();
      const stars = new Set(state.lib.stars||[]);
      const pool = (files||[]).concat(recents);
      pool.forEach(f=>{
        const k = Library.keyOf(f.path, f.name); if(seen.has(k)) return; seen.add(k);
        const v = best(q, f.name, f.path.join('/')+'/'+f.name);
        if(v>=0) scored.push([v + (stars.has(k)?80:0) + (recents.some(r=>Library.keyOf(r.path,r.name)===k)?40:0), fileItem(f, 'FILES')]);
      });
      scored.sort((a,b)=>b[0]-a[0]);
      const groups = { 'GO TO':[], 'FILES':[], 'COMMANDS':[] };
      scored.forEach(([,it])=>{ const g = groups[it.g]; if(g && g.length < (it.g==='FILES'?40:12)) g.push(it); });
      /* group order follows the best hit */
      const order = [...new Set(scored.map(([,it])=>it.g))];
      order.forEach(g=>{ out = out.concat(groups[g]||[]); });
    }
    items = out;
    if(cur >= items.length) cur = Math.max(0, items.length-1);
    paint(q);
  }
  function hl(text, q){
    const t = String(text||''); if(!q) return escapeHtml(t);
    const i = t.toLowerCase().indexOf(q);
    if(i>=0) return escapeHtml(t.slice(0,i))+'<mark>'+escapeHtml(t.slice(i,i+q.length))+'</mark>'+escapeHtml(t.slice(i+q.length));
    let k = 0, o = '';
    for(const ch of t){ if(k<q.length && ch.toLowerCase()===q[k]){ o += '<mark>'+escapeHtml(ch)+'</mark>'; k++; } else o += escapeHtml(ch); }
    return o;
  }
  function paint(q){
    if(q===undefined) q = input.value.trim().toLowerCase();
    if(!items.length){
      list.innerHTML = `<div class="ck-empty">${files===null && q ? 'SEARCHING THE LIBRARY…' : 'NO MATCHES'}${!Library.isConnected() && q ? '<small>CONNECT THE LIBRARY TO SEARCH FILES</small>' : ''}</div>`;
      return;
    }
    let g = null, h = '';
    items.forEach((it,i)=>{
      if(it.g!==g){ g = it.g; h += `<div class="ck-g">${g}${g==='FILES' && files===null ? ' <small>INDEXING…</small>' : ''}</div>`; }
      h += `<div class="ck-row${i===cur?' on':''}" data-i="${i}" role="option" aria-selected="${i===cur}">${it.icon}
        <span class="ck-t"><b class="${it.mono?'nc':''}">${hl(it.t, q)}</b><small>${escapeHtml(it.s||'')}</small></span>
        ${it.hint?`<span class="ck-hint">${escapeHtml(it.hint)}</span>`:''}<span class="ck-go">↵</span></div>`;
    });
    list.innerHTML = h;
    list.querySelector('.ck-row.on')?.scrollIntoView({ block:'nearest' });
  }
  function run(it, shift){
    if(!it) return;
    close();
    try{ it.run(shift && it.file); }catch(e){ toast('COMMAND FAILED'); }
  }
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase()==='k'){ e.preventDefault(); toggle(); }
    else if(e.key==='Escape' && isOpen()){ e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);
  if(/Mac|iPhone|iPad/.test(navigator.platform||'')){ const k = document.querySelector('#cmdk-btn kbd'); if(k) k.textContent = '⌘ K'; }
  return { open, close, toggle, isOpen };
})();