# `data-m-wc` sketch

Goal: keep dmax small and declarative, but still cover web components as a built-in battery.

## Direction

`data-m-wc` is for two related jobs:

1. **declare** a web component from a `<template>`
2. **drive** a web component instance from signals

The intended default is **modern light DOM**. Shadow DOM stays opt-in for components that really need style/behavior isolation or foreign-lib encapsulation.

## Minimal shape implemented now

### 1. Template declaration

```html
<template data-m-wc="my-card">
  <article>
    <slot></slot>
  </article>
</template>
```

Current behavior:
- registers `my-card` if it is not already defined
- when a `my-card` instance connects, the template content is cloned into it once
- cloned content is scanned/wired by dmax

This is intentionally minimal.

### 2. Signal -> WC props

```html
<my-style-panel data-m-wc@panel></my-style-panel>
<my-style-panel data-m-wc:open:root-selector@panel></my-style-panel>
<my-style-panel data-m-wc^attr:aria-label@panel></my-style-panel>
```

Current behavior:
- trigger must be a signal
- default mode is **prop** writes
- `^attr` switches host writes to attributes instead of props
- with no targets, if the signal value is an object, its own keys are copied onto the host
- with one target and a scalar, the scalar is assigned to that prop/attr
- with named targets and an object, matching keys are copied onto matching props/attrs
- after assignment, `requestUpdate()` or `render()` is called if present

## Why this shape

It keeps the DX surface tiny:
- one directive
- same parse model as other dmax attrs
- enough to host isolated/foreign widgets declaratively

## Related style binding

To support Stellar-style token editing, dmax now treats unknown `style.*` property writes as CSS custom property writes.

Example:

```html
<div id="app"
  data-m-ex:.style.size-cell@theme.cell-size="val + 'rem'"
  data-m-ex:.style.tone-accent@theme.tone-accent>
</div>
```

This maps to:
- `style.size-cell` -> `style.setProperty('--size-cell', ... )`
- `style.tone-accent` -> `style.setProperty('--tone-accent', ... )`

That keeps style tokens declarative and signal-driven.

## Near-term likely additions

- prop -> signal / event -> signal patterns around WC instances
- explicit attr-vs-prop write modes
- better nested prop routing
- clearer slot/content patterns
- optional shadow-root template mode
- reuse more `data-m-it` internals where it shrinks code

## Dogfood target

The `m-ex-cel` style button/panel is the first dogfood target:
- the component itself remains isolated
- dmax drives its public props declaratively
- component events feed state back into signals

That is the current intended compromise:
**imperative inside the foreign/isolated widget, declarative at the page boundary.**
