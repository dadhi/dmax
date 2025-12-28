// getAutoProp.v1.js
// Tests and perf for getAutoProp
// Perf result: ~4ms for 1,000,000 calls

function getAutoProp(el) {
  const tag = el.tagName;
  const type = el.type;
  if(type === 'checkbox' || type === 'radio') return 'checked';
  if(tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return 'value';
  return 'textContent';
}

function test(name, fn) {
  try {
    fn();
    console.log('✔', name);
  } catch (e) {
    console.error('✘', name, e);
  }
}

// Synthetic elements for testing
function make(tag, type) {
  const el = { tagName: tag, type };
  return el;
}

test('checkbox', () => {
  if (getAutoProp(make('INPUT', 'checkbox')) !== 'checked') throw 'fail';
});
test('radio', () => {
  if (getAutoProp(make('INPUT', 'radio')) !== 'checked') throw 'fail';
});
test('input', () => {
  if (getAutoProp(make('INPUT', 'text')) !== 'value') throw 'fail';
});
test('select', () => {
  if (getAutoProp(make('SELECT')) !== 'value') throw 'fail';
});
test('textarea', () => {
  if (getAutoProp(make('TEXTAREA')) !== 'value') throw 'fail';
});
test('div', () => {
  if (getAutoProp(make('DIV')) !== 'textContent') throw 'fail';
});

test('no type', () => {
  if (getAutoProp({ tagName: 'DIV' }) !== 'textContent') throw 'fail';
});

// Perf test
console.log('Perf test: running 1,000,000 getAutoProp(INPUT)...');
const el = make('INPUT', 'text');
const t0 = Date.now();
for (let i = 0; i < 1_000_000; ++i) {
  getAutoProp(el);
}
const t1 = Date.now();
console.log('Elapsed ms:', t1 - t0);
