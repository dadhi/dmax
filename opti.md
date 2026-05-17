# Optimization backlog

## What has been working lately

### 1) Compile once, branch less later
Use parse/setup time to collapse repeated runtime checks into short fixed-shape fields.

Pros:
- smaller hot paths
- fewer repeated `root` / `kind` string compares
- easier follow-up shrinking passes

Cons:
- setup gets denser
- overcompiling rare cases can bloat source

### 2) Keep the common case scalar, promote late
When a slot usually holds 0/1 item, keep it `null` or scalar and allocate arrays only on the second item.

Pros:
- fewer allocations
- smaller common-case code and data
- paid off well for compiled permit mods

Cons:
- callers must handle scalar-or-array shape
- can get ugly if applied too widely

### 3) Remove remembered state if an invariant can replay it
If replay can safely use a known stable input, do not store extra temp state just to pass it back later.

Pros:
- fewer locals
- less closure state
- good byte wins in hot wrappers

Cons:
- only safe when replay invariants are real and tested

### 4) Collapse helper logic only when the shape stays obvious
Short expression helpers and scalar/array dual paths worked well when they removed branches without hiding too much.

Pros:
- good byte wins
- often also helps minified output

Cons:
- can hurt readability fast
- should stop before condition trees become fragile

### 5) Push flags into hot paths, keep generic objects out
`f/d/t/p/v/c`-style compiled records paid off because they removed repeated scans and broad object interpretation.

Pros:
- cheaper dispatch
- easier to specialize later

Cons:
- naming gets opaque
- tests must cover each field contract

## Likely transfer targets

### dmIt

#### Idea: compile a template rewrite plan once
Pre-scan the template subtree and record only nodes/attrs/text slots that contain `$it` / `$ix`.

Pros:
- avoids full subtree walk on every clone
- matches the recent “compile once, replay cheap” pattern
- likely helps larger repeated item templates most

Cons:
- more setup code and state
- plan shape may cost bytes on tiny templates
- DOM-path bookkeeping can get brittle

#### Idea: keep dmIt setup scalar-first too
Several dmIt setup slots still look array/object-ish by default even though the common case is one trigger, one template root, one state record.

Pros:
- same tactic already worked in mod compilation
- low conceptual risk

Cons:
- likely smaller wins than rewrite-plan compilation
- easy to over-tune for tiny byte gains

#### Idea: split “wire rewritten attrs” from “plain clone” fast path
If a template subtree has no `$it/$ix` tokens, skip rewrite machinery entirely and just clone + wire.

Pros:
- cheap common case
- keeps token machinery off plain lists

Cons:
- needs one more compiled template flag
- may duplicate some branching unless done tightly

### dmAct

#### Idea: compile action mods into an act plan
Mirror the trigger-mod success: turn global action mods into fixed short fields/flags once, then let request assembly read that plan.

Pros:
- big candidate: dmAct still rescans and fans out many modifier meanings
- should reduce branches in request build and response apply paths
- easier to specialize GET/DELETE vs body methods later

Cons:
- dmAct has many modes; overcompiling can grow source
- needs careful tests for modifier precedence

#### Idea: keep route/header mod holders scalar-first
`urlMods`, `bodyMods`, `hdrMods`, and maybe `adds`-side spread routes can use the same 0/1/many tactic if the common case is small.

Pros:
- matches recent wins directly
- likely fewer allocations per action setup

Cons:
- request assembly becomes scalar-or-array aware
- not worth it if most real attrs already carry many mods

#### Idea: split request builders by transport shape
Have very tight internal paths for:
- GET/DELETE query-only
- body methods with one body field
- body methods with object body
- SSE/html response modes

Pros:
- lets common paths avoid generic object work
- similar to hot-path flag specialization that has been winning

Cons:
- source can grow if split too aggressively
- must keep precedence and headers behavior identical

### morph

#### Idea: keep expensive preservation work lazy and gated
Apply the recent tactic again: only allocate / capture state when focused element, scroll, keyed mismatch, or special subtree conditions actually require it.

Pros:
- matches existing wins in morph
- likely still room in full-page updates
- good fit for real sloppy whole-page morph workloads

Cons:
- many early exits already exist, so wins may be incremental
- easy to add subtle state bugs

#### Idea: scalar-first keyed matching state
Where keyed matching state is often empty or singular, keep bags/maps unallocated until the first real keyed conflict.

Pros:
- same allocation tactic as permit mods
- good fit for mostly-unchanged sibling walks

Cons:
- may complicate already-dense child morph code
- benefits depend heavily on benchmark shape

#### Idea: split plain subtree morph from focus/form-preserving morph
A plain non-focused subtree path should do the least possible. Focus/selection/value preservation should be a clearly gated slower path.

Pros:
- follows the “branch less later” tactic
- likely helps whole-page morph where only one tiny region is stateful

Cons:
- code duplication risk
- must preserve current UX guarantees exactly

## Priority order

1. `dmAct` compiled plan
   - biggest remaining repeated interpretation surface
   - best match for recent successful tactics
2. `dmIt` compiled rewrite plan
   - strongest likely perf win for repeated lists/templates
3. morph lazy keyed/stateful escalation
   - likely real-world perf help, but easier to regress behavior

## Guardrails

- prefer compile-time narrowing over runtime helper layering
- keep 0/1/many shapes scalar-first where the common case is truly small
- do not add plan objects unless they remove more branching/scanning than they add
- require asserts for every new compiled field contract
- benchmark morph-facing changes against full-page SSE/html morph cases, not just targeted patches
