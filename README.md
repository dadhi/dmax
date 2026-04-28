# dmax

A tiny declarative web runtime driven by `data-*` attributes.

## Files

- `index.html` — current dev notebook (asserts + live examples)
- `dmax.js` — extracted runtime script loaded by `index.html`
- `index-wotking-slop.html` — previous `index.html` snapshot

## Runtime size

`dmax.js` (uncompressed, as of this change): **110,147 bytes**.

## Syntax used by current `index.html`

### Core directives

- `data-def` — define signal state
- `data-sub` — subscribe and update signals/props with expression results
- `data-sync` — signal/prop synchronization
- `data-class` — class toggling
- `data-disp` — show/hide elements
- `data-dump` — render array items via templates
- `data-get|post|put|patch|delete` — declarative HTTP actions

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
| `fixi.js` | Declarative HTTP requests triggered from HTML, with target selection and swap strategies | **Partial overlap** via `data-get|post|put|patch|delete`, plus `^busy`, `^err`, `^code` result/status signals | dmax covers declarative requests. It does **not** yet expose Fixi's small HTML-targeted swap model (`fx-target`, `fx-swap`) as directly. |
| `moxi.js` | `on-*` inline handlers, `live` expressions, `q()` DOM query helper, event modifiers | **Strong overlap, different design** via `data-def`, `data-sub`, `data-sync`, `data-class`, `data-disp`, `data-dump` | dmax is stronger on explicit signals and list/state directives. moxi is stronger on imperative DOM scripting and query ergonomics. |
| `ssexi.js` | Streams `text/event-stream` responses into the DOM and emits SSE lifecycle events | **Missing / planned** | This matches open issue #10. dmax still needs Datastar-compatible SSE/event-stream support and stream routing. |
| `paxi.js` | Morph-based DOM patching that preserves focus/form state better than replacement | **Partial overlap** via dmax's existing in-place morph / OOB morph path | dmax already has a morph implementation, but paxi's version is smaller, more isolated, and more opinionated about keeping only the fast path. |
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
- A smaller and more isolated morph layer (`paxi`) with a stricter fast-path feature budget.
- Built-in SSE streaming semantics (`ssexi`) with clear lifecycle hooks.
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
| Native APIs first (`fetch`, `MutationObserver`, Streams, `TextDecoder`) | Avoids wrapper layers and duplicate state | dmax already leans this way | Keep extending features through native primitives rather than introducing generic abstraction layers |
| Very small surface per library | Optional functionality does not bloat the base runtime | dmax is a single integrated runtime | Consider splitting future optional pieces such as SSE or imperative fetch helpers into small companion files instead of expanding the core grammar |
| Single interception seam (`ssexi` uses one `fx:config` hook) | Extensions can piggyback on one stable hook instead of spreading logic across many call sites | dmax tends to wire behavior directly into the runtime | Add narrow extension seams for actions/streams so new behavior can stay out of the hot core path |
| Streaming parse with async generator + incremental reader | Lowers peak memory and improves first-update latency because the full response is never buffered | dmax does not yet expose SSE streaming | Reuse this approach for SSE support: parse incrementally, emit/update per message, and avoid building large intermediate strings |
| Strict morph fast path (`paxi`) | Keeps node reuse cheap by focusing on id matching and direct tree reconciliation, not callbacks/plugins | dmax already has an in-place morph implementation | Keep dmax morph small and opinionated; resist adding callback-heavy or plugin-heavy morph features that would slow the common case |
| Targeted discovery instead of broad scans (`moxi` uses XPath to find only relevant nodes) | Avoids visiting unrelated DOM nodes and cuts setup work | dmax still has places where clone wiring walks descendants and repeats directive setup work | Prefer one targeted walk/discovery pass per subtree and avoid repeated `querySelectorAll`-style scans during dump/template wiring |
| Cheap cleanup of dead reactive work (`moxi` removes `live` expressions for detached nodes) | Reduces memory retention and unnecessary reruns | dmax already preserves some cleanup state on matched nodes | Be stricter about cleaning subscriptions and per-node bookkeeping when nodes are removed or replaced |
| Narrow non-goals (no queueing/history/interceptor stacks in core) | Prevents permanent runtime cost for rarely used features | dmax already has some explicit minimalism, but keeps accumulating capabilities | Document stronger non-goals for the core runtime so convenience features do not silently become permanent cost centers |
| Tiny imperative escape hatch (`rexi`) instead of growing the declarative core | Lets uncommon cases exist without complicating the main DSL | dmax has declarative actions but no small imperative helper | If imperative requests are needed, add a tiny helper instead of expanding action grammar for every edge case |

### Highest-value ideas to adopt first

If the goal is speed + memory reduction + simplicity, the highest-value Fixi-inspired moves for dmax look like:

1. **Keep SSE as a narrow extension seam** rather than baking a large streaming subsystem into every action path.
2. **Keep morph opinionated and small** instead of turning it into a large configurable diff engine.
3. **Reduce repeated DOM discovery/wiring passes** during `data-dump` and other subtree setup work.
4. **Tighten cleanup of detached subscriptions/state** so long-lived pages retain less bookkeeping.
5. **Protect the core with explicit non-goals** so future features do not erode the runtime's fast path.

### What is still missing on both sides

- A unified parity matrix against Datastar's broader scenarios such as unusual attribute updates (`style`, links, canvas, etc.).
- Better support for keyed list reconciliation and stable DOM preservation during collection updates.
- A final integrated design for SSE + morph together in dmax.
- A clear decision on whether dmax should add imperative escape hatches, or keep the current signal-first model intentionally strict.

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
```

`^busy.post-loading^err.post-error^code.post-code` reuses modifier syntax for action status signals instead of special positional parsing, and lets each action expose independent loading/error/code indicators.

## Compression question

Yes — you can compress `dmax.js` without Node/npm libraries.

Examples:

```bash
gzip -k -9 dmax.js
brotli -k -q 11 dmax.js
```

Then serve compressed assets with `Content-Encoding: gzip` or `br`.
