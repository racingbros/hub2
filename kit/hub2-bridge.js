/* ══════════════════════════════════════════════════════════════
   HUB 2.0 BRIDGE — runs inside every tool
   · theme sync     hub → tool  (postMessage 'hub2:theme' + localStorage)
   · open file      hub → tool  ('hub2:open'  → tool's own <input type=file>)
   · save exports   tool → hub  ('hub2:save'  ← any <a download> click)
   Source of truth: kit/hub2-bridge.js → injected by tools/sync-kit.js
   ══════════════════════════════════════════════════════════════ */
(function(){
  if (window.__HUB2_BRIDGE__) return;
  var H = window.__HUB2_BRIDGE__ = { lib:{connected:false, saveExports:false}, inHub:false };
  H.version = '2.0.1';
  var root = document.documentElement;
  var TOOL = (location.pathname.split('/').pop() || '').replace(/\.html?$/i,'');
  var THEME_KEY = 'hub2_theme_v1';
  try { H.inHub = window.parent && window.parent !== window; } catch(e){ H.inHub = true; }
  if (H.inHub) root.setAttribute('data-h2-embedded','');

  /* ── THEME ─────────────────────────────────────────── */
  var VAR_MAP = { bg:'bg', surface:'surface', 'surface-2':'surface-2', hover:'surface-3', border:'line',
    'border-strong':'line-strong', text:'fg', 'text-dim':'fg-dim', 'text-mute':'fg-mute', accent:'accent', 'accent-text':'accent-fg' };
  function applyTheme(t){
    if (!t) return;
    root.setAttribute('data-h2-theme', t.theme === 'light' ? 'light' : 'dark');
    var v = t.vars || {};
    Object.keys(VAR_MAP).forEach(function(k){
      if (v[k]) root.style.setProperty('--h2-' + VAR_MAP[k], v[k]);
      else root.style.removeProperty('--h2-' + VAR_MAP[k]);
    });
    if (v.accent){
      root.style.setProperty('--h2-accent-hover', 'color-mix(in srgb, ' + v.accent + ' 82%, #fff)');
      root.style.setProperty('--h2-accent-soft', 'color-mix(in srgb, ' + v.accent + ' 14%, transparent)');
    } else { root.style.removeProperty('--h2-accent-hover'); root.style.removeProperty('--h2-accent-soft'); }
    if (t.font) root.style.setProperty('--h2-font', t.font); else root.style.removeProperty('--h2-font');
    try { window.dispatchEvent(new CustomEvent('hub2:theme', { detail: t })); } catch(e){}
  }
  try { var saved = JSON.parse(localStorage.getItem(THEME_KEY) || 'null'); if (saved) applyTheme(saved); } catch(e){}
  if (!root.hasAttribute('data-h2-theme')) root.setAttribute('data-h2-theme','dark');

  /* ── TOAST ─────────────────────────────────────────── */
  function toast(msg){
    var el = document.getElementById('h2-toast');
    if (!el){ el = document.createElement('div'); el.id = 'h2-toast'; el.setAttribute('role','status'); (document.body||root).appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function(){ el.classList.remove('show'); }, 2400);
  }
  H.toast = toast;

  /* ── OPEN FILE ─────────────────────────────────────── */
  function extOf(n){ var m = /\.([a-z0-9]+)$/i.exec(n||''); return m ? m[1].toLowerCase() : ''; }
  function accepts(input, file){
    var acc = (input.getAttribute('accept') || '').toLowerCase().split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    if (!acc.length) return true;
    var ext = '.' + extOf(file.name), type = (file.type || '').toLowerCase();
    return acc.some(function(a){
      if (a[0] === '.') return a === ext;
      if (/\/\*$/.test(a)) return type.indexOf(a.slice(0,-1)) === 0;
      return a === type;
    });
  }
  function pickInput(file){
    var all = [].slice.call(document.querySelectorAll('input[type="file"]'));
    var ext = extOf(file.name);
    /* explicit routing: data-hub2-open="csv svg" */
    var tagged = all.filter(function(i){ var t = (i.getAttribute('data-hub2-open')||'').toLowerCase().split(/\s+/); return t.indexOf(ext) >= 0; });
    if (tagged.length) return tagged[0];
    var ok = all.filter(function(i){ return !i.hasAttribute('data-hub2-skip') && !i.hasAttribute('capture') && accepts(i, file); });
    /* prefer an input that lives in the part of the tool currently on screen (e.g. the active document tab) */
    function shown(i){ var p = i.parentElement; return !!(p && p.getClientRects && p.getClientRects().length); }
    var vis = ok.filter(shown);
    return vis[0] || ok[0] || null;
  }
  H.openFile = function(file){
    if (typeof window.HUB2_OPEN === 'function'){ var r = window.HUB2_OPEN(file); if (r !== false) return true; }
    var input = pickInput(file);
    if (!input) return false;
    var dt = new DataTransfer(); dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
    return true;
  };

  /* ── SAVE EXPORTS → LIBRARY ────────────────────────── */
  var blobs = new Map();
  if (typeof URL.createObjectURL === 'function'){
    var _create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function(obj){
      var u = _create(obj);
      if (obj instanceof Blob){ blobs.set(u, obj); setTimeout(function(){ blobs.delete(u); }, 120000); }
      return u;
    };
  }
  function dataUrlToBlob(u){
    var m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(u); if (!m) return null;
    var raw = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    var a = new Uint8Array(raw.length); for (var i=0;i<raw.length;i++) a[i] = raw.charCodeAt(i) & 255;
    return new Blob([a], { type: m[1] || 'application/octet-stream' });
  }
  function captureDownload(a){
    var forced = H.force && Date.now() - H.force < 60000;   /* hub asked for SAVE / SAVE COPY */
    if (!H.inHub || !H.lib.connected || !(H.lib.saveExports || forced)) return false;
    var name = a.getAttribute('download'); if (name == null) return false;
    var href = a.href || '';
    var blob = blobs.get(href) || (href.indexOf('data:') === 0 ? dataUrlToBlob(href) : null);
    if (!blob) return false;
    if (!name) name = 'export';
    window.parent.postMessage({ type:'hub2:save', tool:TOOL, name:name, blob:blob }, '*');
    H.force = 0;
    return true;
  }
  var _click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){ if (captureDownload(this)) return; return _click.apply(this, arguments); };
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
    if (a && captureDownload(a)) e.preventDefault();
  }, true);

  /* ── MESSAGES ──────────────────────────────────────── */
  window.addEventListener('message', function(e){
    var d = e.data; if (!d || typeof d.type !== 'string' || d.type.indexOf('hub2:') !== 0) return;
    if (d.type === 'hub2:theme') applyTheme(d.theme);
    else if (d.type === 'hub2:lib') H.lib = { connected: !!d.connected, saveExports: !!d.saveExports };
    else if (d.type === 'hub2:open' && d.file){
      var ok = false; try { ok = H.openFile(d.file); } catch(err){ ok = false; }
      if (ok) toast('OPENED  ·  ' + d.file.name);
      if (e.source) e.source.postMessage({ type: ok ? 'hub2:opened' : 'hub2:open-failed', tool:TOOL, name:d.file.name, id:d.id }, '*');
    }
    else if (d.type === 'hub2:saved') toast('SAVED TO LIBRARY  ·  ' + d.name);
    else if (d.type === 'hub2:save-request'){
      var ok2 = false;
      H.force = Date.now();
      try { ok2 = typeof window.HUB2_SAVE === 'function' && window.HUB2_SAVE(d.ext) !== false; } catch(err){ ok2 = false; }
      if (!ok2) H.force = 0;
      if (e.source) e.source.postMessage({ type: ok2 ? 'hub2:save-started' : 'hub2:save-unsupported', tool:TOOL, ext:d.ext }, '*');
    }
  });
  /* Ctrl+K / ⌘K inside a tool opens the hub's command palette */
  if (H.inHub) window.addEventListener('keydown', function(e){
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key||'').toLowerCase() === 'k'){
      e.preventDefault(); e.stopPropagation();
      window.parent.postMessage({ type:'hub2:palette', tool:TOOL }, '*');
    }
  }, true);
  function ready(){ if (H.inHub) window.parent.postMessage({ type:'hub2:ready', tool:TOOL, saves: (window.HUB2_SAVES || []).slice() }, '*'); }
  if (document.readyState === 'complete') setTimeout(ready, 0); else window.addEventListener('load', function(){ setTimeout(ready, 30); });
})();
