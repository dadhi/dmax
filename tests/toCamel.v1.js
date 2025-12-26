// Perf result on this machine: ~166ms for 1,000,000 calls
// Perf test
console.log('Perf test: running 1,000,000 toCamel("foo-bar-baz")...');
const t0 = Date.now();
for (let i = 0; i < 1_000_000; ++i) {
  toCamel("foo-bar-baz");
}
const t1 = Date.now();
console.log('Elapsed ms:', t1 - t0);
function toCamel(s) {
  if(!s || s.indexOf('-') === -1) return s;
  let result = '', i = 0;
  while(i < s.length){
    if(s[i] === '-'){
      while(s[i] === '-' && i + 1 < s.length) i++;
      if(i < s.length) result += s[i].toUpperCase(), i++;
    } else {
      result += s[i++];
    }
  }
  return result;
}

function test(name, fn) {
  try {
    fn();
    console.log('✔', name);
  } catch (e) {
    console.error('✘', name, e);
  }
}

test('foo-bar', () => { if (toCamel('foo-bar') !== 'fooBar') throw 'fail'; });
test('foo--bar', () => { if (toCamel('foo--bar') !== 'fooBar') throw 'fail'; });
test('foo-bar-baz', () => { if (toCamel('foo-bar-baz') !== 'fooBarBaz') throw 'fail'; });
test('foo', () => { if (toCamel('foo') !== 'foo') throw 'fail'; });
test('""', () => { if (toCamel('') !== '') throw 'fail'; });
