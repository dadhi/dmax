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
  - `removed`: array of keys/indices removed
 - The runtime does not attach per-key value maps to shape events; shape payloads are intentionally minimal to avoid expensive deep copies.
 - Shape change summaries are available as `ev.detail.change` for DOM-event-originated handlers and as the `detail` argument to compiled bodies when applicable.

Recent changes (what I did to get the agent up to speed)

- Removed legacy `__detail` payload variants and simplified shape-change notifications.
  - Shape emits now provide a minimal summary object: `{ added: [...], removed: [...] }` (no per-key value maps by default).
- Reintroduced efficient childPath filtering without per-subscriber wrappers: `subs` entries are either functions or objects `{ fn, mode, childPath }` and centralized matching happens inside `emit`.
- Added bracket-index (indirection) support in attribute paths (e.g., `postObjs[idx].title`):
  - New helpers: `hasBracketIndex`, `collectBracketRoots`, and `resolveBracketPath`.
  - Runtime registers subscriptions for both the base root and any signals referenced inside bracket expressions (so changes to `idx` also trigger appropriate handlers).
  - Triggers using bracket indirection register a lightweight wrapper that resolves the concrete path at runtime and only invokes the original handler when the resolved path matches or when index-root signals change.
- Simplified emits and subscription payloads:
  - `emit(p, mutation, info)` now passes only minimal `change` summaries to shape subscribers and centralizes childPath matching.
  - For content mutations, only `content`-mode subscribers are invoked (fast-path).
- Subscription storage/refactor and minor API changes:
  - Subscriptions are stored keyed by the root signal (canonicalized), and when attribute-parsed names differ (kebab/lowercase), alias keys are registered so both forms match the same signal.
  - `compile(body)` continues to generate `(dm, el, ev, sg, detail)` functions — compiled bodies reference `dm` explicitly.
- Bracket-index demo & tests:
  - Added a dedicated hidden demo/test hooks and a visible separate demo section that exercises `postObjs[idx]` behavior.
  - Added headless tests in `tests/headless_tests.js` to verify:
    - subscription triggers when `idx` points to the changed item,
    - no trigger when a different index item changes,
    - triggers when `idx` itself changes (index-root subscription),
    - subsequent changes to the newly indexed item trigger the subscription.
- Temporary debug instrumentation was used during development (wrapper/emit logs) and then removed; tests pass without debug traces.
- Tooling: added a quick `serve` script to `package.json` for local static serving (`npx http-server -c-1 -p 8080`).

Why these changes:

- The goal was to remove heavy __detail payloads and simplify semantics while keeping efficient childPath filtering and adding useful HTML-path indirection via brackets.
- Bracket-index support allows compact declarative bindings like `data-sub:.@postObjs[idx]` while keeping subscriptions efficient and deterministic.

Notes for maintainers

- If you change how signal keys are canonicalized (kebab→camel vs lowercase), ensure subscriptions and data-def keys remain reachable — the runtime currently registers alias keys so both attribute-parsed and data-def forms match.
- Keep compiled expressions explicit (`dm.*`) to avoid introducing unbound identifier errors in compiled bodies (see recent demo patch that uses `dm.idx` rather than a free `idx`).

Files touched

- `index.html` — major edits: emission/refactor, subscription alias handling, bracket-index helpers and wrapper logic, demo/test hooks.
- `tests/headless_tests.js` — added bracket-index tests and validated FG content/shape tests.
- `package.json` — added `serve` script for quick local testing.

Status

- Headless tests pass locally (JSDOM harness). Temporary debug logs removed; runtime is clean.

Next steps (optional)

- Commit & push the changes to the repository (branch `main` currently).  
- Consider adding a small public API for programmatic subscriptions (e.g., `dmax.subscribe(signal, { mode:'shape', childPath:'x' }, fn)`).

Guidelines for contributors
- Keep compiled bodies explicit: reference signals via `dm` (e.g., `dm.user.name`).
- Prefer shallow structural clones in `set` to minimize GC churn.
- Only include values in shape diffs when requested — avoid expensive deep copies by default.
- Keep the runtime single-file and minimal unless a clear perf / maintainability tradeoff warrants extraction.

How to run locally
- Start server: `python3 -m http.server 8000` and open `http://localhost:8000`
- Run headless tests: `node tests/headless_tests.js`
- Run e2e action tests: `node tests/actions.e2e.js` and `node tests/actions.resultMods.e2e.js`

Current status
- Headless tests and e2e action tests pass. The demo Section 11 is interactive and demonstrates `content` vs `shape` semantics and `__detail` usage. Ongoing item: full benchmark and size optimization.

Contact / next steps
- If you want a smaller public API wrapper for programmatic subscriptions with `detail` control, I can add a small helper (e.g., `dmax.subscribe(signal, { mode:'shape', detail:'values' }, fn)`).
