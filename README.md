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

## dAction features covered by this PR

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
