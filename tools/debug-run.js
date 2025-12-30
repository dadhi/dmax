const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const vcon = new VirtualConsole();
vcon.on('log', msg => console.log('[page]', msg));
vcon.on('error', msg => console.error('[page error]', msg));
(async ()=>{
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', virtualConsole: vcon });
  const { window } = dom;
  await new Promise(res=>{ window.addEventListener('load', ()=>res(), {once:true}); setTimeout(res,500); });
  const doc = window.document;
  console.log('has __getState:', typeof window.__getState);
  try{ if(typeof window.__getState === 'function') console.log('__getState keys:', Object.keys(window.__getState())); }catch(e){ console.error('getState read error', e); }
  const debug = doc.querySelector('[data-debug]');
  console.log('debug exists:', !!debug);
  if(debug) console.log('debug text length', debug.textContent.length);
  // show a few elements and attributes
  const probeBtn = doc.getElementById('probeBtn');
  console.log('probeBtn exists:', !!probeBtn);
  const preview = doc.querySelector('.preview');
  console.log('preview attrs:', preview ? Array.from(preview.getAttributeNames()) : null);
  setTimeout(()=>process.exit(0),200);
})();
