// /tests/toCamel.bench.v1.js
// Benchmark toCamel implementations (1e6 runs each)
// Run: node /tests/toCamel.bench.v1.js

function toCamelSimple(s) {
  if (!s || s.indexOf('-') === -1) return s;
  let result = '';
  let i = 0;
  // skip leading hyphens without uppercasing
  while (i < s.length && s[i] === '-') i++;
  let upper = false;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (ch === '-') {
      // skip consecutive hyphens
      while (i + 1 < s.length && s[i + 1] === '-') i++;
      // set flag to uppercase next character (unless we skipped all and are at end)
      if (i + 1 < s.length) upper = true;
    } else {
      result += upper ? ch.toUpperCase() : ch;
      upper = false;
    }
  }
  return result;
}

function toCamelOpt(s) {
  if (!s || s.indexOf('-') === -1) return s;
  const n = s.length;
  const out = [];
  let o = 0;
  let i = 0;
  // skip leading hyphens
  while (i < n && s.charCodeAt(i) === 45 /* - */) i++;
  let upper = false;
  for (; i < n; i++) {
    const c = s.charCodeAt(i);
    if (c === 45) {
      // skip consecutive
      while (i + 1 < n && s.charCodeAt(i + 1) === 45) i++;
      if (i + 1 < n) upper = true;
      continue;
    }
    // append char
    const ch = String.fromCharCode(c);
    out[o++] = upper ? ch.toUpperCase() : ch;
    upper = false;
  }
  return out.join('');
}

// quick correctness
const cases = [
  ['foo-bar', 'fooBar'],
  ['foo--bar', 'fooBar'],
  ['foo-bar-baz', 'fooBarBaz'],
  ['foo', 'foo'],
  ['', ''],
  ['-foo', 'foo'],
  ['foo-', null], // trailing handled by caller, here we'll produce 'foo' and caller may reject
  ['--a-b', 'aB']
];
for (const [inp, exp] of cases) {
  const a = toCamelSimple(inp);
  const b = toCamelOpt(inp);
  if (exp !== null) {
    if (a !== exp) throw new Error('simple mismatch ' + inp + ' -> ' + a);
    if (b !== exp) throw new Error('opt mismatch ' + inp + ' -> ' + b);
  }
}
console.log('Correctness OK');

const N = 1_000_000;
console.log('Benchmarking', N, 'calls each');
let t0 = Date.now();
for (let i = 0; i < N; ++i) toCamelSimple('foo-bar-baz');
let t1 = Date.now();
console.log('toCamelSimple ms:', t1 - t0);

t0 = Date.now();
for (let i = 0; i < N; ++i) toCamelOpt('foo-bar-baz');
let t2 = Date.now();
console.log('toCamelOpt ms:', t2 - t0);

// Also measure parseDataAttr-like normalization cost (kebab->camel for nested chain)
function normalizeChainSimple(s) {
  return s.split('.').map(seg => toCamelOpt(seg)).join('.');
}

const sample = 'my-signal.inner-name.and-more';
t0 = Date.now();
for (let i = 0; i < N; ++i) normalizeChainSimple(sample);
let t3 = Date.now();
console.log('normalizeChain (using toCamelOpt) ms:', t3 - t0);

module.exports = { toCamelSimple, toCamelOpt };
