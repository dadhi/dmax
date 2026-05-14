const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dmaxPath = path.join(process.cwd(), 'dmax.js');
const source = fs.readFileSync(dmaxPath, 'utf8');

const disallowed = [
  { re: /\b(?:async\s+)?function\s+[A-Za-z0-9_$]+\s*\(/, msg: 'classic function declarations should stay out of dmax.js' },
  { re: /\bvar\s+[A-Za-z0-9_$]+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/, msg: 'var arrow-function assignments should stay out of dmax.js' },
  { re: /\b__[A-Za-z0-9_]+\b/, msg: 'double-underscore names should stay out of dmax.js' },
  { re: /\b(?:sg|sgVal|sgName|getSgChangeShape)\b|SG_CHANGED_[A-Z_]+/, msg: 'sig names should use the sig prefix consistently' },
  {
    re: /\b(?:getSignalValOrIt|resolveStatusSignal|patchMatchingSignals|ensureSignalSubs|removeSignalSub|setSignalAndNotifySubsNLevelsDeep|applyDmaxPatchSignals|signalRead|signalWrite|shouldReadSignal|shouldWriteSignal)\b/,
    msg: 'sig-related identifiers should use the standardized internal names'
  },
  { re: /\b(?:selectValue|selectIndex|eventName|eventObj)\b/, msg: 'select/event identifiers should use the sel/ev abbreviations' },
  { re: /\b(?:SPECIALS?|isSpecial|HEADER_[A-Z_]+|ACTION_[A-Z_]+)\b/, msg: 'special/header/action identifiers should use the spec/h_/act_ standard names' },
  { re: /\b(?:SSE_DATA_PATCH_ELS|SSE_DATA_PATCH_SIGS|PATCH_MODE_[A-Z_]+)\b/, msg: 'SSE patch identifiers should use the abbreviated SSE_* names' },
  { re: /\bSPECS\b/, msg: 'SPECS should be abbreviated as SPS' },
  { re: /\bSPEC\b/, msg: 'SPEC should be abbreviated as SP' },
  { re: /\bSPEC_\w+/, msg: 'SPEC_* should be abbreviated as SP_*' },
  { re: /\bisSpec\b/, msg: 'isSpec should be abbreviated as isSp' },
  { re: /\bEV_PROP\b/, msg: 'EV_PROP should be abbreviated as EV' },
  { re: /\bEV_PR\b/, msg: 'EV_PR should be abbreviated as EV' },
  { re: /\bACT_HEADERS\b/, msg: 'ACT_HEADERS should be abbreviated as ACT_HS' },
  { re: /\bMOD_[A-Z]/, msg: 'MOD_* constants should use the M_ prefix' },
  { re: /\bmergeActionHeaders\b|\bbuildActionBaseHeaders\b/, msg: 'Headers function names should use the hs abbreviation' },
  { re: /\bgetSigVal\b|\bgetSigValOrIt\b|\bsetSigAndNotify\b|\bpatchMatchingSigs\b|\bremoveSigSub\b|\bhasSigMods\b|\bwriteSigTrigs\b|\baddNonSigTrig\b|\bgetSigChange\b/, msg: 'Sig identifiers should use the si abbreviation' },
  { re: /\bgetModValPath\b|\bresolveModPathVal\b|\bapplyTrigMods\b|\bsigChangeMod\b/, msg: 'Mod identifiers should use the m abbreviation' },
  { re: /\bgetElPropVal\b|\bgetDefaultProp\b|\bisDefaultPropName\b|\bsetProp\b|\bsyncPropTargets\b|\bwritePropTrigs\b|\bDEFAULT_PROP_TAR\b/, msg: 'Prop identifiers should use the pr abbreviation' },
  { re: /\baddTrigSub\b|\bgetTrigEventVal\b|\bgetTrigPropTarget\b/, msg: 'Trig identifiers should use the tr abbreviation' },
  { re: /\baName\b/, msg: 'aName should be renamed to dKey' },
  { re: /\baVal\b/, msg: 'aVal should be renamed to dVal' },
  { re: /\b(?:let|const)\s+_(?:activeAbort|mi|mArr|dest|m|mp|k|v)\b/, msg: 'local declarations should not use underscore prefixes' },
  { re: /for\s*\(\s*(?:const|let)\s+_\b/, msg: 'loop variables should not use underscore prefixes' }
];

for (const { re, msg } of disallowed) {
  const match = source.match(re);
  assert.strictEqual(match, null, `${msg}: found ${match && match[0]}`);
}

console.log('dmax naming checks passed');
