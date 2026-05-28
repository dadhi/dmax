# `data-m-wc`

Keep this narrow.

## Scope

`data-m-wc` is only for declaring a custom element from a `<template>`.

Use `data-m-ex` for host props and events.

This keeps the split clear:
- `data-m-wc` defines
- `data-m-ex` drives

## Template declaration

```html
<template data-m-wc="my-card">
  <article>
    <slot></slot>
  </article>
</template>
```

Current behavior:
- registers `my-card` if not already defined
- clones template content into each instance once on connect
- scans and wires the cloned content with dmax

If the declaration lives in a separate file, use public `dmWc(...)`:

```js
dmWc('my-card', '<article>...</article>')
```

Also supported:

```js
const tpl = document.createElement('template')
tpl.innerHTML = '<article>...</article>'
dmWc(tpl, 'my-card')
```

Default stance:
- light DOM first
- shadow DOM only when style or library isolation is really needed

## Host prop input

Drive public host props with `data-m-ex`.

```html
<my-style-panel
  data-m-ex:.open@panel.open
  data-m-ex:.root-selector@panel.root-selector>
</my-style-panel>
```

Compact object-style input also works well when the component has a stable config prop:

```html
<mx-uplot data-m-ex:.cfg@chart></mx-uplot>
```

Preferred rule:
- use direct scalar props when the host API is small
- use one config prop when the host API is larger and already object-shaped

## Host event output

Feed component events back into signals with `data-m-ex`.

```html
<mx-uplot data-m-ex:chart-last^merge@.point="{ from: 'chart-1', ...val }"></mx-uplot>
<my-style-panel data-m-ex:panel@.toggle="detail"></my-style-panel>
```

That keeps the event path the same as normal dmax event wiring.

## Why keep it this small

Reasons:
- less overlap
- less confusion about when `data-m-ex` should be used
- fewer battery-specific rules
- better pressure-testing of the generic dataflow model

If `data-m-ex` can drive the host cleanly, do not add new WC syntax.

## Foreign widget boundary

At the chart/map/editor boundary, imperative JS is acceptable for:
- create
- update
- destroy
- translating library callbacks into DOM events

That wrapper layer should stay thin. It is the place to measure real pressure before adding runtime surface.

## Related style binding

For visual customization, prefer CSS vars through normal dmax prop writes.

```html
<div id="app"
  data-m-ex:.style.size-cell@theme.cell-size="val + 'rem'"
  data-m-ex:.style.tone-accent@theme.tone-accent>
</div>
```

This maps to:
- `style.size-cell` -> `style.setProperty('--size-cell', ... )`
- `style.tone-accent` -> `style.setProperty('--tone-accent', ... )`

## Current dogfood targets

Current practical targets:
- generic `dmStyle.panel(...)` in `m-ex-cel`
- vendored `uPlot` through `mx-uplot`

Current compromise:
- imperative inside the foreign or isolated widget
- declarative at the page boundary
