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

    if (typeof _cleanupBoundSubs.clear === 'function') _cleanupBoundSubs.clear()
    for (const [node, handlers] of __savedCleanupBoundSubs) _cleanupBoundSubs.set(node, handlers.slice())

    _debugEls.clear()
    for (const el of __savedDebugEls) _debugEls.add(el)
    _debugQueued = false
    if (typeof document !== 'undefined') {
      for (const n of document.querySelectorAll('*')) for (const a of n.attributes)
        if (a.name.indexOf('data-m-si') === 0) dmSi(n, a.name, a.value)
        else if (a.name.indexOf('data-m-dbg') === 0) dmDbg(n)
      const userExNodes = [
        document.getElementById('exUserNameInput'),
        document.getElementById('exUserAgeInput'),
        document.getElementById('sigToProp'),
        document.getElementById('elToSig'),
        document.getElementById('twoWay')
      ]
      for (const n of document.querySelectorAll('*')) for (const a of n.attributes)
        if (a.name === 'data-m-ex:.@user.name' || a.name === 'data-m-ex:.@user.age') userExNodes.push(n)
      for (const n of userExNodes) if (n) for (const a of n.attributes) if (a.name.indexOf('data-m-ex') === 0) wireNode(n, a.name, a.value)
    }
    updateDebug()
  }

  //-------------test code-------------------
  const normAssertVal = (val) => {
      if (Array.isArray(val)) return val.map(normAssertVal);
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        const out = {};
        for (const key of Object.keys(val)) {
          if (key === 'isEv' || key === 'isSi' || key === 'isSp' || key === 'isInterval' || key === 'isTimer' || key === 'isViewed' || key === 'isForm') continue;
          if (key === 'isImmediate' && val[key] == null) continue;
          if (key === 'mods' && Array.isArray(val[key]) && !val[key].length) continue;
          out[key] = normAssertVal(val[key]);
        }
        return out;
      }
      return val;
  };
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
      return stableStringify(normAssertVal(a)) === stableStringify(normAssertVal(b));
  };
  const fmt = (val) => (typeof val === 'string' ? `'${val}'` : stableStringify(val));
  const __parseIt = (it) => Object.assign({ "^": NIL, ":": NIL, "@": NIL, "+": NIL }, it);
  const __si = (root, path = null, not = null) => ({ kind: SI, not, root, path, mods: NIL, isSi: true, isEv: false, isSp: false, isInterval: false, isTimer: false, isViewed: false, isForm: false, isImmediate: null })
  const __ev = (root = '', path = null, not = null) => ({ kind: EP, not, root, path, mods: NIL, isSi: false, isEv: true, isSp: false, isInterval: false, isTimer: false, isViewed: false, isForm: false, isImmediate: null })
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
    const __sign = (nam, val) => { _dm.clear(); dmSi(null, nam, val); return DM };
    const __signEl = (el, nam, val) => { _dm.clear(); dmSi(el, nam, val); return DM };
    const __signDmSet = (k, v, nam, val) => { _dm.clear(); DM[k] = v; dmSi(null, nam, val); return DM };
    const __getBoundSubs = el => (typeof _cleanupBoundSubs !== 'undefined' && _cleanupBoundSubs && _cleanupBoundSubs.get) ? (_cleanupBoundSubs.get(el) || NIL) : NIL
    const __getEventSub = el => {
      const subs = __getBoundSubs(el)
      return subs.find ? subs.find(x => x && x.ev && x.fn) : null
    }
    const __fireEventSub = (el, type) => {
      const sub = __getEventSub(el)
      if (sub?.fn) sub.fn({ type, detail: null, preventDefault() { } })
      return sub
    }
    __assert(indexFirst, ['abcdefg', ['x', 'y', 'z']], -1, 'none found');
    __assert(indexFirst, ['abcdefg', ['x', 'c', 'z']], 2, 'one found');
    __assert(indexFirst, ['abcdefgabc', ['a', 'b', 'c'], 3], 7, 'multiple found with pos');
    __assert(indexFirst, ['abcdefg', ['a'], 10], -1, 'pos out of range');
    __assert(kebabToCamel, ['foo-bar'], 'fooBar', 'basic case');
    __assert(kebabToCamel, ['-bar'], 'Bar', 'lead single');
    __assert(kebabToCamel, ['bar-'], 'bar', 'trail single');
    __assert(kebabToCamel, ['bar---'], 'bar', 'trail multi');
    __assert(kebabToCamel, ['multi-part-key'], 'multiPartKey', 'multi part');
    __assert(kebabToCamel, ['-'], '', 'single dash');
    __assert(kebabToCamel, ['--'], '', 'multi dashes only');
    __assert(kebabToCamel, ['--leading--dashes'], 'LeadingDashes', 'leading dashes');
    __assert(kebabToCamel, ['trailing--dashes-'], 'trailingDashes', 'trailing dashes');
    __assert(kebabToCamel, ['trailing--dashes---'], 'trailingDashes', 'trailing multi dashes');
    __assert(camelToKebab, ['fooBar'], 'foo-bar', 'camel to kebab');
    __assert(camelToKebab, ['HTTPRequest'], '-h-t-t-p-request', 'camel to kebab capitals');
    __assert((s) => camelToKebab(kebabToCamel(s)), ['data-foo-bar'], 'data-foo-bar', 'camel/kebab roundtrip keeps original kebab');
    __assert(parseItem, ['XXX', TRIG, '#hey.foo.bar-baz'], { "kind": EP, "not": null, "path": ["foo", "barBaz"], "root": "hey" }, 'trigger #id.prop.prop')
    __assert(parseItem, ['XXX', TARG, 'foo-bar'], { "kind": SI, "not": null, "path": null, "root": "fooBar" }, 'target kebab to camel');
    __assert(parseItem, ['XXX', TRIG, '#el.some.prop'], { "kind": EP, "not": null, "path": ["some", "prop"], "root": "el" }, 'trigger id and path');
    __assert(parseItem, ['XXX', TRIG, '!foo'], { "kind": SI, "not": true, "path": null, "root": "foo" }, 'negated once');
    __assert(parseItem, ['XXX', TRIG, '!!foo'], { "kind": SI, "not": false, "path": null, "root": "foo" }, 'double negation even');
    __assert(parseItem, ['XXX', TARG, 'foo.'], { "kind": SI, "not": null, "path": null, "root": "foo" }, 'trailing dot yields null path');
    __assert(parseItem, ['XXX', TARG, 'a..b'], null, 'error: empty middle segment');
    __assert(parseItem, ['XXX', TARG, 'foo.bar-baz.qux-quux'], { "kind": SI, "not": null, "path": ["barBaz", "quxQuux"], "root": "foo" }, 'path segments kebab->camel');
    __assert(parseItem, ['XXX', TARG, 'posts[0]'], { "kind": SI, "not": null, "path": ["0"], "root": "posts" }, 'constant bracket index root path');
    __assert(parseItem, ['XXX', TARG, 'post-objs[1].title'], { "kind": SI, "not": null, "path": ["1", "title"], "root": "postObjs" }, 'constant bracket index with dotted tail');
    __assert(parseItem, ['XXX', TARG, 'posts[idx]'], null, 'error: variable bracket index rejected');
    __assert(parseItem, ['XXX', TARG, 'posts[0'], null, 'error: missing closing bracket rejected');
    __assert(parseItem, ['XXX', MOD, '!eq.3'], { "kind": MOD, "not": true, "path": "3", "root": "eq" }, 'mod with negation and numeric path');
    __assert(parseItem, ['XXX', MOD, '!eq.'], { "kind": MOD, "not": true, "path": null, "root": "eq" }, 'mod with negation and dot at the end permitted');
    __assert(parseItem, ['XXX', TARG, ''], null, 'error: empty name returns nulls');
    __assert(parseItem, ['YYY', TARG, '.'], { "kind": EP, "not": null, "path": null, "root": "" }, 'error: empty name returns nulls');
    __assert(parseItem, ['YYY', TARG, '!'], null, 'error: exclamation mark alone');
    __assert(parse, ['data-m-si'], [__parseIt({}), 9], 'empty')
    __assert(parse, ['data-m-ex:'], [__parseIt({}), 10], 'single empty')
    __assert(parse, ['data-m-ex:.'], [__parseIt({ ":": [{ "kind": EP, "mods": NIL, "not": null, "path": null, "root": "" }] }), 11], 'default prop')
    __assert(parse, ['data-m-ex^mod'], [__parseIt({ "^": [{ "kind": MOD, "not": null, "path": null, "root": "mod" }] }), 13], 'global mod')
    __assert(parse, ['data-m-ex^mod.some-foo.value^!eq.3'], [__parseIt({ "^": [{ "kind": MOD, "not": null, "path": { "kind": "s", "not": false, "path": ["value"], "root": "someFoo" }, "root": "mod" }, { "kind": MOD, "not": true, "path": "3", "root": "eq" }] }), 34], '2 global mods')
    __assert(parse, ['data-m-ex^mod^@hey^foo:bar'], [__parseIt({ ":": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "mod" }], "not": null, "path": null, "root": "bar" }], "@": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "foo" }, { "kind": MOD, "not": null, "path": null, "root": "mod" }], "not": null, "path": null, "root": "hey" }], "^": [{ "kind": MOD, "not": null, "path": null, "root": "mod" }] }), 26], '2 global mods and item with mod with item')
    __assert(parse, ['data-m-ex@!xxx@!'], [__parseIt({ "@": [{ "kind": SI, "mods": NIL, "not": true, "path": null, "root": "xxx" }] }), 16], 'not name and not empty')
    __assert(parse, ['data-m-ex:xxx:'], [__parseIt({ ":": [{ "kind": SI, "mods": NIL, "not": null, "path": null, "root": "xxx" }] }), 14], 'single name')
    __assert(parse, ['data-m-ex::'], [__parseIt({}), 11], '2 empties')
    __assert(parse, ['data-m-ex:foo^'], [__parseIt({ ":": [{ "kind": SI, "mods": NIL, "not": null, "path": null, "root": "foo" }] }), 14], 'name+empty mod')
    __assert(parse, ['data-m-ex:foo^^'], [__parseIt({ ":": [{ "kind": SI, "mods": NIL, "not": null, "path": null, "root": "foo" }] }), 15], 'name+2 empty mods')
    __assert(parse, ['data-m-ex:foo-bar^bax.3'], [__parseIt({ ":": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": "3", "root": "bax" }], "not": null, "path": null, "root": "fooBar" }] }), 23], 'item^mod')
    __assert(parse, ['data-m-ex:foo-bar^bax.3@!something^nice'], [__parseIt({ ":": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": "3", "root": "bax" }], "not": null, "path": null, "root": "fooBar" }], "@": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "nice" }], "not": true, "path": null, "root": "something" }] }), 39], 'item^mod@item2^mod')
    __assert(parse, ['data-m-ex^ge.2^le.5@foo^le.4'], [__parseIt({ "@": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": "4", "root": "le" }, { "kind": MOD, "not": null, "path": "2", "root": "ge" }, { "kind": MOD, "not": null, "path": "5", "root": "le" }], "not": null, "path": null, "root": "foo" }], "^": [{ "kind": MOD, "not": null, "path": "2", "root": "ge" }, { "kind": MOD, "not": null, "path": "5", "root": "le" }] }), 28], 'combine global+local mods and keep repeats')
    __assert(parse, ['data-m-ex^hey@foo:bar+bax'], [__parseIt({ "+": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }], "not": null, "path": null, "root": "bax" }], ":": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }], "not": null, "path": null, "root": "bar" }], "@": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }], "not": null, "path": null, "root": "foo" }], "^": [{ "kind": MOD, "not": null, "path": null, "root": "hey" }] }), 25], 'push all global mods to items')
    __assert(parse, ['data-m-post+profile^spread'], [__parseIt({ "+": [{ "kind": SI, "mods": [{ "kind": MOD, "not": null, "path": null, "root": "spread" }], "not": null, "path": null, "root": "profile" }] }), 26], 'add item local spread mod')
    __assert(parse, ['data-m-ex:result@post-objs[1].title'], [__parseIt({
      ":": [{ "kind": SI, "mods": NIL, "not": null, "path": null, "root": "result" }],
      "@": [{ "kind": SI, "mods": NIL, "not": null, "path": ["1", "title"], "root": "postObjs" }]
    }), 35], 'parse trigger with constant bracket index')
    __assert(parse, ['data-m-ex:result@post-objs[idx].title'], [__parseIt({
      ":": [{ "kind": SI, "mods": NIL, "not": null, "path": null, "root": "result" }]
    }), 37], 'parse rejects variable bracket index trigger')
    __assert(() => getMValPath(NIL) === NIL, [], true, 'getMValPath uses NIL when no val mod exists')
    __assert(__sign, ['data-m-si', '{foo: {bar: "hey"}, baz: 1}'], { "baz": 1, "foo": { "bar": "hey" } }, '2 value signals')
    __assert(__sign, ['data-m-si:foo', '{bar: "hey"}'], { "foo": { "bar": "hey" } }, 'signal = value')
    __assert(__sign, ['data-m-si:foo-bar:baz'], { "baz": null, "fooBar": null }, 'signals')
    __assert(__sign, ['data-m-si:foo-bar:baz', '`Mamma Mia ${42}`'], { "baz": "Mamma Mia 42", "fooBar": "Mamma Mia 42" }, 'bonkers')
    __assert(__signEl, [{ "name": "John" }, 'data-m-si:foo', '"Hey, " + el.name'], { "foo": "Hey, John" }, 'using el')
    __assert(__signDmSet, ['name', 'Noize', 'data-m-si:greet', '"Hey, " + dm.name'], { "name": "Noize", "greet": `Hey, Noize` }, 'using dm')
    function __tGetSignalValOrIt() {
      _dm.clear()
      _dm.set('user', { name: 'Alice' })
      _dm.set('gate', 0)
      return {
        root: getSiValOrIt(__si('user')),
        path: getSiValOrIt(__si('user', ['name'])),
        missingPath: getSiValOrIt(__si('missing', ['name'])),
        negated: getSiValOrIt(__si('gate', null, true)),
      }
    }
    __assert(__tGetSignalValOrIt, [], { root: { name: 'Alice' }, path: 'Alice', missingPath: undefined, negated: true }, 'signal value helper')
    function __tResolveModPathVal() {
      _dm.clear()
      _dm.set('user', { name: 'Alice' })
      _dm.set('gate', true)
      return {
        signal: resolveMPathVal(__si('user', ['name'])),
        root: resolveMPathVal('gate'),
        negated: resolveMPathVal('!gate'),
        path: resolveMPathVal('user.name'),
        numeric: resolveMPathVal('3'),
        literal: resolveMPathVal('literal'),
        nil: resolveMPathVal(null),
      }
    }
    __assert(__tResolveModPathVal, [], { signal: 'Alice', root: true, negated: false, path: 'Alice', numeric: '3', literal: 'literal', nil: null }, 'modifier value helper')
    __assert(resolveStatusSig, [null, 'busy'], null, 'status signal null')
    __assert(resolveStatusSig, [{ path: 'complete' }, 'busy'], { kind: SI, not: null, root: 'complete', path: null }, 'status signal root string')
    __assert(resolveStatusSig, [{ path: __si('user', ['name']) }, 'busy'], { kind: SI, not: null, root: 'user', path: ['name'] }, 'status signal parsed path')
    __assert(resolveStatusSig, [{ path: null }, 'busy'], { kind: SI, not: null, root: 'busy', path: null }, 'status signal fallback')
    __assert((sig, val, nextVal) => {
      _dm.clear()
      defSig(sig, val)
      defSig(sig, nextVal)
      return _dm.get(sig.root)
    }, [{ root: 'busy' }, false, true], false, 'defSig keeps existing signal value')
    __assert(buildItItemRef, ['threads', ['replies'], 3], 'threads.replies.3', 'dmIt item ref helper')
    __assert(buildItItemRef, ['posts', null, 2], 'posts.2', 'dmIt item ref helper root only')
    __assert(buildItItemExpr, ['grid', ['0', 'items'], 2], 'dm.grid[0].items[2]', 'dmIt item expr helper')
    __assert(buildItItemExpr, ['posts', null, 2], 'dm.posts[2]', 'dmIt item expr helper root only')
    __assert(replaceItTokens, ['data-m-it@$item.replies+$index', 'threads.0', '0'], 'data-m-it@threads.0.replies+0', 'dmIt token rewrite helper')
    __assert(replaceItTokens, ['plain-text', 'threads.0', '0'], 'plain-text', 'dmIt token rewrite helper no-op')
    function __testRewriteItBindings() {
      const root = document.createElement('li')
      root.setAttribute('data-m-ex:.', '$index')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<span data-m-it@$item.replies+$index="$item.title"></span>'
      const child = tpl.content.firstElementChild
      root.appendChild(child)
      rewriteItBindings(root, 'threads.2', 'dm.threads[2]', '2')
      return {
        rootVal: root.getAttribute('data-m-ex:.'),
        rootAttrs: IT_ATTRS.get(root),
        childAttrs: IT_ATTRS.get(child)
      }
    }
    __assert(__testRewriteItBindings, [], {
      rootVal: '2',
      rootAttrs: [['data-m-ex:.', '2']],
      childAttrs: [['data-m-it@threads.2.replies+2', 'dm.threads[2].title']]
    }, 'dmIt rewriteItBindings rewrites names and values')
    function __testRewriteItBindingsNoop() {
      const root = document.createElement('li')
      root.setAttribute('data-m-ex:.', 'plain-text')
      rewriteItBindings(root, 'threads.2', 'dm.threads[2]', '2')
      return { value: root.getAttribute('data-m-ex:.'), hasAttrs: IT_ATTRS.has(root) }
    }
    __assert(__testRewriteItBindingsNoop, [], { value: 'plain-text', hasAttrs: false }, 'dmIt rewriteItBindings no-op leaves attrs untouched')
    function __testWireItCloneRewrittenAttrs() {
      const root = document.createElement('li')
      root.setAttribute('data-m-ex:.', '$index')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<span data-m-it@$item.replies+$index="$item.title"></span>'
      const child = tpl.content.firstElementChild
      root.appendChild(child)
      rewriteItBindings(root, 'threads.2', 'dm.threads[2]', '2')
      const calls = []
      const savedWireNode = globalThis.wireNode
      globalThis.wireNode = (_el, aName, value) => calls.push([aName, value])
      try { wireItClone(root) } finally { globalThis.wireNode = savedWireNode }
      return calls
    }
    __assert(__testWireItCloneRewrittenAttrs, [], [
      ['data-m-ex:.', '2'],
      ['data-m-it@threads.2.replies+2', 'dm.threads[2].title']
    ], 'dmIt wireItClone uses rewritten attrs when available')
    function __testWireItCloneDomAttrsFallback() {
      const root = document.createElement('li')
      root.setAttribute('data-m-ex:.', 'plain-text')
      const calls = []
      const savedWireNode = globalThis.wireNode
      globalThis.wireNode = (_el, aName, value) => calls.push([aName, value])
      try { wireItClone(root) } finally { globalThis.wireNode = savedWireNode }
      return calls
    }
    __assert(__testWireItCloneDomAttrsFallback, [], [['data-m-ex:.', 'plain-text']], 'dmIt wireItClone falls back to DOM attrs')
    __assert(() => ({ ...buildActBaseHs(false, false, false, false, true, false, 'gzip') }), [], {
      accept: 'text/event-stream',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'accept-encoding': 'gzip'
    }, 'SSE base hs imply no-cache and accept-encoding')
    __assert(() => ({ ...buildActBaseHs(false, false, true, false, false, false, '') }), [], {
      accept: 'text/html'
    }, 'HTML base hs set accept to text/html')
    __assert((id, aName) => {
      const el = getElById(id, aName)
      return el ? el.textContent : null
    }, ['foo', 'data-m-ex:#foo@bar'], 'good', 'get existing elem')
    __assert(getElPrVal, [null, null], null, 'null element prop')
    __assert(getElPrVal, [null, ['value']], null, 'null element nested prop')
    __assert(getElPrVal, [getElById('foo', 'xxx'), null], 'good', 'default text prop')
    __assert(getElPrVal, [{ tagName: 'DIV', textContent: { nested: 7 } }, ['textContent', 'nested']], 7, 'nested text prop')
    __assert(getPrValAndDepth, [getElById('foo', 'xxx'), ['textContent']], ['good', 1], 'depth 1')
    __assert(getPrValAndDepth, [{ foo: { bar: { baz: 42 } } }, ['foo', 'bar', 'baz']], [42, 3], '42')
    __assert(getPrValAndDepth, [{ foo: { bar: null } }, ['foo', 'bar', 'baz']], [null, 2], 'null')
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
    __assert((val) => {
      const el = document.createElement('div')
      applyClassValue([{ root: 'isActive', not: null }, { root: 'isInactive', not: true }], el, val)
      return { active: el.classList.contains('is-active'), inactive: el.classList.contains('is-inactive') }
    }, [true], { active: true, inactive: false }, 'class helper toggles truthy state')
    __assert((val) => {
      const el = document.createElement('div')
      applyClassValue([{ root: 'isActive', not: null }, { root: 'isInactive', not: true }], el, val)
      return { active: el.classList.contains('is-active'), inactive: el.classList.contains('is-inactive') }
    }, [false], { active: false, inactive: true }, 'class helper toggles falsy state')
    __assert((val) => {
      const el = document.createElement('div')
      el.style.display = 'flex'
      applyDisplayValue(el, true, 'flex', val)
      return el.style.display
    }, [false], 'none', 'display helper hides on false')
    __assert(() => {
      const el = document.createElement('div')
      el.style.display = 'none'
      applyDisplayValue(el, true, 'flex', true)
      return el.style.display
    }, [], 'flex', 'display helper restores inline display on true')
    __assert(setPr, [{ value: 'Answer42' }, 'data-eval:.', __ev(), 'Seaman!'],
      'Seaman!', 'default prop')
    __assert(setPr, [null, 'data-eval:#foo.', __ev('foo'), 'Seaman!'],
      'Seaman!', '#foo default prop')
    __assert(setPr, [null, 'data-eval:#foo.style.color', __ev('foo', ['style', 'color']), 'lime'],
      'lime', '#foo nested prop')
    __assert(setPr, [null, 'data-eval:foo', { kind: SI, not: null, root: 'foo', path: ['style', 'color'] }, 'lime'],
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
    function __sigTrig(root, path) { return __si(root, path) }
    // @TEST register sink subscriber
    function __reg(root, path, changeMod, sink) {
      let arr = _subs.get(root)
      if (!arr) _subs.set(root, arr = []);
      arr.push({
        fn: (_, __, ___, ____, detail) => sink.push(detail),
        siChangeM: changeMod,
        trig: __sigTrig(root, path)
      });
    }
    function __reset() { _subs.clear(); _dm.clear() }
    function __tSetD() {
      __reset();
      _dm.set('user', { name: 'Alice', age: 30 });
      const sh = [], nm = [], age = [], deep = [];
      __reg('user', null, SIG_CHANGED_WITH_SHAPE, sh);
      __reg('user', ['name'], SIG_CHANGED_WITH_SHAPE, nm);
      __reg('user', ['age'], SIG_CHANGED_WITH_SHAPE, age);
      __reg('user', ['name', 'first'], SIG_CHANGED_WITH_SHAPE, deep);
      setSiAndNotifySubs('t', { root: 'user', path: ['name'] }, 'Bob');
      return { r: sh.length, nm: nm.length, age: age.length, deep: deep.length, val: _dm.get('user')?.name ?? null };
    }
    __assert(__tSetD, [], { r: 1, nm: 1, age: 0, deep: 0, val: 'Bob' }, 'path update, exact match');
    function __tSetE() {
      __reset();
      _dm.set('user', { children: [1, 2] });
      const c0 = [], c1 = [], c2 = [];
      __reg('user', ['children'], SIG_CHANGED_ANY, c0);
      __reg('user', ['children'], SIG_CHANGED_WITH_SHAPE, c1);
      __reg('user', ['children'], SIG_CHANGED_SHAPE_ONLY, c2);
      setSiAndNotifySubs('t', { root: 'user', path: ['children'] }, [1, 2, 3, 4]);
      const d1 = c1.length ? c1[c1.length - 1] : null;
      const d2 = c2.length ? c2[c2.length - 1] : null;
      return { c0: c0.length, c1: c1.length, c2: c2.length, d1, d2, val: _dm.get('user')?.children };
    }
    __assert(__tSetE, [], { c0: 1, c1: 1, c2: 1, d1: { addedRange: [2, 2] }, d2: { addedRange: [2, 2] }, val: [1, 2, 3, 4] }, 'path update shape arrays');
    function __tSetA() {
      __reset()
      _dm.set('sg', 1);
      setSiAndNotifySubs('t', { root: 'sg', path: null }, 2);
      return _dm.get('sg');
    }
    __assert(__tSetA, [], 2, 'root update no subs');
    function __tSetB() {
      __reset();
      _dm.set('sg', 'a');
      const c0 = [], c1 = [], c2 = [];
      __reg('sg', null, SIG_CHANGED_ANY, c0);
      __reg('sg', null, SIG_CHANGED_WITH_SHAPE, c1);
      __reg('sg', null, SIG_CHANGED_SHAPE_ONLY, c2);
      setSiAndNotifySubs('t', { root: 'sg', path: null }, 'b');
      return { c0: c0.length, c1: c1.length, c2: c2.length, val: _dm.get('sg') };
    }
    __assert(__tSetB, [], { c0: 1, c1: 1, c2: 0, val: 'b' }, 'root content change notify vs shape');
    function __tSetC() {
      __reset();
      _dm.set('sg', [1, 2]);
      const c0 = [], c1 = [], c2 = [];
      __reg('sg', null, SIG_CHANGED_ANY, c0);
      __reg('sg', null, SIG_CHANGED_WITH_SHAPE, c1);
      __reg('sg', null, SIG_CHANGED_SHAPE_ONLY, c2);
      setSiAndNotifySubs('t', { root: 'sg', path: null }, [1, 2, 3, 4]);
      const d1 = c1.length ? c1[c1.length - 1] : null;
      const d2 = c2.length ? c2[c2.length - 1] : null;
      return { c0: c0.length, c1: c1.length, c2: c2.length, d1, d2, val: _dm.get('sg') };
    }
    __assert(__tSetC, [], { c0: 1, c1: 1, c2: 1, d1: { addedRange: [2, 2] }, d2: { addedRange: [2, 2] }, val: [1, 2, 3, 4] }, 'root shape change arrays');
    function __tTrigModsEqNe() {
      __reset();
      _dm.set('a', 5)
      let c = 0
      const trig = __si('a')
      const h = applyTrMs(() => ++c, trig, [{ root: M_EQ, path: '5' }, { root: M_NE, path: '6' }])
      h()
      _dm.set('a', 6)
      h()
      return c
    }
    __assert(__tTrigModsEqNe, [], 1, 'applyTrMs: eq/ne filter');
    function __tTrigModsAnd() {
      __reset();
      _dm.set('gate', false)
      let c = 0
      const trig = __ev()
      const h = applyTrMs(() => ++c, trig, [{ root: M_AND, path: 'gate' }])
      h(DM, null, trig, null, 1)
      _dm.set('gate', true)
      h(DM, null, trig, null, 2)
      return c
    }
    __assert(__tTrigModsAnd, [], 1, 'applyTrMs: and gate');
    function __tTrigModsPreventOnce() {
      let p = 0, r = 0, c = 0
      const ev = { preventDefault: () => ++p }
      const trig = __ev()
      const sub = { trig, fn: null, ev: { taEl: { removeEventListener: () => ++r }, evName: 'click', opts: false }, clearId: null }
      const h = applyTrMs(() => ++c, trig, [{ root: M_PREVENT, path: null }, { root: M_ONCE, path: null }], sub)
      sub.fn = h
      h(DM, null, trig, null, ev)
      return { p, r, c }
    }
    __assert(__tTrigModsPreventOnce, [], { p: 1, r: 1, c: 1 }, 'applyTrMs: prevent + once');
    function __tTrigModsValueFallback() {
      const out = []
      const trig = __ev()
      const handler = applyTrMs((_dm, _el, _trig, trigVal, detail) => out.push({ trigVal, detail }), trig, [])
      handler(DM, null, trig, null, { type: 'custom-value', detail: { value: 9 } })
      handler(DM, null, trig, null, { type: 'custom-ms', detail: { ms: 12 } })
      return out
    }
    __assert(__tTrigModsValueFallback, [], [
      { trigVal: 9, detail: { type: 'custom-value', detail: { value: 9 } } },
      { trigVal: 12, detail: { type: 'custom-ms', detail: { ms: 12 } } }
    ], 'applyTrMs: event detail fallback');
    function __tTrigModsDebounce() {
      const st = setTimeout, ct = clearTimeout
      let id = 0
      const q = new Map()
      setTimeout = (cb, _ms, ...args) => (q.set(++id, [cb, args]), id)
      clearTimeout = (n) => q.delete(n)
      try {
        const out = []
        const trig = __ev()
        const h = applyTrMs((_dm, _el, _trig, _trigVal, detail) => out.push(detail), trig, [{ root: M_DEBOUNCE, path: 8 }])
        h(DM, null, trig, null, 1)
        h(DM, null, trig, null, 2)
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
    __assert(__tTrigModsDebounce, [], [2], 'applyTrMs: debounce keeps last call');
    function __tTrigModsThrottle() {
      const dn = Date.now
      let now = 100
      Date.now = () => now
      try {
        const out = []
        const trig = __ev()
        const h = applyTrMs((_dm, _el, _trig, _trigVal, detail) => out.push(detail), trig, [{ root: M_THROTTLE, path: 10 }])
        h(DM, null, trig, null, 1)
        now = 105
        h(DM, null, trig, null, 2)
        now = 111
        h(DM, null, trig, null, 3)
        return out
      } finally {
        Date.now = dn
      }
    }
    __assert(__tTrigModsThrottle, [], [1, 3], 'applyTrMs: throttle rate limit');
    function __tTrigModsRepeatedPermitChecks() {
      __reset();
      _dm.set('gateA', true)
      _dm.set('gateB', false)
      let c = 0
      const mods = [{ root: M_AND, path: 'gateA' }, { root: M_AND, path: 'gateB' }, { root: M_GE, path: '5' }, { root: M_LT, path: '9' }, { root: M_NE, path: '7' }]
      const trig = __ev()
      const h = applyTrMs(() => ++c, trig, mods)
      h(DM, null, trig, 6, null)
      _dm.set('gateB', true)
      h(DM, null, trig, 4, null)
      h(DM, null, trig, 7, null)
      h(DM, null, trig, 8, null)
      return c
    }
    __assert(__tTrigModsRepeatedPermitChecks, [], 1, 'applyTrMs: repeated and/check permit mods');
    function __tSubImmediateProp() {
      __reset();
      const fooEl = getElById('foo', 'probe'); if (fooEl) fooEl.textContent = 'good';
      const before = fooEl?.textContent || '';
      dmEx(null, 'data-m-ex:#foo.', `'Seaman!'`);
      const after = fooEl?.textContent || '';
      return { before, after };
    }
    __assert(__tSubImmediateProp, [], { before: 'good', after: 'Seaman!' }, 'dmEx immediate prop set on #foo');
    function __tSubEventSignal() {
      __reset();
      try {
        const btn = document.createElement('button');
        dmEx(btn, 'data-m-ex:sg@.', `'A'`);
        const h = __getEventSub(btn)
        if (h?.fn) h.fn({ type: 'click', detail: null, preventDefault() { } })
        else btn.dispatchEvent(mkEv('click'));
        return { sg: DM['sg'], diag: h ? 'direct-handler' : 'dispatch' };
      } catch (e) {
        return { sg: DM['sg'], diag: 'error:' + (e && e.message ? e.message : String(e)) }
      }
    }
    __assert(__tSubEventSignal, [], { sg: 'A', diag: 'direct-handler' }, 'dmEx event click sets signal');
    function __tSubEventPropToSignal() {
      __reset();
      try {
        const inp = document.createElement('input');
        inp.value = 'Zed';
        dmEx(inp, 'data-m-ex:out@.', 'val');
        const h = __getEventSub(inp)
        if (h?.fn) h.fn({ type: 'change', detail: null, preventDefault() { } })
        else inp.dispatchEvent(mkEv('change'));
        return { out: DM['out'], diag: h ? 'direct-handler' : 'dispatch' };
      } catch (e) {
        return { out: DM['out'], diag: 'error:' + (e && e.message ? e.message : String(e)) }
      }
    }
    __assert(__tSubEventPropToSignal, [], { out: 'Zed', diag: 'direct-handler' }, 'dmEx event passes element value to signal');
    function __tSubEventPropToSignalEmptyExpr() {
      __reset();
      try {
        const inp = document.createElement('input');
        inp.value = 'Zed';
        dmEx(inp, 'data-m-ex:out@.', '');
        const h = __getEventSub(inp)
        if (h?.fn) h.fn({ type: 'change', detail: null, preventDefault() { } })
        else inp.dispatchEvent(mkEv('change'));
        return { out: DM['out'], diag: h ? 'direct-handler' : 'dispatch' };
      } catch (e) {
        return { out: DM['out'], diag: 'error:' + (e && e.message ? e.message : String(e)) }
      }
    }
    __assert(__tSubEventPropToSignalEmptyExpr, [], { out: 'Zed', diag: 'direct-handler' }, 'dmEx empty expr passes trigger value to signal');
    function __tSubEventValModPropToSignal() {
      __reset();
      try {
        const inp = document.createElement('input');
        inp.value = 'Zed';
        inp.setAttribute('data-foo-bar', '33');
        dmEx(inp, 'data-m-ex:out@.^val.data-foo-bar', 'val');
        const h = __getEventSub(inp)
        if (h?.fn) h.fn({ type: 'change', detail: null, preventDefault() { } })
        else inp.dispatchEvent(mkEv('change'));
        return { out: DM['out'], diag: h ? 'direct-handler' : 'dispatch' };
      } catch (e) {
        return { out: DM['out'], diag: 'error:' + (e && e.message ? e.message : String(e)) }
      }
    }
    __assert(__tSubEventValModPropToSignal, [], { out: '33', diag: 'direct-handler' }, 'dmEx ^val selects non-default event property');
    function __tSubSignalImmediateAndChange() {
      __reset();
      _dm.set('foo', 7);
      const el = document.createElement('div');
      dmEx(el, 'data-m-ex:bar@foo', 'dm.foo');
      const im = DM['bar'];
      setSiAndNotifySubs('test', { root: 'foo', path: null }, 8);
      const after = DM['bar'];
      return { im, after };
    }
    __assert(__tSubSignalImmediateAndChange, [], { im: 7, after: 8 }, 'dmEx @foo immediate-by-default and change propagation');
    function __tSubSignalImmediateAndChangeEmptyExpr() {
      __reset();
      _dm.set('foo', 7);
      const el = document.createElement('div');
      dmEx(el, 'data-m-ex:bar@foo', '');
      const im = DM['bar'];
      setSiAndNotifySubs('test', { root: 'foo', path: null }, 8);
      const after = DM['bar'];
      return { im, after };
    }
    __assert(__tSubSignalImmediateAndChangeEmptyExpr, [], { im: 7, after: 8 }, 'dmEx empty expr uses signal trigger value');
    function __tSubSignalNotImmediate() {
      __reset();
      _dm.set('foo', 7);
      const el = document.createElement('div');
      dmEx(el, 'data-m-ex:bar@foo^notimmediate', 'dm.foo');
      const before = DM['bar'];
      setSiAndNotifySubs('test', { root: 'foo', path: null }, 8);
      return { before, after: DM['bar'] };
    }
    __assert(__tSubSignalNotImmediate, [], { before: undefined, after: 8 }, 'dmEx @foo^notimmediate skips setup run but handles later changes');
    function __tSubSignalEmptyExprNoTarget() {
      __reset();
      _dm.set('foo', 7);
      const el = document.createElement('div');
      dmEx(el, 'data-m-ex@foo', '');
      const before = Object.keys(DM).sort();
      setSiAndNotifySubs('test', { root: 'foo', path: null }, 8);
      return { before, after: Object.keys(DM).sort(), foo: DM['foo'], bar: DM['bar'] };
    }
    __assert(__tSubSignalEmptyExprNoTarget, [], { before: ['foo'], after: ['foo'], foo: 8, bar: undefined }, 'dmEx empty expr with no target is a no-op');
    function __tSubSignalValModPathAndExpr() {
      __reset();
      _dm.set('foo', { bar: 7 });
      const el = document.createElement('div');
      dmEx(el, 'data-m-ex:bar@foo^val.bar', '');
      dmEx(el, 'data-m-ex:baz@foo^val.bar', 'val + 1');
      const initial = { bar: DM['bar'], baz: DM['baz'] };
      setSiAndNotifySubs('test', { root: 'foo', path: null }, { bar: 8 });
      return { initial, after: { bar: DM['bar'], baz: DM['baz'] } };
    }
    __assert(__tSubSignalValModPathAndExpr, [], { initial: { bar: 7, baz: 8 }, after: { bar: 8, baz: 9 } }, 'dmEx signal ^val path feeds raw and expression values');
    function __tSubExplicitIdEventPath() {
      __reset();
      const id = 'evtbtnexplicit'
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = 'C';
      document.body.appendChild(btn);
      try {
        dmEx(btn, `data-m-ex:eventMeta@#${id}.click`, `({kind: trig.kind, root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
        btn.dispatchEvent(mkEv('click'));
        return DM['eventMeta'];
      } finally { btn.remove(); }
    }
    __assert(__tSubExplicitIdEventPath, [], { kind: EP, root: 'evtbtnexplicit', path: ['click'], val: 'C', detailType: 'click' }, 'dmEx explicit #id event path metadata');
    function __tSubExplicitIdEventDetail() {
      __reset();
      const id = 'evtbtndetail'
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = 'C';
      document.body.appendChild(btn);
      try {
        dmEx(btn, `data-m-ex:eventCustomMeta@#${id}.click`, `({ val, detailType: detail?.type, eventValue: detail?.detail?.value })`);
        btn.dispatchEvent(new CustomEvent('click', { bubbles: true, detail: { value: 9 } }));
        return DM['eventCustomMeta'];
      } finally { btn.remove(); }
    }
    __assert(__tSubExplicitIdEventDetail, [], { val: 'C', detailType: 'click', eventValue: 9 }, 'dmEx explicit #id event path keeps full event detail');
    function __tSubExplicitIdPropPath() {
      __reset();
      const id = 'evtinputprop'
      const inp = document.createElement('input');
      inp.id = id;
      inp.value = 'Alpha';
      document.body.appendChild(inp);
      try {
        dmEx(inp, `data-m-ex:propMeta@#${id}.value`, `({kind: trig.kind, root: trig.root, path: trig.path, val})`);
        inp.dispatchEvent(mkEv('change'));
        return DM['propMeta'];
      } finally { inp.remove(); }
    }
    __assert(__tSubExplicitIdPropPath, [], { kind: EP, root: 'evtinputprop', path: ['value'], val: 'Alpha' }, 'dmEx explicit #id prop trigger path');
    function __tSubSpecialWindowAndDocument() {
      __reset();
      const host = document.createElement('div');
      dmEx(host, 'data-m-ex:winMeta@_window.resize', `({root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
      dmEx(host, 'data-m-ex:docMeta@_document.visibilitychange', `({root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
      window.dispatchEvent(mkEv('resize'));
      document.dispatchEvent(mkEv('visibilitychange'));
      return { win: DM['winMeta'], doc: DM['docMeta'] };
    }
    __assert(__tSubSpecialWindowAndDocument, [], {
      win: { root: 'window', path: ['resize'], val: 'resize', detailType: 'resize' },
      doc: { root: 'document', path: ['visibilitychange'], val: 'visibilitychange', detailType: 'visibilitychange' }
    }, 'dmEx window/document special triggers');
    function __tSubSpecialFormPath() {
      __reset();
      const form = document.createElement('form');
      const input = document.createElement('input');
      form.appendChild(input);
      document.body.appendChild(form);
      try {
        dmEx(input, 'data-m-ex:formMeta@_form.submit', `({root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
        const ev = mkEv('submit')
        form.dispatchEvent(ev)
        return DM['formMeta']
      } finally { form.remove() }
    }
    __assert(__tSubSpecialFormPath, [], { root: 'form', path: ['submit'], val: 'submit', detailType: 'submit' }, 'dmEx form special trigger');
    function __tSubSpecialIntervalAndTimeout() {
      __reset();
      const st = setTimeout, si = setInterval
      const timeoutQueue = [], intervalQueue = []
      setTimeout = (cb, _ms, ...args) => (timeoutQueue.push([cb, args]), timeoutQueue.length)
      setInterval = (cb, _ms, ...args) => (intervalQueue.push([cb, args]), intervalQueue.length)
      try {
        const host = document.createElement('div')
        dmEx(host, 'data-m-ex:intMeta@_interval.25', `({root: trig.root, path: trig.path, val, detail})`)
        dmEx(host, 'data-m-ex:timeoutMeta@_timeout.50', `({root: trig.root, path: trig.path, val, detail})`)
        if (intervalQueue[0]) intervalQueue[0][0](...intervalQueue[0][1])
        if (timeoutQueue[0]) timeoutQueue[0][0](...timeoutQueue[0][1])
        return { i: DM['intMeta'], t: DM['timeoutMeta'] }
      } finally {
        setTimeout = st
        setInterval = si
      }
    }
    __assert(__tSubSpecialIntervalAndTimeout, [], {
      i: { root: 'interval', path: ['25'], val: 25, detail: { tick: 0, ms: 25, type: 'interval' } },
      t: { root: 'timeout', path: ['50'], val: 50, detail: { tick: 0, ms: 50, type: 'timeout' } }
    }, 'dmEx interval/timeout special triggers');
    function __tSubSpecialTimerOnceCleanup() {
      __reset();
      const st = setTimeout, si = setInterval, ct = clearTimeout, ci = clearInterval
      const timeoutQueue = [], intervalQueue = [], cleared = []
      setTimeout = (cb, _ms, ...args) => (timeoutQueue.push([cb, args]), timeoutQueue.length)
      setInterval = (cb, _ms, ...args) => (intervalQueue.push([cb, args]), intervalQueue.length)
      clearTimeout = (id) => cleared.push(['timeout', id])
      clearInterval = (id) => cleared.push(['interval', id])
      try {
        const host = document.createElement('div')
        dmEx(host, 'data-m-ex:intOnce@_interval.25^once', 'val')
        dmEx(host, 'data-m-ex:timeoutOnce@_timeout.50^once', 'val')
        if (intervalQueue[0]) intervalQueue[0][0](...intervalQueue[0][1])
        if (timeoutQueue[0]) timeoutQueue[0][0](...timeoutQueue[0][1])
        return { cleared, intOnce: DM['intOnce'], timeoutOnce: DM['timeoutOnce'] }
      } finally {
        setTimeout = st
        setInterval = si
        clearTimeout = ct
        clearInterval = ci
      }
    }
    __assert(__tSubSpecialTimerOnceCleanup, [], {
      cleared: [['interval', 1], ['timeout', 1]],
      intOnce: 25,
      timeoutOnce: 50
    }, 'dmEx interval/timeout ^once cleanup');
    function __tSubSpecialInit() {
      __reset();
      const host = document.createElement('div');
      dmEx(host, 'data-m-ex:initMeta@_init', `({root: trig.root, path: trig.path, val, detailType: detail && detail.type})`);
      return DM['initMeta'];
    }
    __assert(__tSubSpecialInit, [], { root: 'init', path: null, val: 'init', detailType: 'init' }, 'dmEx _init special trigger fires immediately');
    function __tSubSpecialInitOnceWithClick() {
      __reset();
      const host = document.createElement('div');
      dmEx(host, 'data-m-ex:initClickLog@_init@.click', `(dm.initClickLog || []).concat(detail && detail.type || 'click')`);
      host.dispatchEvent(mkEv('click'));
      host.dispatchEvent(mkEv('click'));
      return DM['initClickLog'];
    }
    __assert(__tSubSpecialInitOnceWithClick, [], ['init', 'click', 'click'], 'dmEx _init fires on init and click fires on each click');
    function __tSubSpecialInitRanImmediateDedup() {
      __reset();
      _dm.set('counter', 0);
      const host = document.createElement('div');
      dmEx(host, 'data-m-ex:counter@_init@counter', 'dm.counter + 1');
      return DM['counter'];
    }
    __assert(__tSubSpecialInitRanImmediateDedup, [], 1, 'dmEx _init with signal trigger: only one init run (ranImmediate dedup)');

    function __tSubRepeatedPermitGating() {
      __reset();
      _dm.set('gateA', true)
      _dm.set('gateB', false)
      _dm.set('src', 1)
      const host = document.createElement('div');
      dmEx(host, 'data-m-ex:dst@src^and.gateA^and.gateB^ge.5^lt.9^ne.7', 'val')
      setSiAndNotifySubs('t', { root: 'src', path: null }, 8)
      _dm.set('gateB', true)
      setSiAndNotifySubs('t', { root: 'src', path: null }, 4)
      setSiAndNotifySubs('t', { root: 'src', path: null }, 7)
      setSiAndNotifySubs('t', { root: 'src', path: null }, 8)
      return DM['dst'] ?? null
    }
    __assert(__tSubRepeatedPermitGating, [], 8, 'dmEx repeated permit mods gating');
    function __tSubRwTwoWayDefault() {
      __reset();
      const inp = document.createElement('input')
      _dm.set('name', 'Ada')
      dmEx(inp, 'data-m-ex@.^rw@name')
      const before = inp.value
      inp.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      const sigAfterWrite = DM['name']
      setSiAndNotifySubs('t', { root: 'name', path: null }, 'Eve')
      return { before, sigAfterWrite, elAfterSignal: inp.value }
    }
    __assert(__tSubRwTwoWayDefault, [], { before: 'Ada', sigAfterWrite: 'Bob', elAfterSignal: 'Eve' }, 'dmEx ^rw two-way default');
    function __tSubSignalToPropOnly() {
      __reset();
      const inp = document.createElement('input')
      _dm.set('name', 'Ada')
      dmEx(inp, 'data-m-ex:.@name')
      const before = inp.value
      inp.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      const sigAfterLocalEvent = DM['name']
      setSiAndNotifySubs('t', { root: 'name', path: null }, 'Eve')
      return { before, sigAfterLocalEvent, elAfterSignal: inp.value }
    }
    __assert(__tSubSignalToPropOnly, [], { before: 'Ada', sigAfterLocalEvent: 'Ada', elAfterSignal: 'Eve' }, 'dmEx signal->prop one-way');
    function __tSubPropToSignalOnly() {
      __reset();
      const inp = document.createElement('input')
      _dm.set('name', 'Ada')
      inp.value = 'Initial'
      dmEx(inp, 'data-m-ex:name@.')
      const before = inp.value
      const sigAfterElementWrite = DM['name']
      setSiAndNotifySubs('t', { root: 'name', path: null }, 'Eve')
      const elAfterSignal = inp.value
      inp.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      return { before, sigAfterElementWrite, elAfterSignal, sigAfterEvent: DM['name'] }
    }
    __assert(__tSubPropToSignalOnly, [], { before: 'Initial', sigAfterElementWrite: 'Ada', elAfterSignal: 'Initial', sigAfterEvent: 'Bob' }, 'dmEx prop->signal one-way waits for an event');
    function __tSubPropToSignalNotImmediate() {
      __reset();
      const inp = document.createElement('input')
      _dm.set('name', 'Ada')
      inp.value = 'Initial'
      dmEx(inp, 'data-m-ex^notimmediate:name@.')
      const sigBeforeChange = DM['name']
      inp.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      return { sigBeforeChange, sigAfterEvent: DM['name'] }
    }
    __assert(__tSubPropToSignalNotImmediate, [], { sigBeforeChange: 'Ada', sigAfterEvent: 'Bob' }, 'dmEx ^notimmediate matches default prop->signal timing');
    function __tSubRwCheckboxDefaultProp() {
      __reset();
      const cb = document.createElement('input')
      cb.type = 'checkbox'
      DM['isOn'] = true
      dmEx(cb, 'data-m-ex@.^rw@is-on')
      const before = cb.checked
      cb.checked = false
      cb.dispatchEvent(mkEv('change'))
      const sigAfterWrite = DM['isOn']
      setSiAndNotifySubs('t', { root: 'isOn', path: null }, true)
      return { before, sigAfterWrite, afterSignal: cb.checked }
    }
    __assert(__tSubRwCheckboxDefaultProp, [], { before: true, sigAfterWrite: false, afterSignal: true }, 'dmEx ^rw checkbox checked/value default prop');
    function __tSubRwValPathBothWays() {
      __reset();
      const inp = document.createElement('input')
      inp.val = { value: 'Initial' }
      _dm.set('name', 'Ada')
      dmEx(inp, 'data-m-ex@.^val.val.value^rw@name')
      const before = inp.val.value
      inp.val.value = 'Bob'
      inp.dispatchEvent(mkEv('change'))
      const sigAfterWrite = DM['name']
      setSiAndNotifySubs('t', { root: 'name', path: null }, 'Eve')
      return { before, sigAfterWrite, afterSignal: inp.val.value }
    }
    __assert(__tSubRwValPathBothWays, [], { before: 'Ada', sigAfterWrite: 'Bob', afterSignal: 'Eve' }, 'dmEx ^rw honors ^val path both ways');
    function __tClassSignalToggle() {
      __reset()
      const div = document.createElement('div')
      _dm.set('active', false)
      dmCl(div, 'data-m-cl+active@active^immediate')
      const hadBefore = div.classList.contains('active')
      setSiAndNotifySubs('t', { root: 'active', path: null }, true)
      const hadAfter = div.classList.contains('active')
      setSiAndNotifySubs('t', { root: 'active', path: null }, false)
      const hadFinal = div.classList.contains('active')
      return { hadBefore, hadAfter, hadFinal }
    }
    __assert(__tClassSignalToggle, [], { hadBefore: false, hadAfter: true, hadFinal: false }, 'dmCl signal toggle with immediate');
    function __tClassInvertedClass() {
      __reset()
      const div = document.createElement('div')
      _dm.set('active', false)
      dmCl(div, 'data-m-cl+!inactive@active^immediate')
      const hadBefore = div.classList.contains('inactive')
      setSiAndNotifySubs('t', { root: 'active', path: null }, true)
      const hadAfter = div.classList.contains('inactive')
      return { hadBefore, hadAfter }
    }
    __assert(__tClassInvertedClass, [], { hadBefore: true, hadAfter: false }, 'dmCl inverted +! adds when falsy');
    function __tClassMultiClass() {
      __reset()
      const div = document.createElement('div')
      _dm.set('active', true)
      dmCl(div, 'data-m-cl+is-active+!is-inactive@active^immediate')
      const activeBefore = div.classList.contains('is-active')
      const inactiveBefore = div.classList.contains('is-inactive')
      setSiAndNotifySubs('t', { root: 'active', path: null }, false)
      const activeAfter = div.classList.contains('is-active')
      const inactiveAfter = div.classList.contains('is-inactive')
      return { activeBefore, inactiveBefore, activeAfter, inactiveAfter }
    }
    __assert(__tClassMultiClass, [], { activeBefore: true, inactiveBefore: false, activeAfter: false, inactiveAfter: true }, 'dmCl multi-class kebab toggle');
    function __tClassWithExpr() {
      __reset()
      const div = document.createElement('div')
      _dm.set('count', 2)
      dmCl(div, 'data-m-cl+even@count^immediate', 'dm.count % 2 === 0')
      const hadBefore = div.classList.contains('even')
      setSiAndNotifySubs('t', { root: 'count', path: null }, 3)
      const hadAfter = div.classList.contains('even')
      return { hadBefore, hadAfter }
    }
    __assert(__tClassWithExpr, [], { hadBefore: true, hadAfter: false }, 'dmCl compiled expression controls class');
    function __tDispHideShow() {
      __reset()
      const div = document.createElement('div')
      div.style.display = 'block'
      _dm.set('visible', true)
      dmSh(div, 'data-m-sh:.@visible^immediate')
      const displayBefore = div.style.display
      setSiAndNotifySubs('t', { root: 'visible', path: null }, false)
      const displayAfterHide = div.style.display
      setSiAndNotifySubs('t', { root: 'visible', path: null }, true)
      const displayAfterShow = div.style.display
      return { displayBefore, displayAfterHide, displayAfterShow }
    }
    __assert(__tDispHideShow, [], { displayBefore: 'block', displayAfterHide: 'none', displayAfterShow: 'block' }, 'dmSh show/hide cycle');
    function __tDispWireNodeEmptyValue() {
      __reset()
      const tpl = document.createElement('template')
      tpl.innerHTML = '<div style="display:block" data-m-sh:.@visible^immediate></div>'
      const div = tpl.content.firstElementChild
      _dm.set('visible', true)
      wireNode(div, 'data-m-sh:.@visible^immediate', div.getAttribute('data-m-sh:.@visible^immediate'))
      const displayBefore = div.style.display
      setSiAndNotifySubs('t', { root: 'visible', path: null }, false)
      const displayAfter = div.style.display
      return { displayBefore, displayAfter }
    }
    __assert(__tDispWireNodeEmptyValue, [], { displayBefore: 'block', displayAfter: 'none' }, 'dmSh valueless attr works through wireNode');
    function __tDispWithExpr() {
      __reset()
      const div = document.createElement('div')
      div.style.display = 'flex'
      _dm.set('count', 0)
      dmSh(div, 'data-m-sh:.@count^immediate', 'dm.count > 0')
      const displayBefore = div.style.display
      setSiAndNotifySubs('t', { root: 'count', path: null }, 5)
      const displayAfter = div.style.display
      return { displayBefore, displayAfter }
    }
    __assert(__tDispWithExpr, [], { displayBefore: 'none', displayAfter: 'flex' }, 'dmSh compiled expression show/hide');
    function __tDispTargetElSignal() {
      __reset()
      const box = document.createElement('div')
      box.id = 'dispBox'
      box.style.display = 'block'
      document.body.appendChild(box)
      try {
        _dm.set('show', true)
        dmSh(box, 'data-m-sh:.@show^immediate')
        const displayBefore = box.style.display
        setSiAndNotifySubs('t', { root: 'show', path: null }, false)
        const displayAfter = box.style.display
        return { displayBefore, displayAfter }
      } finally { box.remove() }
    }
    __assert(__tDispTargetElSignal, [], { displayBefore: 'block', displayAfter: 'none' }, 'dmSh hides element on false signal');
    function __tDumpAppendOnly() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li>item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('items', [])
        dmIt(el, 'data-m-it@items')
        const before = el.children.length
        setSiAndNotifySubs('t', { root: 'items', path: null }, ['a', 'b'])
        const after = el.children.length
        return { before, after }
      } finally { el.remove() }
    }
    __assert(__tDumpAppendOnly, [], { before: 0, after: 2 }, 'dmIt append-only: signal grows from [] to 2 items')
    function __tDumpRemoveFromEnd() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li>item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('items', ['a', 'b', 'c'])
        dmIt(el, 'data-m-it@items')
        const before = el.children.length
        setSiAndNotifySubs('t', { root: 'items', path: null }, ['a'])
        const after = el.children.length
        return { before, after }
      } finally { el.remove() }
    }
    __assert(__tDumpRemoveFromEnd, [], { before: 3, after: 1 }, 'dmIt immediate-by-default remove from end: 3 items shrinks to 1')
    function __tDumpIndexPlaceholder() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li data-idx="$index">item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('rows', ['x', 'y'])
        dmIt(el, 'data-m-it@rows')
        return Array.from(el.children).map(n => n.getAttribute('data-idx'))
      } finally { el.remove() }
    }
    __assert(__tDumpIndexPlaceholder, [], ['0', '1'], 'dmIt $index placeholder rewritten in cloned attribute values')
    function __tDumpItemPlaceholder() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li data-val="$item">item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('rows', ['x', 'y'])
        dmIt(el, 'data-m-it@rows')
        return Array.from(el.children).map(n => n.getAttribute('data-val'))
      } finally { el.remove() }
    }
    __assert(__tDumpItemPlaceholder, [], ['dm.rows[0]', 'dm.rows[1]'], 'dmIt $item placeholder rewritten to dm.signal[idx] in attribute values')
    function __tDumpInlineTemplate() {
      __reset()
      const el = document.createElement('div')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<span>child</span>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('list', ['a', 'b', 'c'])
        dmIt(el, 'data-m-it@list')
        const count = el.children.length
        const tplStillChild = !!el.querySelector('template')
        return { count, tplStillChild }
      } finally { el.remove() }
    }
    __assert(__tDumpInlineTemplate, [], { count: 3, tplStillChild: false }, 'dmIt inline <template> detached after read, 3 clones appended')
    function __tDumpImmediate() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li>item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('items', ['x', 'y', 'z'])
        dmIt(el, 'data-m-it@items')
        return el.children.length
      } finally { el.remove() }
    }
    __assert(__tDumpImmediate, [], 3, 'dmIt renders existing signal array on setup by default')
    function __tDumpNotImmediate() {
      __reset()
      const el = document.createElement('ul')
      const tpl = document.createElement('template')
      tpl.innerHTML = '<li>item</li>'
      el.appendChild(tpl)
      document.body.appendChild(el)
      try {
        _dm.set('items', ['x', 'y'])
        dmIt(el, 'data-m-it@items^notimmediate')
        const before = el.children.length
        setSiAndNotifySubs('t', { root: 'items', path: null }, ['x', 'y', 'z'])
        return { before, after: el.children.length }
      } finally { el.remove() }
    }
    __assert(__tDumpNotImmediate, [], { before: 0, after: 3 }, 'dmIt ^notimmediate skips initial render and still responds to later changes')
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
        dmIt(el, 'data-m-it+#myTpl@items')
        return el.children.length
      } finally { tplEl.remove(); el.remove() }
    }
    __assert(__tDumpExplicitTemplate, [], 2, 'dmIt +#tplId explicit template reference appends 2 clones')
    // ---- dmAct async tests ----
    // Tests run sequentially to avoid concurrent __reset() interference with shared _subs/_dm state.
    let _asyncChain = Promise.resolve()
    function __asyncAssert(label, promiseFn) {
      _asyncChain = _asyncChain.then(() =>
        promiseFn().then(({ actual, expected }) => {
          if (deepEqual(actual, expected))
            console.log('✓', 'dmAct —', label, '>>>', fmt(actual))
          else
            console.error('✗', 'dmAct —', label, '>>> expected:', fmt(expected), 'actual:', fmt(actual))
        }).catch(err => {
          console.error('✗', 'dmAct —', label, '>>> threw:', err && err.message ? err.message : String(err))
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
        dmAct(btn, 'data-m-get:items@.click^immediate', '"https://api.test/items"')
        // click trigger registers the event; immediate also fires doRequest once at setup
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { calls: fetchCalls.length, method: fetchCalls[0]?.method, url: fetchCalls[0]?.url, items: DM['items'] },
          expected: { calls: 2, method: 'GET', url: 'https://api.test/items', items: [1, 2, 3] }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('POST ^json sends content-type and JSON body', async () => {
      __reset()
      let sentBody = null, sentHs = null
      window.fetch = (_url, init) => {
        sentBody = init.body
        sentHs = init.headers
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
        dmAct(btn, 'data-m-post^json:postResult@.click+titleVal', '"https://api.test/posts"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { contentType: sentHs?.['content-type'], body: JSON.parse(sentBody), result: DM['postResult'] },
          expected: { contentType: 'application/json', body: 'Hello World', result: { id: 1 } }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('signal-triggered dmAct uses dm state (trigger args stay ignored)', async () => {
      __reset()
      const fetchCalls = []
      window.fetch = (url, init) => {
        fetchCalls.push({ url, method: init.method })
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const host = document.createElement('div')
        _dm.set('route', 'first')
        _dm.set('fire', 0)
        _dm.set('res', null)
        dmAct(host, 'data-m-get:res@fire', '`https://api.test/${dm.route}`')
        setSiAndNotifySubs('t', { root: 'route', path: null }, 'second')
        setSiAndNotifySubs('t', { root: 'fire', path: null }, 1)
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { calls: fetchCalls.length, method: fetchCalls[0]?.method, url: fetchCalls[0]?.url, res: DM['res'] },
          expected: { calls: 1, method: 'GET', url: 'https://api.test/second', res: { ok: true } }
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
        dmAct(btn, 'data-m-get^busy.busy:data@.click', '"https://api.test/data"')
        __fireEventSub(btn, 'click')
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
        dmAct(btn, 'data-m-get^busy.busy2^complete.done:data2@.click', '"https://api.test/data"')
        __fireEventSub(btn, 'click')
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
        dmAct(btn, 'data-m-get^complete.done2:data@.click', '"https://api.test/data"')
        __fireEventSub(btn, 'click')
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
        dmAct(btn, 'data-m-get^busy.busy^err.err-msg:data@.click', '"https://api.test/data"')
        __fireEventSub(btn, 'click')
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
        dmAct(div, 'data-m-get:content@reload^immediate', '"https://api.test/content"')
        await new Promise(r => setTimeout(r, 0))
        const afterImmediate = fetchUrls.length
        setSiAndNotifySubs('t', { root: 'reload', path: null }, 1)
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { afterImmediate, total: fetchUrls.length, content: DM['content'] },
          expected: { afterImmediate: 1, total: 2, content: 'ok' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^send-all and +path^spread spread signal object fields into request payload', async () => {
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
        dmAct(btn, 'data-m-post^json^send-all:req@.click+nested^spread', '"https://api.test/all"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: JSON.parse(sentBody),
          expected: { a: 1, nested: { x: 7, y: 8 }, x: 7, y: 8 }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^patch-all updates matching root signals from response payload', async () => {
      __reset()
      _dm.set('alpha', 0)
      _dm.set('fooBar', 0)
      window.fetch = () => Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ alpha: 1, 'foo-bar': 2, extra: 3 })
      })
      try {
        const btn = document.createElement('button')
        dmAct(btn, 'data-m-get^patch-all@.click', '"https://api.test/obj"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { alpha: DM['alpha'], fooBar: DM['fooBar'], hasExtra: _dm.has('extra') },
          expected: { alpha: 1, fooBar: 2, hasExtra: false }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^sync-all sends all signals and patches matching response fields', async () => {
      __reset()
      _dm.set('alpha', 0)
      _dm.set('fooBar', 0)
      _dm.set('localOnly', 9)
      let sentBody = null
      try {
        const btn = document.createElement('button')
        window.fetch = (_url, init) => {
          sentBody = init.body
          return Promise.resolve({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({ alpha: 3, 'foo-bar': 4, ignored: 5 })
          })
        }
        dmAct(btn, 'data-m-post^json^sync-all@.click', '"https://api.test/sync"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { sent: JSON.parse(sentBody), alpha: DM['alpha'], fooBar: DM['fooBar'], localOnly: DM['localOnly'], hasIgnored: _dm.has('ignored') },
          expected: { sent: { alpha: 0, fooBar: 0, localOnly: 9 }, alpha: 3, fooBar: 4, localOnly: 9, hasIgnored: false }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^merge and header mods combine response state and attach extra hs', async () => {
      __reset()
      let sentHs = null
      window.fetch = (_url, init) => {
        sentHs = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/problem+json' },
          json: async () => ({ meta: { age: 2 }, active: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('profile', { name: 'Alice', meta: { age: 1, city: 'Riga' } })
        _dm.set('reqHs', { authorization: 'Bearer 123', 'x-trace': 'abc' })
        dmAct(btn, 'data-m-get^merge^no-cache^hs.req-hs:profile@.click', '"https://api.test/profile"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: {
            profile: DM['profile'],
            cacheControl: sentHs?.['cache-control'],
            auth: sentHs?.authorization
          },
          expected: {
            profile: { name: 'Alice', meta: { age: 2, city: 'Riga' }, active: true },
            cacheControl: 'no-cache',
            auth: 'Bearer 123'
          }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('compression mods set accept-encoding header consistently', async () => {
      __reset()
      let sentHs = null
      window.fetch = (_url, init) => {
        sentHs = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('res', null)
        dmAct(btn, 'data-m-get^br^gzip^deflate^compress:res@.click', '"https://api.test/enc"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: sentHs?.['accept-encoding'],
          expected: 'br, gzip, deflate, compress'
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^sse overrides generic accept from ^hs while ^header stays most specific', async () => {
      __reset()
      let capturedHs = null
      window.fetch = (_url, init) => {
        capturedHs = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'text/event-stream' },
          text: async () => ''
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('reqHs', { accept: 'application/json', authorization: 'Bearer old' })
        _dm.set('authorization', 'Bearer new')
        dmAct(btn, 'data-m-get^sse^hs.req-hs^header.authorization:res@.click', '"https://api.test/sse"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: { accept: capturedHs?.accept, auth: capturedHs?.authorization },
          expected: { accept: 'text/event-stream', auth: 'Bearer new' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^hs kebab-cases object fields by default while ^hs-no-kebab preserves exact keys', async () => {
      __reset()
      let firstHs = null, secondHs = null
      window.fetch = (_url, init) => {
        if (!firstHs) firstHs = init.headers
        else secondHs = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn1 = document.createElement('button')
        _dm.set('reqHs', { xTraceId: 'req-001', authorization: 'Bearer hdr' })
        dmAct(btn1, 'data-m-get^hs.req-hs:res@.click', '"https://api.test/hs"')
        __fireEventSub(btn1, 'click')
        await new Promise(r => setTimeout(r, 0))
        const btn2 = document.createElement('button')
        _dm.set('rawHs', { 'X-Trace-Id': 'req-raw' })
        dmAct(btn2, 'data-m-get^hs.raw-hs^hs-no-kebab:res@.click', '"https://api.test/hs-raw"')
        __fireEventSub(btn2, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: {
            trace: firstHs?.['x-trace-id'],
            auth: firstHs?.authorization,
            raw: secondHs?.['X-Trace-Id']
          },
          expected: { trace: 'req-001', auth: 'Bearer hdr', raw: 'req-raw' }
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
        dmAct(btn, 'data-m-post^url.page:res@.click+payload', '"https://api.test/items"')
        __fireEventSub(btn, 'click')
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
        dmAct(btn, 'data-m-get^body.cursor+filter:res@.click', '"https://api.test/stream"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        // +filter is GET-default → query string; ^body.cursor overrides → request body (single value unwrapped)
        return {
          actual: { url: capturedUrl, body: capturedBody },
          expected: { url: 'https://api.test/stream?filter=active', body: 'abc123' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^header.X keeps kebab-case header names while reading camelCase signals', async () => {
      __reset()
      let capturedHs = null
      window.fetch = (_url, init) => {
        capturedHs = init.headers
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
        dmAct(btn, 'data-m-get^header.authorization^header.x-trace-id:res@.click', '"https://api.test/secure"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: {
            auth: capturedHs?.authorization,
            traceKey: Object.prototype.hasOwnProperty.call(capturedHs, 'x-trace-id'),
            traceVal: capturedHs?.['x-trace-id']
          },
          expected: { auth: 'Bearer tok-xyz', traceKey: true, traceVal: 'req-001' }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^url/^body/^header resolve latest signal values on every request', async () => {
      __reset()
      const calls = []
      window.fetch = (url, init) => {
        calls.push({ url, body: init.body, hs: init.headers })
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({ ok: true })
        })
      }
      try {
        const btn = document.createElement('button')
        _dm.set('page', '1')
        _dm.set('cursor', 'a')
        _dm.set('authorization', 'Bearer old')
        dmAct(btn, 'data-m-post^url.page^body.cursor^header.authorization:res@.click', '"https://api.test/replay"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        _dm.set('page', '2')
        _dm.set('cursor', 'b')
        _dm.set('authorization', 'Bearer new')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: {
            first: calls[0] ? { url: calls[0].url, body: calls[0].body, auth: calls[0].hs && calls[0].hs.authorization } : null,
            second: calls[1] ? { url: calls[1].url, body: calls[1].body, auth: calls[1].hs && calls[1].hs.authorization } : null
          },
          expected: {
            first: { url: 'https://api.test/replay?page=1', body: 'a', auth: 'Bearer old' },
            second: { url: 'https://api.test/replay?page=2', body: 'b', auth: 'Bearer new' }
          }
        }
      } finally { delete window.fetch }
    })
    __asyncAssert('^sse implies no-cache hs automatically', async () => {
      __reset()
      let capturedHs = null
      window.fetch = (_url, init) => {
        capturedHs = init.headers
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'text/event-stream' },
          text: async () => ''
        })
      }
      try {
        const btn = document.createElement('button')
        dmAct(btn, 'data-m-get^sse:res@.click', '"https://api.test/sse"')
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        return {
          actual: {
            accept: capturedHs?.accept,
            cache: capturedHs?.['cache-control'],
            pragma: capturedHs?.pragma
          },
          expected: { accept: 'text/event-stream', cache: 'no-cache', pragma: 'no-cache' }
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
          dmAct(btn, 'data-m-get@.click', "'/mock/sse-incr'")
          __fireEventSub(btn, 'click')
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
        applyPatchEls({ mode: 'replace', dmaxElements: '<input id="fi-inp" type="text" value="reset">' })
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
      applyPatchSigs('t', { dmaxSignals: '{"user":{"name":"Bob","removeMe":null},"newSg":7}' })
      const user = _dm.get('user') || {}
      return { name: user.name, keep: user.keep, hasRemove: Object.prototype.hasOwnProperty.call(user, 'removeMe'), newSg: _dm.get('newSg') }
    }
    __assert(__tDmaxPatchSignalsMergeAndRemove, [], { name: 'Bob', keep: 1, hasRemove: false, newSg: 7 }, 'dmax: patch-signals merges RFC7386 and removes null fields')
    function __tDmaxPatchSignalsOnlyIfMissing() {
      __reset()
      _dm.set('existing', 1)
      applyPatchSigs('t', { onlyIfMissing: 'true', dmaxSignals: '{"existing":2,"added":3}' })
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
        applyPatchEls({ mode: 'outer', dmaxElements: '<button id="ds-btn" class="new">new</button>' })
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
        const applied = applySse(stream, 't')
        return {
          events: applied.length,
          sseVal: _dm.get('sseVal'),
          txt: root.querySelector('#ds-target')?.textContent || '',
          removed: root.querySelector('.rm') === null
        }
      } finally { root.remove() }
    }
    __assert(__tDmaxSseStreamAppliesBothEvents, [], { events: 3, sseVal: 11, txt: 'new', removed: true }, 'dmax: SSE stream applies patch-signals and patch-elements')
    __assert(() => getPatchTars('') === NIL, [], true, 'getPatchTars uses NIL for empty selector')
    __assert(() => parseSseEls('', 'html') === NIL, [], true, 'parseSseEls uses NIL for empty html')
    __assert(() => applySse('', 't') === NIL, [], true, 'applySse uses NIL for empty input')
    __asyncAssert('consumeSseStream uses NIL when stream body is missing', async () => {
      return {
        actual: await consumeSseStream(null, 't') === NIL,
        expected: true
      }
    })
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
        applySse(stream, 't')
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
      await consumeSseStream(
        fakeBody,
        'test-lc',
        { kind: SI, not: null, root: 'sseOpen', path: null },
        { kind: SI, not: null, root: 'sseClose', path: null },
        null
      )
      return {
        actual: { lcVal: _dm.get('lcVal'), sseOpen: _dm.get('sseOpen'), sseClose: _dm.get('sseClose') },
        expected: { lcVal: 42, sseOpen: false, sseClose: true }
      }
    })
    __asyncAssert('^open lifecycle signal set via dmAct ^open.sseOn^close.sseDone modifiers', async () => {
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
        dmAct(btn, 'data-m-get^open.sseOn^close.sseDone@.click', "'/mock/lc2'")
        __fireEventSub(btn, 'click')
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
        dmAct(btn, 'data-m-get^abort.cancelFn@.click', "'/mock/long'")
        __fireEventSub(btn, 'click')
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
    // ---- missing utility function tests ----
    __assert(isDigitsOnly, ['0'], true, 'isDigitsOnly single zero')
    __assert(isDigitsOnly, ['123'], true, 'isDigitsOnly multi-digit')
    __assert(isDigitsOnly, ['0x1'], false, 'isDigitsOnly hex prefix rejected')
    __assert(isDigitsOnly, [''], false, 'isDigitsOnly empty string rejected')
    __assert(isDigitsOnly, [' '], false, 'isDigitsOnly space rejected')
    __assert(isDigitsOnly, [null], false, 'isDigitsOnly null rejected')
    __assert(samePath, [['a', 'b'], ['a', 'b']], true, 'samePath equal arrays')
    __assert(samePath, [['a', 'b'], ['a', 'c']], false, 'samePath different last element')
    __assert(samePath, [['a'], ['a', 'b']], false, 'samePath different lengths')
    __assert(samePath, [[], []], true, 'samePath both empty')
    __assert(pickMods, [[], ['fallback']], ['fallback'], 'pickMods uses fallback when local empty')
    __assert(pickMods, [['local'], ['fallback']], ['local'], 'pickMods uses local when non-empty')
    __assert(pickMods, [[], []], [], 'pickMods both empty returns empty')
    __assert(isPlainObj, [{}], true, 'isPlainObj plain object')
    __assert(isPlainObj, [{ a: 1 }], true, 'isPlainObj object with prop')
    __assert(isPlainObj, [[]], false, 'isPlainObj array rejected')
    __assert(isPlainObj, [null], false, 'isPlainObj null rejected')
    __assert(isPlainObj, [42], false, 'isPlainObj number rejected')
    __assert(hasOwn, [{ a: 1 }, 'a'], true, 'hasOwn own property')
    __assert(hasOwn, [{ a: 1 }, 'b'], false, 'hasOwn missing property')
    __assert(hasOwn, [Object.create({ inherited: 1 }), 'inherited'], false, 'hasOwn does not see inherited props')
    __assert(() => { const o = cloneOwnProps({ a: 1, b: 2 }); return { a: o.a, b: o.b, proto: Object.getPrototypeOf(o) } }, [],
      { a: 1, b: 2, proto: null }, 'cloneOwnProps copies own props, null prototype')
    __assert(() => { const src = Object.create({ inherited: 9 }); src.own = 7; const o = cloneOwnProps(src); return { own: o.own, hasInherited: 'inherited' in o } }, [],
      { own: 7, hasInherited: false }, 'cloneOwnProps does not copy inherited props')
    __assert(() => ({ ...mergeActHs(null, null) }), [], {}, 'mergeActHs both null returns empty')
    __assert(() => ({ ...mergeActHs(null, { accept: 'text/plain' }) }), [], { accept: 'text/plain' }, 'mergeActHs null base returns extra')
    __assert(() => ({ ...mergeActHs({ accept: 'text/html' }, null) }), [], { accept: 'text/html' }, 'mergeActHs null extra returns base')
    __assert(() => ({ ...mergeActHs({ accept: 'text/html', 'content-type': 'text/html' }, { accept: 'application/json' }) }), [],
      { accept: 'application/json', 'content-type': 'text/html' }, 'mergeActHs extra overrides base')
    __assert(mergeActVals, [1, 2], 2, 'mergeActVals scalars returns next')
    __assert(mergeActVals, [[1, 2], [3, 4]], [1, 2, 3, 4], 'mergeActVals arrays concatenated')
    __assert(mergeActVals, [{ a: 1 }, { b: 2 }], { a: 1, b: 2 }, 'mergeActVals plain objects merged')
    __assert(mergeActVals, [{ a: 1, c: { x: 1 } }, { c: { y: 2 } }], { a: 1, c: { x: 1, y: 2 } }, 'mergeActVals deep merge nested objects')
    __assert(mergeActVals, [{ a: 1 }, [1, 2]], [1, 2], 'mergeActVals object+array returns next')
    __assert(combineActResult, [1, 2, 'replace'], 2, 'combineActResult replace returns next')
    __assert(combineActResult, [[1], [2], 'merge'], [1, 2], 'combineActResult merge arrays')
    __assert(combineActResult, ['hello ', 'world', 'append'], 'hello world', 'combineActResult append strings')
    __assert(combineActResult, ['world', 'hello ', 'prepend'], 'hello world', 'combineActResult prepend strings')
    __assert(combineActResult, [[2, 3], [1], 'prepend'], [1, 2, 3], 'combineActResult prepend arrays reversed')
    __assert(getSimpleIdSelector, [''], null, 'getSimpleIdSelector empty string is null')
    __assert(getSimpleIdSelector, ['#foo'], 'foo', 'getSimpleIdSelector plain id')
    __assert(getSimpleIdSelector, ['#foo.bar'], null, 'getSimpleIdSelector compound selector rejected')
    __assert(getSimpleIdSelector, ['#foo bar'], null, 'getSimpleIdSelector selector with space rejected')
    __assert(getSimpleIdSelector, ['.cls'], null, 'getSimpleIdSelector class selector rejected')
    __assert(getSimpleIdSelector, ['#'], null, 'getSimpleIdSelector bare hash rejected')
    __assert(applyJsonMergePatch, [{ a: 1 }, { b: 2 }], { a: 1, b: 2 }, 'applyJsonMergePatch merges new key')
    __assert(applyJsonMergePatch, [{ a: 1, b: 2 }, { a: 99 }], { a: 99, b: 2 }, 'applyJsonMergePatch updates existing key')
    __assert(applyJsonMergePatch, [{ a: 1, b: 2 }, { b: null }], { a: 1 }, 'applyJsonMergePatch null removes key')
    __assert(applyJsonMergePatch, [null, 42], 42, 'applyJsonMergePatch non-object patch replaces prev')
    __assert(applyJsonMergePatch, [{ a: 1 }, null], JSON_MERGE_DELETE, 'applyJsonMergePatch null patch returns delete sentinel')
    __assert(applyJsonMergePatch, [{ a: { x: 1 } }, { a: { y: 2 } }], { a: { x: 1, y: 2 } }, 'applyJsonMergePatch deep merge')
    // ---- dmAct ^html response modes ----
    __asyncAssert('^html default (outer) morphs element matched by id in response', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<div id="html-outer-target"><span>old</span></div>'
      document.body.appendChild(container)
      try {
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<div id="html-outer-target"><span>new</span></div>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        return { actual: container.querySelector('#html-outer-target span')?.textContent, expected: 'new' }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^replace replaces element by id (no morph)', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<p id="html-replace-target">old</p>'
      document.body.appendChild(container)
      try {
        const origEl = container.querySelector('#html-replace-target')
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<p id="html-replace-target">new</p>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html^replace@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        const newEl = container.querySelector('#html-replace-target')
        return { actual: { text: newEl?.textContent, replaced: newEl !== origEl }, expected: { text: 'new', replaced: true } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^inner morphs children only by id in response', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<section id="html-inner-target"><b>old</b></section>'
      document.body.appendChild(container)
      try {
        const origEl = container.querySelector('#html-inner-target')
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<section id="html-inner-target"><em>new</em></section>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html^inner@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        const el = container.querySelector('#html-inner-target')
        return { actual: { sameNode: el === origEl, child: el?.querySelector('em')?.textContent }, expected: { sameNode: true, child: 'new' } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^remove removes element by id from response', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<div id="html-remove-target">bye</div><div id="html-remove-keep">keep</div>'
      document.body.appendChild(container)
      try {
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<div id="html-remove-target"></div>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html^remove@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        return { actual: { removed: !container.querySelector('#html-remove-target'), kept: !!container.querySelector('#html-remove-keep') }, expected: { removed: true, kept: true } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^before inserts HTML before the action element', async () => {
      __reset()
      const container = document.createElement('div')
      const anchor = document.createElement('button')
      anchor.id = 'html-before-anchor'
      container.appendChild(anchor)
      document.body.appendChild(container)
      try {
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<span class="inserted-before">inserted</span>' })
        dmAct(anchor, 'data-m-get^html^before@.click', "'/mock/html'")
        __fireEventSub(anchor, 'click')
        await new Promise(r => setTimeout(r, 0))
        const children = Array.from(container.children)
        return { actual: { insertedFirst: children[0]?.classList.contains('inserted-before'), anchorSecond: children[1] === anchor }, expected: { insertedFirst: true, anchorSecond: true } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^after inserts HTML after the action element', async () => {
      __reset()
      const container = document.createElement('div')
      const anchor = document.createElement('button')
      anchor.id = 'html-after-anchor'
      container.appendChild(anchor)
      document.body.appendChild(container)
      try {
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<span class="inserted-after">inserted</span>' })
        dmAct(anchor, 'data-m-get^html^after@.click', "'/mock/html'")
        __fireEventSub(anchor, 'click')
        await new Promise(r => setTimeout(r, 0))
        const children = Array.from(container.children)
        return { actual: { anchorFirst: children[0] === anchor, insertedSecond: children[1]?.classList.contains('inserted-after') }, expected: { anchorFirst: true, insertedSecond: true } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^before.sig inserts HTML before signal-specified selector target', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<span id="html-before-sig-target">target</span>'
      document.body.appendChild(container)
      try {
        _dm.set('insertTarget', '#html-before-sig-target')
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<em class="sig-before">sig-before</em>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html^before.insert-target@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        const children = Array.from(container.children)
        return { actual: { insertedFirst: children[0]?.classList.contains('sig-before'), targetSecond: children[1]?.id === 'html-before-sig-target' }, expected: { insertedFirst: true, targetSecond: true } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^after.sig inserts HTML after signal-specified selector target', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<span id="html-after-sig-target">target</span>'
      document.body.appendChild(container)
      try {
        _dm.set('insertTarget', '#html-after-sig-target')
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<em class="sig-after">sig-after</em>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html^after.insert-target@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        const children = Array.from(container.children)
        return { actual: { targetFirst: children[0]?.id === 'html-after-sig-target', insertedSecond: children[1]?.classList.contains('sig-after') }, expected: { targetFirst: true, insertedSecond: true } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^append.sig appends HTML inside signal-specified selector target', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<ul id="html-append-list"><li>existing</li></ul>'
      document.body.appendChild(container)
      try {
        _dm.set('listTarget', '#html-append-list')
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<li class="appended">new item</li>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html^append.list-target@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        const list = container.querySelector('#html-append-list')
        const items = list ? Array.from(list.children) : []
        return { actual: { count: items.length, lastIsNew: items[items.length - 1]?.classList.contains('appended') }, expected: { count: 2, lastIsNew: true } }
      } finally { delete window.fetch; container.remove() }
    })
    __asyncAssert('^html^prepend.sig prepends HTML inside signal-specified selector target', async () => {
      __reset()
      const container = document.createElement('div')
      container.innerHTML = '<ul id="html-prepend-list"><li>existing</li></ul>'
      document.body.appendChild(container)
      try {
        _dm.set('listTarget', '#html-prepend-list')
        window.fetch = () => Promise.resolve({ ok: true, headers: { get: () => 'text/html' }, text: async () => '<li class="prepended">new item</li>' })
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        dmAct(btn, 'data-m-get^html^prepend.list-target@.click', "'/mock/html'")
        __fireEventSub(btn, 'click')
        await new Promise(r => setTimeout(r, 0))
        btn.remove()
        const list = container.querySelector('#html-prepend-list')
        const items = list ? Array.from(list.children) : []
        return { actual: { count: items.length, firstIsNew: items[0]?.classList.contains('prepended') }, expected: { count: 2, firstIsNew: true } }
      } finally { delete window.fetch; container.remove() }
    })
  const __finishAssertSuite = () => {
    __restoreAssertState()
    window.dispatchEvent(new CustomEvent('dmax:tests:done'))
  }
  _asyncChain.then(__finishAssertSuite, __finishAssertSuite)
})()
