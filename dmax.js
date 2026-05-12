// @js-check
    // Returns the index of the first found char (from chars) in the s, or -1 if none found,
    // then you can check s[returnedIndex] to see which char it is.

    const indexFirst = (s, chars, pos = 0) => {
      let i, first = s.length
      for (let c of chars) if ((i = s.indexOf(c, pos)) != -1 && i < first) first = i
      return first === s.length ? -1 : first
    }

    const NIL = Object.freeze([])
    const CAMEL_NAMES = new Map(), KEBAB_NAMES = new Map()
    const kebabToCamel = (s) => {
      if (!s) return s
      let p = s.indexOf('-')
      if (p < 0) {
        CAMEL_NAMES.set(s, s)
        return s
      }
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
      KEBAB_NAMES.set(res, s)
      return res
    }

    const camelToKebab = (s) => {
      if (!s) return s
      let res = KEBAB_NAMES.get(s)
      if (res) return res
      let p = 0
      for (; p < s.length; ++p) {
        const c = s.charCodeAt(p)
        if (c >= 65 && c <= 90) break
      }
      if (p >= s.length) {
        KEBAB_NAMES.set(s, s)
        return s
      }
      res = s.slice(0, p)
      for (; p < s.length; ++p) {
        const c = s[p]
        res += c >= 'A' && c <= 'Z' ? '-' + c.toLowerCase() : c
      }
      KEBAB_NAMES.set(s, res)
      CAMEL_NAMES.set(res, s)
      return res
    }

    // Updated attribute-token syntax reference
    // data-dump@foo-bar-signal+#tpl-id instead of data-dump@foo-bar-signal#tpl-id
    // data-class+zebra-even+!zebra-odd instead of data-class:+zebra-even:~zebra-odd
    // Use ^ for modifiers (trigger guards/timing/options): data-get^no-cache:posts^replace+user.name^query.username
    const MOD = '^', TARG = ':', TRIG = '@', ADD = '+'
    const ALL = [MOD, TARG, TRIG, ADD]
    const MODS = [MOD]

    const DOT = '.', ID = '#', NOT = '!', BRACKET_OPEN = '[', BRACKET_CLOSE = ']'
    const NAME_DELIMS = [DOT, BRACKET_OPEN]
    const SIGNAL = 's', EV_PROP = DOT, SPEC = '_'

    const MOD_WITH_SHAPE = 'with_shape', MOD_SHAPE_ONLY = 'shape_only'
    const MOD_IMMEDIATE = 'immediate', MOD_NOTIMMEDIATE = 'notimmediate'
    const MOD_ONCE = 'once', MOD_ALWAYS = 'always', MOD_DEBOUNCE = 'debounce', MOD_THROTTLE = 'throttle', MOD_PREVENT = 'prevent'
    const MOD_AND = 'and', MOD_EQ = 'eq', MOD_NE = 'ne', MOD_LT = 'lt', MOD_GT = 'gt', MOD_LE = 'le', MOD_GE = 'ge', MOD_VAL = 'val', MOD_RW = 'rw'
    const MOD_JSON = 'json', MOD_TEXT = 'text', MOD_HTML = 'html', MOD_FORM = 'form', MOD_SSE = 'sse'
    const MOD_BUSY = 'busy', MOD_COMPLETE = 'complete', MOD_ERR = 'err', MOD_CODE = 'code'
    const MOD_NO_CACHE = 'noCache', MOD_HEADERS = 'headers', MOD_HEADERS_NO_KEBAB = 'headersNoKebab', MOD_AUTH = 'auth'
    const MOD_BROTLI = 'brotli', MOD_BR = 'br', MOD_GZIP = 'gzip', MOD_DEFLATE = 'deflate', MOD_COMPRESS = 'compress'
    const MOD_REPLACE = 'replace', MOD_MERGE = 'merge', MOD_APPEND = 'append', MOD_PREPEND = 'prepend'
    const MOD_BEFORE = 'before', MOD_AFTER = 'after', MOD_INNER = 'inner', MOD_REMOVE = 'remove', MOD_OUTER = 'outer'
    const MOD_SSE_OPEN = 'open', MOD_SSE_CLOSE = 'close', MOD_RETRY = 'retry', MOD_ABORT = 'abort'
    const MOD_URL = 'url', MOD_BODY = 'body', MOD_HDR = 'header'
    const MOD_SPREAD = 'spread', MOD_SEND_ALL = 'sendAll', MOD_PATCH_ALL = 'patchAll', MOD_SYNC_ALL = 'syncAll'
    const MOD_DEBOUNCE_MS = 500, MOD_THROTTLE_MS = 500, MOD_RETRY_MS = 1000
    const H_ACCEPT = 'accept', H_ACCEPT_ENCODING = 'accept-encoding', H_AUTHORIZATION = 'authorization'
    const H_CACHE_CONTROL = 'cache-control', H_CONTENT_TYPE = 'content-type', H_PRAGMA = 'pragma'
    const ACT_HEADERS_EMPTY = Object.freeze(Object.create(null))
    const ACT_HEADERS_JSON = Object.freeze({ [H_CONTENT_TYPE]: 'application/json', [H_ACCEPT]: 'application/json' })
    const ACT_HEADERS_HTML = Object.freeze({ [H_ACCEPT]: 'text/html' })
    const ACT_HEADERS_FORM = Object.freeze({ [H_CONTENT_TYPE]: 'application/x-www-form-urlencoded' })
    const ACT_HEADERS_TEXT = Object.freeze({ [H_CONTENT_TYPE]: 'text/plain;charset=UTF-8' })
    const ACT_HEADERS_NO_CACHE = Object.freeze({ [H_CACHE_CONTROL]: 'no-cache', [H_PRAGMA]: 'no-cache' })
    const ACT_HEADERS_SSE = Object.freeze({ [H_ACCEPT]: 'text/event-stream', [H_CACHE_CONTROL]: 'no-cache', [H_PRAGMA]: 'no-cache' })
    const SPEC_WIN = 'window', SPEC_DOC = 'document', SPEC_FORM = 'form', SPEC_INTERVAL = 'interval', SPEC_TIMEOUT = 'timeout'
    const SPECS = [SPEC_WIN, SPEC_DOC, SPEC_FORM, SPEC_INTERVAL, SPEC_TIMEOUT]
    const SPEC_WIN_EV = 'resize'
    const SPEC_DOC_EV = 'visibilitychange'
    const SPEC_INTERVAL_MS = 500
    const SPEC_TIMEOUT_MS = 500
    const ACT_METHODS = Object.freeze({ get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE' })
    const E_RW_REQ = `dSub ${MOD}${MOD_RW} requires an element/property trigger in:`
    const E_RW_EL = `dSub ${MOD}${MOD_RW} source element is not found in trigger:`
    const E_RW_EV = `dSub ${MOD}${MOD_RW} event is not found in trigger:`
    const E_TRIG_EL = 'Element is not found in trigger:', E_TRIG_EV = 'Event is not found in trigger:', E_FORM_EL = 'Form element is not found for trigger:'
    const DEFAULT_PROP_TAR = Object.freeze({ kind: EV_PROP, not: null, root: '', path: null, mods: NIL }), RE_DIGITS = /^\d+$/
    const DUMP_STATES = new WeakMap(), DUMP_ATTRS = new WeakMap()
    const isSpec = (n) => { if (n.startsWith(SPEC)) for (const s of SPECS) if (n.startsWith(s, 1)) return true; return false }
    const _KIND = [MOD, SIGNAL, EV_PROP, SPEC]
    // Returns {kind:_KIND, not:null|bool, root:null|name, path:null|[...names] } or null for invalid item
    const parseItem = (aName, type, n, pos = 0) => {
      if (!n) return null

      let p = pos
      while (n.startsWith(NOT, p)) ++p
      let not = p == 0 ? null : p % 2 != 0

      let d = indexFirst(n, NAME_DELIMS, p)
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
        if (id || isSpec(root)) {
          kind = id ? EV_PROP : SPEC
          root = root.slice(1)
          if (!root) { console.error('[dmax] Error: The', kind, 'element should have a non empty name:', n, 'in:', aName); return null }
        } else {
          kind = SIGNAL
          root = kebabToCamel(root)
        }
      }

      if (d < 0 && !root && not !== null) { console.error('[dmax] Error: The', kind, 'element should not have just', NOT, 'alone in:', n); return null }
      if (d < 0 || (n[d] === DOT && d + 1 == n.length)) return { kind, not, root, path: null }

      p = d
      let path = []
      while (p >= 0 && p < n.length) {
        const c = n[p]
        if (c === DOT) {
          const partStart = ++p
          d = indexFirst(n, NAME_DELIMS, p)
          const part = n.slice(partStart, p = d < 0 ? n.length : d)
          if (!part) { console.error('[dmax] Error: Path should not have an empty part:', n, 'in:', aName); return null }
          path.push(kebabToCamel(part))
          continue
        }
        if (c === BRACKET_OPEN) {
          d = n.indexOf(BRACKET_CLOSE, p + 1)
          if (d < 0) { console.error('[dmax] Error: Missing closing bracket in path:', n, 'in:', aName); return null }
          const part = n.slice(p + 1, d)
          if (!isDigitsOnly(part)) { console.error('[dmax] Error: Only constant numeric bracket indices are supported, found:', part, 'in:', n, 'at:', aName); return null }
          path.push(part)
          p = d + 1
          continue
        }
        console.error('[dmax] Error: Unexpected path token in:', n, 'in:', aName)
        return null
      }
      return { kind, not, root, path }
    }

    const finishParse = (items, p, it, aName) => {
      items[MOD] ??= NIL
      if (it === ALL) {
        items[TARG] ??= NIL
        items[TRIG] ??= NIL
        items[ADD] ??= NIL
      }
      if (it !== MODS && p < aName.length) console.warn('[dmax] Warning: Not everything is parsed "', aName.slice(p), '" in', aName)
      return [items, p]
    }

    const parse = (aName, p = 'data-'.length, it = ALL) => {
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
          if (p >= aName.length || (it === MODS && aName[p] != MOD)) return finishParse(items, p, it, aName)
        } else if (p >= aName.length || aName[p] != MOD) {
          item.mods = items[MOD] ?? NIL
          ts.push(item);
        } else {
          [modItems, p] = parse(aName, p, MODS)
          let mods = modItems[MOD]
          if (items[MOD]) mods = mods.length ? mods.concat(items[MOD]) : items[MOD].slice()
          item.mods = mods
          ts.push(item)
        }
      }
      return finishParse(items, p, it, aName)
    }

    const _parseCache = new Map()
    const parseCached = (aName) => { let r = _parseCache.get(aName); if (!r) _parseCache.set(aName, r = parse(aName)[0]); return r }

    const RETURN_THEN = [' ', '(', '{', ';', '[', '"', '\'', '\n', '\r', '\t']

    // args available in right data-attr value expression, `trig` maybe null for no triggers or any of the _KIND except MOD
    const FN_ARGS = ['dm', 'el', 'trig', 'val', 'detail']

    const _compiledFnCache = new Map()
    const compileFn = (aVal, aName, args = FN_ARGS) => {
      const cacheKey = args === FN_ARGS ? aVal + '\x00' + aName : null
      if (cacheKey !== null && _compiledFnCache.has(cacheKey)) return _compiledFnCache.get(cacheKey)
      let val = '' + aVal
      const returnPos=val.indexOf('return')
      let body=returnPos!=-1 && (returnPos+6 >= val.length || indexFirst(val, RETURN_THEN, returnPos+6) == returnPos+6) ? val : `return(${val})`
      body = `try{ ${body} }catch(e){ console.error('[dmax] Error: eval ${aName} value as function:', e.message, '>>>', ${val}); return }`
      let fn;
      try { fn = Function(...args, body) }
      catch (e) { console.error(`Error compiling ${aName} value to function:`, e.message, '>>>', val); return }
      if (cacheKey !== null) _compiledFnCache.set(cacheKey, fn)
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
    const dDef = (el, aName, aVal) => {
      const it = parseCached(aName), tars = it[TARG]
      if (it[MOD].length || it[TRIG].length || it[ADD].length) console.warn('[dmax] Warning: Supports only targets but found more:', aName)
      let fn = compileFn(aVal, aName)
      if (!fn) return
      let val = aVal ? fn(DM, el, null) : null
      if (tars.length) {
        for (const t of tars) {
          if (t.kind != SIGNAL) { console.error('[dmax] Error: Only signal targets are supported but found:', t, 'in', aName); continue }
          if (t.mods.length) console.warn('[dmax] Warning: Mods are not supported:', t.mods, 'in', aName)
          _dm.set(t.root, val)
        }
      } else if (val && typeof val === 'object') {
        for (const t in val)
          _dm.set(kebabToCamel(t), val[t])
      } else {
        console.error('[dmax] Error: Attribute', aName, 'value should contain object with signal fields, but found', aVal)
      }
    }

    const dDebug = (el) => { if (el) {_debugEls.add(el); updateDebug() } }
    const getElById = (id, aName) => {
      const el = document.getElementById(id)
      if (!el) console.error(`[dmax] Error: element #${id} from ${aName} is not found`)
      return el
    }
    const getDefaultProp = (el) => { const t = el.type, n = el.tagName; return t === 'checkbox' || t === 'radio' ? 'checked' : n === 'INPUT' || n === 'SELECT' || n === 'TEXTAREA' ? 'value' : 'textContent' }
    const getDefaultEv = (el) => { const n = el.tagName; return n === 'FORM' ? 'submit' : n === 'INPUT' || n === 'SELECT' || n === 'TEXTAREA' ? 'change' : 'click' }
    const getElPropVal = (el, propPath) => {
      if (!el) return null
      const prop = propPath && propPath.length ? propPath[0] : getDefaultProp(el)
      let val = el[prop]
      if (val === undefined && el.getAttribute) {
        val = el.getAttribute(camelToKebab(prop))
      }
      return propPath && propPath.length > 1 ? getPropValAndDepth(val, propPath.slice(1))[0] : val
    }

    const isDefaultPropName = (el, prop) => prop === getDefaultProp(el) || prop === 'value' || prop === 'checked' || prop === 'textContent'

    const mkEv = (nam) => {
      try { return new Event(nam, { bubbles: true }) }
      catch (_) {
        const ev = document.createEvent('Event')
        ev.initEvent(nam, true, true)
        return ev
      }
    }

    const isNil = (v) => v === null || v === undefined

    const getPropValAndDepth = (obj, path, depth = -1) => {
      let v = obj
      if (isNil(v) || !path) return [v, 0]
      let n = depth == -1 || depth > path.length ? path.length : depth
      for (let i = 0; i < n; ++i) if (isNil(v = v[path[i]])) return [v, i + 1]
      return [v, n]
    }

    const VAL_CHANGE_DEPTH_MAX = 32
    const valChangedDeep = (before, after, depth = 0) => {
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

    const expected = (cond, ctx = 'expect') => {
      if (cond) return true
      console.error('[dmax] Unexpected condition in:', ctx)
      return false
    }

    const setProp = (el, aName, tar, val) => {
      if (!expected(tar.kind === EV_PROP)) return null;
      let obj = tar.root ? getElById(tar.root, aName) : el
      let path = tar.path, prop = null
      if (!path)
        prop = getDefaultProp(obj);
      else if (path.length > 0) {
        [obj] = getPropValAndDepth(obj, path, path.length - 1)
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

    const getComputedDisplay = (el) => (typeof window !== 'undefined' && window.getComputedStyle) ? window.getComputedStyle(el).display : ''

    const applyClassValue = (adds, tarEl, val) => {
      for (let i=0;i<adds.length;++i) {
        const add=adds[i], name=camelToKebab(add.root)
        if (add.not ? !val : !!val) tarEl.classList.add(name)
        else tarEl.classList.remove(name)
      }
    }

    const applyDisplayValue = (tarEl, hadInline, origDisp, val) => {
      const d = tarEl.style.display
      if (!val){if (d !== 'none') tarEl.style.display='none';return}
      if (hadInline) tarEl.style.display=origDisp
      else if (d === 'none' || getComputedDisplay(tarEl) === 'none') tarEl.style.display=origDisp
      else tarEl.style.removeProperty('display')
    }

    const diffShapeShallow = (before, after) => {
      let b = before, a = after
      if (!b || typeof b != 'object') b = NIL
      if (!a || typeof a != 'object') a = NIL

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

    const samePath = (a, b) => {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; ++i)
        if (a[i] !== b[i]) return false
      return true
    }

    const SIG_CHANGED_ANY = 0, SIG_CHANGED_WITH_SHAPE = 1, SIG_CHANGED_SHAPE_ONLY = 2
    const getSigChangeShape = (mods) => {
      for (const m of mods) {
        if (m.root === MOD_WITH_SHAPE) return SIG_CHANGED_WITH_SHAPE
        if (m.root === MOD_SHAPE_ONLY) return SIG_CHANGED_SHAPE_ONLY
      }
      return SIG_CHANGED_ANY
    }

    const isImmediateMod = (mods, defaultVal) => {
      for (const m of mods) {
        if (m.root === MOD_IMMEDIATE) return true
        if (m.root === MOD_NOTIMMEDIATE) return false;
      }
      return defaultVal;
    }

    const pickMods = (localMods, fallbackMods) => localMods.length ? localMods : fallbackMods

    const getModValPath = (mods) => {
      for (const m of mods) if (m.root === MOD_VAL) {
        const p = m.path
        if (p === null || p === undefined) return NIL
        if (typeof p === 'string') return [p]
        if (Array.isArray(p)) return p
        if (p.kind) {
          if (!p.root) return p.path || NIL
          return p.path && p.path.length ? [p.root, ...p.path] : [p.root]
        }
        return [p]
      }
      return NIL
    }
    const getTrigEventVal = (tarEl, propPath, mods) => {
      const valPath = getModValPath(mods)
      return getElPropVal(tarEl, valPath.length ? valPath : propPath)
    }
    const getTrigPropTarget = (el, aName, trig, mods, missElMsg, missEvMsg, useValPath = true) => {
      const trigRoot = trig?.root || '', trigPath = trig?.path
      const tarEl = trigRoot ? getElById(trigRoot, aName) : el
      if (!tarEl) { console.error('[dmax] Error:', missElMsg, trig ?? DEFAULT_PROP_TAR, 'in:', aName); return null }
      let ev = trigPath && trigPath.length ? trigPath[0] : null
      let propPath = null
      if (ev && isDefaultPropName(tarEl, ev)) propPath = trigPath, ev = getDefaultEv(tarEl)
      if (useValPath) {
        const valPath = getModValPath(mods)
        if (valPath.length) propPath = valPath
      }
      ev = ev ?? getDefaultEv(tarEl)
      if (!ev) { console.error('[dmax] Error:', missEvMsg, trig ?? DEFAULT_PROP_TAR, 'in:', aName); return null }
      return { tarEl, ev, propPath, tar: { kind: EV_PROP, not: null, root: trigRoot, path: propPath, mods: NIL } }
    }
    const addNonSigTrigSub = (el, trig, mods, fn, elSubs, ranImmediate, propTar = null) => {
      const isSpec = trig.kind === SPEC, hasTar = propTar !== null
      console.assert(isSpec || hasTar);if (!isSpec && !hasTar) return null
      const ev = trig.path?.[0]
      const subTarEl = isSpec ? null : propTar.tarEl, subEv = isSpec ? ev : propTar.ev, subPropPath = isSpec ? null : propTar.propPath
      const modded = addTrigSub(el, trig, mods, fn, elSubs, subTarEl, subEv, subPropPath)
      if (modded && !ranImmediate && isImmediateMod(mods, false) && (!isSpec || trig.root === SPEC_FORM)) {
        ranImmediate = true
        invokeSub(modded, null, isSpec ? null : getTrigEventVal(propTar.tarEl, propTar.propPath, mods), el, trig)
      }
      return ranImmediate
    }

    const PERMIT_MODS = Object.assign(Object.create(null), {
      [MOD_AND]: 1, [MOD_EQ]: 1, [MOD_NE]: 1, [MOD_LT]: 1, [MOD_GT]: 1, [MOD_LE]: 1, [MOD_GE]: 1
    })

    const getSigVal = (it) => {
      const sig = _dm.get(it.root)
      const path = it.path
      return path && path.length ? getPropValAndDepth(sig, path)[0] : sig
    }
    const getSigValOrIt = (it) => {
      if (!it.kind) return it
      const val = getSigVal(it)
      return it.not ? !val : val
    }

    const resolveModPathVal = (v) => {
      if (v && v.kind) return getSigValOrIt(v)
      if (typeof v !== 'string') return v
      if (_dm.has(v)) return _dm.get(v)
      const parsed = parseItem('mod', TRIG, v)
      if (!parsed || !parsed.kind) return v
      if (parsed.kind === SIGNAL && !parsed.path && !_dm.has(parsed.root)) return v
      return getSigValOrIt(parsed)
    }

    const resolveHtmlSelector = (modPath) => {
      const v = resolveModPathVal(modPath)
      if (typeof v === 'string' && v) {
        const c = v[0]; return (c === '#' || c === '.' || c === '[' || c === '*' || c === ':') ? v : '#' + v
      }
      return ''
    }
    const resolveStatusSig = (mod, fallbackRoot) => {
      if (!mod) return null
      const p = mod.path
      if (typeof p === 'string') return { kind: SIGNAL, not: null, root: p || fallbackRoot, path: null }
      if (p && p.kind === SIGNAL) return p
      return { kind: SIGNAL, not: null, root: fallbackRoot, path: null }
    }

    const defSig = (sig, val) => {
      if (sig && !_dm.has(sig.root)) _dm.set(sig.root, val)
      return sig
    }

    const isJsonContentType = (ct) => {
      const low = String(ct || '').toLowerCase()
      if (low.indexOf('application/json') !== -1) return true
      const p = low.indexOf('+json')
      if (p < 0) return false
      const end = p + 5
      if (end >= low.length) return true
      const c = low[end]
      return c === ';' || c === ' ' || c === '\t'
    }

    const isPlainObj = (val) => !!val && typeof val === 'object' && !Array.isArray(val)

    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

    const cloneOwnProps = (obj) => {
      const out = Object.create(null)
      for (const key in obj) if (hasOwn(obj, key)) out[key] = obj[key]
      return out
    }

    const mergeActionHeaders = (base, extra) => {
      if (!base || base === ACT_HEADERS_EMPTY) return extra || ACT_HEADERS_EMPTY
      if (!extra || extra === ACT_HEADERS_EMPTY) return base
      const out = cloneOwnProps(base)
      for (const key in extra) if (hasOwn(extra, key)) out[key] = extra[key]
      return Object.freeze(out)
    }

    const buildActionBaseHeaders = (isJson, isText, isHtml, isForm, isSse, noCache, enc) => {
      let headers = isJson ? ACT_HEADERS_JSON : isForm ? ACT_HEADERS_FORM : isText ? ACT_HEADERS_TEXT : ACT_HEADERS_EMPTY
      if (isHtml) headers = mergeActionHeaders(headers, ACT_HEADERS_HTML)
      headers = isSse ? mergeActionHeaders(headers, ACT_HEADERS_SSE) : noCache ? mergeActionHeaders(headers, ACT_HEADERS_NO_CACHE) : headers
      if (!enc) return headers
      const out = headers === ACT_HEADERS_EMPTY ? Object.create(null) : cloneOwnProps(headers)
      out[H_ACCEPT_ENCODING] = enc
      return Object.freeze(out)
    }

    const isDigitsOnly = (s) => typeof s == 'string' && RE_DIGITS.test(s)

    const buildDumpItemRef = (sigRoot, sigPath, idx) => {
      let out = sigRoot
      if (sigPath && sigPath.length) for (const part of sigPath) out += '.' + part
      return out + '.' + idx
    }

    const buildDumpItemExpr = (sigRoot, sigPath, idx) => {
      let out = 'dm.' + sigRoot
      if (sigPath && sigPath.length) for (const part of sigPath) out += isDigitsOnly(part) ? '[' + part + ']' : '.' + part
      return out + '[' + idx + ']'
    }

    const replaceDumpTokens = (s, itemToken, indexToken) => {
      if (typeof s !== 'string') return s
      let i = s.indexOf('$')
      if (i < 0) return s
      let out = '', p = 0
      while (i >= 0) {
        let next = null, step = 0
        if (s.startsWith('$item', i)) next = itemToken, step = 5
        else if (s.startsWith('$index', i)) next = indexToken, step = 6
        if (!step) { i = s.indexOf('$', i + 1); continue }
        out += s.slice(p, i) + next
        p = i + step
        i = s.indexOf('$', p)
      }
      return out ? out + s.slice(p) : s
    }

    const rewriteDumpBindings = (rootNode, itemRef, itemExpr, indexText) => {
      const stack = [rootNode]
      while (stack.length) {
        const node = stack.pop()
        const attrs = node.attributes || NIL
        let nextAttrs = null
        for (let i = attrs.length - 1; i >= 0; --i) {
          const attr = attrs[i]
          const nextName = replaceDumpTokens(attr.name, itemRef, indexText)
          const nextVal = replaceDumpTokens(attr.value, itemExpr, indexText)
          if (nextName !== attr.name || nextVal !== attr.value) {
            if (!nextAttrs) {
              // Keep a parallel attribute list for later wiring because HTML accepts
              // some static directive names that DOM setAttribute rejects when recreated.
              nextAttrs = []
              for (let j = attrs.length - 1; j > i; --j) nextAttrs.push([attrs[j].name, attrs[j].value])
            }
            if (nextName === attr.name) attr.value = nextVal
          }
          if (nextAttrs) nextAttrs.push([nextName, nextVal])
        }
        if (nextAttrs) DUMP_ATTRS.set(node, nextAttrs)
        const children = node.children
        for (let i = children.length - 1; i >= 0; --i) stack.push(children[i])
      }
    }

    const wireDumpClone = (node) => {
      const stack = [node]
      while (stack.length) {
        const el = stack.pop()
        const dumpAttrs = DUMP_ATTRS.get(el)
        if (dumpAttrs && dumpAttrs.length) {
          for (let i = 0; i < dumpAttrs.length; ++i) globalThis.wireNode(el, dumpAttrs[i][0], dumpAttrs[i][1])
        } else {
          const attrs = el.attributes || NIL
          for (let i = 0; i < attrs.length; ++i) {
            const attr = attrs[i]
            globalThis.wireNode(el, attr.name, attr.value)
          }
        }
        const children = el.children
        for (let i = children.length - 1; i >= 0; --i) stack.push(children[i])
      }
    }

    const renderDumpState = (el, trig, dumpState, tplFirst, sigRoot, sigPath) => {
      const val = getSigValOrIt(trig)
      if (!Array.isArray(val)) return
      const newLen = val.length, oldLen = dumpState.count || 0
      if (newLen < oldLen) {
        for (let i = 0; i < oldLen - newLen; i++) {
          const node = dumpState.nodes.pop()
          if (node && node.parentNode) node.parentNode.removeChild(node)
        }
        dumpState.count = newLen
      }
      if (newLen > oldLen) {
        const frag = document.createDocumentFragment()
        for (let idx = oldLen; idx < newLen; idx++) {
          try {
            const node = tplFirst.cloneNode(true)
            const idxText = String(idx)
            rewriteDumpBindings(node, buildDumpItemRef(sigRoot, sigPath, idx), buildDumpItemExpr(sigRoot, sigPath, idx), idxText)
            frag.appendChild(node)
            dumpState.nodes.push(node)
          } catch { }
        }
        el.appendChild(frag)
        for (let i = dumpState.nodes.length - (newLen - oldLen); i < dumpState.nodes.length; ++i) wireDumpClone(dumpState.nodes[i])
        dumpState.count = newLen
      }
    }

    const mergeActionVals = (prev, next) => {
      if (Array.isArray(prev) && Array.isArray(next)) return prev.concat(next)
      if (!isPlainObj(prev) || !isPlainObj(next)) return next
      const out = Object.create(null)
      for (const k in prev) if (hasOwn(prev, k)) out[k] = prev[k]
      for (const k in next) if (hasOwn(next, k)) out[k] = hasOwn(out, k) ? mergeActionVals(out[k], next[k]) : next[k]
      return out
    }

    const combineActionResult = (prev, next, mode) => {
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

    const patchMatchingSigs = (aName, payload, resultMode) => {
      // Patch-all operates on top-level object fields only; arrays have no stable field names to map onto root signals.
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return
      for (const key in payload) {
        if (!hasOwn(payload, key)) continue
        const root = kebabToCamel(key)
        if (!_dm.has(root)) continue
        const prev = _dm.get(root)
        setSigAndNotifySubsNLevelsDeep(aName, { kind: SIGNAL, not: null, root, path: null }, combineActionResult(prev, payload[key], resultMode))
      }
    }

    const applyActionPayload = (aName, resultTar, payload, resultMode) => {
      if (!resultTar) return
      const prev = getSigValOrIt(resultTar)
      setSigAndNotifySubsNLevelsDeep(aName, resultTar, combineActionResult(prev, payload, resultMode))
    }

    const modsPermitVal = (mods, val) => {
      for (const m of mods) {
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
    const upsert = (map, key) => {
      let list = map.get(key)
      if (!list) map.set(key, list = [])
      return list
    }
    const removeSigSub = (sub) => {
      const subs = _subs.get(sub.trig.root)
      if (!subs || !subs.length) return
      for (let i = 0; i < subs.length; ++i) if (subs[i] === sub) { subs.splice(i, 1); return }
    }
    const clearSubId = (sub) => {
      if (sub.trig.root === SPEC_INTERVAL) clearInterval(sub.clearId)
      else clearTimeout(sub.clearId)
      sub.clearId = null
    }
    const removeSubOrClearId = (sub) => {
      try {
        const ev = sub.ev
        if (ev) ev.tarEl.removeEventListener(ev.evName, sub.fn, ev.opts)
        else if (sub.clearId != null) clearSubId(sub)
        else removeSigSub(sub)
      } catch (_) {
      }
    }
    const PASSIVE_LISTENER_OPTS = Object.freeze({ passive: true })
    const ELEMENT_NODE = 1
    const invokeSub = (fn, detail, trigVal, el, trig) => fn(DM, el, trig, trig.kind === SIGNAL ? getSigVal(trig) : trigVal, detail)
    const invokeBoundSub = (sub, detail) => sub.fn(DM, sub.el, sub.trig, sub.trig.kind === SIGNAL ? getSigVal(sub.trig) : null, detail)
    const getListenerOpts = (mods) => {
      for (let i = 0; i < mods.length; ++i) if (mods[i].root === MOD_PREVENT) return false
      return PASSIVE_LISTENER_OPTS
    }
    const onIntervalSub = (state) => {
      const detail = { tick: state.tick, ms: state.ms, type: SPEC_INTERVAL }
      state.tick++
      try { invokeSub(state.sub.fn, detail, state.ms, state.sub.el, state.sub.trig) }
      catch (e) { console.error(`[dmax] Error: interval handler (${state.ms}ms) failed:`, e?.message ?? e) }
    }
    const onTimeoutSub = (state) => {
      try { invokeSub(state.sub.fn, { tick: 0, ms: state.ms, type: SPEC_TIMEOUT }, state.ms, state.sub.el, state.sub.trig) }
      catch (e) { console.error(`[dmax] Error: timeout handler (${state.ms}ms) failed:`, e?.message ?? e) }
    }
    const addTrigSub = (el, trig, mods, fn, elSubs, tarEl, evName, propPath) => {
      if (trig.kind === SIGNAL) {
        const sub = { el, trig, fn, sigChangeMod: getSigChangeShape(mods), ev: null, clearId: null }
        sub.fn = applyTrigMods(fn, trig, mods, sub)
        upsert(_subs, trig.root).push(sub), (elSubs || upsert(_cleanupBoundSubs, el)).push(sub)
        return sub
      }
      if (trig.kind === SPEC && (trig.root === SPEC_INTERVAL || trig.root === SPEC_TIMEOUT)) {
        const ms = parseInt(evName) || (trig.root === SPEC_INTERVAL ? SPEC_INTERVAL_MS : SPEC_TIMEOUT_MS)
        const sub = { el, trig, fn: null, sigChangeMod: null, ev: null, clearId: null }
        sub.fn = applyTrigMods(fn, trig, mods, sub)
        if (trig.root === SPEC_INTERVAL) sub.clearId = setInterval(onIntervalSub, ms, { sub, ms, tick: 0 })
        else sub.clearId = setTimeout(onTimeoutSub, ms, { sub, ms })
        elSubs.push(sub)
        return sub.fn
      }
      if (trig.kind === SPEC) {
        if (trig.root === SPEC_WIN) {
          evName ||= SPEC_WIN_EV
          tarEl ||= window
        } else if (trig.root === SPEC_DOC) {
          evName ||= SPEC_DOC_EV
          tarEl ||= document
        } else if (trig.root === SPEC_FORM) {
          evName ||= 'submit'
          tarEl ||= el && el.closest ? el.closest('form') : null
          if (!tarEl) { console.error('[dmax] Error:', E_FORM_EL, trig, 'on:', el); return null }
        }
      }
      const opts = getListenerOpts(mods)
      const sub = { el, trig, fn: null, sigChangeMod: null, ev: { tarEl, evName, opts }, clearId: null }
      const modded = applyTrigMods(fn, trig, mods, sub)
      sub.fn = (detail) => {
        const trigVal = trig.kind === SPEC ? detail?.type ?? null : getTrigEventVal(tarEl, propPath, mods)
        invokeSub(modded, detail, trigVal, el, trig)
      }
      tarEl.addEventListener(evName, sub.fn, opts)
      elSubs.push(sub)
      return modded
    }
    const findFirstKind = (items, kind) => {
      for (let i = 0; i < items.length; ++i) if (items[i].kind === kind) return items[i]
      return null
    }
    const updateDebug = () => {
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

    // If sig does not exist in _dm, then create it on demand.
    const setSigAndNotifySubs = (aName, tar, val) => {
      if (!expected(tar)) return null

      const root = tar.root, path = tar.path
      if (!expected(root)) return null

      let sigVal = _dm.get(root), curVal = sigVal, parent = sigVal, d = 0, last = null
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
      for (const h of handlers) {
        const hp = h.trig.path, changeMod = h.sigChangeMod
        if (!hp) {
          if (!path && !diffed && changeMod !== SIG_CHANGED_ANY) {// compare roots if it is the first time
            diffed = true
            diff = diffShapeShallow(curVal, val)
          }
          if (path || changeMod !== SIG_CHANGED_SHAPE_ONLY || diff)
            collected.push([h, path ? null : diff]) // path-based notifications do not forward a root diff
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
            if (!diffed && changeMod !== SIG_CHANGED_ANY) {
              diffed = true
              diff = diffShapeShallow(curVal, val)
            }
            if (changeMod !== SIG_CHANGED_SHAPE_ONLY || diff)
              collected.push([h, diff])
            continue
          }
        }

        // the hp has the longer path based on previous checks, we to check that it actually changed
        // first, check if we did this comparison before
        let hCol = null, p = null
        for (const col of collected) // check if the same
          if ((p = col[0].trig.path) && samePath(p, hp)) { hCol = col; break }

        const pathCur = getPropValAndDepth(sigVal, hp)[0]
        let pathVal
        if (hCol) pathVal = hCol[2]
        else {
          pathVal = getPropValAndDepth(val, hp)[0]
          if (!valChangedDeep(pathCur, pathVal)) continue
        }

        let pathDiffed = false, pathDiff = null
        if (changeMod != SIG_CHANGED_ANY) {
          for (const pd of pathDiffs) if (samePath(pd[0], hp)) { pathDiffed = true; pathDiff = pd[1]; break }
          if (!pathDiffed) {
            pathDiff = diffShapeShallow(pathCur, pathVal)
            pathDiffs.push([hp, pathDiff])
          }
        }

        if (changeMod !== SIG_CHANGED_SHAPE_ONLY || pathDiff)
          collected.push([h, pathDiff, pathVal])
      }

      if (!path) _dm.set(root, val)
      else parent[last] = val

      for (const col of collected) { // notify with new values and diff if asked for
        const h = col[0]
        invokeBoundSub(h, h.sigChangeMod === SIG_CHANGED_ANY ? null : col[1])
      }

      updateDebug()
    }

    let syncDepth = 0, MAX_SYNC_DEPTH = 32;
    const setSigAndNotifySubsNLevelsDeep = (aName, tar, val) => {
      if (syncDepth++ > MAX_SYNC_DEPTH) {
        console.error(`[dmax] Error: Infinite loop detected for signal: ${tar} (depth > ${MAX_SYNC_DEPTH}) in ${aName}`)
        return
      }
      try { return setSigAndNotifySubs(aName, tar, val) } finally { syncDepth-- }
    }

    /**
     * @typedef {(dm?: any, el?: any, trig?: any, trigVal?: any, detail?: any) => void} TriggerHandler
     */

    /**
     * @param {TriggerHandler} fn
     * @param {{ kind: string, root?: string, path?: any, not?: any }} trig
     * @param {Array<{ root: string, path?: any }>} mods
     * @param {{ el?: any, trig: any, fn?: any, sigChangeMod?: any, ev?: { tarEl: EventTarget, evName: string, opts: any } | null, clearId?: any } | undefined} [removeSub]
     * @returns {TriggerHandler}
     */
    const applyTrigMods = (fn, trig, mods, removeSub) => {
      const isSig = trig.kind === SIGNAL
      const isTimer = trig.kind === SPEC && (trig.root === SPEC_INTERVAL || trig.root === SPEC_TIMEOUT)
      const valPath = getModValPath(mods)
      let hasOnce = false, hasAlways = false, hasPrevent = false
      let deb = 0, thr = 0, permitMods = null
      for (const m of mods) {
        if (m.root === MOD_ONCE) hasOnce = true
        else if (m.root === MOD_ALWAYS) hasAlways = true
        else if (m.root === MOD_PREVENT) hasPrevent = true
        else if (!isTimer && m.root === MOD_DEBOUNCE) deb = +(resolveModPathVal(m.path) ?? MOD_DEBOUNCE_MS) || MOD_DEBOUNCE_MS
        else if (!isTimer && m.root === MOD_THROTTLE) thr = +(resolveModPathVal(m.path) ?? MOD_THROTTLE_MS) || MOD_THROTTLE_MS
        else if (m.root in PERMIT_MODS) {
          if (!permitMods) permitMods = []
          permitMods.push(m)
        }
      }
      const hasValPath = !!valPath.length
      const hasSigMods = hasOnce || deb > 0 || thr > 0 || !!permitMods || !!trig.not || hasValPath
      if (isSig && !hasSigMods) return fn
      let tm = 0, last = 0, inDebounce = false
      let debDm = null, debEl = null, debTrig = null, debVal = null, debDetail = null
      let onDebounce = null

      const h = function (dm, el, trigIt, providedVal, detail) {
        trigIt = trigIt || trig
        if (!inDebounce) {
          if (!isSig && hasPrevent) detail?.preventDefault?.()
          if (deb > 0) {
            onDebounce ??= function () {
              inDebounce = true
              try { h(debDm, debEl, debTrig, debVal, debDetail) } finally { inDebounce = false }
            }
            debDm = dm, debEl = el, debTrig = trigIt, debVal = providedVal, debDetail = detail
            clearTimeout(tm)
            tm = setTimeout(onDebounce, deb)
            return
          }
          if (thr > 0) {
            const now = Date.now()
            if (now - last < thr) return
            last = now
          }
        }
        let trigVal = isSig ? (providedVal ?? getSigVal(trigIt)) : (providedVal ?? detail?.detail?.value ?? detail?.detail?.ms ?? detail)
        if (isSig && valPath.length) trigVal = getPropValAndDepth(trigVal, valPath)[0]
        if (trigIt.not) trigVal = !trigVal
        if (permitMods && !modsPermitVal(permitMods, trigVal)) return
        try { fn(dm, el, trigIt, trigVal, detail) } catch (e) { console.error('[dmax] Error: Handler error', e) }
        if (hasOnce && !hasAlways && removeSub) removeSubOrClearId(removeSub) // ^always keeps handler even when ^once is set
      }
      return h
    }
    const _cleanupBoundSubs = new WeakMap() // Track all event boundSubs and signal handlers for cleanup
    const dSub = (el, aName, aVal) => {
      const it = parseCached(aName), tars = it[TARG], trigs = it[TRIG], globMods = it[MOD]
      if (it[ADD].length) console.warn('[dmax] Warning: Supports only targets, triggers, mods but found more:', aName)
      const hasExpr = aVal != null && '' + aVal
      let fn = hasExpr ? compileFn(aVal, aName) : ((a, b, c, v) => v)
      if (hasExpr && !fn) return
      const elSubs = el ? upsert(_cleanupBoundSubs, el) : null
      if (!tars.length && trigs.length) {
        const readTrigs = [], writePropTrigs = [], writeSigTrigs = []
        for (const trig of trigs) {
          const mods = pickMods(trig.mods, globMods); let hasRw = false
          for (let i=0;i<mods.length;i++) if (mods[i].root===MOD_RW) { hasRw = true; break }
          if (hasRw) {
            if (trig.kind !== EV_PROP) { console.error('[dmax] Error:', E_RW_REQ, aName); return }
            const propTar = getTrigPropTarget(el, aName, trig, mods, E_RW_EL, E_RW_EV)
            if (!propTar) return
            writePropTrigs.push({ trig, mods, tarEl: propTar.tarEl, ev: propTar.ev, propPath: propTar.propPath, tar: propTar.tar })
            continue
          }
          readTrigs.push({ trig, mods })
          if (trig.kind === SIGNAL) writeSigTrigs.push(trig)
        }
        if (writePropTrigs.length && readTrigs.length) {
          let ranImmediate = false
          const syncPropTargets = (dm, syncTrig, trigVal, detail) => {
            const exprVal = fn(dm, el, syncTrig, trigVal, detail)
            for (const propTrig of writePropTrigs) setProp(el, aName, propTrig.tar, exprVal)
          }
          for (const readTrig of readTrigs) {
            const trig = readTrig.trig, kind = trig.kind, root = trig.root, path = trig.path, mods = readTrig.mods
            if (kind === SIGNAL) {
              if (!expected(root)) return
              const sub = addTrigSub(el, trig, mods, (dm, _el, syncTrig, trigVal, detail) => syncPropTargets(dm, syncTrig, trigVal, detail), elSubs)
              if (!ranImmediate && isImmediateMod(mods, true)) {
                ranImmediate = true
                invokeBoundSub(sub, null)
              }
            } else if (kind === EV_PROP || kind === SPEC) {
              const propTar = kind === EV_PROP ? getTrigPropTarget(el, aName, trig, mods, E_RW_EL, E_RW_EV) : null
              if (kind === EV_PROP && !propTar) return
              const nextRanImmediate = addNonSigTrigSub(el, trig, mods, (dm, _el, syncTrig, trigVal, detail) => syncPropTargets(dm, syncTrig, trigVal, detail), elSubs, ranImmediate, propTar)
              if (nextRanImmediate == null) return
              ranImmediate = nextRanImmediate
            } else { console.error('[dmax] Error: unsupported trigger kind', kind, 'in', aName); return }
          }
          if (writeSigTrigs.length) {
            for (const propTrig of writePropTrigs) {
              const writeSig = (dm, _el, syncTrig, trigVal, detail) => {
                const exprVal = fn(dm, el, syncTrig, trigVal, detail)
                for (const sigTrig of writeSigTrigs) setSigAndNotifySubsNLevelsDeep(aName, sigTrig, exprVal)
              }
              const moddedHandler = addTrigSub(el, propTrig.trig, propTrig.mods, writeSig, elSubs, propTrig.tarEl, propTrig.ev, propTrig.propPath)
              if (isImmediateMod(propTrig.mods, true)) invokeSub(moddedHandler, null, getTrigEventVal(propTrig.tarEl, propTrig.propPath, propTrig.mods), el, propTrig.trig)
            }
          }
          return
        }
      }
      if (tars.length) {
        const rawFn = fn
        fn = (dm, el, trig, trigVal, detail) => {
          const exprVal = rawFn(dm, el, trig, trigVal, detail)
          let failedTar = null
          try {
            for (const tar of tars) {
              failedTar = tar
              console.assert(tar.kind)
              if (tar.kind == SIGNAL) setSigAndNotifySubsNLevelsDeep(aName, tar, exprVal)
              else setProp(el, aName, tar, exprVal)
            }
          } catch (e) { console.error('[dmax] Error: setting target', failedTar, 'in', aName, 'ended with ex:', e) }
        }
      }
      if (!trigs.length) { if (hasExpr) fn(DM, el, null, null, null); return }
      let ranImmediate = false
      for (let trig of trigs) {
        const kind = trig.kind, root = trig.root, path = trig.path
          const mods = pickMods(trig.mods, globMods)
        if (kind === SIGNAL) {
          if (!expected(root)) return
          const sub = addTrigSub(el, trig, mods, fn, elSubs)
          if (!ranImmediate && isImmediateMod(mods, true)) {
            ranImmediate = true
            invokeBoundSub(sub, null)
          }
        } else if (kind === EV_PROP || kind === SPEC) {
          const propTar = kind === EV_PROP ? getTrigPropTarget(el, aName, trig, mods, E_TRIG_EL, E_TRIG_EV, false) : null
          if (kind === EV_PROP && !propTar) return
          const nextRanImmediate = addNonSigTrigSub(el, trig, mods, fn, elSubs, ranImmediate, propTar)
          if (nextRanImmediate == null) return
          ranImmediate = nextRanImmediate
        } else { console.error('[dmax] Error: unsupported trigger kind', kind, 'in', aName); return }
      }
    }
    // data-class+my-class+!my-other@signal="expr"
    // +className adds when expr is truthy and removes when falsy.
    // +!className inverts that rule.
    // Without aVal, the raw signal or trigger value is used.
    const dClass = (el, aName, aVal) => {
      const it = parseCached(aName), adds = it[ADD], tars = it[TARG], trigs = it[TRIG], globMods = it[MOD]
      if (!adds.length) { console.error('[dmax] Error: dClass requires class names via + syntax in:', aName); return }
      if (!trigs.length) { console.error('[dmax] Error: dClass requires at least one trigger in:', aName); return }
      const propTar = findFirstKind(tars, EV_PROP)
      const tarEl = (propTar && propTar.root) ? getElById(propTar.root, aName) : el
      if (!tarEl) { console.error('[dmax] Error: dClass target element not found in:', aName); return }
      const fn = aVal ? compileFn(aVal, aName) : null
      if (aVal && !fn) return
      const elSubs = upsert(_cleanupBoundSubs, el)
      for (const trig of trigs) {
        const kind = trig.kind, root = trig.root, path = trig.path
        const mods = pickMods(trig.mods, globMods)
        if (kind === SIGNAL) {
          if (!expected(root)) return
          const sub = addTrigSub(el, trig, mods, (dm, sigEl, sigTrig, trigVal, detail) => applyClassValue(adds, tarEl, fn ? fn(dm, sigEl, sigTrig, trigVal, detail) : trigVal), elSubs)
          if (isImmediateMod(mods, false)) invokeBoundSub(sub, null)
        } else if (kind === EV_PROP) {
          const evTarEl = root ? getElById(root, aName) : el
          if (!evTarEl) { console.error('[dmax] Error: dClass element not found in trigger:', trig, 'in:', aName); return }
          const ev = (path && path.length ? path[0] : null) ?? getDefaultEv(evTarEl)
          if (!ev) { console.error('[dmax] Error: dClass event not found in trigger:', trig, 'in:', aName); return }
          const moddedHandler = addTrigSub(el, trig, mods, (dm, _el, _trig, trigVal, detail) => applyClassValue(adds, tarEl, fn ? fn(dm, el, trig, trigVal, detail) : true), elSubs, evTarEl, ev, null)
          if (isImmediateMod(mods, false)) invokeSub(moddedHandler, null, getTrigEventVal(evTarEl, null, mods), el, trig)
        }
      }
    }
    // data-disp:.@signal="expr"
    //   shows/hides the target element based on the truthy/falsy result of the expression
    const dDisp = (el, aName, aVal) => {
      const it = parseCached(aName), tars = it[TARG], trigs = it[TRIG], globMods = it[MOD]
      if (!trigs.length) { console.error('[dmax] Error: dDisp requires at least one trigger in:', aName); return }
      const propTar = findFirstKind(tars, EV_PROP)
      const tarEl = (propTar && propTar.root) ? getElById(propTar.root, aName) : el
      if (!tarEl) { console.error('[dmax] Error: dDisp target element not found in:', aName); return }
      const inline = (tarEl.style && tarEl.style.display) || ''
      const hadInline = inline !== ''
      const computed = getComputedDisplay(tarEl)
      const origDisp=hadInline ? inline : (computed === 'none' || !computed ? 'block' : computed)
      const fn = aVal ? compileFn(aVal, aName) : null
      if (aVal && !fn) return
      const elSubs = upsert(_cleanupBoundSubs, el)
      for (const trig of trigs) {
        const kind = trig.kind, root = trig.root, path = trig.path
        const mods = pickMods(trig.mods, globMods)
        if (kind === SIGNAL) {
          if (!expected(root)) return
          const sub = addTrigSub(el, trig, mods, (dm, sigEl, sigTrig, trigVal, detail) => applyDisplayValue(tarEl, hadInline, origDisp, fn ? fn(dm, sigEl, sigTrig, trigVal, detail) : trigVal), elSubs)
          if (isImmediateMod(mods, false)) invokeBoundSub(sub, null)
        } else if (kind === EV_PROP) {
          const evTarEl = root ? getElById(root, aName) : el
          if (!evTarEl) { console.error('[dmax] Error: dDisp element not found in trigger:', trig, 'in:', aName); return }
          const ev = (path && path.length ? path[0] : null) ?? getDefaultEv(evTarEl)
          if (!ev) { console.error('[dmax] Error: dDisp event not found in trigger:', trig, 'in:', aName); return }
          const moddedHandler = addTrigSub(el, trig, mods, (dm, _el, _trig, trigVal, detail) => applyDisplayValue(tarEl, hadInline, origDisp, fn ? fn(dm, el, trig, trigVal, detail) : true), elSubs, evTarEl, ev, null)
          if (isImmediateMod(mods, false)) invokeSub(moddedHandler, null, getTrigEventVal(evTarEl, null, mods), el, trig)
        }
      }
    }
    // Dispatch data-* attributes to their setup functions.
    const wireNode = (n, an, v) => {
      if (an.indexOf('data-def') === 0) dDef(n, an, v)
      else if (an === 'data-debug') dDebug(n)
      else if (an.indexOf('data-sub') === 0) dSub(n, an, v)
      else if (an.indexOf('data-class') === 0) dClass(n, an, v)
      else if (an.indexOf('data-disp') === 0) dDisp(n, an, v)
      else if (an.indexOf('data-dump') === 0) dDump(n, an)
      else if (an.indexOf('data-get') === 0 || an.indexOf('data-post') === 0 || an.indexOf('data-put') === 0 || an.indexOf('data-patch') === 0 || an.indexOf('data-delete') === 0) dAction(n, an, v)
    }
    globalThis.wireNode=wireNode

    // data-dump@items uses an inline template child and renders immediately by default.
    // data-dump+#tplId@items^shape_only uses an explicit template and shape-only updates.
    // In templates, $item and $index expand in both attribute values and names.
    const dDump = (el, aName) => {
      const it = parseCached(aName), trigs = it[TRIG], adds = it[ADD], globMods = it[MOD]
      if (!trigs.length) { console.error('[dmax] Error: dDump requires a signal trigger in:', aName); return }
      const trig = trigs[0]
      if (trig.kind !== SIGNAL) { console.error('[dmax] Error: dDump trigger must be a signal in:', aName); return }
      const mods = pickMods(trig.mods, globMods)
      let tpl = null
      if (adds.length && adds[0].kind === EV_PROP && adds[0].root) tpl = getElById(adds[0].root, aName)
      if (!tpl) tpl = el.querySelector('template')
      if (tpl && tpl.parentNode === el) tpl.parentNode.removeChild(tpl)
      if (!tpl) { console.error('[dmax] Error: dDump template not found for:', aName); return }
      const tplFirst = tpl.content && tpl.content.firstElementChild
      if (!tplFirst) { console.error('[dmax] Error: dDump template root not found for:', aName); return }
      let dumpState = DUMP_STATES.get(el)
      if (!dumpState) DUMP_STATES.set(el, dumpState = { nodes: [], count: 0 })
      const sigRoot = trig.root
      const sigPath = trig.path

      addTrigSub(el, trig, mods, ()=>renderDumpState(el,trig,dumpState,tplFirst,sigRoot,sigPath), upsert(_cleanupBoundSubs, el))
      if (isImmediateMod(mods, true)) renderDumpState(el,trig,dumpState,tplFirst,sigRoot,sigPath)
    }
    // data-get^busy.busy:result@.click^immediate="url"
    // data-post^json^busy.busy:result@.click+#id.prop+signal="url"
    // data-put^json:result@.click+body="url"
    // data-delete^busy.busy:ok@.click="url"
    // Method is derived from the attribute prefix; aVal is compiled as a URL expression.
    const dAction = (el, aName, aVal) => {
      const afterData = aName.slice(5) // strip 'data-'
      const methodEnd = indexFirst(afterData, ALL, 0)
      const methodName = methodEnd >= 0 ? afterData.slice(0, methodEnd) : afterData
      const method = ACT_METHODS[methodName]
      if (!method) { console.error('[dmax] Error: dAction: unrecognised method prefix in:', aName); return }
      const it = parseCached(aName), tars = it[TARG], trigs = it[TRIG], adds = it[ADD], globMods = it[MOD]
      const urlFn = aVal ? compileFn(aVal, aName) : null
      if (aVal && !urlFn) return
      const resultTar = findFirstKind(tars, SIGNAL)
      let busyMod = null, completeMod = null, errMod = null, codeMod = null
      let isJson = false, isText = false, isHtml = false, isForm = false, isSse = false, noCache = false
      let encBr = false, encGzip = false, encDeflate = false, encCompress = false
      let hdrsMod = null, authMod = null
      let headersNoKebab = false
      let sendAll = false, patchAll = false
      let resultMode = MOD_REPLACE
      let htmlMode = null, htmlDomMod = null
      let openMod = null, closeMod = null, retryMod = null, abortMod = null
      const urlMods = [], bodyMods = [], hdrMods = []
      for (const m of globMods) {
        const mr = m.root
        if (mr === MOD_JSON) isJson = true
        else if (mr === MOD_TEXT) isText = true
        else if (mr === MOD_HTML) isHtml = true
        else if (mr === MOD_FORM) isForm = true
        else if (mr === MOD_SSE) noCache = isSse = true
        else if (mr === MOD_NO_CACHE) noCache = true
        else if (mr === MOD_BROTLI || mr === MOD_BR) encBr = true
        else if (mr === MOD_GZIP) encGzip = true
        else if (mr === MOD_DEFLATE) encDeflate = true
        else if (mr === MOD_COMPRESS) encCompress = true
        else if (mr === MOD_HEADERS && !hdrsMod) hdrsMod = m
        else if (mr === MOD_HEADERS_NO_KEBAB) headersNoKebab = true
        else if (mr === MOD_AUTH && !authMod) authMod = m
        else if (mr === MOD_REPLACE || mr === MOD_MERGE || mr === MOD_APPEND || mr === MOD_PREPEND
               || mr === MOD_BEFORE || mr === MOD_AFTER || mr === MOD_INNER || mr === MOD_REMOVE) {
          resultMode = mr
          if (mr !== MOD_MERGE) { htmlMode = mr; htmlDomMod = m }
        }
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
        else if (mr === MOD_SYNC_ALL) {
          sendAll = true
          patchAll = true
        }
        else if (!sendAll && mr === MOD_SEND_ALL) sendAll = true
        else if (!patchAll && mr === MOD_PATCH_ALL) patchAll = true
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

      const busyStat = resolveStatusSig(busyMod, MOD_BUSY)
      const completeStat = resolveStatusSig(completeMod, MOD_COMPLETE)
      const errStat = resolveStatusSig(errMod, MOD_ERR)
      const codeStat = resolveStatusSig(codeMod, MOD_CODE)
      const openStat = resolveStatusSig(openMod, MOD_SSE_OPEN)
      const closeStat = resolveStatusSig(closeMod, MOD_SSE_CLOSE)
      const abortStat = resolveStatusSig(abortMod, MOD_ABORT)
      // ^retry.N sets the reconnect delay in ms after an unexpected SSE close.
      const retryDelay = retryMod ? (+(resolveModPathVal(retryMod.path) ?? MOD_RETRY_MS) || MOD_RETRY_MS) : 0
      defSig(busyStat, false), defSig(completeStat, false), defSig(errStat, null), defSig(codeStat, null), defSig(openStat, false), defSig(closeStat, false), defSig(abortStat, null)
      let enc = ''
      if (encBr) enc = 'br'
      if (encGzip) enc += (enc ? ', ' : '') + 'gzip'
      if (encDeflate) enc += (enc ? ', ' : '') + 'deflate'
      if (encCompress) enc += (enc ? ', ' : '') + 'compress'
      const baseHeaders = buildActionBaseHeaders(isJson, isText, isHtml, isForm, isSse, noCache, enc)

      const isGetOrDelete = method === 'GET' || method === 'DELETE'
      let activeAbort = null

      const doRequest = async () => {
        const url = urlFn ? urlFn(DM, el, null, null, null) : ''
        if (!url) { console.error('[dmax] Error: dAction: URL is empty in:', aName); return }

        if (busyStat) setSigAndNotifySubsNLevelsDeep(aName, busyStat, true)
        if (completeStat) setSigAndNotifySubsNLevelsDeep(aName, completeStat, false)
        if (errStat) setSigAndNotifySubsNLevelsDeep(aName, errStat, null)
        if (codeStat) setSigAndNotifySubsNLevelsDeep(aName, codeStat, null)

        try {
          const queryParams = Object.create(null), bodyFields = Object.create(null)
          if (sendAll) {
            for (const [sigName, sigVal] of _dm.entries()) bodyFields[sigName] = sigVal
          }
          for (const add of adds) {
            const addKind = add.kind, addRoot = add.root, addPath = add.path
            let val = null, key = null
            if (addKind === EV_PROP) {
              const addEl = addRoot ? getElById(addRoot, aName) : el
              val = addEl ? getElPropVal(addEl, addPath) : null
              key = addPath && addPath.length ? addPath[addPath.length - 1] : (addRoot || 'value')
            } else {
              val = getSigValOrIt(add)
              key = (addPath && addPath.length ? addPath[addPath.length - 1] : addRoot) || 'value'
            }
            let shouldSpread = false
            for (let i = 0; i < add.mods.length; ++i) if (add.mods[i].root === MOD_SPREAD) { shouldSpread = true; break }
            if (shouldSpread) {
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

          // ^url.<sigPath> forces named sig into query params.
          // ^body.<sigPath> forces a sig into request body.
          for (let i = 0, n = urlMods.length + bodyMods.length; i < n; i++) {
            const isBody = i >= urlMods.length, m = isBody ? bodyMods[i - urlMods.length] : urlMods[i], mPath = m.path
            if (!mPath) continue
            let mKey, mVal
            if (typeof mPath === 'string') { mKey = mPath; mVal = _dm.has(mPath) ? _dm.get(mPath) : undefined }
            else if (mPath.kind === SIGNAL) { mKey = mPath.path && mPath.path.length ? mPath.path[mPath.path.length - 1] : mPath.root; mVal = getSigValOrIt(mPath) }
            else continue
            (isBody ? bodyFields : queryParams)[mKey] = mVal
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

          let headers = ACT_HEADERS_EMPTY, sharedHeaders = true
          if (hdrsMod) {
            const hdrObj = resolveModPathVal(hdrsMod.path)
            if (hdrObj && typeof hdrObj === 'object') {
              headers = Object.create(null)
              sharedHeaders = false
              for (const hk in hdrObj) if (hasOwn(hdrObj, hk)) headers[headersNoKebab ? hk : camelToKebab(hk)] = String(hdrObj[hk])
            }
          }
          if (baseHeaders !== ACT_HEADERS_EMPTY) {
            if (headers === ACT_HEADERS_EMPTY) headers = baseHeaders
            else for (const hk in baseHeaders) if (hasOwn(baseHeaders, hk)) headers[hk] = baseHeaders[hk]
          }
          if (authMod) {
            const authVal = resolveModPathVal(authMod.path)
            if (authVal != null) {
              if (sharedHeaders) {
                headers = cloneOwnProps(headers)
                sharedHeaders = false
              }
              headers[H_AUTHORIZATION] = String(authVal)
            }
          }
          // ^header.<name> sets one request header from a named sig.
          for (const m of hdrMods) {
            const mPath = m.path
            if (!mPath) continue
            let mKey, mVal
            if (typeof mPath === 'string') { mKey = camelToKebab(mPath); mVal = _dm.has(mPath) ? _dm.get(mPath) : undefined }
            else if (mPath.kind === SIGNAL) {
              mKey = camelToKebab(mPath.path && mPath.path.length ? mPath.path[mPath.path.length - 1] : mPath.root)
              mVal = getSigValOrIt(mPath)
            }
            else continue
            if (sharedHeaders) {
              headers = cloneOwnProps(headers)
              sharedHeaders = false
            }
            headers[mKey] = String(mVal ?? '')
          }

          let bodyCount = 0, firstBodyKey = null
          for (const bk in bodyFields) {
            if (!hasOwn(bodyFields, bk)) continue
            if (!bodyCount) firstBodyKey = bk
            bodyCount++
          }
          let body = null
          if (bodyCount) {
            // Send one input as a bare value and multiple inputs as an object.
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
          activeAbort = ac ? () => ac.abort() : null
          if (abortStat) setSigAndNotifySubsNLevelsDeep(aName, abortStat, activeAbort)
          const init = { method, headers }
          if (body != null) init.body = body
          if (ac) init.signal = ac.signal

          const res = await window.fetch(finalUrl, init)
          const ct = (res.headers && res.headers.get('content-type')) || ''
          let payload, htmlApplied = false
          if (ct.includes('text/event-stream')) {
            // Use incremental streaming when the browser exposes a ReadableStream body;
            // fall back to full-buffer res.text() in environments that do not (e.g. test mocks).
            if (res.body && typeof res.body.getReader === 'function') {
              payload = await consumeSseStream(
                res.body, aName,
                openStat ? () => {
                  setSigAndNotifySubsNLevelsDeep(aName, openStat, true)
                  if (closeStat) setSigAndNotifySubsNLevelsDeep(aName, closeStat, false)
                } : null,
                closeStat || errStat ? (streamErr) => {
                  if (openStat) setSigAndNotifySubsNLevelsDeep(aName, openStat, false)
                  if (streamErr) {
                    if (errStat) setSigAndNotifySubsNLevelsDeep(aName, errStat, streamErr.message || String(streamErr))
                  } else {
                    if (closeStat) setSigAndNotifySubsNLevelsDeep(aName, closeStat, true)
                  }
                } : null
              )
            } else {
              if (openStat) setSigAndNotifySubsNLevelsDeep(aName, openStat, true)
              const sseRaw = await res.text()
              payload = applySse(sseRaw, aName)
              if (openStat) setSigAndNotifySubsNLevelsDeep(aName, openStat, false)
              if (closeStat) setSigAndNotifySubsNLevelsDeep(aName, closeStat, true)
            }
          } else if (isHtml && ct.includes('text/html')) {
            payload = await res.text()
            const hm = htmlMode
            const mode = hm || MOD_OUTER
            const hp = htmlDomMod && htmlDomMod.path, elTarRoot = hp ? '' : (findFirstKind(tars, EV_PROP)?.root ?? '')
            const selector = hp ? resolveHtmlSelector(hp)
              : (mode === MOD_BEFORE || mode === MOD_AFTER) ? (el.id ? '#' + el.id : '')
              : (mode === MOD_APPEND || mode === MOD_PREPEND) ? (elTarRoot ? '#' + elTarRoot : '')
              : ''
            applyPatchEls({ [SSE_ELS]: payload, selector, mode })
            htmlApplied = true
          } else if (isJsonContentType(ct)) payload = await res.json()
          else payload = await res.text()

          if (!htmlApplied) applyActionPayload(aName, resultTar, payload, resultMode)
          if (!htmlApplied && patchAll) patchMatchingSigs(aName, payload, resultMode)
          if (busyStat) setSigAndNotifySubsNLevelsDeep(aName, busyStat, false)
          if (completeStat) setSigAndNotifySubsNLevelsDeep(aName, completeStat, true)
          if (errStat) setSigAndNotifySubsNLevelsDeep(aName, errStat, null)
          if (codeStat) setSigAndNotifySubsNLevelsDeep(aName, codeStat, Number.isFinite(res.status) ? res.status : null)
          if (abortStat) setSigAndNotifySubsNLevelsDeep(aName, abortStat, null)
          activeAbort = null

          // ^retry: auto-reconnect after clean close (stream ended without error and retry is requested)
          if (retryDelay > 0 && ct.includes('text/event-stream') && !(ac && ac.signal.aborted)) {
            setTimeout(doRequest, retryDelay)
          }
        } catch (err) {
          activeAbort = null
          if (abortStat) setSigAndNotifySubsNLevelsDeep(aName, abortStat, null)
          if (openStat) setSigAndNotifySubsNLevelsDeep(aName, openStat, false)
          // Treat AbortError as a clean cancel (not an error): AbortController fires AbortError by spec.
          const isAbort = err && err.name === 'AbortError'
          if (busyStat) setSigAndNotifySubsNLevelsDeep(aName, busyStat, false)
          if (completeStat) setSigAndNotifySubsNLevelsDeep(aName, completeStat, true)
          if (!isAbort) {
            if (errStat) setSigAndNotifySubsNLevelsDeep(aName, errStat, err && err.message ? err.message : String(err))
            if (codeStat) setSigAndNotifySubsNLevelsDeep(aName, codeStat, Number.isFinite(err && err.status) ? err.status : null)
            console.error('[dmax] Error: dAction fetch failed:', err)
            // ^retry: reconnect after error if requested (deliberate aborts skip this path via isAbort check above)
            if (retryDelay > 0) setTimeout(doRequest, retryDelay)
          }
        }
      }

      if (!trigs.length) { doRequest(); return }
      const elSubs = upsert(_cleanupBoundSubs, el)
      let ranImmediate = false
      for (const trig of trigs) {
        const kind = trig.kind, root = trig.root, path = trig.path
        if (kind !== SIGNAL && kind !== EV_PROP) { console.error('[dmax] Error: dAction unsupported trigger kind', kind, 'in', aName); return }
        const mods = pickMods(trig.mods, globMods), shouldImmediate = !ranImmediate && isImmediateMod(mods, false)
        if (kind === SIGNAL) {
          if (!expected(root)) return
          addTrigSub(el, trig, mods, doRequest, elSubs)
          if (shouldImmediate) {
            ranImmediate = true
            doRequest()
          }
          continue
        }
        const evTarEl = root ? getElById(root, aName) : el
        if (!evTarEl) { console.error('[dmax] Error: dAction element not found in trigger:', trig, 'in:', aName); return }
        const ev = (path && path.length ? path[0] : null) ?? getDefaultEv(evTarEl)
        if (!ev) { console.error('[dmax] Error: dAction event not found in trigger:', trig, 'in:', aName); return }
        const moddedHandler = addTrigSub(el, trig, mods, doRequest, elSubs, evTarEl, ev, null)
        if (shouldImmediate) {
          ranImmediate = true
          invokeSub(moddedHandler, null, getElPropVal(evTarEl, null), el, trig)
        }
      }
    }
    // Morph updates DOM in place so matched nodes keep listeners, state, focus, and scroll.
    // Match by id first, then by tag name, and clone only when no reusable node fits.

    // Return true when two nodes can be morphed in place.
    const sameKind = (a, b) => {
      if (a.nodeType !== b.nodeType) return false
      if (a.nodeType !== ELEMENT_NODE) return true
      if (a.id && b.id) return a.id === b.id
      return a.tagName === b.tagName
    }

    const sameSlot = (a, b) => {
      if (a.nodeType !== b.nodeType) return false
      if (a.nodeType !== ELEMENT_NODE) return true
      if (a.id || b.id) return a.id === b.id
      return a.tagName === b.tagName
    }

    const _HTML_PARSE_TEMPLATE = document.createElement('template')
    const TEXT_NODE = 3
    const getSimpleIdSelector = (selector) => {
      if (!selector || selector[0] !== '#') return null
      for (let i = 1; i < selector.length; ++i) {
        const c = selector[i]
        if (c <= ' ' || c === '#' || c === '>' || c === '+' || c === '~' || c === ':' || c === '.' || c === '[' || c === ']' || c === ',') return null
      }
      return selector.length > 1 ? selector.slice(1) : null
    }

    const getPatchTars = (selector) => {
      if (!selector) return NIL
      const simpleId = getSimpleIdSelector(selector)
      if (simpleId) {
        const el = document.getElementById(simpleId)
        return el ? [el] : NIL
      }
      return document.querySelectorAll(selector)
    }

    // Sync attributes from to onto from.
    const updateAttrs = (from, to) => {
      const toAttrs = to.attributes
      const fromAttrs = from.attributes
      if (!fromAttrs.length && !toAttrs.length) return
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
      // Iterate backwards because removing from a live NamedNodeMap shifts indices.
      for (let i = fromAttrs.length - 1; i >= 0; i--) {
        const name = fromAttrs[i].name
        if (!to.hasAttribute(name)) from.removeAttribute(name)
      }
    }

    // Reconcile from children to match to children with one forward pass.
    const morphChildren = (from, to) => {
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

      // Map remaining keyed children by id.
      const idMap = new Map()
      for (let n = cur; n; n = n.nextSibling)
        if (n.nodeType === ELEMENT_NODE && n.id) idMap.set(n.id, n)

      for (; toChild; toChild = toChild.nextSibling) {
        let match = null

        if (toChild.nodeType === ELEMENT_NODE && toChild.id && idMap.has(toChild.id)) {
          // Reuse keyed nodes by id even if they moved.
          match = idMap.get(toChild.id)
          idMap.delete(toChild.id)
        } else {
          // Skip keyed nodes still waiting for their own id match.
          while (cur && cur.nodeType === ELEMENT_NODE && cur.id && idMap.has(cur.id))
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
          // No reusable node found, so clone and insert.
          from.insertBefore(toChild.cloneNode(true), cur || null)
        }
      }

      // Remove any old nodes left over.
      while (cur) {
        const next = cur.nextSibling
        from.removeChild(cur)
        cur = next
      }
      // Remove keyed nodes that were never matched.
      for (const n of idMap.values()) {
        if (n.parentNode === from) from.removeChild(n)
      }
    }

    // Update from in place without disturbing matched-node listeners or cleanup state.
    // Preserve caret, selection, and scroll across streamed updates.
    const morph = (from, to) => {
      if (from.nodeType === 3 /*TEXT*/ && to.nodeType === 3) {
        if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue
        return
      }
      if (from.nodeType !== ELEMENT_NODE || to.nodeType !== ELEMENT_NODE) return
      if (from.tagName !== to.tagName) {
        // Different element type, so replace it.
        if (from.parentNode) from.parentNode.replaceChild(to.cloneNode(true), from)
        return
      }
      // Preserve caret and selection on focused text controls.
      const tag = from.tagName
      const isFocused = from === document.activeElement
      let selStart = -1, selEnd = -1, selDir = 'none'
      let selVal = null, selIdx = -1
      if (isFocused && (tag === 'INPUT' || tag === 'TEXTAREA')) {
        try { selStart = from.selectionStart; selEnd = from.selectionEnd; selDir = from.selectionDirection || 'none' } catch (_) {
          // selection is not supported for some input types
        }
      } else if (isFocused && tag === 'SELECT') {
        selVal = from.value
        selIdx = from.selectedIndex
      }
      // Save scroll position so updates do not jump the viewport.
      const scrollTop = from.scrollTop, scrollLeft = from.scrollLeft
      updateAttrs(from, to)
      const fromFirst = from.firstChild, toFirst = to.firstChild
      if (fromFirst && toFirst
        && !fromFirst.nextSibling && !toFirst.nextSibling
        && fromFirst.nodeType === TEXT_NODE && toFirst.nodeType === TEXT_NODE) {
        if (fromFirst.nodeValue !== toFirst.nodeValue) fromFirst.nodeValue = toFirst.nodeValue
      } else if (fromFirst || toFirst) morphChildren(from, to)
      // Restore scroll position after child reconciliation.
      if (from.scrollTop !== scrollTop) from.scrollTop = scrollTop
      if (from.scrollLeft !== scrollLeft) from.scrollLeft = scrollLeft
      // Restore caret and selection for focused text controls.
      if (isFocused && selStart >= 0) {
        try { from.setSelectionRange(selStart, selEnd, selDir) } catch (_) {
          // setSelectionRange is not supported for some input types
        }
      } else if (isFocused && tag === 'SELECT') {
        // Restore by value first so reordered options keep the same logical selection.
        from.value = selVal
        if (from.value !== selVal && selIdx >= 0 && selIdx < from.options.length)
          from.selectedIndex = selIdx
      }
    }

    const JSON_MERGE_DELETE = Symbol('json_merge_delete')
    const SSE_EV_PATCH_ELS = 'dmax-patch-elements', SSE_EV_PATCH_SIGS = 'dmax-patch-signals'
    const SSE_ELS = 'dmaxElements', SSE_SIGS = 'dmaxSignals'

    const parseSseEls = (html, ns) => {
      if (!html) return NIL
      const namespace = (ns || 'html').toLowerCase()
      if (namespace === 'html') {
        _HTML_PARSE_TEMPLATE.innerHTML = html
        const first = _HTML_PARSE_TEMPLATE.content.firstElementChild
        if (!first) return NIL
        if (!first.nextElementSibling) return [first]
        const out = [first]
        for (let el = first.nextElementSibling; el; el = el.nextElementSibling) out.push(el)
        return out
      }
      const wrap = namespace === 'svg'
        ? `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`
        : `<math xmlns="http://www.w3.org/1998/Math/MathML">${html}</math>`
      const doc = new DOMParser().parseFromString(wrap, namespace === 'svg' ? 'image/svg+xml' : 'application/xml')
      const root = doc.documentElement
      return root ? Array.from(root.children) : []
    }

    const insertFragRelative = (tarEl, srcEls, mode) => {
      if (!tarEl || !srcEls || !srcEls.length) return
      const frag = document.createDocumentFragment()
      for (const src of srcEls) frag.appendChild(src.cloneNode(true))
      if (mode === MOD_APPEND) { tarEl.appendChild(frag); return }
      const par = mode === MOD_PREPEND ? tarEl : tarEl.parentNode
      if (par) par.insertBefore(frag, mode === MOD_PREPEND ? tarEl.firstChild || null : mode === MOD_BEFORE ? tarEl : tarEl.nextSibling)
    }

    const applyPatchPair = (tarEl, srcEl, mode) => {
      if (!tarEl || !srcEl) return
      if (mode === MOD_REPLACE) tarEl.replaceWith(srcEl.cloneNode(true))
      else if (mode === MOD_INNER) {
        const to = tarEl.cloneNode(false)
        for (let ch = srcEl.firstChild; ch; ch = ch.nextSibling) to.appendChild(ch.cloneNode(true))
        morphChildren(tarEl, to)
      } else morph(tarEl, srcEl)
    }

    const applyPatchSource = (srcEl, mode) => {
      if (srcEl.id) applyPatchPair(document.getElementById(srcEl.id), srcEl, mode)
      else console.warn('[dmax] dmax-patch-elements without selector requires element ids')
    }

    const applyPatchEls = (args) => {
      const mode = String(args.mode || MOD_OUTER).toLowerCase()
      const sel = args.selector ? String(args.selector) : ''
      const ns = args.namespace ? String(args.namespace) : 'html'
      const srcEls = parseSseEls(args[SSE_ELS] || '', ns)

      if (mode === MOD_REMOVE) {
        if (sel) for (const t of document.querySelectorAll(sel)) t.remove()
        else for (const src of srcEls) {
          if (src.id) document.getElementById(src.id)?.remove()
          else console.warn('[dmax] patch-elements remove without selector requires element ids')
        }
        return
      }

      if (mode === MOD_APPEND || mode === MOD_PREPEND || mode === MOD_BEFORE || mode === MOD_AFTER) {
        if (!sel || !srcEls.length) return
        for (const t of document.querySelectorAll(sel)) insertFragRelative(t, srcEls, mode)
        return
      }

      if (sel) {
        if (!srcEls.length) return
        const tars = getPatchTars(sel)
        // srcEls is non-empty here; fallback to first source when targets outnumber sources.
        const defaultSrc = srcEls[0]
        for (let i = 0; i < tars.length; i++) applyPatchPair(tars[i], srcEls[i] || defaultSrc, mode)
        return
      }

      if (!srcEls.length) return
      if (srcEls.length === 1) {
        applyPatchSource(srcEls[0], mode)
        return
      }
      for (const src of srcEls) applyPatchSource(src, mode)
    }

    const applyJsonMergePatch = (prev, patch) => {
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

    const applyPatchSigs = (aName, args) => {
      const raw = args[SSE_SIGS]
      if (!raw) return
      let patchObj = null
      try { patchObj = JSON.parse(raw) } catch (_) { console.error('[dmax] Error: patch sigs in', aName, 'expect JSON but found invalid format'); return }
      if (!patchObj || typeof patchObj !== 'object' || Array.isArray(patchObj)) return
      const onlyIfMissing = String(args.onlyIfMissing || '').toLowerCase() === 'true'
      for (const root of Object.keys(patchObj)) {
        if (onlyIfMissing && _dm.has(root)) continue
        const next = applyJsonMergePatch(_dm.get(root), patchObj[root])
        if (next === JSON_MERGE_DELETE) {
          if (_dm.has(root)) {
            setSigAndNotifySubsNLevelsDeep(aName, { kind: SIGNAL, not: null, root, path: null }, undefined)
            _dm.delete(root)
            updateDebug()
          }
        } else {
          setSigAndNotifySubsNLevelsDeep(aName, { kind: SIGNAL, not: null, root, path: null }, next)
        }
      }
    }

    const applySse = (raw, aName = 'dmax-sse') => {
      if (!raw) return NIL
      const applied = []
      const text = String(raw)
      const RE_TRAILING_CR = /\r$/
      let curEv = 'message'
      let curArgs = null
      let hasData = false
      const consumeLine = (line) => {
        if (!line) { flush(); return }
        if (line[0] === ':') return
        const colonIndex = line.indexOf(':')
        const field = colonIndex >= 0 ? line.slice(0, colonIndex) : line
        let val = colonIndex >= 0 ? line.slice(colonIndex + 1) : ''
        if (val[0] === ' ') val = val.slice(1)
        if (field === 'event') curEv = val || 'message'
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
        if (!hasData || !curArgs) { curEv = 'message'; curArgs = null; hasData = false; return }
        if (curEv === SSE_EV_PATCH_ELS) {
          applyPatchEls(curArgs)
          applied.push({ event: curEv, args: curArgs })
        } else if (curEv === SSE_EV_PATCH_SIGS) {
          applyPatchSigs(aName, curArgs)
          applied.push({ event: curEv, args: curArgs })
        }
        curEv = 'message'
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
    // Applies dmax-patch-elements and dmax-patch-signals events as each SSE ev
    // arrives rather than after the full response is buffered, lowering first-update
    // latency and peak memory for large or long-lived streams.
    // Falls back gracefully when the browser/environment does not expose a ReadableStream body.
    // onOpen() is called once when the first chunk arrives; onClose(err) when the stream ends.
    const consumeSseStream = async (body, aName, onOpen, onClose) => {
      if (!body || typeof body.getReader !== 'function') return NIL
      const applied = []
      const reader = body.getReader()
      const decoder = new TextDecoder()
      const RE_TRAILING_CR = /\r$/
      let buf = ''
      let curEv = 'message', curArgs = null, hasData = false
      let opened = false

      const flush = () => {
        if (!hasData || !curArgs) { curEv = 'message'; curArgs = null; hasData = false; return }
        if (curEv === SSE_EV_PATCH_ELS) {
          applyPatchEls(curArgs)
          applied.push({ event: curEv, args: curArgs })
        } else if (curEv === SSE_EV_PATCH_SIGS) {
          applyPatchSigs(aName, curArgs)
          applied.push({ event: curEv, args: curArgs })
        }
        curEv = 'message'; curArgs = null; hasData = false
      }

      const consumeLine = (line) => {
        if (!line) { flush(); return }
        if (line[0] === ':') return
        const ci = line.indexOf(':')
        const field = ci >= 0 ? line.slice(0, ci) : line
        let val = ci >= 0 ? line.slice(ci + 1) : ''
        if (val[0] === ' ') val = val.slice(1)
        if (field === 'event') curEv = val || 'message'
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

    var applyDmaxPatchElements = applyPatchEls
    var applyDmaxPatchSigs = applyPatchSigs
    var applyDmaxSse = applySse
    var consumeDmaxSseStream = consumeSseStream

    // Detach listeners and signal subscriptions for a removed subtree.
    const cleanupBoundSubsDeep = (rootNode) => {
      if (!rootNode || rootNode.nodeType !== ELEMENT_NODE) return
      const stack = [rootNode]
      while (stack.length) {
        const node = stack.pop()
        const boundSubs = _cleanupBoundSubs.get(node)
        if (boundSubs) {
          for (const sub of boundSubs) removeSubOrClearId(sub)
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
