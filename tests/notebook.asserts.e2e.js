const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM, VirtualConsole } = require('jsdom');

function waitFor(conditionFn, timeout = 15000, interval = 100) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      try {
        const value = conditionFn();
        if (value) return resolve(value);
      } catch (err) {
        return reject(err);
      }
      if (Date.now() - start > timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}

(async () => {
  const indexPath = path.join(process.cwd(), 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const dmaxPos = html.indexOf('<script src="dmax.js"></script>');
  const assertsPos = html.indexOf('<script src="asserts.js"></script>');

  assert(dmaxPos >= 0, 'index.html loads dmax.js');
  assert(assertsPos > dmaxPos, 'index.html loads asserts.js after dmax.js');

  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', () => {});
  virtualConsole.on('warn', () => {});

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: pathToFileURL(indexPath).href,
    pretendToBeVisual: true,
    virtualConsole,
  });

  const { document } = dom.window;
  const summaryText = await waitFor(() => {
    const summary = document.getElementById('summary')?.textContent || '';
    return /Tests (\d+): Passed (\d+), Failed 0/.test(summary) ? summary : '';
  });

  const match = summaryText.match(/Tests (\d+): Passed (\d+), Failed 0/);
  const total = Number(match[1]);
  const passed = Number(match[2]);

  assert(total > 100, `expected many notebook asserts to run, got ${summaryText}`);
  assert.strictEqual(total, passed, `expected all notebook asserts to pass, got ${summaryText}`);
  assert.strictEqual(document.getElementById('live-dsub')?.tagName, 'SECTION', 'live examples section exists');
  assert.strictEqual(document.getElementById('ported-examples')?.tagName, 'SECTION', 'ported examples section exists');

  const helloStrong = Array.from(document.getElementsByTagName('strong')).find((el) =>
    el.closest('#ported-examples') && el.parentElement?.textContent?.includes('Hello,')
  );
  assert.strictEqual(helloStrong?.textContent, 'Alice', 'ported examples stay rendered after asserts run');

  console.log('Notebook asserts smoke test passed:', summaryText);
  process.exit(0);
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
