# dmax improvement plan: one small, complete, dependable runtime

Prepared: 2026-10-06  
Repository: https://github.com/dadhi/dmax  
Status: publishable implementation proposal, not evidence of an implemented or approved release.

## Recommendation

Keep dmax's integrated scope. Make local state, DOM bindings, actions, SSE, lists, components, and CSS-token tooling share the same scope, mutation, compilation, and disposal contracts.

Simplify responsibilities before compressing code. Fix correctness and lifetime problems first; recover the missing browser and component guarantees next; optimize the verified implementation last. Do not achieve a smaller bundle by splitting required capabilities into separately assembled libraries.

The intended result is a no-build, batteries-included release that can be used for a real interactive page without application authors repairing the runtime's lifecycle, transport, or state behavior.

## Objectives and constraints

The following product direction comes from the project owner's request. Acceptance measures below are proposed engineering gates, not measured results.

| Objective | Required effect and audience | Evidence that the release supports it |
| --- | --- | --- |
| O1. Complete integrated solution | Page authors get local interactivity, server-driven updates, list rendering, reusable components, and a useful CSS-token layer together | One documented distribution and one end-to-end example exercising all included capabilities |
| O2. Simple mental model | Authors reuse familiar HTML, CSS, JavaScript, and one consistent dataflow model | One grammar specification; examples do not require feature-specific stores or lifecycle workarounds |
| O3. Correct and recoverable behavior | Users retain working controls, item identity, state isolation, and predictable failure behavior during updates | Automated browser acceptance tests for streaming, moves, edits, reconnects, request races, and cleanup |
| O4. Fast with bounded resource use | Users get responsive updates and long-lived pages do not accumulate abandoned work | Pinned browser measurements for startup, update latency, allocations, and retained memory |
| O5. Small shipped footprint | Authors deploy a compact rounded solution, not a small core with hidden extra requirements | Minified, gzip, and Brotli totals for the complete included distribution; explicit approved budgets |
| O6. No application build or mandatory backend SDK | Authors can use ordinary HTML/CSS/JS and HTTP/SSE from their chosen backend | Copy-paste starter and protocol examples run without an application compilation step or SDK |

Hard constraints:

- Preserve the required effects in O1-O6. Lower size cannot excuse missing correctness, accessibility, recovery, or ownership.
- Backward compatibility with today's WIP API is not required. Breaking changes still require explicit decisions, updated examples, and coordinated client/server deployment.
- Ship a rounded default distribution. Internal source organization and maintainer build tools are allowed; user-facing assembly of required plugins is not the solution.
- Keep semantic HTML and CSS authoritative for their native behavior. Use imperative JS at foreign-widget boundaries when appropriate.
- Keep the server responsible for authorization, validation, durable command identity, and business-side recovery. Client cancellation does not reverse server work.
- No unsupported claims of being faster, smaller, or more reactive than Datastar/Rocket.

Numerical size, latency, memory, and browser-version targets are not supplied. The maintainer must approve them after measuring the pinned baseline and before optimization acceptance. Do not invent a target or silently remove a battery to meet it.

## Evidence boundary

This plan derives from a review of the repository's retrieved `main` snapshot on 2026-10-05 and current public Datastar/Rocket documentation. The review was not pinned to a commit and is not a fresh audit of subsequent changes. Before implementation, record the current commit and reproduce each relevant finding against it.

Isolated copies of source functions reproduced these findings:

- Equal flat arrays of length 40 were reported as changed because comparison depth grew across siblings.
- A signal recursion-limit breach left the depth counter above zero after unwinding.
- A compact raw-JSON `dm-signals` body documented in `protocol.md` was not decoded by the retrieved parser.
- Host-subscription collection duplicated a descendant entry when that entry was present in a descendant registry.

These are narrow reproductions, not a run of the repository suite. Other findings below are source-review findings or design recommendations. No comparative browser benchmark, compressed-size improvement, or production-readiness result is claimed.

## Choices to approve before changing contracts

These are the recommended choices. They are not approval records.

| Decision | Recommended choice | Main benefit | Cost or limitation | Rejected alternative |
| --- | --- | --- | --- | --- |
| State mutation | Explicit setters/patches; immutable replacement where appropriate; read access does not imply reactive assignment | One notification authority; fewer equality and proxy edge cases | Direct `dm.x = value` and nested in-place mutation must be rejected or clearly disallowed | Silently mixing notified setters with unnotified object writes |
| Dependency model | Explicit trigger dependencies; references inside expressions do not add hidden subscriptions | Predictable dataflow without a second tracking model | Every dependency must be declared; dynamic dependencies require explicit handling | Adding a parallel automatic-tracking system without replacing the explicit model |
| Scope | Explicit page/component/item scope supplied to bindings | Isolation without ancestor-state heuristics or textual scope substitution | Scope/context representation becomes a maintained internal contract | Discovering ownership from whichever ancestor has initialized state |
| DOM lifecycle | Idempotent mounted bindings with one disposer and move-aware reconciliation | Consistent scanning, streaming, lists, and components | Binding registry and reconciliation work | Independent cleanup rules in each feature |
| Directive syntax | One DOM-safe grammar; selectors/complex data in values | Ordinary DOM operations work; fewer parallel-attribute workarounds | Breaking syntax and documentation changes | Preserving syntax that the HTML parser accepts but DOM setters reject |
| Components | Template-once default, small prop contract, explicit setup/cleanup | Reusable components without a second render framework | Less render flexibility than Rocket; required lifecycle work remains | Copying Rocket's entire API or retaining a template-only shell with incomplete lifetime semantics |
| SSE recovery | Snapshot-on-reconnect for read streams; no automatic replay guarantee | Small, understandable recovery contract | Backend must send a complete authoritative snapshot first | Implicit event replay without cursor, ordering, and deduplication semantics |
| Packaging | One default distribution includes the agreed batteries | No assembly tax for users | All included runtime bytes count toward the budget | Reporting a tiny core while excluding required capabilities |

If a required use case needs event replay or automatic dependency tracking, reopen that decision before implementing dependent behavior. Do not conceal the extra responsibility in application code.

## Material design check: less work for the common case

Less code to do the same common thing is a useful indication that the design is improving. The stronger result is not doing that thing at all because a change in representation, ownership, or problem framing removes its need.

This is a design check, not a source-line quota. Fewer lines achieved by dense formatting, hidden application glue, weaker guarantees, or excluded batteries do not count. More code can be the better design when it replaces repeated user work or supplies a necessary guarantee. Check the whole solution, including markup, backend obligations, integration code, tests, and operation.

### Run this check on every material change

1. Name the common user task and its required normal, failure, and recovery outcomes. Choose representative tasks from real examples, not a favorable microbenchmark.
2. Compare the smallest complete current solution with the proposal. Count author-written markup/JS, runtime mechanisms, mutable states, special cases, setup steps, and interactions separately. Do not collapse them into one score.
3. First ask whether the responsibility is needed. Can native HTML/CSS, one authoritative model, a better input contract, explicit ownership, or a different workflow make it disappear?
4. Write the causal chain: small design change -> responsibility removed -> code/state/interactions no longer needed -> preserved user effects -> new or relocated obligations.
5. Verify the common task and its edge cases against the same acceptance. Measure resource use and shipped size separately; fewer mechanisms do not prove faster execution.
6. Record the result as **simplified**, **necessary added complexity**, **complexity relocated**, or **not demonstrated**. Reject unowned relocation and lost required effects. A justified increase is allowed, but must name the guarantee or user work it buys back.

### Apply the check to dmax

| Candidate | Higher-level change | Work that may disappear | Required effect retained | Evidence needed |
| --- | --- | --- | --- | --- |
| DOM-safe grammar | Choose syntax compatible with normal DOM APIs | Parallel attribute storage and repair paths | Multiple declarative bindings survive cloning, morphing, and dynamic construction | Round-trip tests; compare parser/workaround code and authoring examples |
| Explicit item context | Give each row a reusable scope instead of encoding its index into source text | Per-row expression rewriting and compilation | Correct item/index values and keyed identity | Nested/reorder tests; compile counts and allocation measurements |
| Native form submission | Let browser form semantics collect inputs | Mirrored form state and custom field serialization where not needed | Validation, repeated fields, submitters, and files | Same form journey before/after, including failures |
| CSS-derived styling | Let CSS compute static and responsive presentation | JS color/theme recomputation and duplicate derived state | Useful defaults, themes, and live token editing | Browser rendering and accessibility checks; total JS/CSS bytes |
| Explicit scope ownership | Mount each binding in its owning scope | Ancestor-state discovery and repeated descendant subscription collection | Isolated components and correct moves | Isolation/reconnect tests; registry/resource counts |
| Apply-and-discard streaming | Consume updates rather than store their historical application results | Unbounded retained update history | Ordered live updates and bounded diagnostics | Long-stream retained-memory measurements |

These are candidates, not new savings already achieved. Mark a capability **RETAIN** when the pinned baseline already does it well.

The check is required at each priority's design review. Before closing the milestone, demonstrate at least one material responsibility removed, or explicitly report that no safe removal was established. Do not fabricate a simplification to satisfy the review. This check complements shipped-size budgets; it does not reinstate the raw source-size ratchet.

## Priority order

Order expresses necessity, not estimated effort. Tests are written with each change, not deferred to the final priority. Independent work can proceed in parallel after its contracts are approved.

| Order | Priority | Improvement | Depends on | Objectives |
| --- | --- | --- | --- | --- |
| 1 | P0: correctness blocker | Repair state notification and scope correctness | Pinned reproductions; state/scope decisions | O2, O3, O4 |
| 2 | P0: correctness and memory blocker | Make SSE decoding conform to one protocol and retain no history | Protocol/recovery decisions | O3, O4, O6 |
| 3 | P0: lifetime blocker | Unify binding mounting, cleanup, and move/reconnect behavior | Scope and syntax decisions | O1, O2, O3, O4 |
| 4 | P0: failure and security blocker | Define request ownership, concurrency, errors, retries, and trust boundaries | Mutation and lifecycle contracts | O3, O4, O6 |
| 5 | P1: authoring foundation | Replace fragile directive syntax and separate cached definitions from live instances | Grammar decision; lifecycle integration | O2, O4, O5 |
| 6 | P1: rounded capability | Complete native DOM binding and form semantics | 3-5 | O1, O2, O3, O6 |
| 7 | P1: identity and reuse | Complete keyed lists and component contracts | 1, 3, 5 | O1, O2, O3, O4 |
| 8 | P1: rounded styling | Consolidate CSS-first styling and useful defaults | Binding/component contracts | O1, O2, O5 |
| 9 | P2: release evidence, mandatory | Optimize measured costs and produce the complete release evidence | Correctness/capability work complete; measurement starts earlier | O4, O5 |

P2 is not optional. It is later because optimization must operate on behavior that meets the contract.

## 1. Repair state notification and scope correctness

### Changes

- Correct recursive comparison depth: descend with `depth + 1`, never increment depth across siblings.
- Make the recursion guard unwind on every path, including guard rejection. Fail the offending cascade with a clear error; subsequent independent writes must remain usable.
- Do not mutate subscription registries while collecting handlers. Component subscriptions belong to their explicit owning scope.
- Give `dmSet`, initialization, action results, SSE patches, and host writes one mutation authority. Initialization may suppress effects until mounting, but cannot have different final-state semantics.
- Make direct assignment policy enforceable. For the recommended explicit-write model, reject direct root assignment and prevent/document unsupported nested mutation; do not expose it as reactive syntax.
- Verify descendant notification against nested writes. Resolve descendant paths relative to the changed path, not against an unrelated full-root path.
- Validate patch types and path segments. Reject prototype-manipulation paths and avoid inherited-property traversal.
- Define supported signal values. Recommend JSON-like state; keep DOM nodes, abort functions, and resource handles outside the serializable signal store.

### Benefits and costs

Correct updates and isolated components come before speed. Explicit operations can later remove unnecessary deep comparisons. The cost is a breaking mutation contract and deliberate handling of unsupported values. Do not remove equality safeguards until the new mutation contract is enforced.

### Acceptance

- Equal arrays/objects do not notify only because they have many siblings.
- A nested write notifies affected ancestors and descendants, not unrelated paths.
- A failed recursive cascade does not poison later writes.
- Sibling and nested component instances do not share local state unintentionally.
- Subscription collection leaves registries unchanged.
- Invalid or prototype-manipulation paths cause no state or prototype modification.

## 2. Make SSE bounded and unambiguous

### Changes

Separate byte decoding, standard SSE framing, event-body decoding, and patch application. Apply events in arrival order and discard each payload after application. Replace the unbounded `applied` array with completion counters or a bounded diagnostic buffer.

Recommended application protocol:

| Event | Body after standard SSE data-line joining | Meaning |
| --- | --- | --- |
| `dm-signals` | JSON object | Merge patch; objects merge, arrays replace, null deletes a field |
| `dm-element` | Raw HTML | Default outer morph of a root with a stable ID |
| `dm-elements` | JSON object with `html`, `selector`, `mode`, and optional `namespace` | Extended DOM patch; removal requires a target and no HTML |

Keep these event names only if useful. Do not support old mixed body formats solely for compatibility. Define selector fallback, multiple matches, supported modes, namespace parsing, and invalid-mode behavior in `protocol.md` and executable fixtures.

The parser must handle UTF-8 split across chunks, LF/CRLF/CR line endings, comments, field order, and multiline data. Dispatch only completed frames; an incomplete event at EOF is not applied. Enforce a documented finite event-size limit and expose a diagnostic on overflow or malformed known-event bodies. Ignore unknown events without retaining their payloads. The exact limit requires workload-based approval.

Reconnect read streams with bounded backoff. The first application event on a new connection establishes a full read-model snapshot before subsequent deltas. Application command endpoints are not retried as replayable streams by default.

### Benefits and costs

Removes growing historical payload retention and format ambiguity. Raw HTML preserves the common-case convenience. Snapshot recovery avoids a cursor/replay subsystem but shifts snapshot production to the backend; that responsibility must be explicit.

### Acceptance

- Every protocol example executes against the real parser.
- Chunk partitioning does not change the resulting state or DOM.
- Malformed/oversized input is reported and never partially applied as a valid patch.
- Repeated stream updates do not retain a list of historical events.
- Disconnect/reconnect restores the authoritative read model without duplicating commands.

## 3. Give every binding one lifetime

### Changes

Use an internal binding record with an immutable definition, resolved scope, element, mounted state, and idempotent disposer. The disposer owns listeners, subscriptions, timers, RAF callbacks, observers, and associated requests.

Reconcile these cases through the same mechanism:

- Initial scan and explicit repeated scan.
- Newly inserted markup and changed/removed directive attributes.
- List removal and template replacement.
- Component disconnection/reconnection, including retained closed shadow roots if supported.
- DOM moves. Same-scope moves retain bindings; cross-scope moves resolve/rebind scope after the move.

Coalesce observer records and inspect final ownership. Do not destroy a node because it appears in `removedNodes` when it was moved rather than discarded. Avoid scanning the whole document for every patch. Apply ignore-scan/ignore-morph rules consistently.

### Benefits and costs

Removes duplicate installations, dead moved nodes, and abandoned async work. A small registry adds bytes and maintained state, but replaces feature-specific cleanup paths. No generic plugin framework is required.

### Acceptance

- Scanning twice yields one handler invocation per event.
- Streamed new controls work without manual repair calls.
- Changed directives stop old behavior and start new behavior once.
- Reordered nodes retain working listeners and intended local state.
- Removed owners stop callbacks, requests, retries, and observations.
- Reconnected components work without duplicated markup or bindings.

## 4. Make request failures, concurrency, and trust explicit

### Changes

Create one owner-bound request controller. It owns cancellation, generation identity, retry timer, completion/error state, and response acceptance.

- Default replace-style reads to latest-wins. Abort the prior request and reject stale generations even if abort arrived too late.
- Default commands to one active request per binding; a repeat trigger is explicitly rejected while busy. Other concurrency modes require declared semantics.
- Check HTTP status before applying a success response. A 4xx/5xx is an error, not completion-as-success. Handle 204 without parsing a nonexistent payload.
- Automatically retry eligible read-stream connection failures only, with finite backoff and cancellation. Do not retry commands without an explicit server idempotency/recovery contract.
- Define timeout, abort, network-error, HTTP-error, and normal stream-close outcomes. Keep status coherent under all paths.
- Remove browser `Accept-Encoding` modifiers; response compression belongs to the server/browser.
- Keep payload inclusion explicit. Never send all signals, credentials, or local UI state by accident.

Security contract:

- Directive expressions and executable markup are trusted application code. Ordinary user content must be rendered as text or sanitized outside executable directive regions.
- Attribute expressions currently use dynamic function compilation. Document the CSP requirement; do not claim strict-CSP compatibility without a tested alternative execution path.
- Do not add arbitrary server-issued JavaScript execution as a transport convenience.
- Authorization, CSRF defenses, accepted-command identity, and durable retries remain server responsibilities. Browser state and hidden fields are not authorization evidence.
- Avoid logging request bodies, credentials, or full state by default. Report stable error categories and directive locations.

### Benefits and costs

Prevents stale data, ambiguous busy states, silent HTTP failures, and detached requests. Adds a small controller and explicit policy. Command rejection while busy is an observable choice, so document it rather than silently treating all actions as latest-wins.

### Acceptance

- A slower old read cannot overwrite a newer read.
- HTTP 500 does not patch success state or show successful completion.
- Removing a request owner cancels pending retries and suppresses later application.
- Repeated command triggers do not create accidental duplicate command requests under the default policy.
- Abort does not claim the server operation was rolled back.
- CSP and trusted-markup constraints match actual browser behavior.

## 5. Replace fragile syntax; cache definitions, not instances

### Changes

Approve a DOM-safe grammar before migrating the runtime. Preserve target/trigger/input/modifier concepts, but require attribute names to round-trip through parser creation, `setAttribute`, cloning, serialization, and morphing. Put arbitrary selectors and complex options in values. Allow multiple bindings per element without illegal names or duplicate HTML attributes.

Define token precedence, modifier order, negation, casing, path/index behavior, and errors. Reject incompatible modifier combinations and invalid typed operations. Do not silently turn an invalid append/increment operation into replacement.

Cache immutable parsed/compiled definitions. Keep resolved DOM targets, scope owners, resource handles, and per-mount metadata in instances. Compile list templates once and supply item/index/scope as arguments instead of rewriting expressions for each row.

Bound caches or restrict their keys to reusable definitions; streamed unique expressions must not create unlimited retained caches. Remove the parallel attribute workaround once the grammar supports normal DOM operations.

### Benefits and costs

Removes syntax repair code, live-target cache coupling, and index-specific compilation. Requires a breaking authoring change and migration of all examples. Do not add a full JavaScript parser merely to preserve inferred expression/statement behavior; choose an explicit evaluation contract.

### Acceptance

- Grammar fixtures round-trip through normal DOM APIs unchanged.
- The same definition mounted in two elements never shares a resolved target.
- Identical list templates compile independently of list length.
- Unknown modifiers, missing targets, and invalid operations produce actionable diagnostics.
- All shipped examples use the selected grammar; no permanent legacy parser is included.

## 6. Complete native bindings and forms

### Changes

Support property writes and attribute writes as distinct operations using shared bindings. Specify boolean attribute presence, null/removal, ARIA/data attributes, class toggles, styles, and CSS custom properties.

Use native control semantics for input/select/textarea/radio/checkbox. Do not interfere with IME composition or overwrite live drafts during a server refresh without an explicit authority policy.

Collect forms through browser primitives. Support validation, repeated names, disabled controls, selected options, the submitter, file fields, and URL-encoded/multipart requests. Keep explicit signal payloads available; do not require copying every form field into signals.

Define morph ownership for live values, checked/selected state, focus/caret, scroll, and foreign widgets. Preserve user-owned drafts by default; explicit server-authoritative updates must be supported and visible in the contract. Verify ignored regions and namespace behavior.

### Benefits and costs

Recovers behavior currently left to custom application glue. Native primitives remove custom serialization work. Correct morph/control handling adds tests and some runtime code; it cannot be cut merely to improve size.

### Acceptance

- Boolean attributes are absent when false, not present with the string `false`.
- Repeated form names and files reach the server in the declared encoding.
- Invalid native forms do not submit unless explicitly bypassed.
- Streamed updates preserve the agreed focused-input, IME, and draft behavior.
- Keyboard and accessible-name behavior remain intact in examples.

## 7. Complete lists and components without another framework

### Changes

Lists support both positional arrays and stable-key mode. Keyed updates retain node identity, update item context, move retained blocks, dispose removed blocks, and reject duplicate keys. Nested lists resolve independent contexts.

Components keep template-once rendering by default. Add an explicit instance scope, small decoded/defaulted public-prop contract, attribute/property synchronization, setup/cleanup, and a mounted-DOM hook where foreign widgets need it. Inputs use props; outputs use native events; internal state belongs to the instance scope.

Keep light DOM and the existing shadow-mode capability unless a separately approved scope change removes one. Store root references needed for cleanup, including closed roots. Define light-DOM projection as a runtime feature, not browser-native slotting.

Do not add a second component state store, mandatory rerender loop, codec fluent DSL, manifest publishing subsystem, or generic plugin architecture in this milestone.

### Benefits and costs

Regains reusable-component lifecycle and item identity while retaining the small template model. Keyed reconciliation and prop decoding add code. Compile-once contexts remove repeated rewriting/compilation. More expressive component render APIs remain outside this milestone.

### Acceptance

- Editing a row then reordering items keeps the draft with the same key.
- Deleted rows dispose subscriptions and async work.
- Two component instances do not share state, props, timers, or cleanup.
- Attribute changes and direct public-prop changes reach the same decoded value.
- A foreign widget is created, updated, and destroyed once per relevant lifetime.

## 8. Consolidate the included CSS-first styling

### Changes

Provide a small documented token schema, useful semantic HTML defaults, light/dark themes, accessible focus styles, and basic layout recipes. Treat this as the agreed limited Stellar-like scope, not a full widget/design-system catalog.

Keep derived colors, responsive values, and static theme calculations in CSS. Route interactive token changes through ordinary bindings. Generate editor controls and CSS mappings from one token definition where that removes duplication.

Consolidate the existing light/shadow panel CSS paths where one is unused. Validate OKLCH/native-picker conversion in real browsers; do not parse every computed color representation as integer RGB groups. Preserve import/export semantics and diagnose invalid values.

Include the agreed token/editor support in the default product. CSS can remain a normal stylesheet; report its bytes alongside the runtime rather than hiding it from totals.

### Benefits and costs

Provides a useful out-of-the-box styling experience without another reactive subsystem. Themes and editor controls cost bytes and accessibility work. Static styling must not require JavaScript computation merely because a style editor exists.

### Acceptance

- The starter is usable with supplied CSS defaults before interactive token editing.
- Theme changes use the existing binding/state system.
- Keyboard focus is visible in both themes.
- Supported color inputs/imports round-trip according to documented precision and gamut behavior.
- No duplicated style store or hidden required styling package exists.

## 9. Optimize only measured costs; verify the shipped artifact

### Changes

Replace the raw source-line/byte ratchet with budgets for minified JS, gzip, Brotli, included CSS, startup work, retained memory, and representative update latency. Readable source and useful tests must not be penalized as bundle growth.

Run the behavioral suite against both source and minified artifacts. Begin with conservative minifier settings. Enable `unsafe`, `unsafe_math`, or `pure_getters` only when their byte savings and behavioral equivalence are demonstrated for supported contracts.

Measure before considering a dependency trie, delegated events, broader batching, or more aggressive reconciliation. For batching, keep writes readable synchronously and apply dependent DOM work after the complete transaction; define reentrant-write and error behavior. Use RAF only where frame-coalescing is appropriate, not for every state transition.

Use pinned versions and public supported APIs for comparisons. Keep jsdom for fast feedback, but use real browser engines for performance, focus/selection, color, shadow DOM, and form acceptance. Verify the benchmark's Datastar event API against its actual vendored version.

### Required measurement matrix

| Workload | Measures | Correctness paired with the measurement |
| --- | --- | --- |
| Initial rounded starter | Total bytes, parse/evaluation/mount time | All included features work without extra assembly |
| Sparse state updates with many bindings | Update latency, handler count, allocation | Only declared affected bindings update |
| Append/delete/reorder of interactive rows | Latency, node reuse, allocation | Key identity, drafts, and cleanup hold |
| Long-lived SSE | First-update latency, throughput, post-GC retained-memory trend | Ordered decoding and no retained event history |
| Component disconnect/reconnect | Retained resources, mounting work | Isolation and exactly-once setup/cleanup semantics |
| Focused form plus streamed morphs | Interaction latency and control state | Focus, IME, drafts, accessibility remain correct |
| Overlapping requests and failures | Response timing, active work, retry counts | No stale results or accidental command replay |

Store the commit, engine/version, device, workload, sample method, variance, and results with each run. Compare identical required effects. Count dmax's complete distribution against equivalent Datastar/Rocket capabilities, with styling coverage stated separately.

### Acceptance

- Numerical budgets are approved and met; unresolved budget conflicts block release rather than silently reducing scope.
- No confirmed correctness/security/lifetime failure remains in included capabilities.
- Source and minified artifacts pass the same applicable behavior suite.
- Memory is bounded by live state, DOM, resources, and declared cache/diagnostic limits, not total historical updates.
- Performance and size claims have reproducible evidence. Unknown comparisons remain unknown.

## Delivery stages and stop gates

Stages organize the same bounded release scope. They do not authorize cutting required effects.

| Stage | Required outcome | Retain | Replace/add | Exit gate |
| --- | --- | --- | --- | --- |
| A. Reproducible foundation | Pinned findings and approved public contracts | Existing examples and useful tests as fixtures | Regression tests; decisions; baseline measurements | Relevant findings reproduced or resolved; no blocking ambiguity for the next implementation scope |
| B. Dependable integrated runtime | Priorities 1-7 pass their acceptance | Shared dataflow concept, HTTP/SSE, template-first components | Unified mutation/scope/lifetime, safe grammar, native forms, keyed identity | Thin end-to-end example passes normal and failure paths in the approved browser matrix |
| C. Ready-to-use rounded release | Priorities 8-9 and release gate pass | Verified runtime contracts and tests | Included styling, measured optimization, distribution and documentation | Complete release evidence reviewed; finite milestone closed |

The maintainer is the proposed decision and closure role. Engineering/test/security review roles are required as responsibilities, but people and commitments are not assigned by this document. The maintainer must name reviewers before release. Schedule and effort estimates remain unknown until pinned reproductions and contract choices are complete.

## Readiness decisions and safe interim behavior

| Decision to finalize | Needed before | Proposed resolution | Safe interim behavior |
| --- | --- | --- | --- |
| Exact DOM-safe syntax and expression evaluation form | Parser migration | Approve fixtures showing multiple bindings and DOM round-trips | Prototype parser in isolation; do not migrate dependent code against ambiguous syntax |
| Supported browser versions/features | Browser-dependent implementation and acceptance | Approve Chromium/Firefox/WebKit version matrix and capability floor | Do not claim support beyond tested environments |
| Stream limits, backoff bounds, snapshot establishment | Transport release | Select finite values from representative payload/network tests | Restrict testing to declared fixtures; no unbounded production stream exposure |
| JS/CSS/latency/memory budgets | Optimization acceptance | Measure baseline, approve explicit totals and regression tolerances | Do not advertise an improvement or remove batteries to create one |
| CSP support and markup trust | Security acceptance | Document trusted-expression mode and actual CSP requirements | Do not run directives from untrusted content or claim strict-CSP support |
| Authoritative input/morph overrides | Forms and morph acceptance | Approve explicit user-draft versus server-authoritative policy | Preserve drafts; block ambiguous overwrite cases |

These are decisions to close, not invitations to optional implementation. Each is owned by the maintainer with the relevant review responsibility; dependent release claims remain blocked until it is resolved.

## Release gate

A ready-to-go version exists only when all of the following are true:

- [ ] Required objectives O1-O6 map to passing tests and measurements.
- [ ] The material design check accounts for common-task code, mechanisms, and shifted obligations. Claimed simplifications name removed responsibilities and preserved effects; necessary added complexity is justified.
- [ ] Priorities 1-9 pass their stated acceptance; confirmed findings are fixed or disproved against the pinned commit.
- [ ] All public contract choices and numerical limits are approved and documented.
- [ ] One default distribution contains all agreed batteries; no application build or backend SDK is required.
- [ ] The starter and a realistic integrated example run from the published files.
- [ ] Examples cover stream recovery, request errors, native forms, keyed rows, component lifetime, and live styling.
- [ ] Source and minified artifacts pass the approved browser/behavior matrix.
- [ ] Diagnostics identify invalid directives, protocol failures, resource limits, and request errors without exposing sensitive state.
- [ ] README claims match current capabilities. Do not describe current Datastar as lacking substantial binding, computed-state, or component support.
- [ ] Package entry points, version, license metadata, and the actual license file agree. Resolve the reviewed MIT-versus-ISC metadata inconsistency before distribution.
- [ ] Client assets, example markup, and protocol producers are deployed as a matched version. Publish immutable versioned assets and a checksum.
- [ ] A clean rollback restores the previous matched client/markup/server contract. Browser caches cannot mix incompatible versions under reused asset URLs.
- [ ] Reviewers inspect the release evidence and the maintainer closes the milestone.

Stop when these gates pass. Demo the integrated example to page authors, inspect resource/failure results, and record which next decision the feedback supports. Do not add speculative batteries as a reward for finishing early.

## Forward opportunities: map our own path

Datastar, Rocket, and Stellar are useful reference points, not a required destination. dmax is exploring a combination with room for its own design. Judge a new direction by the authoring experience and guarantees it delivers, not by whether it reproduces another project's API.

The current release keeps its finite acceptance scope. The opportunities below are a separate, noncommitted research map. They do not authorize implementation, stretch goals, or weaker release guarantees. Required capability gaps remain in priorities 1-9; they cannot be moved here to make the release look complete.

| Opportunity | Question worth exploring | Small decisive experiment | Proceed only if | Main risk or cost |
| --- | --- | --- | --- | --- |
| One dataflow definition for page, row, and component | Can one scoped binding model serve all three without specialized rewriting? | Implement the same editable field in page, nested keyed row, and two component instances | It removes special paths while preserving identity, isolation, and lifecycle | A generic abstraction may introduce more context plumbing than it removes |
| A common subset with no expression compilation | Can frequent bindings and commands run without dynamic functions while retaining an explicit JS escape hatch? | Inventory starter/dogfood expressions; implement the common patterns and test under strict CSP | Real workflows become simpler and any extra bytes are justified; unsupported behavior stays explicit | Two execution languages or an expanding miniature JS interpreter |
| Shared mechanics for local and streamed structure | Can template insertion and server patches reuse ownership/reconciliation without giving up their distinct authority? | Exercise local keyed rows and a streamed interactive fragment through shared lifecycle machinery | Cleanup and identity improve without redundant parsing or a second DOM representation | Trying to force unlike updates into a slow universal renderer |
| An obvious client/server state boundary | Can scope or payload contracts remove accidental state transmission and redundant mirrored state? | Run a form draft plus snapshot stream with an explicit submitted payload | Draft preservation, authorization boundaries, reconnect, and command recovery remain correct | Moving synchronization and recovery complexity to the backend |
| CSS-native design tokens with an integrated editor | Can one token definition support static styling, live controls, and export without a style runtime? | Build a themed starter and change/export/import its tokens | Styling works without JS; editing stays ordinary dataflow; total complexity falls | Turning token metadata into a second styling language |

### Exploration rules

- Start with the user problem and the possibility of eliminating work. Do not start with parity checklists or an architecture to justify.
- Compare a native/do-minimum solution, the current dmax contract, and the new idea on the same task and quality floor.
- Set the question, allowed prototype exposure, evidence budget, rejection criteria, and stop condition before coding. The maintainer approves these; this document assigns no research commitment.
- Keep prototypes reversible and separate from the release distribution. Required security, correctness, and recovery still apply to any real user exposure.
- Capture what the experiment removes, what it adds, who owns any shifted obligation, and what remains uncertain. Keep useful negative findings.
- Promote an opportunity only through a separately approved change or milestone with acceptance and measurements. Keep the existing contract until the replacement proves the required effects, even when backward compatibility is not required.

The aim is to discover a smaller complete way to solve the problem. Sometimes that means better reuse; sometimes it means a new contract; sometimes it means deciding that a whole mechanism never needed to exist.

## Alternatives and boundaries

| Alternative | Assessment |
| --- | --- |
| Patch isolated bugs and retain every current internal contract | Useful immediate safety work, but insufficient for lifetime, scope, syntax, and complete-browser guarantees |
| Consolidate dmax around shared contracts | Recommended: preserves the integrated objectives while removing repeated machinery; costs breaking changes and focused verification |
| Use Datastar/Rocket with owned integration/styling | Credible reuse comparator. May reduce custom-runtime maintenance, but equivalent scope, authoring experience, package obligations, and license fit must be demonstrated before substitution |

Not part of this milestone: mandatory bundlers, SSR frameworks, backend SDK suites, offline command queues, general event replay infrastructure, a full UI widget catalog, manifest registries, or another reactive styling language. These are not required by the agreed limited rounded scope. A newly demonstrated required effect must reopen scope explicitly rather than enter as a stretch goal.

## Source references

Public references only. Repository links to `main` are mutable; pin them to the implementation baseline before using them as release evidence.

- [dmax README](https://github.com/dadhi/dmax)
- [Runtime: parser, state, subscriptions, actions, components, morphing, SSE, cleanup](https://github.com/dadhi/dmax/blob/main/dmax.js)
- [Backend protocol](https://github.com/dadhi/dmax/blob/main/protocol.md)
- [Component direction](https://github.com/dadhi/dmax/blob/main/wc.md)
- [Style direction](https://github.com/dadhi/dmax/blob/main/style.md)
- [Style implementation](https://github.com/dadhi/dmax/blob/main/dm-style.js)
- [Source-size guard](https://github.com/dadhi/dmax/blob/main/tests/dmax.size.js)
- [Minification](https://github.com/dadhi/dmax/blob/main/tools/minify-dmax.js)
- [Morph/SSE benchmark](https://github.com/dadhi/dmax/blob/main/tools/bench-morph-sse.js)
- [Vendor selection](https://github.com/dadhi/dmax/blob/main/tools/vendor-libs.js)
- [Package metadata](https://github.com/dadhi/dmax/blob/main/package.json)
- [Datastar attributes](https://data-star.dev/reference/attributes)
- [Datastar actions and failure/cancellation options](https://data-star.dev/reference/actions)
- [Datastar SSE protocol](https://data-star.dev/reference/sse_events)
- [Rocket component contract](https://data-star.dev/reference/rocket)
- [Datastar Pro and Stellar overview](https://data-star.dev/pro)
