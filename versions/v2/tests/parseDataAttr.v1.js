// /tests/parseDataAttr.v1.js
// Isolated tests for parseDataAttr function
// Run: node /tests/parseDataAttr.v1.js

const assert = require('assert');

// parseDataAttr copied from index2.html
function parseDataAttr(attr, prefixLen) {
  const s = attr;
  let i = prefixLen; // Skip prefix (e.g., 'data-sub', 'data-class', etc.)
  const targets = [], triggers = [];
  // Parse targets (starting with :)
  while(i < s.length && s[i] === ':'){
    i++;
    if(i >= s.length) break;
    let elemId = '', propPath = '', isCurr = false;
    if(s[i] === '.'){
      isCurr = true; i++;
      if(i < s.length && s[i] !== ':' && s[i] !== '@'){
        while(i < s.length && s[i] !== ':' && s[i] !== '@') propPath += s[i++];
      }
      targets.push({type:'prop', elemId:'', propPath: propPath || null, isCurr});
    } else if(s[i] === '#'){
      i++;
      while(i < s.length && s[i] !== '.' && s[i] !== ':' && s[i] !== '@') elemId += s[i++];
      if(i < s.length && s[i] === '.'){
        i++;
        while(i < s.length && s[i] !== ':' && s[i] !== '@') propPath += s[i++];
      }
      targets.push({type:'prop', elemId, propPath: propPath || null, isCurr:false});
    } else {
      let signalName = '';
      while(i < s.length && s[i] !== ':' && s[i] !== '@') signalName += s[i++];
      if(!signalName){ console.error('Empty signal name in target:', attr); return null; }
      targets.push({type:'signal', name:signalName});
    }
  }
  // Parse triggers (starting with @)
  while(i < s.length && s[i] === '@'){
    i++;
    if(i >= s.length) break;
    let elemId = '', eventName = '', isCurr = false;
    if(s[i] === '.'){
      isCurr = true; i++;
      if(i < s.length && s[i] !== ':' && s[i] !== '@' && s[i] !== '_'){
        while(i < s.length && s[i] !== ':' && s[i] !== '@' && s[i] !== '_') eventName += s[i++];
      }
      triggers.push({type:'event', elemId:'', eventName: eventName || null, isCurr, mods:{}});
    } else if(s[i] === '#'){
      i++;
      while(i < s.length && s[i] !== '.' && s[i] !== ':' && s[i] !== '@' && s[i] !== '_') elemId += s[i++];
      if(i < s.length && s[i] === '.'){
        i++;
        while(i < s.length && s[i] !== ':' && s[i] !== '@' && s[i] !== '_') eventName += s[i++];
      }
      triggers.push({type:'event', elemId, eventName: eventName || null, isCurr:false, mods:{}});
    } else {
      let signalName = '';
      while(i < s.length && s[i] !== '@' && s[i] !== '_' && s[i] !== ':') signalName += s[i++];
      if(!signalName){ console.error('Empty signal name in trigger:', attr); return null; }
      triggers.push({type:'signal', name:signalName, mods:{}});
    }
    let mods = {};
    while(i < s.length && s[i] === '_' && s[i+1] === '_'){
      i += 2;
      let modName = '', modVal = '';
      while(i < s.length && s[i] !== '.' && s[i] !== '@' && s[i] !== '_' && s[i] !== ':') modName += s[i++];
      if(i < s.length && s[i] === '.'){
        i++;
        while(i < s.length && s[i] !== '@' && s[i] !== '_' && s[i] !== ':') modVal += s[i++];
      }
      mods[modName] = modVal ? +modVal : 1;
    }
    if(triggers.length) triggers[triggers.length-1].mods = mods;
  }
  // Extra: warn if dangling : or @
  if(i < s.length && (s[i] === ':' || s[i] === '@')) {
    console.error('Dangling ":" or "@" in attribute:', attr);
    return null;
  }
  return {targets, triggers};
}

// Test cases
// 1. Simple signal target and trigger
let r = parseDataAttr(':foo@bar', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'signal', name:'bar', mods:{}}]
});

// 2. Prop target and event trigger
r = parseDataAttr(':.value@.input', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'', propPath:'value', isCurr:true}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{}}]
});

// 3. Prop target with elemId and event trigger with elemId
r = parseDataAttr(':#el.value@#el.click', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'prop', elemId:'el', propPath:'value', isCurr:false}],
  triggers: [{type:'event', elemId:'el', eventName:'click', isCurr:false, mods:{}}]
});

// 4. Signal target and event trigger with mods
r = parseDataAttr(':foo@.input__debounce.300', 0);
assert.deepStrictEqual(r, {
  targets: [{type:'signal', name:'foo'}],
  triggers: [{type:'event', elemId:'', eventName:'input', isCurr:true, mods:{debounce:300}}]
});

// 5. Multiple targets and triggers
r = parseDataAttr(':foo:bar@baz@.input', 0);
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

// 6. Dangling : or @ returns null
assert.strictEqual(parseDataAttr(':foo@', 0), null);
assert.strictEqual(parseDataAttr(':foo:@bar', 0), null);
assert.strictEqual(parseDataAttr(':foo:', 0), null);
assert.strictEqual(parseDataAttr('@', 0), null);
assert.strictEqual(parseDataAttr(':', 0), null);

console.log('All correctness tests passed.');

// Perf test
console.time('parseDataAttr perf');
for(let i=0; i<1e6; ++i) parseDataAttr(':foo@.input', 0);
console.timeEnd('parseDataAttr perf');
// Observed perf: (fill after run)
