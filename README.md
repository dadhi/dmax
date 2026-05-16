# dmax

A tiny declarative web runtime driven by `data-*` attributes.

## Files

Current size:

- `dmax.js` — 85,613 bytes
- `dist/dmax.min.js` — 44,721 bytes

- `index.html` — current dev notebook (asserts + live examples)
- `dmax.js` — extracted runtime script loaded by `index.html`
- `asserts.js` — notebook assert suite loaded after `dmax.js`
- `index-wotking-slop.html` — previous `index.html` snapshot
- `tools/bench-morph-sse.js` — semi-realistic dmax-vs-Datastar SSE/morph benchmark for pointed, OOB/single-fragment, and full-page swaps

## Semi-realistic SSE / morph benchmark

Run:

```bash
npm run build:min
npm run bench:morph-sse
# same benchmark, explicit parity alias
npm run bench:morph-sse:parity
# compatibility alias for the follow-up PR naming
npm run bench:morph-sse:all
# or for cleaner heap deltas
node --expose-gc tools/bench-morph-sse.js
```

The benchmark mounts the same 32×32 spreadsheet-like grid in isolated jsdom windows for dmax and Datastar. It uses the vendored `tools/vendor/datastar.js` bundle and dispatches Datastar's `datastar-merge-fragments` SSE event path directly, so the parity run does **not** require adding `@starfederation/datastar` as a package dependency.

To refresh vendored browser bundles:

```bash
npm run vendor:libs
# or include optional extras such as moxi too
npm run vendor:libs:all
```

This pulls npm tarballs for Datastar and the Fixi stack (`fixi-js`, `@bigskysoftware/paxi-js`, `@bigskysoftware/rexi-js`, `@bigskysoftware/ssexi-js`; plus `@bigskysoftware/moxi-js` with `:all`) into `tools/vendor/` and updates `tools/vendor/manifest.json`. For Datastar it prefers the newest stable release over beta tags.

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

- `data-m-si` — define signal state
- `data-m-ex` — subscribe and update signals/props with expression results, including `^rw` two-way sync
- `data-m-cl` — class toggling
- `data-m-sh` — show/hide elements
- `data-m-it` — render array items via templates
- `data-m-no` — ignore subtree scanning and/or morphing (`data-m-no`, `data-m-no^scan`, `data-m-no^morph`)
- `data-m-get|post|put|patch|delete` — declarative HTTP actions
- dmax SSE (`text/event-stream`) in actions:
  - `event: dmax-patch-elements` (`mode`: `outer|inner|replace|prepend|append|before|after|remove`, `selector`, `namespace`, `dmaxElements`)
  - `event: dmax-patch-signals` (`dmaxSignals` JSON merge patch, optional `onlyIfMissing true`)

### Token grammar

- `:target` signal/prop targets
- `@trigger` signal/event/prop triggers
- `+input` action inputs
- `^mod` modifiers (timing/guards/options)
- `!name` negation in applicable places
- `data-m-it` placeholders inside templates:
  - `$it` — current item expression
  - `$ix` — current zero-based index

For two-way sync, put `^rw` on the element/property trigger you want to write back from, e.g. `data-m-ex@.^rw@user.name` or `data-m-ex@.^val.value^rw@user.name`.

Signal names are not reserved or validated against runtime helper identifiers. If you choose names that overlap with your own expression conventions, that is the template author's responsibility.

Bracket-index signal paths support **constant numeric indices only** in directive names, e.g. `@posts[0]` or `:post-objs[1].title`. Variable bracket indices such as `@posts[idx]` are intentionally unsupported; use a plain expression like `dm.posts[dm.idx]` in the attribute value when you need runtime lookup logic.

Reactive setup is immediate by default for `data-m-si`, signal-backed `data-m-ex`, `data-m-ex^rw`, `data-m-it`, and `data-m-dbg`. Use `^notimmediate` when you want to defer the initial run; actions stay non-immediate unless you opt into `^immediate` or use the `_init` trigger.

### Special triggers

Special triggers use a `_name` prefix in the `@trigger` token:

| Trigger | Description |
| --- | --- |
| `@_init` | Fires **once** when the attribute is first wired (page/attribute load). No ongoing subscription. |
| `@_window.<event>` | Listens on `window` for the given event (default: `resize`) |
| `@_document.<event>` | Listens on `document` for the given event (default: `visibilitychange`) |
| `@_form.<event>` | Listens on the nearest ancestor `<form>` for the given event (default: `submit`) |
| `@_interval.<ms>` | Fires repeatedly every `<ms>` milliseconds (default: 500 ms) |
| `@_timeout.<ms>` | Fires once after `<ms>` milliseconds (default: 500 ms) |
| `@_viewed` | Fires once when the element enters the viewport (uses `IntersectionObserver`) |

**`_init` examples:**

```html
<!-- run expression once on page load -->
<span data-m-ex:.@_init="'Loaded at ' + new Date().toLocaleTimeString()"></span>

<!-- fire on init AND on each click -->
<span data-m-ex:.@_init@.click="'Last: ' + (detail && detail.type)"></span>

<!-- fire HTTP request on page load (no button click needed) -->
<div data-m-get^busy.loading:result@_init="'/api/data'"></div>
```

The `_init` trigger fires exactly once when dmax wires the element. When combined with other triggers (e.g. `@_init@.click`), `_init` fires at wire-up and the other triggers fire on their events. If a signal trigger that fires at init (default behaviour) is listed before `@_init` in the same attribute, the `_init` run is skipped to avoid double-firing.

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
| `fixi.js` | Declarative HTTP requests triggered from HTML, with target selection and swap strategies | **Partial overlap** via `data-m-get|post|put|patch|delete`, plus `^busy`, `^complete`, `^err`, `^code` result/status signals | dmax covers declarative requests. It does **not** yet expose Fixi's small HTML-targeted swap model (`fx-target`, `fx-swap`) as directly. |
| `moxi.js` | `on-*` inline handlers, `live` expressions, `q()` DOM query helper, event modifiers | **Strong overlap, different design** via `data-m-si`, `data-m-ex`, `data-m-cl`, `data-m-sh`, `data-m-it` | dmax is stronger on explicit signals and list/state directives. moxi is stronger on imperative DOM scripting and query ergonomics. |
| `ssexi.js` | Streams `text/event-stream` responses into the DOM and emits SSE lifecycle events | **Strong overlap** — action responses accept `text/event-stream` and apply `dmax-patch-elements` / `dmax-patch-signals` incrementally via `ReadableStream` + `TextDecoder`; `^open`/`^close` lifecycle signals, `^retry.N` auto-reconnect, and `^abort` cancellation are all supported | Long-lived persistent SSE connections use the same `data-m-get` grammar; lifecycle signals are first-class. |
| `paxi.js` | Morph-based DOM patching that preserves focus/form state better than replacement | **Strong overlap** — dmax morphs matched nodes, preserves event listeners, caret/selection for focused inputs, and scroll position; parity matrix tests cover `style`, `href`, `data-*`, `aria-*`, canvas attribute updates, keyed list reconciliation, and mixed keyed/unkeyed collection stability | Keyed-list reconciliation and stable DOM identity are covered by the id-matching algorithm and validated by inline assertions. |
| `rexi.js` | Tiny imperative `fetch()` helper for code paths where declarative HTML is not enough | **Not planned** — the `^abort.<signal>` modifier covers the cancel use-case declaratively; uncommon imperative paths can use vanilla `fetch()` directly | dmax deliberately keeps the declarative grammar complete for the 80/20 cases; explicit imperative helpers are intentionally out-of-scope for the core runtime. |
| Combined bundle | Composable micro-libraries that can be mixed as needed | **Different trade-off**: dmax is one integrated signal-first runtime | Fixi is more modular. dmax is more unified. |

### What dmax already has that Fixi does not

- A first-class signal store (`data-m-si`) rather than DOM-only/local imperative state.
- Declarative signal/property synchronization via `data-m-ex`, including one-way and `^rw` two-way flows.
- Signal-driven class/visibility/list directives (`data-m-cl`, `data-m-sh`, `data-m-it`).
- Shape-aware updates and signal modifiers for gating/timing.
- A more unified attribute grammar across signals, props, events, and actions.

### What Fixi has that dmax can likely borrow

- A dedicated HTML swap model (`target` + `swap`) rather than only mapping request results into signals.
- `paxi`'s stricter morph fast-path discipline: keep the common reconciliation case tiny, direct, and hard to accidentally slow down.
- A lightweight imperative companion (`moxi`) for the cases where declarative dataflow is awkward.

## Example

```html
<div data-m-si='{"count":0,"active":true}'></div>

<button data-m-ex:count@.click="dm.count + 1">+1</button>
<span data-m-ex:.@count></span>

<input data-m-ex@.^rw@user.name>
<div data-m-cl+active+!inactive@active="dm.active"></div>

<button data-m-get^busy.post-loading^err.post-error^code.post-code:post-result@.click="'https://jsonplaceholder.typicode.com/posts/1'">
  Load
</button>
<strong data-m-sh@post-loading>Loading…</strong>
<span data-m-ex:.@post-error></span>
<span data-m-ex:.@post-code></span>

<!-- request spread + dynamic headers + merge result -->
<button
  data-m-post^json^merge^hs.req-headers:profile@.click+user^spread
  ="'/api/profile/update'">
</button>

<!-- patch matching existing root signals from a bootstrap payload -->
<button data-m-get^patch-all@.click="'/api/bootstrap'"></button>

<!-- persistent SSE with lifecycle signals and auto-reconnect -->
<button
  data-m-get^open.live-on^close.live-done^retry.2000^abort.live-stop@.click
  ="'/api/events'">
  Subscribe
</button>
<span data-m-sh@live-on>● live</span>
<button data-m-ex@.click="dm.liveStop && dm.liveStop()">Cancel</button>
```

`^busy.post-loading^err.post-error^code.post-code` reuses modifier syntax for action status signals, giving each action independent loading/error/code indicators.

## SSE transport: `fetch` vs native `EventSource`

Both dmax and Datastar use `fetch` + `ReadableStream` for SSE rather than the browser-native `EventSource` API. The trade-offs are:

| Capability | Native `EventSource` | `fetch` + `ReadableStream` (dmax & Datastar) |
| --- | --- | --- |
| HTTP methods | **GET only** | Any method (POST, PUT, DELETE, …) |
| Custom request headers | **No** | Yes — `^hs.<signal>` |
| Request body | **No** | Yes — `+parameter` inputs |
| Cancellation | `.close()` on the instance only | `AbortController` via `^abort.<signal>` |
| Reconnect hooks | Browser-managed, uninterruptable | Fully controlled — `^retry.N` |
| Progressive stream processing | Browser-buffered internally | Chunk-by-chunk via `ReadableStream` |
| CORS credentials | `withCredentials` only | Full `fetch` options |

The main limitation of `fetch`-based SSE is that it does **not** get the browser's built-in automatic reconnect on network drop that `EventSource` provides; dmax therefore implements its own reconnect via `^retry.N`.

### Request data: Datastar sends all signals; dmax sends only what you name

This is a key design difference with meaningful trade-offs:

**Datastar's approach:** every signal in the store is bundled and sent to the server on each action request automatically (unless excluded). This minimises the attribute verbosity on the HTML element but sends the full client state on every call.

**dmax's approach:** nothing is sent unless you explicitly list it with a `+parameter` token or opt into a dedicated action modifier such as `^send-all`. This gives precise control over what leaves the browser while keeping the syntax systematic.

| | Datastar | dmax |
| --- | --- | --- |
| Default payload | All signals | Nothing (empty) |
| Send a specific signal | Always included | `+signalName` |
| Send all signals | Always | `^send-all` |
| Spread object fields | Not applicable | `+some.path^spread` |
| Per-call custom headers | Configured once | `^hs.<signal>` |

## Action input and modifier reference

### Request inputs (`+parameter`)

Inputs control what data is included in the request. By default, for **GET/DELETE** requests, inputs become URL query parameters; for **POST/PUT/PATCH** they become the request body. The `^url.X`, `^body.X`, and `^header.X` modifiers override this default per-signal.

| Token | Description |
| --- | --- |
| `+signalName` | Sends the named signal's value (query string on GET/DELETE, body otherwise) |
| `+signal.nested.path` | Sends the value at the given signal path |
| `+signalName^spread` | Spreads the named object's own fields into the request payload/query |
| `+signal.nested.path^spread` | Spreads the nested object's own fields into the request payload/query |
| `+#elId.prop` | Reads the DOM property from the element with `id="elId"` |

### Action-wide payload/patch modifiers

| Modifier | Description |
| --- | --- |
| `^send-all` | Spreads every current signal into the request body object |
| `^patch-all` | Patches matching existing root signals from top-level JSON response fields |
| `^sync-all` | Combines `^send-all` and `^patch-all` on one action |

### Explicit routing modifiers: `^url`, `^body`, `^header`, `^hs`

These modifiers let you override the default routing for individual signals, independent of the HTTP method. Multiple instances can be combined on one action.

| Modifier | Description | Example |
| --- | --- | --- |
| `^url.<signalPath>` | Force `dm.<signalPath>` into the URL query string (even on POST/PUT). Key = last path segment. | `^url.page` appends `?page=<dm.page>` to the URL |
| `^body.<signalPath>` | Force `dm.<signalPath>` into the request body (useful on DELETE; avoid on GET — bodies are non-standard there). Key = last path segment. | `^body.target-id` sends `dm.targetId` as a body field on DELETE |
| `^header.<name>` | Set a single request header from the matching signal while preserving the header name in kebab-case. | `^header.authorization` sets header `authorization` from `dm.authorization` |
| `^auth.<signalPath>` | Shorthand for the `authorization` header using the named signal's value. | `^auth.authorization` sets header `authorization` from `dm.authorization` |

Note: keep every signal path in the **data attribute name** kebab-case because HTML attribute names are case-insensitive. dmax still resolves those paths to camelCase signals internally, so `^header.x-trace-id` reads `dm.xTraceId` and sets header `x-trace-id`. Likewise `^hs.req-headers` copies `dm.reqHeaders` object fields into headers after camelCase→kebab-case normalization by default; add `^hs-no-kebab` alongside `^hs.<signal>` if you need to preserve exact object key casing.

Examples:

```html
<!-- POST — force page/sort into URL query string, send payload in body -->
<button data-m-post^url.page^url.sort:res@.click+payload="'/api/items'">Create</button>

<!-- DELETE — force the ID into the request body instead of URL query string -->
<button data-m-delete^body.target-id:res@.click="'/api/items'">Delete</button>

<!-- GET with individual auth header from a signal -->
<button data-m-get^header.authorization:res@.click="'/api/secure'">Fetch</button>
```

> **Note on `^body.X` and GET**: sending a request body on GET is non-standard and many servers/proxies ignore it. Prefer using `^body.X` with POST/PUT/PATCH/DELETE where a body is semantically appropriate.

### Request modifiers (`^modifier`)

- **`^json`** — `content-type: application/json` + `accept: application/json`; body serialised as JSON
- **`^text`** — `content-type: text/plain`
- **`^html`** — `accept: text/html`
- **`^form`** — `content-type: application/x-www-form-urlencoded`
- **`^no-cache`** — adds `cache-control: no-cache` / `pragma: no-cache`
- **`^brotli`/`^br`, `^gzip`, `^deflate`, `^compress`** — set `accept-encoding`
- **`^hs.<signal>`** — copies all key-value pairs from the named signal object into request headers after camelCase→kebab-case normalization (e.g. `^hs.req-headers` where `dm.reqHeaders = { xTraceId: 'req-1' }` sends `x-trace-id: req-1`)
- **`^hs-no-kebab`** — use alongside `^hs.<signal>` to preserve the source object keys exactly as written
- **`^url.<signalPath>`** — force specific signal to URL query string (see above)
- **`^body.<signalPath>`** — force specific signal to request body (see above)
- **`^header.<name>`** — set a single header from a named signal (see above)
- **`^auth.<signalPath>`** — set the `authorization` header from a named signal (see above)
- **`^replace`** (default), **`^merge`**, **`^append`**, **`^prepend`** — response result mode for JSON signals; for `^html` responses these map directly to DOM modes (see matrix below)
- **`^before`**, **`^after`**, **`^inner`**, **`^remove`** — HTML DOM-only modes (see matrix below)

### `^html` response DOM update matrix

When an action with `^html` receives a `text/html` response, dmax applies the HTML to the live DOM. Elements are matched by their `id` attribute unless a selector is provided.

| Client mods | DOM mode | Target resolution | Behaviour |
| --- | --- | --- | --- |
| `^html` *(default)* | `outer` | element `id` from HTML response | morph in-place — preserves form state |
| `^html^replace` | `replace` | element `id` from HTML response | `replaceWith` — discards old node |
| `^html^inner` | `inner` | element `id` from HTML response | morph children only — outer node kept |
| `^html^remove` | `remove` | element `id` from HTML response | removes matched node |
| `^html^before` | `before` | action element itself | insert before the action element |
| `^html^before.sig` | `before` | `dm.sig` CSS selector | insert before selector target |
| `^html^after` | `after` | action element itself | insert after the action element |
| `^html^after.sig` | `after` | `dm.sig` CSS selector | insert after selector target |
| `^html^append.sig` | `append` | `dm.sig` CSS selector | insert at end of selector target |
| `^html^prepend.sig` | `prepend` | `dm.sig` CSS selector | insert at start of selector target |
| `^html^inner.sig` | `inner` | `dm.sig` CSS selector | morph children of selector target |
| `^html^replace.sig` | `replace` | `dm.sig` CSS selector | `replaceWith` on selector target |
| `^html^remove.sig` | `remove` | `dm.sig` CSS selector | removes all `querySelectorAll` matches |

For `.sig` mods: `dm.sig` can hold any CSS selector (`'#id'`, `'.class'`, `'[attr]'`, etc.). When the signal value is not a string starting with a recognised CSS selector character (`#`, `.`, `[`, `*`, `:`), it is treated as a bare element `id` and prefixed with `#` (e.g. `^before.my-list` with no signal → `#my-list`). To use a kebab-case element id, store the selector in a signal: `dm.insertAfter = '#my-list-item'`.

**Examples:**

```html
<!-- Morph element with id="result" in place (default) -->
<button data-m-get^html@.click="'/api/fragment'">Load</button>

<!-- Insert new content before this button -->
<button id="add-btn" data-m-post^html^before@.click="'/api/new-item'">Add</button>

<!-- Insert after a signal-specified target -->
<button data-m-post^html^after.insert-after@.click="'/api/new-item'">Add</button>
<!-- dm.insertAfter = '#item-42' -->

<!-- Append items into a list -->
<button data-m-get^html^append.items-list@.click="'/api/more'">Load more</button>
<!-- dm.itemsList = '#item-list' -->

<!-- Replace element (no morph) -->
<button data-m-get^html^replace@.click="'/api/fresh'">Refresh</button>
```

### `data-m-no` subtree opt-out

Use `data-m-no` when a subtree should stay outside dmax control.

| Attribute | Effect |
| --- | --- |
| `data-m-no` | Skip both directive scanning/wiring and DOM morph updates for the subtree |
| `data-m-no^scan` | Skip directive scanning/wiring only |
| `data-m-no^morph` | Skip DOM morph updates only |

Example:

```html
<!-- third-party widget: dmax must not touch it at all -->
<div data-m-no></div>

<!-- server may replace siblings, but this widget keeps its own DOM -->
<div data-m-no^morph id="chart-root"></div>

<!-- subtree is static from dmax's point of view; do not scan directives inside -->
<div data-m-no^scan>
  <template id="external-template"></template>
</div>
```

### SSE `dmax-patch-elements` update matrix

Sent by the server as `event: dmax-patch-elements` in an SSE stream:

| `mode` field | Matching | Behaviour |
| --- | --- | --- |
| `outer` *(default)* | element `id` or `selector` | morph in-place — preserves form state |
| `inner` | element `id` or `selector` | morph children only — outer node kept |
| `replace` | element `id` or `selector` | `replaceWith` — destroys old node |
| `append` | CSS `selector` | insert at end of target |
| `prepend` | CSS `selector` | insert at start of target |
| `before` | CSS `selector` | insert before target |
| `after` | CSS `selector` | insert after target |
| `remove` | element `id` or `selector` | remove target |

When a `selector` field is present, `querySelectorAll` is used; otherwise each source element is matched to the live DOM by its `id` attribute via `getElementById`. Morph (`outer`/`inner`) preserves event listeners, focus, caret position, and scroll position.

### dmAct full response matrix

| Response `content-type` | Client mod required | Behaviour |
| --- | --- | --- |
| `text/event-stream` | `^sse` | incremental stream; applies `dmax-patch-elements` / `dmax-patch-signals` as each chunk arrives |
| `text/html` | `^html` | calls HTML DOM update path (see `^html` matrix above) — signal storage skipped |
| `application/json` | *(default or `^json`)* | stored in signal target; `^patch-all`/`^sync-all` also patches matching root signals |
| `text/plain` | `^text` | stored as string signal value |

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
<button data-m-get^busy.loading^complete.done:res@.click="'/api/data'">Load</button>
<span data-m-sh:.@loading>⏳ loading…</span>
<span data-m-sh:.@done="dm.done && !dm.loading">✅ done</span>
```

### SSE lifecycle modifiers (for `text/event-stream` responses)

- **`^open.<signal>`** — transitions `false→true` when the first stream chunk arrives; `true→false` when the stream ends or errors
- **`^close.<signal>`** — set to `true` on a clean (no-error) stream close
- **`^retry.N`** — auto-reconnect N ms after drop or error (default 1000 ms); skipped on deliberate abort via `^abort`
- **`^abort.<signal>`** — stores a cancel function in the signal; calling `dm.<signal>()` aborts the request (treated as a clean cancel, not an error)

For `dmax-patch-elements` with `mode: outer|inner`, dmax uses the built-in `morph(...)` implementation to preserve listeners/state while applying updates.
When `dmax-patch-elements` is sent without a `selector`, each top-level `dmaxElements` node must include an `id` so dmax can target existing DOM nodes.
Only `dmax-patch-elements` / `dmax-patch-signals` and `dmaxElements` / `dmaxSignals` SSE event types are supported.
