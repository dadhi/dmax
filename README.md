# dmax

A tiny declarative web runtime driven by `data-*` attributes.

## Files

- `index.html` — current dev notebook (asserts + live examples)
- `dmax.js` — extracted runtime script loaded by `index.html`
- `index-wotking-slop.html` — previous `index.html` snapshot
- `tools/bench-morph-sse.js` — semi-realistic dmax-vs-Datastar SSE/morph benchmark for pointed, OOB/single-fragment, and full-page swaps

## Semi-realistic SSE / morph benchmark

Run:

```bash
npm run bench:morph-sse
# same benchmark, explicit parity alias
npm run bench:morph-sse:parity
# compatibility alias for the follow-up PR naming
npm run bench:morph-sse:all
# or for cleaner heap deltas
node --expose-gc tools/bench-morph-sse.js
```

The benchmark mounts the same 32×32 spreadsheet-like grid in isolated jsdom windows for dmax and Datastar. It uses the vendored `tools/vendor/datastar.js` bundle and dispatches Datastar's `datastar-merge-fragments` SSE event path directly, so the parity run does **not** require adding `@starfederation/datastar` as a package dependency.

`jsdom` is still required as the DOM host. Normally it is loaded from `node_modules` via `npm install`. If npm access is blocked, a complete jsdom package tree may be checked in under `tools/vendor/jsdom`; unlike Datastar, jsdom is not a single-file browser bundle and its transitive dependencies must be vendored with it.

A manual GitHub Actions workflow is available at `.github/workflows/bench-morph-sse.yml` to run the parity benchmark in a clean Node 22 cloud environment.

It reports timing and heap deltas for:

- dmax pointed SSE patch updates vs Datastar pointed merge-fragments
- dmax OOB morph updates vs Datastar single-fragment morph updates
- full-page morph swaps with a small diff
- full-page replace/outer swaps with a small diff
- full-page morph swaps with a large diff
- full-page replace/outer swaps with a large diff

This gives a repeatable local parity baseline for the exact high-frequency update patterns discussed in the performance issue.

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

- `fixi.js` — declarative HTTP requests + HTML swapping
- `moxi.js` — inline handlers + DOM-driven reactivity
- `ssexi.js` — SSE streaming for `fixi`
- `paxi.js` — DOM morphing
- `rexi.js` — tiny imperative `fetch()` wrapper

### Matrix

| Fixi piece | What it does | dmax status today | Gap / takeaway |
| --- | --- | --- | --- |
| `fixi.js` | Declarative HTTP requests triggered from HTML, with target selection and swap strategies | **Partial overlap** via `data-get|post|put|patch|delete`, plus `^busy`, `^complete`, `^err`, `^code` result/status signals | dmax covers declarative requests. It does **not** yet expose Fixi's small HTML-targeted swap model (`fx-target`, `fx-swap`) as directly. |
| `moxi.js` | `on-*` inline handlers, `live` expressions, `q()` DOM query helper, event modifiers | **Strong overlap, different design** via `data-def`, `data-sub`, `data-sync`, `data-class`, `data-disp`, `data-dump` | dmax is stronger on explicit signals and list/state directives. moxi is stronger on imperative DOM scripting and query ergonomics. |
| `ssexi.js` | Streams `text/event-stream` responses into the DOM and emits SSE lifecycle events | **Strong overlap** — action responses accept `text/event-stream` and apply `dmax-patch-elements` / `dmax-patch-signals` incrementally via `ReadableStream` + `TextDecoder`; `^open`/`^close` lifecycle signals, `^retry.N` auto-reconnect, and `^abort` cancellation are all supported | Long-lived persistent SSE connections use the same `data-get` grammar; lifecycle signals are first-class. |
| `paxi.js` | Morph-based DOM patching that preserves focus/form state better than replacement | **Strong overlap** — dmax morphs matched nodes, preserves event listeners, caret/selection for focused inputs, and scroll position; parity matrix tests cover `style`, `href`, `data-*`, `aria-*`, canvas attribute updates, keyed list reconciliation, and mixed keyed/unkeyed collection stability | Keyed-list reconciliation and stable DOM identity are covered by the id-matching algorithm and validated by inline assertions. |
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
- A lightweight imperative companion (`moxi`) for the cases where declarative dataflow is awkward.

## Example

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
<button
  data-get^open.liveOn^close.liveDone^retry.2000^abort.liveStop@.click
  ="'/api/events'">
  Subscribe
</button>
<span data-disp:.@liveOn="dm.liveOn">● live</span>
<button data-sub:_@.click="dm.liveStop && dm.liveStop()">Cancel</button>
```

`^busy.post-loading^err.post-error^code.post-code` reuses modifier syntax for action status signals, giving each action independent loading/error/code indicators.

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
| `^body.<signalPath>` | Force `dm.<signalPath>` into the request body (useful on DELETE; avoid on GET — bodies are non-standard there). Key = last path segment. | `^body.targetId` sends `dm.targetId` as a body field on DELETE |
| `^header.<name>` | Set a single request header from `dm.<camelCase(name)>`. | `^header.authorization` sets header `authorization` from `dm.authorization` |

Note: all modifier names are converted from kebab-case to camelCase by the parser, so the resulting signal key and header key are always camelCase. For example, `^header.x-trace-id` reads `dm.xTraceId` and sets header `xTraceId` (HTTP headers are case-insensitive so `xTraceId` is valid). If you need exact header name control (e.g. `X-Trace-Id`), use `^headers.<signal>` with a plain object whose keys are your exact header names instead.

Examples:

```html
<!-- POST — force page/sort into URL query string, send payload in body -->
<button data-post^url.page^url.sort:res@.click+payload="'/api/items'">Create</button>

<!-- DELETE — force the ID into the request body instead of URL query string -->
<button data-delete^body.targetId:res@.click="'/api/items'">Delete</button>

<!-- GET with individual auth header from a signal -->
<button data-get^header.authorization:res@.click="'/api/secure'">Fetch</button>
```

> **Note on `^body.X` and GET**: sending a request body on GET is non-standard and many servers/proxies ignore it. Prefer using `^body.X` with POST/PUT/PATCH/DELETE where a body is semantically appropriate.

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

Three signals let you track every phase of a request's lifecycle:

| Signal | Not started | In-flight | Completed |
| --- | --- | --- | --- |
| `^busy.<signal>` | `false` | `true` | `false` |
| `^complete.<signal>` | `false` | `false` | `true` |

- **`^busy.<signal>`** — `true` while the request is in-flight; `false` before and after
- **`^complete.<signal>`** — `false` before the request starts and while it is in-flight; `true` once it finishes (success, error, or abort). Use together with `^busy` to distinguish "not yet started" from "already done".
- **`^err.<signal>`** — set to the error message if the request fails (not set on abort)
- **`^code.<signal>`** — set to the HTTP status code on completion

Example:

```html
<!-- show spinner while busy, show checkmark once done -->
<button data-get^busy.loading^complete.done:res@.click="'/api/data'">Load</button>
<span data-disp:.@loading="dm.loading">⏳ loading…</span>
<span data-disp:.@done="dm.done && !dm.loading">✅ done</span>
```

### SSE lifecycle modifiers (for `text/event-stream` responses)

- **`^open.<signal>`** — transitions `false→true` when the first stream chunk arrives; `true→false` when the stream ends or errors
- **`^close.<signal>`** — set to `true` on a clean (no-error) stream close
- **`^retry.N`** — auto-reconnect N ms after drop or error (default 1000 ms); skipped on deliberate abort via `^abort`
- **`^abort.<signal>`** — stores a cancel function in the signal; calling `dm.<signal>()` aborts the request (treated as a clean cancel, not an error)

For `dmax-patch-elements` with `mode: outer|inner`, dmax uses the built-in `morph(...)` implementation to preserve listeners/state while applying updates.
When `dmax-patch-elements` is sent without a `selector`, each top-level `dmaxElements` node must include an `id` so dmax can target existing DOM nodes.
Only `dmax-patch-elements` / `dmax-patch-signals` and `dmaxElements` / `dmaxSignals` are supported.
