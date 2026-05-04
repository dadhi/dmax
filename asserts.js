// @js-check
(function () {
  const __savedDm = new Map(_dm)
  const __savedSubs = new Map(Array.from(_subs, ([root, handlers]) => [root, handlers.slice()]))
  const __savedCleanupBoundSubs = new Map(Array.from(_cleanupBoundSubs, ([node, handlers]) => [node, handlers.slice()]))
  const __savedDebugEls = new Set(_debugEls)
  const __savedDebugQueued = _debugQueued

  function __restoreAssertState() {
    _dm.clear()
    for (const [root, value] of __savedDm) _dm.set(root, value)

    _subs.clear()
    for (const [root, handlers] of __savedSubs) _subs.set(root, handlers.slice())

    _cleanupBoundSubs.clear()
    for (const [node, handlers] of __savedCleanupBoundSubs) _cleanupBoundSubs.set(node, handlers.slice())

    _debugEls.clear()
    for (const el of __savedDebugEls) _debugEls.add(el)
    _debugQueued = __savedDebugQueued
    updateDebug()
  }

  //-------------test code-------------------
  const stableStringify = (val) => {
      if (Array.isArray(val)) return `[${val.map(stableStringify).join(',')}]`;
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        return `{${Object.keys(val).sort().map(key => `${JSON.stringify(key)}:${stableStringify(val[key])}`).join(',')}}`;
      }
      return JSON.stringify(val);
  };
  const deepEqual = (a, b) => {
      if (a === b) return true;
      const aObj = a && typeof a === 'object';
      const bObj = b && typeof b === 'object';
      if (!aObj && !bObj) return Object.is(a, b);
      return stableStringify(a) === stableStringify(b);
  };
  const fmt = (val) => (typeof val === 'string' ? `'${val}'` : stableStringify(val));
  const __assert = (fn, args, expected, label) => {
      const fname = fn && fn.name ? fn.name : '(anonymous)';
      const head = label ? `${fname} — ${label}` : fname;
      try {
        const actual = Array.isArray(args) ? fn(...args) : fn(args);
        const pass = deepEqual(actual, expected);
        if (pass)
          console.log('✓', head, '>>>', fmt(actual));
        else
          console.error('✗', head, '>>> expected:', fmt(expected), 'actual:', fmt(actual));
      } catch (err) {
        const em = err && err.message ? err.message : String(err)
        const es = err && err.stack ? err.stack : ''
        console.error('✗', head, '>>> threw:', em, es, '>>> expected:', fmt(expected));
      }
  };
    __assert(indexFirst, ['abcdefg', ['x', 'y', 'z']], -1, 'none found');
    __assert(indexFirst, ['abcdefg', ['x', 'c', 'z']], 2, 'one found');
    __assert(indexFirst, ['abcdefgabc', ['a', 'b', 'c'], 3], 7, 'multiple found with pos');
    __assert(indexFirst, ['abcdefg', ['a'], 10], -1, 'pos out of range');
    __assert(kebabToCamel, ['foo-bar'], 'fooBar', 'basic case');
    __assert(kebabToCamel, ['-bar'], 'Bar', 'lead single');
    __assert(kebabToCamel, ['bar-'], 'bar', 'trail single');
    __assert(kebabToCamel, ['multi-part-key'], 'multiPartKey', 'multi part');
    __assert(kebabToCamel, ['-'], '', 'single dash');
    __assert(kebabToCamel, ['--'], '', 'multi dashes only');
    __assert(kebabToCamel, ['--leading--dashes'], 'LeadingDashes', 'leading dashes');
    __assert(kebabToCamel, ['trailing--dashes-'], 'trailingDashes', 'trailing dashes');
    __assert(parseItem, ['XXX', TRIG, '#hey.foo.bar-baz'], { "kind": EV_PROP, "not": null, "path": ["foo", "barBaz"], "root": "hey" }, 'trigger #id.prop.prop')
    __assert(parseItem, ['XXX', TARG, 'foo-bar'], { "kind": SIGNAL, "not": null, "path": null, "root": "fooBar" }, 'target kebab to camel');
    __assert(parseItem, ['XXX', TRIG, '#el.some.prop'], { "kind": EV_PROP, "not": null, "path": ["some", "prop"], "root": "el" }, 'trigger id and path');
    __assert(parseItem, ['XXX', TRIG, '!foo'], { "kind": SIGNAL, "not": true, "path": null, "root": "foo" }, 'negated once');
    __assert(parseItem, ['XXX', TRIG, '!!foo'], { "kind": SIGNAL, "not": false, "path": null, "root": "foo" }, 'double negation even');
    __assert(parseItem, ['XXX', TARG, 'foo.'], { "kind": SIGNAL, "not": null, "path": null, "root": "foo" }, 'trailing dot yields null path');
    __assert(parseItem, ['XXX', TARG, 'a..b'], null, 'error: empty middle segment');
    __assert(parseItem, ['XXX', TARG, 'foo.bar-baz.qux-quux'], { "kind": SIGNAL, "not": null, "path": ["barBaz", "quxQuux"], "root": "foo" }, 'path segments kebab->camel');
    __assert(parseItem, ['XXX', MOD, '!eq.3'], { "kind": MOD, "not": true, "path": "3", "root": "eq" }, 'mod with negation and numeric path');
    __assert(parseItem, ['XXX', MOD, '!eq.'], { "kind": MOD, "not": true, "path": null, "root": "eq" }, 'mod with negation and dot at the end permitted');
    __assert(parseItem, ['XXX', TARG, ''], null, 'error: empty name returns nulls');
    __assert(parseItem, ['YYY', TARG, '.'], { "kind": EV_PROP, "not": null, "path": null, "root": "" }, 'error: empty name returns nulls');
    __assert(parseItem, ['YYY', TARG, '!'], null, 'error: exclamation mark alone');
    __assert(parse, ['data-def'], [{}, 8], 'empty')
    __assert(parse, ['data-sub:'], [{}, 9], 'single empty')
    __assert(parse, ['data-sub:.'], [{ ":": [{ "kind": EV_PROP, "mods": null, "not": null, "path": null, "root": "" }] }, 10], 'default prop')
    __assert(parse, ['data-sub^mod'], [{ "^": [{ "kind": MOD, "not": null, "path": null, "root": "mod" }] }, 12], 'global mod')
    __assert(parse, ['data-sub^mod.some-foo.value^!eq.3'], [{ "^": [{ "kind": MOD, "not": null, "path": { "kind": "s", "not": false, "path": ["value"], "root": "someFoo" }, "root": "mod" }, { "kind": MOD, "not": true, "path": "3", "root": "eq" }] }, 33], '2 global mods')
    __assert(parse, ['data-sub^mod^@hey^foo:bar'], [{ ":": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "mod" }], "not": null, "path": null, "root": "bar" }], "@": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "foo" }, { "kind": MOD, "not": null, "path": null, "root": "mod" }], "not": null, "path": null, "root": "hey" }], "^": [{ "kind": MOD, "not": null, "path": null, "root": "mod" }] }, 25], '2 global mods and item with mod with item')
    __assert(parse, ['data-sub@!xxx@!'], [{ "@": [{ "kind": SIGNAL, "mods": null, "not": true, "path": null, "root": "xxx" }] }, 15], 'not name and not empty')
    __assert(parse, ['data-sub:xxx:'], [{ ":": [{ "kind": SIGNAL, "mods": null, "not": null, "path": null, "root": "xxx" }] }, 13], 'single name')
    __assert(parse, ['data-sub::'], [{}, 10], '2 empties')
    __assert(parse, ['data-sub:foo^'], [{ ":": [{ "kind": SIGNAL, "mods": null, "not": null, "path": null, "root": "foo" }] }, 13], 'name+empty mod')
    __assert(parse, ['data-sub:foo^^'], [{ ":": [{ "kind": SIGNAL, "mods": null, "not": null, "path": null, "root": "foo" }] }, 14], 'name+2 empty mods')
    __assert(parse, ['data-sub:foo-bar^bax.3'], [{ ":": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": "3", "root": "bax" }], "not": null, "path": null, "root": "fooBar" }] }, 22], 'item^mod')
    __assert(parse, ['data-sub:foo-bar^bax.3@!something^nice'], [{ ":": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": "3", "root": "bax" }], "not": null, "path": null, "root": "fooBar" }], "@": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "nice" }], "not": true, "path": null, "root": "something" }] }, 38], 'item^mod@item2^mod')
    __assert(parse, ['data-sub^ge.2^le.5@foo^le.4'], [{ "@": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": "4", "root": "le" }, { "kind": MOD, "not": null, "path": "2", "root": "ge" }, { "kind": MOD, "not": null, "path": "5", "root": "le" }], "not": null, "path": null, "root": "foo" }], "^": [{ "kind": MOD, "not": null, "path": "2", "root": "ge" }, { "kind": MOD, "not": null, "path": "5", "root": "le" }] }, 27], 'combine global+local mods and keep repeats')
    __assert(parse, ['data-sub^hey@foo:bar+bax'], [{ "+": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }], "not": null, "path": null, "root": "bax" }], ":": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }], "not": null, "path": null, "root": "bar" }], "@": [{ "kind": SIGNAL, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }], "not": null, "path": null, "root": "foo" }], "^": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }] }, 24], 'push all global mods to items')
    __assert(__sign, ['data-def', '{foo: {bar: "hey"}, baz: 1}'], { "baz": 1, "foo": { "bar": "hey" } }, '2 value signals')
    __assert(__sign, ['data-def:foo', '{bar: "hey"}'], { "foo": { "bar": "hey" } }, 'signal = value')
    __assert(__sign, ['data-def:foo-bar:baz'], { "baz": null, "fooBar": null }, 'signals')
    __assert(__sign, ['data-def:foo-bar:baz', '`Mamma Mia ${42}`'], { "baz": "Mamma Mia 42", "fooBar": "Mamma Mia 42" }, 'bonkers')
    __assert(__signEl, [{ "name": "John" }, 'data-def:foo', '"Hey, " + el.name'], { "foo": "Hey, John" }, 'using el')
    __assert(__signDmSet, ['name', 'Noize', 'data-def:greet', '"Hey, " + dm.name'], { "name": "Noize", "greet": `Hey, Noize` }, 'using dm')
    __assert(__getElById, ['foo', 'data-sub:#foo@bar'], 'good', 'get existing elem')
    __assert(getPropValAndDepth, [getElById('foo', 'xxx'), ['textContent']], ['good', 1], 'depth 1')
    __assert(getPropValAndDepth, [{ foo: { bar: { baz: 42 } } }, ['foo', 'bar', 'baz']], [42, 3], '42')
    __assert(getPropValAndDepth, [{ foo: { bar: null } }, ['foo', 'bar', 'baz']], [null, 2], 'null')
    __assert(valChangedDeep, ['foo', 'bar'], true, '2 diff strings')
    __assert(valChangedDeep, [null, []], true, 'null vs empty arr')
    __assert(valChangedDeep, [[], []], false, '2 empty arrays')
    __assert(valChangedDeep, [[42], [42]], false, '2 value arrays')
    __assert(valChangedDeep, [{ foo: 1 }, { foo: 1 }], false, '2 simple objects')
    __assert(valChangedDeep, [{ foo: 1 }, { foo }], true, '2 simple non equal objects')
    __assert(valChangedDeep, [{ foo: 1 }, null], true, 'object and null')
    __assert(valChangedDeep, [{ foo: 1, bar: [{ baz: [42] }] }, { foo: 1, bar: [{ baz: [42] }] }], false, 'complex objects')
    __assert(valChangedDeep, [[1, 5, 6, 7], [5, 6, 7, 8]], true, 'flat diff arrays')
    __assert(valChangedDeep, [[5, 6, 7, 8], [5, 6, 7, 8]], false, 'flat equal arrays')
    __assert(setProp, [{ value: 'Answer42' }, 'data-eval:.', { kind: EV_PROP, not: null, root: "", path: null }, 'Seaman!'],
      'Seaman!', 'default prop')
    __assert(setProp, [null, 'data-eval:#foo.', { kind: EV_PROP, not: null, root: 'foo', path: null }, 'Seaman!'],
      'Seaman!', '#foo default prop')
    __assert(setProp, [null, 'data-eval:#foo.style.color', { kind: EV_PROP, not: null, root: 'foo', path: ['style', 'color'] }, 'lime'],
      'lime', '#foo nested prop')
    __assert(setProp, [null, 'data-eval:foo', { kind: SIGNAL, not: null, root: 'foo', path: ['style', 'color'] }, 'lime'],
      null, 'unexpected signal')
    __assert(diffShapeShallow, ['a', 'b'], null, 'non-objects => no shape change')
    __assert(diffShapeShallow, [[1, 2], [3, 4]], null, 'arrays same length')
    __assert(diffShapeShallow, [[1, 2], [1, 2, 3, 4, 5]], { addedRange: [2, 3] }, 'arrays added tail')
    __assert(diffShapeShallow, [[1, 2, 3, 4, 5], [1, 2]], { removedRange: [2, 3] }, 'arrays removed tail')
    __assert(diffShapeShallow, [[], []], null, 'arrays both empty')
    __assert(diffShapeShallow, [{ a: 1 }, { a: 2 }], null, 'objects same keys different values')
    __assert(diffShapeShallow, [{ a: 1 }, { a: 1, b: 2 }], { added: ['b'] }, 'objects add key')
    __assert(diffShapeShallow, [{ a: 1, b: 2 }, { a: 1 }], { removed: ['b'] }, 'objects remove key')
    __assert(diffShapeShallow, [{ a: 1, b: 2 }, { a: 1, c: 3 }], { added: ['c'], removed: ['b'] }, 'objects add+remove')
    __assert(diffShapeShallow, [[1, 2, 3], { a: 1, b: 2 }], { added: ['a', 'b'], removedRange: [0, 3] }, 'array to object')
    __assert(diffShapeShallow, [{ a: 1, b: 2 }, [1, 2, 3]], { removed: ['a', 'b'], addedRange: [0, 3] }, 'object to array')
    __assert(isJsonContentType, ['application/problem+json; charset=utf-8'], true, 'json content-type +json with semicolon')
    __assert(isJsonContentType, ['application/problem+json\tcharset=utf-8'], true, 'json content-type +json with tab separator')
    __assert(isJsonContentType, ['application/problem+jsonified'], false, 'json content-type +json boundary check')
    // @TEST register sink subscriber
    function __reg(root, path, changeMod, sink) {
      let arr = _subs.get(root)
      if (!arr) _subs.set(root, arr = []);
      arr.push({ fn: (d) => sink.push(d), changeMod, path });
    }
    function __reset() { _subs.clear(); _dm.clear() }
    function __tSetD() {
      __reset();
      _dm.set('user', { name: 'Alice', age: 30 });
      const sh = [], nm = [], age = [], deep = [];
      __reg('user', null, SG_CHANGED_WITH_SHAPE, sh);
      __reg('user', ['name'], SG_CHANGED_WITH_SHAPE, nm);
      __reg('user', ['age'], SG_CHANGED_WITH_SHAPE, age);
      __reg('user', ['name', 'first'], SG_CHANGED_WITH_SHAPE, deep);
      _setSignalAndNotifySubs('t', { root: 'user', path: ['name'] }, 'Bob');
      return { r: sh.length, nm: nm.length, age: age.length, deep: deep.length, val: _dm.get('user')?.name ?? null };
    }
    __assert(__tSetD, [], { r: 1, nm: 1, age: 0, deep: 0, val: 'Bob' }, 'path update, exact match');
    function __tSetE() {
      __reset();
      _dm.set('user', { children: [1, 2] });
      const c0 = [], c1 = [], c2 = [];
      __reg('user', ['children'], SG_CHANGED_ANY, c0);
      __reg('user', ['children'], SG_CHANGED_WITH_SHAPE, c1);
      __reg('user', ['children'], SG_CHANGED_SHAPE_ONLY, c2);
      _setSignalAndNotifySubs('t', { root: 'user', path: ['children'] }, [1, 2, 3, 4]);
      const d1 = c1.length ? c1[c1.length - 1] : null;
      const d2 = c2.length ? c2[c2.length - 1] : null;
      return { c0: c0.length, c1: c1.length, c2: c2.length, d1, d2, val: _dm.get('user')?.children };
    }
    __assert(__tSetE, [], { c0: 1, c1: 1, c2: 1, d1: { addedRange: [2, 2] }, d2: { addedRange: [2, 2] }, val: [1, 2, 3, 4] }, 'path update shape arrays');
    function __tSetA() {
      __reset()
      _dm.set('sg', 1);
      _setSignalAndNotifySubs('t', { root: 'sg', path: null }, 2);
      return _dm.get('sg');
    }
    __assert(__tSetA, [], 2, 'root update no subs');
    function __tSetB() {
      __reset();
      _dm.set('sg', 'a');
      const c0 = [], c1 = [], c2 = [];
      __reg('sg', null, SG_CHANGED_ANY, c0);
      __reg('sg', null, SG_CHANGED_WITH_SHAPE, c1);
      __reg('sg', null, SG_CHANGED_SHAPE_ONLY, c2);
      _setSignalAndNotifySubs('t', { root: 'sg', path: null }, 'b');
      return { c0: c0.length, c1: c1.length, c2: c2.length, val: _dm.get('sg') };
    }
    __assert(__tSetB, [], { c0: 1, c1: 1, c2: 0, val: 'b' }, 'root content change notify vs shape');
    function __tSetC() {
      __reset();
      _dm.set('sg', [1, 2]);
      const c0 = [], c1 = [], c2 = [];
      __reg('sg', null, SG_CHANGED_ANY, c0);
      __reg('sg', null, SG_CHANGED_WITH_SHAPE, c1);
      __reg('sg', null, SG_CHANGED_SHAPE_ONLY, c2);
      _setSignalAndNotifySubs('t', { root: 'sg', path: null }, [1, 2, 3, 4]);
      const d1 = c1.length ? c1[c1.length - 1] : null;
      const d2 = c2.length ? c2[c2.length - 1] : null;
      return { c0: c0.length, c1: c1.length, c2: c2.length, d1, d2, val: _dm.get('sg') };
    }
    __assert(__tSetC, [], { c0: 1, c1: 1, c2: 1, d1: { addedRange: [2, 2] }, d2: { addedRange: [2, 2] }, val: [1, 2, 3, 4] }, 'root shape change arrays');
    function __tTrigModsEqNe() {
      __reset();
      _dm.set('a', 5)
      let c = 0
      const h = applyTrigMods(() => ++c, { kind: SIGNAL, root: 'a', path: null, not: null }, [{ root: MOD_EQ, path: '5' }, { root: MOD_NE, path: '6' }])
      h()
      _dm.set('a', 6)
      h()
      return c
    }
    __assert(__tTrigModsEqNe, [], 1, 'applyTrigMods: eq/ne filter');
    function __tTrigModsAnd() {
      __reset();
      _dm.set('gate', false)
      let c = 0
      const h = applyTrigMods(() => ++c, { kind: EV_PROP, root: '', path: null, not: null }, [{ root: MOD_AND, path: 'gate' }])
      h(null, null, 1)
      _dm.set('gate', true)
      h(null, null, 2)
      return c
    }
    __assert(__tTrigModsAnd, [], 1, 'applyTrigMods: and gate');
    function __tTrigModsPreventOnce() {
      let p = 0, r = 0, c = 0
      const ev = { preventDefault: () => ++p }
      const h = applyTrigMods(() => ++c, { kind: EV_PROP, root: '', path: null, not: null }, [{ root: MOD_PREVENT, path: null }, { root: MOD_ONCE, path: null }])
      h.remove = () => ++r
      h(ev, null, null)
      return { p, r, c }
    }
    __assert(__tTrigModsPreventOnce, [], { p: 1, r: 1, c: 1 }, 'applyTrigMods: prevent + once');
    function __tTrigModsDebounce() {
      const st = setTimeout, ct = clearTimeout
      let id = 0
      const q = new Map()
      setTimeout = (cb, _ms, ...args) => (q.set(++id, [cb, args]), id)
      clearTimeout = (n) => q.delete(n)
      try {
        const out = []
        const h = applyTrigMods((_ev, _sg, dt) => out.push(dt), { kind: EV_PROP, root: '', path: null, not: null }, [{ root: MOD_DEBOUNCE, path: 8 }])
        h(null, null, 1)
        h(null, null, 2)
        for (const [k, v] of q) {
          q.delete(k)
          v[0](...v[1])
        }
        return out
      } finally {
        setTimeout = st
        clearTimeout = ct
      }
    }
    __assert(__tTrigModsDebounce, [], [2], 'applyTrigMods: debounce keeps last call');
    function __tTrigModsThrottle() {
      const dn = Date.now
      let now = 100
      Date.now = () => now
      try {
        const out = []
        const h = applyTrigMods((_ev, _sg, dt) => out.push(dt), { kind: EV_PROP, root: '', path: null, not: null }, [{ root: MOD_THROTTLE, path: 10 }])
        h(null, null, 1)
        now = 105
        h(null, null, 2)
        now = 111
        h(null, null, 3)
        return out
      } finally {
        Date.now = dn
      }
    }
    __assert(__tTrigModsThrottle, [], [1, 3], 'applyTrigMods: throttle rate limit');
    function __tTrigModsRepeatedPermitChecks() {
      __reset();
      _dm.set('gateA', true)
      _dm.set('gateB', false)
      let c = 0
      const mods = [{ root: MOD_AND, path: 'gateA' }, { root: MOD_AND, path: 'gateB' }, { root: MOD_GE, path: '5' }, { root: MOD_LT, path: '9' }, { root: MOD_NE, path: '7' }]
      const h = applyTrigMods(() => ++c, { kind: EV_PROP, root: '', path: null, not: null }, mods)
      h(null, 6, null)
      _dm.set('gateB', true)
      h(null, 4, null)
      h(null, 7, null)
      h(null, 8, null)
      return c
    }
    __assert(__tTrigModsRepeatedPermitChecks, [], 1, 'applyTrigMods: repeated and/check permit mods');
    function __tSubImmediateProp() {
      __reset();
      const fooEl = getElById('foo', 'probe'); if (fooEl) fooEl.textContent = 'good';
      const before = fooEl?.textContent || '';
      dSub(null, 'data-sub:#foo.', `'Seaman!'`);
      const after = fooEl?.textContent || '';
      return { before, after };
    }
    __assert(__tSubImmediateProp, [], { before: 'good', after: 'Seaman!' }, 'dSub immediate prop set on #foo');
    function __tSubEventSignal() {
      __reset();
      try {
        const btn = document.createElement('button');
        dSub(btn, 'data-sub:sg@.', `'A'`);
        const hs = (typeof _cleanupBoundSubs !== 'undefined' && _cleanupBoundSubs && _cleanupBoundSubs.get)
          ? (_cleanupBoundSubs.get(btn) || EMPTY_ARR)
          : EMPTY_ARR
        const h = hs.find ? hs.find(x => x && x.type === 'event' && x.handler) : null
        if (h && h.handler) h.handler({ type: 'click', detail: null, preventDefault() { } })
        else btn.dispatchEvent(mkEv('click'));
        return { sg: DM['sg'], diag: h ? 'direct-handler' : 'dispatch' };
      } catch (e) {
        return { sg: DM['sg'], diag: 'error:' + (e && e.message ? e.message : String(e)) }
      }
    }
    __assert(__tSubEventSignal, [], { sg: 'A', diag: 'direct-handler' }, 'dSub event click sets signal');
    function __tSubEventPropToSignal() {
      __reset();
      try {
        const inp = document.createElement('input');
        inp.value = 'Zed';
        dSub(inp, 'data-sub:out@.', 'val');
        const hs = (typeof _cleanupBoundSubs !== 'undefined' && _cleanupBoundSubs && _cleanupBoundSubs.get)
          ? (_cleanupBoundSubs.get(inp) || EMPTY_ARR)
          : EMPTY_ARR
        const h = hs.find ? hs.find(x => x && x.type === 'event' && x.handler) : null
        if (h && h.handler) h.handler({ type: 'change', detail: null, preventDefault() { } })
        else inp.dispatchEvent(mkEv('change'));
        return { out: DM['out'], diag: h ? 'direct-handler' : 'dispatch' };
      } catch (e) {
        return { out: DM['out'], diag: 'error:' + (e && e.message ? e.message : String(e)) }
      }
    }
    __assert(__tSubEventPropToSignal, [], { out: 'Zed', diag: 'direct-handler' }, 'dSub event passes element value to signal');
    function __tSubSignalImmediateAndChange() {
      __reset();
      _dm.set('foo', 7);
      const el = document.createElement('div');
      dSub(el, 'data-sub:bar@foo^immediate', 'dm.foo');
      const im = DM['bar'];
      _setSignalAndNotifySubs('test', { root: 'foo', path: null }, 8);
      const after = DM['bar'];
      return { im, after };
    }
    __assert(__tSubSignalImmediateAndChange, [], { im: 7, after: 8 }, 'dSub @foo^immediate and change propagation');
    function __tSubExplicitIdEventPath() {
      __reset();
      const id = 'evtbtnexplicit'
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = 'C';
      document.body.appendChild(btn);
      try {
        dSub(btn, `data-sub:eventMeta@#${id}.click`, `({kind: trig.kind, root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
        btn.dispatchEvent(mkEv('click'));
        return DM['eventMeta'];
      } finally { btn.remove(); }
    }
    __assert(__tSubExplicitIdEventPath, [], { kind: EV_PROP, root: 'evtbtnexplicit', path: ['click'], val: 'C', detailType: 'click' }, 'dSub explicit #id event path metadata');
    function __tSubExplicitIdPropPath() {
      __reset();
      const id = 'evtinputprop'
      const inp = document.createElement('input');
      inp.id = id;
      inp.value = 'Alpha';
      document.body.appendChild(inp);
      try {
        dSub(inp, `data-sub:propMeta@#${id}.value`, `({kind: trig.kind, root: trig.root, path: trig.path, val})`);
        inp.dispatchEvent(mkEv('change'));
        return DM['propMeta'];
      } finally { inp.remove(); }
    }
    __assert(__tSubExplicitIdPropPath, [], { kind: EV_PROP, root: 'evtinputprop', path: ['value'], val: 'Alpha' }, 'dSub explicit #id prop trigger path');
    function __tSubSpecialWindowAndDocument() {
      __reset();
      const host = document.createElement('div');
      dSub(host, 'data-sub:winMeta@_window.resize', `({root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
      dSub(host, 'data-sub:docMeta@_document.visibilitychange', `({root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
      window.dispatchEvent(mkEv('resize'));
      document.dispatchEvent(mkEv('visibilitychange'));
      return { win: DM['winMeta'], doc: DM['docMeta'] };
    }
    __assert(__tSubSpecialWindowAndDocument, [], {
      win: { root: 'window', path: ['resize'], val: 'resize', detailType: 'resize' },
      doc: { root: 'document', path: ['visibilitychange'], val: 'visibilitychange', detailType: 'visibilitychange' }
    }, 'dSub window/document special triggers');
    function __tSubSpecialFormPath() {
      __reset();
      const form = document.createElement('form');
      const input = document.createElement('input');
      form.appendChild(input);
      document.body.appendChild(form);
      try {
        dSub(input, 'data-sub:formMeta@_form.submit', `({root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
        const ev = mkEv('submit')
        form.dispatchEvent(ev)
        return DM['formMeta']
      } finally { form.remove() }
    }
    __assert(__tSubSpecialFormPath, [], { root: 'form', path: ['submit'], val: 'submit', detailType: 'submit' }, 'dSub form special trigger');
    function __tSubSpecialIntervalAndTimeout() {
      __reset();
      const st = setTimeout, si = setInterval
      const qTo = [], qInt = []
      setTimeout = (cb, _ms) => (qTo.push(cb), qTo.length)
      setInterval = (cb, _ms) => (qInt.push(cb), qInt.length)
      try {
        const host = document.createElement('div')
        dSub(host, 'data-sub:intMeta@_interval.25', `({root: trig.root, path: trig.path, val, detail})`)
        dSub(host, 'data-sub:timeoutMeta@_timeout.50', `({root: trig.root, path: trig.path, val, detail})`)
        if (qInt[0]) qInt[0]()
        if (qTo[0]) qTo[0]()
        return { i: DM['intMeta'], t: DM['timeoutMeta'] }
      } finally {
        setTimeout = st
        setInterval = si
      }
    }
    __assert(__tSubSpecialIntervalAndTimeout, [], {
      i: { root: 'interval', path: ['25'], val: 25, detail: { tick: 0, ms: 25, type: 'interval' } },
      t: { root: 'timeout', path: ['50'], val: 50, detail: { tick: 0, ms: 50, type: 'timeout' } }
    }, 'dSub interval/timeout special triggers');
    function __tSubRepeatedPermitGating() {
      __reset();
      _dm.set('gateA', true)
      _dm.set('gateB', false)
      _dm.set('src', 1)
      const host = document.createElement('div');
      dSub(host, 'data-sub:dst@src^and.gateA^and.gateB^ge.5^lt.9^ne.7', 'val')
      _setSignalAndNotifySubs('t', { root: 'src', path: null }, 8)
      _dm.set('gateB', true)
      _setSignalAndNotifySubs('t', { root: 'src', path: null }, 4)
      _setSignalAndNotifySubs('t', { root: 'src', path: null }, 7)
      _setSignalAndNotifySubs('t', { root: 'src', path: null }, 8)
      return DM['dst'] ?? null
    }
    __assert(__tSubRepeatedPermitGating, [], 8, 'dSub repeated permit mods gating');
    function __tSyncTwoWayDefault() {
      __reset();
      const inp = document.createElement('input')
      _dm.set('name', 'Ada')
      dSync(inp, 'data-sync:name')
      const before = inp.value
      inp.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      const sigAfterWrite = DM['name']
      _setSignalAndNotifySubs('t', { root: 'name', path: null }, 'Eve')
      return { before, sigAfterWrite, elAfterSignal: inp.value }
    }
    __assert(__tSyncTwoWayDefault, [], { before: 'Ada', sigAfterWrite: 'Bob', elAfterSignal: 'Eve' }, 'dSync two-way default');
    function __tSyncSignalToPropOnly() {
      __reset();
      const inp = document.createElement('input')
      _dm.set('name', 'Ada')
      dSync(inp, 'data-sync@name')
      const before = inp.value
      inp.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      const sigAfterLocalEvent = DM['name']
      _setSignalAndNotifySubs('t', { root: 'name', path: null }, 'Eve')
      return { before, sigAfterLocalEvent, elAfterSignal: inp.value }
    }
    __assert(__tSyncSignalToPropOnly, [], { before: 'Ada', sigAfterLocalEvent: 'Ada', elAfterSignal: 'Eve' }, 'dSync signal->prop one-way');
    function __tSyncPropToSignalOnly() {
      __reset();
      const inp = document.createElement('input')
      _dm.set('name', 'Ada')
      inp.value = 'Initial'
      dSync(inp, 'data-sync:name@.')
      const before = inp.value
      _setSignalAndNotifySubs('t', { root: 'name', path: null }, 'Eve')
      const elAfterSignal = inp.value
      inp.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      return { before, elAfterSignal, sigAfterEvent: DM['name'] }
    }
    __assert(__tSyncPropToSignalOnly, [], { before: 'Initial', elAfterSignal: 'Initial', sigAfterEvent: 'Bob' }, 'dSync prop->signal one-way');
    function __tSyncCheckboxDefaultProp() {
      __reset();
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      DM['isOn'] = true
      dSync(cb, 'data-sync:is-on')
      const before = cb.checked
      cb.checked = false
      cb.dispatchEvent(mkEv('change'))
      const sigAfterWrite = DM['isOn']
      _setSignalAndNotifySubs('t', { root: 'isOn', path: null }, true)
      return { before, sigAfterWrite, afterSignal: cb.checked }
    }
    __assert(__tSyncCheckboxDefaultProp, [], { before: true, sigAfterWrite: false, afterSignal: true }, 'dSync checkbox checked/value default prop');
    function __tClassSignalToggle() {
      __reset()
      const div = document.createElement('div')
      _dm.set('active', false)
      dClass(div, 'data-class+active@active^immediate')
      const hadBefore = div.classList.contains('active')
      _setSignalAndNotifySubs('t', { root: 'active', path: null }, true)
      const hadAfter = div.classList.contains('active')
      _setSignalAndNotifySubs('t', { root: 'active', path: null }, false)
      const hadFinal = div.classList.contains('active')
      return { hadBefore, hadAfter, hadFinal }
    }
    __assert(__tClassSignalToggle, [], { hadBefore: false, hadAfter: true, hadFinal: false }, 'dClass signal toggle with immediate');
    function __tClassInvertedClass() {
      __reset()
      const div = document.createElement('div')
      _dm.set('active', false)
      dClass(div, 'data-class+!inactive@active^immediate')
      const hadBefore = div.classList.contains('inactive')
      _setSignalAndNotifySubs('t', { root: 'active', path: null }, true)
      const hadAfter = div.classList.contains('inactive')
      return { hadBefore, hadAfter }
    }
    __assert(__tClassInvertedClass, [], { hadBefore: true, hadAfter: false }, 'dClass inverted +! adds when falsy');
    function __tClassMultiClass() {
      __reset()
      const div = document.createElement('div')
      _dm.set('active', true)
      dClass(div, 'data-class+is-active+!is-inactive@active^immediate')
      const activeBefore = div.classList.contains('is-active')
      const inactiveBefore = div.classList.contains('is-inactive')
      _setSignalAndNotifySubs('t', { root: 'active', path: null }, false)
      const activeAfter = div.classList.contains('is-active')
      const inactiveAfter = div.classList.contains('is-inactive')
      return { activeBefore, inactiveBefore, activeAfter, inactiveAfter }
    }
    __assert(__tClassMultiClass, [], { activeBefore: true, inactiveBefore: false, activeAfter: false, inactiveAfter: true }, 'dClass multi-class kebab toggle');
    function __tClassWithExpr() {
      __reset()
      const div = document.createElement('div')
      _dm.set('count', 2)
      dClass(div, 'data-class+even@count^immediate', 'dm.count % 2 === 0')
      const hadBefore = div.classList.contains('even')
      _setSignalAndNotifySubs('t', { root: 'count', path: null }, 3)
      const hadAfter = div.classList.contains('even')
      return { hadBefore, hadAfter }
    }
    __assert(__tClassWithExpr, [], { hadBefore: true, hadAfter: false }, 'dClass compiled expression controls class');
    function __tDispHideShow() {
      __reset()
      const div = document.createElement('div')
      div.style.display = 'block'
      _dm.set('visible', true)
      dDisp(div, 'data-disp:.@visible^immediate')
      const displayBefore = div.style.display
      _setSignalAndNotifySubs('t', { root: 'visible', path: null }, false)
      const displayAfterHide = div.style.display
      _setSignalAndNotifySubs('t', { root: 'visible', path: null }, true)
      const displayAfterShow = div.style.display
      return { displayBefore, displayAfterHide, displayAfterShow }
    }
    __assert(__tDispHideShow, [], { displayBefore: 'block', displayAfterHide: 'none', displayAfterShow: 'block' }, 'dDisp show/hide cycle');
    function __tDispWithExpr() {
      __reset()
      const div = document.createElement('div')
      div.style.display = 'flex'
      _dm.set('count', 0)
      dDisp(div, 'data-disp:.@count^immediate', 'dm.count > 0')
      const displayBefore = div.style.display
      _setSignalAndNotifySubs('t', { root: 'count', path: null }, 5)
      const displayAfter = div.style.display
      return { displayBefore, displayAfter }
    }
    __assert(__tDispWithExpr, [], { displayBefore: 'none', displayAfter: 'flex' }, 'dDisp compiled expression show/hide');
    function __tDispTargetElSignal() {
      __reset()
      const box = document.createElement('div')
      box.id = 'dispBox'
      box.style.display = 'block'
      document.body.appendChild(box)
      try {
        _dm.set('show', true)
        dDisp(box, 'data-disp:.@show^immediate')
        const displayBefore = box.style.display
        _setSignalAndNotifySubs('t', { root: 'show', path: null }, false)
        const displayAfter = box.style.display
        return { displayBefore, displayAfter }
      } finally { box.remove() }
    }
    __assert(__tDispTargetElSignal, [], { displayBefore: 'block', displayAfter: 'none' }, 'dDisp hides element on false signal');
    function __tDumpAppendOnly() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li>item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('items', [])
        dDump(el, 'data-dump@items')
        const before = el.children.length
        _setSignalAndNotifySubs('t', { root: 'items', path: null }, ['a', 'b'])
        const after = el.children.length
        return { before, after }
      } finally { el.remove() }
    }
    __assert(__tDumpAppendOnly, [], { before: 0, after: 2 }, 'dDump append-only: signal grows from [] to 2 items')
    function __tDumpRemoveFromEnd() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li>item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('items', ['a', 'b', 'c'])
        dDump(el, 'data-dump@items^immediate')
        const before = el.children.length
        _setSignalAndNotifySubs('t', { root: 'items', path: null }, ['a'])
        const after = el.children.length
        return { before, after }
      } finally { el.remove() }
    }
    __assert(__tDumpRemoveFromEnd, [], { before: 3, after: 1 }, 'dDump remove from end: 3 items shrinks to 1')
    function __tDumpIndexPlaceholder() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li data-idx="$index">item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('rows', ['x', 'y'])
        dDump(el, 'data-dump@rows^immediate')
        return Array.from(el.children).map(n => n.getAttribute('data-idx'))
      } finally { el.remove() }
    }
    __assert(__tDumpIndexPlaceholder, [], ['0', '1'], 'dDump $index placeholder rewritten in cloned attribute values')
    function __tDumpItemPlaceholder() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li data-val="$item">item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('rows', ['x', 'y'])
        dDump(el, 'data-dump@rows^immediate')
        return Array.from(el.children).map(n => n.getAttribute('data-val'))
      } finally { el.remove() }
    }
    __assert(__tDumpItemPlaceholder, [], ['dm.rows[0]', 'dm.rows[1]'], 'dDump $item placeholder rewritten to dm.signal[idx] in attribute values')
    function __tDumpInlineTemplate() {
      __reset()
      const el = document.createElement('div')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<span>child</span>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('list', ['a', 'b', 'c'])
        dDump(el, 'data-dump@list^immediate')
        const count = el.children.length
        const tplStillChild = !!el.querySelector('template')
        return { count, tplStillChild }
      } finally { el.remove() }
    }
    __assert(__tDumpInlineTemplate, [], { count: 3, tplStillChild: false }, 'dDump inline <template> detached after read, 3 clones appended')
    function __tDumpImmediate() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li>item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('items', ['x', 'y', 'z'])
        dDump(el, 'data-dump@items^immediate')
        return el.children.length
      } finally { el.remove() }
    }
    __assert(__tDumpImmediate, [], 3, 'dDump ^immediate renders existing signal array on setup')
    function __tDumpExplicitTemplate() {
      __reset()
      const tplEl = document.createElement('template')
      tplEl.id = 'myTpl'
      tplEl.innerHTML = '<li>item</li>'
      document.body.appendChild(tplEl)
      const el = document.createElement('ul')
      document.body.appendChild(el)
      try {
        _dm.set('items', ['a', 'b'])
        dDump(el, 'data-dump+#myTpl@items^immediate')
        return el.children.length
      } finally { tplEl.remove(); el.remove() }
    }
    __assert(__tDumpExplicitTemplate, [], 2, 'dDump +#tplId explicit template reference appends 2 clones')
    // ---- dAction async tests ----
    // Tests run sequentially to avoid concurrent __reset() interference with shared _subs/_dm state.
    let _asyncChain = Promise.resolve()
    function __asyncAssert(label, promiseFn) {
      _asyncChain = _asyncChain.then(() =>
        promiseFn().then(({ actual, expected }) => {
          if (deepEqual(actual, expected))
            console.log('✓', 'dAction —', label, '>>>', fmt(actual))
          else
            console.error('✗', 'dAction —', label, '>>> expected:', fmt(expected), 'actual:', fmt(actual))
        }).catch(err => {
          console.error('✗', 'dAction —', label, '>>> threw:', err && err.message ? err.message : String(err))
        })
      )
    }
    __asyncAssert('GET ^immediate fires fetch and sets result', async () => {
      __reset()
      const fetchCalls = []
      window.fetch = (url, init) => {
        fetchCalls.push({ url, method: init.method })
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => [1, 2, 3]
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('items', null)
        dAction(btn, 'data-get:items@.click^immediate', '"https://api.test/items"')
        // click trigger registers the event; immediate also fires doRequest once at setup
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { calls: fetchCalls.length, method: fetchCalls[0]?.method, url: fetchCalls[0]?.url, items: DM['items'] },
          expected: { calls: 2, method: 'GET', url: 'https://api.test/items', items: [1, 2, 3] }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('POST ^json sends Content-Type and JSON body', async () => {
      __reset()
      let sentBody = null, sentHeaders = null
      window.fetch = (_url, init) => {
        sentBody = init.body
        sentHeaders = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ id: 1 })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('postResult', null)
        _dm.set('titleVal', 'Hello World')
        dAction(btn, 'data-post^json:postResult@.click+titleVal', '"https://api.test/posts"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { contentType: sentHeaders?.['Content-Type'], body: JSON.parse(sentBody), result: DM['postResult'] },
          expected: { contentType: 'application/json', body: 'Hello World', result: { id: 1 } }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^busy.<signal> goes true while fetching then false on success', async () => {
      __reset()
      let resolveFetch
      window.fetch = () => new Promise(r => { resolveFetch = r })
      try {
        const btn = document.createElement('button')
        _dm.set('busy', false)
        _dm.set('data', null)
        dAction(btn, 'data-get^busy.busy:data@.click', '"https://api.test/data"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        const busyDuring = DM['busy']
        resolveFetch({ ok: true, headers: { get: () => 'application/json' }, json: async () => 42 })
        await new Promise(r => setTimeout(r, 0))
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { busyDuring, busyAfter: DM['busy'] },
          expected: { busyDuring: true, busyAfter: false }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^complete.<signal> is false before/during fetch then true on success', async () => {
      __reset()
      let resolveFetch
      window.fetch = () => new Promise(r => { resolveFetch = r })
      try {
        const btn = document.createElement('button')
        _dm.set('busy2', false)
        _dm.set('done', false)
        _dm.set('data2', null)
        dAction(btn, 'data-get^busy.busy2^complete.done:data2@.click', '"https://api.test/data"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        const completeDuring = DM['done']
        resolveFetch({ ok: true, headers: { get: () => 'application/json' }, json: async () => 99 })
        await new Promise(r => setTimeout(r, 0))
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { completeDuring, completeAfter: DM['done'], busy: DM['busy2'] },
          expected: { completeDuring: false, completeAfter: true, busy: false }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^complete.<signal> is set true on fetch error', async () => {
      __reset()
      window.fetch = () => Promise.reject(new Error('fail'))
      try {
        const btn = document.createElement('button')
        _dm.set('done2', false)
        dAction(btn, 'data-get^complete.done2:data@.click', '"https://api.test/data"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { done: DM['done2'] },
          expected: { done: true }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('fetch failure sets ^err.<signal> and clears ^busy.<signal>', async () => {
      __reset()
      window.fetch = () => Promise.reject(new Error('Network error'))
      try {
        const btn = document.createElement('button')
        _dm.set('busy', false)
        _dm.set('errMsg', null)
        dAction(btn, 'data-get^busy.busy^err.err-msg:data@.click', '"https://api.test/data"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { busy: DM['busy'], err: DM['errMsg'] },
          expected: { busy: false, err: 'Network error' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('@signal^immediate fires immediately and on signal change', async () => {
      __reset()
      const fetchUrls = []
      window.fetch = (url) => {
        fetchUrls.push(url)
        return Promise.resolve({ ok: true, headers: { get: () => 'text/plain' }, text: async () => 'ok' })
      }
      try {
        const div = document.createElement('div')
        _dm.set('reload', 0)
        _dm.set('content', null)
        dAction(div, 'data-get:content@reload^immediate', '"https://api.test/content"')
        await new Promise(r => setTimeout(r, 0))
        const afterImmediate = fetchUrls.length
        _setSignalAndNotifySubs('t', { root: 'reload', path: null }, 1)
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { afterImmediate, total: fetchUrls.length, content: DM['content'] },
          expected: { afterImmediate: 1, total: 2, content: 'ok' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('+_all and +path._all spread signal object fields into request payload', async () => {
      __reset()
      let sentBody = null
      window.fetch = (_url, init) => {
        sentBody = init.body
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('a', 1)
        _dm.set('nested', { x: 7, y: 8 })
        dAction(btn, 'data-post^json:req@.click+_all+nested._all', '"https://api.test/all"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: JSON.parse(sentBody),
          expected: { a: 1, nested: { x: 7, y: 8 }, x: 7, y: 8 }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert(':_all target unpacks object payload into root signals', async () => {
      __reset()
      window.fetch = () => Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ alpha: 1, 'foo-bar': 2 })
      })
      try {
        const btn = document.createElement('button')
        dAction(btn, 'data-get:_all@.click', '"https://api.test/obj"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { alpha: DM['alpha'], fooBar: DM['fooBar'] },
          expected: { alpha: 1, fooBar: 2 }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert(':_all target unpacks top-level array payload into _arr signal', async () => {
      __reset()
      window.fetch = () => Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => [3, 4, 5]
      })
      try {
        const btn = document.createElement('button')
        dAction(btn, 'data-get:_all@.click', '"https://api.test/arr"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: DM['_arr'],
          expected: [3, 4, 5]
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^merge and header mods combine response state and attach extra headers', async () => {
      __reset()
      let sentHeaders = null
      window.fetch = (_url, init) => {
        sentHeaders = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/problem+json' },
          json: async () => ({ meta: { age: 2 }, active: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('profile', { name: 'Alice', meta: { age: 1, city: 'Riga' } })
        _dm.set('reqHeaders', { authorization: 'Bearer 123', 'x-trace': 'abc' })
        dAction(btn, 'data-get^merge^no-cache^headers.reqHeaders:profile@.click', '"https://api.test/profile"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: {
            profile: DM['profile'],
            cacheControl: sentHeaders?.['Cache-Control'],
            auth: sentHeaders?.authorization
          },
          expected: {
            profile: { name: 'Alice', meta: { age: 2, city: 'Riga' }, active: true },
            cacheControl: 'no-cache',
            auth: 'Bearer 123'
          }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('compression mods set Accept-Encoding header consistently', async () => {
      __reset()
      let sentHeaders = null
      window.fetch = (_url, init) => {
        sentHeaders = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('res', null)
        dAction(btn, 'data-get^br^gzip^deflate^compress:res@.click', '"https://api.test/enc"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: sentHeaders?.['Accept-Encoding'],
          expected: 'br, gzip, deflate, compress'
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^url.X forces signal to URL query string even on POST', async () => {
      __reset()
      let capturedUrl = null, capturedBody = null
      window.fetch = (url, init) => {
        capturedUrl = url
        capturedBody = init.body
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('page', 2)
        _dm.set('payload', 'hello')
        dAction(btn, 'data-post^url.page:res@.click+payload', '"https://api.test/items"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { url: capturedUrl, body: capturedBody },
          expected: { url: 'https://api.test/items?page=2', body: 'hello' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^body.X forces named signal to request body regardless of HTTP method', async () => {
      __reset()
      let capturedUrl = null, capturedBody = null
      window.fetch = (url, init) => {
        capturedUrl = url
        capturedBody = init.body
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('cursor', 'abc123')
        _dm.set('filter', 'active')
        dAction(btn, 'data-get^body.cursor+filter:res@.click', '"https://api.test/stream"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        // +filter is GET-default → query string; ^body.cursor overrides → request body (single value unwrapped)
        return {
          actual: { url: capturedUrl, body: capturedBody },
          expected: { url: 'https://api.test/stream?filter=active', body: 'abc123' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^header.X sets individual request header from named signal (camelCase conversion)', async () => {
      __reset()
      let capturedHeaders = null
      window.fetch = (_url, init) => {
        capturedHeaders = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('authorization', 'Bearer tok-xyz')
        _dm.set('xTraceId', 'req-001')
        dAction(btn, 'data-get^header.authorization^header.x-trace-id:res@.click', '"https://api.test/secure"')
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: {
            auth: capturedHeaders?.authorization,
            traceKey: Object.prototype.hasOwnProperty.call(capturedHeaders, 'xTraceId'),
            traceVal: capturedHeaders?.xTraceId
          },
          expected: { auth: 'Bearer tok-xyz', traceKey: true, traceVal: 'req-001' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('SSE action uses body.getReader streaming path and applies events incrementally', async () => {
      __reset()
      const root = document.createElement('div')
      root.innerHTML = '<div id="sse-incr-tgt">initial</div>'
      document.body.appendChild(root)
      try {
        const lines = [
          'event: dmax-patch-signals',
          'data: dmaxSignals {"incrVal":99}',
          '',
          'event: dmax-patch-elements',
          'data: mode outer',
          'data: dmaxElements <div id="sse-incr-tgt">streamed</div>',
          ''
        ].join('\n')
        const encoder = new TextEncoder()
        const bytes = encoder.encode(lines)
        const half = Math.floor(bytes.length / 2)
        let step = 0
        const fakeBody = {
          getReader() {
            return {
              async read() {
                if (step === 0) { step++; return { done: false, value: bytes.slice(0, half) } }
                if (step === 1) { step++; return { done: false, value: bytes.slice(half) } }
                return { done: true }
              }
            }
          }
        }
        const btn = document.createElement('button')
        window.fetch = () => Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: n => String(n || '').toLowerCase() === 'content-type' ? 'text/event-stream' : null },
          body: fakeBody
        })
        try {
          dAction(btn, 'data-get@.click', "'/mock/sse-incr'")
          const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
          if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
          await new Promise(r => setTimeout(r, 20))
        } finally { delete window.fetch }
        return {
          actual: {
            incrVal: _dm.get('incrVal'),
            txt: root.querySelector('#sse-incr-tgt') ? root.querySelector('#sse-incr-tgt').textContent : ''
          },
          expected: { incrVal: 99, txt: 'streamed' }
        }
      } finally { root.remove() }
    })
    function __tMorphTextUpdate() {
      const from = document.createElement('div')
      from.textContent = 'old'
      const to = document.createElement('div')
      to.textContent = 'new'
      const originalTextNode = from.firstChild
      morph(from, to)
      return { sameNode: from.firstChild === originalTextNode, text: from.textContent }
    }
    __assert(__tMorphTextUpdate, [], { sameNode: true, text: 'new' }, 'morph: text node updated in place')
    function __tMorphAttrUpdate() {
      const from = document.createElement('div')
      from.setAttribute('class', 'old')
      from.setAttribute('title', 'keep')
      const to = document.createElement('div')
      to.setAttribute('id', 'new-id')
      to.setAttribute('title', 'keep')
      morph(from, to)
      return { id: from.getAttribute('id'), title: from.getAttribute('title'), hasClass: from.hasAttribute('class') }
    }
    __assert(__tMorphAttrUpdate, [], { id: 'new-id', title: 'keep', hasClass: false }, 'morph: attrs added/removed/kept')
    function __tMorphChildAdd() {
      const from = document.createElement('ul')
      from.innerHTML = '<li>a</li>'
      const to = document.createElement('ul')
      to.innerHTML = '<li>a</li><li>b</li>'
      morph(from, to)
      return Array.from(from.querySelectorAll('li')).map(li => li.textContent)
    }
    __assert(__tMorphChildAdd, [], ['a', 'b'], 'morph: child add appends new node')
    function __tMorphChildRemove() {
      const from = document.createElement('ul')
      from.innerHTML = '<li>a</li><li>b</li><li>c</li>'
      const to = document.createElement('ul')
      to.innerHTML = '<li>a</li>'
      morph(from, to)
      return from.children.length
    }
    __assert(__tMorphChildRemove, [], 1, 'morph: child remove trims extra nodes')
    function __tMorphKeyedReorder() {
      const from = document.createElement('div')
      from.innerHTML = '<p id="ka">1</p><p id="kb">2</p>'
      const nodeA = from.querySelector('#ka')
      const nodeB = from.querySelector('#kb')
      const to = document.createElement('div')
      to.innerHTML = '<p id="kb">2</p><p id="ka">1</p>'
      morph(from, to)
      return { firstIsB: from.firstChild === nodeB, secondIsA: from.lastChild === nodeA, count: from.children.length }
    }
    __assert(__tMorphKeyedReorder, [], { firstIsB: true, secondIsA: true, count: 2 }, 'morph: keyed nodes moved by id, not replaced')
    function __tMorphTagMismatch() {
      const container = document.createElement('div')
      const from = document.createElement('div')
      from.textContent = 'I am a div'
      container.appendChild(from)
      const to = document.createElement('p')
      to.textContent = 'I am a p'
      morph(from, to)
      return { tag: container.firstChild.tagName, text: container.firstChild.textContent }
    }
    __assert(__tMorphTagMismatch, [], { tag: 'P', text: 'I am a p' }, 'morph: tag mismatch replaces node')
    function __tMorphEventListenerPreserved() {
      const from = document.createElement('button')
      let clicked = 0
      from.addEventListener('click', () => clicked++)
      const to = document.createElement('button')
      to.setAttribute('class', 'updated')
      morph(from, to)
      from.click()
      return { clicked, hasClass: from.classList.contains('updated') }
    }
    __assert(__tMorphEventListenerPreserved, [], { clicked: 1, hasClass: true }, 'morph: event listener preserved after attr update')
    function __tMorphScrollPreserved() {
      const from = document.createElement('div')
      from.style.cssText = 'overflow:scroll;height:50px'
      from.innerHTML = '<p>line1</p><p>line2</p><p>line3</p><p>line4</p>'
      document.body.appendChild(from)
      try {
        from.scrollTop = 30
        const to = document.createElement('div')
        to.style.cssText = 'overflow:scroll;height:50px'
        to.innerHTML = '<p>line1 updated</p><p>line2</p><p>line3</p><p>line4</p>'
        morph(from, to)
        return { scrollTop: from.scrollTop, firstText: from.firstElementChild ? from.firstElementChild.textContent : '' }
      } finally { from.remove() }
    }
    __assert(__tMorphScrollPreserved, [], { scrollTop: 30, firstText: 'line1 updated' }, 'morph: scroll position preserved after content update')
    function __tMorphCaretPreserved() {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = 'hello world'
      document.body.appendChild(input)
      try {
        input.focus()
        input.setSelectionRange(3, 7)
        const selBefore = input.selectionStart === 3 && input.selectionEnd === 7
        const to = document.createElement('input')
        to.type = 'text'
        to.setAttribute('placeholder', 'updated placeholder')
        morph(input, to)
        return {
          selBefore,
          focused: document.activeElement === input,
          selStart: input.selectionStart,
          selEnd: input.selectionEnd
        }
      } finally { input.remove() }
    }
    __assert(__tMorphCaretPreserved, [], { selBefore: true, focused: true, selStart: 3, selEnd: 7 }, 'morph: caret/selection preserved for focused input')
    function __tMorphInputValuePreserved() {
      const container = document.createElement('div')
      const input = document.createElement('input')
      input.type = 'text'
      input.setAttribute('value', 'initial')
      container.appendChild(input)
      document.body.appendChild(container)
      try {
        input.value = 'user typed'  // mark field dirty (like real user typing)
        const to = document.createElement('input')
        to.type = 'text'
        to.setAttribute('value', 'server update')  // server sends new default
        to.setAttribute('placeholder', 'new hint')
        morph(input, to)
        return {
          value: input.value,                     // should keep user-typed
          attr: input.getAttribute('value'),       // attribute updated to server value
          placeholder: input.getAttribute('placeholder')
        }
      } finally { container.remove() }
    }
    __assert(__tMorphInputValuePreserved, [], { value: 'user typed', attr: 'server update', placeholder: 'new hint' }, 'morph: user-typed input value preserved; attribute updated independently')
    function __tMorphTextareaValuePreserved() {
      const container = document.createElement('div')
      const ta = document.createElement('textarea')
      container.appendChild(ta)
      document.body.appendChild(container)
      try {
        ta.value = 'partial draft'  // user is mid-edit
        const to = document.createElement('textarea')
        to.setAttribute('rows', '5')
        morph(ta, to)
        return { value: ta.value, rows: ta.getAttribute('rows') }
      } finally { container.remove() }
    }
    __assert(__tMorphTextareaValuePreserved, [], { value: 'partial draft', rows: '5' }, 'morph: textarea value preserved; attributes updated')
    function __tMorphCheckboxPreserved() {
      const container = document.createElement('div')
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      container.appendChild(cb)
      document.body.appendChild(container)
      try {
        cb.checked = true  // user checked it
        const to = document.createElement('input')
        to.type = 'checkbox'
        to.setAttribute('class', 'updated')
        morph(cb, to)
        return { checked: cb.checked, hasClass: cb.classList.contains('updated') }
      } finally { container.remove() }
    }
    __assert(__tMorphCheckboxPreserved, [], { checked: true, hasClass: true }, 'morph: checkbox checked state preserved; class attribute updated')
    function __tMorphFocusedSelectPreserved() {
      const container = document.createElement('div')
      const sel = document.createElement('select')
      sel.innerHTML = '<option value="a">A</option><option value="b">B</option><option value="c">C</option>'
      container.appendChild(sel)
      document.body.appendChild(container)
      try {
        sel.value = 'b'
        sel.focus()
        const to = document.createElement('select')
        to.setAttribute('class', 'updated')
        to.innerHTML = '<option value="a">A1</option><option value="b">B1</option><option value="c">C1</option>'
        morph(sel, to)
        return { focused: document.activeElement === sel, value: sel.value, hasClass: sel.classList.contains('updated') }
      } finally { container.remove() }
    }
    __assert(__tMorphFocusedSelectPreserved, [], { focused: true, value: 'b', hasClass: true }, 'morph: focused select preserves selection and focus')
    function __tDmaxPatchElementsReplaceDiscardsFormState() {
      const container = document.createElement('div')
      container.innerHTML = '<input id="fi-inp" type="text" value="default">'
      document.body.appendChild(container)
      try {
        const input = container.querySelector('#fi-inp')
        input.value = 'user typed'  // dirty the field
        // mode:replace replaces the node entirely — opt-out of form state preservation
        applyDmaxPatchElements({ mode: 'replace', dmaxElements: '<input id="fi-inp" type="text" value="reset">' })
        const fresh = container.querySelector('#fi-inp')
        return {
          isNewNode: fresh !== input,
          value: fresh ? fresh.value : ''
        }
      } finally { container.remove() }
    }
    __assert(__tDmaxPatchElementsReplaceDiscardsFormState, [], { isNewNode: true, value: 'reset' }, 'morph: mode:replace is the opt-out — replaces node, discards user-typed value')
    function __tDmaxPatchSignalsMergeAndRemove() {
      __reset()
      _dm.set('user', { name: 'Ada', keep: 1, removeMe: true })
      applyDmaxPatchSignals('t', { dmaxSignals: '{"user":{"name":"Bob","removeMe":null},"newSg":7}' })
      const user = _dm.get('user') || {}
      return { name: user.name, keep: user.keep, hasRemove: Object.prototype.hasOwnProperty.call(user, 'removeMe'), newSg: _dm.get('newSg') }
    }
    __assert(__tDmaxPatchSignalsMergeAndRemove, [], { name: 'Bob', keep: 1, hasRemove: false, newSg: 7 }, 'dmax: patch-signals merges RFC7386 and removes null fields')
    function __tDmaxPatchSignalsOnlyIfMissing() {
      __reset()
      _dm.set('existing', 1)
      applyDmaxPatchSignals('t', { onlyIfMissing: 'true', dmaxSignals: '{"existing":2,"added":3}' })
      return { existing: _dm.get('existing'), added: _dm.get('added') }
    }
    __assert(__tDmaxPatchSignalsOnlyIfMissing, [], { existing: 1, added: 3 }, 'dmax: patch-signals onlyIfMissing skips existing roots')
    function __tDmaxPatchElementsOuterMorphKeepsListener() {
      const root = document.createElement('div')
      root.innerHTML = '<button id="ds-btn" class="old">old</button>'
      document.body.appendChild(root)
      try {
        const btn = root.querySelector('#ds-btn')
        let clicks = 0
        btn.addEventListener('click', () => clicks++)
        applyDmaxPatchElements({ mode: 'outer', dmaxElements: '<button id="ds-btn" class="new">new</button>' })
        const after = root.querySelector('#ds-btn')
        after.click()
        return { sameNode: after === btn, clicks, className: after.className, text: after.textContent }
      } finally { root.remove() }
    }
    __assert(__tDmaxPatchElementsOuterMorphKeepsListener, [], { sameNode: true, clicks: 1, className: 'new', text: 'new' }, 'dmax: patch-elements outer uses morph and preserves listeners')
    function __tDmaxSseStreamAppliesBothEvents() {
      __reset()
      const root = document.createElement('div')
      root.innerHTML = '<div id="ds-target">old</div><div class="rm">bye</div>'
      document.body.appendChild(root)
      try {
        const stream = [
          'event: dmax-patch-signals',
          'data: dmaxSignals {"sseVal":11}',
          '',
          'event: dmax-patch-elements',
          'data: mode outer',
          'data: dmaxElements <div id="ds-target">new</div>',
          '',
          'event: dmax-patch-elements',
          'data: mode remove',
          'data: selector .rm',
          ''
        ].join('\n')
        const applied = applyDmaxSse(stream, 't')
        return {
          events: applied.length,
          sseVal: _dm.get('sseVal'),
          txt: root.querySelector('#ds-target')?.textContent || '',
          removed: root.querySelector('.rm') === null
        }
      } finally { root.remove() }
    }
    __assert(__tDmaxSseStreamAppliesBothEvents, [], { events: 3, sseVal: 11, txt: 'new', removed: true }, 'dmax: SSE stream applies patch-signals and patch-elements')
    function __tDmaxSseMultilineCrlfElements() {
      const root = document.createElement('div')
      root.innerHTML = '<div id="ds-multi">old</div>'
      document.body.appendChild(root)
      try {
        const stream = [
          'event: dmax-patch-elements',
          'data: mode outer',
          // Intentional line split: verifies multi-line SSE data fields survive CRLF parsing.
          'data: dmaxElements <div id="ds-multi"><span>line1',
          'data: dmaxElements line2</span></div>',
          ''
        ].join('\r\n')
        applyDmaxSse(stream, 't')
        return root.querySelector('#ds-multi')?.textContent || ''
      } finally { root.remove() }
    }
    __assert(__tDmaxSseMultilineCrlfElements, [], 'line1\nline2', 'dmax: SSE parser preserves CRLF multi-line payloads without full-string normalization')
    function __tMorphStyleAttr() {
      const from = document.createElement('div')
      from.setAttribute('style', 'color: red; font-size: 12px')
      const to = document.createElement('div')
      to.setAttribute('style', 'color: blue; background: white')
      morph(from, to)
      return { style: from.getAttribute('style') }
    }
    __assert(__tMorphStyleAttr, [], { style: 'color: blue; background: white' }, 'parity: morph updates style attribute string')
    function __tMorphHref() {
      const from = document.createElement('a')
      from.setAttribute('href', '/old')
      from.setAttribute('class', 'nav')
      const to = document.createElement('a')
      to.setAttribute('href', '/new')
      to.setAttribute('class', 'nav active')
      morph(from, to)
      return { href: from.getAttribute('href'), cls: from.getAttribute('class') }
    }
    __assert(__tMorphHref, [], { href: '/new', cls: 'nav active' }, 'parity: morph updates href and class on anchor')
    function __tMorphDataAttr() {
      const from = document.createElement('div')
      from.setAttribute('data-count', '1')
      from.setAttribute('data-keep', 'yes')
      const to = document.createElement('div')
      to.setAttribute('data-count', '2')
      const morph_result = (() => { morph(from, to); return from })()
      return { count: from.getAttribute('data-count'), hasKeep: from.hasAttribute('data-keep') }
    }
    __assert(__tMorphDataAttr, [], { count: '2', hasKeep: false }, 'parity: morph updates data-* attributes correctly')
    function __tMorphAriaAttr() {
      const from = document.createElement('button')
      from.setAttribute('aria-label', 'Close')
      from.setAttribute('aria-disabled', 'false')
      const to = document.createElement('button')
      to.setAttribute('aria-label', 'Cancel')
      to.setAttribute('aria-disabled', 'true')
      to.setAttribute('aria-expanded', 'true')
      morph(from, to)
      return {
        label: from.getAttribute('aria-label'),
        disabled: from.getAttribute('aria-disabled'),
        expanded: from.getAttribute('aria-expanded')
      }
    }
    __assert(__tMorphAriaAttr, [], { label: 'Cancel', disabled: 'true', expanded: 'true' }, 'parity: morph updates aria-* attributes correctly')
    function __tMorphCanvasPreserved() {
      // canvas element: morph should update attributes but keep the same DOM node
      // (canvas context state is not disturbed as we never replace the node)
      const container = document.createElement('div')
      const from = document.createElement('canvas')
      from.setAttribute('width', '100')
      from.setAttribute('height', '100')
      container.appendChild(from)
      const to = document.createElement('canvas')
      to.setAttribute('width', '200')
      to.setAttribute('height', '150')
      to.setAttribute('class', 'chart')
      morph(from, to)
      return {
        sameNode: container.firstElementChild === from,
        width: from.getAttribute('width'),
        height: from.getAttribute('height'),
        cls: from.getAttribute('class')
      }
    }
    __assert(__tMorphCanvasPreserved, [], { sameNode: true, width: '200', height: '150', cls: 'chart' }, 'parity: morph updates canvas attributes, preserves DOM node identity')
    function __tMorphKeyedListStableNodes() {
      // Verify keyed nodes are reused (not replaced) during a collection reorder + add
      const ul = document.createElement('ul')
      ul.innerHTML = '<li id="k1">A</li><li id="k2">B</li><li id="k3">C</li>'
      const n1 = ul.querySelector('#k1'), n2 = ul.querySelector('#k2'), n3 = ul.querySelector('#k3')
      const to = document.createElement('ul')
      to.innerHTML = '<li id="k3">C updated</li><li id="k1">A updated</li><li id="k4">D new</li>'
      morph(ul, to)
      return {
        k3same: ul.querySelector('#k3') === n3,
        k1same: ul.querySelector('#k1') === n1,
        k2gone: ul.querySelector('#k2') === null,
        k4present: ul.querySelector('#k4') !== null,
        k3text: ul.querySelector('#k3')?.textContent,
        k1text: ul.querySelector('#k1')?.textContent,
        count: ul.children.length
      }
    }
    __assert(__tMorphKeyedListStableNodes, [], {
      k3same: true, k1same: true, k2gone: true, k4present: true,
      k3text: 'C updated', k1text: 'A updated', count: 3
    }, 'parity: keyed list reconciliation reuses nodes, removes missing keys, adds new ones')
    function __tMorphUnkeyedListStable() {
      // Unkeyed children: morph-in-place by tag order (first child morphed to first child, etc.)
      const ul = document.createElement('ul')
      ul.innerHTML = '<li>A</li><li>B</li><li>C</li>'
      const firstLi = ul.firstElementChild
      const to = document.createElement('ul')
      to.innerHTML = '<li>A</li><li>B updated</li>'
      morph(ul, to)
      return {
        sameFirst: ul.firstElementChild === firstLi,
        count: ul.children.length,
        secondText: ul.children[1]?.textContent
      }
    }
    __assert(__tMorphUnkeyedListStable, [], { sameFirst: true, count: 2, secondText: 'B updated' }, 'parity: unkeyed list morphs in place and trims extras')
    function __tMorphMixedKeyedUnkeyed() {
      // Mixed: some children have id (keyed), some don't (unkeyed)
      const ul = document.createElement('ul')
      ul.innerHTML = '<li id="k1">K1</li><li>unkeyed</li>'
      const kn = ul.querySelector('#k1'), un = ul.children[1]
      const to = document.createElement('ul')
      to.innerHTML = '<li>unkeyed new</li><li id="k1">K1 updated</li>'
      morph(ul, to)
      return {
        k1same: ul.querySelector('#k1') === kn,
        k1text: ul.querySelector('#k1')?.textContent,
        count: ul.children.length
      }
    }
    __assert(__tMorphMixedKeyedUnkeyed, [], { k1same: true, k1text: 'K1 updated', count: 2 }, 'parity: mixed keyed/unkeyed list — keyed node reused and moved, unkeyed morphed in-place')
    // --- SSE lifecycle async tests ---
    __asyncAssert('^open and ^close lifecycle signals are set during SSE stream', async () => {
      __reset()
      const lines = [
        'event: dmax-patch-signals',
        'data: dmaxSignals {"lcVal":42}',
        ''
      ].join('\n')
      const encoder = new TextEncoder()
      const bytes = encoder.encode(lines)
      let step = 0
      const fakeBody = {
        getReader() {
          return {
            async read() {
              if (step === 0) { step++; return { done: false, value: bytes } }
              return { done: true }
            }
          }
        }
      }
      _dm.set('sseOpen', false)
      _dm.set('sseClose', false)
      await consumeDmaxSseStream(
        fakeBody,
        'test-lc',
        () => setSignalAndNotifySubsNLevelsDeep('test-lc', { kind: SIGNAL, not: null, root: 'sseOpen', path: null }, true),
        (err) => {
          setSignalAndNotifySubsNLevelsDeep('test-lc', { kind: SIGNAL, not: null, root: 'sseOpen', path: null }, false)
          if (!err) setSignalAndNotifySubsNLevelsDeep('test-lc', { kind: SIGNAL, not: null, root: 'sseClose', path: null }, true)
        }
      )
      return {
        actual: { lcVal: _dm.get('lcVal'), sseOpen: _dm.get('sseOpen'), sseClose: _dm.get('sseClose') },
        expected: { lcVal: 42, sseOpen: false, sseClose: true }
      }
    })
    __asyncAssert('^open lifecycle signal set via dAction ^open.sseOn^close.sseDone modifiers', async () => {
      __reset()
      const lines = [
        'event: dmax-patch-signals',
        'data: dmaxSignals {"lc2Val":7}',
        ''
      ].join('\n')
      const encoder = new TextEncoder()
      const bytes = encoder.encode(lines)
      let step = 0
      window.fetch = () => Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: n => String(n || '').toLowerCase() === 'content-type' ? 'text/event-stream' : null },
        body: {
          getReader() {
            return {
              async read() {
                if (step === 0) { step++; return { done: false, value: bytes } }
                return { done: true }
              }
            }
          }
        }
      })
      try {
        const btn = document.createElement('button')
        dAction(btn, 'data-get^open.sseOn^close.sseDone@.click', "'/mock/lc2'")
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 30))
      } finally { delete window.fetch }
      return {
        actual: { lc2Val: _dm.get('lc2Val'), sseOn: _dm.get('sseOn'), sseDone: _dm.get('sseDone') },
        expected: { lc2Val: 7, sseOn: false, sseDone: true }
      }
    })
    __asyncAssert('^abort signal lets callers cancel the fetch request', async () => {
      __reset()
      let abortCalled = false
      let signalAborted = false
      window.fetch = (_url, init) => {
        // Return a promise that rejects when the AbortSignal fires, matching real fetch behaviour
        return new Promise((_resolve, reject) => {
          if (init && init.signal) {
            init.signal.addEventListener('abort', () => {
              signalAborted = true
              const err = new Error('AbortError')
              err.name = 'AbortError'
              reject(err)
            })
          }
        })
      }
      try {
        const btn = document.createElement('button')
        dAction(btn, 'data-get^abort.cancelFn@.click', "'/mock/long'")
        const clickSubs = (_cleanupBoundSubs.get(btn) || EMPTY_ARR).filter(x => x.type === 'event')
        if (clickSubs[0]?.handler) clickSubs[0].handler({ type: 'click' })
        await new Promise(r => setTimeout(r, 10))
        // Now cancel via the signal stored by ^abort
        const cancelFn = _dm.get('cancelFn')
        if (typeof cancelFn === 'function') { cancelFn(); abortCalled = true }
        await new Promise(r => setTimeout(r, 20))
      } finally { delete window.fetch }
      return {
        actual: { abortCalled, signalAborted },
        expected: { abortCalled: true, signalAborted: true }
      }
    })
  _asyncChain.then(__restoreAssertState, __restoreAssertState)
})()
