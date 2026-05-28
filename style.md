# Style WC notes

This file is a hands-off memory for the current `dm-style.js` direction, what is now done, and what should stay intentionally small.

## Current shape

There are two layers:

1. page tokens and token application live in page HTML via normal dmax
2. the floating editor UI lives in a tiny WC registered with `dmWc(...)`

The WC is only a host for controls and markup.
The page still owns state.
That keeps the rule consistent with the rest of dmax:

- HTML/CSS first
- dmax for dataflow
- imperative JS only for setup/helpers

## 5 minute path

1. load `dmax.js`
2. load `dm-style.js`
3. put one `style` signal object on the page root
4. bind that object once with `data-m-ex:.style@style="dmStyle.valsToVars(val, dmStyle.defs)"`
5. place `<dm-style-panel></dm-style-panel>` on the page
6. call:

```html
<script>dmStyle.panel('dm-style-panel', dmStyle.defs, { signal: 'style', open: 'style-panel.open', help: 'oklch-help' })</script>
```

If the page already uses CSS vars, that is enough to make the live editor work.

## Current recipe

### 1. Put signal state on the page root

Example shape:

```html
<div
  id="demo"
  data-m-si='{"mx":{"oklchHelp":"...","style":{"toneBg":"oklch(...)"}}}'
  data-m-ex:.style@mx.style="({ '--tone-bg': val.toneBg })">
```

The important part is:

- one signal object owns the style tokens
- one `data-m-ex:.style@...` binding applies them to root CSS vars

### 2. Keep CSS derived from vars

```css
#demo {
  --tone-bg: oklch(98% .008 250);
  --bg: color-mix(in oklab, var(--tone-bg) 96%, white);
  background: var(--bg);
}
```

If a token does not visibly change the page, first check that the token is actually consumed by CSS.

### 3. Register the style panel with `dmStyle.panel(...)`

`dm-style.js` does this on top of public `dmWc(...)`.

The WC is intentionally narrow:

- renders controls
- emits normal DOM events through dmax bindings
- does not own a parallel store
- does not try to become a styling framework runtime

### 4. Bind controls directly to page signals

Example pattern used now:

```html
<input data-m-ex:.value@mx.style.tone-bg data-m-ex:mx.style.tone-bg@.input>
```

and for color inputs:

```html
<input
  type="color"
  data-m-ex:.value@mx.style.tone-bg="dmStyle.oklchToHex(val) || '#ffffff'"
  data-m-ex:mx.style.tone-bg@.input="dmStyle.hexToOklch(val)">
```

So:

- text input shows OKLCH
- color input shows a familiar picker
- both write the same token

## What the current example proves

`m-ex-cel` now proves:

- a page can expose a small live token system with plain dmax
- one tiny shared helper can host the controls cleanly
- OKLCH text and native color pickers can round-trip through the same signal
- root CSS vars can be applied from one signal object
- spacing/radius/line/tone tokens can all flow through the same mechanism

## Why this shape is good

It matches the main dmax rule:

- if you know one thing, you mostly know the rest

The style panel is not a special mini-framework.
It is just:

- `dmStyle.panel(...)` / `dmWc(...)` for packaging UI
- `data-m-ex` for reads/writes
- CSS vars for presentation

That is better than introducing a separate styling DSL too early.

## Current status

Completed in the current small plan:

- generic `dm-style.js` helper exists
- generic `dmStyle.panel(...)` exists
- `dmStyle.valsToVars(...)` removes the repetitive token->CSS-var mapping
- `dmStyle.copy(...)` / `dmStyle.importVals(...)` / `dmStyle.promptImport(...)` exist
- `dmStyle.oklchToHex(...)` / `dmStyle.hexToOklch(...)` exist
- `examples/style-starter.html` is the smallest starter
- `examples/m-ex-cel.html` now dogfoods the same helper instead of page-specific style plumbing

Still intentionally missing:

- no extra runtime features in `dmax.js`
- no big styling DSL
- no widget-owned style store
- no pre-themed design system beyond the token defaults

Recommended house token shape is now:

- `--space-*`
- `--radius-*`
- `--line-*`
- `--size-*`
- `--tone-*`

## Compare with Datastar Stellar CSS and Rocket

## Stellar CSS

Good parts:

- stronger opinionated styling story
- can help users move faster when they want a ready-made design language

Tradeoff:

- can become its own parallel abstraction layer
- can blur where CSS ends and framework magic begins

Dmax direction should stay simpler:

- prefer plain CSS vars and modern CSS features
- keep runtime involvement minimal
- avoid turning styling into a second framework vocabulary

## Rocket

Good parts:

- component packaging pressure-testing
- encourages ergonomic composition

Tradeoff:

- more mechanical framework surface
- can push users away from plain platform-first HTML/CSS

Dmax direction should keep only the high-value parts:

- small declarative packaging
- DOM-native composition
- no large styling runtime contract

## Best simple DX plan for dmax user styling

Goal:

A customer should be able to style a page with dmax using mostly existing web platform knowledge.

### Phase 1: document the pattern better

Done.

### Phase 2: extract a copy-paste starter

Done.

### Phase 3: only then consider tiny helpers

Done at the small end only:

- token-object to CSS-var-object helper
- small reusable style-panel package
- import/export helpers
- OKLCH bridge helpers

Still not a full styling subsystem.

## Compared to Datastar Stellar CSS and Rocket

### Where dmax is intentionally different

- CSS-first, not style-system-first
- normal CSS vars and modern CSS features first
- dmax as dataflow glue, not a parallel styling DSL
- thin WC packaging, not a larger component runtime
- page-owned state, not widget-owned shadow state by default

### What Stellar / Rocket likely give sooner

- a more pre-shaped styling system
- stronger defaults and ready-made design language
- faster drop-in theming
- more packaged reusable interactive pieces
- less manual glue between token state, UI controls, and page application

### What dmax is still missing relative to that

- stronger pre-baked design defaults
- more packaged component skins
- more opinionated ready-made themes

Those are intentionally out of scope for now.

### Dmax direction

Do the smallest 20% that gives 80% of the value:

1. document one recommended token schema
2. provide one tiny style starter
3. provide one generic style panel package
4. provide one tiny helper layer for export/import and token->CSS-var application

That slice is now complete.

Stop before turning this into a second framework.

## Recommended rule

Keep style support in this order:

1. semantic HTML
2. CSS vars and selectors
3. dmax signal bindings
4. optional WC packaging
5. tiny helper JS
6. only then consider new runtime features

That keeps dmax small and consistent.
