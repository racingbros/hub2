#!/usr/bin/env node
/* Inject kit/hub2-kit.css + kit/hub2-bridge.js into every tool between markers.
   Usage: node tools/sync-kit.js          (from HUB_2P0 root)
   Idempotent: re-running replaces the previous block. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['index.html', 'BIG.html']);   // hub has its own copy; BIG is a bundled document
const css = fs.readFileSync(path.join(ROOT, 'kit/hub2-kit.css'), 'utf8').trim();
const FONTMAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'kit/fonts.json'), 'utf8'));
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
const js  = fs.readFileSync(path.join(ROOT, 'kit/hub2-bridge.js'), 'utf8').trim().replace(/H\.version = '[^']*'/, `H.version = '${VERSION}'`);
const B = '<!--HUB2:KIT:BEGIN-->', E = '<!--HUB2:KIT:END-->';
const block = `${B}\n<style id="hub2-kit">\n${css}\n</style>\n<script id="hub2-bridge">\n${js.replace(/<\/script/gi,'<\\/script')}\n</script>\n${E}`;
let n = 0;
for (const f of fs.readdirSync(ROOT).filter(f => /\.html$/i.test(f) && !SKIP.has(f))) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, 'utf8');
  const i = s.indexOf(B), j = s.indexOf(E);
  if (i >= 0 && j > i) s = s.slice(0, i) + block + s.slice(j + E.length);
  else {
    const m = /<meta[^>]+charset[^>]*>/i.exec(s) || /<head[^>]*>/i.exec(s);
    if (!m) { console.warn('skip (no <head>):', f); continue; }
    const at = m.index + m[0].length;
    s = s.slice(0, at) + '\n' + block + s.slice(at);
  }
  /* embedded webfonts (latin subsets, kit/fonts) → <style id="hub2-fonts"> right after the kit block */
  const fonts = (FONTMAN.fonts || {})[f];
  if (fonts) {
    const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
    let fc = '';
    for (const [fam, ws] of Object.entries(fonts)) for (const w of ws) {
      const b64 = fs.readFileSync(path.join(ROOT, 'kit/fonts', `${FONTMAN.files[fam]}-${w}.woff2`)).toString('base64');
      fc += `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${LATIN}}\n`;
    }
    const tag = `<style id="hub2-fonts">\n/*HUB2:FONTS — offline webfonts, source kit/fonts.json*/\n${fc}</style>\n`;
    const re = /<style id="hub2-fonts">[\s\S]*?<\/style>\n/;
    if (re.test(s)) s = s.replace(re, () => tag);
    else { const k = s.indexOf(E) + E.length; s = s.slice(0, k) + '\n' + tag + s.slice(k); }
  }
  /* vendored libraries (kit/vendor) replace CDN <script src> tags */
  for (const lib of ((FONTMAN.vendor || {})[f] || [])) {
    const code = fs.readFileSync(path.join(ROOT, 'kit/vendor', lib), 'utf8').replace(/<\/script/gi, '<\\/script');
    const id = 'hub2-vendor-' + lib.replace(/\.min\.js$/, '');
    const tag = `<script id="${id}">/*HUB2:VENDOR ${lib} — offline copy, source kit/vendor*/\n${code}\n</script>`;
    const reId = new RegExp(`<script id="${id}">[\\s\\S]*?<\\/script>`);
    const reCdn = new RegExp(`<script src="https://cdnjs\\.cloudflare\\.com/[^"]*/${lib.replace(/\./g, '\\.')}"><\\/script>`);
    if (reId.test(s)) s = s.replace(reId, () => tag);
    else if (reCdn.test(s)) s = s.replace(reCdn, () => tag);
    else console.warn('vendor slot not found:', f, lib);
  }
  /* per-tool glue: glue/<TOOL>.js → <script id="hub2-glue"> before the closing </body> */
  const gluePath = path.join(ROOT, 'glue', f.replace(/\.html$/i, '.js'));
  if (fs.existsSync(gluePath)) {
    const g = `<script id="hub2-glue">/*HUB2:GLUE — source glue/${path.basename(gluePath)}*/\n${fs.readFileSync(gluePath,'utf8').trim().replace(/<\/script/gi,'<\\/script')}\n</script>\n`;
    const re = /<script id="hub2-glue">[\s\S]*?<\/script>\n/;
    if (re.test(s)) s = s.replace(re, () => g);
    else { const k = s.toLowerCase().lastIndexOf('</body>'); if (k < 0) console.warn('no </body>:', f); else s = s.slice(0, k) + g + s.slice(k); }
  }
  /* per-tool skin: skins/<TOOL>.css → <style id="hub2-skin"> before </head> */
  const skinPath = path.join(ROOT, 'skins', f.replace(/\.html$/i, '.css'));
  if (fs.existsSync(skinPath)) {
    const skin = `<style id="hub2-skin">\n/*HUB2:SKIN — tool chrome mapped onto HUB 2.0 tokens. Source: skins/${path.basename(skinPath)}*/\n${fs.readFileSync(skinPath,'utf8').trim()}\n</style>\n`;
    const re = /<style id="hub2-skin">[\s\S]*?<\/style>\n/;
    if (re.test(s)) s = s.replace(re, () => skin);
    else { const k = s.search(/<\/head>/i); s = s.slice(0, k) + skin + s.slice(k); }
  }
  fs.writeFileSync(p, s); n++;
  console.log('kit →', f, fs.existsSync(skinPath) ? '+ skin' : '');
}
console.log(`synced ${n} file(s)`);

/* hub: splice kit/hub-library.js into index.html */
{
  const p = path.join(ROOT, 'index.html');
  let s = fs.readFileSync(p, 'utf8');
  const LB = '/*HUB2:LIBRARY:BEGIN*/', LE = '/*HUB2:LIBRARY:END*/';
  const i = s.indexOf(LB), j = s.indexOf(LE);
  if (i >= 0 && j > i) {
    let lib = fs.readFileSync(path.join(ROOT, 'kit/hub-library.js'), 'utf8').replace(/const HUB_VERSION = '[^']*';/, `const HUB_VERSION = '${VERSION}';`);
    fs.writeFileSync(path.join(ROOT, 'kit/hub-library.js'), lib);
    s = s.replace(/<title>RACINGBROS — TOOLKIT HUB [^<]*<\/title>/, `<title>RACINGBROS — TOOLKIT HUB ${VERSION}</title>`)
         .replace(/(<span class="ver" id="hub-ver">)[^<]*(<\/span>)/, `$1${VERSION}$2`)
         .replace(/(<span id="devp-ver">)[^<]*(<\/span>)/, `$1${VERSION}$2`);
    s = s.slice(0, i + LB.length) + '\n' + lib + s.slice(j);
    fs.writeFileSync(p, s);
    console.log('library → index.html  ·  v' + VERSION);
  }
}
