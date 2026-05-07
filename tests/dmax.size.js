const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dmaxPath = path.join(process.cwd(), 'dmax.js');
const testPath = __filename;
const source = fs.readFileSync(dmaxPath, 'utf8');
const lines = source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
const bytes = Buffer.byteLength(source, 'utf8');

// This guard keeps dmax.js honest about code creep: new behavior should ideally
// come from refactors, syntax sugar, and reorganizing existing code so the file
// stays smaller over time without trading away performance or simplicity.
const LIMITS = Object.freeze({ lines: 2008, bytes: 89902 });

assert.ok(lines <= LIMITS.lines, `dmax.js lines grew from ${LIMITS.lines} to ${lines}`);
assert.ok(bytes <= LIMITS.bytes, `dmax.js bytes grew from ${LIMITS.bytes} to ${bytes}`);

if (lines < LIMITS.lines || bytes < LIMITS.bytes) {
  const nextLimits = { lines: Math.min(lines, LIMITS.lines), bytes: Math.min(bytes, LIMITS.bytes) };
  const testSource = fs.readFileSync(testPath, 'utf8');
  const nextSource = testSource.replace(
    /const LIMITS = Object\.freeze\(\{ lines: \d+, bytes: \d+ \}\);/,
    `const LIMITS = Object.freeze({ lines: ${nextLimits.lines}, bytes: ${nextLimits.bytes} });`
  );

  if (nextSource !== testSource) {
    fs.writeFileSync(testPath, nextSource);
    console.log(`Updated dmax.js limits to ${nextLimits.lines} lines and ${nextLimits.bytes} bytes.`);
  }
}

console.log(`dmax.js size guard passed (${lines} lines, ${bytes} bytes).`);
