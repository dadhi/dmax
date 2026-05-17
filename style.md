# Style principles

Keep the styling platform-first and local. Use dmax for dataflow, not as a replacement for modern HTML and CSS.

## Order of attack
1. semantic HTML
2. native HTML state
3. CSS tokens and selectors
4. dmax for dataflow
5. imperative JS only at foreign-lib boundaries

If a problem is presentational, solve it in HTML/CSS first.

## Structure
- Prefer semantic tags: `header`, `main`, `section`, `table`, `thead`, `tbody`, `th`, `td`, `footer`, `form`, `label`, `details`, `summary`.
- Let ids/classes name stable roots or real components, not visual trivia.
- Avoid adding signal state that just duplicates native UI state.

## Selector shape
- Root each styling area in one stable id or class.
- Inside that root, prefer selectors that mirror the HTML structure.
- Keep selectors local. Avoid utility-sprawl when one rooted rule is enough.

Example:

```css
#example {
  & > header { ... }
  & > main { ... }
}

#grid {
  & table { ... }
  & thead th { ... }
  & tbody th { ... }
  & td { ... }
}
```

## Native UI first
Prefer built-in behavior before JS:
- `details` / `summary` for disclosure
- `dialog` when modal behavior is real
- `popover` when browser support and ergonomics are good enough
- form controls for user input state
- CSS pseudo-classes for hover/focus/checked/invalid/disabled state

Use dmax only when the state must participate in app dataflow.

## Token system
All measurable values should come from a small token layer.

Primitive groups:
- `--space-*`
- `--size-*`
- `--radius-*`
- `--line-*`
- `--shadow-*`
- `--font-*`
- `--tone-*`

Build semantic vars from those primitives:
- `--bg`
- `--panel`
- `--line`
- `--ink-soft`
- `--accent-soft`

Rules:
- prefer derived vars over ad-hoc literals
- if a value is used more than once, it should usually be tokenized
- use consistent scales for spacing, radius, and sizing

## Color system
- Use OKLCH/OKLab anchors for palette inputs.
- Derive UI colors with `color-mix()` and related modern color features.
- Keep accent/good/bad colors in the same system.
- Avoid unrelated hard-coded hex values unless there is a clear exception.

## CSS var policy
Prefer CSS vars when the change is visual and cross-cuts multiple rules.

Good uses:
- spacing
- sizing
- palette
- borders
- shadows
- density

Prefer direct DOM prop/class writes when the change is not really a style token.

## Dmax policy
Use dmax for:
- signal to text/prop/class/show bindings
- event to signal updates
- action/SSE driven state
- CSS var writes via `style.*`

Do not use dmax just to recreate behavior that native HTML/CSS already gives cleanly.

## Visibility and customization
- Keep key tokens inspectable in the example UI.
- Live token editing is useful when it teaches how the page is built.
- The token panel should expose a small meaningful set, not every possible rule.
- A user should be able to restyle the page mostly by changing root vars.

## Foreign-lib boundary
At chart/map/editor boundaries, imperative JS is acceptable for:
- create
- update
- destroy
- callback to DOM event translation

Keep that layer thin. Do not grow dmax runtime until repeated wrapper pressure proves a real gap.

## Anti-patterns
Avoid:
- JS computing presentation that CSS can express
- signal state that mirrors native open/closed form state without need
- one-off spacing/radius literals spread through the sheet
- component-local style logic that bypasses the token system
- adding runtime syntax before trying HTML/CSS and plain `data-m-ex`
