// tests/fuzz.deterministic.js
// Deterministic fuzzing test suite for dmax data-* attributes
// Generates systematic combinations of valid/invalid syntax and verifies behavior

const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// ============================================================================
// Test Case Generators
// ============================================================================

const SIGNAL_NAMES = ['foo', 'bar', 'count', 'user.name', 'ui.theme-color', 'posts[idx]', 'items[0].title'];
// Note: Parser doesn't validate signal/property names - they're just strings that may fail at runtime
const INVALID_SIGNAL_NAMES = []; // Removed: parser accepts all non-empty strings, validation is runtime

const PROPERTIES = ['value', 'checked', 'text-content', 'style.color', 'style.font-size', 'class-list'];
const INVALID_PROPERTIES = []; // Removed: parser doesn't validate property names

const EVENTS = ['click', 'input', 'change', 'mouseover', 'keydown'];
const SPECIAL_EVENTS = ['_window.resize', '_document.click', '_interval.1000', '_timeout.500'];

const MODIFIERS = ['immediate', 'notimmediate', 'once', 'debounce.100', 'throttle.200', 'prevent', 'and.gate', 'notand.flag', 'gt.5', 'eq.3', 'lt.10'];
const INVALID_MODIFIERS = ['', 'unknown'];

const EXPRESSIONS = [
  'dm.foo',
  'dm.foo + 1',
  'dm.user.name',
  'dm.foo ? "yes" : "no"',
  '!dm.bar',
  'dm.foo * 2',
  'ev.target.value',
  'el.id',
  'sg',
  'detail.added.length'
];

const INVALID_EXPRESSIONS = [
  '',
  'undefined',
  'null',
  'throw new Error("test")',
  'while(true){}',
  'window.location = "evil"'
];

const DMAX_URL = pathToFileURL(path.join(process.cwd(), 'dmax.js')).href;
const INDEX_URL = pathToFileURL(path.join(process.cwd(), 'index.html')).href;
const BASE_STATE = JSON.stringify({
  foo: 0,
  bar: 1,
  count: 2,
  title: 'Hello title',
  page: 3,
  targetId: 42,
  authorization: 'Bearer tok-xyz',
  reqHeaders: { authorization: 'Bearer hdr-123', 'x-trace': 'trace-abc' },
  user: { name: 'Alice', posts: [], themeColor: '', fontSize: '', isActive: false },
  ui: { themeColor: '', fontSize: '', isActive: false },
  posts: ['First', 'Second', 'Third'],
  items: [],
  idx: 0,
  parent: {},
  result: {},
  app: { data: { items: [] } }
}).replace(/&/g, '&amp;').replace(/'/g, '&#39;');

function buildTestHtml(insertEl) {
  return `<!doctype html><html><body>
<div data-def='${BASE_STATE}'></div>
<div id="elem"></div>
<div id="other"></div>
<button id="btn"></button>
<input id="input" value="hello"/>
<input id="src" value="alpha"/>
<input id="dest" value="beta"/>
<template id="tpl-post"><div class="post"></div></template>
<template id="tpl-item"><div class="item"></div></template>
<template id="tpl"><div class="generic"></div></template>
${insertEl}
<script src="${DMAX_URL}"></script>
</body></html>`;
}

// ============================================================================
// Attribute Name Generators
// ============================================================================

function* generateDataSubCombinations() {
  // Valid combinations
  
  // 1. Single target, single trigger
  for (const sig of SIGNAL_NAMES.slice(0, 3)) {
    for (const trig of SIGNAL_NAMES.slice(0, 3)) {
      yield { attr: `data-sub:${sig}@${trig}`, valid: true, category: 'single-target-trigger' };
    }
  }
  
  // 2. Single property target, single event trigger
  for (const prop of PROPERTIES.slice(0, 3)) {
    for (const ev of EVENTS.slice(0, 3)) {
      yield { attr: `data-sub:.${prop}@.${ev}`, valid: true, category: 'prop-event' };
    }
  }
  
  // 3. Multiple targets
  yield { attr: 'data-sub:foo:bar@baz', valid: true, category: 'multi-target' };
  yield { attr: 'data-sub:foo:.value@.click', valid: true, category: 'mixed-targets' };
  yield { attr: 'data-sub:.value:.checked@.click', valid: true, category: 'multi-prop-targets' };
  
  // 4. Multiple triggers
  yield { attr: 'data-sub:foo@bar@baz', valid: true, category: 'multi-trigger' };
  yield { attr: 'data-sub:foo@bar@.click@#btn.click', valid: true, category: 'mixed-triggers' };
  
  // 5. With modifiers
  for (const mod of MODIFIERS.slice(0, 5)) {
      yield { attr: `data-sub:foo@bar^${mod}`, valid: true, category: 'trigger-mod' };
    }
  yield { attr: 'data-sub^once:foo@bar', valid: true, category: 'global-mod' };
  yield { attr: 'data-sub^once:foo@bar^always', valid: true, category: 'mod-override' };
  
  // 6. Special triggers
  for (const special of SPECIAL_EVENTS) {
    yield { attr: `data-sub:foo@${special}`, valid: true, category: 'special-trigger' };
  }
  
  // 7. No target (side effect)
  yield { attr: 'data-sub@foo', valid: true, category: 'side-effect' };
  yield { attr: 'data-sub@.click', valid: true, category: 'side-effect-event' };
  
  // 8. No trigger (immediate eval)
  yield { attr: 'data-sub:foo', valid: true, category: 'no-trigger' };
  yield { attr: 'data-sub:.value', valid: true, category: 'no-trigger-prop' };
  
  // 9. Cross-element references
  yield { attr: 'data-sub:#elem.value@#other.input', valid: true, category: 'cross-element' };
  yield { attr: 'data-sub:foo@#elem.click', valid: true, category: 'cross-element-event' };
  
  // Invalid combinations - Note: Parser is lenient, only catches syntax errors
  
  // 10. Signal names with dots - parser accepts these (runtime will handle)
  // Removed: foo., .foo, foo..bar tests - parser doesn't validate these
  
  // 11. Invalid properties - parser doesn't validate property names
  // Removed: invalid property tests - parser is lenient
  
  yield { attr: 'data-sub+extra@foo', valid: false, category: 'unsupported-add-warning', expectedLog: 'warn', logPattern: 'Supports only targets, triggers, mods but found more' };
  
  // Note: Parser doesn't validate modifier names or detect conflicts - they're just strings
  // Removed: Invalid modifier and conflicting modifier tests - parser is lenient
}

function* generateDataSyncCombinations() {
  // Valid combinations
  
  // 1. Signal to default property (two-way)
  for (const sig of SIGNAL_NAMES.slice(0, 3)) {
    yield { attr: `data-sync:${sig}`, valid: true, category: 'two-way-default' };
  }
  
  // 2. Signal to explicit property (two-way)
  for (const sig of SIGNAL_NAMES.slice(0, 2)) {
    for (const prop of PROPERTIES.slice(0, 2)) {
        yield { attr: `data-sync:${sig}:.${prop}`, valid: true, category: 'two-way-explicit' };
    }
  }
  
  // 3. Signal to element (one-way: signal → element)
  for (const sig of SIGNAL_NAMES.slice(0, 2)) {
    yield { attr: `data-sync@${sig}`, valid: true, category: 'one-way-sig-to-el' };
  }
  
  // 4. Element to signal (one-way: element → signal)
  for (const sig of SIGNAL_NAMES.slice(0, 2)) {
    yield { attr: `data-sync:${sig}@.`, valid: true, category: 'one-way-el-to-sig' };
    yield { attr: `data-sync:${sig}@.value`, valid: true, category: 'one-way-el-to-sig-explicit' };
  }
  
  // 5. Signal to signal
  yield { attr: 'data-sync:foo:bar', valid: true, category: 'signal-to-signal' };
  yield { attr: 'data-sync:user.name:display-name', valid: true, category: 'nested-to-signal' };
  
  // 6. With modifiers
  yield { attr: 'data-sync^notimmediate:foo', valid: true, category: 'with-mod' };
  
  // Note: data-sync has fallback for simple forms - accepts empty/malformed and just returns
  // Parser doesn't validate signal/property names - they're just strings
}

function* generateDataClassCombinations() {
  // Valid
  yield { attr: 'data-class:+active@is-active', valid: true, category: 'single-class' };
  yield { attr: 'data-class+active+!inactive@is-active', valid: true, category: 'inverse-class' };
  yield { attr: 'data-class:+foo:+bar@baz', valid: true, category: 'multi-class' };
  yield { attr: 'data-class:', valid: false, category: 'missing-class-error', expectedLog: 'warnOrError', logPattern: 'dClass requires class names via + syntax' };
}

function* generateDataDispCombinations() {
  // Valid
  yield { attr: 'data-disp@is-visible', valid: true, category: 'display-signal' };
  yield { attr: 'data-disp@flag', valid: true, category: 'display-flag' };
  yield { attr: 'data-disp:', valid: false, category: 'missing-trigger-error', expectedLog: 'warnOrError', logPattern: 'dDisp requires at least one trigger' };
}

function* generateDataDumpCombinations() {
  // Valid - standard patterns
  yield { attr: 'data-dump+#tpl-post@posts', valid: true, category: 'with-template' };
  yield { attr: 'data-dump@posts+#tpl-post', valid: true, category: 'reversed-order' };
  yield { attr: 'data-dump@posts', valid: true, category: 'inline-template' };
  
  // Valid - dotted signal paths
  yield { attr: 'data-dump+#tpl-post@user.posts', valid: true, category: 'dotted-signal' };
  yield { attr: 'data-dump+#tpl-item@app.data.items', valid: true, category: 'deep-dotted' };
  yield { attr: 'data-dump+#tpl-post', valid: false, category: 'missing-trigger-error', expectedLog: 'warnOrError', logPattern: 'dDump requires a signal trigger' };
}

function* generateDataActionCombinations() {
  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  
  // Valid
  for (const method of methods) {
    yield { attr: `data-${method}:result@.click`, valid: true, category: `${method}-basic` };
    yield { attr: `data-${method}^json:result@.click`, valid: true, category: `${method}-json` };
    yield { attr: `data-${method}+#input.value:result@.click`, valid: true, category: `${method}-input` };
    yield { attr: `data-${method}^busy.busy^err.err:result@.click`, valid: true, category: `${method}-state` };
    // Test hyphenated signal names (must convert to camelCase)
    yield { attr: `data-${method}:post-result@.click`, valid: true, category: `${method}-hyphenated-target` };
    // Note: Actions don't support signal triggers (only event triggers like @#.click or @_interval.1000)
    // Test state signals via modifiers
    yield { attr: `data-${method}^busy.req-busy^err.req-err^code.req-code:result@.click`, valid: true, category: `${method}-state-modes` };
    yield { attr: `data-${method}^busy.status:result@.click`, valid: true, category: `${method}-state-all` };
    yield { attr: `data-${method}^headers.req-headers:result@.click`, valid: true, category: `${method}-headers-modifier` };
    yield { attr: `data-${method}^header.authorization:result@.click`, valid: true, category: `${method}-header-modifier` };
    yield { attr: `data-${method}^auth.authorization:result@.click`, valid: true, category: `${method}-auth-modifier` };
    if (method !== 'get') yield { attr: `data-${method}^body.target-id:result@.click+title`, valid: true, category: `${method}-body-routing` };
    yield { attr: `data-${method}^append:items@.click`, valid: true, category: `${method}-append-modifier` };
    yield { attr: `data-${method}^prepend:items@.click`, valid: true, category: `${method}-prepend-modifier` };
  }
}

// ============================================================================
// Expression Fuzzing
// ============================================================================

function* generateExpressionCombinations() {
  // Valid expressions
  for (const expr of EXPRESSIONS) {
    yield { expr, valid: true, category: 'valid-expr' };
  }
  
  // Invalid expressions
  for (const expr of INVALID_EXPRESSIONS) {
    yield { expr, valid: false, category: 'invalid-expr', error: 'eval-error' };
  }
  
  // Edge cases
  yield { expr: 'dm.foo.bar.baz.qux.deep', valid: true, category: 'deep-access' };
  yield { expr: 'dm.posts[dm.idx]', valid: true, category: 'bracket-access' };
  yield { expr: 'dm.foo && dm.bar || dm.baz', valid: true, category: 'boolean-logic' };
  yield { expr: '`template ${dm.foo}`', valid: true, category: 'template-string' };
}

// ============================================================================
// Test Runner
// ============================================================================

class FuzzTestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [],
      categories: {}
    };
    this.dom = null;
  }
  
  async setup() {
    this.errors = [];
  }
  
  async testAttribute(testCase) {
    const { attr, valid, category, expr = 'dm.foo || "test"', expectedLog = null, logPattern = '', exercise = null } = testCase;
    this.results.total++;
    
    if (!this.results.categories[category]) {
      this.results.categories[category] = { passed: 0, failed: 0 };
    }
    
    try {
      const esc = s => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const testId = `fuzz-test-${this.results.total}`;
      
      // For inline-template tests, add a child <template>
      const needsInlineTemplate = category === 'inline-template';
      const insertEl = needsInlineTemplate 
        ? `<div id="${testId}" ${attr}="${esc(expr)}"><template><div class="inline-item"></div></template></div>`
        : `<div id="${testId}" ${attr}="${esc(expr)}"></div>`;

      const localErrors = [], localWarnings = [], requests = [];
      const vconsole = new VirtualConsole();
      vconsole.on('error', (...args) => localErrors.push(args.join(' ')));
      vconsole.on('warn', (...args) => localWarnings.push(args.join(' ')));

      const dom = new JSDOM(buildTestHtml(insertEl), {
        runScripts: 'dangerously',
        resources: 'usable',
        url: INDEX_URL,
        pretendToBeVisual: true,
        virtualConsole: vconsole
      });
      
      dom.window.fetch = async (url, init = {}) => {
        requests.push({ url: String(url), init });
        return {
          ok: true,
          status: 200,
          headers: { get: (name) => String(name || '').toLowerCase() === 'content-type' ? 'application/json' : null },
          json: async () => ({ ok: true }),
          text: async () => JSON.stringify({ ok: true }),
          clone() { return this; }
        };
      };

      const origError = dom.window.console.error;
      const origWarn = dom.window.console.warn;
      dom.window.console.error = (...args) => {
        localErrors.push(args.join(' '));
        origError.apply(dom.window.console, args);
      };
      dom.window.console.warn = (...args) => {
        localWarnings.push(args.join(' '));
        origWarn.apply(dom.window.console, args);
      };
      
      await new Promise((resolve) => {
        dom.window.addEventListener('load', () => resolve(), { once: true });
        setTimeout(resolve, 1000);
      });
      const allNodes = Array.from(dom.window.document.querySelectorAll('*'));
      for (const n of allNodes)
        for (const a of Array.from(n.attributes || []))
          if (a.name.indexOf('data-') === 0 && typeof dom.window.wireNode === 'function') dom.window.wireNode(n, a.name, a.value)
      await new Promise(r => setTimeout(r, 100));

      if (exercise) {
        const el = dom.window.document.getElementById(testId);
        await exercise({ dom, window: dom.window, document: dom.window.document, element: el, requests, errors: localErrors, warnings: localWarnings });
      }

      const hadError = localErrors.length > 0, hadWarning = localWarnings.length > 0;
      const hasExpectedLog = !logPattern || localErrors.concat(localWarnings).some(msg => msg.includes(logPattern));

      if (expectedLog) {
        const sawExpected = expectedLog === 'error' ? hadError && hasExpectedLog
          : expectedLog === 'warn' ? hadWarning && hasExpectedLog
            : (hadError || hadWarning) && hasExpectedLog;
        if (!sawExpected) {
          this.results.failed++;
          this.results.categories[category].failed++;
          this.results.errors.push({ attr, category, expected: expectedLog, actual: { errors: localErrors.slice(0, 3), warnings: localWarnings.slice(0, 3) } });
          console.error(`✗ FAIL: ${attr} (${category}) - Expected ${expectedLog} log${logPattern ? ` matching "${logPattern}"` : ''}`);
        } else {
          this.results.passed++;
          this.results.categories[category].passed++;
          console.log(`✓ PASS: ${attr} (${category})`);
        }
      } else if (valid && (hadError || hadWarning)) {
        this.results.failed++;
        this.results.categories[category].failed++;
        this.results.errors.push({ attr, category, expected: 'valid', actual: 'log', error: localErrors.concat(localWarnings).slice(0,3) });
        console.error(`✗ FAIL: ${attr} (${category}) - Expected valid but got log output`);
      } else if (!valid && !hadError && !hadWarning) {
        this.results.failed++;
        this.results.categories[category].failed++;
        this.results.errors.push({ attr, category, expected: 'error', actual: 'valid' });
        console.error(`✗ FAIL: ${attr} (${category}) - Expected warning/error but validated`);
      } else {
        this.results.passed++;
        this.results.categories[category].passed++;
        console.log(`✓ PASS: ${attr} (${category})`);
      }

    } catch (e) {
      this.results.failed++;
      this.results.categories[category].failed++;
      this.results.errors.push({ attr, category, error: e.message });
      console.error(`✗ ERROR: ${attr} (${category}) - ${e.message}`);
    }
  }
  
  async runAll() {
    console.log('='.repeat(80));
    console.log('DMAX DETERMINISTIC FUZZ TEST SUITE');
    console.log('='.repeat(80));
    
    await this.setup();
    
    console.log('\n--- Testing data-sub ---');
    for (const tc of generateDataSubCombinations()) {
      await this.testAttribute(tc);
    }
    
    console.log('\n--- Testing data-sync ---');
    for (const tc of generateDataSyncCombinations()) {
      await this.testAttribute(tc);
    }
    
    console.log('\n--- Testing data-class ---');
    for (const tc of generateDataClassCombinations()) {
      await this.testAttribute(tc);
    }
    
    console.log('\n--- Testing data-disp ---');
    for (const tc of generateDataDispCombinations()) {
      await this.testAttribute(tc);
    }
    
    console.log('\n--- Testing data-dump ---');
    for (const tc of generateDataDumpCombinations()) {
      await this.testAttribute(tc);
    }
    
    console.log('\n--- Testing data-actions ---');
    for (const tc of generateDataActionCombinations()) {
      await this.testAttribute(tc);
    }
    
    this.printReport();
    
    return this.results.failed === 0 ? 0 : 1;
  }
  
  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} (${(100 * this.results.passed / this.results.total).toFixed(1)}%)`);
    console.log(`Failed: ${this.results.failed} (${(100 * this.results.failed / this.results.total).toFixed(1)}%)`);
    
    console.log('\n--- Results by Category ---');
    for (const [cat, stats] of Object.entries(this.results.categories)) {
      const total = stats.passed + stats.failed;
      const pct = (100 * stats.passed / total).toFixed(1);
      console.log(`${cat.padEnd(30)} ${stats.passed}/${total} (${pct}%)`);
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n--- Failures ---');
      for (const err of this.results.errors.slice(0, 20)) {
        console.log(`- ${err.attr || err.expr}`);
        console.log(`  Category: ${err.category}`);
        console.log(`  Error: ${err.error || err.actual}`);
      }
      if (this.results.errors.length > 20) {
        console.log(`... and ${this.results.errors.length - 20} more`);
      }
    }
  }
}

// ============================================================================
// Regression Tests (specific bugs we've fixed)
// ============================================================================

async function runRegressionTests(runner) {
  console.log('\n--- Regression Tests ---');
  
  const regressions = [
    // Bug: camelCase in attributes lowercased
    { attr: 'data-sub:.text-content@foo', expr: '"test"', valid: true, desc: 'kebab-case property works' },
    
    // Bug: bracket-index subscriptions
    { attr: 'data-sub:result@posts[idx]', expr: 'dm.posts[dm.idx]', valid: true, desc: 'bracket-index subscription' },

    // Bug: infinite loops
    { attr: 'data-sync:foo:foo', expr: 'dm.foo', valid: true, desc: 'circular sync prevented' },
    
    // Bug: shape vs content
    { attr: 'data-sub@parent^shape_only', expr: 'dm.parent', valid: true, desc: 'shape modifier works' },
    { attr: 'data-sub@parent', expr: 'dm.parent', valid: true, desc: 'content-only default works' },
    
    // Bug: modifier conflicts
    { attr: 'data-sub^once:foo@bar^always', expr: 'dm.bar', valid: true, desc: '^always overrides global ^once' },
    
    // Bug: cross-element cleanup
    { attr: 'data-sub:#other.value@foo', expr: 'dm.foo', valid: true, desc: 'cross-element reference' },

    // Action routing and header helpers
    {
      attr: 'data-post^json:result@.click+title',
      expr: '"https://api.test/posts"',
      valid: true,
      desc: 'POST action sends named signals in request body by default',
      exercise: async ({ element, window, requests }) => {
        element.dispatchEvent(new window.Event('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        const req = requests[0];
        if (!req) throw new Error('request missing');
        const body = JSON.parse(req.init.body);
        if (body !== 'Hello title' && body.title !== 'Hello title') throw new Error('title signal not sent in body');
      }
    },
    {
      attr: 'data-post^json^body.target-id:result@.click+title',
      expr: '"https://api.test/items"',
      valid: true,
      desc: '^body routes named signals into request bodies',
      exercise: async ({ element, window, requests }) => {
        element.dispatchEvent(new window.Event('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        const req = requests[0];
        if (!req) throw new Error('request missing');
        const body = JSON.parse(req.init.body);
        if (body.title !== 'Hello title' || body.targetId !== 42) throw new Error('expected title and targetId body fields');
      }
    },
    {
      attr: 'data-get^auth.authorization:result@.click',
      expr: '"https://api.test/secure"',
      valid: true,
      desc: '^auth routes authorization from a signal',
      exercise: async ({ element, window, requests }) => {
        element.dispatchEvent(new window.Event('click', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        const req = requests[0];
        if (!req || req.init.headers.authorization !== 'Bearer tok-xyz') throw new Error('authorization header missing');
      }
    }
  ];
  
  for (const test of regressions) {
    console.log(`Testing: ${test.desc}`);
    await runner.testAttribute(test);
  }
}

// ============================================================================
// Main
// ============================================================================

(async () => {
  const runner = new FuzzTestRunner();
  await runRegressionTests(runner);
  const exitCode = await runner.runAll();
  
  // Final summary with pass/fail counts
  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Tests Run: ${runner.results.total}`);
  console.log(`✓ Passed: ${runner.results.passed} (${(100 * runner.results.passed / runner.results.total).toFixed(1)}%)`);
  console.log(`✗ Failed: ${runner.results.failed} (${(100 * runner.results.failed / runner.results.total).toFixed(1)}%)`);
  console.log('='.repeat(80));
  
  process.exit(exitCode);
})();
