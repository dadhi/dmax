# Style principles

These styles should stay minimal, interactive, and user-customizable, in the spirit of Datastar Stellar CSS and Open Props.

## Structure
- Prefer semantic HTML first.
- Use real document structure: `header`, `main`, `section`, `table`, `thead`, `tbody`, `th`, `td`, `footer`, etc.
- Let classes/ids describe components or stable roots, not presentational fragments.

## Selector shape
- Root each styling area in a known component id or class.
- Inside that root, prefer nested modern selectors.
- Nested selectors should mostly target semantic tags that mirror the HTML structure.
- Avoid flat global utility-style selector sprawl when a local rooted rule can express the same thing.

Example shape:

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

## Design system
- All measurable styling values should come from a small design system.
- The system should feel like a tiny reusable prop layer, not a heavy theme framework.
- Expose key vars for:
  - spacing
  - sizing
  - radii
  - line widths
  - shadows
  - typography
  - palette anchors
- Prefer derived vars over ad-hoc literals.
- If a value is not a key var, it should usually be derived from one.

## Tokens
- Keep a small set of primary tokens.
- Build semantic tokens from those primaries.
- Typical flow:
  - primitive tokens: `--space-*`, `--radius-*`, palette anchors
  - semantic tokens: `--bg`, `--panel`, `--line`, `--accent-soft`, etc.

## Color system
- Define palette anchors in OKLCH/OKLab space.
- Derive UI colors from those anchors with `color-mix()` and related modern color features.
- Avoid unrelated hard-coded hex values when a derived semantic token can be used.
- Keep state colors (`accent`, `good`, `bad`, etc.) in the same color system.

## CSS values
- Prefer consistent scales.
- Reuse spacing and radius tokens aggressively.
- Derive component sizes from root vars where sensible.
- Avoid one-off padding, margin, gap, and corner values unless there is a clear need.

## Visibility of the system
- Make the design tokens inspectable in the example UI.
- A hover/focus style drawer is a good default.
- Users should be able to understand what to tweak and where to tweak it.
- Show:
  - key palette vars
  - important semantic vars
  - token ranges/scales
- The panel should help users understand how the page is built, not just decorate it.

## Interaction and customization
- Styling should support interaction states cleanly: hover, focus, selected, active, good/bad deltas, open/closed panels.
- Customization should primarily happen through exposed CSS vars.
- A user should be able to fork or restyle the example mostly by changing root tokens.
- Prefer live token adjustment surfaces where useful for demos.

## Practical bias
- Keep CSS minimal, readable, and local.
- Prefer semantic structure + tokenized styling over many helper classes.
- Use modern CSS when it simplifies the source and reflects the structure better.
- Aim for a tiny “props + semantics” layer rather than a large component stylesheet.
