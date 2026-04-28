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
| `fixi.js` | Declarative HTTP requests triggered from HTML, with target selection and swap strategies | **Partial overlap** via `data-get|post|put|patch|delete`, plus `^busy`, `^err`, `^code` result/status signals | dmax covers declarative requests. It does **not** yet cover Fixi's HTML-targeted swap model (`fx-target`, `fx-swap`). |
| `moxi.js` | `on-*` inline handlers, `live` expressions, `q()` DOM query helper, event modifiers | **Strong overlap, different design** via `data-def`, `data-sub`, `data-sync`, `data-class`, `data-disp`, `data-dump` | dmax is stronger on explicit signals and list/state directives. moxi is stronger on imperative DOM scripting and query ergonomics. |
| `ssexi.js` | Streams `text/event-stream` responses into the DOM and emits SSE lifecycle events | **Missing / planned** | This matches open issue #10. dmax still needs Datastar-compatible SSE/event-stream support and stream routing. |
| `paxi.js` | Morph-based DOM patching that preserves focus/form state better than replacement | **Missing** | dmax has no general morph/patch layer today. This is the clearest Fixi idea to borrow beyond Datastar. |
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
- Opt-in DOM morphing (`paxi`) instead of full replace/append style updates.
- Built-in SSE streaming semantics (`ssexi`) with clear lifecycle hooks.
- A tiny imperative fetch helper (`rexi`) for non-declarative code paths.
- A lightweight imperative companion (`moxi`) for the cases where declarative dataflow is awkward.

### What is still missing on both sides

- A unified parity matrix against Datastar's broader scenarios such as unusual attribute updates (`style`, links, canvas, etc.).
- Stronger story for keyed list reconciliation / stable DOM preservation during collection updates.
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
