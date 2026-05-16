# Optimization backlog

## 3.a full-page parse + morph pass

Apply only after the new benchmark results are in.

Focus area:
- full-page HTML parse + morph hot path still dominates absolute time even when dmax already wins

Observed from current CI bm:
- dmax strongly wins targeted SSE/OOB small-diff cases
- dmax beats Datastar on full-page morph / replace
- Fixi wins full-page HTML replace, so our replace path likely still does extra work or allocation
- full-page SSE/HTML morph remains the main hot area to optimize for the intended sloppy whole-page-streaming use case

Planned checks:
- reduce repeated full-page parse work where possible
- avoid repeated selector / id-map / keyed-scan setup on mostly-unchanged trees
- add or strengthen fast paths for obviously unchanged subtrees
- re-check replace path to ensure morph-only prep is fully skipped there
- compare dmax full-page morph against paxi-style choices:
  - simple sibling walk with `firstChild/nextSibling`
  - very cheap nodeName/nodeType mismatch replacement
  - no Map allocation, use plain id bag only for current sibling set when needed
  - avoid broader subtree scans except at mismatch / id-reuse points
- inspect whether dmax can delay or skip state-preservation work for non-focused/non-form subtrees
- measure any bytes/alloc tradeoff only against the new `resp-sse-html_full_dom-morph_*` and `resp-html_full_dom-morph_*` cases

Guardrails:
- keep pointed / small targeted paths untouched unless a change also helps them
- no helper extraction unless size/perf clearly wins
- prefer fewer allocations and fewer repeated DOM walks over abstraction
