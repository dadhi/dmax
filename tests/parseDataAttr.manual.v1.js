// /tests/parseDataAttr.manual.v1.js
// Manual parser for data-* attributes, per user logic
// Run: node /tests/parseDataAttr.manual.v1.js

const assert = require('assert');

function parseDataAttrManual(attr, prefixLen) {
  const s = attr.slice(prefixLen);
  // DEBUG: Uncomment to trace parsing
  // console.log('parseDataAttrManual input:', s);
  let i = 0, len = s.length;
  const targets = [], triggers = [];
  let mode = null; // 'target' or 'trigger'
  while (i < len) {
    // Step 1: detect mode
    if (s[i] === ':') { mode = 'target'; i++; }
    else if (s[i] === '@') { mode = 'trigger'; i++; }
    else return null;
    if (i >= len) return null; // nothing after :/@
    // Step 2: detect signal or prop/event
    let isPropOrEvent = false, isCurr = false, elemId = '', propName = '', signalName = '', mods = {};
    if (s[i] === '#') { isPropOrEvent = true; i++; }
    else if (s[i] === '.') { isPropOrEvent = true; isCurr = true; i++; }
    // Step 3: collect id or signal name
    if (isPropOrEvent && s[i-1] === '#') {
      while (i < len && /[\w$-]/.test(s[i])) { elemId += s[i++]; /*console.log('id:', elemId, i);*/ }
      if (!elemId) return null; // id required after #
      if (s[i] === '.') {
        i++;
        while (i < len && /[\w$-]/.test(s[i])) { propName += s[i++]; /*console.log('prop:', propName, i);*/ }
      }
    } else if (isPropOrEvent && isCurr) {
      // Leading dot, no id, collect prop/event name
      while (i < len && /[\w$-]/.test(s[i])) { propName += s[i++]; /*console.log('prop:', propName, i);*/ }
    } else if (!isPropOrEvent) {
      while (i < len && /[\w$-]/.test(s[i])) { signalName += s[i++]; /*console.log('signal:', signalName, i);*/ }
      if (!signalName) return null; // signal name required
    }
    // Step 5: collect mods for triggers (after prop/event name, before push)
    if (mode === 'trigger') {
      // Only parse mods after prop/event name or signal name
      while (i < len && s[i] === '_' && s[i+1] === '_') {
        i += 2;
        let modName = '', modVal = '';
        while (i < len && /[\w$-]/.test(s[i])) modName += s[i++];
        if (!modName) return null;
        if (i < len && s[i] === '.') {
          i++;
          while (i < len && /[0-9]/.test(s[i])) modVal += s[i++];
        }
        mods[modName] = modVal ? +modVal : 1;
      }
    }
    // Step 6: validate and push
    if (mode === 'target') {
      if (isPropOrEvent) {
        if (elemId === '' && !isCurr) return null;
        targets.push({type:'prop', elemId, propPath: propName || null, isCurr});
      } else {
        targets.push({type:'signal', name:signalName});
      }
    } else if (mode === 'trigger') {
      if (isPropOrEvent) {
        if (elemId === '' && !isCurr) return null;
        triggers.push({type:'event', elemId, eventName: propName || null, isCurr, mods});
      } else {
        triggers.push({type:'signal', name:signalName, mods});
      }
    }
    // Step 7: expect next :/@ or end
    if (i < len && s[i] !== ':' && s[i] !== '@') return null;
  }
  if (!targets.length && !triggers.length) return null;
  return {targets, triggers};
}

// Test cases (same as for original)
let r = parseDataAttrManual(':foo@bar', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'signal', name:'bar', mods:{}}]
});
r = parseDataAttrManual(':.value@.input', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'', propPath:'value', isCurr:true}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{}}]
});
r = parseDataAttrManual(':#el.value@#el.click', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'el', propPath:'value', isCurr:false}],
  triggers: [{type:'event', elemId:'el', eventName:'click', isCurr:false, mods:{}}]
});
r = parseDataAttrManual(':foo@.input__debounce.300', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{debounce:300}}]
});
r = parseDataAttrManual(':foo:bar@baz@.input', 0);
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
// Dangling : or @ returns null
assert.strictEqual(parseDataAttrManual(':foo@', 0), null);
assert.strictEqual(parseDataAttrManual(':foo:@bar', 0), null);
assert.strictEqual(parseDataAttrManual(':foo:', 0), null);
assert.strictEqual(parseDataAttrManual('@', 0), null);
assert.strictEqual(parseDataAttrManual(':', 0), null);

console.log('All correctness tests passed.');

// Perf test
console.time('parseDataAttrManual perf');
for(let i=0; i<1e6; ++i) parseDataAttrManual(':foo@.input', 0);
console.timeEnd('parseDataAttrManual perf');
// Observed perf: (fill after run)
