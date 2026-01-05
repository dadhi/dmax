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

**✅ Default Trigger (`@.`)** — context-dependent shorthand for default element behavior
- **In `data-sub`, `data-action`**: represents the default **event** of the element
  - Button: `click`, Input/Textarea: `input`, Select: `change`, Checkbox/Radio: `change`, Form: `submit`
  - Example: `data-sub:count@.="dm.count + 1"` on a button → triggers on click
  - Example: `data-get:result@.="url"` on a button → triggers on click
- **In `data-sync`, `data-class`, `data-disp`**: represents the default **prop** of the element with change notification via default event
  - Input/Textarea/Select: `value` property (via `input` or `change` event)
  - Checkbox/Radio: `checked` property (via `change` event)
  - Other elements: `textContent` property
  - Example: `data-sync:user.name@.` on an input → syncs `value` property via `input` event
- **Never** interpreted as a signal trigger
- Can be extended with explicit event/prop: `@.click`, `@.value`, `@.checked`

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

**❌ NOT YET IMPLEMENTED:**
- `!` prefix on trigger name (negation shorthand) — use as signal/prop name prefix to trigger only when value is falsy
  - Example: `@!is-loading` is equivalent to `@is-loading__eq.false`
  - Future: `!!signal` may mean trigger when value is truthy (positive assertion)
- `!` prefix inside guard values (value negation) — negate the guard comparison value
  - Example: `@signal__eq.!signal2` means "trigger when signal equals NOT signal2 (falsy value of signal2)"
  - Can be used with: `__and.!signal`, `__notand.!signal`, `__eq.!signal`, `__ne.!signal`, etc.
  - Evaluates the signal after `!` and uses its negated (falsy) value for comparison

**Note on Constants:**
- Constants inherit `__immediate __once` by default (execute once, never re-trigger)
- No additional modifiers typically needed for constants since they represent immutable trigger values

### Target Types

Targets (denoted with `:target`) specify what to update when a reactive expression executes:

**✅ Default Target (`:.`)** — shorthand for default prop on current element
- Always represents the default **property** of the data attribute's element
- Input/Textarea/Select: `value` property
- Checkbox/Radio: `checked` property  
- Other elements: `textContent` property
- Example: `data-sub:.@count="dm.count"` on a `<span>` → updates `textContent`
- Example: `data-sub:.@result="dm.result"` on an `<input>` → updates `value`
- Can be extended with explicit prop: `:.style.color`, `:.className`, `:.disabled`

**✅ Signals** — reactive state stored in the global signal map
- May be nested with dot notation (e.g., `:user.name`, `:user.profile.email`)
- Used in: `data-sub`, `data-def`, `data-sync`, `data-action`
- Example: `data-sub:count@.click="dm.count + 1"`

**✅ Props** — element properties to update
- May be nested for deep property access (e.g., `:style.color`, `:#output.value`)
- Element reference syntax: `:#id.property` for other elements, `:.property` for current element
- Used in: `data-sub`, `data-class` (class names only), `data-disp` (implicit current element)
- Example: `data-sub:.textContent@count="dm.count"`, `data-sub:#output.value@input="dm.result"`

### Target Modifiers

Modifiers (denoted with prefix `__`) control how values are applied to targets:

**✅ IMPLEMENTED (data-action only):**
- `__replace` — replace the entire value (default for all targets)
- `__append` — append to array signal (arrays only)
- `__prepend` — prepend to array signal (arrays only)

**❌ NOT IMPLEMENTED:**
- `__merge` — merge objects (would be for object signals only)
- Target modifiers for `data-sub` (currently only supported on `data-action` directives)

**Examples:**
- `data-post:items__append@.click="url"` — append response to items array
- `data-post:items__prepend@.click="url"` — prepend response to items array
- `data-get:result__replace@.click="url"` — replace result with response (default)

**Note:** 
- Props only support `__replace` semantics (direct assignment)
- Array modifiers (`__append`, `__prepend`) work by reading current signal value, creating new array, and replacing

### Input Parameters (data-action only)

Input parameters (denoted with `+`) specify values to send with HTTP requests in `data-action` directives:

**✅ Signals** — send signal values
- Nested paths supported: `+user.name`, `+settings.api.key`
- Example: `data-post+userId+payload:result@.click="url"`

**✅ Props** — send element property values
- Current element: `+.value`, `+.checked`, `+.textContent`
- Other elements: `+#input.value`, `+#checkbox.checked`
- Example: `data-post+#title.value+#content.value:result@.click="url"`

**✅ Default Input (`+.`)** — shorthand for default prop of current element
- Sends the default property value (same logic as default target `:.`)
- Input/Textarea/Select → `value`, Checkbox/Radio → `checked`, Others → `textContent`
- Example: `data-post+.:result@.click="url"` on an input → sends `value` property

### Input Modifiers

Modifiers (prefix `__`) control where input values are placed in the HTTP request:

**✅ IMPLEMENTED:**
- `__query.NAME` — send as URL query parameter (default for GET, DELETE)
  - Name optional, defaults to last part of signal/prop chain
  - Example: `+user.name__query.username` → `?username=value`
  - Example: `+user.name__query` → `?name=value` (uses "name" from chain)
- `__body.NAME` — send in request body as JSON field (default for POST, PUT, PATCH)
  - Name optional, defaults to last part of signal/prop chain
  - Supports nested paths: `__body.user.name` → `{"user": {"name": "value"}}`
  - Example: `+#title.value__body.title` → `{"title": "value"}`
  - Example: `+#title.value__body` → `{"value": "value"}` (uses "value" from chain)
- `__header.NAME` — send as HTTP header
  - Name optional, defaults to `x-dmax-{lastPart}`
  - Example: `+token__header.Authorization` → `Authorization: value`
  - Example: `+token__header` → `x-dmax-token: value`

**Default behavior (when no modifier specified):**
- GET, DELETE methods → `__query` (URL query parameter)
- POST, PUT, PATCH methods → `__body` (JSON body field)

**Examples:**
- `data-post^json+#title.value__body.title+#name.value__body.author:result@.click="url"`
  - Sends `{"title": "...", "author": "..."}` as JSON body
- `data-get+query__query.q+page__query:results@.click="url"`
  - Sends `?q=...&page=...` as query params
- `data-post+token__header.Authorization+#data.value:result@.click="url"`
  - Sends custom header and body field

### State Tracking Signals (data-action only)

State tracking signals (denoted with `?`) monitor the HTTP request/response cycle in `data-action` directives:

**Concept:**
- Special kind of **target signals** that automatically track request state
- Syntax: `?signalName__mode` where mode defines what to track
- Multiple trackers can be specified: `?busy__busy,err__err` or `?status__all`
- **Auto-created:** tracker signals are automatically initialized if they don't exist

**✅ Tracker Modes:**
- `__busy` (default) — `true` while request is in-flight, `false` when response returns
  - Initial value: `false`
  - Example: `?loading__busy` or `?loading` (busy is default)
- `__done` — opposite of `busy`, `false` during request, `true` after response
  - Initial value: `false`
- `__ok` — `true` if response has OK status code (2xx), `false` otherwise
  - Initial value: `true`
- `__err` — `true` if response has error status code or request failed, `false` on success
  - Initial value: `false`
- `__code` — the HTTP response status code number
  - Initial value: `null`
- `__all` — signal becomes an object with all tracking fields
  - Initial value: `{busy: false, done: false, err: false, ok: true, code: null}`
  - Updates to: `{busy: true, done: false, err: false, ok: true, code: null}` during request
  - Success: `{busy: false, done: true, err: false, ok: true, code: 200}`
  - Error: `{busy: false, done: false, err: true, ok: false, code: 404}`

**Examples:**
- `data-get:result?loading__busy@.click="url"`
  - Tracks loading state in `loading` signal (true during request)
- `data-post:data?busy__busy,error__err@.click="url"`
  - Tracks both busy and error states separately
- `data-get:items?state__all@.click="url"`
  - Tracks all states in one `state` object signal
- Use in templates:
  ```html
  <button data-get:posts?loading__busy@.click="api/posts">Load</button>
  <span data-sub:.@loading="dm.loading ? 'Loading...' : ''"></span>
  <div data-disp:.@error="dm.error">Error occurred!</div>
  ```

**Note:** Tracker signals are only available in `data-action` directives (`data-get`, `data-post`, `data-put`, `data-patch`, `data-delete`)


### HTTP Headers (`^`)

HTTP headers for `data-action` directives are specified with the `^` prefix. Headers must use **constant string values only** — for dynamic header values, use input parameters with the `__header` modifier.

**Syntax:**
- `^name.value` — custom header with constant value
  - Example: `^cache-control.no-cache` sets `Cache-Control: no-cache`
  - Example: `^authorization.Bearer_token123` sets `Authorization: Bearer token123`
  - Multiple headers: `^x-api-key.abc123,^x-request-id.xyz789`

**Header Shortcuts:**
Predefined shortcuts for common headers:
- ✅ `^json` — sets `Content-Type: application/json` and `Accept: application/json`
- ❌ `^html` — sets `Content-Type: text/html` (**NOT YET IMPLEMENTED**)
- ❌ `^js` — sets `Content-Type: application/javascript` (**NOT YET IMPLEMENTED**)
- ❌ `^sse` — sets `Accept: text/event-stream` for Server-Sent Events (**NOT YET IMPLEMENTED**)
- ❌ `^no-cache` — sets `Cache-Control: no-cache` (**NOT YET IMPLEMENTED**)

**Examples:**
```html
<!-- JSON request with custom header -->
<button data-post:result^json,^x-api-key.secret123+body@.click="api/data">
  Submit
</button>

<!-- Multiple custom headers -->
<form data-post^cache-control.no-cache,^x-request-id.abc123+body@.submit="api/form">
  ...
</form>

<!-- Combining headers with inputs and state tracking -->
<button data-get:items^json?loading__busy+query@.click="api/search">
  Search
</button>
```

**Note:** For dynamic header values (e.g., from signals), use input parameters:
```html
<!-- Use __header modifier for dynamic headers -->
<button data-post+apiKey__header.x-api-key@.click="api/data">Send</button>
```


### Data Attribute Values (`="..."`)

Data attributes may or may not have a value depending on the specific directive. When defined, the value contains valid JavaScript that can be put in a function body — the library evaluates it and uses the result based on the directive type.

**Value Types:**

1. **JSON Values** (literals):
   - Strings: `"hello"` or `` `template ${dm.signal}` `` (templated strings use backticks)
   - Numbers: `42`, `3.14`
   - Booleans: `true`, `false`
   - Objects: `{key: 'value', count: dm.counter}`
   - Arrays: `[1, 2, 3]`

2. **JavaScript Statements**:
   - Single expression: `dm.count + 1`
   - Multiple statements (split by `;`): `const x = dm.count; x * 2; return x + 10`
   - May return a value or not, depending on directive needs

**Evaluation Context:**

Values are evaluated as JavaScript function bodies with access to these parameters:

- **`dm`** — global store for dmax signals (e.g., `dm.userName`, `dm.counter`)
- **`el`** — the DOM element where the attribute is defined
- **`ev`** — the event that triggered evaluation (or `undefined` for non-event triggers)
- **`sg`** — the signal value that triggered evaluation (or `undefined` for event triggers)
- **`detail`** — additional context data associated with the trigger:
  - **Currently supported**: `detail.change.added`, `detail.change.removed` for signals with `__shape` modifier triggered in `data-dump`
  - **Future**: May support `detail.item`, `detail.index` for data attributes evaluated inside `data-dump` template clones for specific array items

**Examples by Directive:**

```html
<!-- data-sub: JS expression returning value to set -->
<span data-sub:.textContent@userName="dm.userName.toUpperCase()"></span>
<input data-sub:.value@count="dm.count * 2">

<!-- data-sync: optional inline value for initialization -->
<input data-sync:userName="'Default Name'">
<input data-sync:count="0">

<!-- data-def: JSON object or JS expression defining signals -->
<div data-def="{ counter: 0, user: { name: 'John' } }">
<div data-def="{ items: dm.posts.filter(p => p.active) }">

<!-- data-disp: JS expression returning boolean for visibility -->
<div data-disp:.@error="dm.error !== null">
<span data-disp:.@loading="dm.loading && dm.count > 0">

<!-- data-class: Boolean expression per class -->
<div data-class:active@isActive="dm.isActive">
<div data-class:loading@busy="dm.busy">

<!-- data-action: URL template with signal interpolation -->
<button data-get:result@.click="api/users/${dm.userId}">Fetch</button>
<form data-post:response+body@.submit="api/items">Submit</form>

<!-- data-dump: no value used (template is specified via #elem) -->
<ul data-dump:.@items#itemTemplate></ul>

<!-- Complex expressions with multiple statements -->
<button data-sub:.textContent@count="
  const doubled = dm.count * 2;
  const result = doubled + 10;
  return `Count: ${result}`;
">
</button>

<!-- Accessing evaluation context params -->
<div data-sub:.textContent@.click="
  console.log('Element:', el);
  console.log('Event:', ev);
  return 'Clicked!';
">
</div>

<!-- Shape changes with detail.change -->
<div data-dump:.@items__shape#tpl="
  console.log('Added:', detail.change.added);
  console.log('Removed:', detail.change.removed);
">
</div>
```

**Notes:**
- Templated strings must use backticks: `` `Hello ${dm.name}` ``
- Regular strings use quotes: `"Hello"` or `'Hello'`
- Multi-statement expressions automatically get wrapped in a function body
- Return value usage depends on directive (e.g., `data-sub` uses it for assignment, `data-disp` for visibility)
- Some directives don't require values (e.g., `data-dump` gets data from `@trigger`, not value)


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
