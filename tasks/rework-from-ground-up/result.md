## dSub completion plan (index-dev-wip.html)

### Scope
- Complete the `dSub` rebuild in `index-dev-wip.html` with inline assertions.
- Keep behavior aligned with the original direction: parse-driven targets/triggers, source-aware evaluation, and modifier-aware execution.

### Acceptance checklist
- [x] `dSub` no-trigger mode executes expression immediately and applies targets.
- [x] Signal trigger mode (`@foo`, `@foo.bar`, negation) propagates to targets.
- [x] Event trigger mode (`@.`, `@#id.event`) passes element/event value into expression and updates targets.
- [x] Special triggers (`@_window`, `@_document`, `@_interval`, `@_timeout`, `@_form`) are wired and callable.
- [x] Trigger modifiers are applied through a compact decorator pipeline (`immediate/notimmediate`, `once`, guards, debounce/throttle, and).
- [ ] Existing and newly added inline `assert(...)` checks pass in browser execution.

### Implementation steps
1. Normalize `dSub` internals:
   - remove stale identifiers and undefined references,
   - route all invocations through a consistent handler signature,
   - keep target setter logic centralized.
2. Normalize modifier handling:
   - convert parsed mods to a map once per trigger,
   - apply through a reusable `applyTrigMods(...)` wrapper.
3. Finalize trigger adapters:
   - signal adapter,
   - event/property adapter,
   - special adapter for window/document/interval/timeout/form.
4. Add/adjust inline tests around the completed dSub behavior.
5. Run the inline suite and fix any regression surfaced by assertions.

### Notes / risks
- The WIP parser currently uses `^` for modifiers and has a few deliberate divergences from `index.html`; dSub tests should assert current WIP contract, not legacy syntax details.
- Interval/timeout assertions should avoid timing flakiness (prefer deterministic checks where possible).

### Step-back assessment (current)
- `dSub` runtime path is now closer to first-principles + semantic compression goals:
  - normalized special roots (`window/document/form/interval/timeout`),
  - removed adapter noise (`slice(1)` workaround),
  - compact trigger-mod execution pipeline in `applyTrigMods`,
  - less redundant runtime checking in hot path.
- `devs.md` already captures the agreed doctrine, including surface-area validation and data/array-oriented thinking.
- Remaining gap: run inline/browser assertions in an environment with dependencies available.

## Next002 - 20260319-01 completion

### Done
- Refactored `applyTrigMods` in `index-dev-wip.html` with setup-time normalization and compact runtime flow:
  - normalized flags/guards once (`eq/ne/gt/ge/lt/le/and`, `once`, `prevent`, `debounce`, `throttle`),
  - split into clear `pass(...)`, `run(...)`, and handler wrapper,
  - retained current behavior contract (string compare for `eq/ne`, debounce precedence over throttle when both are present).

- Added dedicated inline asserts for `applyTrigMods` (separate from `dSub`):
  - `eq/ne` filter,
  - `and` gate,
  - `prevent + once`,
  - deterministic debounce check,
  - deterministic throttle check.

### Notes
- Could not execute headless verification in this environment because `jsdom` dependency is not installed locally (`Cannot find module 'jsdom'`).
- Existing `dSub` assertions remain in place; new `applyTrigMods` assertions are now explicit and isolated.

### Verification update (2026-03-19)
- Added diagnostic-friendly assert error output (`err.message` + `err.stack` when thrown).
- Reproduced failing inline asserts in headless Edge DOM dump:
  - `tSubEventSignal`
  - `tSubEventPropToSignal`
  - root-cause message: `mods is not iterable`
- Root cause fixed in `index-dev-wip.html` by hardening modifier helpers for null/empty modifiers:
  - `getChangeMod(mods)` now early-returns for empty/null `mods`.
  - `isImmediateMod(mods, defaultVal)` now early-returns for empty/null `mods`.
- Re-ran headless verification with Edge (`--headless --dump-dom`) and confirmed final summary:
  - `Tests 89: Passed 89, Failed 0`
  - `tSubEventSignal` and `tSubEventPropToSignal` both pass.

### Next session — assert helper renaming (2026-03-19)
- Renamed inline assert helper utilities in `index-dev-wip.html`:
  - `stableStringify` -> `tStr`
  - `deepEqual` -> `tEq`
  - `fmt` -> `tFmt`
  - `assert` -> `tAssert`
- Updated all inline test callsites to use `tAssert(...)`.
- Fixed one accidental over-replacement (`console.tAssert(...)`) back to `console.assert(...)` in `dSub` target setup.
- Re-ran headless Edge DOM verification and confirmed:
  - `Tests 89: Passed 89, Failed 0`
  - no `ReferenceError`, `TypeError`, or failed checks in dump output.

### Correction (same day)
- Per `task.md` direction, reverted helper renaming and kept the main helper named `assert`.
- Applied the requested targeted rename for the setC test helper only:
  - `tSetC` -> `assert_setC`
  - assertion call updated to `assert(assert_setC, ...)`.
- Re-verified with headless Edge dump:
  - `Tests 89: Passed 89, Failed 0`
  - output includes `assert_setC — root shape change arrays` as passing.