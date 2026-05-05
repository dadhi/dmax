const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dmaxPath = path.join(process.cwd(), 'dmax.js');
const source = fs.readFileSync(dmaxPath, 'utf8');

const disallowed = [
  { re: /\b__[A-Za-z0-9_]+\b/, msg: 'double-underscore names should stay out of dmax.js' },
  { re: /\b(?:sg|sgVal|sgName|getSgChangeShape)\b|SG_CHANGED_[A-Z_]+/, msg: 'sig names should use the sig prefix consistently' },
  {
    re: /\b(?:getSignalValOrIt|resolveStatusSignal|patchMatchingSignals|ensureSignalSubs|removeSignalSub|setSignalAndNotifySubsNLevelsDeep|applyDmaxPatchSignals|signalRead|signalWrite|shouldReadSignal|shouldWriteSignal)\b/,
    msg: 'sig-related identifiers should use the standardized sig prefix'
  },
  {
    re: /\b(?:let|const)\s+_(?:activeAbort|mi|mArr|dest|m|mp|k|v)\b|\(\s*_(?:ev|trigVal|detail|eventObj|e)\b|,\s*_(?:trigVal|detail)\b|catch\s*\(\s*_e\b|for\s*\(\s*(?:const|let)\s+_\b/,
    msg: 'local identifiers should not use underscore prefixes'
  }
];

for (const { re, msg } of disallowed) {
  const match = source.match(re);
  assert.strictEqual(match, null, `${msg}: found ${match && match[0]}`);
}

console.log('dmax naming checks passed');
