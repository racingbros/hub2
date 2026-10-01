/* Headless check of every HTML file: inline scripts run under jsdom, kit/skin/bridge present, no uncaught errors.
   Usage (from HUB_2P0):  npm i jsdom   then   node tools/validate.js */
const fs=require('fs'),path=require('path');const {JSDOM,VirtualConsole}=require('jsdom');
const dir=path.resolve(__dirname,'..');
for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.html'))){
 const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e.message||e).slice(0,160)));
 const dom=new JSDOM(fs.readFileSync(path.join(dir,f),'utf8'),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/'+f,
  beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.IntersectionObserver=w.ResizeObserver;
   w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,k)=>k==='canvas'?this:(k==='measureText'?()=>({width:10}):(k==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):()=>{}))})};
   w.scrollTo=()=>{};w.structuredClone=o=>JSON.parse(JSON.stringify(o));w.DataTransfer=class{constructor(){this.items={add(){}};this.files=[]}};}});
 setTimeout(()=>{},0);
 const d=dom.window.document;
 const r={f,els:d.querySelectorAll('*').length,kit:!!d.getElementById('hub2-kit'),skin:!!d.getElementById('hub2-skin'),bridge:!!dom.window.__HUB2_BRIDGE__,theme:d.documentElement.getAttribute('data-h2-theme'),errs:[...new Set(errs)].slice(0,4)};
 console.log(JSON.stringify(r));dom.window.close();
}
