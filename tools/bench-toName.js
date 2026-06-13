// Benchmark for toName conversions
// Run: node tools/bench-toName.js

// Current impl (no cache, one-liner)
const toNameCurrent = (s, k) => {
  if (!s) return s
  return k ? s.indexOf('-') >= 0 ? s.replace(/-+([a-zA-Z]?)/g, (_, ch) => ch ? ch.toUpperCase() : '') : s : /[A-Z]/.test(s) ? s.replace(/[A-Z]/g, ch => '-' + ch.toLowerCase()) : s
}

// Previous impl (2 maps, pair storage)
const _NAMES = new Map()
const toNamePair = (s, k) => {
  if (!s) return s
  const cached = _NAMES.get(s)
  if (cached) return k ? cached[0] : cached[1]
  const c = s.replace(/-+([a-zA-Z]?)/g, (_, ch) => ch ? ch.toUpperCase() : '')
  const kb = s.replace(/[A-Z]/g, ch => '-' + ch.toLowerCase())
  const pair = [c, kb]
  _NAMES.set(c, pair)
  _NAMES.set(kb, pair)
  return k ? c : kb
}

// Test strings — mix of kebab, camel, and idempotent
const samples = [
  // idempotent (already in target form)
  'pick-obj', 'foo-bar', 'data-foo-bar', 'multi-part-key',
  // needs conversion
  'fooBar', 'dataFooBar', 'HTTPRequest', 'userName',
  // mixed
  'click', 'input', 'change', 'submit', 'value', 'textContent',
  'hashchange', 'resize', 'visibilitychange',
  // from real test cases
  'wc-picked', 'wc-step', 'wc-pick-obj', 'pick-obj',
  'data-foo', 'data-bar', 'data-m-si', 'data-m-ex',
  'data-m-it', 'data-m-cl', 'data-m-sh', 'data-m-wc',
  'data-m-no', 'data-m-dbg', 'data-m-get', 'data-m-post',
  'data-m-put', 'data-m-patch', 'data-m-delete',
  // CSS props
  'size-cell', 'tone-accent', 'tone-bg', 'tone-ink',
  'space-1', 'space-2', 'line-1', 'radius-1',
  // headers
  'content-type', 'accept-encoding', 'cache-control',
  // custom events
  'point', 'step-picked', 'dm-element', 'dm-elements',
]

const ITERS = 100000

function bench(fn, label) {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    for (const s of samples) { fn(s, 0); fn(s, 1) }
  }
  const t0 = process.hrtime.bigint()
  for (let i = 0; i < ITERS; i++) {
    for (const s of samples) { fn(s, 0); fn(s, 1) }
  }
  const t1 = process.hrtime.bigint()
  const ms = Number(t1 - t0) / 1e6
  const ops = ITERS * samples.length * 2
  console.log(`${label.padEnd(20)} ${ms.toFixed(1).padStart(8)} ms  (${(ops / ms * 1000).toFixed(0).padStart(10)} ops/sec)`)
}

// Clear cache before bench
_NAMES.clear()
console.log(`toName benchmark (${ITERS} iters × ${samples.length} samples × 2 directions = ${ITERS * samples.length * 2} ops)`)
console.log('-'.repeat(70))
bench(toNameCurrent, 'current (no cache)')
_NAMES.clear()
bench(toNamePair, 'pair (2 maps)')
_NAMES.clear()
bench(toNameCurrent, 'current (warm)')
bench(toNamePair, 'pair (warm)')
