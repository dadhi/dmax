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
 - data-class : conditional add/remove classes
 - data-disp  : show/hide by expression
 - data-iter  : array rendering via <template>; use `data-$it` (item) and `data-$i` (index); nested iters supported; uses DocumentFragment batching
 - data-get/post/put/patch/delete : declarative HTTP actions (basic wiring; controls TBD)

Notes:
 - Attributes use kebab-case; runtime converts to camelCase for JS access.
 - Expressions are compiled & cached; signals stored in a small `Map` (`S`).
 - `data-iter` precomputes shallow bindings for faster updates.

Short TBD:
 - stable keyed reconciliation for `data-iter` (`$key`) — deferred
 - full HTTP control (headers, retry, cancel, timeout)
 - additional trigger mods and batching modes

See `index.html` for live examples and `req.md` for detailed grammar.
```
