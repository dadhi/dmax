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
- Enforced explicit `dm.*` usage in compiled expressions (no `with`). `compile` now creates functions with five params.
- Integrated a compact table-FSM parser and switched from prototype char-scanner where beneficial.
- Implemented fine-grained reactivity:
  - `set(p, v)` detects `content` vs `shape` changes.
  - `diffValues(before, after, includeVals)` produces base (keys-only) and full (with values) diffs.
  - `emit(p, mutation, info)` selects per-subscriber `detail` payloads based on subscriber's `detail` field.
 - Adjusted runtime to avoid passing `ev` into compiled functions when invocation is signal-originated (compiled bodies receive `detail` reliably).
 - Demo & tests:
  - Section 11 "Content vs Shape Demo" demonstrates content vs shape semantics.
  - Added headless tests to validate content vs shape behaviors.
  - Fixed demo edge cases (use timestamp `addedAt` so repeated adds produce shape diffs).
 - Documentation: updated `README.md` and `req.md` to reflect that shape payloads include only `added`/`removed`.

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
