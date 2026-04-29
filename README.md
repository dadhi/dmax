# dmax

A tiny declarative web runtime driven by `data-*` attributes.

## Files

- `index.html` — current dev notebook (asserts + live examples)
- `dmax.js` — extracted runtime script loaded by `index.html`
- `index-wotking-slop.html` — previous `index.html` snapshot

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
| `ssexi.js` | Streams `text/event-stream` responses into the DOM and emits SSE lifecycle events | **Strong overlap** — action responses accept `text/event-stream` and apply `dmax-patch-elements` / `dmax-patch-signals` **incrementally** via `ReadableStream` + `TextDecoder`; **`^open.<signal>`/`^close.<signal>` lifecycle signals and `^retry.N` auto-reconnect on drop are now supported; `^abort.<signal>` lets callers cancel in-flight requests declaratively** | Long-lived persistent SSE connections use the same `data-get` grammar; reconnect semantics and lifecycle signals are now first-class. |
| `paxi.js` | Morph-based DOM patching that preserves focus/form state better than replacement | **Strong overlap** — dmax morphs matched nodes, preserves event listeners, caret/selection for focused inputs, and scroll position; **parity matrix tests now cover `style`, `href`, `data-*`, `aria-*`, canvas attribute updates, keyed list reconciliation, and mixed keyed/unkeyed collection stability** | Keyed-list reconciliation and stable DOM during collection updates are covered by the id-matching algorithm and validated by inline assertions. |
| `rexi.js` | Tiny imperative `fetch()` helper for code paths where declarative HTML is not enough | **Not planned** — the `^abort.<signal>` modifier covers the cancel use-case declaratively; uncommon imperative paths can use vanilla `fetch()` directly | dmax deliberately keeps the declarative grammar complete for the 80/20 cases; explicit imperative helpers are intentionally out-of-scope for the core runtime. |
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
| Native APIs first (`fetch`, `MutationObserver`, Streams, `TextDecoder`) | Avoids wrapper layers and duplicate state | dmax already leans this way — **the SSE action path now uses `ReadableStream` + `TextDecoder` for incremental consumption; `AbortController` is used for cancellation** | Keep extending features through native primitives rather than introducing generic abstraction layers |
| Small, direct code over large plugin surfaces | Avoids hook-dispatch overhead, keeps hot paths explicit, and makes the code easier to copy/fork/modify | dmax already prefers direct runtime code over plugin APIs | Keep internal helpers composable and readable instead of introducing a plugin boundary for every feature |
| Very small surface per library | Optional functionality does not bloat the base runtime | dmax is intentionally a single integrated runtime | Borrow the implementation ideas, but integrate them behind one consistent terse grammar instead of copying Fixi's package split |
| Single interception seam (`ssexi` uses one `fx:config` hook) | Extensions can piggyback on one stable hook instead of spreading logic across many call sites | dmax tends to wire behavior directly into the runtime | Reuse one internal action/SSE path so streaming, morphing, and signal patching stay consistent even without a public plugin system |
| Streaming parse with async generator + incremental reader | Lowers peak memory and improves first-update latency because the full response is never buffered | **Done:** `consumeDmaxSseStream` uses `body.getReader()` + `TextDecoder` for per-chunk incremental parsing; falls back to `res.text()` where the Streams API is unavailable | Keep the streaming path lean; lifecycle callbacks are now threaded through without extra allocations |
| Strict morph fast path (`paxi`) | Keeps node reuse cheap by focusing on id matching and direct tree reconciliation, not callbacks/plugins | dmax already has an in-place morph implementation — **now also preserves caret/selection for focused inputs and scroll position for scrollable elements; parity matrix tests validate style/href/data-*/aria/canvas attribute scenarios** | Keep dmax morph small and opinionated; resist adding callback-heavy or plugin-heavy morph features that would slow the common case |
| Targeted discovery instead of broad scans (`moxi` uses XPath to find only relevant nodes) | Avoids visiting unrelated DOM nodes and cuts setup work | dmax still has places where clone wiring walks descendants and repeats directive setup work | Prefer one targeted walk/discovery pass per subtree and avoid repeated `querySelectorAll`-style scans during dump/template wiring |
| Cheap cleanup of dead reactive work (`moxi` removes `live` expressions for detached nodes) | Reduces memory retention and unnecessary reruns | dmax already preserves some cleanup state on matched nodes | Be stricter about cleaning subscriptions and per-node bookkeeping when nodes are removed or replaced |
| Narrow non-goals (no queueing/history/interceptor stacks in core) | Prevents permanent runtime cost for rarely used features | dmax already has some explicit minimalism, but keeps accumulating capabilities | Document stronger non-goals for the core runtime so convenience features do not silently become permanent cost centers |
| Tiny imperative escape hatch (`rexi`) instead of growing the declarative core | Lets uncommon cases exist without complicating the main DSL | **`^abort.<signal>` covers the cancel use-case declaratively**; for genuinely imperative paths, vanilla `fetch()` is always available | The declarative grammar now covers the 80/20 case; an explicit imperative helper is intentionally out-of-scope |

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
- **SSE lifecycle semantics:** `^open.<signal>` fires when the stream opens, `^close.<signal>` when it closes cleanly; `^retry.N` auto-reconnects after drop or error (N = delay in ms, default 1000); `^abort.<signal>` stores a cancel function so a button or signal-driven action can abort the in-flight request via `AbortController`. Abort is treated as a clean cancel (not an error).
- **Parity matrix tests for unusual attribute updates:** inline assertions now cover `style`, `href`, `data-*`, `aria-*`, and `canvas` attribute patching via `morph`; keyed list reconciliation (reuse/reorder/add/remove by `id`); unkeyed list morphing in-place; and mixed keyed/unkeyed collections — verifying stable DOM node identity across all cases.

### What is still missing

- **A clear decision on imperative escape hatches:** whether dmax should add a `rexi`-style helper or keep the current signal-first model intentionally strict (current decision: intentionally strict; `^abort.<signal>` covers the cancel case declaratively).

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

<!-- persistent SSE with lifecycle signals and auto-reconnect -->
<!-- ^open.liveOn   → false→true when stream opens, true→false when it ends -->
<!-- ^close.liveDone → set to true on clean stream close                     -->
<!-- ^retry.2000    → auto-reconnect 2 s after drop or error                -->
<!-- ^abort.liveStop → dm.liveStop() cancels the in-flight request           -->
<button
  data-get^open.liveOn^close.liveDone^retry.2000^abort.liveStop@.click
  ="'/api/events'">
  Subscribe
</button>
<span data-disp:.@liveOn="dm.liveOn">● live</span>
<button data-sub:_@.click="dm.liveStop && dm.liveStop()">Cancel</button>
```

`^busy.post-loading^err.post-error^code.post-code` reuses modifier syntax for action status signals instead of special positional parsing, and lets each action expose independent loading/error/code indicators.

## SSE transport: `fetch` vs native `EventSource`

Both dmax and Datastar use `fetch` + `ReadableStream` for SSE rather than the browser-native `EventSource` API. The trade-offs are:

| Capability | Native `EventSource` | `fetch` + `ReadableStream` (dmax & Datastar) |
| --- | --- | --- |
| HTTP methods | **GET only** | Any method (POST, PUT, DELETE, …) |
| Custom request headers | **No** | Yes — `^headers.<signal>` |
| Request body | **No** | Yes — `+parameter` inputs |
| Cancellation | `.close()` on the instance only | `AbortController` via `^abort.<signal>` |
| Reconnect hooks | Browser-managed, uninterruptable | Fully controlled — `^retry.N` |
| Progressive stream processing | Browser-buffered internally | Chunk-by-chunk via `ReadableStream` |
| CORS credentials | `withCredentials` only | Full `fetch` options |

The main limitation of `fetch`-based SSE is that it does **not** get the browser's built-in automatic reconnect on network drop that `EventSource` provides; dmax therefore implements its own reconnect via `^retry.N`.

### Request data: Datastar sends all signals; dmax sends only what you name

This is a key design difference with meaningful trade-offs:

**Datastar's approach:** every signal in the store is bundled and sent to the server on each action request automatically (unless excluded). This minimises the attribute verbosity on the HTML element but sends the full client state on every call.

**dmax's approach:** nothing is sent unless you explicitly list it with a `+parameter` token. This gives precise control over what leaves the browser but requires more explicit attribute syntax. The `+_all` shorthand exists for the rare case where you genuinely want to send everything.

| | Datastar | dmax |
| --- | --- | --- |
| Default payload | All signals | Nothing (empty) |
| Send a specific signal | Always included | `+signalName` |
| Send all signals | Always | `+_all` |
| Spread object fields | Not applicable | `+some.path._all` |
| Per-call custom headers | Configured once | `^headers.<signal>` |

## Action input and modifier reference

### Request inputs (`+parameter`)

Inputs control what data is included in the request. By default, for **GET/DELETE** requests, inputs become URL query parameters; for **POST/PUT/PATCH** they become the request body. The `^url.X`, `^body.X`, and `^header.X` modifiers override this default per-signal.

| Token | Description |
| --- | --- |
| `+signalName` | Sends the named signal's value (query string on GET/DELETE, body otherwise) |
| `+signal.nested.path` | Sends the value at the given signal path |
| `+#elId.prop` | Reads the DOM property from the element with `id="elId"` |
| `+_all` | Sends every signal in the store as a flat object |
| `+some.path._all` | Spreads all fields of the nested object at `some.path` |

### Explicit routing modifiers: `^url`, `^body`, `^header`

These modifiers let you override the default routing for individual signals, independent of the HTTP method. Multiple instances can be combined on one action.

| Modifier | Description | Example |
| --- | --- | --- |
| `^url.<signalPath>` | Force `dm.<signalPath>` into the URL query string (even on POST/PUT). Key = last path segment. | `^url.page` appends `?page=<dm.page>` to the URL |
| `^body.<signalPath>` | Force `dm.<signalPath>` into the request body (even on GET/DELETE). Key = last path segment. | `^body.cursor` sends `dm.cursor` as a body field |
| `^header.<name>` | Set a single request header from `dm.<camelCase(name)>`. | `^header.authorization` sets header `authorization` from `dm.authorization` |

Note: all modifier names are converted from kebab-case to camelCase by the parser, so the resulting signal key and header key are always camelCase. For example, `^header.x-trace-id` reads `dm.xTraceId` and sets header `xTraceId` (HTTP headers are case-insensitive so `xTraceId` is valid). If you need exact header name control (e.g. `X-Trace-Id`), use `^headers.<signal>` with a plain object whose keys are your exact header names instead.

Examples:

```html
<!-- POST with page as query param and payload in body -->
<button data-post^url.page:res@.click+payload="'/api/items'">Load</button>

<!-- GET with cursor forced to request body -->
<button data-get^body.cursor+filter:res@.click="'/api/stream'">Stream</button>

<!-- GET with individual auth header from signal -->
<button data-get^header.authorization^header.x-trace-id:res@.click="'/api/secure'">Fetch</button>
```

### Request modifiers (`^modifier`)

- **`^json`** — `Content-Type: application/json` + `Accept: application/json`; body serialised as JSON
- **`^text`** — `Content-Type: text/plain`
- **`^form`** — `Content-Type: application/x-www-form-urlencoded`
- **`^no-cache`** — adds `Cache-Control: no-cache` / `Pragma: no-cache`
- **`^brotli`/`^br`, `^gzip`, `^deflate`, `^compress`** — set `Accept-Encoding`
- **`^headers.<signal>`** — copies all key-value pairs from the named signal object into request headers (e.g. `^headers.reqHeaders` where `dm.reqHeaders = { Authorization: 'Bearer …' }`)
- **`^url.<signalPath>`** — force specific signal to URL query string (see above)
- **`^body.<signalPath>`** — force specific signal to request body (see above)
- **`^header.<name>`** — set a single header from a named signal (see above)
- **`^replace`** (default), **`^merge`**, **`^append`**, **`^prepend`** — response result mode

### Response status signals

- **`^busy.<signal>`** — `true` while the request is in-flight
- **`^err.<signal>`** — set to the error if the request fails
- **`^code.<signal>`** — set to the HTTP status code

### SSE lifecycle modifiers (for `text/event-stream` responses)

- **`^open.<signal>`** — transitions `false→true` when the first stream chunk arrives; `true→false` when the stream ends or errors
- **`^close.<signal>`** — set to `true` on a clean (no-error) stream close
- **`^retry.N`** — auto-reconnect N ms after drop or error (default 1000 ms); skipped on deliberate abort via `^abort`
- **`^abort.<signal>`** — stores a cancel function in the signal; calling `dm.<signal>()` aborts the request (treated as a clean cancel, not an error)

For `dmax-patch-elements` with `mode: outer|inner`, dmax uses the built-in `morph(...)` implementation to preserve listeners/state while applying updates.
When `dmax-patch-elements` is sent without a `selector`, each top-level `dmaxElements` node must include an `id` so dmax can target existing DOM nodes.
Only `dmax-patch-elements` / `dmax-patch-signals` and `dmaxElements` / `dmaxSignals` are supported.
