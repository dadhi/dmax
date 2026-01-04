# dmax Improvement Roadmap (Unified: Semantic Compression + Incremental Optimization)
**Goal:** Fastest, smallest, most robust reactive library  
**Philosophy:** Semantic compression (Casey Muratori) + Safe incremental delivery  
**Sources:** improve.md (local optimizations) + improv-cop.md (architectural patterns) + fuzzer results

## Strategy Assessment

### improve.md Philosophy (Incremental)
- **Approach:** Local optimizations — cache hits, fast paths, dead code removal
- **Strengths:** Low risk, measurable gains, safe for production
- **Weaknesses:** Doesn't address fundamental complexity; limited ROI ceiling
- **Best for:** Weeks 1-2 (validation + quick wins)

### improv-cop.md Philosophy (Semantic Compression)
- **Approach:** Find repeating patterns ("words"), extract abstractions ("dictionary")
- **Strengths:** 70% code reduction, 2-3x performance, enables advanced features
- **Weaknesses:** High risk architectural changes; requires extensive testing
- **Best for:** Weeks 3-6 (foundation rebuild)
- **Key insight:** "You're saying the same thing 200 different ways — find the 10 core operations"

### Conflicts & Compatibility
1. **Proxy dm (improve.md #2)** vs **ReactiveCell (improv-cop Pattern 9)**
   - Conflict: Both change how signals are accessed
   - Resolution: Proxy is stepping stone → ReactiveCell is final form
   
2. **Merge setup functions (improve.md #7)** vs **Directive factory (improv-cop Pattern 1)**
   - Compatible! improve.md is subset of improv-cop approach
   - Resolution: Do Pattern 1 properly (more thorough than #7)

3. **RAF batching (improve.md #3)** vs **Dataflow graph (improv-cop Pattern 10)**
   - Compatible! Graph needs batching too
   - Resolution: RAF is tactical fix; graph gives topological ordering

4. **Parser regex (improve.md #4)** vs **Semantic parser (improv-cop Pattern 5)**
   - Conflict: Different parser architectures
   - Resolution: Pattern 5 is superior (returns resolved objects, not tokens)

### Synthesis: Hybrid Approach
**Phase 1-2:** Incremental fixes (improve.md) — get to production-ready fast  
**Phase 3+:** Semantic compression (improv-cop) — foundational rebuild for 2.0

---

## PHASE 1: Critical Validation & Safety (Week 1) [INCREMENTAL]
**Priority:** Fix fuzzer failures — prevent runtime errors & silent bugs  
**ROI:** High robustness / Low risk / Small size cost

### 1.1 Add Directive Parsing Validation ⚡ CRITICAL
**Problem:** Fuzzer shows 36+ failures — runtime accepts malformed attributes
- Reserved names (`ev`, `el`) accepted but cause undefined behavior
- Empty/malformed signal names (`:@foo`, `foo@`, `.foo`, `foo.`, `foo..bar`, `123`) pass validation
- Invalid properties (`textContent`, `fontSize` instead of kebab-case)
- Malformed modifiers (`__debounce`, `__gt`, `__unknown`)

**Fix:** Add validation in `parseDataAttrFast()`:
```javascript
const isValidSignal = s => s && /^[a-z][a-zA-Z0-9_-]*(\.[a-z][a-zA-Z0-9_-]*)*$/.test(s) 
  && !['ev','el','sg','dm'].includes(s.split('.')[0]);
const isValidProp = p => p && /^[a-z][a-zA-Z0-9_-]+(\.[a-z][a-zA-Z0-9_-]+)*$/.test(p);
// Check after parsing, log warning & skip wiring if invalid
```

**Impact:**
- ✅ Fuzzer pass rate: 36.1% → ~95%+
- ✅ Catches typos early (better DX)
- ❌ +150 bytes (validation logic)

**Time:** 2-3 hours

---

### 1.2 Add Infinite Loop Guard for `data-sync` ⚡ CRITICAL
**Problem:** Circular sync can hang browser
**Fix:** Add recursion depth counter (already in improve.md #13)
```javascript
let syncDepth = 0;
const set = (p, v, force) => {
  if(syncDepth > 10) { console.error(`[dmax] Loop: ${p}`); return; }
  syncDepth++;
  try { /* existing */ } finally { syncDepth--; }
};
```

**Impact:**
- ✅ Prevents browser hangs
- ❌ +80 bytes

**Time:** 1 hour

---

### 1.3 Add Element Resolution Warnings
**Problem:** Typo in ID → silent failure
**Fix:** Centralized `getEl()` helper with warnings (improve.md #11)

**Impact:**
- ✅ Better debugging
- ❌ +80 bytes

**Time:** 1 hour

---

### 1.4 Add Error Boundaries for User Expressions
**Problem:** Expression errors swallowed silently
**Fix:** Log expression source on error (improve.md #15)

**Impact:**
- ✅ 10x better DX
- ❌ +60 bytes

**Time:** 1 hour

---

**Phase 1 Total:** +370 bytes, ~6 hours, **Fuzzer green + production-safe**

---

## PHASE 2: Performance Quick Wins (Week 2) [INCREMENTAL]
**Priority:** Biggest speed gains with minimal risk  
**ROI:** High performance / Low complexity / Small size impact

### 2.1 Replace `Object.fromEntries(S)` with Proxy ⚡ HUGE WIN
**Problem:** Creates new object on every handler call → GC pressure
**Fix:** (improve.md #2)
```javascript
const dmProxy = new Proxy({}, {
  get: (_, key) => S.get(key),
  set: (_, key, val) => (set(key, val), true)
});
// Pass dmProxy to handlers instead of Object.fromEntries(S)
```

**Impact:**
- ✅ **+40% faster** (eliminates 1000+ allocations)
- ✅ Enables direct mutation: `dm.foo = 5` (better DX)
- ❌ +100 bytes

**Bridge to Pattern 9:** This Proxy is a prototype of ReactiveCell — proves the concept works

**Time:** 3-4 hours

---

### 2.2 Optimize `toCamel` — Cache First ⚡
**Problem:** Cache check happens AFTER indexOf scan
**Fix:** (improve.md #5)
```javascript
const toCamel = s => {
  if(!s) return s;
  if(keyCache.has(s)) return keyCache.get(s); // FIRST
  if(s.indexOf('-') === -1) return (keyCache.set(s,s), s);
  // ... conversion
};
```

**Impact:**
- ✅ +15% faster signal access
- ✅ -20 bytes (simpler)

**Time:** 30 min

---

### 2.3 Fast-Path `setProp` for Single-Level Props ⚡
**Problem:** Always splits path even for `value`, `checked`
**Fix:** (improve.md #6)
```javascript
const setProp = (el, path, val) => {
  if(!path) path = getAutoProp(el);
  if(path.indexOf('.') === -1) {
    const key = toCamel(path);
    if(el[key] !== val) el[key] = val;
    return;
  }
  // nested path logic...
};
```

**Impact:**
- ✅ +25% faster for 90% of bindings
- ✅ -30 bytes

**Time:** 1 hour

---

### 2.4 Batch DOM Updates with `requestAnimationFrame` ⚡
**Problem:** Rapid `set()` calls cause layout thrashing
**Fix:** (improve.md #3)
```javascript
let pending = new Set(), rafId = null;
const scheduleEmit = (path) => {
  pending.add(path);
  if(!rafId) rafId = requestAnimationFrame(() => {
    rafId = null;
    pending.forEach(p => emit(p));
    pending.clear();
  });
};
```

**Impact:**
- ✅ **+30-50% faster** for typing, animations
- ✅ Smoother UX
- ❌ +150 bytes
- ⚠️ Breaking change for tests expecting synchronous updates

**Time:** 4-5 hours (needs opt-out for tests)

---

**Phase 2 Total:** +200 bytes, ~9 hours, **~60-80% faster runtime**

---

## PHASE 3: Semantic Foundation - Unified Subscription (Week 3) [COMPRESSION]
**Priority:** Replace 10+ subscription patterns with one API  
**ROI:** High maintainability / Medium risk / Foundation for future

### 3.1 Unified `subscribe()` API (improv-cop Pattern 4) ⚡ ARCHITECTURAL WIN
**Problem:** Subscription logic duplicated 10+ times with bracket-index handling scattered
**Current state:**
```javascript
// Repeated everywhere:
const rootRaw = String(t.name).split('.')[0];
const rootBase = (rootRaw.indexOf('[') !== -1) ? rootRaw.split('[')[0] : rootRaw;
const root = toCamel(rootBase);
const rootAlias = sigKey(rootBase);
if(!subs.has(root)) subs.set(root, []);
subs.get(root).push(handler);
// + bracket-index special logic
// + manual cleanup tracking
```

**Fix:**
```javascript
const subscribe = (signalPath, handler, mode = 'content', childPath = null) => {
  const roots = extractAllRoots(signalPath); // handles brackets automatically
  const entry = mode ? { fn: handler, mode, childPath } : handler;
  
  for(const root of roots) {
    if(!subs.has(root)) subs.set(root, []);
    subs.get(root).push(entry);
  }
  
  return () => roots.forEach(r => unsubscribe(r, handler)); // cleanup!
};

// Usage becomes ONE LINE everywhere:
const unsub = subscribe('posts[idx].title', handler, 'shape');
```

**Impact:**
- ✅ **-300 lines** (eliminates duplication)
- ✅ Bracket-index support automatic everywhere
- ✅ Built-in cleanup (fixes memory leaks)
- ✅ Foundation for Pattern 9 (ReactiveCell)
- ⚠️ Requires updating all setup functions
- ❌ +50 bytes (new API surface)

**Time:** 6-8 hours

---

### 3.2 Single-Pass Init (improv-cop Pattern 6) ⚡
**Problem:** Current `init()` queries DOM twice, loops attributes twice
**Fix:**
```javascript
const DIRECTIVE_HANDLERS = {
  'data-def': setupDef, 'data-sub': setupSub, 'data-sync': setupSync,
  'data-class': setupClass, 'data-disp': setupDisp, 'data-dump': setupDump,
  // ... extensible table
};

const init = () => {
  const defs = [], rest = [];
  document.querySelectorAll('*').forEach(el => {
    for(const a of el.attributes) {
      const key = a.name.split(/[_:]/)[0];
      const handler = DIRECTIVE_HANDLERS[key];
      if(!handler) continue;
      (key === 'data-def' ? defs : rest).push([el, a, handler]);
    }
  });
  defs.forEach(([el, a]) => setupDef(el, a.name, a.value));
  rest.forEach(([el, a, h]) => h(el, a.name, a.value));
};
```

**Impact:**
- ✅ **+50% faster init** (1 DOM query, 1 attribute loop)
- ✅ Extensible (add directive = register in table)
- ✅ -100 bytes (removes branching)
- ⚠️ Low risk

**Time:** 2-3 hours

---

**Phase 3 Total:** -350 bytes, ~10 hours, **Architectural foundation set**

---

## PHASE 4: Semantic Foundation - Unified Directive Factory (Week 4) [COMPRESSION]
**Priority:** Replace 500 lines of duplicate setup logic with factory  
**ROI:** Massive maintainability / High risk / Enables extensibility

### 4.1 Directive Factory (improv-cop Pattern 1) ⚡ BIGGEST CODE REDUCTION
**Problem:** `setupSub`, `setupClass`, `setupDisp`, `setupSync` are 80% identical
**Current:** Each has ~150 lines doing:
1. Parse attribute
2. Compile body
3. Create applier for each target
4. Apply modifiers to handler
5. Register with triggers

**Fix:**
```javascript
// Extract the universal pattern:
const createDirective = (type, parseOffset, createApplier) => (el, attr, body) => {
  const parsed = parseDataAttrFast(attr, parseOffset);
  if(!parsed || !validateParsed(parsed)) return;
  
  const fn = compile(body);
  const appliers = parsed.targets.map(t => createApplier(el, t));
  const handler = (ev, sg, detail) => {
    const dm = dmProxy; // from Phase 2
    const result = fn(dm, el, ev, sg, detail);
    appliers.forEach(apply => apply(result, dm, ev));
  };
  
  // Use unified subscribe from Phase 3:
  parsed.triggers.forEach(t => {
    const decorated = applyModifiers(handler, t.mods, t.globalMods);
    if(t.type === 'signal') subscribe(t.name, decorated, t.mode || 'content');
    else if(t.type === 'event') registerEvent(el, t, decorated);
    // ...
  });
};

// Now directives are ONE-LINERS:
const setupSub = createDirective('sub', 8, (el, t) => (val) => applyToTarget(el, t, val));
const setupClass = createDirective('class', 10, (el, t) => (val) => toggleClass(el, t, val));
const setupDisp = createDirective('disp', 9, (el, t) => (val) => toggleDisplay(el, t, val));
```

**Impact:**
- ✅ **-500 lines** (massive reduction)
- ✅ Add new directive in 1 line
- ✅ All modifiers/guards work for every directive automatically
- ✅ Centralized validation & error handling
- ⚠️ HIGH RISK: touches all setup functions
- ❌ +100 bytes (factory overhead)

**Compatibility with improve.md #7:** This IS improve.md #7 done properly (more thorough)

**Time:** 12-15 hours + extensive testing

---

### 4.2 Unified Modifier Pipeline (improv-cop Pattern 3)
**Problem:** Modifier decoration duplicated inline everywhere
**Fix:**
```javascript
const modPipeline = [
  (h, m) => m.prevent ? (ev => (ev?.preventDefault(), h(ev))) : h,
  (h, m) => m.debounce ? debounce(h, m.debounce) : h,
  (h, m) => m.throttle ? throttle(h, m.throttle) : h,
  (h, m) => m.once ? once(h) : h,
  (h, m) => applyGuards(h, m) // gt, lt, eq, and, notand
];

const applyModifiers = (handler, mods, globalMods) => 
  modPipeline.reduce((h, stage) => stage(h, {...globalMods, ...mods}), handler);
```

**Impact:**
- ✅ -200 lines
- ✅ Add new modifier = push to array
- ✅ Modifier order explicit
- ❌ +80 bytes

**Time:** 3-4 hours

---

**Phase 4 Total:** -620 bytes, ~18 hours, **Smallest runtime yet**

---

## PHASE 5: Advanced Optimization (Week 5) [INCREMENTAL + COMPRESSION]
**Priority:** Mix remaining improve.md gains with targeted compression  
**ROI:** Medium performance / Low risk

### 5.1 RAF Batching with Topological Sort Preparation
**Problem:** Rapid updates cause thrashing; no update ordering
**Fix:** (improve.md #3) + prepare for dataflow graph
```javascript
let pending = new Map(); // path -> mutation info
let rafId = null;

const scheduleEmit = (path, mutationType, diff) => {
  pending.set(path, { mutationType, diff });
  if(!rafId) rafId = requestAnimationFrame(() => {
    rafId = null;
    // Future: topological sort here
    pending.forEach((info, p) => emit(p, info.mutationType, info.diff));
    pending.clear();
  });
};
```

**Impact:**
- ✅ +30-50% faster animations
- ✅ Foundation for graph ordering (Pattern 10)
- ❌ +150 bytes
- ⚠️ Breaking: tests need RAF awaits

**Time:** 4-5 hours

---

### 5.2 Semantic Parser (improv-cop Pattern 5)
**Problem:** `parseDataAttrFast` returns tokens; every caller interprets them
**Fix:**
```javascript
// Parser returns RESOLVED objects:
const parseDirective = (attr, type) => {
  const tokens = tokenize(attr);
  return {
    targets: tokens.targets.map(t => resolveTarget(t, null)), // ready to use!
    triggers: tokens.triggers.map(t => resolveTrigger(t)),    // ready to use!
    globalMods: tokens.globalMods
  };
};

// Callers just USE results:
const { targets, triggers } = parseDirective(attr, 'sub');
targets.forEach(t => t.write(value)); // t.type, t.el, t.prop all resolved
```

**Impact:**
- ✅ -300 lines (eliminates interpretation loops)
- ✅ Parser testable in isolation
- ✅ +15% faster (no repeated resolution)
- ⚠️ Medium risk (changes contract)

**Better than improve.md #4:** Returns semantic objects, not regex captures

**Time:** 6-8 hours

---

### 5.3 Split `set()` Function (improv-cop Pattern 7)
**Problem:** `set()` does 3 unrelated things (detect, apply, notify)
**Fix:**
```javascript
const detectMutation = (path, newValue) => { /* shape vs content */ };
const applyMutation = (path, newValue) => { /* clone + assign */ };
const notifySubscribers = (path, mutationType, diff) => { /* emit */ };

const set = (path, value, force = false) => {
  if(!force && get(path) === value) return;
  const mutation = detectMutation(path, value);
  const diff = applyMutation(path, value);
  scheduleEmit(path, mutation, diff); // uses RAF from 5.1
};
```

**Impact:**
- ✅ Testable components
- ✅ Foundation for batching, undo/redo
- ✅ -50 bytes (better structure)

**Time:** 2-3 hours

---

**Phase 5 Total:** -200 bytes, ~14 hours, **Mature architecture**

---

## PHASE 6: ReactiveCell Foundation (Week 6+) [COMPRESSION - FUTURE]
**Priority:** Architectural transformation for 2.0  
**ROI:** Enables advanced features / High risk / Long-term payoff

### 6.1 ReactiveCell Abstraction (improv-cop Pattern 9)
**Problem:** Signals, props, events treated differently — but they're all reactive values
**Vision:**
```javascript
class ReactiveCell {
  constructor(getter, setter, subscriber) {
    this.get = getter;
    this.set = setter || null;
    this.subscribe = subscriber;
  }
}

const signalCell = (path) => new ReactiveCell(
  () => get(path),
  (v) => set(path, v),
  (fn) => subscribe(path, fn)
);

const propCell = (el, prop) => new ReactiveCell(
  () => el[prop],
  (v) => el[prop] = v,
  (fn) => el.addEventListener(getAutoEvent(el), fn)
);
```

**Impact:**
- ✅ **-1500 lines** (unifies everything)
- ✅ Foundation for computed values, derived state
- ✅ Can visualize reactive graph
- ⚠️ VERY HIGH RISK: complete rewrite
- ❌ +200 bytes (new abstraction)

**Time:** 20-30 hours (prototype + migrate)

---

### 6.2 Dataflow Graph Runtime (improv-cop Pattern 10)
**Problem:** We're simulating a graph with callbacks — why not use an actual graph?
**Vision:**
```javascript
class DataflowGraph {
  addNode(id, inputs, transform, outputs) { /* ... */ }
  propagate(startNode) { /* topological sort + eval */ }
}

// All directives become graph nodes
// Execution = graph.propagate(changedSignal)
```

**Impact:**
- ✅ Circular dependency detection (free!)
- ✅ Optimal update ordering (free!)
- ✅ Serializable state, time-travel debugging
- ✅ **~2-3x faster** (optimal scheduling)
- ⚠️ ARCHITECTURAL REWRITE

**Time:** 40-60 hours (research + implement)

---

**Phase 6 Total:** -1300 bytes (!), ~60 hours, **dmax 2.0 foundation**

---

## Complete Roadmap Summary

### Weeks 1-2: Incremental Fixes (Production v1.0)
| Phase | Focus | Size | Speed | Safety | Time |
|-------|-------|------|-------|--------|------|
| 1 | Validation | +370b | - | ✅✅✅ | 6h |
| 2 | Perf wins | +200b | **+70%** | ✅ | 9h |
| **Total** | **v1.0** | **+570b** | **+70%** | **✅✅** | **15h** |

### Weeks 3-5: Semantic Compression (Production v1.5)
| Phase | Focus | Size | Speed | Safety | Time |
|-------|-------|------|-------|--------|------|
| 3 | Unified subscribe | -350b | +10% | ✅ | 10h |
| 4 | Directive factory | -620b | +5% | ⚠️ | 18h |
| 5 | Advanced opt | -200b | **+40%** | ✅ | 14h |
| **Total** | **v1.5** | **-1170b** | **+60%** | **✅** | **42h** |

### Week 6+: Architectural Transform (Research v2.0)
| Phase | Focus | Size | Speed | Safety | Time |
|-------|-------|------|-------|--------|------|
| 6 | ReactiveCell | -1300b | **+150%** | ⚠️⚠️ | 60h |
| **Total** | **v2.0** | **-2470b** | **+280%** | **⚠️** | **60h** |

---

## Final Metrics Comparison

| Version | Size (min+gz) | Speed | Pass Rate | Status |
|---------|---------------|-------|-----------|--------|
| **Current** | 2.8KB | 1.0x | 64% | ⚠️ Beta |
| **v1.0** (Wk 2) | 3.4KB | **1.7x** | **95%** | ✅ **Production** |
| **v1.5** (Wk 5) | **2.2KB** | **2.7x** | **98%** | ✅ **Optimized** |
| **v2.0** (Wk 6+) | **1.3KB** | **3.8x** | **99%** | 🔬 Research |

---

## Recommendation: Phased Delivery

### Ship v1.0 (Weeks 1-2) — IMMEDIATE VALUE
**Do:** Phase 1 + Phase 2.1-2.3 (validation + Proxy + fast paths)  
**Skip:** RAF batching (breaking), regex parser (rewrite risk)  
**Result:** Production-safe, 70% faster, 95% fuzzer pass  
**Commitment:** 15 hours

### Ship v1.5 (Weeks 3-5) — OPTIMAL INCREMENTAL
**Do:** Phase 3 (subscribe API) + Phase 4.1 (directive factory) + Phase 5.2 (semantic parser)  
**Skip:** Phase 6 (too risky), full Pattern 10 (need more research)  
**Result:** Smallest runtime, 2.7x faster, extensible architecture  
**Commitment:** +42 hours (57 total)

### Research v2.0 (Month 2+) — LONG-TERM VISION
**Do:** Prototype ReactiveCell + Dataflow graph in separate branch  
**Benchmark:** Compare against v1.5 before committing  
**Migration:** Write converter for existing apps  
**Result:** Theoretical 3.8x faster, <1.5KB, visual debugging  
**Commitment:** 60+ hours + validation

---

## Casey Muratori Verdict

**What improve.md gets right:**
- Validation first (can't optimize broken code)
- Measurable wins (Proxy dm, fast paths)
- Safe increments

**What improv-cop.md adds:**
- Semantic compression > local optimization
- "Find the 10 operations" philosophy
- Unified abstractions eliminate 70% of code

**Hybrid approach:**
1. **Fix first** (Phase 1)
2. **Prove concepts** (Phase 2 — Proxy is ReactiveCell prototype)
3. **Compress** (Phases 3-5 — unified APIs)
4. **Transform** (Phase 6 — when ready)

**Priority:** Ship v1.0 fast (2 weeks), then decide if v1.5 or v2.0 based on user feedback.

---

## Next Immediate Actions

1. **Phase 1.1** (Fix fuzzer) — 3 hours → fuzzer green
2. **Phase 2.1** (Proxy dm) — 4 hours → benchmark proof
3. **Decision point:** Ship v1.0 or continue to v1.5?
4. **Write upgrade guide** for each phase (breaking changes)

