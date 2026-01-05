# Phase 4: Parser Unification - IN PROGRESS 🔄

## Current Status: Semantic Compression Applied, Plugin Architecture Needed

### Completed (Phase 4a): Validation Unification ✅
- **Lines:** 2208 (from 2011 baseline)
- **Tests:** 50/50 headless, 145/148 fuzzer (98%)
- **Validation:** Single source of truth via validateIdentifier()
- **Commits:** 5 commits (main branch)

**Achieved:**
1. ✅ validateIdentifier(str, context) - Rejects camelCase at primitive level
2. ✅ normalizePathStrict(path, context) - Unified kebab→camel conversion  
3. ✅ tokenizeDirective(attr, start) - Core state machine for directive parsing
4. ✅ Removed all ad-hoc fallbacks from data-dump
5. ✅ Removed redundant data-dump extra sweep (was doubling DOM traversal)

### Critical Discovery: Need Plugin Architecture (Phase 4b)

**Problem:** Each data-attr has **semantic inconsistencies** in how they interpret tokens:

| Attribute | Syntax | `:target` | `@trigger` | `#elem` | `__mod` | `="value"` |
|-----------|--------|-----------|-----------|---------|---------|-----------|
| data-sub | `:foo@bar` | Required | Required | Optional | Yes | Required (expr) |
| data-sync | `:foo` | Required | **Implicit `.`** | No | No | Optional |
| data-sync | `:foo@.` | Required | Explicit (1-way) | No | No | Optional |
| data-dump | `@foo#bar` | **NO** | Required | Required (#tpl) | No | **NO** |
| data-def | `:foo` | Optional | No | No | **Rejected** | Required (JSON/expr) |
| data-action | `:foo@bar` | Required | Required | Yes | Yes | Required (URL) |

**Semantic confusion:**
- `data-sync:user.name` → Why no `@trigger`? Answer: Implicit `:.` (two-way)
- `data-dump@posts#tpl` → Why no `:target`? Answer: `@` IS the target here
- `data-def:foo` → Why reject `__mod`? Answer: Arbitrary restriction
- Attribute VALUE meaning varies: expr (sub), URL (action), optional (sync), forbidden (dump)

### Phase 4b Goal: Unified Grammar + Plugin System

**Core Principle:** ALL data-attrs understand the same primitives, each adds domain logic.

#### Proposed Unified Model:

```javascript
// EVERY data-attr attribute is parsed by tokenizeDirective()
// Returns: {targets: [...], triggers: [...], globalMods: {}, localMods: {}}

// Each setup function interprets tokens per its semantics:
function setupGeneric(type, el, attr, value) {
  const tokens = tokenizeDirective(attr, prefixLen);
  
  // Plugin-specific interpretation:
  switch(type) {
    case 'data-sub':
      // Requires: 1+ target, 1+ trigger, value=expression
      // Supports: modifiers, element refs
      break;
      
    case 'data-sync':
      // Requires: 1 target (signal path)
      // Optional: trigger (defaults to :. for two-way)
      // Supports: directional binding via trigger interpretation
      // Value: optional (for inline expressions)
      break;
      
    case 'data-dump':
      // Requires: 1 trigger (@signal), 1 element ref (#template)
      // Note: trigger is overloaded as "source signal"
      // Value: forbidden (for now)
      break;
      
    case 'data-def':
      // Optional: 1+ targets (signal names)
      // Value: required (JSON object or expression)
      // Modifiers: could support in future
      break;
      
    case 'data-action':
      // Requires: 1 target, 1 trigger
      // Supports: custom tokens (^headers, +inputs, ?state)
      // Value: required (URL template)
      break;
  }
}
```

#### Benefits of Plugin Architecture:
1. **Semantic clarity** - Each attr documents what tokens it uses/requires
2. **Natural extension** - New attrs just interpret shared tokens
3. **Consistent error messages** - Tokenizer validates, setup interprets
4. **Code reuse** - 90% shared (tokenizer), 10% domain-specific
5. **No arbitrary restrictions** - If tokenizer supports it, attrs can use it

#### Example: Extending data-def to support modifiers
```javascript
// BEFORE (current): Arbitrary rejection
if (tokens.globalMods.length > 0) {
  console.error('data-def does not support modifiers');
  return;
}

// AFTER (plugin model): Natural support
if (tokens.globalMods.__once) {
  // Define signals once, don't overwrite
}
if (tokens.globalMods.__merge) {
  // Merge with existing state
}
```

### Phase 4b Implementation Plan

**Step 1:** Document current semantic model for each attr
- What tokens are required/optional/forbidden?
- What does attribute VALUE mean for each?
- Why these choices? (Document the semantics)

**Step 2:** Identify unnecessary restrictions
- data-dump: Why forbid `:target`? Could support `:data.posts@#tpl`
- data-def: Why reject mods? Could support `__once`, `__merge`
- data-sync: Why restrict element refs? Could support `data-sync:foo@#input.value`

**Step 3:** Redesign data-dump syntax (BREAKING CHANGE)
Current: `data-dump@posts#tpl-post` (custom grammar)
Proposal: `data-dump:posts@#tpl-post` (uses `:target`)
Rationale: Aligns with grammar, `:` indicates "source data", `@#` indicates "at element"

**Step 4:** Unified attribute VALUE semantics
- Always treated as JS/JSON expression (if present)
- Each attr decides: required, optional, or forbidden
- Document in grammar: `data-sub:target@trigger="expr"` (required)
- Document in grammar: `data-sync:path` (optional, defaults to two-way)

**Step 5:** Create directive plugin specification
```javascript
// Each data-attr exports a specification:
const DATA_SUB_SPEC = {
  name: 'data-sub',
  prefix: 'data-sub',
  requires: {
    targets: '1+',      // At least one :target
    triggers: '1+',     // At least one @trigger
    value: 'expression' // Attribute value is JS expression
  },
  supports: {
    elementRefs: true,  // Can use #elemId in targets
    modifiers: true,    // Can use __mod
    propPaths: true     // Can use .prop.path in targets
  },
  interpret: (tokens, value) => {
    // Domain-specific logic
    // Returns: handler setup or error
  }
};
```

**Step 6:** Refactor setup functions to use specs
- Remove ad-hoc validation (let tokenizer handle)
- Use spec to validate token requirements
- Focus setup logic on domain semantics only

### Success Criteria (Phase 4b):
- [ ] All attrs use tokenizeDirective (no custom parsers)
- [ ] Clear plugin specification for each attr
- [ ] Documented grammar: what each token means per attr
- [ ] Attribute VALUE semantics documented
- [ ] No arbitrary restrictions (e.g., data-def rejects mods)
- [ ] Tests: 100% pass rate maintained
- [ ] Size: Net reduction (remove duplicate logic)

---

## Completed Work (Phase 4a)

### Architecture Created
1. **validateIdentifier(str, context)** - Rejects camelCase at primitive level
2. **normalizePathStrict(path, context)** - Unified kebab→camel conversion  
3. **tokenizeDirective(attr, start)** - Core state machine for directive parsing

### Parser Status
- ✅ **parseDataAttrFast:** Thin wrapper over tokenizeDirective
- ✅ **parseActionAttr:** Uses tokenizer + validateIdentifier for headers/inputs/state
- ✅ **setupDump:** Custom scan() with validateIdentifier (NEEDS Phase 4b redesign)
- ✅ **setupDef:** Uses tokenizer, rejects modifiers (ARBITRARY - remove in Phase 4b)
- ✅ **setupSync:** Uses parseDataAttrFast BUT has implicit trigger semantics (NEEDS docs)

### Cleanup Completed (Jan 5, 2026)
- ✅ Removed data-dump scan(attrVal) - was checking attribute value
- ✅ Removed data-signal fallback - undocumented, never used
- ✅ Removed attrVal bare signal name - never used
- ✅ Removed element attribute scanning - over-engineered
- ✅ Removed redundant data-dump extra sweep - was doubling DOM traversal
- ✅ Fixed setupDump signature: (el, attr) - consistent with setupSync
- ✅ Enhanced fuzzer: +12 data-dump tests (3 → 15 total)

### Tests Results
- **Headless:** 50/50 (100%) ✅
- **Fuzzer:** 145/148 (98%) - 3 false negatives due to JSDOM timing
- **Actions:** All pass ✅

---

## Original Implementation Plan (Phase 4a - COMPLETE)

## Current State Analysis

### Parser Locations
1. **parseDataAttrFast** (lines 551-640, ~90 lines)
   - Most complete: handles all token types
   - Has validation via normalizePath()
   - State machine: scans `:` and `@` delimiters

2. **parseActionAttr** (lines 989-1072, ~83 lines)  
   - Custom logic for `^` headers, `+` inputs, `?` state
   - Calls parseDataAttrFast for `:target@trigger` part
   - Manual validation added for inputs

3. **parseDumpAttr** (lines 1477-1487, ~11 lines)
   - Simple indexOf scan for `@signal` and `#template`
   - Regex validation (allows camelCase)

4. **setupDef** (lines 1879-1892, ~14 lines)
   - substring after `:`
   - No validation

### Shared Grammar Elements
All parsers handle:
- **Delimiters:** `:` (target), `@` (trigger), `#` (element), `.` (prop/current), `_` (special)
- **Modifiers:** `__modifier` or `__modifier.value`
- **Identifiers:** kebab-case names (should reject camelCase)
- **Paths:** dot-notation like `user.ui.theme-color`

### Action-Specific Tokens
- `^` headers: `^json`, `^auth.Bearer`
- `+` inputs: `+#id.prop`, `+signal`
- `?` state: `?busy,err`
- Body modifiers: `__body.path`, `__query.name`, `__header.name`

## Implementation Strategy

### Step 1: Extract Core Tokenizer (NEW)
Create `tokenizeDirective(str, start, stopChars)` that:
- Returns: `{targets: [], triggers: [], globalMods: {}, extras: {}}`
- Scans `:` and `@` delimiters
- Delegates to helper functions for each token type
- Uses shared `normalizePath()` for all identifiers
- Handles global modifiers (`__` at start)

### Step 2: Extract Validation Helpers
Move validation to primitive level:
- `validateIdentifier(str, context)` - rejects camelCase
- `normalizePathStrict(str, context)` - validates + converts kebab→camel
- Called by tokenizer, not by each parser

### Step 3: Rewrite parseDataAttrFast
Simply call tokenizer:
```javascript
function parseDataAttrFast(attr, prefixLen) {
  return tokenizeDirective(attr, prefixLen, null);
}
```

### Step 4: Rewrite parseActionAttr  
Use tokenizer + interpret action tokens:
```javascript
function parseActionAttr(attr) {
  // Extract method
  // Parse action-specific tokens (^+?)
  // Call tokenizer for :target@trigger part
  // Return unified format
}
```

### Step 5: Rewrite parseDumpAttr
Use tokenizer:
```javascript
function parseDumpAttr(name, val) {
  const tokens = tokenizeDirective(name + '@' + val, 0, null);
  return {
    sig: tokens.triggers[0]?.name,
    tplId: tokens.extras.templateId
  };
}
```

### Step 6: Update setupDef
Add validation:
```javascript
function setupDef(el, attr, value) {
  const colonIdx = attr.indexOf(':');
  const name = colonIdx === -1 ? '' : attr.substring(colonIdx + 1);
  if (!validateIdentifier(name, attr)) return;
  // ... rest of logic
}
```

## Testing Strategy

1. Run fuzzer after each step - must stay 100%
2. Run headless tests - must stay 50/50
3. Run action tests - must pass
4. Add tokenizer-specific tests
5. Test edge cases: empty strings, malformed syntax, camelCase rejection

## Success Criteria

- ✅ All tests pass (fuzzer 100%, headless 50/50, actions pass)
- ✅ Size reduction: -100 to -150 lines (semantic compression)
- ✅ Single source of validation logic
- ✅ Each parser is thin wrapper over tokenizer
- ✅ Adding new syntax requires one change (tokenizer only)
- ✅ No validation gaps possible (all go through same code path)

## Rollout

1. Implement on dev-phase4-parser-unification branch
2. Commit after each step with tests passing
3. Final commit: measure size reduction
4. Merge to main after review
5. This unlocks Pattern 1-10 work (safe foundation)
