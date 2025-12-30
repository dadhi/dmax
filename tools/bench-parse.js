const { parseDataAttrFast } = require('./parse_char');
const { parseDataAttrTable } = require('./parse_table');
const fs = require('fs');

const samples = [
  ':testArr__append?busy__busy@.click',
  ':#myId.value__replace__json',
  '.value__prepend@.input',
  ':user.name__replace@.change',
  ':items__append__once@.add',
  '@_interval.1000__once',
  ':#list.selectedIndex__replace@.change',
  ':deep.prop.path__replace@.event',
  ':simpleSignal@signalName',
  ':complexSignal__debounce.250__throttle.100@.click',
  ':mixed__json.1.2@_special.arg',
  ':#id.prop.sub__append?busy__busy@_special.arg',
];

function bench(fn, label, itersPerSample) {
  const startMem = process.memoryUsage().heapUsed;
  const t0 = process.hrtime.bigint();
  let ok = 0;
  for (let s of samples) {
    for (let i = 0; i < itersPerSample; i++) {
      const res = fn(s, 0);
      if (res) ok++;
    }
  }
  const t1 = process.hrtime.bigint();
  const endMem = process.memoryUsage().heapUsed;
  const ns = Number(t1 - t0);
  const ms = ns / 1e6;
  return { label, ms, ops: samples.length * itersPerSample, ok, memDelta: endMem - startMem };
}

function run() {
  console.log('Node version:', process.version);
  const iters = 200000; // per sample
  const repeats = 5;
  console.log('Samples:', samples.length, 'iters per sample:', iters, 'repeats:', repeats);
  console.log('Warming up...');
  bench(parseDataAttrFast, 'char', 1000);
  bench(parseDataAttrTable, 'table', 1000);

  console.log('Running benchmark (this may take a few moments)...');
  const out = { 'char-scanner': [], 'table-fsm': [] };
  for (let r = 0; r < repeats; r++) {
    const a = bench(parseDataAttrFast, 'char-scanner', iters);
    const b = bench(parseDataAttrTable, 'table-fsm', iters);
    out['char-scanner'].push(a);
    out['table-fsm'].push(b);
    console.log(`  repeat ${r+1}: char ${a.ms.toFixed(1)}ms, table ${b.ms.toFixed(1)}ms`);
  }

  function avg(arr){const o={ms:0,ops:0,ok:0,memDelta:0};for(const x of arr){o.ms+=x.ms;o.ops+=x.ops;o.ok+=x.ok;o.memDelta+=x.memDelta}o.ms/=arr.length;o.ops/=arr.length;o.ok/=arr.length;o.memDelta/=arr.length;return o}
  const r1 = avg(out['char-scanner']);
  const r2 = avg(out['table-fsm']);

  console.log('\nAverages:');
  for (const [label,r] of [['char-scanner',r1],['table-fsm',r2]]) {
    console.log(`- ${label}: ${r.ms.toFixed(1)}ms avg for ${r.ops} ops -> ${(r.ops / r.ms * 1000).toFixed(1)} ops/sec avg, memDelta=${Math.round(r.memDelta)}`);
  }

  // Code size
  const ch = fs.readFileSync(__dirname + '/parse_char.js', 'utf8').length;
  const ta = fs.readFileSync(__dirname + '/parse_table.js', 'utf8').length;
  console.log('\nCode sizes: parse_char.js:', ch, 'chars; parse_table.js:', ta, 'chars');
}

run();
