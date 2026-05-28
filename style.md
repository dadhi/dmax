# Style WC notes

This file is a hands-off memory for the current `mx-style-panel` direction, what it proves, and what is still missing.

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

### 3. Register the style panel with `dmWc(...)`

`examples/mx-style-panel.js` does this.

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
  data-m-ex:.value@mx.style.tone-bg="window.mExCelOklchToHex(val) || '#ffffff'"
  data-m-ex:mx.style.tone-bg@.input="window.mExCelHexToOklch(val)">
```

So:

- text input shows OKLCH
- color input shows a familiar picker
- both write the same token

## What the current example proves

`m-ex-cel` now proves:

- a page can expose a small live token system with plain dmax
- a separate-file WC can host the controls cleanly
- OKLCH text and native color pickers can round-trip through the same signal
- root CSS vars can be applied from one signal object
- spacing/radius/line/tone tokens can all flow through the same mechanism

## Why this shape is good

It matches the main dmax rule:

- if you know one thing, you mostly know the rest

The style panel is not a special mini-framework.
It is just:

- `dmWc(...)` for packaging UI
- `data-m-ex` for reads/writes
- CSS vars for presentation

That is better than introducing a separate styling DSL too early.

## Current gaps

### 1. No built-in token helpers

Users still write the object that maps signal values to CSS vars manually.
Current page code is readable, but repetitive.

Possible future help:

- docs-only helper recipe
- tiny public helper that turns `{ toneBg: '...' }` into `{ '--tone-bg': '...' }`

But only if it clearly improves real pages.

### 2. No batteries-included style panel package

Right now `mx-style-panel` is an example-specific WC.
A user can copy it, but there is no generic reusable package yet.

### 3. Color conversion helpers are example JS

`mExCelOklchToHex(...)` and `mExCelHexToOklch(...)` are still imperative helpers.
That is acceptable today, but it is still outside dmax proper.

### 4. No opinionated token schema beyond examples

We have a useful pattern:

- `--space-*`
- `--radius-*`
- `--line-*`
- `--size-*`
- `--tone-*`

But this is not yet published as a compact recommended house style.

### 5. No importable style starter for user pages

A user still needs to copy:

- token CSS
- the root binding
- the WC file
- the helper functions

That can become shorter.

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

Ship the documented recipe:

1. define tokens on `:root` or page root
2. put live style values in one signal object
3. bind that signal object to `.style`
4. optionally mount a `dmWc(...)` style panel
5. use small helper JS only for color conversion

This is the current best path.

### Phase 2: extract a copy-paste starter

Provide a minimal starter example with:

- token CSS
- root `data-m-si`
- root `data-m-ex:.style@...`
- separate `dmWc(...)` file
- optional tone pickers

This gives users a short path without adding runtime features.

### Phase 3: only then consider tiny helpers

Only if repeated user pain is obvious, consider tiny helpers such as:

- a token-object to CSS-var-object helper
- a small reusable style-panel package

Not a full styling subsystem.

## Recommended rule

Keep style support in this order:

1. semantic HTML
2. CSS vars and selectors
3. dmax signal bindings
4. optional WC packaging
5. tiny helper JS
6. only then consider new runtime features

That keeps dmax small and consistent.
