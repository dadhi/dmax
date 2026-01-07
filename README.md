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
 - **Naming Convention**: Signal, property, event, and class names must use **kebab-case** (converted to camelCase in JS/expressions) or **snake_case** (unchanged). **Never use camelCase** in data attribute names — DOM operations lowercase all attribute names, losing camelCase information.
   - ✅ Correct: `@user-name`, `@is_active`, `:user-data`
   - ❌ Wrong: `@userName`, `@isActive`, `:userData` (will become `@username`, `@isactive`, `:userdata`)
 - Attributes use kebab-case; runtime converts to camelCase for JS access.
 - Expressions are compiled & cached; signals stored in a small `Map` (`S`).
 - Compiled expressions receive four arguments: `dm` (the global state object containing signals), `el` (the element), `ev` (the triggering Event, if any), and `sg` (the signal path string that triggered the evaluation, if any). Expressions should reference signals explicitly via `dm`, e.g. `dm.count` or `dm.userName`.
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
- `data-post:data?busy__busy?error__err@.click="url"`
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
<button data-post:result^json^x-api-key.secret123+body@.click="api/data">
  Submit
</button>

<!-- Multiple custom headers -->
<form data-post^cache-control.no-cache^x-request-id.abc123+body@.submit="api/form">
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
<button data-post+api-key__header.x-api-key@.click="api/data">Send</button>
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
  - **Currently supported**: `detail.change.added`, `detail.change.removed` when using `@signal__shape` trigger in `data-dump` (modifier on the trigger, not the directive)
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


### Modifiers: Global vs Local (`__`)

Modifiers use the `__` prefix and can be applied at different levels:

**Global Modifiers** (on the data attribute itself):
```html
<div data-sub__once:target@trigger="value">
     ^^^^^^^^ global modifier applies to entire directive
```

Global modifiers can be:
1. **Unique modifiers** — specific to that data attribute's behavior (**none supported yet**)
2. **Trigger modifiers** — shared by all triggers (including default trigger), but can be overridden at trigger level
   - Example: `data-sub__debounce.300:result@signal1@signal2="..."`
     - Both `@signal1` and `@signal2` inherit 300ms debounce
     - Can override: `@signal1__debounce.100` uses 100ms instead
3. **Target modifiers** — shared by all targets, but can be overridden at target level
   - Example: `data-sub__append:target1:target2@trigger="..."`
     - Both `:target1` and `:target2` use append mode
     - Can override: `:target1__replace` uses replace instead

**Local Modifiers** (on specific targets/triggers):
```html
<div data-sub:target1__once:target2__debounce.100@trigger="value">
                    ^^^^^^              ^^^^^^^^^^^^^^^^ local modifiers
```

Local modifiers apply only to the specific target or trigger they're attached to and override any global modifiers of the same type.

**Examples:**
```html
<!-- Global trigger mod: debounce all triggers -->
<div data-sub__debounce.300:result@input@change="dm.query">
  <!-- Both @input and @change debounced by 300ms -->
</div>

<!-- Override global mod at trigger level -->
<div data-sub__debounce.300:result@input__debounce.100@change="dm.query">
  <!-- @input uses 100ms, @change uses 300ms -->
</div>

<!-- Global target mod: append to all targets -->
<div data-sub__append:log1:log2@trigger="dm.message">
  <!-- Both :log1 and :log2 use append mode -->
</div>

<!-- Mix global and local mods -->
<div data-sub__once:target1:target2__throttle.100@signal="dm.data">
  <!-- :target1 executes once, :target2 throttles at 100ms (once overridden) -->
</div>
```

**Available Modifiers:**
- **Trigger modifiers**: `once`, `debounce.MS`, `throttle.MS`, `prevent`, `immediate`, `notimmediate`, `and.signal`, `notand.signal`, `gt.N`, `lt.N`, `eq.N`, `gte.N`, `lte.N`, `neq.N`, `shape`
- **Target modifiers**: `replace`, `append`, `prepend`, `content` (all local only in current implementation)


### Special Data Attribute Behaviors

#### `data-def` — Signal Definition

Unlike other directives, `data-def` has flexible target and value combinations:

**Syntax:**
```
data-def[__mods][:target1:target2:...]="value"
```

**Note:** `data-def` does **not** support triggers (`@trigger`) — it only supports targets and value.

**Behavior depends on targets and value presence:**

1. **Value present, no targets** — Define signals from object fields:
   ```html
   <div data-def="{counter: 0, user: {name: 'John'}}">
   <!-- Creates dm.counter = 0 and dm.user = {name: 'John'} -->
   ```
   - **Requirement**: Value must evaluate to an object (not a number, array, string, etc.)
   - **Error**: `data-def="42"` or `data-def="[1,2,3]"` is invalid
   - Each object field becomes a signal in the global `dm` store

2. **Value present, targets present** — Set evaluated value to all targets:
   ```html
   <div data-def:counter:total="42">
   <!-- Sets dm.counter = 42 and dm.total = 42 -->
   
   <div data-def:user="{ name: 'Jane', age: 30 }">
   <!-- Sets dm.user = { name: 'Jane', age: 30 } -->
   ```
   - The evaluated JavaScript result is assigned to each listed target signal
   - All targets receive the same value

3. **No value, targets present** — Set all targets to `null`:
   ```html
   <div data-def:counter:user:items>
   <!-- Sets dm.counter = null, dm.user = null, dm.items = null -->
   ```
   - Useful for declaring signals without initial values
   - Explicitly initializes signals as `null`

**Targets:**
- `data-def` may contain **0 or more targets** (`:target1:target2:...`)
- No triggers or other primitives are supported

**Examples:**
```html
<!-- Define multiple signals from object -->
<div data-def="{
  counter: 0,
  user: {name: 'John', email: 'john@example.com'},
  items: []
}">
</div>

<!-- Set same value to multiple signals -->
<div data-def:loading:busy:processing="false">
</div>

<!-- Null initialization -->
<div data-def:data:error:response>
</div>

<!-- Computed value assigned to target -->
<div data-def:total="dm.price * dm.quantity">
</div>

<!-- Complex expression with multiple targets -->
<div data-def:x:y:z="dm.items.length">
</div>
```

#### `data-sub` — Subscribe and Update

The `data-sub` directive updates targets reactively based on triggers and always requires a value.

**Syntax:**
```
data-sub[__mods][:target1:target2:...][@trigger1@trigger2@...]="value"
```

**Components:**
- **Targets**: 0 or many (`:target1:target2:...`)
- **Triggers**: 0 or many (`@trigger1@trigger2@...`) — only **signals** and **events** (not props)
  - Context determines event vs signal: `.click` is event, `userName` is signal
- **Value**: **Required** — JavaScript expression to evaluate

**Behavior:**

1. **No triggers present** — Immediate evaluation:
   ```html
   <div data-sub:result="dm.count * 2">
   <!-- Evaluates once immediately, sets dm.result -->
   ```
   - Value evaluated immediately on initialization
   - Result set to all present targets

2. **No targets present** — Side effects only:
   ```html
   <div data-sub@userName="console.log('User:', dm.userName)">
   <!-- Logs to console whenever dm.userName changes, no target updated -->
   ```
   - Value evaluated for side effects (logging, external API calls, etc.)
   - No signal or property updates

3. **Both targets and triggers present** — Reactive updates:
   ```html
   <div data-sub:greeting@userName="'Hello, ' + dm.userName">
   <!-- Updates dm.greeting whenever dm.userName changes -->
   ```
   - Value evaluated when:
     - Any trigger fires (signal change or event)
     - Any trigger has `__immediate` modifier (and optional guard modifiers return true)
   - Evaluated result is set to all present targets

**Examples:**
```html
<!-- Multiple targets, single trigger -->
<div data-sub:display:log@count="'Count: ' + dm.count">
<!-- Both dm.display and dm.log updated when dm.count changes -->
</div>

<!-- Multiple triggers, single target -->
<div data-sub:full-name@first-name@last-name="
  `${dm.firstName} ${dm.lastName}`
">
<!-- dm.fullName updates when either dm.firstName or dm.lastName changes -->
</div>

<!-- Event trigger -->
<button data-sub:timestamp@.click="Date.now()">
<!-- dm.timestamp updated on each click -->
</button>

<!-- Side effects with trigger, no targets -->
<div data-sub@error="
  if (dm.error) {
    console.error('Error occurred:', dm.error);
    alert('Something went wrong!');
  }
">
</div>

<!-- Immediate evaluation with guard -->
<div data-sub:result@value__immediate__gt.0="dm.value * 2">
<!-- Evaluates immediately only if dm.value > 0 -->
</div>

<!-- Combining element targets and signal targets -->
<div data-sub:.textContent:status@count="
  dm.count > 10 ? 'High' : 'Low'
">
<!-- Updates element's textContent AND dm.status signal -->
</div>
```

**Note:** The value expression is **always required** in `data-sub`, unlike `data-def` where it's optional.

#### `data-sync` — Simplified Synchronization

The `data-sync` directive is a simplified version of `data-sub` for reactive synchronization between signals and properties. It always involves **two actors**: either both as targets (2-way sync), or one as trigger and one as target (1-way sync). **No value is allowed** — the target is set to the value of the triggered signal or property.

**Syntax:**
```
data-sync[__mods]:target1:target2             <!-- 2-way sync -->
data-sync[__mods]:target@trigger              <!-- 1-way sync -->
data-sync[__mods]@trigger                      <!-- 1-way sync -->
```

**Components:**
- **Targets**: 0, 1, or 2 — signals or props (e.g., `:userName`, `:.value`)
- **Trigger**: 0 or 1 — signal or prop (e.g., `@userName`, `@.value`)
- **Value**: **Not supported** — target receives the trigger's value directly

**Key Rule:**
If `data-sync` has exactly **1 trigger OR 1 target**, the other actor is **always the default target property** `:.` of the element where `data-sync` is defined.

**Modes:**

1. **Two-way sync** (2 targets, no trigger):
   ```html
   <input data-sync:user-name:.value>
   <!-- Signal dm.userName ↔ element's value property -->
   <!-- Changes in either update the other -->
   ```
   - Two targets specified: `:signal:prop` or `:signal1:signal2`
   - No trigger — both actors sync bidirectionally

2. **One-way sync** (1 target + 1 trigger):
   ```html
   <span data-sync:.textContent@userName>
   <!-- Signal dm.userName → element's textContent -->
   <!-- Target receives the value of dm.userName -->
   ```
   - Trigger value flows to target
   - Explicit target and trigger specified

3. **One-way sync with implicit default target** (1 trigger only):
   ```html
   <input data-sync@userName>
   <!-- Equivalent to: data-sync:.@userName -->
   <!-- Signal dm.userName → element's default property (.value for input) -->
   ```
   - Only trigger specified
   - Other actor is implicitly `:.` (default target property)

4. **One-way sync with implicit default target** (1 target only):
   ```html
   <input data-sync:userName>
   <!-- Equivalent to: data-sync:userName@. -->
   <!-- Element's default property (.value) → signal dm.userName -->
   ```
   - Only target specified
   - Other actor is implicitly `:.` (default target property as trigger)

**Examples:**
```html
<!-- 2-way: signal ↔ input value -->
<input data-sync:user-name:.value>

<!-- 1-way: signal → input (implicit :.) -->
<input data-sync@user-name>

<!-- 1-way: input → signal (implicit @.) -->
<input data-sync:user-name>

<!-- 1-way: signal → span textContent -->
<span data-sync:.textContent@display-name></span>

<!-- 1-way: signal → default prop (implicit :.) -->
<span data-sync@display-name></span>
```

**Key Simplification:**
`data-sync` always operates on exactly **two actors**, and when only 1 trigger or target is specified, the other is always the element's default target property `:.`. Unlike `data-sub`, no value expression is supported — targets receive trigger values directly.

**Comparison with data-sub:**
- `data-sync` is sugar for simple signal ↔ property synchronization (no value expression)
- `data-sub` is more flexible (multiple targets/triggers, side effects, events, computed values)
- Use `data-sync` for straightforward 1:1 bindings, `data-sub` for complex logic or transformations

#### `data-class` — Conditional CSS Classes

The `data-class` directive adds or removes CSS classes on the element reactively based on trigger values interpreted as booleans. **No value is allowed** — classes are toggled based on trigger truthiness.

**Syntax (Current):**
```
data-class[__mods]:.className:.-invertedClassName:...@trigger1@trigger2@...
```

**Components:**
- **Targets**: 1 or many — class names with `.` prefix (e.g., `:.active`, `:.-inactive`)
- **Triggers**: 1 or many — signals or props (e.g., `@is-loading`, `@.checked`)
- **Value**: **Not supported** — classes toggle based on trigger boolean values

**Current Class Notation:**
- **`.className`** — Add class when trigger is **true**, remove when **false**
- **`.-className`** — Remove class when trigger is **true**, add when **false** (inverted)

**Trigger Inversion:**
- **`@!trigger`** — Inverts the trigger's boolean interpretation
- Example: `@!isLoading` treats `false` as `true` and vice versa

**Behavior:**
When a trigger fires:
1. Trigger value is interpreted as boolean
2. For `.className` targets: add class if true, remove if false
3. For `.-className` targets: remove class if true, add if false (inverted behavior)
4. Multiple triggers: each trigger can affect all classes independently

**Examples (Current Syntax):**
```html
<!-- Add .inactive when dm.isLoading is true, remove when false -->
<div data-class:.inactive@isLoading>

<!-- Remove .active when dm.isLoading is true, add when false -->
<div data-class:.-active@isLoading>

<!-- Multiple classes with different behaviors -->
<div data-class:.inactive:.-active@is-loading>
<!-- When isLoading = true: add .inactive, remove .active -->
<!-- When isLoading = false: remove .inactive, add .active -->
</div>

<!-- Inverted trigger -->
<div data-class:.ready@!is-loading>
<!-- When isLoading = false: add .ready -->
<!-- When isLoading = true: remove .ready -->
</div>

<!-- Multiple triggers -->
<div data-class:.highlight@is-active@is-focused>
<!-- Add .highlight when either dm.isActive or dm.isFocused is true -->
</div>

<!-- Property trigger -->
<input data-class:.checked@.checked>
<!-- Add .checked class when input's checked property is true -->
</input>
```

**Known Issue:**
The current `.` and `-.` notation conflicts with the parser because `.` and `-` can be part of signal names (e.g., `user-name`, `item.count`).

**Future Syntax (Planned):**
```
data-class[__mods]:+className:~invertedClassName@trigger
```
- **`+className`** — Add class when trigger is true (replaces `.className`)
- **`~className`** — Remove class when trigger is true (replaces `.-className`)

**Future Examples:**
```html
<!-- Add/remove with clearer syntax -->
<div data-class:+inactive:~active@is-loading>

<!-- No ambiguity with signal names -->
<div data-class:+highlight@user-active>
```

#### `data-disp` — Conditional Visibility

The `data-disp` directive shows or hides an element by toggling its `display` CSS property based on trigger values interpreted as booleans. The directive has an implicit target (always the element itself, `:.`).

**Syntax:**
```
data-disp[__mods]:.@trigger1@trigger2@...="value"
data-disp[__mods]@trigger1@trigger2@...="value"     <!-- Implicit :. target -->
```

**Components:**
- **Target**: Always `:.` (the element itself, can be implicit)
- **Triggers**: 1 or many — signals or props (e.g., `@is-visible`, `@.checked`)
- **Value**: **Required** — JavaScript expression evaluated as boolean to determine visibility

**Behavior:**
1. When trigger fires, the value expression is evaluated
2. If result is truthy: element is shown (display set to original/default value)
3. If result is falsy: element is hidden (`display: none`)
4. The original `display` value is preserved and restored when showing

**Display Preservation:**
- Caches the element's original display value (from inline style or computed style)
- When showing: restores the cached display value
- When hiding: sets `display: none`
- Handles both inline styles and CSS-defined display values

**Examples:**
```html
<!-- Show element when signal is true -->
<p data-disp:.@is-active="dm.isActive">
  Visible when active
</p>

<!-- Implicit :. target -->
<p data-disp@is-active="dm.isActive">
  Visible when active
</p>

<!-- Negated condition -->
<p data-disp:.@is-active="!dm.isActive">
  Visible only when NOT active
</p>

<!-- Complex expression -->
<div data-disp@count@threshold="dm.count > dm.threshold">
  Shows when count exceeds threshold
</div>

<!-- Property trigger -->
<div data-disp@.checked="el.checked">
  Visible when checkbox is checked
</div>

<!-- Multiple triggers with logic -->
<span data-disp@user@is-logged-in="dm.user && dm.isLoggedIn">
  Visible when user exists AND logged in
</span>

<!-- Conditional visibility with signal path -->
<p data-disp@user.ui.is-active="dm.user.ui.isActive">
  Visible based on nested signal
</p>
```

**Common Patterns:**
```html
<!-- Loading spinner -->
<div data-disp@loading="dm.loading">Loading...</div>

<!-- Error message -->
<div data-disp@error="dm.error !== null">Error: <span data-sub:.@error="dm.error"></span></div>

<!-- Empty state -->
<div data-disp@items="!dm.items || dm.items.length === 0">
  No items to display
</div>

<!-- Conditional sections -->
<section data-disp@is-premium="dm.isPremium">
  Premium content
</section>
```

**Note:** Unlike `data-class` which can have multiple class targets, `data-disp` always operates on a single implicit target (the element itself), making the `:.` prefix optional in the syntax.

#### `data-dump` — List and Template Rendering

The `data-dump` directive renders a template for each item in an array or once for an object value. It subscribes to signal changes and efficiently updates the DOM by adding/removing clones as needed.

**Syntax:**
```
data-dump[__mods]@signal#template-id         <!-- External template -->
data-dump[__mods]@signal                     <!-- Inline template (child) -->
```

**Components:**
- **Target**: **Not supported** — always uses `innerHTML` of the element where `data-dump` is defined
- **Trigger**: 1 signal — the data source to iterate (e.g., `@posts`, `@user.items`)
  - **Note**: `@` has special meaning in `data-dump` — it's the **data source**, not a reactive trigger
- **Element**: `#template-id` (external template) or inline `<template>` child
- **Value**: **Not supported** — data comes from the trigger signal

**Template Sources:**
1. **External template** (by ID): `data-dump@posts#tpl-post`
   - References a `<template id="tpl-post">` elsewhere in the document
2. **Inline template** (child): `data-dump@posts`
   - Uses a `<template>` element as direct child of the element
   - Template is automatically removed from DOM after extraction

**Behavior:**

1. **Rendering target**: Always uses the `innerHTML` of the element where `data-dump` is defined
   - Clones are appended directly to the element's content
   - No separate target specification needed

2. **Array rendering**: Clones template once per array item
   - Adds clones when array grows
   - Removes clones from end when array shrinks
   - Updates are efficient (only changes needed clones)

3. **Object rendering**: Clones template once for the object value

4. **Placeholder replacement** in cloned templates:
   - **`$index`** → array index (e.g., `0`, `1`, `2`)
   - **`$item`** → signal path to item (e.g., `posts.0`, `posts.1`)
   - Replacements work in both attribute names and values

**Examples:**

```html
<!-- External template -->
<template id="tpl-post">
  <li>
    <span data-sub:.@posts>$index + 1</span>
    <span data-sub:.@posts>dm.posts[$index]</span>
  </li>
</template>
<ul data-dump@posts#tpl-post></ul>

<!-- Inline template -->
<ul data-dump@posts>
  <template>
    <li>
      <span data-sub:.@posts>$index + 1</span>
      <span data-sub:.@posts>dm.posts[$index]</span>
    </li>
  </template>
</ul>

<!-- Nested signal path -->
<ul data-dump@user.items#tpl-item></ul>

<!-- Using placeholders in attributes -->
<template id="tpl-item">
  <li data-index="$index" data-class:.even:.-odd="$index % 2 === 0">
    <span data-sub:.@items>dm.items[$index].name</span>
  </li>
</template>

<!-- Zebra striping with placeholders -->
<template id="tpl-row">
  <tr data-class:.zebra-even:.-zebra-odd="$index % 2 === 0">
    <td data-sub:.@rows>$index + 1</td>
    <td data-sub:.@rows>dm.rows[$index].title</td>
  </tr>
</template>
<table>
  <tbody data-dump@rows#tpl-row></tbody>
</table>

<!-- Nested data-dump -->
<template id="tpl-thread">
  <li>
    Thread: <strong data-sub:.@threads>dm.threads[$index].title</strong>
    <ul data-dump@threads.$index.replies#tpl-reply></ul>
  </li>
</template>
<ul data-dump@threads#tpl-thread></ul>
```

**Placeholder Usage:**
```html
<template>
  <!-- $index in attribute VALUE (replaced in JS expressions) -->
  <li data-sub:.@posts="dm.posts[$index].title">
  
  <!-- $index in attribute NAME (replaced literally) -->
  <li data-index="$index">
  
  <!-- $item in attribute VALUE (replaced with signal path) -->
  <span data-sub:.@posts="$item.name">
  <!-- After replacement becomes: dm.posts[0].name -->
</template>
```

**Shape Change Tracking:**
```html
<!-- React only when array keys change (items added/removed), not value changes -->
<ul data-dump@posts__shape#tpl-post></ul>

<!-- Access change details in template via detail.change -->
<template id="tpl-post">
  <li data-sub:.@posts__shape="
    console.log('Added:', detail.change.added);
    console.log('Removed:', detail.change.removed);
    return dm.posts[$index];
  "></li>
</template>
```

**Key Features:**
- **Efficient updates**: Only adds/removes clones as needed, doesn't re-render entire list
- **Automatic cleanup**: Removed clones are properly disposed
- **Nested rendering**: Templates can contain nested `data-dump` directives
- **Context preservation**: Each clone maintains its own `$index` context
- **Flexible templates**: External or inline, reusable or specific

**Note:** The `@` symbol has a special semantic meaning in `data-dump` — it denotes the **data source** (where data comes from), not a reactive trigger (when to update). This is the main syntactic exception in dmax's otherwise unified grammar.

#### `data-debug` — Global State Inspector

The `data-debug` directive displays all signals in the global store as a live JSON object. It automatically subscribes to every signal change and updates the element's content whenever any signal is modified.

**Syntax:**
```
data-debug
```

**Components:**
- No targets, triggers, or value — just the attribute name
- Completely standalone directive

**Behavior:**
1. Subscribes to **all signal changes** globally
2. On any signal update, serializes the entire signal store (`S`) to JSON
3. Updates the element's `textContent` with pretty-printed JSON (2-space indentation)
4. Shows all signals with their current values in real-time

**Usage:**
```html
<!-- Display all signals in a <pre> element -->
<pre data-debug></pre>

<!-- Can use any element -->
<div data-debug></div>
<code data-debug></code>
```

**Example Output:**
```json
{
  "count": 5,
  "userName": "Alice",
  "items": [
    "item1",
    "item2"
  ],
  "user": {
    "name": "Bob",
    "email": "bob@example.com"
  },
  "isActive": true
}
```

**Common Use Cases:**
```html
<!-- Development debugging panel -->
<details>
  <summary>Debug: Signal Store</summary>
  <pre data-debug style="font-size: 12px;"></pre>
</details>

<!-- Floating debug panel -->
<div style="position: fixed; top: 0; right: 0; max-width: 300px; 
            max-height: 400px; overflow: auto; background: #f5f5f5; 
            padding: 10px; font-family: monospace; font-size: 11px;">
  <strong>Signals:</strong>
  <pre data-debug></pre>
</div>

<!-- Simple inline debug -->
<pre data-debug style="background: #eee; padding: 10px;"></pre>
```

**Notes:**
- **Performance**: Updates on every signal change — use only during development
- **Display**: Best used with `<pre>` or monospace font for readable JSON
- **No configuration**: Cannot filter or customize which signals are shown
- **Read-only**: Only displays state, doesn't allow editing
- **Global scope**: Always shows the entire signal store, not a subset

**Tip:** Remove or comment out `data-debug` elements in production builds to avoid unnecessary updates.
