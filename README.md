# dmax

A tiny declarative web runtime driven by `data-*` attributes.

## Files

- `index.html` — current dev notebook (asserts + live examples)
- `dmax.js` — extracted runtime script loaded by `index.html`
- `index-wotking-slop.html` — previous `index.html` snapshot
- `tools/strip-dmax-tests.sh` — shell/awk script to remove inline `__assert` + test helpers from `dmax.js`

## Syntax used by current `index.html`

### Core directives

- `data-def` — define signal state
- `data-sub` — subscribe and update signals/props with expression results
- `data-sync` — signal/prop synchronization
- `data-class` — class toggling
- `data-disp` — show/hide elements
- `data-dump` — render array items via templates
- `data-get|post|put|patch|delete` — declarative HTTP actions
- dmax SSE (`text/event-stream`) in actions:
  - `event: dmax-patch-elements` (`mode`: `outer|inner|replace|prepend|append|before|after|remove`, `selector`, `namespace`, `dmaxElements`)
  - `event: dmax-patch-signals` (`dmaxSignals` JSON merge patch, optional `onlyIfMissing true`)

### Token grammar

- `:target` signal/prop targets
- `@trigger` signal/event/prop triggers
- `+input` action inputs
- `^mod` modifiers (timing/guards/options)
- `!name` negation in applicable places

## Fixi feature matrix (aligned to dmax)

This extends the earlier Datastar-gap research with the [Fixi Project](https://fixiproject.org/), which is split into
five very small libraries:

> Note: the comparison below is updated against the current `main` branch, where dmax now includes merged SSE patch
> handling in actions.

- `fixi.js` — declarative HTTP requests + HTML swapping
- `moxi.js` — inline handlers + DOM-driven reactivity
- `ssexi.js` — SSE streaming for `fixi`
- `paxi.js` — DOM morphing
- `rexi.js` — tiny imperative `fetch()` wrapper

### Matrix

| Fixi piece | What it does | dmax status today | Gap / takeaway |
| --- | --- | --- | --- |
| `fixi.js` | Declarative HTTP requests triggered from HTML, with target selection and swap strategies | **Partial overlap** via `data-get|post|put|patch|delete`, plus `^busy`, `^err`, `^code` result/status signals | dmax covers declarative requests. It does **not** yet expose Fixi's small HTML-targeted swap model (`fx-target`, `fx-swap`) as directly. |
| `moxi.js` | `on-*` inline handlers, `live` expressions, `q()` DOM query helper, event modifiers | **Strong overlap, different design** via `data-def`, `data-sub`, `data-sync`, `data-class`, `data-disp`, `data-dump` | dmax is stronger on explicit signals and list/state directives. moxi is stronger on imperative DOM scripting and query ergonomics. |
| `ssexi.js` | Streams `text/event-stream` responses into the DOM and emits SSE lifecycle events | **Good overlap** — action responses accept `text/event-stream` and apply `dmax-patch-elements` / `dmax-patch-signals` **incrementally** via `ReadableStream` + `TextDecoder` (falls back to `res.text()` where the Streams API is unavailable) | Reconnect/cancel semantics and SSE lifecycle events (`open`, `error`, `close`) are still absent. Long-lived persistent SSE connections (as opposed to one-shot action responses) are not yet covered. |
| `paxi.js` | Morph-based DOM patching that preserves focus/form state better than replacement | **Good overlap** — dmax morphs matched nodes, preserves event listeners, **now also preserves caret/selection for focused inputs and scroll position for scrollable elements** during streamed fragment updates | Stronger keyed-list reconciliation and a parity test matrix against Datastar's unusual attribute scenarios (`style`, canvas, etc.) are still missing. |
| `rexi.js` | Tiny imperative `fetch()` helper for code paths where declarative HTML is not enough | **Mostly missing** | dmax actions cover declarative requests. There is still no tiny JS helper for imperative API calls, aborts, or decoding helpers. |
| Combined bundle | Composable micro-libraries that can be mixed as needed | **Different trade-off**: dmax is one integrated signal-first runtime | Fixi is more modular. dmax is more unified. |

### What dmax already has that Fixi does not

- A first-class signal store (`data-def`) rather than DOM-only/local imperative state.
- Declarative signal/property synchronization (`data-sync`) including one-way and two-way flows.
- Signal-driven class/visibility/list directives (`data-class`, `data-disp`, `data-dump`).
- Shape-aware updates and signal modifiers for gating/timing.
- A more unified attribute grammar across signals, props, events, and actions.

### What Fixi has that dmax can likely borrow

- A dedicated HTML swap model (`target` + `swap`) rather than only mapping request results into signals.
- `paxi`'s stricter morph fast-path discipline: keep the common reconciliation case tiny, direct, and hard to accidentally slow down.
- `ssexi`'s incremental streaming semantics and clearer lifecycle hooks around the now-merged SSE patch protocol.
- A tiny imperative fetch helper (`rexi`) for non-declarative code paths.
- A lightweight imperative companion (`moxi`) for the cases where declarative dataflow is awkward.

## Performance / simplicity analysis

Fixi's strongest idea is not a single algorithm; it is the discipline of keeping each feature on a very short leash.
Across `fixi`, `paxi`, `ssexi`, `moxi`, and `rexi`, the recurring style is:

- prefer one native browser primitive over a framework abstraction
- keep each library tiny enough to audit in one sitting
- cut slow or state-heavy features instead of making them configurable
- isolate optional features so the base path stays cheap in bytes, memory, and mental overhead

That style matters for performance because it reduces code size, avoids extra object graphs, keeps fewer long-lived hooks
alive, and makes hot paths easier to optimize.

### Things Fixi does for speed, memory, and simplicity that dmax can apply

| Fixi technique / style | Why it is fast or small | dmax today | What to apply in dmax |
| --- | --- | --- | --- |
| Hard feature budget | Smaller code tends to allocate less, branch less, and stay easier to reason about in hot paths | dmax is feature-rich and currently much larger than Fixi | Add a stricter "fast-path only" rule for new features: if a capability needs many modes, keep it out of the core runtime or make it a narrow optional layer |
| Native APIs first (`fetch`, `MutationObserver`, Streams, `TextDecoder`) | Avoids wrapper layers and duplicate state | dmax already leans this way — **the SSE action path now uses `ReadableStream` + `TextDecoder` for incremental consumption** | Keep extending features through native primitives rather than introducing generic abstraction layers |
| Small, direct code over large plugin surfaces | Avoids hook-dispatch overhead, keeps hot paths explicit, and makes the code easier to copy/fork/modify | dmax already prefers direct runtime code over plugin APIs | Keep internal helpers composable and readable instead of introducing a plugin boundary for every feature |
| Very small surface per library | Optional functionality does not bloat the base runtime | dmax is intentionally a single integrated runtime | Borrow the implementation ideas, but integrate them behind one consistent terse grammar instead of copying Fixi's package split |
| Single interception seam (`ssexi` uses one `fx:config` hook) | Extensions can piggyback on one stable hook instead of spreading logic across many call sites | dmax tends to wire behavior directly into the runtime | Reuse one internal action/SSE path so streaming, morphing, and signal patching stay consistent even without a public plugin system |
| Streaming parse with async generator + incremental reader | Lowers peak memory and improves first-update latency because the full response is never buffered | **Done:** `consumeDmaxSseStream` uses `body.getReader()` + `TextDecoder` for per-chunk incremental parsing; falls back to `res.text()` where the Streams API is unavailable | Keep the streaming path lean; extend only for reconnect/cancel semantics when needed |
| Strict morph fast path (`paxi`) | Keeps node reuse cheap by focusing on id matching and direct tree reconciliation, not callbacks/plugins | dmax already has an in-place morph implementation — **now also preserves caret/selection for focused inputs and scroll position for scrollable elements** | Keep dmax morph small and opinionated; resist adding callback-heavy or plugin-heavy morph features that would slow the common case |
| Targeted discovery instead of broad scans (`moxi` uses XPath to find only relevant nodes) | Avoids visiting unrelated DOM nodes and cuts setup work | dmax still has places where clone wiring walks descendants and repeats directive setup work | Prefer one targeted walk/discovery pass per subtree and avoid repeated `querySelectorAll`-style scans during dump/template wiring |
| Cheap cleanup of dead reactive work (`moxi` removes `live` expressions for detached nodes) | Reduces memory retention and unnecessary reruns | dmax already preserves some cleanup state on matched nodes | Be stricter about cleaning subscriptions and per-node bookkeeping when nodes are removed or replaced |
| Narrow non-goals (no queueing/history/interceptor stacks in core) | Prevents permanent runtime cost for rarely used features | dmax already has some explicit minimalism, but keeps accumulating capabilities | Document stronger non-goals for the core runtime so convenience features do not silently become permanent cost centers |
| Tiny imperative escape hatch (`rexi`) instead of growing the declarative core | Lets uncommon cases exist without complicating the main DSL | dmax has declarative actions but no small imperative helper | If imperative requests are needed, add a tiny helper instead of expanding action grammar for every edge case |

### Accentuated conclusion: the direction dmax should lean toward

The comparison suggests dmax should borrow **techniques** from Fixi, not its package split:

- **Batteries-included, seamless integration:** dmax should keep SSE + morph + signal updates as one integrated runtime, not as separately assembled plugins.
- **One terse grammar across features:** triggers, targets, modifiers, and action/result wiring should keep feeling the same across signals, actions, SSE patches, and DOM updates.
- **Simple, direct, modifiable code over plugin boundaries:** rather than building a large hook/plugin surface, dmax should keep the code explicit and easy to pool/fork/modify directly.
- **Shared internals and compact reuse:** the runtime should reuse one compact set of parsers, patchers, and notification paths so the whole library stays consistent without bloating.
- **Use the best hot-path ideas from Datastar, Fixi, and current dmax:** the right outcome is not ideological purity, but the fastest/simplest combined design.

### The two hot paths to optimize hardest

1. **Action → SSE HTML fragments → morph into the page**  
   This path should stream in, target the right DOM nodes, and preserve focus, form/input state, selection/caret, scroll position, and listeners whenever the structure still matches.

2. **User/server signal updates → subscribed parties → UI refresh**  
   This path should stay compact and predictable so both user interactions and server-driven patches can update signals and flush UI reactions without redundant work.

### What was addressed in this update

- **True incremental SSE consumption:** the `dAction` SSE path now uses `consumeDmaxSseStream` — a `ReadableStream` + `TextDecoder`-based incremental parser that applies `dmax-patch-elements` / `dmax-patch-signals` events as each chunk arrives rather than after the full response is buffered. Environments without the Streams API fall back to `res.text()` automatically.
- **Tighter SSE → morph hot path:** `morph` now preserves the user's **scroll position** (saving and restoring `scrollTop`/`scrollLeft`) and **caret/selection** (saving and restoring `selectionStart`, `selectionEnd`, `selectionDirection` on focused `<input>` and `<textarea>` elements) so large streamed fragment updates do not disrupt the user.
- **Morph preservation tests:** three new inline assertions cover scroll preservation, caret/selection preservation for focused inputs, and end-to-end SSE streaming via a fake `body.getReader` — all running with the existing in-page test harness.

### What is still missing

- **SSE lifecycle semantics:** reconnect on drop, explicit cancel/abort, and `open`/`error`/`close` lifecycle signals for persistent SSE connections (as opposed to one-shot action responses).
- **A unified parity matrix against Datastar's broader scenarios:** unusual attribute updates (`style`, links, canvas, etc.), keyed list reconciliation, and stable DOM preservation during collection updates.
- **A tiny imperative escape hatch:** a small `rexi`-style helper for non-declarative API calls, abort signals, and raw stream decoding helpers, so the action grammar does not grow for edge cases.
- **A clear decision on imperative escape hatches:** whether dmax should add them or keep the current signal-first model intentionally strict.

### Example

```html
<div data-def='{"count":0,"active":true}'></div>

<button data-sub:count@.click="dm.count + 1">+1</button>
<span data-sub:.@count="dm.count"></span>

<input data-sync:user.name>
<div data-class+active+!inactive@active="dm.active"></div>

<button data-get^busy.post-loading^err.post-error^code.post-code:post-result@.click="'https://jsonplaceholder.typicode.com/posts/1'">
  Load
</button>
<strong data-disp:.@post-loading="dm.postLoading">Loading…</strong>
<span data-sub:.@post-error="dm.postError"></span>
<span data-sub:.@post-code="dm.postCode"></span>

<!-- request spread + dynamic headers + merge result -->
<button
  data-post^json^merge^headers.reqHeaders:profile@.click+_all+user._all
  ="'/api/profile/update'">
</button>

<!-- unpack top-level object fields into root signals; arrays -> _arr -->
<button data-get:_all@.click="'/api/bootstrap'"></button>
```

`^busy.post-loading^err.post-error^code.post-code` reuses modifier syntax for action status signals instead of special positional parsing, and lets each action expose independent loading/error/code indicators.

## New dAction features added

- Request packing:
  - `+_all` sends the full signal map
  - `+some.path._all` spreads object fields from that signal path
- Response unpacking:
  - `:_all` unpacks top-level object fields into root signals
  - top-level arrays map to `_arr`
- Result modes:
  - `^replace` (default), `^merge`, `^append`, `^prepend`
- Headers/body mods:
  - `^headers.<signal>` to copy raw headers from a signal object
  - `^no-cache` adds `Cache-Control: no-cache`
  - `^brotli`/`^br`, `^gzip`, `^deflate`, `^compress` set `Accept-Encoding`
  - `^json`, `^text`, `^form` request body/content shortcuts
- Response content parsing recognizes `application/json` and `*+json` media types (with boundary-safe suffix detection).

For `dmax-patch-elements` with `mode: outer|inner`, dmax uses the built-in `morph(...)` implementation to preserve listeners/state while applying updates.
When `dmax-patch-elements` is sent without a `selector`, each top-level `dmaxElements` node must include an `id` so dmax can target existing DOM nodes.
Only `dmax-patch-elements` / `dmax-patch-signals` and `dmaxElements` / `dmaxSignals` are supported.

## Production size snapshot (bare dmax vs Datastar vs Fixi parts)

Measured on `2026-04-30` using raw sources and local compression (`gzip -9`, `brotli`):

| Artifact | Raw bytes | Gzip bytes | Brotli bytes |
| --- | ---:| ---:| ---:|
| `dmax.js` (current dev/test inline) | 147,926 | 33,239 | 28,706 |
| `dmax.js` stripped (`tools/strip-dmax-tests.sh`) | 86,882 | 21,516 | 18,708 |
| Datastar (`starfederation/datastar` `bundles/datastar.js`) | 30,732 | 12,202 | 11,021 |
| fixi core (`bigskysoftware/fixi` `fixi.js`) | 3,473 | 1,473 | 1,278 |
| moxi (`bigskysoftware/moxi` `moxi.js`) | 4,733 | 2,125 | 1,883 |
| ssexi (`bigskysoftware/ssexi` `ssexi.js`) | 4,177 | 1,599 | 1,386 |
| paxi (`bigskysoftware/paxi` `paxi.js`) | 1,528 | 690 | 584 |
| rexi (`bigskysoftware/rexi` `rexi.js`) | 4,355 | 1,608 | 1,417 |

Related bundle rollups:

- fixi + ssexi + paxi (closest to dmax action + SSE + morph overlap): **9,178 raw / 3,762 gzip / 3,248 brotli**
- fixi + moxi + ssexi + paxi: **13,911 raw / 5,887 gzip / 5,131 brotli**
- fixi + moxi + ssexi + paxi + rexi: **18,266 raw / 7,495 gzip / 6,548 brotli**

Datastar README currently advertises a single script tag of about **10.76 KiB**.

### Reproduce

```bash
# dmax bare (stripped)
sh tools/strip-dmax-tests.sh dmax.js /tmp/dmax.prod.js
wc -c /tmp/dmax.prod.js
gzip -9 -c /tmp/dmax.prod.js | wc -c
brotli -c /tmp/dmax.prod.js | wc -c
```

## Next step: minifier options

1. **esbuild** (`esbuild dmax.prod.js --minify`)  
   Fastest iteration; usually good compression.
2. **terser** (`terser dmax.prod.js -c -m`)  
   More tuning knobs (`passes`, `pure_funcs`, property mangling).
3. **SWC minify**  
   Fast alternative, often close to esbuild output size.
4. **Google Closure Compiler (ADVANCED)**  
   Smallest potential output, highest migration risk (requires strict annotations/conventions).

Practical default: start with **esbuild** for speed and compare with **terser** in CI.

## Next step: principled size optimization

- Keep a **size budget** and fail CI if `dmax.prod.js` (raw/gzip/brotli) regresses.
- Split dev/test and prod paths permanently (current strip script is first step).
- Mark pure helper calls and collapse repeated literals/constants.
- Reduce parser/attribute grammar duplication by sharing one fast parsing path.
- Gate optional features behind explicit flags/build targets (`core`, `core+sse`, `full`).
- Prefer data-driven tables over repeated branching in hot paths where it reduces bytes.
- Track every feature with “bytes added / value added” in PR review.
