// tests/actions.e2e.js
// JSDOM-based e2e tests for declarative actions using deterministic fetch mocks.

const assert = require('assert');
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const { pathToFileURL } = require('url');

function waitFor(conditionFn, timeout = 5000, interval = 25) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      try {
        if (conditionFn()) return resolve();
      } catch (e) {
        return reject(e);
      }
      if (Date.now() - start > timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}

function readDebugState(document) {
  const debug = document.querySelector('[data-debug]');
  if (!debug || !debug.textContent.trim()) return {};
  return JSON.parse(debug.textContent);
}

const DUMMYJSON_POST = Object.freeze({
  id: 1,
  title: 'His mother had always taught him',
  body: "His mother had always taught him not to ever think of himself as better than others. He'd tried to live by this motto. He never looked down on those who were less fortunate or who had less money than him. But the stupidity of the group of people he was talking to made him change his mind.",
  tags: ['history', 'american', 'crime'],
  reactions: { likes: 192, dislikes: 25 },
  views: 305,
  userId: 121
});

function makeJsonResponse(payload, status = 200) {
  const body = JSON.stringify(payload);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return String(name || '').toLowerCase() === 'content-type' ? 'application/json' : null;
      }
    },
    async json() {
      return payload;
    },
    async text() {
      return body;
    },
    clone() {
      return makeJsonResponse(payload, status);
    }
  };
}

function makeSseResponse(bodyText) {
  let streamBody = null;
  if (typeof ReadableStream !== 'undefined' && typeof TextEncoder !== 'undefined') {
    const encoded = new TextEncoder().encode(bodyText);
    const half = Math.floor(encoded.length / 2);
    streamBody = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoded.slice(0, half));
        ctrl.enqueue(encoded.slice(half));
        ctrl.close();
      }
    });
  }
  return {
    ok: true,
    status: 200,
    headers: {
      get(name) {
        return String(name || '').toLowerCase() === 'content-type' ? 'text/event-stream' : null;
      }
    },
    body: streamBody,
    async text() {
      return bodyText;
    }
  };
}

function getPathname(url) {
  return new URL(String(url), 'http://localhost').pathname;
}

(async () => {
  const indexPath = path.join(process.cwd(), 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const vconsole = new VirtualConsole();
  vconsole.on('log', (...args) => console.log(...args));
  vconsole.on('info', (...args) => console.info(...args));
  vconsole.on('error', (...args) => console.error('JSDOM error:', ...args));
  vconsole.on('warn', (...args) => console.warn(...args));

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: pathToFileURL(indexPath).href,
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  const { document } = window;

  await new Promise((res) => {
    window.addEventListener('load', () => res(), { once: true });
    setTimeout(res, 1000);
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for notebook asserts to finish')), 20000);
    function onDone() {
      clearTimeout(timer);
      resolve();
    }
    window.addEventListener('dmax:tests:done', onDone, { once: true });
  });
  await new Promise(r => setTimeout(r, 100));

  let lastRequest = null;
  const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
  window.fetch = function (url, init = {}) {
    lastRequest = { url: String(url), init };
    const pathname = getPathname(url);
    if (pathname === '/posts/1') {
      return Promise.resolve(makeJsonResponse(DUMMYJSON_POST, 200));
    }
    if (pathname === '/posts/add') {
      let submitted = null;
      try { submitted = init.body ? JSON.parse(init.body) : null; } catch (_) {}
      const payload = Object.assign({ id: 252 }, submitted && typeof submitted === 'object' ? submitted : null);
      if (payload.userId != null && payload.userId !== '') payload.userId = Number(payload.userId);
      return Promise.resolve(makeJsonResponse(payload, 201));
    }
    if (pathname === '/mock/oob') {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: {
          get(name) {
            return String(name || '').toLowerCase() === 'content-type' ? 'text/html' : null;
          }
        },
        async text() {
          return '<div id="oobTarget" data-oob="morph"><strong>OOB morphed content</strong> <span>(via dAction + morph)</span></div>';
        }
      });
    }
    if (pathname === '/mock/dmax-sse') {
      return Promise.resolve(makeSseResponse([
        'event: dmax-patch-signals',
        'data: dmaxSignals {"sseMessage":"hello from dmax","sseCount":1}',
        '',
        'event: dmax-patch-elements',
        'data: mode outer',
        'data: dmaxElements <div id="sseTarget"><strong>SSE morphed target</strong> <span>✓</span></div>',
        ''
      ].join('\n')));
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };
  window.__lastRequest = () => lastRequest;

  const loadBtn = document.getElementById('loadPost');
  assert(loadBtn, 'loadPost button exists');
  loadBtn.click();

  await waitFor(() => readDebugState(document).postResult?.id === 1)
    .catch(e => { throw new Error('GET post did not populate postResult: ' + e.message); });

  const state1 = readDebugState(document);
  assert.strictEqual(state1.postResult.id, 1, 'postResult populated with id 1');
  assert.strictEqual(state1.postResult.title, 'His mother had always taught him', 'postResult uses DummyJSON title');
  assert.deepStrictEqual(state1.postResult.tags, ['history', 'american', 'crime'], 'postResult uses DummyJSON tags');
  assert.deepStrictEqual(state1.postResult.reactions, { likes: 192, dislikes: 25 }, 'postResult uses DummyJSON reactions');
  assert.strictEqual(state1.postResult.views, 305, 'postResult uses DummyJSON views');
  assert.strictEqual(state1.postResult.userId, 121, 'postResult uses DummyJSON userId');
  assert.strictEqual(state1.busy, false, 'busy is false after GET completion');
  assert.strictEqual(state1.err, null, 'err is null on GET success');
  assert.strictEqual(state1.code, 200, 'GET code is recorded');
  assert.strictEqual(window.__lastRequest().init.method, 'GET', 'GET request uses GET method');
  assert.strictEqual(window.__lastRequest().url, 'https://dummyjson.com/posts/1', 'GET request uses DummyJSON endpoint');
  console.log('GET test passed');

  const titleInput = document.getElementById('new-title');
  const bodyInput = document.getElementById('new-body');
  const userIdInput = document.getElementById('new-user-id');
  const createBtn = document.getElementById('create-post');
  assert(titleInput && bodyInput && userIdInput && createBtn, 'createPost elements exist');

  titleInput.value = 'Notebook post from test';
  bodyInput.value = 'Updated from the actions.e2e harness.';
  userIdInput.value = '9';

  createBtn.click();

  await waitFor(() => readDebugState(document).createdPost?.id === 252)
    .catch(e => { throw new Error('POST did not populate createdPost: ' + e.message); });

  const state2 = readDebugState(document);
  assert(state2.createdPost, 'createdPost present');
  assert.strictEqual(state2.createdPost.title, 'Notebook post from test', 'createdPost reflects updated title');
  assert.strictEqual(state2.createdPost.body, 'Updated from the actions.e2e harness.', 'createdPost reflects updated body');
  assert.strictEqual(state2.createdPost.userId, 9, 'createdPost normalizes userId to a number');
  assert.strictEqual(state2.busy, false, 'POST busy false after completion');
  assert.strictEqual(state2.err, null, 'POST err null on success');
  assert.strictEqual(state2.code, 201, 'POST code is recorded');

  const last = window.__lastRequest();
  assert.strictEqual(last.init.method, 'POST', 'POST request uses POST method');
  assert.ok(last.init.body, 'POST request sent a body');
  assert.strictEqual(last.url, 'https://dummyjson.com/posts/add', 'POST request uses DummyJSON add endpoint');
  assert.deepStrictEqual(JSON.parse(last.init.body), {
    title: 'Notebook post from test',
    body: 'Updated from the actions.e2e harness.',
    userId: 9
  }, 'POST request body spreads the draft post signal');
  assert.strictEqual(last.init.headers['content-type'], 'application/json', 'POST request is JSON');

  console.log('POST test passed');

  const oobBtn = document.getElementById('oobLoad');
  const oobTarget = document.getElementById('oobTarget');
  assert(oobBtn && oobTarget, 'oob elements exist');
  oobBtn.click();

  await waitFor(() => /OOB morphed content/.test(oobTarget.textContent || ''))
    .catch(e => { throw new Error('OOB morph did not update target: ' + e.message); });

  assert(/via dAction \+ morph/.test(oobTarget.textContent || ''), 'OOB target shows morphed content');
  console.log('OOB test passed');

  const sseBtn = document.getElementById('sseLoad');
  const sseTarget = document.getElementById('sseTarget');
  assert(sseBtn && sseTarget, 'sse elements exist');
  sseBtn.click();

  await waitFor(() => {
    const state = readDebugState(document);
    return state.sseMessage === 'hello from dmax' && state.sseCount === 1 && /SSE morphed target/.test(sseTarget.textContent || '');
  }).catch(e => { throw new Error('SSE mock did not update signals and target: ' + e.message); });

  const state3 = readDebugState(document);
  assert.strictEqual(state3.sseMessage, 'hello from dmax', 'SSE signal patch updates message');
  assert.strictEqual(state3.sseCount, 1, 'SSE signal patch updates count');
  assert.strictEqual(state3.err, null, 'SSE leaves err null on success');
  assert.strictEqual(window.__lastRequest().url, '/mock/dmax-sse', 'SSE action uses the local deterministic mock route');
  console.log('SSE test passed');

  console.log('All action tests passed');
  process.exit(0);
})();
