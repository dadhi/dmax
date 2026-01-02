# dmax

A tiny data-maximal runtime.

Compact examples

 - Subscribe to parent shape keys only (no values):
 - Subscribe to parent shape keys only (summary):

  <pre>&lt;pre data-sub:.@parent__shape="(ev && ev.detail && ev.detail.change) ? window.formatShapeChange(ev.detail.change) : ''"&gt;&lt;/pre&gt;</pre>

 - Compiled body signature (compact):

  - `function(dm, el, ev, sg, detail)` — note: when a handler is invoked from a signal change the runtime does not pass `ev` (it will be `undefined`); use `detail` for change info.

# dmax

Dmax is Datastar.js inspired, fast, small, no-build, no-magic, declarative web lib for the page interactivity based on signals and the html native data- attributes, targets modern browsers and w3c standards.

## TL;DR

```text
dmax v0.2 (~3kb unzipped, ~1.3kb min+gzip)
------------------------------------------
Subscription engine: explicit reactivity, tiny runtime, no virtual DOM.

Core directives:
 - data-def   : declare initial signals/state (JSON or shorthand)
 - data-sub   : reactive assignments / side-effects (targets: signals or element props; triggers: signals, element/window events; common mods supported)
 - data-sync  : two-way binding sugar (one or two targets, prevents loops)
	- Directional forms: `data-sync@signal` (signal -> element one-way), `data-sync:signal@.` (element -> signal one-way), and `data-sync:signal` (default two-way). See `index.html` examples.
 - data-class : conditional add/remove classes
 - data-disp  : show/hide by expression
 - data-iter  : array rendering via <template>; use `data-$it` (item) and `data-$i` (index); nested iters supported; uses DocumentFragment batching
 - data-get/post/put/patch/delete : declarative HTTP actions (basic wiring; controls TBD)

Notes:
 - Attributes use kebab-case; runtime converts to camelCase for JS access.
 - Expressions are compiled & cached; signals stored in a small `Map` (`S`).
 - Compiled expressions receive four arguments: `dm` (the global state object containing signals), `el` (the element), `ev` (the triggering Event, if any), and `sg` (the signal path string that triggered the evaluation, if any). Expressions should reference signals explicitly via `dm`, e.g. `dm.count` or `dm.user.name`.
 - Special/global triggers use the `_` prefix: `@_window`, `@_document`, `@_interval`, `@_delay`.
 - Special/global triggers use the `_` prefix: `@_window`, `@_document`, `@_interval`, `@_delay`.
 - For `_interval` and `_delay`, the runtime passes a CustomEvent as `ev` to compiled expressions: `ev.type` is `'interval'` or `'delay'` and `ev.detail.ms` contains the configured milliseconds.
 - Attribute-level/global mods: you can append modifiers directly after the directive name (e.g. `data-sub__once:...`) to apply them to all triggers on that attribute. Trigger-level modifiers (after a trigger) override attribute-level ones. Use `__always` to override a global `__once` on a specific trigger.
 - `data-iter` precomputes shallow bindings for faster updates.

Short TBD:
 - stable keyed reconciliation for `data-iter` (`$key`) — deferred
 - full HTTP control (headers, retry, cancel, timeout)
 - additional trigger mods and batching modes

See `index.html` for live examples and `req.md` for detailed grammar.
```

Supported trigger modifiers:
 - `__immediate` — run handler immediately for signal triggers
 - `__notimmediate` — avoid immediate run for event triggers
 - `__once` — run only once then remove subscription
 - `__debounce.<ms>` — debounce handler by milliseconds
 - `__throttle.<ms>` — throttle handler by milliseconds
 - `__prevent` — call `preventDefault()` for DOM events
 - `__and.<signal>` — conditional AND modifier (TBD semantics)
 - comparator mods (TBD): `__eq.<v>`, `__gt.<v>`, `__lt.<v>`

