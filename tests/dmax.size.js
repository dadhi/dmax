const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dmaxPath = path.join(process.cwd(), 'dmax.js');
const limitsPath = path.join(__dirname, 'dmax.size.limits.json');
const source = fs.readFileSync(dmaxPath, 'utf8');
const lines = source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
const bytes = Buffer.byteLength(source, 'utf8');
const limits = Object.freeze(JSON.parse(fs.readFileSync(limitsPath, 'utf8')));

// This guard keeps dmax.js honest about code creep: new behavior should ideally
// come from refactors, syntax sugar, and reorganizing existing code so the file
// stays smaller over time without trading away performance or simplicity. When
// dmax.js gets smaller, this test tightens the tracked JSON limits for the next run.

assert.ok(lines <= limits.lines, `dmax.js lines grew from ${limits.lines} to ${lines}`);
assert.ok(bytes <= limits.bytes, `dmax.js bytes grew from ${limits.bytes} to ${bytes}`);

if (lines < limits.lines || bytes < limits.bytes) {
  const nextLimits = { lines: Math.min(lines, limits.lines), bytes: Math.min(bytes, limits.bytes) };
  fs.writeFileSync(limitsPath, `${JSON.stringify(nextLimits, null, 2)}\n`);
  console.log(`Updated dmax.js limits to ${nextLimits.lines} lines and ${nextLimits.bytes} bytes.`);
}

console.log(`dmax.js size guard passed (${lines} lines, ${bytes} bytes).`);
