# Requirements

## Perf instructions

Approach the solution as a performance engineer who know how V8 works, how js ds are layed in memory, s
who know cost of gc, closures and objects, who knows that inlining is the great technique, who know data oriented and array programming, who knows what use and to use from the standard lib in hot path.

Balance performance and code size. 
Example 1: having a single global (compiled) regexp to parse most of the attribute name may be better instead of writing the char-by-char parser in 50locs, even if it slightly faster.

Example 2: using indexof may be faste the loop over string and compare because internally it is heavy optimized with simd and such. But using forEach or includes with lambda is not good on smalm arrays because of the lambda alloc cost. 


## data-def (sign)

data-def:foo-signal='0'

data-def:bars='[]'

data-def:baz.bor.boo   has a null value

same as
data-def='{"foo": 0, "bars":[], "baz":{"bor":{"boo": null}}}'


## data-sub

 data-sub(:(signal|#.prop))*((@(signal|#.event))(__mod(.val)?)*)*='js exp'

- ':signal' - zero, one or many signals; represents target for the right js expr assignment; example for-bar.baz

- ':#.prop' zero, one, or many element props; represents target for the right js exp: example :#.value for the element where data-sub is defined, :#some-el-id.style.color is nested prop on the elem with id #some-elem, :# is the default target prop of the el where data-sub defined, eg value, checked, selectedOptions, textContent, :#my-input the default prop of the elem with id #my-elem

- if zero targets is specified then the js expr will be evaluated for its side effect data-sub#='alert(1)' raises alert each time the default prop of the defined el changes, data-sub@foo='bar.baz = 3' - changes bar.baz on the foo change.

- @signal - zero, one or many subscriptions/triggers on the signal change; data-set@foo@bar.baz

- @#.event - zero, one or many html events; example @#.click for the el where data-sub is defined, @#elem-id.mouseover is the event of @#elem-id; @# is the default event of the el: input, change. If triggered then not not null event is available in js expr; @#window.event and @#document.event for window and document events respectively. There are also two sintetic events without elem: interval and delay

- if no event or signal trigger is specified then js exp is evaluated once on element and its result assigned to all target, if no targets then exp id evaluated for its sideeffects, example data-sub='console.log(42)' - side effect, data-sub:#='42' - assign '42' default el prop; data-sub:#my-input:foo:#.style.width='42' - assign '42' to #my-input default prop, also to foo signal, also to current elem style.width.

- triggers mods are __immediate (default for @signal), __notimmediate (default for @#.),

__once, __debounce.numOfMs, __throttle.numOfMs,

__prevent (for preventing default behavior)

### Parser Notes

- : denotes start of target (signal or prop)

-- if next char is # then it is prop otherwise signal

--- if signal, read untill : or @ the name of the signal. Signal may be nested, so each . will denote of the signal name in the nested chain. Signal name cannot be empty -> error.

--- if prop, then read until . or : or @ the id of prop elem. If its empty then it is current element, otherwise it is id of element. If we read . then read the prop name until the : or @. Property name can be nested (style.color) each new . denote the end of the prop in the nested chain.

If we do not read the . after elem name and found : or @ instead, then the property is default for this element. The case with empty elem and no prop is valid @# and denotes current element with default prop.

- similar @ denotes start of trigger (signal or event). Property cannot be a trigger, the found name we consider an event -> error if not found.

-- if the next char is # it is event otherwise a signal

--- if it is signal we read its name until __ or : or @. The name can be nested chain delim by . If the name ends on __ next we read a mod name and possible value after the dot. We read the mod (collecting its name and value) until next mod __ or : or @.

--- if it is event read its element id until __ or . or : or @ The id may be empty (curr elem), maybe window or document, othrwise an id of the elem. If we found . then read event name (may be chained with .) untill __ or : or @. Event name may empty (but not for window or document -> error) meaning the default event. If the next was __ then read the mods as above the same as mods for signals. The empty id and event is valid @# meaning default event of the curr elem.

## data-sync

A sugar consisting of 0, 1 or 2 targets with the same grammar as in data-sub for targets but with optional mods from triggers (because those are targets and triggers at the same time)

- 2 targets may be signals or props means that target is writable and the other target changed (signal changed or prop elem default event raised) then the first target (signal or prop) will be set to the value of the first, and vice versa. If that target is not writable then it won't be set (the update should be ignored). Infinite loop of updates should be prevented by comparing that value is not changed and preventing update).

- If one the targets is signal, then the should be updated immediatly when the elem with data-sync loaded (unless __noimmediate is specified).

- If single target is specified, this means the second target will be default prop/default event of the current element.

- No targets is the valid case if the curr element has a name attr, then this nsme will be used for signal.


## data-class

data-class.green-button.green-check.-gray-button@is-done@#el-id.load

where:
.class-to-add

.-class-to-remove

@is-done is signal trigger

@#el-id.load event trigger


data-class.foo.bar@baz='baz + boo.fix > 42'

where exp value interpeted as boolean


data-class.greeting@foo__5

data-class.showtime@cool-factor__notimmediate__gt.42__and.baz.boo.bee


## data-disp

data-disp@is-foo

data-disp@!is-complete@in-flight

data-disp#cool-elem@is-cool.for-sure

basically the same as data-class but instead of adding or removing classes it hides or displays the element


## data-iter

data-iter:posts$post$i.pid#p-tpl@some-additionsl-signal-not-only-posts@#.click

where #p-tpl is template tag, example

```
<template p-tpl>
  <li>post <span data-$pid/>: <p data-$post></p> </li>
</template>
```

where default bindings for item and idx are it and i, eg data-$it and data-$i

@TBD key for reconciliation eg $key.post.key


## data-get

### Examples

data-get:foo@#.click='`url?${el.value}`'
same as data-get:foo=...

data-get:#.value@#='url'
same as data-get@#='url'
same as data-get='url'

data-post:bar.baz+p-id__uri+#pelem.value?is-p-fetching?p-fetch-code__code@mouseover__delay.300__and.is-foo^.json=
where:
: target signal for post response json with mods: merge, replace, append, prepend (last 2 for arrays))
+ req input params with mods: uri( default for get and delete), body (default for post, put, patch)
? is action state targets with mods: busy (default), done, ok, err, code, all (object containing all)
^ control options signal object { headers: {}, retry: {}, cancel: {}, etc. @TBD}, or a special names started with . : usual values of content-type header like json, js, html, sse; cache-control no-cash value (default for sse) .no-cache, etc. TBD
@ action triggers: signal or event with more interedting mods: and.boolean-signal-name,

data-put...

data-patch...

data-delete...



## Improvement Plan

### Grammar Gaps & Inconsistencies

**Critical Issues:**
1. **Incomplete specs marked @TBD**:
   - data-iter: `$key` reconciliation strategy for list updates
   - data-get/post/put/patch/delete: retry/cancel/timeout options in control signal (headers, retry count, timeout, cancellation)
   - Event trigger mods: full list of conditional modifiers (and.signal, or.signal, eq.value, gt.value, etc.)
2. **Missing error handling**:
   - Invalid signal names (empty, invalid chars)
   - Circular dependencies beyond data-sync
   - Malformed expressions in JS evaluation
   - Network errors in HTTP actions
   - Missing elements (invalid #id references)
3. **Missing validation rules**:
   - Signal/property/event name format: **kebab-case or snake_case only** (camelCase prohibited - DOM lowercases attributes)
   - Valid characters: `a-z`, `0-9`, `-` (kebab), `_` (snake), `.` (nesting separator)
   - Modifier prefix `__` (double underscore) distinguishes from snake_case names (e.g., `my_signal` vs `__debounce`)
   - Max nesting depth for nested properties/signals
   - Reserved keywords (window, document, etc.)
   - Element ID format requirements

**Semantic Gaps:**
1. **data-sync**: Behavior when both targets are props and both emit events simultaneously?
2. **data-iter**: What happens on partial array updates (push/pop/splice)? Full re-render or diff?
3. **data-class/data-disp**: Can multiple triggers exist? How are they combined (AND/OR)?
4. **All directives**: Lifecycle - when are subscriptions set up/torn down?
5. **Memory**: When are signals/subscriptions garbage collected?

### Grammar Unification


**Unified and Special Names Syntax Proposal:**

#### 1. Default property/event of current element
- `:.` → default property of current element (was `:#`)
- `@.` → default event of current element (was `@#`)

#### 2. Property/event of current element
- `:.value` → property of current element (was `:#.value`)
- `@.click` → event of current element (was `@#.click`)

#### 3. Element by ID
- `:#id` → default property of element by id
- `:#id.value` → property of element by id
- `@#id` → default event of element by id
- `@#id.click` → event of element by id

#### 4. Special names (window, document, form, etc.)
- Use `!x` prefix for special elements:
  - `!w` = window, `!d` = document, `!f` = form
- Examples:
  - `@!w.click` → window click event (was `@#window.click`)
  - `@!d.visibilitychange` → document event
  - `@!f.submit` → form submit event
  - `:.!f.value` → form value property

#### 5. Signal
- `:signal` → signal reference
- `@signal` → signal trigger

#### 6. Summary Table

| Reference Type         | Old Syntax      | New Syntax Proposal   |
|----------------------- |----------------|----------------------|
| Current element prop   | `:#.value`     | `:.value`            |
| Current element default| `:#`           | `:.`                 |
| Element by ID prop     | `:#id.value`   | `:#id.value`         |
| Element by ID default  | `:#id`         | `:#id`               |
| Current element event  | `@#.click`     | `@.click`            |
| Current element default| `@#`           | `@.`                 |
| Element by ID event    | `@#id.click`   | `@#id.click`         |
| Special: window        | `@#window.evt` | `@!w.evt`            |
| Special: document      | `@#document.evt`| `@!d.evt`           |
| Special: form          | `@#form.submit`| `@!f.submit`         |

#### 7. Grammar structure
```
:signal.nested.path      → signal reference
:.                      → current element default property
:.prop.path             → current element property
:#elem-id               → element default property
:#elem-id.prop.path     → element property path
:.!x.prop               → special element property (e.g., form)

@signal.nested.path     → signal trigger
@.                      → current element default event
@.event                 → current element event
@#elem-id               → element default event
@#elem-id.event         → element event
@!x.event               → special element event (e.g., window, document, form)
```

**Benefits:**
- Cleaner and shorter for current element
- `!x` prefix for special names is visually distinct and avoids collision with IDs/signals
- Still unambiguous and easy to parse

**Recommendation:** ✅ **Adopt this unified syntax** for clarity, brevity, and extensibility.

---

**Core Grammar Components (Reusable across all directives):**

```
// Shared tokenizer components
<target>     := <sig-target> | <prop-target>
<sig-target> := ':' <sig-path>
<prop-target>:= ':' (('.' <prop-path>) | ('#' <elem-ref> ('.' <prop-path>)?) | ('!x' ('.' <prop-path>)?))
<trigger>    := <sig-trigger> | <event-trigger>
<sig-trigger>:= '@' <sig-path> <mods>?
<event-trigger>:= '@' (('.' <event-path>) | ('#' <elem-ref> ('.' <event-path>)?) | ('!x' ('.' <event-path>)?)) <mods>?
<mods>       := ('__' <mod-name> ('.' <mod-value>)?)+
<sig-path>   := <ident> ('.' <ident>)*
<prop-path>  := <ident> ('.' <ident>)*
<event-path> := <ident> ('.' <ident>)*
<elem-ref>   := '' | 'window' | 'document' | <elem-id>
<ident>      := [a-z][a-z0-9_-]*        // kebab-case or snake_case only (DOM lowercases)
<elem-id>    := <ident>

// Note: __ (double underscore) prefix for modifiers distinguishes from snake_case names
// Example: my_signal (valid name) vs __debounce (modifier)
// 
// Naming in JS expressions: kebab-case is auto-converted to camelCase
// Example: :my-signal in attribute → mySignal in JS expression
//          :user-name in attribute → userName in JS expression
//          :my_var (snake_case) → my_var (unchanged in JS)
```

**Directive-Specific Composition:**
- `data-def`: JSON-like or shorthand key-value pairs
- `data-sub`: `<target>* <trigger>* = <js-expr>`
- `data-sync`: `<target>{1,2} <mods>?`
- `data-class`: `('.' <class>)+ <trigger>+ (<js-expr>)?`
- `data-disp`: `<trigger>+ (<js-expr>)?`
- `data-iter`: `<sig-target> '$' <item-var> ('$' <idx-var>)? ('.' <key-expr>)? '#' <tpl-id> <trigger>*`
- `data-{get|post|put|patch|delete}`: `:target? (+param)* (?state)* (^option)* <trigger>* = <url-expr>`
  - Uses special prefixes to avoid ambiguity: `+` (input), `?` (state), `^` (options)
  - Example: `data-post:result+user-id+.form-data?is-loading?error^.json@.submit__prevent='api/users'`

### Parsing Strategy (Performance-Focused)

**Phase 1: Attribute Collection (Single DOM Pass)**
```javascript
// One querySelectorAll for all data-* attrs
// Compiled regex: /^data-(def|sub|sync|class|disp|iter|get|post|put|patch|delete)/
// ~50 bytes, executed once per attr scan
const dataAttrs = collectDataAttributes(root); // {element, attrName, attrValue}[]
```

**Phase 2: Tokenization (Shared Tokenizer)**
```javascript
// Single lexer for all directives, ~150 LOC
// Uses indexOf/charAt for optimal V8 performance
// Outputs flat token array: [{type, value, pos}, ...]
// Memory-efficient: tokens are primitives or small objects
function* tokenize(input) {
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ':') {
      // Lookahead: if next is '#' then PROP_TARGET, else SIG_TARGET
      yield {type: input[i+1] === '#' ? 'PROP_TARGET' : 'SIG_TARGET', pos: i++};
    } else if (ch === '@') {
      // Lookahead: if next is '#' then EVENT_TRIGGER, else SIG_TRIGGER
      yield {type: input[i+1] === '#' ? 'EVENT_TRIGGER' : 'SIG_TRIGGER', pos: i++};
    } else if (ch === '+') yield {type: 'PARAM', pos: i++};
    else if (ch === '?') yield {type: 'STATE', pos: i++};
    else if (ch === '^') yield {type: 'OPTION', pos: i++};
    // ... single switch, no closures, inline-friendly
  }
}
```

**Phase 3: Directive-Specific Parsing (Small Specialized Parsers)**
```javascript
// Each directive has ~30-50 LOC parser
// Consumes token stream, builds directive object
// No AST, direct to execution plan
// Example:
parseDataSub(tokens) {
  const targets = [], triggers = [];
  while (token.type === 'TARGET') targets.push(parseTarget(tokens));
  while (token.type === 'TRIGGER') triggers.push(parseTrigger(tokens));
  const expr = parseExpression(tokens);
  return {type: 'sub', targets, triggers, expr};
}
```

**Phase 4: Dependency Graph Construction**
```javascript
// Flat array-based graph for cache locality
// Uses Int32Array for signal IDs (no object indirection)
// Topological sort for update batching
// ~100 LOC, data-oriented
const graph = {
  signals: new Map(), // signalPath -> signalId
  deps: new Int32Array(maxSignals * avgDeps), // flat adjacency list
  offsets: new Int32Array(maxSignals), // index into deps array
};
```

**Phase 5: Runtime Setup (Event Delegation + Signal System)**
```javascript
// Single event listener on document for all @#.events
// Signal change batching with microtask queue
// Effect cleanup tracking with WeakMap (auto-GC)
// ~200 LOC total runtime
```

**Total Parser Size Estimate:** ~600-800 LOC (compact, no libraries)
**Parse Time Estimate:** <1ms for 100 directives (V8 optimized path)
**Memory Overhead:** ~50 bytes per directive + ~20 bytes per signal subscription

### Implementation Priorities

**Phase 1: Core (Week 1-2)**
- [ ] Shared tokenizer implementation
- [ ] Signal system with dependency tracking
- [ ] Kebab-case to camelCase conversion for JS expression scope
- [ ] data-def parser and signal initialization
- [ ] data-sub parser and reactive expression evaluation
- [ ] Basic event delegation for @#.events

**Phase 2: Two-way Binding (Week 2-3)**
- [ ] data-sync parser
- [ ] Circular update prevention
- [ ] Default property detection (input.value, etc.)

**Phase 3: Display Control (Week 3)**
- [ ] data-class parser and implementation
- [ ] data-disp parser and implementation
- [ ] Boolean expression evaluation

**Phase 4: Iteration (Week 4)**
- [ ] data-iter parser
- [ ] Template cloning and scoped signal binding
- [ ] Array diff algorithm for reconciliation
- [ ] Key-based reconciliation

**Phase 5: HTTP Actions (Week 5)**
- [ ] data-get/post/put/patch/delete parsers (using +param ?state ^option prefixes)
- [ ] Fetch wrapper with state management
- [ ] Request cancellation and retry logic
- [ ] Response format handlers (json, text, blob, stream)

**Phase 6: Optimization (Week 6)**
- [ ] Batched DOM updates with requestAnimationFrame
- [ ] Expression compilation caching
- [ ] DevTools integration for debugging
- [ ] Performance benchmarking suite

### Feature Enhancements

**Developer Experience:**
1. **Error reporting**: Line/column numbers in attribute parsing errors
2. **DevTools panel**: Visualize signal graph, track updates, inspect subscriptions
3. **Type safety**: Optional TypeScript definitions for signal schemas
4. **Validation mode**: Runtime checks for common mistakes (disabled in production)

**Advanced Features:**
1. **data-memo**: Computed signals with automatic caching
2. **data-batch**: Group multiple updates into single transaction
3. **data-portal**: Teleport elements (like React Portals)
4. **data-lazy**: Code-split component loading with data-iter
5. **data-transition**: Declarative animations for data-class/disp changes

**Performance Features:**
1. **Signal slicing**: Subscribe to nested path without triggering on parent changes
2. **Batch updates**: Coalesce multiple signal changes in same microtask
3. **Lazy evaluation**: Don't recompute expressions until DOM read
4. **Worker support**: Offload data-get/post to Web Workers for heavy JSON parsing

### Testing Strategy

**Unit Tests:**
- Tokenizer: All grammar combinations, edge cases (empty strings, special chars)
- Parsers: Valid/invalid syntax, error messages
- Signal system: Dependency propagation, circular detection, GC behavior
- Expression evaluation: Scope, error handling, async support

**Integration Tests:**
- End-to-end: All directives working together
- Real-world scenarios: Forms, lists, conditional rendering, HTTP flows
- Performance: Parse 1000 directives <10ms, update 1000 signals <16ms (60fps)

**Compatibility Tests:**
- Browsers: Chrome, Firefox, Safari, Edge (last 2 versions)
- Frameworks: Works with Web Components, plays nice with React/Vue on same page
