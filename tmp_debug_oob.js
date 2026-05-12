const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM, VirtualConsole } = require('jsdom');

const indexPath = path.join(process.cwd(), 'index.html');
const vconsole = new VirtualConsole();
vconsole.on('log', (...args) => console.log('[page]', ...args));
vconsole.on('error', (...args) => console.error('[page error]', args.join(' ').substring(0, 200)));
vconsole.on('warn', (...args) => console.warn('[page warn]', args.join(' ').substring(0, 200)));

(async () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html><head><script src="dmax.js"></script></head>
<body>
<div data-def='{"foo":"bar"}'></div>
<button id="oobLoad" data-get^html@.="'/mock/oob'">Click</button>
<div id="oobTarget"><strong>Initial</strong></div>
</body></html>`, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: pathToFileURL(indexPath).href,
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  const { document } = window;

  await new Promise(r => window.addEventListener('load', () => r(), { once: true }));
  await new Promise(r => setTimeout(r, 200));

  console.log('dmax loaded:', typeof window.applyDmaxOobHtml === 'function');
  console.log('wireNode exists:', typeof window.wireNode === 'function');
  
  // Try wiring manually
  const btn = document.getElementById('oobLoad');
  console.log('btn has data-get attr:', btn.hasAttribute('data-get^html@.'));
  
  // Check what events are on the button
  window.fetch = async function(url, init) {
    console.log('[mock] FETCH CALLED:', String(url));
    return {
      ok: true, status: 200,
      headers: { get: (n) => String(n||'').toLowerCase() === 'content-type' ? 'text/html' : null },
      async text() { return '<div id="oobTarget"><strong>OOB morphed content</strong></div>'; }
    };
  };

  // Try triggering via dispatchEvent with MouseEvent
  btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  const oobTarget = document.getElementById('oobTarget');
  console.log('oobTarget after MouseEvent click:', oobTarget ? oobTarget.textContent : 'N/A');
  
  process.exit(0);
})().catch(e => { console.error('Fatal:', e); process.exit(1); });
