// Test that action target signal names are properly converted to camelCase
// Regression test for the bug where 'post-result' wasn't converted to 'postResult'

const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const assert = require('assert');

(async () => {
  console.log('Testing action signal name conversion...\n');
  
  const html = fs.readFileSync('index.html', 'utf8');
  const vconsole = new VirtualConsole();
  const logs = [];
  vconsole.on('error', (...args) => logs.push('ERROR: ' + args.join(' ')));
  
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    virtualConsole: vconsole
  });
  
  const { window } = dom;
  if (typeof globalThis.fetch !== 'undefined') window.fetch = globalThis.fetch;
  
  // Mock fetch to return predictable data
  const fetchCalls = [];
  window.fetch = async (url, init) => {
    fetchCalls.push({ url, init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ testData: 'success', id: 42 })
    };
  };
  
  await new Promise(r => setTimeout(r, 300));
  
  const tests = [
    // Test hyphenated target names
    { attr: 'data-get:post-result@#.click', expectedSignal: 'postResult', desc: 'hyphenated target' },
    { attr: 'data-get:user-profile@#.click', expectedSignal: 'userProfile', desc: 'two-word hyphenated' },
    { attr: 'data-get:my-api-result@#.click', expectedSignal: 'myApiResult', desc: 'three-word hyphenated' },
    // Test state signals with hyphenated names
    { attr: 'data-get:result?post-busy__busy@#.click', expectedState: 'postBusy', desc: 'hyphenated state signal' },
    { attr: 'data-get:result?is-loading__busy@#.click', expectedState: 'isLoading', desc: 'is-prefix state' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const testId = `test-${passed + failed}`;
    const btn = window.document.createElement('button');
    btn.id = testId;
    btn.setAttribute(test.attr, 'https://test.com/api');
    window.document.body.appendChild(btn);
    
    // Re-init to pick up new element
    if (window.init) window.init();
    
    await new Promise(r => setTimeout(r, 100));
    
    // Click the button
    btn.click();
    
    await new Promise(r => setTimeout(r, 500));
    
    try {
      const state = window.__getState();
      
      if (test.expectedSignal) {
        assert(state[test.expectedSignal] !== undefined, 
          `Signal ${test.expectedSignal} should exist (from ${test.attr})`);
        assert(state[test.expectedSignal].testData === 'success',
          `Signal ${test.expectedSignal} should have response data`);
        console.log(`✓ ${test.desc}: signal '${test.expectedSignal}' set correctly`);
      }
      
      if (test.expectedState) {
        assert(state[test.expectedState] !== undefined,
          `State signal ${test.expectedState} should exist`);
        console.log(`✓ ${test.desc}: state signal '${test.expectedState}' exists`);
      }
      
      passed++;
    } catch (e) {
      console.log(`✗ ${test.desc}: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed}/${tests.length} passed`);
  
  if (failed > 0) {
    console.log('\nFailed tests show that signal names are not being converted to camelCase!');
    process.exit(1);
  }
  
  console.log('All signal name conversion tests passed!');
  process.exit(0);
})();
