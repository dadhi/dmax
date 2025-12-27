// /tests/parseDataAttr.regex.v1.js
// Regex-based parseDataAttr alternative, with tests
// Run: node /tests/parseDataAttr.regex.v1.js

const assert = require('assert');

// Regex-based parseDataAttr
function parseDataAttrRegex(attr, prefixLen) {
  // DEBUG: Show input
  // console.log('parseDataAttrRegex input:', attr.slice(prefixLen));
  const s = attr.slice(prefixLen);
  // Match all targets (:) and triggers (@) in order
  const re = /([:@])((#)?([a-zA-Z0-9_$-]*))(?:\.([a-zA-Z0-9_$-]+))?((?:__(?:[a-zA-Z0-9_$-]+)(?:\.[0-9]+)?)*?)/g;
  let m, lastIndex = 0;
  const targets = [], triggers = [];
  while ((m = re.exec(s))) {
    // DEBUG: Show match
    // console.log('Match:', m);
    if (m.index !== lastIndex) return null; // gap or junk between matches
    lastIndex = re.lastIndex;
    const kind = m[1], hash = m[3], id = m[4], prop = m[5], modsStr = m[6];
    // Parse mods (can be multiple)
    let mods = {};
    if (modsStr) {
      const modRe = /__([a-zA-Z0-9_$-]+)(?:\.([0-9]+))?/g;
      let mm;
      while ((mm = modRe.exec(modsStr))) {
        mods[mm[1]] = mm[2] ? +mm[2] : 1;
      }
    }
    if (kind === ':') {
      if (hash) {
        targets.push({type:'prop', elemId:id, propPath:prop||null, isCurr:false});
      } else if (!id && prop) {
        targets.push({type:'prop', elemId:'', propPath:prop, isCurr:true});
      } else if (id) {
        targets.push({type:'signal', name:id});
      } else {
        // console.log('No valid target');
        return null;
      }
    } else if (kind === '@') {
      if (hash) {
        triggers.push({type:'event', elemId:id, eventName:prop||null, isCurr:false, mods});
      } else if (!id && prop) {
        triggers.push({type:'event', elemId:'', eventName:prop, isCurr:true, mods});
      } else if (id) {
        triggers.push({type:'signal', name:id, mods});
      } else {
        // console.log('No valid trigger');
        return null;
      }
    }
  }
  // If not all input consumed, or empty, error
  if (lastIndex !== s.length || (!targets.length && !triggers.length)) return null;
  return {targets, triggers};
}


// Test cases (same as for original)
let r;
r = parseDataAttrRegex(':foo@bar', 0);
console.log('Test1', r);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'signal', name:'bar', mods:{}}]
});
r = parseDataAttrRegex(':.value@.input', 0);
console.log('Test2', r);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'', propPath:'value', isCurr:true}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{}}]
});
r = parseDataAttrRegex(':#el.value@#el.click', 0);
console.log('Test3', r);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'el', propPath:'value', isCurr:false}],
  triggers: [{type:'event', elemId:'el', eventName:'click', isCurr:false, mods:{}}]
});
r = parseDataAttrRegex(':foo@.input__debounce.300', 0);
console.log('Test4', r);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{debounce:300}}]
});
r = parseDataAttrRegex(':foo:bar@baz@.input', 0);
console.log('Test5', r);
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
console.log('Test6', parseDataAttrRegex(':foo@', 0));
assert.strictEqual(parseDataAttrRegex(':foo@', 0), null);
assert.strictEqual(parseDataAttrRegex(':foo:@bar', 0), null);
assert.strictEqual(parseDataAttrRegex(':foo:', 0), null);
assert.strictEqual(parseDataAttrRegex('@', 0), null);
assert.strictEqual(parseDataAttrRegex(':', 0), null);

console.log('All correctness tests passed.');

// Perf test
console.time('parseDataAttrRegex perf');
for(let i=0; i<1e6; ++i) parseDataAttrRegex(':foo@.input', 0);
console.timeEnd('parseDataAttrRegex perf');
// Observed perf: (fill after run)
