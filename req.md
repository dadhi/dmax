# Requirements

## Perf instructions

Approach the solution as a performance engineer who knows how V8 works, how js ds are layed in memory,
who knows cost of gc, closures and objects, who knows that inlining is the great technique, who know data oriented and array programming, who knows what use and to use from the standard lib in hot path.

Balance performance and code size.

Example 1: having a single global (compiled) regexp to parse most of the attribute name may be better instead of writing the char-by-char parser in 50locs, even if it slightly faster. But only if regexp is working, if we need 2, 3, 5 regexps then no.

Example 2: using indexof may be faster the loop over string and compare because internally it is heavy optimized with simd and such. But using forEach or includes with lambda is not good on smalm arrays because of the lambda alloc cost. 


## data-def (sign)

data-def:foo-signal='0'

data-def:bars='[]'

data-def:baz.bor.boo   has a null value

same as
data-def='{"foo": 0, "bars":[], "baz":{"bor":{"boo": null}}}'


## data-sub

 data-sub(:(signal|:.prop|:#id.prop))*((@(signal|@.event|@#id.event|@_window.event))(__mod(.val)?)*)*='js exp'

 - `:signal` - zero, one or many signals; represents target for the right-hand JS expression assignment (e.g. `:user`, `:user.name`).

 - `:.prop` zero, one, or many element properties on the current element; represents target for the right-hand expression: example `:.value` for the current element's value, `:.style.color` for current element style properties. Use `:.` as the current-element default prop.

 - `:#id.prop` zero, one, or many element props by id; example `:#some-el-id.style.color` refers to the nested property on the element with id `some-el-id`. `:#id` is the default prop of the element with that id.

 - If zero targets are specified then the JS expression will be evaluated for its side effect. Example: `data-sub:.='console.log(1)'` evaluates on the current element's default event, `data-sub@user='foo.bar = 3'` runs on `user` signal change.

 - `@signal` - zero, one or many subscriptions/triggers on signal changes (e.g. `@count`, `@user.name`).

 - `@.event` - zero, one or many DOM events on the current element (e.g. `@.click`, `@.input`).
   - `@#id.event` targets an element by id's event (e.g. `@#btn.click`).
  - Special/global/document events use the `_` prefix: `@_window.resize` (window), `@_document.visibilitychange` (document).
  - Synthetic timing triggers are supported via `@_interval.ms` or `@_delay.ms`.

 - If no event or signal trigger is specified then the JS expression is evaluated once during init and/or when the relevant default event occurs; if no targets are provided the expression is evaluated for side effects only.

 - Compiled expressions receive three helper variables: `el` (the element), `ev` (the triggering Event, if any), and `sg` (the signal path string that triggered the evaluation, if any).

 - Trigger modifiers: `__immediate` (default for `@signal`), `__notimmediate` (default for `@.event`), `__once`, `__debounce.ms`, `__throttle.ms`, `__prevent` (preventDefault).

### Parser Notes (updated tokens)

 - `:` denotes start of a target (signal or prop).

   - If the next char is `.` then it is a property on the current element (e.g. `:.value`).
   - If the next char is `#` then it is an element-by-id reference (e.g. `:#my-id.prop`).
   - Otherwise it's a signal name (e.g. `:user.name`).

 - `@` denotes start of a trigger (signal or event).

   - If followed by `_` then it's a special/global target: `_window`, `_document`, `_form`, `_interval`, `_delay` (e.g. `@_window.resize`).
   - If followed by `.` it's a current-element event (`@.click`).
   - If followed by `#` it's an element-by-id event (`@#btn.click`).
   - Otherwise it's a signal trigger (`@count`).

 - Mods follow a double underscore prefix `__` and may include a dot-delimited value (e.g. `__debounce.200`). Mods can be chained.

 - Attribute-level/global mods: You can place mods directly after the directive name to apply them to all triggers on that attribute. Example: `data-sub__once:.@click` applies `__once` to all triggers inside that attribute.
   - Trigger-level mods override attribute-level mods. Example: `data-sub__once:foo@.click__always` — the `__always` on the trigger will override the attribute-level `__once` for that trigger.
   - A special modifier `__always` is provided to explicitly override a global `__once` and force always-run behavior on a per-trigger basis.
 - Attribute-level/global mods: You can place mods directly after the directive name to apply them to all triggers on that attribute. Example: `data-sub__once:.@click` applies `__once` to all triggers inside that attribute.
   - Trigger-level mods override attribute-level mods. Example: `data-sub__once:foo@.click__always` — the `__always` on the trigger will override the attribute-level `__once` for that trigger.
   - A special modifier `__always` is provided to explicitly override a global `__once` and force always-run behavior on a per-trigger basis.
 - Guard mods (post-checks): `__eq.<v>`, `__ne.<v>`, `__gt.<v>`, `__ge.<v>`, `__lt.<v>`, `__le.<v>`, `__notand.<signal>` can be used to conditionally allow or block evaluation of the expression after the trigger fires. These can be specified globally (attribute-level) or locally (per-trigger). Examples:
   - `data-sub:.@count__gt.5="..."` — only run when `count > 5`.
   - `data-sub__gt.10:.@foo@bar__lt.3="..."` — attribute-level guard `gt 10` applies to triggers unless overridden locally.
   - `__notand.someFlag` — block when `someFlag` is truthy.

 - Property and signal names are expected in kebab-case or snake_case in attributes and are converted to camelCase when accessed in JS expressions (e.g. `font-size` → `fontSize`).

 - Errors (invalid tokens, missing elements, malformed expressions) should be reported clearly to the console with attribute + element context.

For concrete attribute examples consult the demo runtime in `index.html`.


## data-sync

A sugar consisting of 0, 1 or 2 targets with the same grammar as in data-sub for targets but with optional mods from triggers (because those are targets and triggers at the same time)

- 2 targets may be signals or props means that target is writable and the other target changed (signal changed or prop elem default event raised) then the first target (signal or prop) will be set to the value of the first, and vice versa. If that target is not writable then it won't be set (the update should be ignored). Infinite loop of updates should be prevented by comparing that value is not changed and preventing update).

- If one the targets is signal, then the should be updated immediatly when the elem with data-sync loaded (unless __noimmediate is specified).

- If single target is specified, this means the second target will be default prop/default event of the current element.

- No targets is the valid case if the curr element has a name attr, then this nsme will be used for signal.


## data-class

data-class.foo.bar@baz='baz + boo.fix > 42'
data-class.greeting@foo__5
data-class:.green-button.-gray-button@is-done@#el-id.load

where:
  .class-to-add
  .-class-to-remove

@is-done is a signal trigger
@#el-id.load is an event trigger

data-class:.foo.bar@baz='baz + boo.fix > 42'
  (expression value interpreted as boolean)

data-class:.greeting@foo__5
data-class:.showtime@cool-factor__notimmediate__gt.42__and.baz.boo.bee


## data-disp

basically the same as data-class but instead of adding or removing classes it hides or displays the element
data-disp@is-foo
data-disp@_is-complete@in-flight
data-disp:#cool-elem@is-cool.for-sure

Same as data-class, but instead of adding/removing classes, it hides or displays the element (display: none).


## data-iter

data-iter:posts$post$i.pid#p-tpl@some-additionsl-signal-not-only-posts@.click

where #p-tpl is template tag, example

---
<template p-tpl>
  <li>post <span data-$pid/>: <p data-$post></p> </li>
</template>
```

where default bindings for item and idx are it and i, eg data-$it and data-$i

@TBD key for reconciliation eg $key.post.key


## data-get

## Data actions (GET/POST/PUT/PATCH/DELETE)

Design goals:
- Declarative, small-footprint HTTP actions that integrate with signals and triggers.
- Control request headers/options succinctly via a dedicated `^` token after the directive name.
- Keep advanced features (retry, cancellation, background signals) as TBD and addable later as global mods.

Syntax highlights:
- Directive: `data-get`, `data-post`, `data-put`, `data-patch`, `data-delete`.
- Target: `:signal` — where the response (or response state) will be written.
- Input targets: `+id` or `+#elem.prop` to supply request body/params from element(s).
- State targets: `?` after the main spec designates signals that receive action state (busy/done/ok/err/code/all).
- Headers / options: use `^` immediately after the directive name to control headers and a small set of shortcuts. Example: `data-post^json^cache-control.no-cache:resp@.click="/api"`.

Headers/options via `^` (primary change):
- `^<name>.<value>` sets header-like options. Example: `^cache-control.no-cache` → sets `Cache-Control: no-cache`.
- Shortcuts: common header bundles provided as shortcuts after `^`:
  - `^json` → `Content-Type: application/json` (and Accept: application/json)
  - `^form` → `Content-Type: application/x-www-form-urlencoded`
  - `^text` → `Content-Type: text/plain`
  - `^html` → `Content-Type: text/html`
  - `^sse` → Accept: text/event-stream, Cache-Control: no-cache
- Rationale: keeping headers/options under a single token avoids embedding JSON blobs in attributes and keeps attributes compact.

Note: in the first iteration the runtime will only support `^json` (Content-Type: application/json and JSON response parsing). Support for `^form`, `^text`, `^html`, `^sse` and other shortcuts will be added in later releases.

Examples:
- Simple GET into `result` on click:
  - `data-get:result@.click="/api/items"`
- POST with JSON shortcut and caching control:
  - `data-post^json^cache-control.no-cache:result@.click="/api/save"`
- Pass input value as body (element `#src`):
  - `data-post+ #src.value:result@.click="/api/echo"`
- Receive action state signals `busy` and `err`:
  - `data-get:result?busy,err@.click="/api/status"`

Behavior notes & future work:
- Responses should be parsed based on `Content-Type` (JSON -> JS object), and assigned to the target signal.
- `^` currently controls headers/accept and a handful of shortcuts; retry/cancel/signal options will be introduced as attribute-level/global mods later (e.g. `data-post__retry.3:...`).
- Security: attributes that build URLs from user input must be validated; consider safe-URL helpers or requiring `encodeURIComponent` in expressions.
- Cancellation: when implemented, long-running requests should be cancellable on element removal or new requests for the same action.

Pros / Cons / Gaps
- Pros:
  - Declarative and compact: `^` keeps headers terse and readable in attributes.
  - Integrates with the signal model — easy to wire responses into reactive state.
  - Small runtime surface: no heavy abstractions, easy to reason about in a tiny library.
- Cons:
  - Less flexible than programmatic fetch: advanced fetch `init` options (credentials, mode, signal) require additional syntax or are TBD.
  - Security risks if expressions construct URLs without encoding.
  - No built-in complex retry/circuit/backoff logic yet.
- Gaps / Cool extras to consider:
  - Optimistic updates, response transforms hooks, streaming/SSE handlers, progress events, automatic cancellation on element removal.
  - Global mods for retry/cancel/signal integration to allow declarative long-running workflows.

Comparison with state-of-the-art frameworks
- HTMX: Very similar in spirit (HTML-driven HTTP). HTMX focuses on server-side snippets and DOM swapping; dmax actions are signal-oriented and return parsed responses into JS signals rather than replacing DOM by default.
- Alpine/Stimulus: These are small and directive-driven; Alpine couples state with the DOM and offers `x-data`/`x-on` handlers. dmax is more signal-centric (Map of signals) and aims for smaller runtime compiled expressions.
- React/Vue/Svelte: Full frameworks provide fetch/data layers via libraries (SWR, React Query, Vue Query) with rich features (caching, retries, revalidation). dmax aims to remain tiny — it can integrate with such libraries or implement a minimal subset: declarative actions, basic parsing, and optional future enhancements (retry, cancel).

Recommendation
- Implement the `^` header/shortcut syntax as specified, keep retry/cancel/options as future global attribute mods, and provide clear docs and security guidance (encode inputs, CORS, credentials).
- Provide a small set of built-in shortcuts (`^json`, `^form`, `^sse`) and a mapping table in docs.

--

For implementation details refer to the runtime patches plan (will introduce a small request helper that reads `^` tokens, resolves body/params, sets headers, performs fetch, and writes responses to the target signal). 

