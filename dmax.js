    // @js-check
    //-------------test code-------------------
    stableStringify = (val) => {
      if (Array.isArray(val)) return `[${val.map(stableStringify).join(',')}]`;
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        return `{${Object.keys(val).sort().map(key => `${JSON.stringify(key)}:${stableStringify(val[key])}`).join(',')}}`;
      }
      return JSON.stringify(val);
    };
    deepEqual = (a, b) => {
      if (a === b) return true;
      const aObj = a && typeof a === 'object';
      const bObj = b && typeof b === 'object';
      if (!aObj && !bObj) return Object.is(a, b);
      return stableStringify(a) === stableStringify(b);
    };
    fmt = (val) => (typeof val === 'string' ? `'${val}'` : stableStringify(val));
    __assert = (fn, args, expected, label) => {
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

    //------- lib code starts here-------------
    // Returns the index of the first found char (from chars) in the s, or -1 if none found,
    // then you can check s[returnedIndex] to see which char it is.

    function indexFirst(s, chars, pos = 0) {
      let i, first = s.length
      for (let c of chars) if ((i = s.indexOf(c, pos)) != -1 && i < first) first = i
      return first === s.length ? -1 : first
    }

    __assert(indexFirst, ['abcdefg', ['x', 'y', 'z']], -1, 'none found');
    __assert(indexFirst, ['abcdefg', ['x', 'c', 'z']], 2, 'one found');
    __assert(indexFirst, ['abcdefgabc', ['a', 'b', 'c'], 3], 7, 'multiple found with pos');
    __assert(indexFirst, ['abcdefg', ['a'], 10], -1, 'pos out of range');

    const CAMEL_NAMES = new Map()
    function kebabToCamel(s) {
      if (!s) return s
      let p = s.indexOf('-')
      if (p < 0) return s
      let res = CAMEL_NAMES.get(s)
      if (res) return res
      res = s.slice(0, p)
      while (p >= 0 && ++p < s.length) {
        if (s[p] == '-') continue;
        res += s[p].toUpperCase()
        if (++p < s.length)
          res += s.slice(p, (p = s.indexOf('-', p)) == -1 ? s.length : p)
      }
      CAMEL_NAMES.set(s, res)
      return res
    }

    __assert(kebabToCamel, ['foo-bar'], 'fooBar', 'basic case');
    __assert(kebabToCamel, ['-bar'], 'Bar', 'lead single');
    __assert(kebabToCamel, ['bar-'], 'bar', 'trail single');
    __assert(kebabToCamel, ['multi-part-key'], 'multiPartKey', 'multi part');
    __assert(kebabToCamel, ['-'], '', 'single dash');
    __assert(kebabToCamel, ['--'], '', 'multi dashes only');
    __assert(kebabToCamel, ['--leading--dashes'], 'LeadingDashes', 'leading dashes');
    __assert(kebabToCamel, ['trailing--dashes-'], 'trailingDashes', 'trailing dashes');

    // Updated attribute-token syntax reference
    // data-dump@foo-bar-signal+#tpl-id instead of data-dump@foo-bar-signal#tpl-id
    // data-class+zebra-even+!zebra-odd instead of data-class:+zebra-even:~zebra-odd
    // Use ^ for modifiers (trigger guards/timing/options): data-get^no-cache:posts^replace+user.name^query.username
    const MOD = '^', TARG = ':', TRIG = '@', ADD = '+'
    const ALL = [MOD, TARG, TRIG, ADD]
    const MODS = [MOD]

    const DOT = '.', ID = '#', NOT = '!'
    const NAME_DELIMS = [DOT] //'[', ']' // @wip parse brackets later
    const SIGNAL = 's', EV_PROP = DOT, SPECIAL = '_'

    // Applied only to the signals!
    const MOD_WITH_SHAPE = 'with_shape', MOD_SHAPE_ONLY = 'shape_only'

    const SPEC_WIN = 'window'; SPEC_DOC = 'document'; SPEC_FORM = 'form'; SPEC_INTERVAL = 'interval'; SPEC_TIMEOUT = 'timeout'
    const SPECIALS = [SPEC_WIN, SPEC_DOC, SPEC_FORM, SPEC_INTERVAL, SPEC_TIMEOUT]
    const SPEC_WIN_EV = 'resize', SPEC_DOC_EV = 'visibilitychange', SPEC_INTERVAL_MS = 500, SPEC_TIMEOUT_MS = 500

    function isSpecial(n) {
      if (n.startsWith(SPECIAL)) for (const s of SPECIALS) { if (n.startsWith(s, 1)) return true }
      return false
    }

    const _KIND = [MOD, SIGNAL, EV_PROP, SPECIAL]
    // Returns {kind:_KIND, not:null|bool, root:null|name, path:null|[...names] } or null for invalid item
    function parseItem(aName, type, n, pos = 0) {
      if (!n) return null

      let p = pos
      while (n.startsWith(NOT, p)) ++p
      let not = p == 0 ? null : p % 2 != 0

      let d = n.indexOf(DOT, p)
      let root = d < 0 ? (p == 0 ? n : n.slice(p)) : n.slice(p, d)

      if (type === MOD) {
        if (root) root = kebabToCamel(root)
        if (!root) { console.error('[dmax] Error: Mod name should not be empty for:', n, 'in:', aName); return null }
        if (d < 0 || d + 1 >= n.length) return { kind: MOD, not, root, path: null } // accepts trailing dot in ^mod-foo.
        let val = n.indexOf(DOT, p = d + 1) < 0 ? kebabToCamel(n.slice(p)) : parseItem(aName, TRIG, n, p) // recurse for mod val being a signal
        return { kind: MOD, root, not, path: val }
      }

      let kind = EV_PROP
      if (root && root.length > 0) {
        const id = root[0] === ID
        if (id || isSpecial(root)) {
          kind = id ? EV_PROP : SPECIAL
          root = root.slice(1)
          if (!root) { console.error('[dmax] Error: The', kind, 'element should have a non empty name:', n, 'in:', aName); return null }
        } else {
          kind = SIGNAL
          root = kebabToCamel(root)
        }
      }

      if (d < 0 && !root && not !== null) { console.error('[dmax] Error: The', kind, 'element should not have just', NOT, 'alone in:', n); return null }
      if (d < 0 || d + 1 == n.length) return { kind, not, root, path: null }

      p = d + 1
      let path = []
      while (p >= 0 && p < n.length) {
        d = n.indexOf(DOT, p)
        const part = n.slice(p, p = d < 0 ? n.length : d)
        if (!part) { console.error('[dmax] Error: Path should not have an empty part:', n, 'in:', aName); return null }
        path.push(kebabToCamel(part))
        ++p
      }
      return { kind, not, root, path }
    }

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

    // parse() invariants: empty mods -> null
    function parse(aName, p = 'data-'.length, it = ALL) {
      let items = {}, modItems = null
      while (p >= 0 && p < aName.length) {
        if ((p = indexFirst(aName, it, p)) == -1) { p = aName.length; break }
        let t = aName[p], item = null
        if (++p < aName.length) {
          let end = indexFirst(aName, ALL, p)
          let name = aName.slice(p, p = end != -1 ? end : aName.length)
          if (name) item = parseItem(aName, t, name)
        }

        if (!item) continue // skip null/errors, avoid later null checks

        let ts = items[t] ??= []
        if (t == MOD) {
          ts.push(item);
          if (p >= aName.length || (it === MODS && aName[p] != MOD)) return [items, p]
        } else if (p >= aName.length || aName[p] != MOD) {
          item.mods = items[MOD] ?? null // set to glob mods if any
          ts.push(item);
        } else {
          [modItems, p] = parse(aName, p, MODS)
          let mods = modItems?.[MOD] ?? null
          if (items[MOD]) mods = mods ? mods.concat(items[MOD]) : items[MOD].slice()
          item.mods = mods
          ts.push(item)
        }
      }
      if (p < aName.length) console.warn('[dmax] Warning: Not everything is parsed "', aName.slice(p), '" in', aName)
      return [items, p]
    }

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

    function isObjEmpty(o) {
      for (const _ in o) return false
      return true
    }

    const RETURN_THEN = [' ', '(', '{', ';', '[', '"', '\'', '\n', '\r', '\t']

    // args available in right data-attr value expression, `trig` maybe null for no triggers or any of the _KIND except MOD
    const FN_ARGS = ['dm', 'el', 'trig', 'val', 'detail']

    function compileFn(aVal, aName, args = FN_ARGS) {
      let val = '' + aVal
      var r = val.indexOf('return')
      let body = r != -1 && (r + 6 >= val.length || indexFirst(val, RETURN_THEN, r + 6) == r + 6) ? val : `return(${val})`
      body = `try{ ${body} }catch(e){ console.error('[dmax] Error: eval ${aName} value as function:', e.message, '>>>', ${val}); return }`
      let fn;
      try { fn = Function(...args, body) }
      catch (e) { console.error(`Error compiling ${aName} value to function:`, e.message, '>>>', val); return }
      return fn;
    }

    const _dm = new Map()
    const DM = new Proxy({}, {
      get: (_, key) => _dm.get(key),
      set: (_, key, val) => { _dm.set(key, val); return true; },
      has: (_, key) => _dm.has(key),
      ownKeys: () => Array.from(_dm.keys()),
      getOwnPropertyDescriptor: (_, key) =>
        _dm.has(key) ? { value: _dm.get(key), enumerable: true, configurable: true } : undefined
    });

    // - data-def='{foo: {bar: "hey"}, baz: 1}' // top level fields to signals
    // - data-def:foo='{bar: "hey"}' // foo signal
    // - data-def:foo:baz='`js expr ${42}`' // eval expr as Function body and set to all signals
    // - data-def:foo='el.Value * dm.bar' // you may use other signals and element props
    function dDef(el, aName, aVal) {
      let [it, _p] = parse(aName)
      let tars = it[TARG]
      delete it[TARG]
      if (!isObjEmpty(it)) console.warn('[dmax] Warning: Supports only targets but found more:', aName)
      let fn = compileFn(aVal, aName)
      if (!fn) return
      let val = aVal ? fn(DM, el, null) : null
      if (tars) {
        for (const t of tars) {
          if (t.kind != SIGNAL) { console.error('[dmax] Error: Only signal targets are supported but found:', t, 'in', aName); continue }
          if (t.mods) console.warn('[dmax] Warning: Mods are not supported:', mods, 'in', aName);
          _dm.set(t.root, val)
        }
      } else if (val && typeof val === 'object') {
        for (const t in val)
          _dm.set(kebabToCamel(t), val[t])
      } else {
        console.error('[dmax] Error: Attribute', aName, 'value should contain object with signal fields, but found', aVal)
      }
    }

    const __sign = (nam, val) => { _dm.clear(); dDef(null, nam, val); return DM };
    const __signEl = (el, nam, val) => { _dm.clear(); dDef(el, nam, val); return DM };
    const __signDmSet = (k, v, nam, val) => { _dm.clear(); DM[k] = v; dDef(null, nam, val); return DM };
    __assert(__sign, ['data-def', '{foo: {bar: "hey"}, baz: 1}'], { "baz": 1, "foo": { "bar": "hey" } }, '2 value signals')
    __assert(__sign, ['data-def:foo', '{bar: "hey"}'], { "foo": { "bar": "hey" } }, 'signal = value')
    __assert(__sign, ['data-def:foo-bar:baz'], { "baz": null, "fooBar": null }, 'signals')
    __assert(__sign, ['data-def:foo-bar:baz', '`Mamma Mia ${42}`'], { "baz": "Mamma Mia 42", "fooBar": "Mamma Mia 42" }, 'bonkers')

    __assert(__signEl, [{ "name": "John" }, 'data-def:foo', '"Hey, " + el.name'], { "foo": "Hey, John" }, 'using el')
    __assert(__signDmSet, ['name', 'Noize', 'data-def:greet', '"Hey, " + dm.name'], { "name": "Noize", "greet": `Hey, Noize` }, 'using dm')

    function dDebug(el) {
      if (!el) return
      _debugEls.add(el)
      updateDebug()
    }

    function getElById(id, aName) {
      if (!id) return null
      const el = document.getElementById(id)
      if (!el) console.error(`[dmax] Error: element #${id} from ${aName} is not found`)
      return el;
    };

    const __getElById = (id, aName) => getElById(id, aName)?.textContent ?? null;

    __assert(__getElById, ['foo', 'data-sub:#foo@bar'], 'good', 'get existing elem')

    function getDefaultProp(el) {
      if (!el) return 'textContent'
      const t = el.type, n = el.tagName
      return t === 'checkbox' || t === 'radio' ? 'checked' : n === 'INPUT' || n === 'SELECT' || n === 'TEXTAREA' ? 'value' : 'textContent'
    }

    function getDefaultEvent(el) {
      if (!el) return 'click'
      let n = el.tagName
      return n === 'FORM' ? 'submit' : n === 'INPUT' || n === 'SELECT' || n === 'TEXTAREA' ? 'change' : 'click'
    }

    function getElPropVal(targetEl, propPath) {
      const prop = propPath && propPath.length ? propPath[0] : getDefaultProp(targetEl)
      let val = prop === 'checked' ? targetEl.checked : (prop === 'value' ? targetEl.value : targetEl.textContent)
      return propPath && propPath.length > 1 ? getPropValAndDepth(val, propPath.slice(1))[0] : val
    }

    function mkEv(nam) {
      try { return new Event(nam, { bubbles: true }) }
      catch (_) {
        const ev = document.createEvent('Event')
        ev.initEvent(nam, true, true)
        return ev
      }
    }

    function isNil(v) { return v === null || v === undefined }

    function getPropValAndDepth(obj, path, depth = -1) {
      let v = obj
      if (isNil(v) || !path) return [v, 0]
      let n = depth == -1 || depth > path.length ? path.length : depth
      for (let i = 0; i < n; ++i) if (isNil(v = v[path[i]])) return [v, i + 1]
      return [v, n]
    }

    __assert(getPropValAndDepth, [getElById('foo', 'xxx'), ['textContent']], ['good', 1], 'depth 1')
    __assert(getPropValAndDepth, [{ foo: { bar: { baz: 42 } } }, ['foo', 'bar', 'baz']], [42, 3], '42')
    __assert(getPropValAndDepth, [{ foo: { bar: null } }, ['foo', 'bar', 'baz']], [null, 2], 'null')

    const VAL_CHANGE_DEPTH_MAX = 32
    function valChangedDeep(before, after, depth = 0) {
      if (depth >= VAL_CHANGE_DEPTH_MAX) { console.warn('[dmax] Warning: too deep to compare for signal value change, consider it changed, stopped at:', VAL_CHANGE_DEPTH_MAX); return true }
      const b = before, a = after
      if (Array.isArray(b)) { // means b is also an array
        if (!Array.isArray(a) || b.length != a.length) return true
        for (let i = 0; i < b.length; ++i) if (valChangedDeep(b[i], a[i], ++depth)) return true
      } else if (b && typeof b === 'object') {
        if (!a || typeof a !== 'object') return true
        for (const k in b) {
          if (!(k in a)) return true
          if (valChangedDeep(b[k], a[k], ++depth)) return true
        }
        for (const k in a) if (!(k in b)) return true
      } else if (a !== b) return true
      return false
    }

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

    function expected(cond, ctx = 'expect') {
      if (cond) return true
      console.error('[dmax] Unexpected condition in:', ctx)
      return false
    }

    function setProp(el, aName, tar, val) {
      if (!expected(tar.kind === EV_PROP)) return null;
      let obj = tar.root ? getElById(tar.root, aName) : el
      let path = tar.path, prop = null
      if (!path)
        prop = getDefaultProp(el);
      else if (path.length > 0) {
        [obj, _] = getPropValAndDepth(obj, path, path.length - 1)
        prop = path[path.length - 1]
      }
      if (!obj || !prop) { console.error('[dmax] Error setting non existing property for: ', tar, 'in', aName); return }
      try {
        if (valChangedDeep(obj[prop], val)) obj[prop] = val;
      } catch (e) {
        console.error('[dmax] Error: Failed to set property:', e.message, '>>>', tar, 'on', el);
      }
      return obj[prop]
    }

    __assert(setProp, [{ value: 'Answer42' }, 'data-eval:.', { kind: EV_PROP, not: null, root: "", path: null }, 'Seaman!'],
      'Seaman!', 'default prop')
    __assert(setProp, [null, 'data-eval:#foo.', { kind: EV_PROP, not: null, root: 'foo', path: null }, 'Seaman!'],
      'Seaman!', '#foo default prop')
    __assert(setProp, [null, 'data-eval:#foo.style.color', { kind: EV_PROP, not: null, root: 'foo', path: ['style', 'color'] }, 'lime'],
      'lime', '#foo nested prop')
    __assert(setProp, [null, 'data-eval:foo', { kind: SIGNAL, not: null, root: 'foo', path: ['style', 'color'] }, 'lime'],
      null, 'unexpected signal')

    const EMPTY_ARR = Object.freeze([])
    const getComputedDisplay = (el) => (typeof window !== 'undefined' && window.getComputedStyle) ? window.getComputedStyle(el).display : ''

    function diffShapeShallow(before, after) {
      let b = before, a = after
      if (!b || typeof b != 'object') b = EMPTY_ARR
      if (!a || typeof a != 'object') a = EMPTY_ARR

      if (Array.isArray(b)) {
        if (Array.isArray(a))
          return a.length == b.length ? null : a.length > b.length
            ? { addedRange: [b.length, a.length - b.length] }
            : { removedRange: [a.length, b.length - a.length] }
        return { added: Object.keys(a), removedRange: [0, b.length] }
      }

      if (Array.isArray(a))
        return { removed: Object.keys(b), addedRange: [0, a.length] }

      // Shallow object key shape diff: track added/removed keys only
      let added = [], removed = []
      for (const k in a) if (!(k in b)) added.push(k)
      for (const k in b) if (!(k in a)) removed.push(k)
      return added.length ? (removed.length ? { added, removed } : { added }) : (removed.length ? { removed } : null)
    }

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

    function samePath(a, b) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; ++i)
        if (a[i] !== b[i]) return false
      return true
    }

    const SG_CHANGED_ANY = 0, SG_CHANGED_WITH_SHAPE = 1, SG_CHANGED_SHAPE_ONLY = 2
    function getSgChangeShape(mods) {
      for (const m of mods || EMPTY_ARR) {
        if (m.root === MOD_WITH_SHAPE) return SG_CHANGED_WITH_SHAPE
        if (m.root === MOD_SHAPE_ONLY) return SG_CHANGED_SHAPE_ONLY
      }
      return SG_CHANGED_ANY
    }

    const MOD_IMMEDIATE = 'immediate', MOD_NOTIMMEDIATE = 'notimmediate'
    const MOD_JSON = 'json'
    const MOD_TEXT = 'text'
    const MOD_FORM = 'form'
    const MOD_BUSY = 'busy'
    const MOD_COMPLETE = 'complete'
    const MOD_ERR = 'err'
    const MOD_CODE = 'code'
    const MOD_NO_CACHE = 'noCache'
    const MOD_HEADERS = 'headers'
    const MOD_BROTLI = 'brotli'
    const MOD_BR = 'br'
    const MOD_GZIP = 'gzip'
    const MOD_DEFLATE = 'deflate'
    const MOD_COMPRESS = 'compress'
    const MOD_REPLACE = 'replace'
    const MOD_MERGE = 'merge'
    const MOD_APPEND = 'append'
    const MOD_PREPEND = 'prepend'
    const MOD_SSE_OPEN = 'open'
    const MOD_SSE_CLOSE = 'close'
    const MOD_RETRY = 'retry'
    const MOD_ABORT = 'abort'
    const MOD_URL = 'url'
    const MOD_BODY = 'body'
    const MOD_HDR = 'header'
    function isImmediateMod(mods, defaultVal) {
      for (const m of mods || EMPTY_ARR) {
        if (m.root === MOD_IMMEDIATE) return true
        if (m.root === MOD_NOTIMMEDIATE) return false;
      }
      return defaultVal;
    }

    const MOD_ONCE = 'once'
    const MOD_ALWAYS = 'always'
    const MOD_DEBOUNCE = 'debounce'
    const MOD_THROTTLE = 'throttle'
    const MOD_PREVENT = 'prevent'
    const MOD_AND = 'and'
    const MOD_EQ = 'eq'
    const MOD_NE = 'ne'
    const MOD_LT = 'lt'
    const MOD_GT = 'gt'
    const MOD_LE = 'le'
    const MOD_GE = 'ge'
    const PERMIT_MODS = Object.assign(Object.create(null), {
      [MOD_AND]: 1, [MOD_EQ]: 1, [MOD_NE]: 1, [MOD_LT]: 1, [MOD_GT]: 1, [MOD_LE]: 1, [MOD_GE]: 1
    })

    function getSignalValOrIt(it) {
      if (!it.kind) return it
      const sg = _dm.get(it.root)
      const path = it.path
      const val = path && path.length ? getPropValAndDepth(sg, path)[0] : sg
      return it.not ? !val : val
    }

    // Resolve modifier path values: raw value, direct signal key, or parseable trigger-like signal path.
    function resolveModPathVal(v) {
      if (v && v.kind) return getSignalValOrIt(v)
      if (typeof v !== 'string') return v
      if (_dm.has(v)) return _dm.get(v)
      const parsed = parseItem('mod', TRIG, v)
      return parsed && parsed.kind
        ? (parsed.kind === SIGNAL && !parsed.path && !_dm.has(parsed.root) ? v : getSignalValOrIt(parsed))
        : v
    }

    function resolveStatusSignal(mod, fallbackRoot) {
      if (!mod) return null
      const p = mod.path
      if (typeof p === 'string') return { kind: SIGNAL, not: null, root: p || fallbackRoot, path: null }
      if (p && p.kind === SIGNAL) return p
      return { kind: SIGNAL, not: null, root: fallbackRoot, path: null }
    }

    function isJsonContentType(ct) {
      const low = String(ct || '').toLowerCase()
      if (low.indexOf('application/json') !== -1) return true
      const p = low.indexOf('+json')
      if (p < 0) return false
      const end = p + 5
      if (end >= low.length) return true
      const c = low[end]
      return c === ';' || c === ' ' || c === '\t'
    }

    function isTextLikeContentType(ct) {
      const low = String(ct || '').toLowerCase()
      if (low.indexOf('text/') !== -1) return true
      if (low.indexOf('application/xml') !== -1) return true
      if (low.indexOf('application/xhtml+xml') !== -1) return true
      if (low.indexOf('application/x-www-form-urlencoded') !== -1) return true
      if (low.indexOf('application/javascript') !== -1) return true
      return false
    }
    __assert(isJsonContentType, ['application/problem+json; charset=utf-8'], true, 'json content-type +json with semicolon')
    __assert(isJsonContentType, ['application/problem+json\tcharset=utf-8'], true, 'json content-type +json with tab separator')
    __assert(isJsonContentType, ['application/problem+jsonified'], false, 'json content-type +json boundary check')

    function isPlainObj(val) {
      return !!val && typeof val === 'object' && !Array.isArray(val)
    }

    function hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key)
    }

    function mergeActionVals(prev, next) {
      if (Array.isArray(prev) && Array.isArray(next)) return prev.concat(next)
      if (!isPlainObj(prev) || !isPlainObj(next)) return next
      const out = Object.create(null)
      for (const k in prev) if (hasOwn(prev, k)) out[k] = prev[k]
      for (const k in next) if (hasOwn(next, k)) out[k] = hasOwn(out, k) ? mergeActionVals(out[k], next[k]) : next[k]
      return out
    }

    function combineActionResult(prev, next, mode) {
      if (mode === MOD_MERGE) return mergeActionVals(prev, next)
      if (mode === MOD_APPEND) {
        if (Array.isArray(prev) && Array.isArray(next)) return prev.concat(next)
        if (typeof prev === 'string' || typeof next === 'string') return String(prev ?? '') + String(next ?? '')
        return next
      }
      if (mode === MOD_PREPEND) {
        if (Array.isArray(prev) && Array.isArray(next)) return next.concat(prev)
        if (typeof prev === 'string' || typeof next === 'string') return String(next ?? '') + String(prev ?? '')
        return next
      }
      return next
    }

    function applyActionPayload(aName, resultTar, payload, resultMode) {
      if (!resultTar) return
      const isAllTarget = resultTar.kind === SIGNAL && resultTar.root === '_all' && !resultTar.path
      if (isAllTarget) {
        if (Array.isArray(payload)) {
          setSignalAndNotifySubsNLevelsDeep(aName, { kind: SIGNAL, not: null, root: '_arr', path: null }, payload)
          return
        }
        if (!payload || typeof payload !== 'object') return
        for (const key in payload) {
          if (!hasOwn(payload, key)) continue
          // :_all target unpacks payload object fields into root signals; normalize keys to mirror attribute parser naming
          // so kebab-case fields (e.g. foo-bar) map to the same camelCase signal names used elsewhere in dmax.
          const root = kebabToCamel(key)
          const prev = _dm.get(root)
          setSignalAndNotifySubsNLevelsDeep(aName, { kind: SIGNAL, not: null, root, path: null }, combineActionResult(prev, payload[key], resultMode))
        }
        return
      }
      const prev = getSignalValOrIt(resultTar)
      setSignalAndNotifySubsNLevelsDeep(aName, resultTar, combineActionResult(prev, payload, resultMode))
    }

    function modsPermitVal(mods, val) {
      for (const m of mods || EMPTY_ARR) {
        const mName = m.root, mVal = resolveModPathVal(m.path)
        if (mName === MOD_AND) {
          const ok = !!mVal
          if (m.not ? ok : !ok) return false
        } else if (mName == MOD_EQ) {
          if (val != mVal) return false
        } else if (mName == MOD_NE) {
          if (val == mVal) return false
        } else if (mName == MOD_GT) {
          if (+val <= +mVal) return false
        } else if (mName == MOD_LT) {
          if (+val >= +mVal) return false
        } else if (mName == MOD_GE) {
          if (+val < +mVal) return false
        } else if (mName == MOD_LE) {
          if (+val > +mVal) return false
        }
      }
      return true
    }

    const _subs = new Map()
    const _debugEls = new Set()
    let _debugQueued = false
    function updateDebug() {
      if (!_debugEls.size || _debugQueued) return
      _debugQueued = true
      queueMicrotask(() => {
        _debugQueued = false
        const state = {}
        for (const [k, v] of _dm.entries()) state[k] = v
        const txt = JSON.stringify(state, null, 2)
        for (const el of _debugEls) el.textContent = txt
      })
    }

    // If sg not exist in the _dm, then we will create it -> creating missing target on demand
    function _setSignalAndNotifySubs(aName, tar, val) {
      if (!expected(tar)) return null

      const root = tar.root, path = tar.path
      if (!expected(root)) return null

      let sgVal = _dm.get(root), curVal = sgVal, parent = sgVal, d = 0, last = null
      if (path) {
        if (!expected(path.length)) return null;
        [parent, d] = getPropValAndDepth(parent, path, path.length - 1)
        if (!parent) { console.error('[dmax] Error: cannot set value to missing signal parent at:', root, 'at path:', path, 'at index:', d - 1, 'in:', aName); return }
        curVal = parent[last = path[d]]
      }

      // if change detected it means ALL parents of cur  and SOME of children changed
      if (!valChangedDeep(curVal, val)) return;

      const handlers = _subs.get(root);
      if (!handlers) {
        if (!path) _dm.set(root, val)
        else parent[last] = val
        return
      }

      // we need to change the value and THEN notify, so to avoid value preservation lets collect the handlers with changes first
      let collected = [], diffed = false, diff = null, pathDiffs = []
      for (const h of handlers) { // h.fn, h.changeMod, h.path
        const hp = h.path, changeMod = h.changeMod
        if (!hp) {
          if (!path && !diffed && changeMod !== SG_CHANGED_ANY) {// compare roots if it is the first time
            diffed = true
            diff = diffShapeShallow(curVal, val)
          }
          if (path || changeMod !== SG_CHANGED_SHAPE_ONLY || diff)
            collected.push([h, path ? null : diff]) // ignore diff later for NOTIFY_SG_CHANGE
          continue
        }

        // if some path value changed - filter out the handlers diverting from the path
        if (path) {
          const notifyParent = hp.length < path.length, minLen = notifyParent ? hp.length : path.length
          let skip = false
          for (let i = 0; i < minLen; ++i) if (skip = (path[i] != hp[i])) break
          if (skip) continue
          if (notifyParent) { collected.push([h, null]); continue }
          if (path.length == hp.length) {
            if (!diffed && changeMod !== SG_CHANGED_ANY) {
              diffed = true
              diff = diffShapeShallow(curVal, val)
            }
            if (changeMod !== SG_CHANGED_SHAPE_ONLY || diff)
              collected.push([h, diff])
            continue
          }
        }

        // the hp has the longer path based on previous checks, we to check that it actually changed
        // first, check if we did this comparison before
        let hCol = null, p = null
        for (const col of collected) // check if the same
          if ((p = col[0].path) && samePath(p, hp)) { hCol = col; break }

        let [pathCur, _] = getPropValAndDepth(sgVal, hp), pathVal
        if (hCol) pathVal = hCol[2]
        else {
          [pathVal, _] = getPropValAndDepth(val, hp)
          if (!valChangedDeep(pathCur, pathVal)) continue
        }

        let pathDiffed = false, pathDiff = null
        if (changeMod != SG_CHANGED_ANY) {
          for (const pd of pathDiffs) if (samePath(pd[0], hp)) { pathDiffed = true; pathDiff = pd[1]; break }
          if (!pathDiffed) {
            pathDiff = diffShapeShallow(pathCur, pathVal)
            pathDiffs.push([hp, pathDiff])
          }
        }

        if (changeMod !== SG_CHANGED_SHAPE_ONLY || pathDiff)
          collected.push([h, pathDiff, pathVal])
      }

      if (!path) _dm.set(root, val)
      else parent[last] = val

      for (const col of collected) { // notify with new values and diff if asked for
        const h = col[0]
        h.fn(h.changeMod === SG_CHANGED_ANY ? null : col[1])
      }

      updateDebug()
    }

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

    let syncDepth = 0, MAX_SYNC_DEPTH = 32;
    function setSignalAndNotifySubsNLevelsDeep(aName, tar, val) {
      if (syncDepth++ > MAX_SYNC_DEPTH) {
        console.error(`[dmax] Error: Infinite loop detected for signal: ${tar} (depth > ${MAX_SYNC_DEPTH}) in ${aName}`)
        return
      }
      try { return _setSignalAndNotifySubs(aName, tar, val) } finally { syncDepth-- }
    }

    function applyTrigMods(fn, trig, mods) {
      const isSg = trig.kind === SIGNAL
      let one = false, always = false, prv = false
      let debMod = null, thrMod = null, permitMods = null
      for (const m of mods || EMPTY_ARR) {
        if (m.root === MOD_ONCE) one = true
        else if (m.root === MOD_ALWAYS) always = true
        else if (m.root === MOD_PREVENT) prv = true
        else if (m.root === MOD_DEBOUNCE) debMod = m
        else if (m.root === MOD_THROTTLE) thrMod = m
        else if (m.root in PERMIT_MODS) {
          if (!permitMods) permitMods = []
          permitMods.push(m)
        }
      }
      let tm = 0, last = 0

      const run = (ev, val, detail) => {
        let trigVal = (isSg ? getSignalValOrIt(trig) : val) ?? detail ?? ev?.detail?.value ?? ev?.detail?.ms
        if (isSg && trig.not) trigVal = !trigVal
        if (permitMods && !modsPermitVal(permitMods, trigVal)) return
        try { fn(ev, trigVal, detail) } catch (e) { console.error('[dmax] Error: Handler error', e) }
        if (one && !always && h.remove) h.remove() // ^always keeps handler even when ^once is also set
      }

      const h = function (ev, val, detail) {
        if (prv) ev?.preventDefault?.()
        const deb = debMod ? +(resolveModPathVal(debMod.path) ?? 0) : 0
        const thr = thrMod ? +(resolveModPathVal(thrMod.path) ?? 0) : 0
        if (deb > 0) { clearTimeout(tm); tm = setTimeout(run, deb, ev, val, detail); return }
        if (thr > 0) {
          const now = Date.now()
          if (now - last < thr) return
          last = now
        }
        run(ev, val, detail)
      }
      return h
    }

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

    _cleanupBoundSubs = new WeakMap() // Track all event boundSubs and signal handlers for cleanup
    function dSub(el, aName, aVal) {
      let [it, _p] = parse(aName)
      let tars = it[TARG], trigs = it[TRIG], globMods = it[MOD]

      delete it[TARG]; delete it[TRIG]; delete it[MOD];
      if (!isObjEmpty(it)) console.warn('[dmax] Warning: Supports only targets, triggers, mods but found more:', aName)
      if (!aVal) { console.error('[dmax] Error: in ', aName, 'it requires a value but found none', aVal); return }
      let fn = compileFn(aVal, aName)
      if (!fn) return
      if (tars) {
        const rawFn = fn
        fn = (dm, el, trig, trigVal, detail) => {
          const exprVal = rawFn(dm, el, trig, trigVal, detail)
          let failedTar = null
          try {
            for (const tar of tars) {
              failedTar = tar
              console.assert(tar.kind)
              if (tar.kind == SIGNAL) setSignalAndNotifySubsNLevelsDeep(aName, tar, exprVal)
              else setProp(el, aName, tar, exprVal)
            }
          } catch (e) { console.error('[dmax] Error: setting target', failedTar, 'in', aName, 'ended with ex:', e) }
        }
      }

      if (!trigs) {
        // immediate
        fn(DM, el, null, null, null); return
      }

      let elSubs = _cleanupBoundSubs.get(el);
      if (!elSubs) _cleanupBoundSubs.set(el, elSubs = []);

      let ranImmediate = false

      for (let trig of trigs) {

        const kind = trig.kind, root = trig.root, path = trig.path
        const mods = trig.mods ?? globMods ?? EMPTY_ARR // local mods already contain globs, so ?? is fine here
        if (kind === SIGNAL) {
          if (!expected(root)) return
          if (!_subs.has(root)) _subs.set(root, []);

          const subFn = applyTrigMods((_ev, trigVal, detail) => fn(DM, el, trig, trigVal, detail), trig, mods)
          const wrappedSubFn = (detail) => subFn(null, getSignalValOrIt(trig), detail)
          const changeMod = getSgChangeShape(mods)
          _subs.get(root).push({ fn: wrappedSubFn, changeMod, path })
          wrappedSubFn.remove = () => {
            const subs = _subs.get(root)
            if (subs && subs.length) _subs.set(root, subs.filter(s => s.fn !== wrappedSubFn))
          }
          subFn.remove = wrappedSubFn.remove

          elSubs.push({ type: 'signal', el, kind, root, path, fn: wrappedSubFn })
          if (!ranImmediate && isImmediateMod(mods, false)) {
            ranImmediate = true
            subFn(null, getSignalValOrIt(trig), null)
          }

        } else if (kind === EV_PROP || kind === SPECIAL) {
          let ev = path && path.length ? path[0] : null
            if (kind === SPECIAL) {
              if (root === SPEC_WIN) {
              const onWin = (e, trigVal, detail) => fn(DM, el, trig, trigVal ?? e?.type ?? null, detail ?? e)
              const modded = applyTrigMods(onWin, trig, mods)
              window.addEventListener(ev ?? SPEC_WIN_EV, modded)
              elSubs.push({ type: 'event', targetEl: window, eventName: (ev ?? SPEC_WIN_EV), handler: modded })
              continue;
            }
            if (root === SPEC_DOC) {
              const onDoc = (e, trigVal, detail) => fn(DM, el, trig, trigVal ?? e?.type ?? null, detail ?? e)
              const modded = applyTrigMods(onDoc, trig, mods)
              document.addEventListener(ev ?? SPEC_DOC_EV, modded)
              elSubs.push({ type: 'event', targetEl: document, eventName: (ev ?? SPEC_DOC_EV), handler: modded })
              continue;
            }
            if (root === SPEC_INTERVAL) {
              const ms = parseInt(ev) || SPEC_INTERVAL_MS
              let count = 0
              const onInt = (_e, trigVal, detail) => fn(DM, el, trig, trigVal, detail)
              const modded = applyTrigMods(onInt, trig, mods)
              const id = setInterval(() => {
                try {
                  const tick = count++
                  const detail = { tick, ms, type: SPEC_INTERVAL }
                  modded(undefined, ms, detail)
                } catch (e) { console.error(`[dmax] Error: interval handler (${ms}ms) failed:`, e?.message ?? e) }
              }, ms);
              elSubs.push({ type: 'interval', id });
              continue;
            }
            if (root === SPEC_TIMEOUT) {
              const ms = parseInt(ev) || SPEC_TIMEOUT_MS;
              const onTimeout = (_e, trigVal, detail) => fn(DM, el, trig, trigVal, detail)
              const modded = applyTrigMods(onTimeout, trig, mods)
              const id = setTimeout(() => {
                try { modded(undefined, ms, { tick: 0, ms, type: SPEC_TIMEOUT }) } catch (e) { console.error(`[dmax] Error: timeout handler (${ms}ms) failed:`, e?.message ?? e) }
              }, ms);
              elSubs.push({ type: 'timeout', id });
              continue;
            }
            if (root === SPEC_FORM) {
              // bind to closest form ancestor
              const formEl = el && el.closest ? el.closest('form') : null;
              if (formEl) {
                const formEv = ev || 'submit';
                const onForm = (e, trigVal, detail) => fn(DM, el, trig, trigVal ?? e?.type ?? null, detail ?? e)
                const modded = applyTrigMods(onForm, trig, mods)
                formEl.addEventListener(formEv, modded);
                elSubs.push({ type: 'event', targetEl: formEl, eventName: formEv, handler: modded });
                if (isImmediateMod(mods, false)) modded();
              }
              continue;
            }
          }

          let targetEl = root ? getElById(root, aName) : el
          if (!targetEl) { console.error('[dmax] Error: Element is not found in trigger:', trig, 'in:', aName); return }
          const defaultProp = getDefaultProp(targetEl)
          let propPath = null
          if (path && path.length) {
            const maybeProp = path[0]
            if (maybeProp === defaultProp || maybeProp === 'value' || maybeProp === 'checked' || maybeProp === 'textContent') {
              propPath = path.slice()
              ev = getDefaultEvent(targetEl)
            }
          }
          ev = ev ?? getDefaultEvent(targetEl)
          if (!ev) { console.error('[dmax] Error: Event is not found in trigger:', trig, 'in:', aName); return }

          const finalEvent = ev
          const baseHandler = (eventObj) => {
            fn(DM, el, trig, getElPropVal(targetEl, propPath), eventObj)
          }
          const moddedHandler = applyTrigMods(baseHandler, trig, mods)
          moddedHandler.remove = () => { try { targetEl.removeEventListener(finalEvent, moddedHandler); } catch (e) { } };
          targetEl.addEventListener(finalEvent, moddedHandler);
          elSubs.push({ type: 'event', targetEl, eventName: finalEvent, handler: moddedHandler });
          if (isImmediateMod(mods, false)) {
            ranImmediate = true
            moddedHandler();
          }
        } else { console.error('[dmax] Error: unsupported trigger kind', kind, 'in', aName); return }
      } // end of triggers loop
    }

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

    const DEFAULT_PROP_TARGET = Object.freeze({ kind: EV_PROP, not: null, root: '', path: null })
    function dSync(el, aName) {
      let [parsedAttr] = parse(aName)
      const tars = parsedAttr[TARG] ?? EMPTY_ARR
      const trigs = parsedAttr[TRIG] ?? EMPTY_ARR
      const globMods = parsedAttr[MOD] ?? EMPTY_ARR

      delete parsedAttr[TARG]; delete parsedAttr[TRIG]; delete parsedAttr[MOD];
      if (!isObjEmpty(parsedAttr)) console.warn('[dmax] Warning: dSync supports only targets, triggers, mods but found more:', aName)

      let sigTar = null, propTar = null, sigTrig = null, propTrig = null
      for (let i = 0; i < tars.length; ++i) {
        const t = tars[i]
        if (!sigTar && t.kind === SIGNAL) sigTar = t
        else if (!propTar && t.kind === EV_PROP) propTar = t
        if (sigTar && propTar) break
      }
      for (let i = 0; i < trigs.length; ++i) {
        const t = trigs[i]
        if (!sigTrig && t.kind === SIGNAL) sigTrig = t
        else if (!propTrig && t.kind === EV_PROP) propTrig = t
        if (sigTrig && propTrig) break
      }

      if (!sigTar && !sigTrig) {
        console.error('[dmax] Error: dSync requires signal target or signal trigger in:', aName)
        return
      }

      const signalRead = sigTrig ?? sigTar
      const signalWrite = sigTar
      const writePropTar = propTar ?? DEFAULT_PROP_TARGET
      const shouldReadSignal = !!signalRead && (sigTrig || !propTrig)
      const shouldWriteSignal = !!signalWrite && (propTrig || !sigTrig)

      let elSubs = _cleanupBoundSubs.get(el);
      if (!elSubs) _cleanupBoundSubs.set(el, elSubs = []);

      if (shouldReadSignal) {
        if (!expected(signalRead.root)) return
        if (!_subs.has(signalRead.root)) _subs.set(signalRead.root, []);

        const readMods = (sigTrig?.mods ?? sigTar?.mods ?? globMods) || EMPTY_ARR
        const subFn = applyTrigMods((_ev, _trigVal, detail) => {
          const v = getSignalValOrIt(signalRead)
          setProp(el, aName, writePropTar, v)
        }, signalRead, readMods)
        const wrappedSubFn = (detail) => subFn(null, getSignalValOrIt(signalRead), detail)
        const changeMod = getSgChangeShape(readMods)
        _subs.get(signalRead.root).push({ fn: wrappedSubFn, changeMod, path: signalRead.path })
        wrappedSubFn.remove = () => {
          const subs = _subs.get(signalRead.root)
          if (subs && subs.length) _subs.set(signalRead.root, subs.filter(s => s.fn !== wrappedSubFn))
        }
        subFn.remove = wrappedSubFn.remove
        elSubs.push({ type: 'signal', el, kind: signalRead.kind, root: signalRead.root, path: signalRead.path, fn: wrappedSubFn })

        if (isImmediateMod(readMods, true)) subFn(null, getSignalValOrIt(signalRead), null)
      }

      if (shouldWriteSignal) {
        const trig = propTrig
        const trigRoot = trig ? trig.root : ''
        const trigPath = trig ? trig.path : null
        let targetEl = trigRoot ? getElById(trigRoot, aName) : el
        if (!targetEl) { console.error('[dmax] Error: dSync write source element is not found in trigger:', trig ?? DEFAULT_PROP_TARGET, 'in:', aName); return }

        const writeMods = trig ? ((trig.mods ?? globMods) || EMPTY_ARR) : globMods
        let ev = trigPath && trigPath.length ? trigPath[0] : null
        let propPath = null
        const defaultProp = getDefaultProp(targetEl)
        if (trigPath && trigPath.length) {
          const maybeProp = trigPath[0]
          if (maybeProp === defaultProp || maybeProp === 'value' || maybeProp === 'checked' || maybeProp === 'textContent') {
            propPath = trigPath.slice()
            ev = getDefaultEvent(targetEl)
          }
        }
        if (!propPath && propTar && propTar.path) propPath = propTar.path.slice()
        ev = ev ?? getDefaultEvent(targetEl)
        if (!ev) { console.error('[dmax] Error: dSync write event is not found in trigger:', trig ?? DEFAULT_PROP_TARGET, 'in:', aName); return }

        const baseHandler = (_eventObj) => {
          setSignalAndNotifySubsNLevelsDeep(aName, signalWrite, getElPropVal(targetEl, propPath))
        }
        const moddedHandler = applyTrigMods(baseHandler, trig ?? DEFAULT_PROP_TARGET, writeMods)
        moddedHandler.remove = () => { try { targetEl.removeEventListener(ev, moddedHandler); } catch (e) { } };
        targetEl.addEventListener(ev, moddedHandler)
        elSubs.push({ type: 'event', targetEl, eventName: ev, handler: moddedHandler })
        if (isImmediateMod(writeMods, false)) moddedHandler()
      }
    }

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

    // Converts camelCase back to kebab-case for classList (e.g. zebraEven -> zebra-even)
    function camelToKebab(s) {
      return s.replace(/([A-Z])/g, (_, c) => '-' + c.toLowerCase())
    }

    // data-class+my-class+!my-other@signal="expr"
    //   +className  → add class when expr truthy, remove when falsy
    //   +!className → add class when expr falsy (inverted), remove when truthy
    // aVal is optional; without it the raw signal/trigger value is used as the boolean
    function dClass(el, aName, aVal) {
      let [it] = parse(aName)
      const adds = it[ADD] ?? EMPTY_ARR
      const tars = it[TARG] ?? EMPTY_ARR
      const trigs = it[TRIG] ?? EMPTY_ARR
      const globMods = it[MOD] ?? EMPTY_ARR

      if (!adds.length) { console.error('[dmax] Error: dClass requires class names via + syntax in:', aName); return }
      if (!trigs.length) { console.error('[dmax] Error: dClass requires at least one trigger in:', aName); return }

      const propTar = tars.find(t => t.kind === EV_PROP) ?? null
      const targetEl = (propTar && propTar.root) ? getElById(propTar.root, aName) : el
      if (!targetEl) { console.error('[dmax] Error: dClass target element not found in:', aName); return }

      const classes = adds.map(a => ({ name: camelToKebab(a.root), invert: a.not === true }))
      const fn = aVal ? compileFn(aVal, aName) : null
      if (aVal && !fn) return

      function applyClasses(val) {
        for (const c of classes) {
          const active = c.invert ? !val : !!val
          if (active) targetEl.classList.add(c.name)
          else targetEl.classList.remove(c.name)
        }
      }

      // Pre-select handler variants at setup time to avoid fn-null check on every trigger fire
      const sigApply = fn
        ? (trig, trigVal, detail) => applyClasses(fn(DM, el, trig, trigVal, detail))
        : (_t, trigVal) => applyClasses(trigVal)
      const evApply = fn
        ? (evTarEl, trig, eventObj) => applyClasses(fn(DM, el, trig, getElPropVal(evTarEl, null), eventObj))
        : () => applyClasses(true)

      let elSubs = _cleanupBoundSubs.get(el)
      if (!elSubs) _cleanupBoundSubs.set(el, elSubs = [])

      for (const trig of trigs) {
        const kind = trig.kind, root = trig.root, path = trig.path
        const mods = (trig.mods ?? globMods) || EMPTY_ARR
        if (kind === SIGNAL) {
          if (!expected(root)) return
          if (!_subs.has(root)) _subs.set(root, [])
          const subFn = applyTrigMods((_ev, trigVal, detail) => { sigApply(trig, trigVal, detail) }, trig, mods)
          const wrappedSubFn = (detail) => subFn(null, getSignalValOrIt(trig), detail)
          const changeMod = getSgChangeShape(mods)
          _subs.get(root).push({ fn: wrappedSubFn, changeMod, path })
          wrappedSubFn.remove = () => {
            const subs = _subs.get(root)
            if (subs && subs.length) _subs.set(root, subs.filter(s => s.fn !== wrappedSubFn))
          }
          subFn.remove = wrappedSubFn.remove
          elSubs.push({ type: 'signal', el, kind, root, path, fn: wrappedSubFn })
          if (isImmediateMod(mods, false)) subFn(null, getSignalValOrIt(trig), null)
        } else if (kind === EV_PROP) {
          const evTarEl = root ? getElById(root, aName) : el
          if (!evTarEl) { console.error('[dmax] Error: dClass element not found in trigger:', trig, 'in:', aName); return }
          const ev = (path && path.length ? path[0] : null) ?? getDefaultEvent(evTarEl)
          if (!ev) { console.error('[dmax] Error: dClass event not found in trigger:', trig, 'in:', aName); return }
          const baseHandler = (eventObj) => { evApply(evTarEl, trig, eventObj) }
          const moddedHandler = applyTrigMods(baseHandler, trig, mods)
          moddedHandler.remove = () => { try { evTarEl.removeEventListener(ev, moddedHandler) } catch (e) { } }
          evTarEl.addEventListener(ev, moddedHandler)
          elSubs.push({ type: 'event', targetEl: evTarEl, eventName: ev, handler: moddedHandler })
          if (isImmediateMod(mods, false)) moddedHandler()
        }
      }
    }

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

    // data-disp:.@signal="expr"
    //   shows/hides the target element based on the truthy/falsy result of the expression
    function dDisp(el, aName, aVal) {
      let [it] = parse(aName)
      const tars = it[TARG] ?? EMPTY_ARR
      const trigs = it[TRIG] ?? EMPTY_ARR
      const globMods = it[MOD] ?? EMPTY_ARR

      if (!trigs.length) { console.error('[dmax] Error: dDisp requires at least one trigger in:', aName); return }

      const propTar = tars.find(t => t.kind === EV_PROP) ?? null
      const targetEl = (propTar && propTar.root) ? getElById(propTar.root, aName) : el
      if (!targetEl) { console.error('[dmax] Error: dDisp target element not found in:', aName); return }

      // Cache original display to restore on show
      const inline = (targetEl.style && targetEl.style.display) || ''
      const hadInline = inline !== ''
      const computed = getComputedDisplay(targetEl)
      const origDisplay = hadInline ? inline : (computed === 'none' || !computed ? 'block' : computed)

      const fn = aVal ? compileFn(aVal, aName) : null
      if (aVal && !fn) return

      function applyDisp(val) {
        if (val) {
          if (hadInline) targetEl.style.display = origDisplay
          else {
            if (getComputedDisplay(targetEl) === 'none') targetEl.style.display = origDisplay
            else targetEl.style.removeProperty('display')
          }
        } else {
          targetEl.style.display = 'none'
        }
      }

      // Pre-select handler variants at setup time to avoid fn-null check on every trigger fire
      const sigApply = fn
        ? (trig, trigVal, detail) => applyDisp(fn(DM, el, trig, trigVal, detail))
        : (_t, trigVal) => applyDisp(trigVal)
      const evApply = fn
        ? (evTarEl, trig, eventObj) => applyDisp(fn(DM, el, trig, getElPropVal(evTarEl, null), eventObj))
        : () => applyDisp(true)

      let elSubs = _cleanupBoundSubs.get(el)
      if (!elSubs) _cleanupBoundSubs.set(el, elSubs = [])

      for (const trig of trigs) {
        const kind = trig.kind, root = trig.root, path = trig.path
        const mods = (trig.mods ?? globMods) || EMPTY_ARR
        if (kind === SIGNAL) {
          if (!expected(root)) return
          if (!_subs.has(root)) _subs.set(root, [])
          const subFn = applyTrigMods((_ev, trigVal, detail) => { sigApply(trig, trigVal, detail) }, trig, mods)
          const wrappedSubFn = (detail) => subFn(null, getSignalValOrIt(trig), detail)
          const changeMod = getSgChangeShape(mods)
          _subs.get(root).push({ fn: wrappedSubFn, changeMod, path })
          wrappedSubFn.remove = () => {
            const subs = _subs.get(root)
            if (subs && subs.length) _subs.set(root, subs.filter(s => s.fn !== wrappedSubFn))
          }
          subFn.remove = wrappedSubFn.remove
          elSubs.push({ type: 'signal', el, kind, root, path, fn: wrappedSubFn })
          if (isImmediateMod(mods, false)) subFn(null, getSignalValOrIt(trig), null)
        } else if (kind === EV_PROP) {
          const evTarEl = root ? getElById(root, aName) : el
          if (!evTarEl) { console.error('[dmax] Error: dDisp element not found in trigger:', trig, 'in:', aName); return }
          const ev = (path && path.length ? path[0] : null) ?? getDefaultEvent(evTarEl)
          if (!ev) { console.error('[dmax] Error: dDisp event not found in trigger:', trig, 'in:', aName); return }
          const baseHandler = (eventObj) => { evApply(evTarEl, trig, eventObj) }
          const moddedHandler = applyTrigMods(baseHandler, trig, mods)
          moddedHandler.remove = () => { try { evTarEl.removeEventListener(ev, moddedHandler) } catch (e) { } }
          evTarEl.addEventListener(ev, moddedHandler)
          elSubs.push({ type: 'event', targetEl: evTarEl, eventName: ev, handler: moddedHandler })
          if (isImmediateMod(mods, false)) moddedHandler()
        }
      }
    }

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

    // Dispatch table used by dDump (and future clone-wiring contexts) to call the right setup fn per data-* attr
    function wireNode(n, an, v) {
      if (an.indexOf('data-def') === 0) dDef(n, an, v)
      else if (an === 'data-debug') dDebug(n)
      else if (an.indexOf('data-sub') === 0) dSub(n, an, v)
      else if (an.indexOf('data-sync') === 0) dSync(n, an)
      else if (an.indexOf('data-class') === 0) dClass(n, an, v)
      else if (an.indexOf('data-disp') === 0) dDisp(n, an, v)
      else if (an.indexOf('data-dump') === 0) dDump(n, an)
      else if (an.indexOf('data-get') === 0 || an.indexOf('data-post') === 0 || an.indexOf('data-put') === 0 || an.indexOf('data-patch') === 0 || an.indexOf('data-delete') === 0) dAction(n, an, v)
    }

    // data-dump@items^immediate          (inline <template> child, array signal, immediate render)
    // data-dump+#tplId@items^shape_only  (explicit template ref, shape-only subscription)
    // Inside templates: $item → dm.signal[idx], $index → String(idx) in attr values;
    //                   $item → signal.idx, $index → String(idx) in attr names
    function dDump(el, aName) {
      let [it] = parse(aName)
      const trigs = it[TRIG] ?? EMPTY_ARR
      const adds = it[ADD] ?? EMPTY_ARR
      const globMods = it[MOD] ?? EMPTY_ARR

      if (!trigs.length) { console.error('[dmax] Error: dDump requires a signal trigger in:', aName); return }

      const trig = trigs[0]
      if (trig.kind !== SIGNAL) { console.error('[dmax] Error: dDump trigger must be a signal in:', aName); return }

      const mods = (trig.mods ?? globMods) || EMPTY_ARR

      // Find template: +#tplId add-slot first, then inline <template> child
      let tpl = null
      if (adds.length && adds[0].kind === EV_PROP && adds[0].root) {
        tpl = getElById(adds[0].root, aName)
      }
      if (!tpl) tpl = el.querySelector('template')
      // Detach inline template so it doesn't remain as an empty child
      if (tpl && tpl.parentNode === el) tpl.parentNode.removeChild(tpl)
      if (!tpl) { console.error('[dmax] Error: dDump template not found for:', aName); return }

      if (!el.__dump) el.__dump = { nodes: [], count: 0 }

      const sigRoot = trig.root
      const sigPath = trig.path

      function doRender(detail) {
        const val = getSignalValOrIt(trig)
        if (!Array.isArray(val)) return
        const newLen = val.length
        const oldLen = el.__dump.count || 0

        // Remove clones from the end when array shrank
        if (newLen < oldLen) {
          const removeCount = oldLen - newLen
          for (let i = 0; i < removeCount; i++) {
            const node = el.__dump.nodes.pop()
            if (node && node.parentNode) node.parentNode.removeChild(node)
          }
          el.__dump.count = newLen
        }

        // Append new clones when array grew
        if (newLen > oldLen) {
          const frag = document.createDocumentFragment()
          for (let idx = oldLen; idx < newLen; idx++) {
            try {
              if (!tpl.content || !tpl.content.firstElementChild) break
              const node = tpl.content.firstElementChild.cloneNode(true)
              // Rewrite $item/$index placeholders in all descendant attribute names and values
              const walk = [node].concat(Array.from(node.querySelectorAll('*')))
              for (const n of walk) {
                const attrs = Array.from(n.attributes || EMPTY_ARR)
                for (const a of attrs) {
                  let atrName = a.name, atrVal = a.value
                  if (atrName.indexOf('$item') !== -1 || atrName.indexOf('$index') !== -1) {
                    atrName = atrName.replace(/\$item/g, sigRoot + '.' + idx).replace(/\$index/g, String(idx))
                  }
                  if (typeof atrVal === 'string' && (atrVal.indexOf('$item') !== -1 || atrVal.indexOf('$index') !== -1)) {
                    atrVal = atrVal.replace(/\$index/g, String(idx)).replace(/\$item/g, 'dm.' + sigRoot + '[' + idx + ']')
                  }
                  try {
                    if (atrName !== a.name) { n.removeAttribute(a.name); n.setAttribute(atrName, atrVal) }
                    else if (atrVal !== a.value) n.setAttribute(atrName, atrVal)
                  } catch (e) { console.error('[dmax] Error: dDump setAttribute failed for', atrName, e.message) }
                }
              }
              frag.appendChild(node)
              el.__dump.nodes.push(node)
            } catch (e) {}
          }
          el.appendChild(frag)
          // Wire up data-* attributes on newly inserted nodes
          for (const node of el.__dump.nodes.slice(-(newLen - oldLen))) {
            const walk2 = [node].concat(Array.from(node.querySelectorAll('*')))
            for (const n of walk2)
              for (const a of Array.from(n.attributes || EMPTY_ARR)) wireNode(n, a.name, a.value)
          }
          el.__dump.count = newLen
        }
      }

      const root = sigRoot, path = sigPath
      if (!_subs.has(root)) _subs.set(root, [])
      const changeMod = getSgChangeShape(mods)
      const subFn = applyTrigMods((_ev, _trigVal, detail) => doRender(detail), trig, mods)
      const wrappedSubFn = (detail) => subFn(null, getSignalValOrIt(trig), detail)
      _subs.get(root).push({ fn: wrappedSubFn, changeMod, path })
      wrappedSubFn.remove = () => {
        const subs = _subs.get(root)
        if (subs && subs.length) _subs.set(root, subs.filter(s => s.fn !== wrappedSubFn))
      }
      subFn.remove = wrappedSubFn.remove

      let elSubs = _cleanupBoundSubs.get(el)
      if (!elSubs) _cleanupBoundSubs.set(el, elSubs = [])
      elSubs.push({ type: 'signal', el, kind: SIGNAL, root, path, fn: wrappedSubFn })

      if (isImmediateMod(mods, false)) doRender(null)
    }

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

    // data-get^busy.busy:result@.click^immediate="url"
    // data-post^json^busy.busy:result@.click+#id.prop+signal="url"
    // data-put^json:result@.click+body="url"
    // data-delete^busy.busy:ok@.click="url"
    // Method is derived from the attribute prefix; aVal is compiled as a URL expression.
    function dAction(el, aName, aVal) {
      const afterData = aName.slice(5) // strip 'data-'
      const methodEnd = indexFirst(afterData, ALL, 0)
      const methodName = methodEnd >= 0 ? afterData.slice(0, methodEnd) : afterData
      const prefixToMethod = { get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE' }
      const method = prefixToMethod[methodName]
      if (!method) { console.error('[dmax] Error: dAction: unrecognised method prefix in:', aName); return }

      let [it] = parse(aName)
      const tars = it[TARG] ?? EMPTY_ARR
      const trigs = it[TRIG] ?? EMPTY_ARR
      const adds = it[ADD] ?? EMPTY_ARR
      const globMods = it[MOD] ?? EMPTY_ARR

      const urlFn = aVal ? compileFn(aVal, aName) : null
      if (aVal && !urlFn) return

      let resultTar = null
      for (let i = 0; i < tars.length; i++) {
        if (tars[i].kind === SIGNAL) { resultTar = tars[i]; break }
      }

      let busyMod = null, completeMod = null, errMod = null, codeMod = null
      let isJson = false, isText = false, isForm = false, noCache = false
      let encBr = false, encGzip = false, encDeflate = false, encCompress = false
      let hdrsMod = null
      let resultMode = MOD_REPLACE
      let openMod = null, closeMod = null, retryMod = null, abortMod = null
      const urlMods = [], bodyMods = [], hdrMods = []
      for (const m of globMods) {
        const mr = m.root
        if (mr === MOD_JSON) isJson = true
        else if (mr === MOD_TEXT) isText = true
        else if (mr === MOD_FORM) isForm = true
        else if (mr === MOD_NO_CACHE) noCache = true
        else if (mr === MOD_BROTLI || mr === MOD_BR) encBr = true
        else if (mr === MOD_GZIP) encGzip = true
        else if (mr === MOD_DEFLATE) encDeflate = true
        else if (mr === MOD_COMPRESS) encCompress = true
        else if (mr === MOD_HEADERS && !hdrsMod) hdrsMod = m
        else if (mr === MOD_REPLACE || mr === MOD_MERGE || mr === MOD_APPEND || mr === MOD_PREPEND) resultMode = mr
        else if (mr === MOD_BUSY && !busyMod) busyMod = m
        else if (mr === MOD_COMPLETE && !completeMod) completeMod = m
        else if (mr === MOD_ERR && !errMod) errMod = m
        else if (mr === MOD_CODE && !codeMod) codeMod = m
        else if (mr === MOD_SSE_OPEN && !openMod) openMod = m
        else if (mr === MOD_SSE_CLOSE && !closeMod) closeMod = m
        else if (mr === MOD_RETRY && !retryMod) retryMod = m
        else if (mr === MOD_ABORT && !abortMod) abortMod = m
        else if (mr === MOD_URL) urlMods.push(m)
        else if (mr === MOD_BODY) bodyMods.push(m)
        else if (mr === MOD_HDR) hdrMods.push(m)
      }
      if (resultTar && resultTar.mods) {
        for (const m of resultTar.mods) {
          const mr = m.root
          if (mr === MOD_REPLACE || mr === MOD_MERGE || mr === MOD_APPEND || mr === MOD_PREPEND) {
            resultMode = mr
            break
          }
        }
      }

      const busyStat = resolveStatusSignal(busyMod, MOD_BUSY)
      const completeStat = resolveStatusSignal(completeMod, MOD_COMPLETE)
      const errStat = resolveStatusSignal(errMod, MOD_ERR)
      const codeStat = resolveStatusSignal(codeMod, MOD_CODE)
      const openStat = resolveStatusSignal(openMod, MOD_SSE_OPEN)
      const closeStat = resolveStatusSignal(closeMod, MOD_SSE_CLOSE)
      const abortStat = resolveStatusSignal(abortMod, MOD_ABORT)
      // ^retry.N — auto-reconnect delay in ms (default 1000) when SSE stream drops unexpectedly
      const retryDelay = retryMod ? (+(resolveModPathVal(retryMod.path) ?? 1000) || 1000) : 0

      // Initialise state signals to defaults if not yet defined
      if (busyStat && !_dm.has(busyStat.root)) _dm.set(busyStat.root, false)
      if (completeStat && !_dm.has(completeStat.root)) _dm.set(completeStat.root, false)
      if (errStat && !_dm.has(errStat.root)) _dm.set(errStat.root, null)
      if (codeStat && !_dm.has(codeStat.root)) _dm.set(codeStat.root, null)
      if (openStat && !_dm.has(openStat.root)) _dm.set(openStat.root, false)
      if (closeStat && !_dm.has(closeStat.root)) _dm.set(closeStat.root, false)
      if (abortStat && !_dm.has(abortStat.root)) _dm.set(abortStat.root, null)

      const isGetOrDelete = method === 'GET' || method === 'DELETE'

      // Tracks the active AbortController for the current SSE request so ^abort works.
      let _activeAbort = null

      const doRequest = async () => {
        const url = urlFn ? urlFn(DM, el, null, null, null) : ''
        if (!url) { console.error('[dmax] Error: dAction: URL is empty in:', aName); return }

        if (busyStat) setSignalAndNotifySubsNLevelsDeep(aName, busyStat, true)
        if (completeStat) setSignalAndNotifySubsNLevelsDeep(aName, completeStat, false)
        if (errStat) setSignalAndNotifySubsNLevelsDeep(aName, errStat, null)
        if (codeStat) setSignalAndNotifySubsNLevelsDeep(aName, codeStat, null)

        try {
          const queryParams = Object.create(null), bodyFields = Object.create(null)
          for (const add of adds) {
            const addKind = add.kind, addRoot = add.root, addPath = add.path
            let val = null, key = null, spreadAll = false
            if (addKind === EV_PROP) {
              const addEl = addRoot ? getElById(addRoot, aName) : el
              val = addEl ? getElPropVal(addEl, addPath) : null
              key = addPath && addPath.length ? addPath[addPath.length - 1] : (addRoot || 'value')
            } else {
              const pathLen = addPath ? addPath.length : 0
              if (addRoot === '_all' && !pathLen) {
                val = {}
                for (const [sgName, sgVal] of _dm.entries()) val[sgName] = sgVal
                spreadAll = true
              } else if (pathLen && addPath[pathLen - 1] === '_all') {
                const basePath = pathLen === 1 ? null : addPath.slice(0, pathLen - 1)
                val = getSignalValOrIt({ kind: SIGNAL, not: add.not, root: addRoot, path: basePath })
                spreadAll = true
              } else {
                val = getSignalValOrIt(add)
                key = (addPath && addPath.length ? addPath[addPath.length - 1] : addRoot) || 'value'
              }
            }
            if (spreadAll) {
              if (val && typeof val === 'object') {
                for (const k in val) {
                  if (!hasOwn(val, k)) continue
                  if (isGetOrDelete) queryParams[k] = val[k]
                  else bodyFields[k] = val[k]
                }
              } else if (isGetOrDelete) queryParams.value = val
              else bodyFields.value = val
            } else if (isGetOrDelete) queryParams[key] = val
            else bodyFields[key] = val
          }

          // ^url.<signalPath> — force named signal to URL query params (any HTTP method)
          // ^body.<signalPath> — force named signal to request body (any HTTP method)
          for (let _mi = 0; _mi < 2; _mi++) {
            const _mArr = _mi === 0 ? urlMods : bodyMods
            const _dest = _mi === 0 ? queryParams : bodyFields
            for (const _m of _mArr) {
              const _mp = _m.path
              if (!_mp) continue
              let _k, _v
              if (typeof _mp === 'string') { _k = _mp; _v = _dm.has(_mp) ? _dm.get(_mp) : undefined }
              else if (_mp.kind === SIGNAL) { _k = _mp.path && _mp.path.length ? _mp.path[_mp.path.length - 1] : _mp.root; _v = getSignalValOrIt(_mp) }
              else continue
              _dest[_k] = _v
            }
          }

          let finalUrl = url
          let q = '', hasQ = false
          for (const k in queryParams) {
            if (hasQ) q += '&'
            q += encodeURIComponent(k) + '=' + encodeURIComponent(String(queryParams[k] ?? ''))
            hasQ = true
          }
          if (hasQ) {
            finalUrl += (finalUrl.indexOf('?') === -1 ? '?' : '&') + q
          }

          const headers = Object.create(null)
          if (isJson) { headers['Content-Type'] = 'application/json'; headers['Accept'] = 'application/json' }
          else if (isForm) headers['Content-Type'] = 'application/x-www-form-urlencoded'
          else if (isText) headers['Content-Type'] = 'text/plain;charset=UTF-8'
          if (noCache) { headers['Cache-Control'] = 'no-cache'; headers['Pragma'] = 'no-cache' }
          let enc = ''
          if (encBr) enc = 'br'
          if (encGzip) enc += (enc ? ', ' : '') + 'gzip'
          if (encDeflate) enc += (enc ? ', ' : '') + 'deflate'
          if (encCompress) enc += (enc ? ', ' : '') + 'compress'
          if (enc) headers['Accept-Encoding'] = enc
          if (hdrsMod) {
            const hdrObj = resolveModPathVal(hdrsMod.path)
            if (hdrObj && typeof hdrObj === 'object')
              for (const hk in hdrObj) if (hasOwn(hdrObj, hk)) headers[hk] = String(hdrObj[hk])
          }
          // ^header.<name> — set a single request header from a named signal value
          for (const _m of hdrMods) {
            const _mp = _m.path
            if (!_mp) continue
            let _k, _v
            if (typeof _mp === 'string') { _k = _mp; _v = _dm.has(_mp) ? _dm.get(_mp) : undefined }
            else if (_mp.kind === SIGNAL) { _k = _mp.path && _mp.path.length ? _mp.path[_mp.path.length - 1] : _mp.root; _v = getSignalValOrIt(_mp) }
            else continue
            headers[_k] = String(_v ?? '')
          }

          let bodyCount = 0, firstBodyKey = null
          for (const bk in bodyFields) {
            if (!hasOwn(bodyFields, bk)) continue
            if (!bodyCount) firstBodyKey = bk
            bodyCount++
          }
          let body = null
          if (bodyCount) {
            // Single input → unwrap the value (matches reference behaviour); multiple → send as object
            const raw = bodyCount === 1 ? bodyFields[firstBodyKey] : bodyFields
            if (isForm && raw && typeof raw === 'object') {
              const params = new URLSearchParams()
              if (Array.isArray(raw)) {
                for (let i = 0; i < raw.length; i++) params.append(String(i), String(raw[i] ?? ''))
              } else {
                for (const k in raw) if (hasOwn(raw, k)) params.append(k, String(raw[k] ?? ''))
              }
              body = params.toString()
            } else if (isJson || (raw !== null && typeof raw === 'object'))
              body = JSON.stringify(raw)
            else body = String(raw)
          }

          // Wire up AbortController so ^abort.<signal> lets callers cancel the request.
          const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
          _activeAbort = ac ? () => ac.abort() : null
          if (abortStat) setSignalAndNotifySubsNLevelsDeep(aName, abortStat, _activeAbort)
          const init = { method, headers }
          if (body != null) init.body = body
          if (ac) init.signal = ac.signal

          const res = await window.fetch(finalUrl, init)
          const ct = (res.headers && res.headers.get('content-type')) || ''
          let payload
          if (ct.includes('text/event-stream')) {
            // Use incremental streaming when the browser exposes a ReadableStream body;
            // fall back to full-buffer res.text() in environments that do not (e.g. test mocks).
            if (res.body && typeof res.body.getReader === 'function') {
              payload = await consumeDmaxSseStream(
                res.body, aName,
                openStat ? () => {
                  setSignalAndNotifySubsNLevelsDeep(aName, openStat, true)
                  if (closeStat) setSignalAndNotifySubsNLevelsDeep(aName, closeStat, false)
                } : null,
                closeStat || errStat ? (streamErr) => {
                  if (openStat) setSignalAndNotifySubsNLevelsDeep(aName, openStat, false)
                  if (streamErr) {
                    if (errStat) setSignalAndNotifySubsNLevelsDeep(aName, errStat, streamErr.message || String(streamErr))
                  } else {
                    if (closeStat) setSignalAndNotifySubsNLevelsDeep(aName, closeStat, true)
                  }
                } : null
              )
            } else {
              if (openStat) setSignalAndNotifySubsNLevelsDeep(aName, openStat, true)
              const sseRaw = await res.text()
              payload = applyDmaxSse(sseRaw, aName)
              if (openStat) setSignalAndNotifySubsNLevelsDeep(aName, openStat, false)
              if (closeStat) setSignalAndNotifySubsNLevelsDeep(aName, closeStat, true)
            }
          } else if (isJsonContentType(ct)) payload = await res.json()
          else payload = await res.text()

          applyActionPayload(aName, resultTar, payload, resultMode)
          if (busyStat) setSignalAndNotifySubsNLevelsDeep(aName, busyStat, false)
          if (completeStat) setSignalAndNotifySubsNLevelsDeep(aName, completeStat, true)
          if (errStat) setSignalAndNotifySubsNLevelsDeep(aName, errStat, null)
          if (codeStat) setSignalAndNotifySubsNLevelsDeep(aName, codeStat, Number.isFinite(res.status) ? res.status : null)
          if (abortStat) setSignalAndNotifySubsNLevelsDeep(aName, abortStat, null)
          _activeAbort = null

          // ^retry: auto-reconnect after clean close (stream ended without error and retry is requested)
          if (retryDelay > 0 && ct.includes('text/event-stream') && !(ac && ac.signal.aborted)) {
            setTimeout(doRequest, retryDelay)
          }
        } catch (err) {
          _activeAbort = null
          if (abortStat) setSignalAndNotifySubsNLevelsDeep(aName, abortStat, null)
          if (openStat) setSignalAndNotifySubsNLevelsDeep(aName, openStat, false)
          // Treat AbortError as a clean cancel (not an error): AbortController fires AbortError by spec.
          const isAbort = err && err.name === 'AbortError'
          if (busyStat) setSignalAndNotifySubsNLevelsDeep(aName, busyStat, false)
          if (completeStat) setSignalAndNotifySubsNLevelsDeep(aName, completeStat, true)
          if (!isAbort) {
            if (errStat) setSignalAndNotifySubsNLevelsDeep(aName, errStat, err && err.message ? err.message : String(err))
            if (codeStat) setSignalAndNotifySubsNLevelsDeep(aName, codeStat, Number.isFinite(err && err.status) ? err.status : null)
            console.error('[dmax] Error: dAction fetch failed:', err)
            // ^retry: reconnect after error if requested (deliberate aborts skip this path via isAbort check above)
            if (retryDelay > 0) setTimeout(doRequest, retryDelay)
          }
        }
      }

      if (!trigs.length) { doRequest(); return }

      let elSubs = _cleanupBoundSubs.get(el)
      if (!elSubs) _cleanupBoundSubs.set(el, elSubs = [])

      let ranImmediate = false

      for (const trig of trigs) {
        const kind = trig.kind, root = trig.root, path = trig.path
        const mods = (trig.mods ?? globMods) || EMPTY_ARR
        if (kind === SIGNAL) {
          if (!expected(root)) return
          if (!_subs.has(root)) _subs.set(root, [])
          const subFn = applyTrigMods((_ev, _trigVal, _detail) => doRequest(), trig, mods)
          const wrappedSubFn = (detail) => subFn(null, getSignalValOrIt(trig), detail)
          const changeMod = getSgChangeShape(mods)
          _subs.get(root).push({ fn: wrappedSubFn, changeMod, path })
          wrappedSubFn.remove = () => {
            const subs = _subs.get(root)
            if (subs && subs.length) _subs.set(root, subs.filter(s => s.fn !== wrappedSubFn))
          }
          subFn.remove = wrappedSubFn.remove
          elSubs.push({ type: 'signal', el, kind, root, path, fn: wrappedSubFn })
          if (!ranImmediate && isImmediateMod(mods, false)) {
            ranImmediate = true
            doRequest()
          }
        } else if (kind === EV_PROP) {
          const evTarEl = root ? getElById(root, aName) : el
          if (!evTarEl) { console.error('[dmax] Error: dAction element not found in trigger:', trig, 'in:', aName); return }
          const ev = (path && path.length ? path[0] : null) ?? getDefaultEvent(evTarEl)
          if (!ev) { console.error('[dmax] Error: dAction event not found in trigger:', trig, 'in:', aName); return }
          const baseHandler = (_eventObj) => doRequest()
          const moddedHandler = applyTrigMods(baseHandler, trig, mods)
          moddedHandler.remove = () => { try { evTarEl.removeEventListener(ev, moddedHandler) } catch (e) { } }
          evTarEl.addEventListener(ev, moddedHandler)
          elSubs.push({ type: 'event', targetEl: evTarEl, eventName: ev, handler: moddedHandler })
          if (!ranImmediate && isImmediateMod(mods, false)) {
            ranImmediate = true
            moddedHandler()
          }
        } else {
          console.error('[dmax] Error: dAction unsupported trigger kind', kind, 'in', aName)
        }
      }
    }

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

    // --- morph: fast in-place DOM reconciliation ---
    //
    // WHY morph beats innerHTML replacement:
    //   • innerHTML destroys and recreates all event listeners (requires re-wiring)
    //   • innerHTML triggers forced layout/style recalculation for all descendants
    //   • innerHTML loses form state (input values, focus, scroll position)
    //   • morph reuses matched DOM nodes, only patching what changed
    //
    // Algorithm (inspired by Idiomorph / keyed reconciliation):
    //   1. Match by `id` first  → stable identity across reorders
    //   2. Fallback to same tagName → morph in place
    //   3. No match → replace/clone
    //   Build a single Map<id, node> per morphChildren call (O(1) lookup, no double scan).

    // Returns true if two nodes can be morphed in place (same type, same tag or same id).
    function sameKind(a, b) {
      if (a.nodeType !== b.nodeType) return false
      if (a.nodeType !== 1 /*ELEMENT*/) return true
      if (a.id && b.id) return a.id === b.id
      return a.tagName === b.tagName
    }

    function sameSlot(a, b) {
      if (a.nodeType !== b.nodeType) return false
      if (a.nodeType !== 1 /*ELEMENT*/) return true
      if (a.id || b.id) return a.id === b.id
      return a.tagName === b.tagName
    }

    const _HTML_PARSE_TEMPLATE = document.createElement('template')
    const _SIMPLE_ID_SELECTOR_RE = /^#([^\s>+~:.[,]+)$/
    const TEXT_NODE = 3

    function getPatchTargets(selector) {
      if (!selector) return EMPTY_ARR
      const simpleId = _SIMPLE_ID_SELECTOR_RE.exec(selector)
      if (simpleId) {
        const el = document.getElementById(simpleId[1])
        return el ? [el] : EMPTY_ARR
      }
      return document.querySelectorAll(selector)
    }

    // Sync attributes from `to` onto `from`: remove missing, add/update present.
    function updateAttrs(from, to) {
      const toAttrs = to.attributes
      const fromAttrs = from.attributes
      if (fromAttrs.length === toAttrs.length) {
        let same = true
        let orderChanged = false
        for (let i = 0; i < toAttrs.length; i++) {
          const fromAttr = fromAttrs[i], toAttr = toAttrs[i]
          if (fromAttr.name !== toAttr.name) {
            orderChanged = true
            same = false
            break
          }
          if (fromAttr.value !== toAttr.value) {
            same = false
            break
          }
        }
        if (same) return
        if (orderChanged) {
          let sameNames = true
          for (let i = 0; i < toAttrs.length; i++) {
            const toAttr = toAttrs[i], fromAttr = fromAttrs.getNamedItem(toAttr.name)
            if (!fromAttr || fromAttr.value !== toAttr.value) {
              sameNames = false
              break
            }
          }
          if (sameNames) return
        }
      }
      if (!toAttrs.length) {
        for (let i = fromAttrs.length - 1; i >= 0; i--) from.removeAttribute(fromAttrs[i].name)
        return
      }
      for (let i = 0; i < toAttrs.length; i++) {
        const { name, value } = toAttrs[i]
        if (from.getAttribute(name) !== value) from.setAttribute(name, value)
      }
      // Reverse iteration: attributes is a live NamedNodeMap — removing shifts indices,
      // so we iterate backwards to avoid skipping entries.
      for (let i = fromAttrs.length - 1; i >= 0; i--) {
        const name = fromAttrs[i].name
        if (!to.hasAttribute(name)) from.removeAttribute(name)
      }
    }

    // Reconcile children of `from` to match children of `to`.
    // Single forward pass; reuses a Map allocated once per call for O(1) id lookup.
    function morphChildren(from, to) {
      let cur = from.firstChild
      let toChild = to.firstChild

      while (cur && toChild && sameSlot(cur, toChild)) {
        const next = cur.nextSibling
        morph(cur, toChild)
        cur = next
        toChild = toChild.nextSibling
      }

      if (!cur) {
        for (; toChild; toChild = toChild.nextSibling) from.appendChild(toChild.cloneNode(true))
        return
      }
      if (!toChild) {
        while (cur) {
          const next = cur.nextSibling
          from.removeChild(cur)
          cur = next
        }
        return
      }

      // Build id→node map for remaining keyed existing children only
      const idMap = new Map()
      for (let n = cur; n; n = n.nextSibling)
        if (n.nodeType === 1 && n.id) idMap.set(n.id, n)

      for (; toChild; toChild = toChild.nextSibling) {
        let match = null

        if (toChild.nodeType === 1 && toChild.id && idMap.has(toChild.id)) {
          // Keyed match: pull by id regardless of position
          match = idMap.get(toChild.id)
          idMap.delete(toChild.id)
        } else {
          // Skip over keyed (id'd) nodes that are still awaiting their own keyed toChild match.
          // Moving `cur` past them prevents an unkeyed child from "stealing" a node that belongs
          // to a later id-matched slot, which would require an extra insertBefore to fix.
          while (cur && cur.nodeType === 1 && cur.id && idMap.has(cur.id))
            cur = cur.nextSibling
          if (cur && sameKind(cur, toChild)) {
            match = cur
          }
        }

        if (match) {
          if (match !== cur) {
            from.insertBefore(match, cur || null)
          } else {
            cur = cur.nextSibling
          }
          morph(match, toChild)
        } else {
          // No reusable node found — clone and insert
          from.insertBefore(toChild.cloneNode(true), cur || null)
        }
      }

      // Remove any remaining unprocessed old nodes
      while (cur) {
        const next = cur.nextSibling
        from.removeChild(cur)
        cur = next
      }
      // Remove keyed nodes that were in the original children but not matched by any toChild
      for (const n of idMap.values()) {
        if (n.parentNode === from) from.removeChild(n)
      }
    }

    // Update `from` DOM node in place to match `to`. Does not disturb event
    // listeners, __dump state, or _cleanupBoundSubs on matched nodes.
    // Preserves caret/selection for focused text inputs and textareas, and
    // restores scroll position so large streamed updates do not jump the viewport.
    function morph(from, to) {
      if (from.nodeType === 3 /*TEXT*/ && to.nodeType === 3) {
        if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue
        return
      }
      if (from.nodeType !== 1 || to.nodeType !== 1) return
      if (from.tagName !== to.tagName) {
        // Different element type — replace entirely (cannot morph safely)
        if (from.parentNode) from.parentNode.replaceChild(to.cloneNode(true), from)
        return
      }
      // Preserve caret/selection for focused text inputs and textareas so that
      // an in-flight SSE patch does not reset the user's cursor position.
      const tag = from.tagName
      const isFocused = from === document.activeElement
      let selStart = -1, selEnd = -1, selDir = 'none'
      let selectValue = null, selectIndex = -1
      if (isFocused && (tag === 'INPUT' || tag === 'TEXTAREA')) {
        try { selStart = from.selectionStart; selEnd = from.selectionEnd; selDir = from.selectionDirection || 'none' } catch (_e) {
          // selection not supported for this input type (e.g. type=number, type=email)
        }
      } else if (isFocused && tag === 'SELECT') {
        selectValue = from.value
        selectIndex = from.selectedIndex
      }
      // Save scroll position so content updates do not unexpectedly jump the
      // user's scroll offset (mirrors idiomorph / paxi discipline).
      const scrollTop = from.scrollTop, scrollLeft = from.scrollLeft
      updateAttrs(from, to)
      const fromFirst = from.firstChild, toFirst = to.firstChild
      if (fromFirst && toFirst
        && !fromFirst.nextSibling && !toFirst.nextSibling
        && fromFirst.nodeType === TEXT_NODE && toFirst.nodeType === TEXT_NODE) {
        if (fromFirst.nodeValue !== toFirst.nodeValue) fromFirst.nodeValue = toFirst.nodeValue
      } else if (fromFirst || toFirst) morphChildren(from, to)
      // Restore scroll position after children are reconciled
      if (from.scrollTop !== scrollTop) from.scrollTop = scrollTop
      if (from.scrollLeft !== scrollLeft) from.scrollLeft = scrollLeft
      // Restore caret/selection for focused inputs/textareas
      if (isFocused && selStart >= 0) {
        try { from.setSelectionRange(selStart, selEnd, selDir) } catch (_e) {
          // setSelectionRange not supported for this input type
        }
      } else if (isFocused && tag === 'SELECT') {
        // Prefer restoring by value so the same logical option stays selected even
        // if the server reorders options; fall back to the previous index only when
        // that value no longer exists in the morphed option set.
        from.value = selectValue
        if (from.value !== selectValue && selectIndex >= 0 && selectIndex < from.options.length)
          from.selectedIndex = selectIndex
      }
    }

    function applyOobHtml(html) {
      if (!html) return ''
      _HTML_PARSE_TEMPLATE.innerHTML = html
      const src = _HTML_PARSE_TEMPLATE.content.querySelector('[data-oob]')
      if (!src) return ''
      const mode = src.getAttribute('data-oob')
      const id = src.getAttribute('id')
      const tar = id ? document.getElementById(id) : null
      if (!tar) return ''
      if (mode === 'morph') morph(tar, src)
      else tar.replaceWith(src.cloneNode(true))
      return 'applied:' + mode
    }

    const JSON_MERGE_DELETE = Symbol('json_merge_delete')
    const SSE_EVENT_DMAX_PATCH_ELEMENTS = 'dmax-patch-elements'
    const SSE_EVENT_DMAX_PATCH_SIGNALS = 'dmax-patch-signals'
    const SSE_DATA_DMAX_ELEMENTS = 'dmaxElements'
    const SSE_DATA_DMAX_SIGNALS = 'dmaxSignals'
    const PATCH_MODE_OUTER = 'outer'
    const PATCH_MODE_INNER = 'inner'
    const PATCH_MODE_REPLACE = 'replace'
    const PATCH_MODE_PREPEND = 'prepend'
    const PATCH_MODE_APPEND = 'append'
    const PATCH_MODE_BEFORE = 'before'
    const PATCH_MODE_AFTER = 'after'
    const PATCH_MODE_REMOVE = 'remove'

    function parseSseElements(html, namespace) {
      if (!html) return []
      const ns = (namespace || 'html').toLowerCase()
      if (ns === 'html') {
        _HTML_PARSE_TEMPLATE.innerHTML = html
        const out = []
        for (let el = _HTML_PARSE_TEMPLATE.content.firstElementChild; el; el = el.nextElementSibling) out.push(el)
        return out
      }
      const wrap = ns === 'svg'
        ? `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`
        : `<math xmlns="http://www.w3.org/1998/Math/MathML">${html}</math>`
      const doc = new DOMParser().parseFromString(wrap, ns === 'svg' ? 'image/svg+xml' : 'application/xml')
      const root = doc.documentElement
      return root ? Array.from(root.children) : []
    }

    function insertFragmentRelative(target, sourceEls, mode) {
      if (!target || !sourceEls || !sourceEls.length) return
      const frag = document.createDocumentFragment()
      for (const src of sourceEls) frag.appendChild(src.cloneNode(true))
      if (mode === 'append') target.appendChild(frag)
      else if (mode === 'prepend') target.insertBefore(frag, target.firstChild || null)
      else if (mode === 'before' && target.parentNode) target.parentNode.insertBefore(frag, target)
      else if (mode === 'after' && target.parentNode) target.parentNode.insertBefore(frag, target.nextSibling)
    }

    function applyPatchPair(targetEl, srcEl, mode) {
      if (!targetEl || !srcEl) return
      if (mode === PATCH_MODE_REPLACE) targetEl.replaceWith(srcEl.cloneNode(true))
      else if (mode === PATCH_MODE_INNER) {
        const to = targetEl.cloneNode(false)
        for (let ch = srcEl.firstChild; ch; ch = ch.nextSibling) to.appendChild(ch.cloneNode(true))
        morphChildren(targetEl, to)
      } else morph(targetEl, srcEl)
    }

    function applyPatchSource(srcEl, mode) {
      if (srcEl.id) applyPatchPair(document.getElementById(srcEl.id), srcEl, mode)
      else console.warn('[dmax] dmax-patch-elements without selector requires element ids')
    }

    function applyDmaxPatchElements(args) {
      const mode = String(args.mode || PATCH_MODE_OUTER).toLowerCase()
      const selector = args.selector ? String(args.selector) : ''
      const namespace = args.namespace ? String(args.namespace) : 'html'
      const sourceEls = parseSseElements(args[SSE_DATA_DMAX_ELEMENTS] || '', namespace)

      if (mode === PATCH_MODE_REMOVE) {
        if (selector) for (const t of document.querySelectorAll(selector)) t.remove()
        else for (const src of sourceEls) {
          if (src.id) document.getElementById(src.id)?.remove()
          else console.warn('[dmax] dmax-patch-elements remove without selector requires element ids')
        }
        return
      }

      if (mode === PATCH_MODE_APPEND || mode === PATCH_MODE_PREPEND || mode === PATCH_MODE_BEFORE || mode === PATCH_MODE_AFTER) {
        if (!selector || !sourceEls.length) return
        for (const t of document.querySelectorAll(selector)) insertFragmentRelative(t, sourceEls, mode)
        return
      }

      if (selector) {
        if (!sourceEls.length) return
        const targets = getPatchTargets(selector)
        // sourceEls is non-empty here; fallback to first source when targets outnumber sources.
        const defaultSrc = sourceEls[0]
        for (let i = 0; i < targets.length; i++) applyPatchPair(targets[i], sourceEls[i] || defaultSrc, mode)
        return
      }

      if (!sourceEls.length) return
      if (sourceEls.length === 1) {
        applyPatchSource(sourceEls[0], mode)
        return
      }
      for (const src of sourceEls) applyPatchSource(src, mode)
    }

    function applyJsonMergePatch(prev, patch) {
      if (patch === null) return JSON_MERGE_DELETE
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch
      const out = (prev && typeof prev === 'object' && !Array.isArray(prev)) ? { ...prev } : {}
      for (const k of Object.keys(patch)) {
        const next = applyJsonMergePatch(out[k], patch[k])
        if (next === JSON_MERGE_DELETE) delete out[k]
        else out[k] = next
      }
      return out
    }

    function applyDmaxPatchSignals(aName, args) {
      const raw = args[SSE_DATA_DMAX_SIGNALS]
      if (!raw) return
      let patchObj = null
      try { patchObj = JSON.parse(raw) } catch (_e) { return }
      if (!patchObj || typeof patchObj !== 'object' || Array.isArray(patchObj)) return
      const onlyIfMissing = String(args.onlyIfMissing || '').toLowerCase() === 'true'
      for (const root of Object.keys(patchObj)) {
        if (onlyIfMissing && _dm.has(root)) continue
        const next = applyJsonMergePatch(_dm.get(root), patchObj[root])
        if (next === JSON_MERGE_DELETE) {
          if (_dm.has(root)) {
            setSignalAndNotifySubsNLevelsDeep(aName, { kind: SIGNAL, not: null, root, path: null }, undefined)
            _dm.delete(root)
            updateDebug()
          }
        } else {
          setSignalAndNotifySubsNLevelsDeep(aName, { kind: SIGNAL, not: null, root, path: null }, next)
        }
      }
    }

    function applyDmaxSse(raw, aName = 'dmax-sse') {
      if (!raw) return []
      const applied = []
      const text = String(raw)
      const RE_TRAILING_CR = /\r$/
      let curEvent = 'message'
      let curArgs = null
      let hasData = false
      const consumeLine = (line) => {
        if (!line) { flush(); return }
        if (line[0] === ':') return
        const colonIndex = line.indexOf(':')
        const field = colonIndex >= 0 ? line.slice(0, colonIndex) : line
        let val = colonIndex >= 0 ? line.slice(colonIndex + 1) : ''
        if (val[0] === ' ') val = val.slice(1)
        if (field === 'event') curEvent = val || 'message'
        else if (field === 'data') {
          const spaceIndex = val.indexOf(' ')
          if (spaceIndex < 0) return
          const key = val.slice(0, spaceIndex), value = val.slice(spaceIndex + 1)
          if (!curArgs) curArgs = {}
          hasData = true
          if (!curArgs[key]) curArgs[key] = value
          else curArgs[key] += '\n' + value
        }
      }
      const flush = () => {
        if (!hasData || !curArgs) { curEvent = 'message'; curArgs = null; hasData = false; return }
        if (curEvent === SSE_EVENT_DMAX_PATCH_ELEMENTS) {
          applyDmaxPatchElements(curArgs)
          applied.push({ event: curEvent, args: curArgs })
        } else if (curEvent === SSE_EVENT_DMAX_PATCH_SIGNALS) {
          applyDmaxPatchSignals(aName, curArgs)
          applied.push({ event: curEvent, args: curArgs })
        }
        curEvent = 'message'
        curArgs = null
        hasData = false
      }
      let start = 0
      for (let end = 0; end < text.length; end++) {
        if (text[end] !== '\n') continue
        consumeLine(text.slice(start, end).replace(RE_TRAILING_CR, ''))
        start = end + 1
      }
      if (start < text.length) consumeLine(text.slice(start).replace(RE_TRAILING_CR, ''))
      flush()
      return applied
    }

    // Consume a text/event-stream response body incrementally using the Streams API.
    // Applies dmax-patch-elements and dmax-patch-signals events as each SSE event
    // arrives rather than after the full response is buffered, lowering first-update
    // latency and peak memory for large or long-lived streams.
    // Falls back gracefully when the browser/environment does not expose a ReadableStream body.
    // onOpen() is called once when the first chunk arrives; onClose(err) when the stream ends.
    async function consumeDmaxSseStream(body, aName, onOpen, onClose) {
      if (!body || typeof body.getReader !== 'function') return []
      const applied = []
      const reader = body.getReader()
      const decoder = new TextDecoder()
      const RE_TRAILING_CR = /\r$/
      let buf = ''
      let curEvent = 'message', curArgs = null, hasData = false
      let opened = false

      const flush = () => {
        if (!hasData || !curArgs) { curEvent = 'message'; curArgs = null; hasData = false; return }
        if (curEvent === SSE_EVENT_DMAX_PATCH_ELEMENTS) {
          applyDmaxPatchElements(curArgs)
          applied.push({ event: curEvent, args: curArgs })
        } else if (curEvent === SSE_EVENT_DMAX_PATCH_SIGNALS) {
          applyDmaxPatchSignals(aName, curArgs)
          applied.push({ event: curEvent, args: curArgs })
        }
        curEvent = 'message'; curArgs = null; hasData = false
      }

      const consumeLine = (line) => {
        if (!line) { flush(); return }
        if (line[0] === ':') return
        const ci = line.indexOf(':')
        const field = ci >= 0 ? line.slice(0, ci) : line
        let val = ci >= 0 ? line.slice(ci + 1) : ''
        if (val[0] === ' ') val = val.slice(1)
        if (field === 'event') curEvent = val || 'message'
        else if (field === 'data') {
          const si = val.indexOf(' ')
          if (si < 0) return
          const key = val.slice(0, si), value = val.slice(si + 1)
          if (!curArgs) curArgs = {}
          hasData = true
          if (!curArgs[key]) curArgs[key] = value
          else curArgs[key] += '\n' + value
        }
      }

      let streamErr = null
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (!opened) { opened = true; if (onOpen) onOpen() }
          buf += decoder.decode(value, { stream: true })
          let nl
          while ((nl = buf.indexOf('\n')) >= 0) {
            consumeLine(buf.slice(0, nl).replace(RE_TRAILING_CR, ''))
            buf = buf.slice(nl + 1)
          }
        }
        // Flush the TextDecoder and process any remaining partial line
        const trailing = decoder.decode()
        if (trailing) buf += trailing
        if (buf) consumeLine(buf.replace(RE_TRAILING_CR, ''))
        flush()
      } catch (e) {
        streamErr = e
        console.error('[dmax] SSE stream error:', e)
      }
      if (onClose) onClose(streamErr)
      return applied
    }

    // morph tests -------------------------------------------------------

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

    // Form/input state preservation tests
    // WHY: morph updates HTML *attributes* via setAttribute, never DOM *properties* like
    // input.value, textarea.value or input.checked. Once the user modifies a field (marking
    // it "dirty"), the browser decouples the property from the attribute, so setAttribute
    // can change the default value without clobbering what the user typed. This is the same
    // pattern used by idiomorph (Datastar) and paxi (Fixi).
    // To opt out of preservation (i.e. reset a field to the server value), use
    // mode:replace in dmax-patch-elements, which replaces the element entirely.

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

    // --- parity matrix: unusual attribute updates (style, href, data-*, aria) ---

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

    // --- parity matrix: keyed list reconciliation and stable DOM during collection updates ---

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

    // Wait for all sequential async tests (including SSE lifecycle tests above) before signalling completion
    _asyncChain.then(() => {
      window.dispatchEvent(new CustomEvent('dmax:tests:done'))
    }).catch(() => {
      window.dispatchEvent(new CustomEvent('dmax:tests:done'))
    })

    function initLiveDSubExamples() {
      const liveForm = document.getElementById('live-form')
      const liveBtn = document.getElementById('live-btn')
      const liveName = document.getElementById('live-name')
      if (!liveForm || !liveBtn || !liveName) return
      const liveTrigList = '@#live-btn.click@#live-name.value@_window.resize@_document.visibilitychange@_form.submit@_interval.2000@_timeout.1500'
      dSub(liveBtn, `data-sub:#live-raw${liveTrigList}`,
        `JSON.stringify({dm, el: el && el.id, trig: trig && {kind: trig.kind, root: trig.root, path: trig.path}, val, detail})`)
      dSub(liveBtn, `data-sub:#live-branch${liveTrigList}`,
        `trig && trig.kind === '${SPECIAL}' ? ('special:' + trig.root) : (trig && trig.path && trig.path[0] === 'value' ? 'prop-trigger' : 'event-trigger')`)
      liveBtn.addEventListener('click', () => liveName.dispatchEvent(mkEv('change')))
    }
    function installDemoFetchMock() {
      if (window.__dmaxDemoFetchInstalled) return
      const baseFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null
      window.fetch = function (url, init) {
        const u = String(url || '')
        if (u === '/mock/oob') {
          const html = `<div id="oobTarget" data-oob="morph"><strong>OOB morphed content</strong> <span>(via dAction + morph)</span></div>`
          return Promise.resolve({
            ok: true,
            headers: { get: (n) => String(n || '').toLowerCase() === 'content-type' ? 'text/html' : null },
            text: async () => html
          })
        }
        if (u === '/mock/dmax-sse') {
          const bodyText = [
            'event: dmax-patch-signals',
            'data: dmaxSignals {"sseMessage":"hello from dmax","sseCount":1}',
            '',
            'event: dmax-patch-elements',
            'data: mode outer',
            'data: dmaxElements <div id="sseTarget"><strong>SSE morphed target</strong> <span>✓</span></div>',
            ''
          ].join('\n')
          // Provide a streaming body when the Streams API is available so the demo exercises
          // the incremental consumeDmaxSseStream path; fall back to text() otherwise.
          let streamBody = null
          if (typeof ReadableStream !== 'undefined' && typeof TextEncoder !== 'undefined') {
            const encoded = new TextEncoder().encode(bodyText)
            // Split into two chunks to exercise the incremental streaming path
            const half = Math.floor(encoded.length / 2)
            streamBody = new ReadableStream({
              start(ctrl) {
                ctrl.enqueue(encoded.slice(0, half))
                ctrl.enqueue(encoded.slice(half))
                ctrl.close()
              }
            })
          }
          return Promise.resolve({
            ok: true,
            headers: { get: (n) => String(n || '').toLowerCase() === 'content-type' ? 'text/event-stream' : null },
            body: streamBody,
            text: async () => bodyText
          })
        }
        if (baseFetch) return baseFetch(url, init)
        return Promise.reject(new Error('fetch not available'))
      }
      window.__dmaxDemoFetchInstalled = true
    }
    function initPortedExamples() {
      const root = document.getElementById('ported-examples')
      if (!root) return
      const nodes = [root].concat(Array.from(root.querySelectorAll('*')))
      const deferred = []
      for (const n of nodes) {
        for (const a of Array.from(n.attributes || EMPTY_ARR)) {
          if (a.name.indexOf('data-def') === 0) wireNode(n, a.name, a.value)
          else deferred.push([n, a.name, a.value])
        }
      }
      for (const [n, aName, aVal] of deferred) wireNode(n, aName, aVal)
      installDemoFetchMock()
    }
    initLiveDSubExamples()
    window.addEventListener('dmax:tests:done', () => {
      initPortedExamples()
    }, { once: true })

    // Production cleanup path: when DOM nodes are removed, detach all their bound listeners/subscribers.
    // This prevents stale signal subscriptions and detached-node event handlers from accumulating over time.
    function cleanupBoundSubsDeep(rootNode) {
      if (!rootNode || rootNode.nodeType !== 1) { return }
      const matchesSubscriberFn = (entry, fn) => !!entry && !Array.isArray(entry) && typeof entry === 'object' && entry.fn === fn
      const stack = [rootNode]
      while (stack.length) {
        const node = stack.pop()
        const boundSubs = _cleanupBoundSubs.get(node)
        if (boundSubs) {
          for (const l of boundSubs) {
            if (l.type === 'event') l.targetEl.removeEventListener(l.eventName, l.handler)
            else if (l.type === 'signal') {
              const arr = _subs.get(l.root)
              if (arr && arr.length) {
                // Allocate only when we actually find a match to remove.
                let filtered = null
                for (let i = 0; i < arr.length; ++i) {
                  // Before first match: keep `filtered` null (no allocation).
                  // At match: allocate with prefix (matched entry is skipped).
                  // After match: append only non-matching entries.
                  if (matchesSubscriberFn(arr[i], l.fn)) {
                    if (!filtered) filtered = arr.slice(0, i)
                  } else if (filtered) filtered.push(arr[i]) // only append after lazy allocation starts
                }
                if (filtered) _subs.set(l.root, filtered)
              }
            }
            else if (l.type === 'interval') clearInterval(l.id)
            else if (l.type === 'timeout') clearTimeout(l.id)
          }
          _cleanupBoundSubs.delete(node)
        }
        const children = node.children
        for (let i = 0; i < children.length; ++i) stack.push(children[i])
      }
    }
    const observer = new MutationObserver(records => {
      for (const rec of records)
        for (const node of rec.removedNodes)
          cleanupBoundSubsDeep(node)
    })
    observer.observe(document.body, { childList: true, subtree: true })
