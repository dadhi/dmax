// tests/actions.e2e.js
// JSDOM-based e2e tests for declarative actions using deterministic fetch mocks.

const { JSDOM, VirtualConsole } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
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
  await new Promise(r => setTimeout(r, 200));

  let lastRequest = null;
  window.__lastRequest = () => lastRequest;
  window.fetch = async function (url, init = {}) {
    lastRequest = { url: String(url), init };
    const pathname = getPathname(url);
    if (pathname === '/posts/1') {
      return makeJsonResponse({ id: 1, title: 'Mocked post', body: 'hello', userId: 7 }, 200);
    }
    if (pathname === '/posts') {
      let submitted = null;
      try { submitted = init.body ? JSON.parse(init.body) : null; } catch (_) {}
      return makeJsonResponse({ id: 101, submitted }, 201);
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };

  const loadBtn = document.getElementById('loadPost');
  assert(loadBtn, 'loadPost button exists');
  loadBtn.click();

  await waitFor(() => readDebugState(document).postResult?.id === 1)
    .catch(e => { throw new Error('GET post did not populate postResult: ' + e.message); });

  const state1 = readDebugState(document);
  assert.strictEqual(state1.postResult.id, 1, 'postResult populated with id 1');
  assert.strictEqual(state1.busy, false, 'busy is false after GET completion');
  assert.strictEqual(state1.err, null, 'err is null on GET success');
  assert.strictEqual(state1.code, 200, 'GET code is recorded');
  assert.strictEqual(window.__lastRequest().init.method, 'GET', 'GET request uses GET method');
  console.log('GET test passed');

  const titleInput = document.getElementById('new-title');
  const nameInput = document.getElementById('new-user-name');
  const emailInput = document.getElementById('new-user-email');
  const createBtn = document.getElementById('create-post');
  assert(titleInput && nameInput && emailInput && createBtn, 'createPost elements exist');

  titleInput.value = 'Hello from test';
  nameInput.value = 'Test User';
  emailInput.value = 'test@example.com';
  createBtn.click();

  await waitFor(() => readDebugState(document).createdPost?.id === 101)
    .catch(e => { throw new Error('POST did not populate createdPost: ' + e.message); });

  const state2 = readDebugState(document);
  assert(state2.createdPost, 'createdPost present');
  assert.strictEqual(state2.busy, false, 'POST busy false after completion');
  assert.strictEqual(state2.err, null, 'POST err null on success');
  assert.strictEqual(state2.code, 201, 'POST code is recorded');

  const last = window.__lastRequest();
  assert.strictEqual(last.init.method, 'POST', 'POST request uses POST method');
  assert.ok(last.init.body, 'POST request sent a body');
  assert.strictEqual(last.init.headers['Content-Type'], 'application/json', 'POST request is JSON');

  //todo: @feat support explicit per-input body keys / nested body mapping in dAction so multi-field POST payloads can be asserted here.
  console.log('POST test passed');

  console.log('All action tests passed');
  process.exit(0);
})();
