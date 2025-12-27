// /tests/parseDataAttr.fast.v1.js
// Fast parseDataAttr implementation (char-scanning, minimal allocations)
// Run: node /tests/parseDataAttr.fast.v1.js
// Observed perf (1e6 runs on dev container): 686.003ms

const assert = require('assert');

function toCamelSimple(s) {
  if (!s || s.indexOf('-') === -1) return s;
  let result = '';
  let i = 0;
  while (i < s.length && s[i] === '-') i++; // skip leading hyphens
  let upper = false;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (ch === '-') {
      while (i + 1 < s.length && s[i + 1] === '-') i++;
      if (i + 1 < s.length) upper = true;
    } else {
      result += upper ? ch.toUpperCase() : ch;
      upper = false;
    }
  }
  return result;
}

function parseMods(s, i, n) {
  const mods = {};
  while (i < n && s.charCodeAt(i) === 95 /* '_' */ && s.charCodeAt(i+1) === 95 /* '_' */) {
    i += 2;
    const start = i;
    while (i < n) {
      const cc = s.charCodeAt(i);
      if (cc === 46 /* '.' */ || cc === 58 /* ':' */ || cc === 64 /* '@' */ || (cc === 95 /* '_' */ && s.charCodeAt(i+1) === 95)) break;
      i++;
    }
    const name = s.slice(start, i);
    if (!name) return [null, i];
    let val = 1;
    if (i < n && s.charCodeAt(i) === 46 /* '.' */) {
      i++;
      const vs = i;
      while (i < n) {
        const cc = s.charCodeAt(i);
        if (cc === 58 /* ':' */ || cc === 64 /* '@' */ || (cc === 95 /* '_' */ && s.charCodeAt(i+1) === 95)) break;
        i++;
      }
      const num = s.slice(vs, i);
      val = num ? +num : 1;
    }
    mods[name] = val;
  }
  return [mods, i];
}

function parseDataAttrFast(attr, prefixLen) {
  const s = attr;
  const n = s.length;
  let i = prefixLen;
  const targets = [];
  const triggers = [];

  function normalizePath(path) {
    if (!path) return null;
    const parts = path.split('.');
    const out = [];
    for (let j = 0; j < parts.length; ++j) {
      const seg = parts[j];
      if (/[A-Z]/.test(seg)) {
        console.error('CamelCase in attr name is invalid:', attr);
        return null;
      }
      if (seg.indexOf('-') === -1) {
        // no hyphen, accept as-is (may be empty if user provided '.')
        if (seg === '') return null; // empty segment between dots is invalid
        out.push(seg);
        continue;
      }
      // handle kebab -> camelCase with rules:
      // - ignore one leading hyphen (e.g. -foo -> foo)
      // - reject trailing hyphen (foo-) and consecutive hyphens (foo--bar)
      const pieces = seg.split('-');
      let idx = 0;
      if (pieces[0] === '') {
        // leading hyphen: ignore first empty piece
        idx = 1;
      }
      if (idx >= pieces.length) {
        console.error('Invalid kebab segment in attr name:', attr);
        return null;
      }
      if (pieces[pieces.length - 1] === '') {
        // trailing hyphen
        console.error('Trailing hyphen in attr name is invalid:', attr);
        return null;
      }
      // consecutive hyphens produce empty piece in middle
      for (let k = idx; k < pieces.length; ++k) {
        if (pieces[k] === '') {
          console.error('Consecutive hyphens in attr name are invalid:', attr);
          return null;
        }
      }
      const segToConvert = pieces.slice(idx).join('-');
      const camel = toCamelSimple(segToConvert);
      out.push(camel);
    }
    return out.join('.');
  }

  while (i < n) {
    const ch = s.charCodeAt(i);
    if (ch === 58 /* : */) {
      i++;
      if (i >= n) return null;
      const c = s.charCodeAt(i);
      if (c === 35 /* # */) {
        i++;
        const startId = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 46 /* . */ || cc === 58 /* : */ || cc === 64 /* @ */) break;
          i++;
        }
        const id = s.slice(startId, i);
        let prop = null;
        if (i < n && s.charCodeAt(i) === 46 /* . */) {
          i++;
          const startP = i;
          while (i < n && s.charCodeAt(i) !== 58 /* : */ && s.charCodeAt(i) !== 64 /* @ */) i++;
          const raw = s.slice(startP, i) || null;
          prop = raw ? normalizePath(raw) : null;
          if (prop === null && raw !== null) return null;
        }
        targets.push({type: 'prop', elemId: id, propPath: prop, isCurr: false});
      } else if (c === 46 /* . */) {
        i++;
        const startP = i;
        while (i < n && s.charCodeAt(i) !== 58 /* : */ && s.charCodeAt(i) !== 64 /* @ */) i++;
        const raw = s.slice(startP, i) || null;
        const prop = raw ? normalizePath(raw) : null;
        if (prop === null && raw !== null) return null;
        targets.push({type: 'prop', elemId: '', propPath: prop, isCurr: true});
      } else {
        const start = i;
        while (i < n && s.charCodeAt(i) !== 58 /* : */ && s.charCodeAt(i) !== 64 /* @ */) i++;
        const raw = s.slice(start, i);
        if (!raw) return null;
        const name = normalizePath(raw);
        if (name === null) return null;
        targets.push({type: 'signal', name});
      }
    } else if (ch === 64 /* @ */) {
      i++;
      if (i >= n) return null;
      const c = s.charCodeAt(i);
      if (c === 35 /* # */) {
        i++;
        const startId = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 46 /* . */ || cc === 58 /* : */ || cc === 64 /* @ */ || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
          i++;
        }
        const id = s.slice(startId, i);
        let eventName = null;
        if (i < n && s.charCodeAt(i) === 46 /* . */) {
          i++;
            const startE = i;
            while (i < n) {
              const cc = s.charCodeAt(i);
              if (cc === 58 /* : */ || cc === 64 /* @ */ || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
              i++;
            }
            const raw = s.slice(startE, i) || null;
            eventName = raw ? normalizePath(raw) : null;
            if (eventName === null && raw !== null) return null;
        }
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseMods(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        triggers.push({type: 'event', elemId: id, eventName, isCurr: false, mods: modsRes[0]});
      } else if (c === 46 /* . */) {
        i++;
        const startE = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 58 /* : */ || cc === 64 /* @ */ || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
          i++;
        }
        const raw = s.slice(startE, i) || null;
        const eventName = raw ? normalizePath(raw) : null;
        if (eventName === null && raw !== null) return null;
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseMods(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        triggers.push({type: 'event', elemId: '', eventName, isCurr: true, mods: modsRes[0]});
      } else {
        const start = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 64 /* @ */ || cc === 58 /* : */ || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
          i++;
        }
        const raw = s.slice(start, i);
        if (!raw) return null;
        const name = normalizePath(raw);
        if (name === null) return null;
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseMods(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        triggers.push({type: 'signal', name, mods: modsRes[0]});
      }
    } else {
      return null;
    }
    if (i < n && s.charCodeAt(i) !== 58 /* : */ && s.charCodeAt(i) !== 64 /* @ */) return null;
  }
  if (!targets.length && !triggers.length) return null;
  return {targets, triggers};
}

// Tests (extended cases)
let tcount = 0;
function pass(name) { tcount++; console.log('\u2713', name); }

let r = parseDataAttrFast(':foo@bar', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'signal', name:'bar', mods:{}}]
});
pass('simple signal target and signal trigger');

r = parseDataAttrFast(':.value@.input', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'', propPath:'value', isCurr:true}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{}}]
});
pass('current element prop target and event trigger');

r = parseDataAttrFast(':#el.value@#el.click', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'el', propPath:'value', isCurr:false}],
  triggers: [{type:'event', elemId:'el', eventName:'click', isCurr:false, mods:{}}]
});
pass('elem prop target and elem event trigger');

r = parseDataAttrFast(':foo@.input__debounce.300', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{debounce:300}}]
});
pass('event trigger with numeric mod');

r = parseDataAttrFast(':foo:bar@baz@.input', 0);
assert.deepStrictEqual(r, {
  targets: [
    {type:'signal', name:'foo'},
    {type:'signal', name:'bar'}
  ],
  triggers: [
    {type:'signal', name:'baz', mods:{}},
    {type:'event', elemId:'', eventName:'input', isCurr:true, mods:{}}
  ]
});
pass('multiple targets and triggers');

// more corner cases
r = parseDataAttrFast(':foo@bar__debounce.200__once', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'signal', name:'bar', mods:{debounce:200, once:1}}]
});
pass('signal trigger with multiple mods (numeric + flag)');

r = parseDataAttrFast(':#my.style.width@#my.resize__throttle.50__prevent', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'my', propPath:'style.width', isCurr:false}],
  triggers: [{type:'event', elemId:'my', eventName:'resize', isCurr:false, mods:{throttle:50, prevent:1}}]
});
pass('elem nested prop and event with multiple mods');

r = parseDataAttrFast(':a.b.c@d.e__gt.5__once__debounce.10', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'a.b.c'}],
  triggers: [{type:'signal', name:'d.e', mods:{gt:5, once:1, debounce:10}}]
});
pass('nested signals with mixed mod order');

// default prop/event (:. and @.)
r = parseDataAttrFast(':.@.', 0); // ':' then '.' (default prop), '@' then '.' (default event)
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'', propPath:null, isCurr:true}],
  triggers: [{type:'event', elemId:'', eventName:null, isCurr:true, mods:{}}]
});
pass('default current element prop and event (:. and @.)');

// kebab-name conversion and nested chains
r = parseDataAttrFast(':my-signal.inner-name@other-signal__debounce.10', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'mySignal.innerName'}],
  triggers: [{type:'signal', name:'otherSignal', mods:{debounce:10}}]
});
pass('kebab-case to camelCase conversion for nested signals');

// camelCase in attr name (uppercase) should error and return null
let logged = [];
const origErr = console.error;
console.error = (...a) => { logged.push(a.join(' ')); };
assert.strictEqual(parseDataAttrFast(':MySignal@bar', 0), null);
console.error = origErr;
if (logged.length === 0) throw new Error('expected console.error for camelCase attr');
pass('camelCase attr name triggers console.error and returns null');

// leading hyphen ignored
logged = [];
console.error = (...a) => { logged.push(a.join(' ')); };
let r2 = parseDataAttrFast(':-foo@bar', 0);
console.error = origErr;
assert.deepStrictEqual(r2, { targets:[{type:'signal', name:'foo'}], triggers:[{type:'signal', name:'bar', mods:{}}] });
pass('leading hyphen ignored for signal name');

// trailing hyphen rejected
logged = [];
console.error = (...a) => { logged.push(a.join(' ')); };
assert.strictEqual(parseDataAttrFast(':foo-@bar', 0), null);
console.error = origErr;
if (logged.length === 0) throw new Error('expected console.error for trailing hyphen');
pass('trailing hyphen rejected');

// consecutive hyphens rejected
logged = [];
console.error = (...a) => { logged.push(a.join(' ')); };
assert.strictEqual(parseDataAttrFast(':foo--bar@baz', 0), null);
console.error = origErr;
if (logged.length === 0) throw new Error('expected console.error for consecutive hyphens');
pass('consecutive hyphens rejected');

// Dangling : or @ returns null
assert.strictEqual(parseDataAttrFast(':foo@', 0), null);
pass('dangling @ returns null');
assert.strictEqual(parseDataAttrFast(':foo:@bar', 0), null);
pass('malformed :foo:@bar returns null');
assert.strictEqual(parseDataAttrFast(':foo:', 0), null);
pass('dangling : returns null');
assert.strictEqual(parseDataAttrFast('@', 0), null);
pass('single @ returns null');
assert.strictEqual(parseDataAttrFast(':', 0), null);
pass('single : returns null');

console.log('\nAll correctness tests passed. Total:', tcount);

// Perf test
console.time('parseDataAttrFast perf');
for (let i = 0; i < 1e6; ++i) parseDataAttrFast(':foo@.input', 0);
console.timeEnd('parseDataAttrFast perf');
