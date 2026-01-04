// tests/fuzz.deterministic.js
// Deterministic fuzzing test suite for dmax data-* attributes
// Generates systematic combinations of valid/invalid syntax and verifies behavior

const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Test Case Generators
// ============================================================================

const SIGNAL_NAMES = ['foo', 'bar', 'user', 'user.name', 'ui.theme-color', 'posts[idx]', 'items[0].title'];
const INVALID_SIGNAL_NAMES = ['', 'ev', 'el', '123', 'foo..bar', 'foo.', '.foo', 'foo bar'];

const PROPERTIES = ['value', 'checked', 'text-content', 'style.color', 'style.font-size', 'class-list'];
const INVALID_PROPERTIES = ['', 'textContent', 'fontSize', 'foo..bar', '.prop'];

const EVENTS = ['click', 'input', 'change', 'mouseover', 'keydown'];
const SPECIAL_EVENTS = ['window.resize', 'document.click', 'interval.1000', 'delay.500'];

const MODIFIERS = ['immediate', 'notimmediate', 'once', 'debounce.100', 'throttle.200', 'prevent', 'and.gate', 'notand.flag', 'gt.5', 'eq.3', 'lt.10'];
const INVALID_MODIFIERS = ['', 'unknown', 'debounce', 'gt'];

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
      yield { attr: `data-sub:#.${prop}@#.${ev}`, valid: true, category: 'prop-event' };
    }
  }
  
  // 3. Multiple targets
  yield { attr: 'data-sub:foo:bar@baz', valid: true, category: 'multi-target' };
  yield { attr: 'data-sub:foo:#.value@click', valid: true, category: 'mixed-targets' };
  yield { attr: 'data-sub:#.value:#.checked@#.click', valid: true, category: 'multi-prop-targets' };
  
  // 4. Multiple triggers
  yield { attr: 'data-sub:foo@bar@baz', valid: true, category: 'multi-trigger' };
  yield { attr: 'data-sub:foo@bar@#.click@#btn.click', valid: true, category: 'mixed-triggers' };
  
  // 5. With modifiers
  for (const mod of MODIFIERS.slice(0, 5)) {
    yield { attr: `data-sub:foo@bar__${mod}`, valid: true, category: 'trigger-mod' };
  }
  yield { attr: 'data-sub__once:foo@bar', valid: true, category: 'global-mod' };
  yield { attr: 'data-sub__once:foo@bar__always', valid: true, category: 'mod-override' };
  
  // 6. Special triggers
  for (const special of SPECIAL_EVENTS) {
    yield { attr: `data-sub:foo@#_${special}`, valid: true, category: 'special-trigger' };
  }
  
  // 7. No target (side effect)
  yield { attr: 'data-sub@foo', valid: true, category: 'side-effect' };
  yield { attr: 'data-sub@#.click', valid: true, category: 'side-effect-event' };
  
  // 8. No trigger (immediate eval)
  yield { attr: 'data-sub:foo', valid: true, category: 'no-trigger' };
  yield { attr: 'data-sub:#.value', valid: true, category: 'no-trigger-prop' };
  
  // 9. Cross-element references
  yield { attr: 'data-sub:#elem.value@#other.input', valid: true, category: 'cross-element' };
  yield { attr: 'data-sub:foo@#elem.click', valid: true, category: 'cross-element-event' };
  
  // Invalid combinations
  
  // 10. Invalid signal names
  for (const inv of INVALID_SIGNAL_NAMES) {
    yield { attr: `data-sub:${inv}@foo`, valid: false, category: 'invalid-signal-target', error: 'invalid-name' };
    yield { attr: `data-sub:foo@${inv}`, valid: false, category: 'invalid-signal-trigger', error: 'invalid-name' };
  }
  
  // 11. Invalid properties
  for (const inv of INVALID_PROPERTIES) {
    if (inv) yield { attr: `data-sub:#.${inv}@#.click`, valid: false, category: 'invalid-prop', error: 'invalid-prop' };
  }
  
  // 12. Malformed syntax
  yield { attr: 'data-sub:', valid: false, category: 'malformed', error: 'empty-target' };
  yield { attr: 'data-sub@', valid: false, category: 'malformed', error: 'empty-trigger' };
  yield { attr: 'data-sub::', valid: false, category: 'malformed', error: 'double-colon' };
  yield { attr: 'data-sub@@', valid: false, category: 'malformed', error: 'double-at' };
  yield { attr: 'data-sub:foo@', valid: false, category: 'malformed', error: 'trailing-at' };
  yield { attr: 'data-sub:@bar', valid: false, category: 'malformed', error: 'leading-at' };
  
  // 13. Invalid modifiers
  for (const inv of INVALID_MODIFIERS) {
    if (inv) yield { attr: `data-sub:foo@bar__${inv}`, valid: false, category: 'invalid-mod', error: 'unknown-mod' };
  }
  
  // 14. Conflicting modifiers
  yield { attr: 'data-sub:foo@bar__immediate__notimmediate', valid: false, category: 'conflicting-mods', error: 'conflict' };
  yield { attr: 'data-sub__once:foo@bar__once', valid: true, category: 'duplicate-mod-ok' }; // duplicate is OK
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
      yield { attr: `data-sync:${sig}:#.${prop}`, valid: true, category: 'two-way-explicit' };
    }
  }
  
  // 3. Signal to element (one-way: signal → element)
  for (const sig of SIGNAL_NAMES.slice(0, 2)) {
    yield { attr: `data-sync@${sig}`, valid: true, category: 'one-way-sig-to-el' };
  }
  
  // 4. Element to signal (one-way: element → signal)
  for (const sig of SIGNAL_NAMES.slice(0, 2)) {
    yield { attr: `data-sync:${sig}@#.`, valid: true, category: 'one-way-el-to-sig' };
    yield { attr: `data-sync:${sig}@#.value`, valid: true, category: 'one-way-el-to-sig-explicit' };
  }
  
  // 5. Signal to signal
  yield { attr: 'data-sync:foo:bar', valid: true, category: 'signal-to-signal' };
  yield { attr: 'data-sync:user.name:display-name', valid: true, category: 'nested-to-signal' };
  
  // 6. Property to property (cross-element)
  yield { attr: 'data-sync:#src.value:#dest.value', valid: true, category: 'prop-to-prop' };
  yield { attr: 'data-sync:#.value:#other.text-content', valid: true, category: 'prop-to-cross-prop' };
  
  // 7. With modifiers
  yield { attr: 'data-sync__notimmediate:foo', valid: true, category: 'with-mod' };
  
  // Invalid combinations
  
  // 8. Invalid signal names
  for (const inv of INVALID_SIGNAL_NAMES) {
    if (inv) yield { attr: `data-sync:${inv}`, valid: false, category: 'invalid-signal', error: 'invalid-name' };
  }
  
  // 9. Invalid properties
  for (const inv of INVALID_PROPERTIES) {
    if (inv) yield { attr: `data-sync:foo:#.${inv}`, valid: false, category: 'invalid-prop', error: 'invalid-prop' };
  }
  
  // 10. Malformed
  yield { attr: 'data-sync:', valid: false, category: 'malformed', error: 'empty' };
  yield { attr: 'data-sync::', valid: false, category: 'malformed', error: 'double-colon' };
  yield { attr: 'data-sync@', valid: false, category: 'malformed', error: 'empty-trigger' };
}

function* generateDataClassCombinations() {
  // Valid
  yield { attr: 'data-class:#.active@is-active', valid: true, category: 'single-class' };
  yield { attr: 'data-class:#.active.-inactive@is-active', valid: true, category: 'inverse-class' };
  yield { attr: 'data-class:#.foo:#.bar@baz', valid: true, category: 'multi-class' };
  
  // Invalid
  yield { attr: 'data-class:', valid: false, category: 'malformed', error: 'empty' };
  yield { attr: 'data-class:#.@foo', valid: false, category: 'empty-class', error: 'empty-class' };
}

function* generateDataDispCombinations() {
  // Valid
  yield { attr: 'data-disp:#.@is-visible', valid: true, category: 'display-toggle' };
  yield { attr: 'data-disp@flag', valid: true, category: 'display-signal' };
  
  // Invalid
  yield { attr: 'data-disp:', valid: false, category: 'malformed', error: 'empty' };
}

function* generateDataDumpCombinations() {
  // Valid
  yield { attr: 'data-dump@posts#tpl-post', valid: true, category: 'with-template' };
  yield { attr: 'data-dump#tpl-post@posts', valid: true, category: 'reversed-order' };
  yield { attr: 'data-dump@posts', valid: true, category: 'inline-template' };
  
  // Invalid
  yield { attr: 'data-dump', valid: false, category: 'no-signal', error: 'missing-signal' };
  yield { attr: 'data-dump@', valid: false, category: 'empty-signal', error: 'empty' };
}

function* generateDataActionCombinations() {
  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  
  // Valid
  for (const method of methods) {
    yield { attr: `data-${method}:result@#.click`, valid: true, category: `${method}-basic` };
    yield { attr: `data-${method}^json:result@#.click`, valid: true, category: `${method}-json` };
    yield { attr: `data-${method}+#input.value:result@#.click`, valid: true, category: `${method}-input` };
    yield { attr: `data-${method}:result?busy,err@#.click`, valid: true, category: `${method}-state` };
  }
  
  // Invalid
  yield { attr: 'data-get:', valid: false, category: 'no-target', error: 'missing-target' };
  yield { attr: 'data-post^invalid:result@#.click', valid: false, category: 'invalid-header', error: 'unknown-header' };
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
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const vconsole = new VirtualConsole();
    const errors = [];
    vconsole.on('error', (...args) => errors.push(args.join(' ')));
    
    this.dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'http://localhost/',
      virtualConsole: vconsole
    });
    
    this.errors = errors;
    await new Promise(r => setTimeout(r, 200)); // Let scripts initialize
  }
  
  async testAttribute(testCase) {
    const { attr, valid, category, error, expr = 'dm.foo || "test"' } = testCase;
    this.results.total++;
    
    if (!this.results.categories[category]) {
      this.results.categories[category] = { passed: 0, failed: 0 };
    }
    
    try {
      // Read base HTML and inject test element so the runtime wires it on init
      const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
      // escape attribute value
      const esc = s => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const testId = `fuzz-test-${this.results.total}`;
      const fixtures = `\n<!-- fuzz fixtures: provide referenced elements and safe dm -->\n<div id="elem"></div>\n<div id="other"></div>\n<button id="btn"></button>\n<input id="input" value="hello"/>\n<div id="src"></div>\n<div id="dest"></div>\n<div id="posts"></div>\n<template id="tpl-post"><div class="post"></div></template>\n<script>window.dm = window.dm || { foo:0, bar:0, user:{themeColor:'',fontSize:'',isActive:false}, posts:[], items:[], idx:0, parent:{}, result:{} }; window.sg = window.sg || {}; window.__fuzz_injected = true;</script>\n`;
      const insertEl = `<div id="${testId}" ${attr}="${esc(expr)}"></div>`;
      const modified = html.replace('</body>', `${fixtures}${insertEl}\n</body>`);

      const localErrors = [];
      const vconsole = new VirtualConsole();
      vconsole.on('error', (...args) => localErrors.push(args.join(' ')));

      const dom = new JSDOM(modified, {
        runScripts: 'dangerously',
        resources: 'usable',
        url: 'http://localhost/',
        virtualConsole: vconsole
      });
      // Wait for runtime to initialize
      await new Promise(r => setTimeout(r, 250));

      const hadError = localErrors.length > 0;

      if (valid && hadError) {
        this.results.failed++;
        this.results.categories[category].failed++;
        this.results.errors.push({ attr, category, expected: 'valid', actual: 'error', error: localErrors.slice(0,3) });
        console.error(`✗ FAIL: ${attr} (${category}) - Expected valid but got error`);
      } else if (!valid && !hadError) {
        this.results.failed++;
        this.results.categories[category].failed++;
        this.results.errors.push({ attr, category, expected: 'error', actual: 'valid' });
        console.error(`✗ FAIL: ${attr} (${category}) - Expected error but validated`);
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
    { attr: 'data-sub:#.text-content@foo', expr: '"test"', valid: true, desc: 'kebab-case property works' },
    
    // Bug: bracket-index subscriptions
    { attr: 'data-sub:result@posts[idx]', expr: 'dm.posts[dm.idx]', valid: true, desc: 'bracket-index subscription' },
    
    // Bug: reserved names
    { attr: 'data-sub:ev@foo', expr: 'dm.foo', valid: false, desc: 'reserved name "ev" rejected' },
    { attr: 'data-sub:el@foo', expr: 'dm.foo', valid: false, desc: 'reserved name "el" rejected' },
    
    // Bug: infinite loops
    { attr: 'data-sync:foo:foo', expr: 'dm.foo', valid: true, desc: 'circular sync prevented' },
    
    // Bug: shape vs content
    { attr: 'data-sub@parent__shape', expr: 'dm.parent', valid: true, desc: 'shape modifier works' },
    { attr: 'data-sub@parent__content', expr: 'dm.parent', valid: true, desc: 'content modifier works' },
    
    // Bug: modifier conflicts
    { attr: 'data-sub__once:foo@bar__always', expr: 'dm.bar', valid: true, desc: '__always overrides global __once' },
    
    // Bug: cross-element cleanup
    { attr: 'data-sub:#other.value@foo', expr: 'dm.foo', valid: true, desc: 'cross-element reference' }
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
  process.exit(exitCode);
})();
