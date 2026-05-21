# dmax

A small declarative frontend runtime driven by `data-*` attributes.

- Notebook / examples: <https://dadhi.github.io/dmax/>
- `m-ex-cel` example: <https://dadhi.github.io/dmax/examples/m-ex-cel.html>

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
- read-source mods (`^pr`, `^si`, `^ev`, `^attrs`) use last-wins
- write modes (`^replace`, `^merge`, `^append`, `^prepend`) fall back to replace when a mode does not fit the target values

If you want reactive state, DOM updates, list rendering, actions, SSE, morphing, and a small custom-element story in one coherent attribute grammar, dmax is the pitch.

## Distribution files

- `dmax.js`: 84,509 bytes
- `dist/dmax.min.js`: 45,656 bytes
- `dist/dmax.min.js.gz`: 16,339 bytes
- `dist/dmax.min.js.br`: 14,678 bytes

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

<button data-m-ex:count@.click="dm.count + 1">+1</button>
<span data-m-ex:.@count></span>

<input data-m-ex@.^rw@user.name>
<strong data-m-ex:.@user.name></strong>

<div data-m-ex:.style.size-cell@theme.cell-size="val + 'rem'"></div>

<ul data-m-it@items>
  <template><li data-m-ex:.="$it"></li></template>
</ul>

<button data-m-get^json^busy.loading:result@.click="'/api/data'">Load</button>
<span data-m-sh@loading>Loading…</span>

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

`data-m-wc` is for **template declaration** only.

```html
<template data-m-wc="my-card">
  <article><slot></slot></article>
</template>
```

This registers a light-DOM custom element and clones the template into each instance on first connect.

For host props, use normal `data-m-ex` on the custom element:

```html
<my-style-panel
  data-m-ex:.open@panel.open
  data-m-ex:.root-selector@panel.root-selector>
</my-style-panel>
```

That keeps WC usage smaller and clearer: define with `data-m-wc`, drive with `data-m-ex`.

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
- `^busy.<signal>`
- `^complete.<signal>`
- `^err.<signal>`
- `^code.<signal>`
- `^hs.<signal>`, `^header.<name>`, `^auth.<signal>`
- `^url.<path>`, `^body.<path>`
- `^send-all`, `^patch-all`, `^sync-all`
- `^replace`, `^merge`, `^append`, `^prepend`

### SSE

dmax supports `text/event-stream` action responses with incremental application.

Supported SSE events:
- `dmax-patch-elements`
- `dmax-patch-signals`

Lifecycle helpers:
- `^open.<signal>`
- `^close.<signal>`
- `^retry.N`
- `^abort.<signal>`

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
| `examples/m-ex-cel.html` | single-file semantic SSE/grid example |
| `asserts.js` | inline assert helpers used by notebook tests |
| `wc.md` | `data-m-wc` design sketch |
| `style.md` | style-system principles for examples |

## Development

```bash
npm run test:headless
npm run test:fuzz
npm run test:size
npm run test:min
```

## Current build sizes

- `dmax.js` — 86,143 bytes
- `dist/dmax.min.js` — 45,182 bytes
