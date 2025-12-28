// getAutoEvent.v1.js
// Tests and perf for getAutoEvent
// Perf result: ~24ms for 1,000,000 calls

function getAutoEvent(el) {
  if (!el || !el.tagName) return 'click';
  const tag = el.tagName.toUpperCase();
  const type = el.type;
  if (tag === 'FORM') return 'submit';
  if (type === 'checkbox' || type === 'radio') return 'change';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return tag === 'SELECT' ? 'change' : 'input';
  return 'click';
}

function test(name, fn) {
  try {
    fn();
    console.log('✔', name);
  } catch (e) {
    console.error('✘', name, e);
  }
}

function make(tag, type) {
  const el = { tagName: tag, type };
  return el;
}

test('checkbox', () => {
  if (getAutoEvent(make('INPUT', 'checkbox')) !== 'change') throw 'fail';
});
test('radio', () => {
  if (getAutoEvent(make('INPUT', 'radio')) !== 'change') throw 'fail';
});
test('input', () => {
  if (getAutoEvent(make('INPUT', 'text')) !== 'input') throw 'fail';
});
test('select', () => {
  if (getAutoEvent(make('SELECT')) !== 'change') throw 'fail';
});
test('textarea', () => {
  if (getAutoEvent(make('TEXTAREA')) !== 'input') throw 'fail';
});
test('div', () => {
  if (getAutoEvent(make('DIV')) !== 'click') throw 'fail';
});
test('form', () => {
  if (getAutoEvent(make('FORM')) !== 'submit') throw 'fail';
});
test('custom', () => {
  if (getAutoEvent(make('MY-ELEM')) !== 'click') throw 'fail';
});
test('no tag', () => {
  if (getAutoEvent({}) !== 'click') throw 'fail';
});
test('null', () => {
  if (getAutoEvent(null) !== 'click') throw 'fail';
});

// Perf test
console.log('Perf test: running 1,000,000 getAutoEvent(INPUT)...');
const el = make('INPUT', 'text');
const t0 = Date.now();
for (let i = 0; i < 1_000_000; ++i) {
  getAutoEvent(el);
}
const t1 = Date.now();
console.log('Elapsed ms:', t1 - t0);
