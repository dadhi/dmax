// tests/actions.e2e.js
// JSDOM-based e2e tests for declarative actions (JSONPlaceholder)

const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function waitFor(conditionFn, timeout = 5000, interval = 50) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll(){
      try {
        if (conditionFn()) return resolve();
      } catch (e) { return reject(e); }
      if (Date.now() - start > timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}

(async () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const { VirtualConsole } = require('jsdom');
  const vconsole = new VirtualConsole();
  vconsole.on('log', (...args) => console.log(...args));
  vconsole.on('info', (...args) => console.info(...args));
  vconsole.on('error', (...args) => console.error('JSDOM error:', ...args));
  vconsole.on('warn', (...args) => console.warn(...args));
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/', virtualConsole: vconsole });
  const { window } = dom;
  const { document } = window;

  // Ensure fetch is available in the JSDOM window (Node v18+ has global fetch)
  if (typeof window.fetch === 'undefined') {
    if (typeof globalThis.fetch !== 'undefined') window.fetch = globalThis.fetch;
    else {
      throw new Error('fetch not available in this environment');
    }
  }

  // Wrap fetch to observe calls
  if (window.fetch) {
    const orig = window.fetch.bind(window);
    let lastRequest = null;
    window.__lastRequest = () => lastRequest;
    window.fetch = async function(...args){
      const url = args[0];
      const init = args[1] || {};
      try{ lastRequest = { url, init }; }catch(e){}
      console.log('TEST: fetch called ->', url);
      const res = await orig(...args);
      try{
        const copy = res.clone();
        const text = await copy.text();
        console.log('TEST: fetch response snippet ->', text.slice(0,200));
        try{ console.log('TEST: state snapshot ->', (window.__getState && window.__getState())); }catch(e){}
      }catch(e){ console.warn('TEST: failed to read response body preview', e.message); }
      return res;
    };
  }

  // allow time for scripts to initialize
  await new Promise(r => setTimeout(r, 200));

  // Test 1: GET post #1
  const loadBtn = document.getElementById('loadPost');
  assert(loadBtn, 'loadPost button exists');
  loadBtn.click();

  await waitFor(() => {
    const st = window.__getState && window.__getState();
    return st && st.postResult && st.postResult.id === 1;
  }, 5000).catch(e => { throw new Error('GET post did not populate postResult: ' + e.message); });

  const state1 = window.__getState();
  assert(state1.postResult && state1.postResult.id === 1, 'postResult populated with id 1');
  // state signals: busy should be false after completion, err should be false, code should be number
  assert(typeof state1.busy !== 'undefined', 'busy signal exists');
  assert(state1.busy === false, 'busy is false after completion');
  assert(typeof state1.err !== 'undefined', 'err signal exists');
  assert(state1.err === false, 'err is false on success');
  if (typeof state1.code !== 'undefined') assert(typeof state1.code === 'number', 'code is number');
  console.log('GET test passed');

  // Test 2: POST create
  const titleInput = document.getElementById('newTitle');
  const createBtn = document.getElementById('createPost');
  assert(titleInput && createBtn, 'createPost elements exist');
  titleInput.value = 'Hello from test';
  // dispatch input event in case code reads event target
  titleInput.dispatchEvent(new window.Event('input', { bubbles: true }));
  createBtn.click();

  await waitFor(() => {
    const st = window.__getState && window.__getState();
    return st && st.createdPost && (st.createdPost.id || st.createdPost.title);
  }, 5000).catch(e => { throw new Error('POST did not populate createdPost: ' + e.message); });

  const state2 = window.__getState();
  assert(state2.createdPost, 'createdPost present');
  assert(typeof state2.busy !== 'undefined', 'busy signal exists for POST');
  assert(state2.busy === false, 'POST busy false after completion');
  assert(typeof state2.err !== 'undefined', 'err signal exists for POST');
  assert(state2.err === false, 'POST err false on success');
  if (typeof state2.code !== 'undefined') assert(typeof state2.code === 'number', 'POST code is number');
  // verify request body nested structure
  const last = window.__lastRequest && window.__lastRequest();
  if(last && last.init && last.init.body){
    try{
      const parsed = JSON.parse(last.init.body);
      // expect nested user.name and user.email from our example
      if(parsed.user){
        assert(parsed.user.name, 'nested user.name present in request body');
        assert(parsed.user.email, 'nested user.email present in request body');
      }
    }catch(e){ console.warn('Could not parse request body', e.message); }
  }
  console.log('POST test passed');

  console.log('All action tests passed');
  process.exit(0);
})();
