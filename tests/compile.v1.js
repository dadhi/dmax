// /tests/compile.v1.js
// Isolated tests for strict-mode compatible compile function
// Run: node /tests/compile.v1.js

const assert = require('assert');

// Minimal fnCache mock
const fnCache = new Map();

// Strict-mode compatible compile (copied from index2.html)
const compile = body => {
  if(fnCache.has(body)) return fnCache.get(body);
  const RESERVED = new Set([
    'true','false','null','undefined','NaN','Infinity','this','window','document','console','Math','Date','Array','Object','String','Number','Boolean','Function','RegExp','Error','Promise','Map','Set','Symbol','BigInt','parseInt','parseFloat','isNaN','isFinite','eval','JSON','el','ev','arguments','return','if','else','for','while','do','switch','case','break','continue','var','let','const','function','new','try','catch','finally','throw','class','extends','super','import','export','default','await','async','yield','static','get','set','of','in','with','delete','instanceof','typeof','void','enum','implements','interface','package','private','protected','public','yield','await','static','super','this','debugger','break','continue','case','catch','default','do','else','finally','for','function','if','return','switch','throw','try','var','let','const','new','class','extends','super','import','export','from','as','of','in','instanceof','typeof','void','delete','enum','await','implements','package','protected','static','yield','interface','private','public','null','true','false'
  ]);
  let argNames = ['el','ev'];
  let signalNames = [];
  let ids = Array.from(body.matchAll(/\b([a-zA-Z_$][\w$]*)\b/g)).map(m=>m[1]);
  for(let id of ids){
    if(!RESERVED.has(id) && !argNames.includes(id) && !signalNames.includes(id)) signalNames.push(id);
  }
  argNames = signalNames.concat(argNames);
  let fn;
  try {
    fn = new Function(...argNames, `try{ return ${body} }catch(e){console.error(e)}`);
  } catch(e) {
    console.error('Failed to compile expression:', body, e);
    fn = () => undefined;
  }
  const wrapped = (S, el, ev) => {
    const args = signalNames.map(k => S[k]);
    try {
      const res = fn(...args, el, ev);
      // If result is NaN due to ReferenceError, return undefined
      return (typeof res === 'number' && isNaN(res)) ? undefined : res;
    } catch (e) {
      return undefined;
    }
  };
  fnCache.set(body, wrapped);
  return wrapped;
};

// Test cases
const S = { foo: 2, bar: 3, user: { name: 'Alice' }, count: 10 };

// 1. Simple signal
let fn = compile('foo + bar');
assert.strictEqual(fn(S), 5);

// 2. With el and ev
fn = compile('el.value + ev.type');
assert.strictEqual(fn(S, { value: 'x' }, { type: 'input' }), 'xinput');

// 3. Nested signal
fn = compile('user.name + count');
assert.strictEqual(fn(S), 'Alice10');

// 4. Expression with reserved words
fn = compile('Math.max(foo, bar)');
assert.strictEqual(fn(S), 3);

// 5. Error handling
fn = compile('notDefined + 1');
assert.strictEqual(fn(S), undefined); // Should not throw

console.log('All correctness tests passed.');

// Perf test
console.time('compile perf');
for(let i=0; i<1e6; ++i) compile('foo + bar')(S);
console.timeEnd('compile perf');

// Observed perf: ~121ms/1M calls (Node.js v24, 2025-12-26)
