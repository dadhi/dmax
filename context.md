Project: dmax — lightweight single-file reactive runtime

Summary
- dmax is a tiny, single-file JavaScript runtime embedded in `index.html` that provides a signal (state) map, declarative bindings via data-* attributes, and small action helpers for HTTP interactions.
- Goals: minimal runtime size, explicit compiled expressions (no `with`), fine-grained reactivity (content vs shape), and compact declarative actions.

Key files
- `index.html` — main runtime, parser, compiler, demo UI, and tests hooks. Primary location of recent edits.
- `tests/` — headless/JSDOM tests and e2e action tests. Important files:
  - `tests/headless_tests.js` — JSDOM-driven unit tests (includes FG content/shape tests).
  - `tests/actions.e2e.js`, `tests/actions.resultMods.e2e.js` — action/e2e smoke tests.
- `tools/` — parse prototypes and bench tools (e.g. `bench-parse.js`, `parse_table.js`).
- `README.md` / `req.md` — documentation and requirements; updated with `__detail` docs and shape semantics.

Core concepts & API (compact)
- Signals: stored in a Map `S` and exposed to compiled expressions as `dm` (plain object via `Object.fromEntries(S)`).
- Compiled bodies: signature `(dm, el, ev, sg, detail)`.
  - `dm`: snapshot of signals
  - `el`: element context (or undefined)
  - `ev`: DOM Event when event-originated (for signal-originated invocations `ev` is not passed)
  - `sg`: signal path string that triggered the handler, if any
  - `detail`: shape-change payload (see below)
- Subscriptions: stored in `subs` — entries are either legacy functions or objects `{ fn, mode, detail }`.

Content vs Shape semantics
- Content mutation: leaf value replacement — not a structural change. Notifies `content` subscribers only.
- Shape mutation: structural changes (add/remove keys or array length changes) — notifies `shape` subscribers and also `content` subs where applicable.

Shape change payload (guarantees)
 - The runtime provides a key-level summary for shape mutations:
  - `added`: array of keys/indices added
  ```markdown
  Project: dmax — lightweight single-file reactive runtime (updated)

  Summary
  - dmax is a tiny, single-file JavaScript runtime embedded in `index.html`. It exposes a simple signal map, compiled expressions, and declarative `data-*` directives for reactive UIs without a virtual DOM.

  Key files (recently changed)
  - `index.html` — runtime, compiler, parsers, demo UI and most recent feature work (shape/detail changes, `data-dump`, bracket-index, wiring fixes).
  - `tests/headless_tests.js` — JSDOM headless tests; extended with `data-dump`, bracket-index and negated `data-disp` tests.
  - `README.md`, `req.md` — documentation updated to describe `data-dump` and shape/detail semantics.
  - `package.json` — `serve` script added for local testing (`npx http-server -c-1 -p 8080`).

  Core API & runtime notes
  - Signals: stored in Map `S`, surfaced to compiled expressions via `dm` (`Object.fromEntries(S)`).
  - Compiled expression signature: `(dm, el, ev, sg, detail)` where:
    - `dm`: snapshot of signals
    - `el`: element context (or `undefined` when handler is signal-originated)
    - `ev`: DOM Event for event-originated triggers (`undefined` for signal-originated)
    - `sg`: signal path that triggered the evaluation (if any)
    - `detail`: shape-change summary provided for shape-mode invocations
  - Subscriptions: stored in `subs` keyed by canonical root; entries are objects `{ fn, mode, path }`.

  Content vs Shape semantics
  - Content mutation: value replacement — not structural; invokes `content` subscribers only.
  - Shape mutation: structural changes (object keys added/removed, array length changes) — invokes `shape` subscribers; runtime provides a minimal `change` summary `{ added:[], removed:[] }`.
  - For DOM-event-originated handlers the shape info is available as `ev.detail.change`; for compiled bodies invoked from signals the `detail` arg receives that same shape summary.

  New / Recent Work (high level)
  - `detail` / shape threading: signal-originated handler calls now pass `ev === undefined` and provide the shape summary via `detail` (lightweight `{added, removed}`), matching DOM event semantics.
  - `data-dump` (replacement for older `data-iter`):
    - Supports `data-dump@sig#tpl-id`, `data-dump#tpl-id@sig`, and inline `<template>` children.
    - `$item` / `$index` placeholders supported during clone-time for attribute names and values; attribute-value substitution rewrites to safe references (e.g., `dm.sig[index]`).
    - Cloned nodes are wired after insertion (calls `setupSub`, `setupSync`, `setupClass`, `setupDisp`, `setupAction`, and recursively `setupDump`) so directives inside templates behave normally.
    - Append/remove-only reconciliation: clones are appended/removed from the end based on array length changes (stable keyed reconciliation is deferred/TBD).
    - Inline templates are detached after reading so they don't remain as empty DOM children.
    - `data-dump` now populates clones immediately by evaluating `data-sub` expressions against current state so initial render shows item content.
  - Bracket-index indirection (`posts[idx].title`) and helper functions:
    - `hasBracketIndex`, `collectBracketRoots`, `resolveBracketPath` implemented.
    - Subscriptions register both the base root and any index-root signals so changing `idx` or the indexed item behaves correctly.
  - `data-class` / zebra rows:
    - `data-class` uses sign semantics `.<name>` to add when true and `.-<name>` to mark inverse; code toggles classes accordingly.
    - Example demo uses `data-class:.zebra-even.-zebra-odd="$index % 2 === 0"` to apply zebra styling per clone.
  - Demo/UI fixes:
    - Section 9 (`data-dump`) templates updated to render items (strings or JSON for objects), provide numbering, zebra styling, and per-list demo buttons (Add, Remove First, Remove Last, Update 2nd).
    - Buttons were wired to update the `posts` signal using `data-sub:posts@.click` so `set()` is used and `data-dump` reacts.
  - Tests & validation:
    - Added/updated headless tests for inline templates, nested replies, bracket-index behavior, negated `data-disp` (`!dm.x`) and general regression checks.
    - Multiple iterative runs ensured all headless tests pass locally (current result: green).

  Implementation notes & trade-offs
  - `data-dump` performs conservative placeholder rewriting at clone-time (attribute names/values). Complex expression rewrites should be tested; helper signals are recommended when expressions get complex.
  - `data-dump` uses simple append/remove reconciliation to keep the runtime small and predictable. Keyed stable reordering is a future enhancement.
  - The runtime evaluates `data-sub` on clones immediately to populate content; this is a pragmatic choice to keep initial render consistent in browsers that don't run the wiring synchronously.

  Files touched (high level)
  - `index.html` — major edits (setupDump, detail threading, bracket-index, compiler wiring, demo updates)
  - `tests/headless_tests.js` — new/updated tests (data-dump, negated data-disp, bracket-index)
  - `README.md`, `req.md` — docs updated to describe `data-dump` semantics and shape/detail notes
  - `package.json` — `serve` script added

  Status
  - Headless tests pass locally (JSDOM). The demo is interactive and Section 9 demonstrates `data-dump` behavior and the Add/Remove/Update buttons.

  Improvements (suggested)

  - Cache Template: Cache the parsed template node/content so `setupDump` doesn't re-query/parse the template on each render. Store a `tplFirst` reference and reuse for cloning.
  - Batch DOM Inserts: Build clones into a `DocumentFragment` and append once to reduce reflows and layout thrashing.
  - Precompile Expressions: Compile attribute expressions (placeholders, `detail.item`, `detail.index`) into JS functions once per template and reuse for each clone.
  - Single-Pass Placeholder Rewrite: Replace multiple DOM attribute/value passes with a single regex-driven rewrite that returns a list of setter ops (name/value) to apply per clone.
  - Keyed Reconciliation: Add optional `$key` support and reconcile by key to preserve DOM nodes and minimize removals/insertions.
  - Cache Bracket Resolvers: Precompute and memoize bracket-index dependency resolvers (roots + accessors) to avoid reparsing strings on every signal/emit.
  - Wire Clones via Walk, Not Query: After cloning, run a single DOM-walk that calls existing `setup*` functions on each node rather than repeated `querySelectorAll` calls for each directive.
  - Safe Attribute API: Use direct properties (`el.classList`, `el.style`, `el.dataset`) when possible and sanitize attribute names before `setAttribute` to avoid runtime exceptions.
  - Batch/Coalesce Updates: Debounce rapid shape changes and apply DOM updates in a single microtask/requestAnimationFrame to coalesce multiple emits into one update cycle.
  - Improve Observability & Errors: Add warning logs and defensive checks when templates are missing, placeholder parsing fails, or bracket roots can't be resolved; include small perf metrics for slow templates.

  Next steps (suggested)
  - Commit and push the changes (branch `main` currently). I can make the commit now if you want.
  - Add a small helper to pretty-print JSON in a multi-line block per-item, or add per-item action buttons (edit/delete) to the template.

  How to run locally
  - Start local server: `npm run serve` (serves on port 8080) and open `http://localhost:8080`.
  - Run headless tests: `node tests/headless_tests.js`.

  Contact / notes
  - If you'd like, I can commit the changes and add a brief changelog entry, or I can extract `data-dump` logic into a small helper module for easier testing. Tell me which you prefer.

  ``` 
