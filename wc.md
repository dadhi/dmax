# `data-m-wc` sketch

Goal: keep dmax small and declarative, but still cover web components as a built-in battery.

## Direction

`data-m-wc` is now just for **declaring** a web component from a `<template>`.

For host props/attrs, use normal `data-m-ex` on the custom element.

The intended default is **modern light DOM**. Shadow DOM stays opt-in for components that really need style/behavior isolation or foreign-lib encapsulation.

## Minimal shape implemented now

### Template declaration

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

### Host props / attrs

Use `data-m-ex` directly on the custom element host.

```html
<my-style-panel
  data-m-ex:.open@panel.open
  data-m-ex:.root-selector@panel.root-selector
  data-m-ex:.aria-label@panel.label>
</my-style-panel>
```

That keeps the model smaller and clearer:
- `data-m-wc` defines the component
- `data-m-ex` drives its public API
- `data-m-ex^set-attr` can still be added later if generic attr-writing is worth it globally

## Why this shape

It keeps the DX surface tiny:
- one directive for declaration
- normal `data-m-ex` for host wiring
- less overlap and less “why not ex?” confusion

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
- clearer slot/content patterns
- optional shadow-root template mode
- reuse more `data-m-it` internals where it shrinks code

## Dogfood target

The `m-ex-cel` style button/panel and the vendored uPlot demo are the first dogfood targets:
- the component itself remains isolated
- dmax drives its public props with `data-m-ex`
- component events feed state back into signals

That is the current intended compromise:
**imperative inside the foreign/isolated widget, declarative at the page boundary.**
