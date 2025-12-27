# dmax

Dmax is Datastar.js inspired, fast, small, no-build, no-magic, declarative web lib for the page interactivity based on signals and the html native data- attributes, targets modern browsers and w3c standards.

## TL;DR — Supported directives (compact)

 - **data-def**: declare initial signals/state (JSON or shorthand). See `index.html` data-def block.
 - **data-sub**: reactive assignments and side-effects. Targets may be signals or element properties; triggers may be signals or element/window events. Supports common trigger modifiers (debounce/throttle/once/immediate/prevent). See `index.html` for concrete attribute examples.
 - **data-sync**: two-way binding sugar between signals/props (one or two targets). Prevents update loops; signals are written back on default events.
 - **data-class**: conditional class add/remove driven by expression and triggers (same trigger grammar as `data-sub`). Use `.` prefix for class names, `.-name` to remove.
 - **data-disp**: show/hide element based on expression triggers (same trigger grammar as `data-class`).
 - **data-iter**: render arrays via a `<template>` id. Template bindings: `data-$it` (item), `data-$i` (index). Nested declarative `data-iter` supported.
 - **data-get / data-post / data-put / data-patch / data-delete**: declarative HTTP actions (TBD: control options, retries, cancelation syntax); basic URL and param wiring planned.

Quick notes:
 - Attribute names are kebab-case; runtime converts to camelCase for JS bindings (e.g. `font-size` → `fontSize`).
 - Expressions are compiled and cached; signals live in a small `Map` store (see `index.html`).
 - `data-iter` uses batched insertion (DocumentFragment) and precomputed shallow bindings for faster updates.

TBD / tracked items (short):
 - `data-iter` stable key reconciliation (`$key` semantics) — deferred (was experimented, removed).
 - Full `data-{get,post,...}` control options (headers, retry, cancel, timeout).
 - Additional trigger mods: `__and.signal`, conditional comparators (eq/gt/lt), `__batch`/RAF batching mode.
 - More robust parser diagnostics and validation rules (reserved names, invalid attr shapes).

For full grammar and implementation notes see `req.md` and `index.html` (demo + runtime).
