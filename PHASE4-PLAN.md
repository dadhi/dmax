# Phase 4: Parser Unification Implementation Plan

## Goal
Extract unified tokenizer from 3+ duplicate parsers, achieving semantic compression.

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
