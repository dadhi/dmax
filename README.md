# dmax

A tiny data-maximal runtime.

## Quick Start

```text
dmax v0.1
------------------------------------------
Subscription engine: explicit reactivity, tiny runtime, no virtual DOM.

Core directives:
 - data-def   : declare initial signals/state (JSON or shorthand)
 - data-sub   : reactive assignments / side-effects (targets: signals or element props; triggers: signals, element/window events; common mods supported)
 - data-sync  : two-way binding sugar (one or two targets, prevents loops)
	- Directional forms: `data-sync@signal` (signal -> element one-way), `data-sync:signal@.` (element -> signal one-way), and `data-sync:signal` (default two-way). See `index.html` examples.
 - data-class : conditional add/remove classes
 - data-disp  : show/hide by expression
 - data-dump  : array/object rendering via a template or inline `<template>`; supports `$item` (item) and `$index` (index) placeholders; cloned nodes are wired for `data-*` directives
 - data-get/post/put/patch/delete : declarative HTTP actions (basic wiring; controls TBD)

Notes:
 - Attributes use kebab-case; runtime converts to camelCase for JS access.
 - Expressions are compiled & cached; signals stored in a small `Map` (`S`).
 - Compiled expressions receive four arguments: `dm` (the global state object containing signals), `el` (the element), `ev` (the triggering Event, if any), and `sg` (the signal path string that triggered the evaluation, if any). Expressions should reference signals explicitly via `dm`, e.g. `dm.count` or `dm.user.name`.
 - Attribute-level/global mods: you can append modifiers directly after the directive name (e.g. `data-sub__once:...`) to apply them to all triggers on that attribute. Trigger-level modifiers (after a trigger) override attribute-level ones. Use `__always` to override a global `__once` on a specific trigger.
 - `data-dump` precomputes shallow bindings for faster updates and performs simple append/remove reconciliation (clones appended/removed at the end).

See `index.html` for live examples and detailed grammar reference below.
```

### Trigger Types

Triggers (denoted with `@`) specify when a reactive expression should execute:

**✅ Signals** — may be nested with dot notation (e.g., `@user.name`)
- Default behavior: `__immediate` (execute on init)

**✅ Props** — element properties with change notification via default element event
- May be nested like `@#input.value`, `@.style.color`
- Props are based on events but provide the value like signals
- Default behavior: `__immediate` (execute on init)

**✅ Events** — DOM events from elements, window, or document
- Element events: `@.click`, `@#btn.submit`
- Special targets: `@_window.resize`, `@_document.visibilitychange`, `@_form.submit`
- Synthetic events: `@_interval.1000`, `@_delay.500`
- Default behavior: `__notimmediate` (do not execute on init)
- For `_interval` and `_delay`, the runtime passes a CustomEvent as `ev`: `ev.type` is `'interval'` or `'delay'` and `ev.detail.ms` contains the configured milliseconds

**✅ Constants** — literal values used as triggers (e.g., numeric indices)
- Primarily used in `data-dump` templates where `$index` placeholders are substituted with numeric constants (e.g., `0`, `1`, `2`)
- Example: In template `data-sub:.@$index`, becomes `data-sub:.@0` for first item, `data-sub:.@1` for second item, etc.
- Acts as a trigger that references a non-existent signal, effectively running only once on init
- Default behavior: `__immediate __once` (execute once on init, never fires again since the "signal" never changes)
- Useful for establishing one-time bindings in list item templates

### Trigger Modifiers

Modifiers (denoted with prefix `__`) control trigger behavior:

**✅ IMPLEMENTED:**
- `__immediate` — run handler immediately on init (default for signals, props)
- `__notimmediate` — do not run on init (default for events)
- `__once` — run only once then remove subscription
- `__always` — override global `__once` for specific trigger
- `__debounce.MS` — debounce handler by milliseconds
- `__throttle.MS` — throttle handler by milliseconds
- `__prevent` — call `preventDefault()` on events (events/props only)
- `__and.SIGNAL` — conditional: only execute if signal is truthy
- `__andnot.SIGNAL` — conditional: only execute if signal is falsy
- `__eq.VALUE` — guard: only execute if trigger signal/value equals VALUE
- `__ne.VALUE` — guard: only execute if trigger signal/value not equals VALUE
- `__gt.VALUE` — guard: only execute if trigger signal/value > VALUE
- `__ge.VALUE` — guard: only execute if trigger signal/value >= VALUE
- `__lt.VALUE` — guard: only execute if trigger signal/value < VALUE
- `__le.VALUE` — guard: only execute if trigger signal/value <= VALUE
- `__shape` — signals only: subscribe to shape changes (keys added/removed), not value changes
- `__content` — signals only: subscribe to content/value changes (explicit, this is default)

**Note on Constants:**
- Constants inherit `__immediate __once` by default (execute once, never re-trigger)
- No additional modifiers typically needed for constants since they represent immutable trigger values


---

## Grammar Reference: Data-Attribute Primitives (Source of Truth)

**Legend:**
- **Cardinality:** `0` (not used), `1` (exactly one), `1+` (one or more), `0-1` (optional), `0+` (zero or more)
- **Default:** Value used when primitive is absent
- **Mods:** Supported modifiers for this primitive/directive

### Core Primitives

| Primitive | data-sub | data-sync | data-dump | data-def | data-disp | data-class | data-action¹ |
|-----------|----------|-----------|-----------|----------|-----------|------------|--------------|
| **`:target`** | | | | | | | |
| Cardinality | 1+ | 1 | 0 | 0+ | 0 | 1+ | 1 |
| Default | - | - | `.` (implicit) | - | `.` (implicit) | - | - |
| Semantics | What to update | Signal to sync | Element itself | Signals to define | Element itself | Class names | Result storage |
| Element refs (`#id`) | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Prop paths (`.prop`) | ✅ Yes | ❌ No² | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Local mods | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Notes | Multiple targets | Single signal path | Always `.` | Optional, can use value only | Always `.` | Class list | Single target |
| | | | | | | | |
| **`@trigger`** | | | | | | | |
| Cardinality | 1+ | 0-1 | 1 | 0 | 1+ | 1+ | 1 |
| Default | - | `.` (two-way) | - | - | - | - | - |
| Semantics | When to update | Sync direction | **Data source³** | Not used | When to show/hide | When to apply | When to execute |
| Signal triggers | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ❌ No⁴ |
| Event triggers (`.click`) | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Special triggers (`_window`) | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Local mods | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Notes | Multiple triggers | Optional: `@.` (el→sig), `@signal` (sig→el), none (two-way) | **SOURCE signal to iterate** | - | Multiple triggers | Multiple triggers | Single event |
| | | | | | | | |
| **`#elem`** | | | | | | | |
| Cardinality | 0+ | 0 | 0-1 | 0 | 0+ | 0+ | 0+ |
| Default | - | - | Inline `<template>` | - | - | - | - |
| Semantics | Element ref in target | Not used | **Template ref⁵** | Not used | Not used | Not used | Input source |
| Notes | Used in `:target` paths | - | Required: external OR inline | - | - | - | For `+#id.prop` |
| | | | | | | | |
| **`__globalMod`** | | | | | | | |
| Supported | ✅ Yes | ❌ No | ❌ No | ⚠️ Rejected⁶ | ✅ Yes | ✅ Yes | ✅ Yes |
| Available mods | All⁷ | - | - | Could support: `once`, `merge` | All⁷ | All⁷ | All⁷ |
| Semantics | Apply to all triggers | - | - | Define behavior | Apply to all triggers | Apply to all triggers | Apply to request |
| Notes | `data-sub__once:...` | - | - | **Should allow!** | `data-disp__debounce:...` | `data-class__throttle:...` | `data-get__once:...` |
| | | | | | | | |
| **`="value"`** | | | | | | | |
| Cardinality | 1 | 0-1 | 0 | 1 | 0-1 | 1 | 1 |
| Type | JS expression | JS expression | Not used | JSON \| expression | JS expression | Boolean expression | URL template |
| Default | - | (sync value) | - | - | (visibility) | - | - |
| Notes | **Required** | Optional inline | Not used | **Required**: object or expr | Optional inline | **Required** | **Required** |

### Special Action Tokens (data-action only)

| Token | Cardinality | Semantics | Example | Notes |
|-------|-------------|-----------|---------|-------|
| `^header` | 0+ | HTTP headers | `^json`, `^auth.Bearer` | Shortcuts: `json`, `auth.TYPE` |
| `+input` | 0+ | Request body inputs | `+#id.prop`, `+signal` | From element or signal |
| `?state` | 0-1 | State management | `?busy,err` | Signals for loading/error |
| | | | `?busy__loading,err__error` | With custom signal names |

### Modifier Reference

**Global modifiers** (apply to all triggers on attribute):
- `__once` - Execute only once, then unbind
- `__debounce.MS` - Debounce (wait MS after last trigger)
- `__throttle.MS` - Throttle (max once per MS)
- `__prevent` - Call preventDefault() on events
- `__immediate` / `__notimmediate` - Execute on init or not

**Local modifiers** (apply to specific target/trigger):
- Same as global, plus:
- `__and.signal` - Require signal to be truthy
- `__notand.signal` - Require signal to be falsy
- `__gt.N`, `__lt.N`, `__eq.N`, `__gte.N`, `__lte.N`, `__neq.N` - Comparisons
- `__shape` - Subscribe to shape changes only (keys, not values)
- `__content` - For class targets: textContent of parent

**Special event modifiers** (on event triggers):
- `@.click__prevent` - Prevent default
- `@.click__once` - Handle once

### Notes

1. **data-action** = `data-get`, `data-post`, `data-put`, `data-patch`, `data-delete`
2. **data-sync** targets are always signal paths (no `.prop` needed, signals ARE the state)
3. **data-dump `@trigger`** semantic overload: `@` means "data SOURCE" here, not "when". Pattern: `@SOURCE#template`
4. **data-action** triggers are events only (not signals), e.g., `@.click`, `@_window.load`
5. **data-dump `#elem`** must be template: `#tpl-id` OR inline `<template>` child
6. **data-def modifiers**: Currently rejected but SHOULD support `__once` (define once), `__merge` (merge with existing)
7. **All modifiers**: `once`, `debounce.MS`, `throttle.MS`, `prevent`, `immediate`, `notimmediate`, `and.signal`, `notand.signal`, `gt/lt/eq/gte/lte/neq.N`, `shape`, `content`, `always`

### Grammar Tokens (Unified)

**All directives understand these tokens:**

```
data-<directive>[__globalMod]:target[__localMod]@trigger[__localMod]#elem="value"
                 ^^^^^^^^^^^^^  ^^^^^^ ^^^^^^^^^^  ^^^^^^^ ^^^^^^^^^^  ^^^^  ^^^^^
                 optional       1+     optional    1+      optional    0+    required/optional
```

**Token semantics (CONSISTENT across directives):**
- `:` = TARGET (destination/what to update)
- `@` = SOURCE (origin/when/trigger - WHERE change comes FROM)
- `#` = ELEMENT (reference to DOM element or template)
- `__` = MODIFIER (behavior flags: once, debounce, throttle, etc.)
- `="..."` = VALUE (JS expression, JSON, URL - depends on directive)

### Implicit Defaults

Some directives have **implicit tokens** when omitted:

| Directive | Implicit | Means | Example |
|-----------|----------|-------|---------|
| data-sync | `@.` | Two-way binding | `data-sync:user.name` = `data-sync:user.name:.` |
| data-dump | `:.` | Target is current element | `data-dump@posts#tpl` = `data-dump:.@posts#tpl` |
| data-disp | `:.` | Target is current element | `data-disp@signal` = `data-disp:.@signal` |

### Analysis & Opportunities

**Gaps identified:**
- ❌ data-def arbitrarily rejects modifiers (should support `__once`, `__merge`)
- ❌ data-sync doesn't support local mods (could support `__throttle` per direction)
- ⚠️ data-dump value not used (could support inline data override)

**Inconsistencies:**
- ✅ Grammar tokens are unified
- ✅ `@` semantics consistent (always = SOURCE)
- ⚠️ Token requirements vary (by design, per directive's domain)

**Opportunities:**
- 🔮 New directive: `data-effect` (side-effects only, no target) → `data-effect@signal="console.log(dm.foo)"`
- 🔮 data-def could support `data-def__merge:signals` (merge vs replace)
- 🔮 data-dump could use value: `data-dump@posts#tpl="transformFn(dm.posts)"`
