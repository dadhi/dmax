const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dmaxPath = path.join(process.cwd(), 'dmax.js');
const source = fs.readFileSync(dmaxPath, 'utf8');

const disallowed = [
  { re: /\b(?:async\s+)?function\s+[A-Za-z0-9_$]+\s*\(/, msg: 'classic function declarations should stay out of dmax.js' },
  { re: /\b__[A-Za-z0-9_]+\b/, msg: 'double-underscore names should stay out of dmax.js' },
  { re: /\b(?:sg|sgVal|sgName|getSgChangeShape)\b|SG_CHANGED_[A-Z_]+/, msg: 'sig names should use the sig prefix consistently' },
  {
    re: /\b(?:getSignalValOrIt|resolveStatusSignal|patchMatchingSignals|ensureSignalSubs|removeSignalSub|setSignalAndNotifySubsNLevelsDeep|applyDmaxPatchSignals|signalRead|signalWrite|shouldReadSignal|shouldWriteSignal)\b/,
    msg: 'sig-related identifiers should use the standardized internal names'
  },
  { re: /\b(?:selectValue|selectIndex|eventName|eventObj)\b/, msg: 'select/event identifiers should use the sel/ev abbreviations' },
  { re: /\b(?:let|const)\s+_(?:activeAbort|mi|mArr|dest|m|mp|k|v)\b/, msg: 'local declarations should not use underscore prefixes' },
  { re: /for\s*\(\s*(?:const|let)\s+_\b/, msg: 'loop variables should not use underscore prefixes' }
];

for (const { re, msg } of disallowed) {
  const match = source.match(re);
  assert.strictEqual(match, null, `${msg}: found ${match && match[0]}`);
}

console.log('dmax naming checks passed');
