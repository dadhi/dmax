const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const { pathToFileURL } = require('url');
const dmaxUrl = pathToFileURL(path.join(process.cwd(), 'dmax.js')).href;
const indexUrl = pathToFileURL(path.join(process.cwd(), 'index.html')).href;

const html = `<!doctype html><html><body>
<div data-m-si='{}'></div>
<div id="test" data-m-cl:="dm.foo"></div>
<script src="${dmaxUrl}"></script>
</body></html>`;

async function run() {
  const localErrors = [], localWarnings = [];
  const vconsole = new VirtualConsole();
  vconsole.on('error', (...args) => { localErrors.push('VCONSOLE:' + args.join(' ')); });
  vconsole.on('warn', (...args) => { localWarnings.push('VCONSOLE:' + args.join(' ')); });
  vconsole.on('jsdomError', (...args) => { console.log('JSDOM ERROR:', args.join(' ')); });
  
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: indexUrl, pretendToBeVisual: true, virtualConsole: vconsole });
  const origError = dom.window.console.error;
  const origWarn = dom.window.console.warn;
  dom.window.console.error = (...args) => { localErrors.push('WINDOW:' + args.join(' ')); origError.apply(dom.window.console, args); };
  dom.window.console.warn = (...args) => { localWarnings.push('WINDOW:' + args.join(' ')); origWarn.apply(dom.window.console, args); };
  
  await new Promise(resolve => { dom.window.addEventListener('load', resolve, { once: true }); setTimeout(resolve, 1000); });
  
  console.log('wireNode type:', typeof dom.window.wireNode);
  console.log('dataM:', typeof dom.window.dataM, dom.window.dataM ? Object.keys(dom.window.dataM) : 'null');
  
  const testEl = dom.window.document.getElementById('test');
  if (testEl) {
    const an = testEl.attributes[1]?.name;  // 0=id, 1=data-m-cl:
    const v = testEl.attributes[1]?.value;
    console.log('Direct wireNode call with an:', an, 'v:', v);
    dom.window.wireNode(testEl, an, v);
  }
  
  await new Promise(r => setTimeout(r, 100));
  
  console.log('Errors:', localErrors);
  console.log('Warnings:', localWarnings);
}

run().catch(console.error);
