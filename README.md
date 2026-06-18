# dmax

A tiny declarative frontend runtime driven by `data-*` attributes.

- similar to: Datastar-like declarative runtime, but with a stronger client-side signal model and one coherent grammar
- better at: signal/property sync, two-way sync, list rendering, declarative actions, SSE, morphing, and small web-component hosting in one consistent attribute language
- no build step, no required backend SDK, runs in any modern browser

Links:
- Notebook: <https://dadhi.github.io/dmax/>
- `m-ex-cel` example: <https://dadhi.github.io/dmax/examples/m-ex-cel.html>
- `style-starter` example: <https://dadhi.github.io/dmax/examples/style-starter.html>

## Design

- tiny, HTML-first, signal-driven, batteries-included, no build step
- working order: semantic HTML, then CSS, then dmax for dataflow, then imperative JS only at foreign-library boundaries
- few small orthogonal features over many special cases
- read-source mods compose as a pipeline (left-to-right): selectors (`^el`, `^sel`, `^sel-all`) pick a value source, transforms (`^attrs`) map it, `^` extracts a sub-path or array index
- write modes (`^replace`, `^merge`, `^append`, `^prepend`, `^inc`, `^dec`) fall back to `^replace` when a mode does not fit the target values
- no backend SDK required; see `protocol.md` for the plain HTML/JSON/SSE contract

## Quick start

```html
<script src="./dmax.js"></script>

<div data-m-si='{"count":0,"user":{"name":"Ada"},"theme":{"cellSize":4.5}}'></div>

<button data-m-ex:count^inc@.click>+1</button>
<span data-m-ex:.@count></span>

<input data-m-ex@.^rw@user.name>
<strong data-m-ex:.@user.name></strong>

<div data-m-ex:.style.size-cell@theme.cell-size="val + 'rem'"></div>

<ul data-m-it@items>
  <template><li data-m-ex:.="$it"></li></template>
</ul>

<button data-m-get^json^stat.req:result@.click="'/api/data'">Load</button>
<span data-m-sh@req.busy>Loading</span>
```

## Directives

| Directive | Purpose |
| --- | --- |
| `data-m-si` | initial signal state (JSON on root) |
| `data-m-ex` | read/write signals and DOM props through expressions |
| `data-m-cl` | toggle classes from signals |
| `data-m-sh` | show/hide elements |
| `data-m-it` | render array items from templates |
| `data-m-wc` | declare web components from templates |
| `data-m-no` | skip scanning and/or morphing |
| `data-m-get` / `data-m-post` / `data-m-put` / `data-m-patch` / `data-m-delete` | declarative actions |
| `data-m-dbg` | debug-render current signal state |

## Grammar

```
data-m-<verb>[^mods][:target][@trigger][+input][=expression]
```

Tokens:
- `:target` -- signal/prop target
- `@trigger` -- signal/event/special trigger
- `+input` -- action input
- `^mod` -- modifier
- `!name` -- negation
- `$it` / `$ix` -- current item/index in `data-m-it` template

`data-m-ex:.@count` is shorthand for `data-m-ex:.@count="val"`.

## Helpers

dmax auto-scans `document.body` on page load. Call `dmScan(root)` for fresh markup (`root` may be an element or `ShadowRoot`).

Imperative helpers for dynamic code paths: `dmSet(...)`, `dmSub(...)`, `dmScan(...)`, `dmEl(id)`, `dmSel(...)`, `dmSelAll(...)`, `dmWc(...)`, `dmJsos(val)`, `dmAct(...)`.

## Common patterns

```html
<!-- one-way signal -> element -->
<input data-m-ex:.@user.name>

<!-- one-way element -> signal -->
<input data-m-ex:user.name@.input="val">

<!-- two-way sync -->
<input data-m-ex@.^rw@user.name>

<!-- class toggling -->
<div data-m-cl+active+!inactive@is-active="dm.isActive"></div>

<!-- show/hide -->
<p data-m-sh:.@is-visible></p>

<!-- list rendering -->
<ul data-m-it@posts>
  <template><li data-m-ex:.="$it.title"></li></template>
</ul>

<!-- ^jsos for JSON-as-attr on custom elements -->
<game-board data-m-ex:.state^jsos@board-state></game-board>

<!-- ^raf: coalesce to next frame -->
<input data-m-ex:preview@.input^raf="val">
```

CSS custom property binding: any `style.*` target that doesn't match a known CSS prop falls through to `style.setProperty('--<kebab>', val)`.

## Read modifiers (pipeline)

Read mods compose left-to-right. The first selector picks a value source; transforms map it; `^` extracts a sub-path or array index.

| Mod | Source |
| --- | --- |
| `^.foo` | sub-path of trigger value (universal) |
| `^.[0]` / `^.[-1]` | array index after `^sel-all` or `^attrs` |
| `^ev.foo` | event detail (event triggers only) |
| `^si.root.path` | arbitrary signal (not just trigger) |
| `^el.id` | element selector (trigger element, or by id) |
| `^sel.x` | DOM query, first match |
| `^sel-all.x` | DOM query, all matches (array) |
| `^attrs.prefix` | attribute list (array; with `^sel-all`, array of arrays) |
| `^const.X` | constant: `^const.42`=42, `^const.hello`="hello", `^const.true`=true |
| `^null` / `^true` / `^false` / `^undefined` | shorthand constants |

Coercion mods (applied after pipeline): `^num`, `^str`, `^bool`, `^jsos`.

Default value source per trigger:
- signal trigger (`@foo`): signal value
- event trigger (`@.click`): trigger element (default prop)
- special trigger (`@_init`, `@_window.E`, etc.): trigger element or window/document/form

```html
<!-- sub-path of signal value -->
<span data-m-ex:.@user.name>

<!-- element prop via universal path -->
<span data-m-ex:.@.input^.target.value>

<!-- event detail sub-path -->
<span data-m-ex:.@.click^ev.detail.msg>

<!-- constants -->
<span data-m-ex:out@^const.42>
<span data-m-ex:out@_init^true>
<span data-m-ex:out@_init^const.null^bool>

<!-- pipeline: select element by id, read default prop -->
<span data-m-ex:out@.click^el.other>

<!-- pipeline: query all, get .length -->
<span data-m-ex:count@_init^sel-all..item^.length>

<!-- pipeline: query, get attrs, take first -->
<span data-m-ex:out@_init^sel-all..item^attrs.data-m-^.[0]>
```

## Web components

Two ways to define a custom element:

```html
<!-- in-page template -->
<template data-m-wc="my-card">
  <article><slot></slot></article>
</template>
```

```js
// separate file
dmWc('my-card', '<article>...</article>')
// or with a template element
dmWc(tplElement, 'my-card')
```

Drive host props with normal `data-m-ex`:

```html
<my-style-panel
  data-m-ex:.open@panel.open
  data-m-ex:.root-selector@panel.root-selector>
</my-style-panel>

<mx-uplot data-m-ex:chart-last^merge@.point="{ from: 'chart-1', ...val }"></mx-uplot>
```

## Actions and SSE

### Actions

```html
<button data-m-post^json:result@.click+title="'/api/posts'">Save</button>
```

All five verbs (`get`, `post`, `put`, `patch`, `delete`) share the grammar above.

Request body / content-type:
- `^json` -- `Content-Type: application/json`
- `^text` -- `Content-Type: text/plain`
- `^html` -- `Content-Type: text/html`
- `^form` -- `Content-Type: application/x-www-form-urlencoded`
- default -- body-less GET/DELETE, or raw body for POST/PUT/PATCH

Response handling:
- `^replace` (default) -- replace signal value
- `^merge` -- merge (objects merge, arrays/strings concat)
- `^append` / `^prepend` -- append/prepend to signal value
- `^inc` / `^dec` -- increment/decrement numeric by one

Headers:
- `^h.<name>` -- set header from named signal (kebab to header-canonical)
- `^hs.<signal>` -- spread a signal object as headers (kebab-cased)
- `^hs-no-kebab` -- like `^hs`, preserves exact names
- `^auth.<signal>` -- set `Authorization` from signal
- `^brotli` / `^br` / `^gzip` / `^deflate` / `^compress` -- add to `Accept-Encoding`

URL / body routing:
- `^url.<path>` -- send named signal as query string
- `^body.<path>` -- send named signal as body

Payload:
- `^send-all` -- include all root signals in body
- `^patch-all` -- apply matching root signals from response
- `^sync-all` -- combine both
- `+path` + `^spread` -- spread a signal object into payload

Status:
- `^stat.<signal>` -- group lifecycle into `{busy, complete, err, code, open, close, abort}`

Trigger mods: `^once`, `^always`, `^debounce`, `^throttle`, `^raf`, `^prevent`.

### SSE

Add `^sse` to switch an action into SSE mode. See `protocol.md` for wire shapes.

```html
<div data-m-get^sse^stat.feed@_init="'/stream'"></div>
<pre data-m-ex:.@feed^jsos.2></pre>
```

SSE events:
- `dm-element` -- raw HTML, default mode `outer`, target from root `id`
- `dm-elements` -- JSON patch (`html` required, `selector` and `mode` optional)
- `dm-signals` -- JSON signal patch

SSE lifecycle: `^stat.<signal>` for `open`/`close`, `^retry.N` for reconnect delay.

Uses `fetch` + `ReadableStream`: custom headers, request bodies, non-GET, explicit reconnect.

### CQRS pattern: SSE on load, POST for commands

A clean CQRS split where the read model arrives over SSE and writes are POSTed as commands:

```html
<!-- read: full state stream on page load, morphs via dm-element -->
<div data-m-get^sse@_init="'/api/state'"></div>

<!-- write: forms and buttons POST commands -->
<form data-m-post:cmd@.submit+payload="'/api/cmd'">
  <input name="title">
  <button>Save</button>
</form>
<button data-m-post:cmd@.click+payload="'/api/cmd'">Delete</button>
```

Works for dashboards refreshed via SSE, collaborative editors (server is source of truth), and hypermedia apps where the server renders. Local-only state (form drafts, UI toggles) can still live in `data-m-si` and never touch the server.

## Special triggers and targets

| Trigger | Meaning |
| --- | --- |
| `@_init` | fire once at wire-up |
| `@_window.<event>` | listen on `window` |
| `@_document.<event>` | listen on `document` |
| `@_form.<event>` | listen on nearest ancestor form |
| `@_interval.<ms>` | repeated timer |
| `@_timeout.<ms>` | one-shot timer |
| `@_viewed` | fire when element enters viewport |

| Target | Meaning |
| --- | --- |
| `:_history.push-state` | call `history.pushState(...)` with expression result |
| `:_history.replace-state` | call `history.replaceState(...)` with expression result |

```html
<button data-m-ex:_history.push-state@.click="[null, '', '#demo']">Push</button>
<span data-m-ex:.@_init@_window.hashchange^.location.hash="val || '#'"></span>
```

Ignore controls: `data-m-no` (skip scan + morph), `data-m-no^scan` (scan only), `data-m-no^morph` (morph only).

## Style helper (`dm-style.js`)

`dm-style.js` is an optional companion for editable design tokens. It wires a single signal to CSS custom properties and provides a reusable panel with range/color inputs, copy/import/reset tools, and help binding.

```html
<script src="./dm-style.js"></script>
<dm-style-panel data-m-si='{"style":{},"stylePanel":{},"oklchHelp":{}}'></dm-style-panel>
<script>
  dmStyle.pin(document.getElementById('app'), {
    signal: 'style',         // signal path for token values
    open: 'stylePanel.open', // signal path for panel open/close
    help: 'oklchHelp'        // signal path for help text
  })
</script>
```

`pin(root, opts?)` subscribes to the style signal, applies CSS vars to `root`, finds or creates the panel, binds open/help. Defaults: `signal: 'style'`, `open: 'style-panel.open'`, `help: 'oklch-help'`, `panel: 'dm-style-panel'`.

See `style.md` for the full API and `examples/style-starter.html` for a 5-minute setup.

## Comparison

### dmax vs Datastar

| Topic | dmax | Datastar |
| --- | --- | --- |
| Local state | first-class via `data-m-si` | lighter, more server-centric |
| Signal/property sync | strong | weaker emphasis |
| Two-way sync | built in | less central |
| List rendering | built in via `data-m-it` | different approach |
| Web components | template declaration via `data-m-wc`, host props via `data-m-ex` | further along conceptually |
| SSE | strong | strong |
| DOM morphing | built in | built in |
| Client payload control | explicit (`+x`, `^send-all`, `^url`, `^body`) | broader server-driven conventions |
| CQRS / server-first | supported (SSE on load + POST commands) | native |

### dmax vs Fixi

| Topic | dmax | Fixi stack |
| --- | --- | --- |
| Packaging | one integrated runtime | several tiny libraries |
| State | first-class signal store | more DOM/immediate style |
| Sync | `data-m-ex`, `^rw` | less unified |
| Actions | built in | `fixi.js` |
| SSE | built in | `ssexi.js` |
| Morphing | built in | `paxi.js` |
| Imperative escape | plain JS | dedicated helper libs |

## Files

| File | Purpose |
| --- | --- |
| `dmax.js` | main runtime |
| `dist/dmax.min.js` | minified build |
| `index.html` | notebook + live examples |
| `examples/m-ex-cel.html` | single-file SSE/grid example |
| `examples/style-starter.html` | style-panel starter |
| `dm-style.js` | style helper + generic style panel |
| `asserts.js` | inline assert helpers for notebook tests |
| `protocol.md` | backend wire contract |
| `wc.md` | `data-m-wc` design sketch |
| `style.md` | style-system principles |

## Development

```sh
npm run build:min
npm run test
```
