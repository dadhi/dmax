# dmax

A small declarative frontend runtime driven by `data-*` attributes.

- Notebook / examples: <https://dadhi.github.io/dmax/>
- `m-ex-cel` example: <https://dadhi.github.io/dmax/examples/m-ex-cel.html>
- `style-starter` example: <https://dadhi.github.io/dmax/examples/style-starter.html>

dmax aims to stay:
- tiny
- HTML-first
- signal-driven
- batteries-included
- usable without a build step

Working order:
1. use semantic HTML
2. use CSS for layout and presentation
3. use dmax for dataflow
4. use imperative JS only at foreign-library boundaries

Design bias:
- prefer a few small orthogonal features over many special cases
- when modifiers repeat, use simple deterministic rules
- if you learn one dmax thing, you should mostly know the rest
- prefer consistent naming and behavior over one-off shorthand exceptions
- read-source mods (`^pr`, `^si`, `^ev`, `^attrs`, `^sel`, `^sel-all`) use last-wins
- write modes (`^replace`, `^merge`, `^append`, `^prepend`, `^inc`, `^dec`) fall back to replace when a mode does not fit the target values

If you want reactive state, DOM updates, list rendering, actions, SSE, morphing, and a small custom-element story in one coherent attribute grammar, dmax is the pitch.

Backend note: dmax does not require a backend SDK. See `protocol.md` for the plain HTML/JSON/SSE contract.

By default, dmax auto-scans `document.body` on page load. Call `dmScan(root)` yourself only when you add fresh markup later. `root` may be an element or a `ShadowRoot`. Small imperative helpers also exist for dynamic code paths: `dmSet(...)`, `dmSub(...)`, `dmScan(...)`, `dmSel(...)`, `dmSelAll(...)`, `dmWc(...)`.

## Distribution files

- `dmax.js`: 86,336 bytes
- `dist/dmax.min.js`: 46,677 bytes
- `dist/dmax.min.js.gz`: 16,663 bytes
- `dist/dmax.min.js.br`: 14,982 bytes

Build/update them with:

```sh
npm run build:min
```

## Why pick dmax

Choose dmax when you want:
- **more structure than ad-hoc inline JS**
- **more client-side state than Datastar-style server-first flows**
- **one integrated runtime** instead of composing several tiny libraries
- **fine-grained signal/property sync** rather than only request/HTML swapping
- **declarative SSE + declarative DOM/signal patching**
- **no build tooling requirement**

## What dmax includes

| Area | dmax |
| --- | --- |
| Signal store | `data-m-si` |
| Signal/prop sync | `data-m-ex` |
| Two-way sync | `^rw` |
| Class toggling | `data-m-cl` |
| Show/hide | `data-m-sh` |
| List rendering | `data-m-it` |
| Web component templates | `data-m-wc` + `data-m-ex` |
| HTTP actions | `data-m-get|post|put|patch|delete` |
| SSE streaming | `^sse` + `dmax-patch-*` events |
| DOM morphing | built in |
| Ignore subtrees | `data-m-no*` |
| CSS custom property binding | via `style.*` targets |

## Quick example

```html
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
<span data-m-sh@req.busy>Loading…</span>

<template data-m-wc="my-style-panel"><div>...</div></template>
<my-style-panel data-m-ex:.open@panel.open></my-style-panel>

<mx-uplot data-m-ex:.cfg@chart data-m-ex:chart-last^merge@.point="{ from: 'chart-1', ...val }"></mx-uplot>
```

## Core directives

| Directive | Purpose |
| --- | --- |
| `data-m-si` | define initial signal state |
| `data-m-ex` | read/write signals and DOM props through expressions |
| `data-m-cl` | toggle classes from signals |
| `data-m-sh` | show/hide elements |
| `data-m-it` | render array items from templates |
| `data-m-wc` | declare web components from templates |
| `data-m-no` | skip scanning and/or morphing |
| `data-m-get|post|put|patch|delete` | declarative actions |
| `data-m-dbg` | debug-render current signal state |

## Grammar

| Token | Meaning |
| --- | --- |
| `:target` | signal/prop target |
| `@trigger` | signal/event/prop trigger |
| `+input` | action input |
| `^mod` | modifier |
| `!name` | negation |
| `$it` | current item in `data-m-it` template |
| `$ix` | current index in `data-m-it` template |

## Common patterns

### One-way signal -> element

```html
<input data-m-ex:.@user.name>
```

When `data-m-ex` only needs to forward the trigger value, omit the expression entirely. `data-m-ex:.@count` is shorthand for `data-m-ex:.@count="val"`.

### One-way element -> signal

```html
<input data-m-ex:user.name@.input="val">
```

### Two-way sync

```html
<input data-m-ex@.^rw@user.name>
```

### Class toggling

```html
<div data-m-cl+active+!inactive@is-active="dm.isActive"></div>
```

### Show / hide

```html
<p data-m-sh:.@is-visible></p>
```

### List rendering

```html
<ul data-m-it@posts>
  <template><li data-m-ex:.="$it.title"></li></template>
</ul>
```

### JSON-string output for attr-driven components

Use `^jsos` when a target expects JSON as a string, such as an observed attribute on a custom element:

```html
<game-board data-m-ex:.state^jsos@board-state></game-board>
```

This is shorthand for writing `JSON.stringify(val)` yourself. The helper is also exposed as `dmJsos(val)` for custom expressions.

### Query-read helpers

Use `^sel` / `^sel-all` when the trigger should read queried nodes instead of a default prop:

```html
<span data-m-ex:.@_init^sel.#status="val && val.textContent"></span>
<span data-m-ex:.@_init^sel-all..todo-item="val.length"></span>
```

`^sel` returns the first matching node. `^sel-all` returns an array of matching nodes.
The matching imperative helpers are `dmSel(sel, root)` and `dmSelAll(sel, root)`.

### Frame-deferral helper

Use `^raf` when a trigger should coalesce to the next animation frame:

```html
<input data-m-ex:preview@.input^raf="val">
```

Repeated trigger firings in the same frame collapse to the latest one.

### CSS custom property binding

Unknown `style.*` writes fall through to CSS custom properties:

```html
<div
  data-m-ex:.style.size-cell@theme.cell-size="val + 'rem'"
  data-m-ex:.style.tone-accent@theme.tone-accent>
</div>
```

This maps to:
- `style.size-cell` -> `style.setProperty('--size-cell', ... )`
- `style.tone-accent` -> `style.setProperty('--tone-accent', ... )`

## `data-m-wc`

There are now two recommended WC definition styles:
- in-page template: `data-m-wc`
- separate-file registration: `dmWc(...)`

Use `data-m-wc` when the component definition should stay visible in the page markup.

```html
<template data-m-wc="my-card">
  <article><slot></slot></article>
</template>
```

This registers a light-DOM custom element and clones the template into each instance on first connect.

If you want the same pattern from a separate file, use public `dmWc(...)`:

```html
<script src="./my-card.js"></script>
```

```js
// my-card.js
dmWc('my-card', '<article>...</article>')
```

For host props, use normal `data-m-ex` on the custom element:

```html
<my-style-panel
  data-m-ex:.open@panel.open
  data-m-ex:.root-selector@panel.root-selector>
</my-style-panel>
```

For attr-driven components that parse JSON from an attribute, prefer `^jsos`:

```html
<game-board data-m-ex:.state^jsos@board-state></game-board>
```

That keeps WC usage smaller and clearer: define with `data-m-wc` or `dmWc(...)`, drive with `data-m-ex`.

Event output stays on normal `data-m-ex` too:

```html
<mx-uplot data-m-ex:chart-last^merge@.point="{ from: 'chart-1', ...val }"></mx-uplot>
```

## Actions and SSE

### Actions

```html
<button data-m-post^json:result@.click+title="'/api/posts'">Save</button>
```

Action features include:
- `^json`, `^text`, `^html`, `^form`
- `^stat.<signal>` for grouped status fields `{busy, complete, err, code, open, close, abort}`
- `^hs.<signal>`, `^h.<name>`, `^auth.<signal>`
- `^url.<path>`, `^body.<path>`
- `^send-all`, `^patch-all`, `^sync-all`
- `^replace`, `^merge`, `^append`, `^prepend`, `^inc`, `^dec`

### SSE

dmax supports `text/event-stream` action responses with incremental application.
See `protocol.md` for exact wire shapes and no-SDK backend examples.

Supported SSE events:
- `dm-element`
- `dm-elements` (`html` required; `selector` and `mode` optional)
- `dm-signals`

Lifecycle helpers:
- `^stat.<signal>`
- `^retry.N`

Grouped status example:

```html
<div data-m-get^sse^stat.feed@_init="'/stream'"></div>
<pre data-m-ex:.@feed^jsos.2></pre>
```

This keeps all action lifecycle fields under one signal:

```json
{"busy":false,"complete":true,"err":null,"code":200,"open":false,"close":true,"abort":null}
```

dmax uses `fetch` + `ReadableStream`, so it supports:
- custom headers
- request bodies
- non-GET methods
- explicit reconnect behavior

## Special triggers

| Trigger | Meaning |
| --- | --- |
| `@_init` | fire once at wire-up |
| `@_window.<event>` | listen on `window` |
| `@_document.<event>` | listen on `document` |
| `@_form.<event>` | listen on nearest ancestor form |
| `@_interval.<ms>` | repeated timer |
| `@_timeout.<ms>` | one-shot timer |
| `@_viewed` | fire when element enters viewport |

## Special targets

| Target | Meaning |
| --- | --- |
| `:_history.push-state` | call `history.pushState(...)` with the expression result |
| `:_history.replace-state` | call `history.replaceState(...)` with the expression result |

History writes usually pair well with window reads:

```html
<button data-m-ex:_history.push-state@.click="[null, '', '#demo']">Push</button>
<span data-m-ex:.@_init@_window.hashchange^pr.location.hash="val || '#'"></span>
```

## Ignore controls

| Attribute | Effect |
| --- | --- |
| `data-m-no` | skip scan + morph |
| `data-m-no^scan` | skip scan only |
| `data-m-no^morph` | skip morph only |

## Comparison: dmax vs Datastar

Use this as the casual selection guide.

| Topic | dmax | Datastar |
| --- | --- | --- |
| Main bias | signal-first client runtime | server-first HTML/SSE flow |
| Local state | first-class via `data-m-si` | lighter / more server-centric |
| Signal/property sync | strong | weaker emphasis |
| Two-way sync | built in | less central |
| List rendering | built in via `data-m-it` | different approach |
| Web components | template declaration via `data-m-wc`, host props via `data-m-ex` | Rocket-style component ideas are further along conceptually |
| SSE | strong | strong |
| DOM morphing | built in | built in |
| Client payload control | explicit (`+x`, `^send-all`, `^url`, `^body`) | broader server-driven conventions |
| Best fit | richer client-side UI with declarative state | hypermedia/server-led apps |

### Why choose dmax over Datastar

Choose dmax if you want:
- a stronger **client-side signal model**
- explicit **signal/property synchronization**
- a more **integrated batteries-included runtime**
- more control over what requests send and what responses patch
- a path toward declarative style tokens and WC hosting inside the same grammar

Choose Datastar if you want:
- a more strongly **server-led** mental model
- HTML/SSE-first workflows with less client-side state focus

## Comparison: dmax vs Fixi

| Topic | dmax | Fixi stack |
| --- | --- | --- |
| Packaging | one integrated runtime | several tiny libraries |
| State | first-class signal store | more DOM/immediate style |
| Sync | `data-m-ex`, `^rw` | less unified |
| Actions | built in | `fixi.js` |
| SSE | built in | `ssexi.js` |
| Morphing | built in | `paxi.js` |
| Imperative escape hatch | plain JS | dedicated helper libs like `moxi` / `rexi` |
| Best fit | one coherent declarative runtime | pick-and-mix micro-libraries |

### Why choose dmax over Fixi

Choose dmax if you want:
- one consistent grammar
- one signal store
- less library composition overhead
- richer stateful reactivity out of the box

Choose Fixi if you want:
- a modular toolkit
- stronger separation between request, morph, SSE, and imperative helpers

## Files

| File | Purpose |
| --- | --- |
| `dmax.js` | main runtime |
| `dist/dmax.min.js` | minified build |
| `index.html` | notebook + live examples |
| `examples/m-ex-cel.html` | single-file semantic SSE/grid example, dogfooding `dm-style.js` |
| `examples/style-starter.html` | smallest reusable style-panel starter |
| `dm-style.js` | tiny style helper + generic style panel package |
| `asserts.js` | inline assert helpers used by notebook tests |
| `protocol.md` | backend wire contract: HTML, JSON, SSE, `dm-signals`, `dm-elements` |
| `wc.md` | `data-m-wc` design sketch |
| `style.md` | style-system principles, gaps, and starter direction |

## Development

```bash
npm run test:headless
npm run test:fuzz
npm run test:size
npm run test:min
```

## Current build sizes

- `dmax.js` — 84,241 bytes
- `dist/dmax.min.js` — 45,889 bytes
- `dist/dmax.min.js.gz` — 16,407 bytes
- `dist/dmax.min.js.br` — 14,770 bytes
