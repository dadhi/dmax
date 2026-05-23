// @js-check
    const indexFirst = (s, chars, pos = 0) => {
      let i, first = s.length
      for (let c of chars) if ((i = s.indexOf(c, pos)) >= 0 && i < first) first = i
      return first === s.length ? -1 : first
    }

    const NIL = Object.freeze([])
    const CAMEL_NAMES = new Map(), KEBAB_NAMES = new Map()
    const kebabToCamel = (s) => {
      if (!s) return s
      if (s.indexOf('-') < 0) { CAMEL_NAMES.set(s, s); return s }
      let res = CAMEL_NAMES.get(s)
      if (res) return res
      res=s.replace(/-+([a-zA-Z]?)/g,(_,c)=>c?c.toUpperCase():'')
      CAMEL_NAMES.set(s, res)
      KEBAB_NAMES.set(res, s)
      return res
    }

    const camelToKebab = (s) => {
      if (!s) return s
      let res = KEBAB_NAMES.get(s)
      if (res) return res
      res = s.replace(/[A-Z]/g, c => '-' + c.toLowerCase())
      KEBAB_NAMES.set(s, res)
      CAMEL_NAMES.set(res, s)
      return res
    }

    const MOD = '^', TARG = ':', TRIG = '@', ADD = '+'
    const ALL = [MOD, TARG, TRIG, ADD]
    const MODS = [MOD]

    const DOT = '.', ID = '#', NOT = '!', BRACKET_OPEN = '[', BRACKET_CLOSE = ']'
    const NAME_DELIMS = [DOT, BRACKET_OPEN]
    const SEL_LEADS = '#.[*:', SSE_COMMENT = ':'
    const SI = 's', EP = DOT, SP = '_'

    const M_WITH_SHAPE = 'with_shape', M_SHAPE_ONLY = 'shape_only'
    const M_IMMEDIATE = 'immediate', M_NOTIMMEDIATE = 'notimmediate'
    const M_ONCE = 'once', M_ALWAYS = 'always', M_DEBOUNCE = 'debounce', M_THROTTLE = 'throttle', M_PREVENT = 'prevent'
    const M_AND = 'and', M_EQ = 'eq', M_NE = 'ne', M_LT = 'lt', M_GT = 'gt', M_LE = 'le', M_GE = 'ge', M_PR = 'pr', M_ATTRS = 'attrs', M_SI_V = 'si', M_EV_V = 'ev', M_RW = 'rw', M_NUM = 'num', M_JSOS = 'jsos'
    const M_JSON = 'json', M_TEXT = 'text', M_HTML = 'html', M_FORM = 'form', M_SSE = 'sse'
    const M_BUSY = 'busy', M_COMPLETE = 'complete', M_ERR = 'err', M_CODE = 'code', M_STAT = 'stat'
    const M_NO_CACHE = 'noCache', M_HS = 'hs', M_HS_NO_KEBAB = 'hsNoKebab', M_AUTH = 'auth'
    const M_BROTLI = 'brotli', M_BR = 'br', M_GZIP = 'gzip', M_DEFLATE = 'deflate', M_COMPRESS = 'compress'
    const M_REPLACE = 'replace', M_MERGE = 'merge', M_APPEND = 'append', M_PREPEND = 'prepend'
    const M_BEFORE = 'before', M_AFTER = 'after', M_INNER = 'inner', M_REMOVE = 'remove', M_OUTER = 'outer'
    const M_SSE_OPEN = 'open', M_SSE_CLOSE = 'close', M_RETRY = 'retry', M_ABORT = 'abort'
    const M_URL = 'url', M_BODY = 'body', M_HDR = 'header'
    const M_SPREAD = 'spread', M_SEND_ALL = 'sendAll', M_PATCH_ALL = 'patchAll', M_SYNC_ALL = 'syncAll'
    const M_DEBOUNCE_MS = 500, M_THROTTLE_MS = 500, M_RETRY_MS = 1000
    const H_ACCEPT = 'accept', H_ACCEPT_ENCODING = 'accept-encoding', H_AUTHORIZATION = 'authorization'
    const H_CACHE_CONTROL = 'cache-control', H_CONTENT_TYPE = 'content-type', H_PRAGMA = 'pragma'
    const noProto = () => Object.create(null)
    const ACT_HS_EMPTY = Object.freeze(noProto())
    const ACT_HS_JSON = Object.freeze({ [H_CONTENT_TYPE]: 'application/json', [H_ACCEPT]: 'application/json' })
    const ACT_HS_HTML = Object.freeze({ [H_ACCEPT]: 'text/html' })
    const ACT_HS_FORM = Object.freeze({ [H_CONTENT_TYPE]: 'application/x-www-form-urlencoded' })
    const ACT_HS_TEXT = Object.freeze({ [H_CONTENT_TYPE]: 'text/plain;charset=UTF-8' })
    const ACT_HS_NO_CACHE = Object.freeze({ [H_CACHE_CONTROL]: 'no-cache', [H_PRAGMA]: 'no-cache' })
    const ACT_HS_SSE = Object.freeze({ [H_ACCEPT]: 'text/event-stream', [H_CACHE_CONTROL]: 'no-cache', [H_PRAGMA]: 'no-cache' })
    const SP_WIN = 'window', SP_DOC = 'document', SP_FORM = 'form', SP_INTERVAL = 'interval', SP_TIMEOUT = 'timeout', SP_VIEWED = 'viewed', SP_INIT = 'init'
    const SPS = [SP_WIN, SP_DOC, SP_FORM, SP_INTERVAL, SP_TIMEOUT, SP_VIEWED, SP_INIT]
    const SP_WIN_EV = 'resize', SP_DOC_EV = 'visibilitychange', SP_INTERVAL_MS = 500, SP_TIMEOUT_MS = 500
    const SP_TA_WIN = 1, SP_TA_DOC = 2, SP_TA_FORM = 3
    const SP_DEFS = Object.assign(noProto(), {
      [SP_WIN]: { ta: SP_TA_WIN, ev: SP_WIN_EV },
      [SP_DOC]: { ta: SP_TA_DOC, ev: SP_DOC_EV },
      [SP_FORM]: { ta: SP_TA_FORM, ev: 'submit', immediate: 1 },
      [SP_INTERVAL]: { ms: SP_INTERVAL_MS, repeat: 1 },
      [SP_TIMEOUT]: { ms: SP_TIMEOUT_MS },
      [SP_VIEWED]: { io: 1 },
      [SP_INIT]: { init: 1, act: 1 }
    })
    const ACT_METHODS = Object.freeze({ get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE' }), DM_KEY = 'data-m-'
    const DM_NO = DM_KEY + 'no', DM_NO_SCAN = DM_NO + '^scan', DM_NO_MORPH = DM_NO + '^morph'
    const E_RW_REQ = `dmEx ${MOD}${M_RW} requires an element/property trigger in:`
    const E_RW_EL = `dmEx ${MOD}${M_RW} source element is not found in trigger:`
    const E_RW_EV = `dmEx ${MOD}${M_RW} event is not found in trigger:`
    const E_TRIG_EL = 'Element is not found in trigger:', E_TRIG_EV = 'Event is not found in trigger:', E_FORM_EL = 'Form element is not found for trigger:'
    const IT_STATES = new WeakMap(), IT_ATTRS = new WeakMap()
    const isSp = (n) => { if (n.startsWith(SP)) for (const s of SPS) if (n.startsWith(s, 1)) return true; return false }
    const mkIt = (kind, not, root, path, mods = NIL) => ({ kind, not, root, path, mods, sp: kind === SP ? SP_DEFS[root] || null : null, isSi: kind === SI, isEv: kind === EP, isSp: kind === SP, isImmediate: null })
    const mkMod = (not, root, path) => ({ kind: MOD, not, root, path, isImmediate: root === M_IMMEDIATE ? true : root === M_NOTIMMEDIATE ? false : null })
    const DEFAULT_PR_TA = Object.freeze(mkIt(EP, null, '', null)), RE_DIGITS = /^\d+$/
    const parseRef = (dKey, n, pos = 0) => {
      if (!n) return null
      let p = pos, l = n.length
      while (n.startsWith(NOT, p)) ++p
      let not = p == 0 ? null : p % 2 != 0
      let d = indexFirst(n, NAME_DELIMS, p)
      let root = d < 0 ? (p == 0 ? n : n.slice(p)) : n.slice(p, d), kind = EP
      if (root && root.length > 0) {
        const id = root[0] === ID
        if (id || isSp(root)) {
          kind = id ? EP : SP
          root = root.slice(1)
          if (!root) { logErr('empty', kind + ':', n, dKey); return null }
        } else {
          kind = SI
          root = kebabToCamel(root)
        }
      }
      if (d < 0 && !root && not !== null) { logErr('bare', NOT + ':', n); return null }
      if (d < 0 || (n[d] === DOT && d + 1 == l)) return mkIt(kind, not, root, null)
      p = d; let path = []
      while (p >= 0 && p < l) {
        const c = n[p]
        if (c === DOT) {
          const partStart = ++p
          d = indexFirst(n, NAME_DELIMS, p)
          const part = n.slice(partStart, p = d < 0 ? l : d)
          if (!part) { logErr('empty path part:', n, dKey); return null }
          path.push(kebabToCamel(part))
        } else if (c === BRACKET_OPEN) {
          d = n.indexOf(BRACKET_CLOSE, p + 1)
          if (d < 0) { logErr('missing ]:', n, dKey); return null }
          const part = n.slice(p + 1, d)
          if (!isDigitsOnly(part)) { logErr('non-const idx:', part, n, dKey); return null }
          path.push(part)
          p = d + 1
        } else {
          logErr('bad path token:', n, dKey)
          return null
        }
      }
      return mkIt(kind, not, root, path)
    }
    const parseMod = (dKey, name) => {
      if (!name) return null
      let p = 0, l = name.length
      while (name.startsWith(NOT, p)) ++p
      let not = p == 0 ? null : p % 2 != 0
      const d = indexFirst(name, NAME_DELIMS, p)
      let root = d < 0 ? (p == 0 ? name : name.slice(p)) : name.slice(p, d)
      if (root) root = kebabToCamel(root)
      if (!root) { logErr('empty mod:', name, dKey); return null }
      if (root === M_ATTRS) {
        if (d < 0 || d + 1 >= l) return mkMod(not, root, { r: '', v: '' })
        const rest = name.slice(d + 1)
        if (rest[0] !== ID) return mkMod(not, root, { r: '', v: rest })
        const d2 = rest.indexOf(DOT, 1), r = rest.slice(1, d2 < 0 ? rest.length : d2)
        if (!r) return logErr('empty attrs mod:', name, dKey), null
        return mkMod(not, root, { r, v: d2 < 0 ? '' : rest.slice(d2 + 1) })
      }
      return mkMod(not, root, d < 0 || d + 1 >= l ? null : name.indexOf(DOT, p = d + 1) < 0 ? kebabToCamel(name.slice(p)) : parseRef(dKey, name, p))
    }
    const parse = (dKey, p) => { p ??= 'data-'.length
      const n = dKey.length, items = noProto(); items[MOD] = items[TARG] = items[TRIG] = items[ADD] = NIL
      while (p >= 0 && p < n) {
        if ((p = indexFirst(dKey, ALL, p)) < 0) { p = n; break }
        const t=dKey[p];let item = null
        if (++p < n) {
          const end = indexFirst(dKey, ALL, p)
          const name = dKey.slice(p, p = end < 0 ? n : end)
          if (name) item = t == MOD ? parseMod(dKey, name) : parseRef(dKey, name)
        }
        if (!item) continue
        if (t == MOD) {
          const ts = items[MOD]
          if (ts === NIL) items[MOD] = [item]
          else ts.push(item)
          if (item.isImmediate !== null) items[MOD].isImmediate = item.isImmediate
          continue
        }
        let localMods = null
        while (p < n && dKey[p] == MOD) {
          const end = indexFirst(dKey, ALL, ++p)
          const name = dKey.slice(p, p = end < 0 ? n : end)
          const mod = parseMod(dKey, name)
          if (!mod) continue
          if (localMods) localMods.push(mod)
          else localMods = [mod]
          if (mod.isImmediate !== null) localMods.isImmediate = mod.isImmediate
        }
        const globalMods = items[MOD], ts = items[t]
        item.mods = localMods ? globalMods.length ? localMods.concat(globalMods) : localMods : globalMods
        item.isImmediate = localMods?.isImmediate ?? globalMods.isImmediate ?? null
        if (ts === NIL) items[t] = [item]
        else ts.push(item)
      }
      if (p < n) warn('unparsed tail:', dKey.slice(p), dKey)
      return [items, p]
    }

    const _parseCache = new Map()
    const parseCached = (dKey) => { let r = _parseCache.get(dKey); if (!r) _parseCache.set(dKey, r = parse(dKey)[0]); return r }

    const RETURN_THEN = [' ', '(', '{', ';', '[', '"', '\'', '\n', '\r', '\t']

    const FN_ARGS = ['dm', 'el', 'trig', 'val', 'detail']

    const _compiledFnCache = new Map()
    const compileFn = (dVal, dKey, args = FN_ARGS) => {
      const cacheKey = args === FN_ARGS ? dVal + '\x00' + dKey : null
      if (cacheKey !== null && _compiledFnCache.has(cacheKey)) return _compiledFnCache.get(cacheKey)
      let val = '' + dVal
      const returnPos = val.indexOf('return')
      let body = returnPos >= 0 && (returnPos + 6 >= val.length || indexFirst(val, RETURN_THEN, returnPos + 6) == returnPos + 6) ? val : `return(${val})`
      body = `try{ ${body} }catch(e){ console.error('[dmax]','eval ${dKey}:',e.message,${val}); return }`
      let fn
      try { fn = Function(...args, body) }
      catch (e) { logErr(`compile ${dKey}:`, e.message, val); return }
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

    // - data-m-si='{foo: {bar: "hey"}, baz: 1}' // top level fields to signals
    // - data-m-si:foo='{bar: "hey"}' // foo signal
    // - data-m-si:foo:baz='`js expr ${42}`' // eval expr as Function body and set to all signals
    // - data-m-si:foo='el.Value * dm.bar' // you may use other signals and element props
    const dmSi = (el, dKey, dVal) => {
      const it = parseCached(dKey), tars = it[TARG]
      if (it[MOD].length || it[TRIG].length || it[ADD].length) warn('targets only:', dKey)
      let fn = compileFn(dVal, dKey)
      if (!fn) return
      let val = dVal ? fn(DM, el, null) : null
      if (!tars.length) {
        if (!(val && typeof val === 'object')) return logErr('object value expected:', dKey, dVal)
        for (const t in val) _dm.set(kebabToCamel(t), val[t])
        return
      }
      for (const t of tars) {
        if (t.kind != SI) { logErr('signal targets only:', t, dKey); continue }
        if (t.mods.length) warn('mods ignored:', t.mods, dKey)
        _dm.set(t.root, val)
      }
    }

    // data-m-dbg renders the current dm state as formatted JSON into the node.
    const dmDbg = (el) => { if (el) {_debugEls.add(el); updateDebug() } }
    const getElById = (id, dKey) => {
      const el = document.getElementById(id)
      if (!el) logErr(`no #${id}:`, dKey)
      return el
    }
    const getDefaultPr = (el) => { const t = el.type, n = el.tagName; return t === 'checkbox' || t === 'radio' ? 'checked' : n === 'DETAILS' ? 'open' : n === 'INPUT' || n === 'SELECT' || n === 'TEXTAREA' ? 'value' : 'textContent' }
    const getDefaultEv = (el) => { const n = el.tagName; return n === 'FORM' ? 'submit' : n === 'DETAILS' ? 'toggle' : n === 'INPUT' || n === 'SELECT' || n === 'TEXTAREA' ? 'change' : 'click' }
    const getElPrVal = (el, prPath) => {
      if (!el) return null
      const prop = prPath && prPath.length ? prPath[0] : getDefaultPr(el)
      let val = el[prop]
      if (val === undefined && el.getAttribute) val = el.getAttribute(camelToKebab(prop))
      return prPath && prPath.length > 1 ? getPrValAndDepth(val, prPath, -1, 1)[0] : val
    }

    const isDefaultPrName = (el, prop) => prop === getDefaultPr(el) || prop === 'value' || prop === 'checked' || prop === 'textContent'

    const mkEv = (nam) => {
      try { return new Event(nam, { bubbles: true }) }
      catch (_) {
        const ev = document.createEvent('Event')
        ev.initEvent(nam, true, true)
        return ev
      }
    }

    const isNil = (v) => v === null || v === undefined

    const getPrValAndDepth = (obj, path, depth = -1, off = 0) => {
      let v = obj
      if (isNil(v) || !path) return [v, 0]
      let n = depth == -1 || depth > path.length - off ? path.length - off : depth
      for (let i = 0; i < n; ++i) if (isNil(v = v[path[i + off]])) return [v, i + 1]
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

    const setPr = (el, dKey, tar, val) => {
      if (!tar.isEv) return null
      let obj = tar.root ? getElById(tar.root, dKey) : el
      const path = tar.path; let prop = !path ? getDefaultPr(obj) : null
      if (path && path.length) ([obj] = getPrValAndDepth(obj, path, path.length - 1), prop = path.at(-1))
      if (!obj || !prop) return logErr('Error setting non existing property for:', tar, 'in', dKey)
      try {
        if (prop === 'style' && isPlainObj(val) && obj[prop]) for (const k in val) {
          const st = obj[prop], v = val[k], cssVar = k[0] === '-' ? k : '--' + camelToKebab(k)
          if (k in st) { if (valChangedDeep(st[k], v)) st[k] = v }
          else if (st.getPropertyValue(cssVar) !== '' + v) st.setProperty(cssVar, v)
        } else if (obj && typeof obj.setProperty === 'function' && !(prop in obj)) {
          const cssVar = prop[0] === '-' ? prop : '--' + camelToKebab(prop)
          if (obj.getPropertyValue(cssVar) !== '' + val) obj.setProperty(cssVar, val)
        } else if (valChangedDeep(obj[prop], val)) obj[prop] = val
      } catch (e) { logErr('Error: Failed to set property:', e.message, '>>>', tar, 'on', el) }
      return obj[prop]
    }
    const getComputedDisplay = (el) => (typeof window !== 'undefined' && window.getComputedStyle) ? window.getComputedStyle(el).display : ''

    const applyClVal = (adds, taEl, val) => {
      for (const add of adds) {
        const name = add.kb || (add.kb = camelToKebab(add.root))
        if (add.not ? !val : !!val) taEl.classList.add(name)
        else taEl.classList.remove(name)
      }
    }

    const applyDisplayValue = (taEl, inline, origDisp, val) => {
      const d = taEl.style.display
      if (!val){if (d !== 'none') taEl.style.display='none';return}
      if (inline) taEl.style.display=origDisp
      else if (d === 'none' || getComputedDisplay(taEl) === 'none') taEl.style.display=origDisp
      else taEl.style.removeProperty('display')
    }

    const diffShapeShallow = (before, after) => {
      let b = before, a = after
      if (!b || typeof b != 'object') b = NIL
      if (!a || typeof a != 'object') a = NIL

      if (Array.isArray(b)) {
        if (Array.isArray(a)) {
          const al = a.length, bl = b.length
          return al == bl ? null : al > bl ? { addedRange: [bl, al - bl] } : { removedRange: [al, bl - al] }
        }
        let added = []
        for (const k in a) if (hasOwn(a, k)) added.push(k)
        return { added, removedRange: [0, b.length] }
      }

      if (Array.isArray(a)) {
        let removed = []
        for (const k in b) if (hasOwn(b, k)) removed.push(k)
        return { removed, addedRange: [0, a.length] }
      }

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
    const MV_PR = 1, MV_SI = 2, MV_EV = 3, MV_ATTRS = 4
    const MF_ONCE = 1, MF_ALWAYS = 2, MF_PREVENT = 4, MF_NUM = 8, MF_RW = 16
    const pickMods = (localMods, fallbackMods) => localMods.length ? localMods : fallbackMods
    const compileTrMods = (tr, globMods) => compileMods(tr, pickMods(tr.mods, globMods))
    const modPath = (x) => x == null ? NIL : x.kind ? x.root ? x.path?.length ? [x.root, ...x.path] : [x.root] : x.path || NIL : Array.isArray(x) ? x : typeof x == 'string' ? [x] : [x]
    const compileMods = (tr, mods) => {
      const isTimer = tr.sp?.ms != null
      let f = 0, d = 0, t = 0, p = null, v = NIL, c = SIG_CHANGED_ANY, s = 0, r0 = '', j = null
      for (const m of mods) {
        const r = m.root
        if (r === M_WITH_SHAPE) c = SIG_CHANGED_WITH_SHAPE
        else if (r === M_SHAPE_ONLY) c = SIG_CHANGED_SHAPE_ONLY
        else if (r === M_PR) {
          const x = m.path
          s = MV_PR, r0 = x?.isEv && x.root || '', v = x?.isEv ? x.path || NIL : modPath(x)
        } else if (r === M_ATTRS) s = MV_ATTRS, r0 = m.path?.r || '', v = m.path?.v || ''
        else if (r === M_SI_V) s = MV_SI, v = modPath(m.path)
        else if (r === M_EV_V) s = MV_EV, v = modPath(m.path)
        else if (r === M_ONCE) f |= MF_ONCE
        else if (r === M_ALWAYS) f |= MF_ALWAYS
        else if (r === M_PREVENT) f |= MF_PREVENT
        else if (r === M_NUM) f |= MF_NUM
        else if (r === M_JSOS) j = m.path ?? 2
        else if (r === M_RW) f |= MF_RW
        else if (!isTimer && r === M_DEBOUNCE) d = +(resolveMPathVal(m.path) ?? M_DEBOUNCE_MS) || M_DEBOUNCE_MS
        else if (!isTimer && r === M_THROTTLE) t = +(resolveMPathVal(m.path) ?? M_THROTTLE_MS) || M_THROTTLE_MS
        else if (r in PERMIT_MODS) p = p ? p.push ? (p.push(m), p) : [p, m] : m
      }
      return { f, d, t, p, v, c, s, r: r0, j }
    }
    const getTrPrTa = (el, dKey, tr, mod, missElMsg, missEvMsg, usePrPath = true) => {
      const taEl = tr.root ? getElById(tr.root, dKey) : el
      if (!taEl) return logErr('Error:', missElMsg, tr, 'in:', dKey), null
      let ev = tr.path ? tr.path[0] : null, prPath = null
      if (ev && isDefaultPrName(taEl, ev)) prPath = tr.path, ev = getDefaultEv(taEl)
      const readEl = (mod.s === MV_PR || mod.s === MV_ATTRS) && mod.r ? getElById(mod.r, dKey) : taEl
      const readPath = mod.s === MV_PR ? mod.v.length ? mod.v : prPath : mod.s === MV_ATTRS ? mod.v : prPath
      if (usePrPath && mod.s === MV_PR && !mod.r && mod.v.length) prPath = mod.v
      ev = ev ?? getDefaultEv(taEl)
      if (!ev) return logErr('Error:', missEvMsg, tr, 'in:', dKey), null
      return readEl ? { taEl, readEl, ev, prPath, readPath, tar: mkIt(EP, null, tr.root, prPath, NIL) } : logErr('Error:', missElMsg, tr, 'in:', dKey)
    }
    const addNonSiTrSub = (el, tr, mod, fn, elSubs, ran, prTa = null) => {
      const sp = tr.sp, isSp = !!sp
      if (!isSp && !expected(prTa, 'Expected non-SP trigger target in addNonSiTrSub:', tr, 'on:', el)) return null
      const modded = addTrSub(el, tr, mod, fn, elSubs, isSp ? null : prTa.taEl, isSp ? (tr.path?.[0] || sp?.ev || null) : prTa.ev, isSp ? null : prTa.prPath, isSp ? null : prTa.readPath, isSp ? null : prTa.readEl)
      if (sp?.init) return modded && !ran && invokeSub(modded, { type: SP_INIT }, mod.s === MV_PR || mod.s === MV_ATTRS ? getReadVal(mod.r ? getElById(mod.r) : el, mod, mod.s === MV_PR ? mod.v.length ? mod.v : null : mod.v) : SP_INIT, el, tr), true
      if (modded && !ran && tr.isImmediate && (!sp || sp.immediate)) return invokeSub(modded, null, isSp ? null : getReadVal(prTa.readEl, mod, prTa.readPath), el, tr), true
      return ran
    }

    const PERMIT_MODS = Object.assign(noProto(), { [M_AND]: 1, [M_EQ]: 1, [M_NE]: 1, [M_LT]: 1, [M_GT]: 1, [M_LE]: 1, [M_GE]: 1 })

    const getSiVal = (it) => {
      const sig = _dm.get(it.root)
      const path = it.path
      return path ? getPrValAndDepth(sig, path)[0] : sig
    }
    const getSiValOrIt = (it) => {
      if (!it.kind) return it
      const val = getSiVal(it)
      return it.not ? !val : val
    }

    const resolveMPathVal = (v) => {
      if (v && v.kind) return getSiValOrIt(v)
      if (typeof v !== 'string') return v
      if (_dm.has(v)) return _dm.get(v)
      const parsed = parseRef('mod', v)
      if (!parsed || !parsed.kind) return v
      if (parsed.isSi && !parsed.path && !_dm.has(parsed.root)) return v
      return getSiValOrIt(parsed)
    }

    const dmJsos = (v, sp = 2) => typeof v === 'string' ? v : JSON.stringify(v, null, +(resolveMPathVal(sp) ?? 2) || 0)
    const resolveHtmlSelector = (mPath) => {
      const v = resolveMPathVal(mPath)
      if (typeof v === 'string' && v) {
        const c = v[0]; return SEL_LEADS.includes(c) ? v : '#' + v
      }
      return ''
    }
    const mkOrStatSi = (mod, fallbackRoot) => {
      if (!mod) return null
      const p = mod.path
      return typeof p === 'string' ? mkIt(SI, null, p || fallbackRoot, null) : p?.isSi ? p : mkIt(SI, null, fallbackRoot, null)
    }
    const mkStatTar = (root, path, key) => ({ root, path: path ? path.concat(key) : [key] })
    const STAT_KEYS_F = [M_BUSY, M_COMPLETE, M_SSE_OPEN, M_SSE_CLOSE], STAT_KEYS_N = [M_ERR, M_CODE, M_ABORT]
    const defStatSi = (stat) => {
      if (!stat) return null
      let cur = _dm.get(stat.root)
      if (!cur || typeof cur !== 'object') _dm.set(stat.root, cur = noProto())
      let parent = cur
      const path = stat.path
      if (path && path.length) for (let i = 0; i < path.length; ++i) parent = parent[path[i]] && typeof parent[path[i]] === 'object' ? parent[path[i]] : (parent[path[i]] = noProto())
      for (const k of STAT_KEYS_F) if (!hasOwn(parent, k)) parent[k] = false
      for (const k of STAT_KEYS_N) if (!hasOwn(parent, k)) parent[k] = null
      return stat
    }
    const mkActStats = (mod) => {
      const stat = defStatSi(mkOrStatSi(mod, M_STAT))
      if (!stat) return null
      const { root, path } = stat, out = noProto()
      for (const k of STAT_KEYS_F) out[k] = mkStatTar(root, path, k)
      for (const k of STAT_KEYS_N) out[k] = mkStatTar(root, path, k)
      return out
    }

    const isJsonContentType = (ct) => {
      const low = (ct || '').toLowerCase()
      if (low.indexOf('application/json') >= 0) return true
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
      const out = noProto()
      for (const key in obj) if (hasOwn(obj, key)) out[key] = obj[key]
      return out
    }

    const mergeActHs = (base, extra) => {
      if (!base || base === ACT_HS_EMPTY) return extra || ACT_HS_EMPTY
      if (!extra || extra === ACT_HS_EMPTY) return base
      const out = cloneOwnProps(base)
      for (const key in extra) if (hasOwn(extra, key)) out[key] = extra[key]
      return Object.freeze(out)
    }

    const buildActBaseHs = (isJson, isText, isHtml, isForm, isSse, noCache, enc) => {
      let hs = isJson ? ACT_HS_JSON : isForm ? ACT_HS_FORM : isText ? ACT_HS_TEXT : ACT_HS_EMPTY
      if (isHtml) hs = mergeActHs(hs, ACT_HS_HTML)
      hs = isSse ? mergeActHs(hs, ACT_HS_SSE) : noCache ? mergeActHs(hs, ACT_HS_NO_CACHE) : hs
      if (!enc) return hs
      const out = hs === ACT_HS_EMPTY ? noProto() : cloneOwnProps(hs)
      out[H_ACCEPT_ENCODING] = enc
      return Object.freeze(out)
    }

    const isDigitsOnly = (s) => typeof s == 'string' && RE_DIGITS.test(s)
    const buildItRefBase = (siRoot, siPath) => { let out = siRoot; if (siPath) for (let i = 0; i < siPath.length; ++i) out += '.' + siPath[i]; return out }
    const buildItExprBase = (siRoot, siPath) => { let out = 'dm.' + siRoot; if (siPath) for (let i = 0; i < siPath.length; ++i) out += isDigitsOnly(siPath[i]) ? '[' + siPath[i] + ']' : '.' + siPath[i]; return out }
    const buildItItemRef = (siRoot, siPath, idx) => buildItRefBase(siRoot, siPath) + '.' + idx
    const buildItItemExpr = (siRoot, siPath, idx) => buildItExprBase(siRoot, siPath) + '[' + idx + ']'

    const replaceItTokens = (s, itemToken, indexToken) => {
      if (typeof s !== 'string') return s
      let i = s.indexOf('$')
      if (i < 0) return s
      const parts = []; let p = 0
      while (i >= 0) {
        const next = s.startsWith('$it', i) ? itemToken : s.startsWith('$ix', i) ? indexToken : null
        if (!next) { i = s.indexOf('$', i + 1); continue }
        parts.push(s.slice(p, i), next); p = i + 3; i = s.indexOf('$', p)
      }
      return parts.length ? parts.join('') + s.slice(p) : s
    }

    const rewriteItBindings = (rootNode, itemRef, itemExpr, indexText) => {
      const stack = [rootNode]
      while (stack.length) {
        const node = stack.pop()
        const attrs = node.attributes
        let nextAttrs = null
        for (let i = attrs.length - 1; i >= 0; --i) {
          const attr = attrs[i]
          const nextName = replaceItTokens(attr.name, itemRef, indexText)
          const nextVal = replaceItTokens(attr.value, itemExpr, indexText)
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
        if (nextAttrs) IT_ATTRS.set(node, nextAttrs)
        const children = node.children
        for (let i = children.length - 1; i >= 0; --i) stack.push(children[i])
      }
    }

    const noScan = (el) => el && el.hasAttribute && (el.hasAttribute(DM_NO) || el.hasAttribute(DM_NO_SCAN))
    const noMorph = (el) => el && el.hasAttribute && (el.hasAttribute(DM_NO) || el.hasAttribute(DM_NO_MORPH))
    const warn = (...a) => console.warn('[dmax]', ...a), logErr = (...a) => console.error('[dmax]', ...a)
    const wireItClone = (node) => {
      const stack = [node]
      while (stack.length) {
        const el = stack.pop()
        if (noScan(el)) continue
        const itAttrs = IT_ATTRS.get(el)
        if (itAttrs && itAttrs.length) {
          for (let i = 0; i < itAttrs.length; ++i) globalThis.wireNode(el, itAttrs[i][0], itAttrs[i][1])
        } else {
          const attrs = el.attributes
          for (let i = 0; i < attrs.length; ++i) {
            const attr = attrs[i]
            globalThis.wireNode(el, attr.name, attr.value)
          }
        }
        const children = el.children
        for (let i = children.length - 1; i >= 0; --i) stack.push(children[i])
      }
    }
    const expected = (v, ...msg) => v || (warn(...msg), null)

    const renderItState = (el, tr, itState, tplFirst, itemRefBase, itemExprBase) => {
      const val = getSiValOrIt(tr)
      if (!expected(Array.isArray(val), 'dmIt expected array value from:', tr, 'on:', el)) return
      const newLen = val.length, oldLen = itState.count || 0
      if (newLen < oldLen) {
        for (let i = 0; i < oldLen - newLen; i++) {
            const node = itState.nodes.pop()
          if (node && node.parentNode) node.parentNode.removeChild(node)
        }
        itState.count = newLen
      }
      if (newLen > oldLen) {
        const frag = document.createDocumentFragment()
        for (let idx = oldLen; idx < newLen; idx++) {
          try {
            const node = tplFirst.cloneNode(true)
            const idxText = '' + idx
            rewriteItBindings(node, itemRefBase + '.' + idxText, itemExprBase + '[' + idxText + ']', idxText)
            frag.appendChild(node)
            itState.nodes.push(node)
          } catch { }
        }
        el.appendChild(frag)
        for (let i = itState.nodes.length - (newLen - oldLen); i < itState.nodes.length; ++i) wireItClone(itState.nodes[i])
        itState.count = newLen
      }
    }

    const mergeActVals = (prev, next) => {
      if (Array.isArray(prev) && Array.isArray(next)) return prev.concat(next)
      if (!isPlainObj(prev) || !isPlainObj(next)) return next
      const out = cloneOwnProps(prev)
      for (const k in next) if (hasOwn(next, k)) out[k] = hasOwn(out, k) ? mergeActVals(out[k], next[k]) : next[k]
      return out
    }

    const combineActResult = (prev, next, mode) => {
      if (mode === M_MERGE) return mergeActVals(prev, next)
      if (mode === M_APPEND) {
        if (Array.isArray(prev) && Array.isArray(next)) return prev.concat(next)
        if (typeof prev === 'string' || typeof next === 'string') return '' + (prev ?? '') + (next ?? '')
        return next
      }
      if (mode === M_PREPEND) {
        if (Array.isArray(prev) && Array.isArray(next)) return next.concat(prev)
        if (typeof prev === 'string' || typeof next === 'string') return '' + (next ?? '') + (prev ?? '')
        return next
      }
      return next
    }
    const getWriteMode = (mods) => { for (const m of mods || NIL) if (m.root === M_REPLACE || m.root === M_MERGE || m.root === M_APPEND || m.root === M_PREPEND) return m.root; return M_REPLACE }

    const patchMatchingSis = (dKey, payload, resultMode) => {
      if (!isPlainObj(payload)) return
      for (const key in payload) if (hasOwn(payload, key)) {
        const root = kebabToCamel(key)
        if (!_dm.has(root)) continue
        setSiAndNotifySubsNDeep(dKey, mkIt(SI, null, root, null), combineActResult(_dm.get(root), payload[key], resultMode))
      }
    }

    const applyActPayload = (dKey, resultTa, payload, resultMode) => {
      if (!resultTa) return
      const prev = getSiValOrIt(resultTa)
      setSiAndNotifySubsNDeep(dKey, resultTa, combineActResult(prev, payload, resultMode))
    }

    const permitVal = (m, val, n = m.root, v = resolveMPathVal(m.path)) => n === M_AND ? !!v != !!m.not : n == M_EQ ? val == v : n == M_NE ? val != v : n == M_GT ? +val > +v : n == M_LT ? +val < +v : n == M_GE ? +val >= +v : +val <= +v
    const modsPermitVal = (mods, val) => !mods.push ? permitVal(mods, val) : !mods.some((m) => !permitVal(m, val))

    const _subs = new Map()
    const _debugEls = new Set()
    let _debugQueued = false
    const upsert = (map, key) => {
      let list = map.get(key)
      if (!list) map.set(key, list = [])
      return list
    }
    const removeSiSub = (sub) => {
      const subs = _subs.get(sub.trig.root)
      if (!subs || !subs.length) return
      for (let i = 0; i < subs.length; ++i) if (subs[i] === sub) { subs.splice(i, 1); return }
    }
    const clearSubId = (sub) => {
      const sp = sub.trig.sp
      if (sp?.io) sub.clearId.disconnect()
      else if (sp?.repeat) clearInterval(sub.clearId)
      else clearTimeout(sub.clearId)
      sub.clearId = null
    }
    const removeSubOrClearId = (sub) => {
      try {
        const ev = sub.ev
        if (ev) ev.taEl.removeEventListener(ev.evName, sub.fn, ev.opts)
        else if (sub.clearId != null) clearSubId(sub)
        else removeSiSub(sub)
      } catch (_) {
      }
    }
    const PASSIVE_LISTENER_OPTS = Object.freeze({ passive: true })
    const ELEMENT_NODE = 1
    const invokeSub = (fn, detail, trVal, el, tr) => fn(DM, el, tr, tr.isSi ? getSiVal(tr) : trVal, detail)
    const invokeBoundSub = (sub, detail = null) => sub.fn(DM, sub.el, sub.trig, sub.trig.isSi ? getSiVal(sub.trig) : null, detail)
    const onIntervalSub = (sub) => {
      const detail = { tick: sub.tick++, ms: sub.ms, type: SP_INTERVAL }
      try { invokeSub(sub.fn, detail, sub.ms, sub.el, sub.trig) }
      catch (e) { logErr(`Error: interval handler (${sub.ms}ms) failed:`, e?.message ?? e) }
    }
    const onTimeoutSub = (sub) => {
      try { invokeSub(sub.fn, { tick: 0, ms: sub.ms, type: SP_TIMEOUT }, sub.ms, sub.el, sub.trig) }
      catch (e) { logErr(`timeout ${sub.ms}ms:`, e?.message ?? e) }
    }
    const getAttrs = (el, pre = '') => {
      const out = []
      if (!el) return out
      const attrs = el.attributes || NIL
      for (let i = 0; i < attrs.length; ++i) {
        const a = attrs[i]
        if (a.name.indexOf(pre) === 0) out.push({ name: a.name, value: a.value })
      }
      return out
    }
    const getReadVal = (readEl, mod, readPath) => mod.s === MV_ATTRS ? getAttrs(readEl, readPath) : getElPrVal(readEl, readPath)
    const addSpSub = (el, tr, sp, mod, fn, elSubs, evName) => {
      if (sp.ms != null) {
        const ms = +evName || sp.ms
        const sub = { el, trig: tr, fn: null, siChangeM: null, ev: null, clearId: null, ms, tick: 0 }
        sub.fn = applyTrMs(fn, tr, mod, sub)
        if (sp.repeat) sub.clearId = setInterval(onIntervalSub, ms, sub)
        else sub.clearId = setTimeout(onTimeoutSub, ms, sub)
        elSubs.push(sub)
        return sub.fn
      }
      if (sp.io) {
        if (typeof IntersectionObserver === 'undefined') { warn('IntersectionObserver missing, skip _viewed:', el); return null }
        const sub = { el, trig: tr, fn: null, siChangeM: null, ev: null, clearId: null }
        sub.fn = applyTrMs(fn, tr, mod, sub)
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) if (entry.isIntersecting)
            try { invokeSub(sub.fn, { ratio: entry.intersectionRatio, type: SP_VIEWED }, entry.intersectionRatio, el, tr) }
            catch (e) { logErr('viewed handler:', e?.message ?? e) }
        })
        observer.observe(el)
        sub.clearId = observer
        elSubs.push(sub)
        return sub.fn
      }
      if (sp.init) return applyTrMs(fn, tr, mod)
      const taEl = sp.ta === SP_TA_WIN ? window : sp.ta === SP_TA_DOC ? document : sp.ta === SP_TA_FORM ? (el && el.closest ? el.closest('form') : null) : null
      const ev = tr.path?.[0] || sp.ev || null
      if (sp.ta === SP_TA_FORM && !taEl) return logErr('Error:', E_FORM_EL, tr, 'on:', el), null
      if (!expected(taEl && ev, 'Expected event target/name in addSpSub:', tr, 'on:', el)) return null
      const opts = mod.f & MF_PREVENT ? false : PASSIVE_LISTENER_OPTS
      const sub = { el, trig: tr, fn: null, siChangeM: null, ev: { taEl, evName: ev, opts }, clearId: null }
      const modded = applyTrMs(fn, tr, mod, sub)
      sub.fn = (detail) => invokeSub(modded, detail, detail?.type ?? null, el, tr)
      taEl.addEventListener(ev, sub.fn, opts)
      elSubs.push(sub)
      return modded
    }
    const addTrSub = (el, tr, mod, fn, elSubs, taEl, evName, prPath, readPath = prPath, readEl = taEl) => {
      if (tr.isSi) {
        const sub = { el, trig: tr, fn, siChangeM: mod.c, ev: null, clearId: null }
        sub.fn = applyTrMs(fn, tr, mod, sub)
        upsert(_subs, tr.root).push(sub), (elSubs || upsert(_cleanupBoundSubs, el)).push(sub)
        return sub
      }
      const sp = tr.sp
      if (sp) return addSpSub(el, tr, sp, mod, fn, elSubs, evName)
      if (!expected(taEl && evName, 'Expected event target/name in addTrSub:', tr, 'on:', el)) return null
      const opts = mod.f & MF_PREVENT ? false : PASSIVE_LISTENER_OPTS
      const sub = { el, trig: tr, fn: null, siChangeM: null, ev: { taEl, evName, opts }, clearId: null }
      const modded = applyTrMs(fn, tr, mod, sub)
      sub.fn = (detail) => invokeSub(modded, detail, getReadVal(readEl, mod, readPath), el, tr)
      taEl.addEventListener(evName, sub.fn, opts)
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
        const state = noProto()
        for (const [k, v] of _dm.entries()) state[k] = v
        const txt = JSON.stringify(state, null, 2)
        for (const el of _debugEls) el.textContent = txt
      })
    }

    const setSiAndNotifySubs = (dKey, tar, val) => {
      const root = tar?.root, path = tar?.path
      if (!root) return null
      let siVal = _dm.get(root), curVal = siVal, parent = siVal, d = 0, last = null
      if (path) {
        if (!path.length) return null
        if (!parent || typeof parent !== 'object') _dm.set(root, parent = siVal = {})
        for (; d < path.length - 1; ++d) parent = parent[path[d]] && typeof parent[path[d]] === 'object' ? parent[path[d]] : (parent[path[d]] = {})
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

      let collected = [], diffed = false, diff = null, pathDiffs = []
      for (const h of handlers) {
        const hp = h.trig.path, changeMod = h.siChangeM
        if (!hp) {
          if (!path && !diffed && changeMod !== SIG_CHANGED_ANY) diffed = true, diff = diffShapeShallow(curVal, val)
          if (path || changeMod !== SIG_CHANGED_SHAPE_ONLY || diff) collected.push([h, path ? null : diff])
          continue
        }
        if (path) {
          const pl = path.length, hl = hp.length, minLen = hl < pl ? hl : pl
          let i = 0
          for (; i < minLen && path[i] == hp[i]; ++i);
          if (i < minLen) continue
          if (hl < pl) { collected.push([h, null]); continue }
          if (pl == hl) {
            if (!diffed && changeMod !== SIG_CHANGED_ANY) diffed = true, diff = diffShapeShallow(curVal, val)
            if (changeMod !== SIG_CHANGED_SHAPE_ONLY || diff) collected.push([h, diff])
            continue
          }
        }
        const pathCur = getPrValAndDepth(siVal, hp)[0]
        let pathVal = undefined, pathDiff = null
        for (const col of collected) {
          const p = col[0].trig.path
          if (p && samePath(p, hp)) { pathVal = col[2]; break }
        }
        if (pathVal === undefined) {
          pathVal = getPrValAndDepth(val, hp)[0]
          if (!valChangedDeep(pathCur, pathVal)) continue
        }
        if (changeMod != SIG_CHANGED_ANY) {
          let pd = null
          for (const x of pathDiffs) if (samePath(x[0], hp)) { pd = x; break }
          if (pd) pathDiff = pd[1]
          else pathDiffs.push([hp, pathDiff = diffShapeShallow(pathCur, pathVal)])
        }
        if (changeMod !== SIG_CHANGED_SHAPE_ONLY || pathDiff) collected.push([h, pathDiff, pathVal])
      }

      if (!path) _dm.set(root, val)
      else parent[last] = val

      for (const col of collected) { // notify with new values and diff if asked for
        const h = col[0]
        invokeBoundSub(h, h.siChangeM === SIG_CHANGED_ANY ? null : col[1])
      }

      updateDebug()
    }

    let syncDepth=0,MAX_SYNC_DEPTH=32;
    const setSiAndNotifySubsNDeep = (dKey, tar, val) => {
      if (syncDepth++ > MAX_SYNC_DEPTH) return logErr(`Error: Infinite loop detected for signal: ${tar} (depth > ${MAX_SYNC_DEPTH}) in ${dKey}`)
      try { return setSiAndNotifySubs(dKey, tar, val) } finally { syncDepth-- }
    }

    /**
     * @typedef {(dm?: any, el?: any, trig?: any, trigVal?: any, detail?: any) => void} TriggerHandler
     */

    /**
     * @param {TriggerHandler} fn
     * @param {{ kind: string, root?: string, path?: any, not?: any }} trig
     * @param {{ el?: any, trig: any, fn?: any, siChangeM?: any, ev?: { taEl: EventTarget, evName: string, opts: any } | null, clearId?: any } | undefined} [removeSub]
     * @returns {TriggerHandler}
     */
    const applyTrMs = (fn, tr, mod, removeSub) => {
      const isSig = tr.isSi, valPath = mod.v, deb = mod.d, thr = mod.t, permitMods = mod.p, f = mod.f, once = f & MF_ONCE && !(f & MF_ALWAYS) && removeSub, prevent = !isSig && f & MF_PREVENT, readM = mod.s, useVal = (readM === MV_SI && isSig || readM === MV_EV && !isSig) && valPath.length, useNum = f & MF_NUM, jsos = mod.j
      if (!(once || prevent || deb || thr || permitMods || tr.not || useVal || useNum || jsos != null) && (isSig || removeSub || tr.sp?.init)) return fn
      let tm = 0, last = 0, inDebounce = false
      let debDm = null, debEl = null, debVal = null, debDetail = null
      let onDebounce = null
      const h = function (dm, el, trIt, providedVal, detail) {
        trIt = trIt || tr
        if (!inDebounce) {
          if (prevent) detail?.preventDefault?.()
          if (deb) {
            onDebounce ??= function () {
              inDebounce = true
              try { h(debDm, debEl, null, debVal, debDetail) } finally { inDebounce = false }
            }
            debDm = dm, debEl = el, debVal = providedVal, debDetail = detail
            clearTimeout(tm)
            tm = setTimeout(onDebounce, deb)
            return
          }
          if (thr) {
            const now = Date.now()
            if (now - last < thr) return
            last = now
          }
        }
        const dd = detail && detail.detail
        let trVal = readM === MV_EV && !isSig ? (dd?.value ?? dd?.ms ?? detail) : isSig ? (providedVal ?? getSiVal(trIt)) : providedVal ?? dd?.value ?? dd?.ms ?? detail
        if (useVal) trVal = getPrValAndDepth(trVal, valPath)[0]
        if (useNum) trVal = trVal == null || trVal === '' ? null : +trVal
        if (trIt.not) trVal = !trVal
        if (permitMods && !modsPermitVal(permitMods, trVal)) return
        if (jsos != null) trVal = dmJsos(trVal, jsos)
        try { fn(dm, el, trIt, trVal, detail) } catch (e) { logErr('handler:', e) }
        if (once) removeSubOrClearId(removeSub)
      }
      return h
    }
    const _cleanupBoundSubs = new WeakMap() // Track all event boundSubs and signal handlers for cleanup
    // - data-m-ex:.@user.name
    // - data-m-ex:user.name@.input="val"
    const dmEx = (el, dKey, dVal) => {
      const it = parseCached(dKey), tars = it[TARG], trigs = it[TRIG], globMods = it[MOD]
      if (it[ADD].length) warn('targets/triggers/mods only:', dKey)
      const hasExpr = dVal != null && '' + dVal
      let fn = hasExpr ? compileFn(dVal, dKey) : ((a, b, c, v) => v)
      if (hasExpr && !fn) return
      const elSubs = el ? upsert(_cleanupBoundSubs, el) : null
      if (!tars.length && trigs.length) {
        const readTrs = [], writePrTrs = [], writeSiTrs = []
        for (const tr of trigs) {
          const mod = compileTrMods(tr, globMods)
          if(!(mod.f&MF_RW)){
            readTrs.push({ tr, mod })
            if (tr.isSi) writeSiTrs.push([tr, getWriteMode(tr.mods)])
            continue
          }
          if (!tr.isEv) return logErr('Error:', E_RW_REQ, dKey)
          const prTa = getTrPrTa(el, dKey, tr, mod, E_RW_EL, E_RW_EV)
          if (!prTa) return
          writePrTrs.push({ tr, mod, w: getWriteMode(tr.mods), taEl: prTa.taEl, readEl: prTa.readEl, ev: prTa.ev, prPath: prTa.prPath, readPath: prTa.readPath, tar: prTa.tar }) }
        if (writePrTrs.length && readTrs.length) {
          let ran = false
          const syncPrTas = (dm, syncTr, trigVal, detail) => {
            const exprVal = fn(dm, el, syncTr, trigVal, detail)
            for (const prTr of writePrTrs) setPr(el, dKey, prTr.tar, combineActResult(getElPrVal(prTr.taEl, prTr.prPath), exprVal, prTr.w))
          }
          for (const readTr of readTrs) {
            const tr = readTr.tr, mod = readTr.mod
            if (tr.isSi) {
              const sub = addTrSub(el, tr, mod, (dm, _el, syncTr, trigVal, detail) => syncPrTas(dm, syncTr, trigVal, detail), elSubs)
              if (!ran && tr.isImmediate != false) ran = true, invokeBoundSub(sub)
            } else if (tr.isEv || tr.isSp) {
              const prTa = tr.isEv ? getTrPrTa(el, dKey, tr, mod, E_RW_EL, E_RW_EV) : null
              if (tr.isEv && !prTa) return
              if ((ran = addNonSiTrSub(el, tr, mod, (dm, _el, syncTr, trigVal, detail) => syncPrTas(dm, syncTr, trigVal, detail), elSubs, ran, prTa)) == null) return
            } else return logErr('Error: unsupported trigger kind', tr.kind, 'in', dKey)
          }
          if (writeSiTrs.length) {
            for (const prTr of writePrTrs) {
              const writeSi = (dm, _el, syncTr, trigVal, detail) => {
                const exprVal = fn(dm, el, syncTr, trigVal, detail)
                for (const siTr of writeSiTrs) setSiAndNotifySubsNDeep(dKey, siTr[0], combineActResult(getSiVal(siTr[0]), exprVal, siTr[1]))
              }
              const moddedHandler = addTrSub(el, prTr.tr, prTr.mod, writeSi, elSubs, prTr.taEl, prTr.ev, prTr.prPath, prTr.readPath, prTr.readEl)
              if (prTr.tr.isImmediate != false) invokeSub(moddedHandler, null, getReadVal(prTr.readEl, prTr.mod, prTr.readPath), el, prTr.tr)
            }
          }
          return
        }
      }
      if (tars.length) {
        const rawFn = fn
        fn = (dm, el, trig, trigVal, detail) => {
          const exprVal = rawFn(dm, el, trig, trigVal, detail)
          let failedTa = null
          try {
            for (const tar of tars) {
              failedTa = tar
              const mode = getWriteMode(tar.mods)
              const outVal = tar.mods && tar.mods.some((m) => m.root === M_JSOS) ? dmJsos(exprVal) : exprVal
              const nextVal = tar.isSi ? combineActResult(getSiVal(tar), outVal, mode) : combineActResult(getElPrVal(tar.root ? getElById(tar.root, dKey) : el, tar.path), outVal, mode)
              if (tar.isSi) setSiAndNotifySubsNDeep(dKey, tar, nextVal)
              else setPr(el, dKey, tar, nextVal)
            }
          } catch (e) { logErr('Error: setting target', failedTa, 'in', dKey, 'ended with ex:', e) }
        }
      }
      if (!trigs.length) { if (hasExpr) fn(DM, el, null, null, null); return } let ran = false
      for (const tr of trigs) {
        const mod = compileTrMods(tr, globMods)
        if (tr.isSi) {
          const sub = addTrSub(el, tr, mod, fn, elSubs)
          if (!ran && tr.isImmediate != false) ran = true, invokeBoundSub(sub)
          continue
        }
        if (!tr.isEv && !tr.isSp) return logErr('Error: unsupported trigger kind', tr.kind, 'in', dKey)
        const prTa = tr.isEv && getTrPrTa(el, dKey, tr, mod, E_TRIG_EL, E_TRIG_EV, false)
        if (tr.isEv && !prTa) return
        if ((ran = addNonSiTrSub(el, tr, mod, fn, elSubs, ran, prTa)) == null) return
      }
    }
    const getTaFromTars = (el, dKey, tars) => { const p = findFirstKind(tars, EP); return (p && p.root) ? getElById(p.root, dKey) : el }
    // - data-m-cl+active@is-active
    // - data-m-cl+active+!inactive@is-active="dm.isActive"
    const dmCl = (el, dKey, dVal) => {
      const it = parseCached(dKey), adds = it[ADD], tars = it[TARG], trigs = it[TRIG], globMods = it[MOD]
      if (!adds.length) return logErr('Error: dmCl requires class names via + syntax in:', dKey)
      if (!trigs.length) return logErr('Error: dmCl requires at least one trigger in:', dKey)
      const taEl = getTaFromTars(el, dKey, tars)
      if (!taEl) return logErr('Error: dmCl target element not found in:', dKey)
      const fn = dVal ? compileFn(dVal, dKey) : null
      if (dVal && !fn) return
      const elSubs = upsert(_cleanupBoundSubs, el)
      for (const tr of trigs) {
        const mod = compileTrMods(tr, globMods)
        if (tr.isSi) {
          const sub = addTrSub(el, tr, mod, (dm, siEl, siTr, trigVal, detail) => applyClVal(adds, taEl, fn ? fn(dm, siEl, siTr, trigVal, detail) : trigVal), elSubs)
          if (tr.isImmediate != false) invokeBoundSub(sub)
        } else {
          const prTa = tr.isEv ? getTrPrTa(el, dKey, tr, mod, E_TRIG_EL, E_TRIG_EV, false) : null
          if (tr.isEv && !prTa) return
          if (addNonSiTrSub(el, tr, mod, (dm, _el, _trig, trigVal, detail) => applyClVal(adds, taEl, fn ? fn(dm, el, tr, trigVal, detail) : true), elSubs, false, prTa) == null) return
        }
      }
    }
    // - data-m-sh:.@is-visible
    // - data-m-sh:.@is-visible="!dm.isVisible"
    const dmSh = (el, dKey, dVal) => {
      const it = parseCached(dKey), tars = it[TARG], trigs = it[TRIG], globMods = it[MOD]
      if (!trigs.length) return logErr('Error: dmSh requires at least one trigger in:', dKey)
      const taEl = getTaFromTars(el, dKey, tars)
      if (!taEl) return logErr('Error: dmSh target element not found in:', dKey)
      const inline = (taEl.style && taEl.style.display) || ''
      const computed = getComputedDisplay(taEl)
      const origDisp = inline ? inline : (computed === 'none' || !computed ? 'block' : computed)
      const fn = dVal ? compileFn(dVal, dKey) : null
      if (dVal && !fn) return
      const elSubs = upsert(_cleanupBoundSubs, el)
      for (const tr of trigs) {
        const mod = compileTrMods(tr, globMods)
        if (tr.isSi) {
          const sub = addTrSub(el, tr, mod, (dm, siEl, siTr, trigVal, detail) => applyDisplayValue(taEl, inline, origDisp, fn ? fn(dm, siEl, siTr, trigVal, detail) : trigVal), elSubs)
          if (tr.isImmediate != false) invokeBoundSub(sub)
        } else {
          const prTa = tr.isEv ? getTrPrTa(el, dKey, tr, mod, E_TRIG_EL, E_TRIG_EV, false) : null
          if (tr.isEv && !prTa) return
          if (addNonSiTrSub(el, tr, mod, (dm, _el, _trig, trigVal, detail) => applyDisplayValue(taEl, inline, origDisp, fn ? fn(dm, el, tr, trigVal, detail) : true), elSubs, false, prTa) == null) return
        }
      }
    }
    const dataM = {}
    const wireNode = (n, an, v) => {
      if (an.indexOf(DM_KEY) !== 0 || noScan(n)) return
      const rest = an.slice(DM_KEY.length), feEnd = indexFirst(rest, ALL, 0), fe = feEnd >= 0 ? rest.slice(0, feEnd) : rest
      const fn = dataM[fe]
      if (fn) fn(n, an, v)
    }
    const dmScan = (root = document.body) => {
      const nodes = [root], deferred = []
      for (let i = 0; i < nodes.length; ++i) {
        const n = nodes[i]
        if (noScan(n)) continue
        const attrs = n.attributes || NIL
        for (let j = 0; j < attrs.length; ++j) {
          const a = attrs[j]
          if (a.name.indexOf('data-m-si') === 0) wireNode(n, a.name, a.value)
          else deferred.push([n, a.name, a.value])
        }
        const kids = n.children || NIL
        for (let j = 0; j < kids.length; ++j) nodes.push(kids[j])
      }
      for (let i = 0; i < deferred.length; ++i) wireNode(deferred[i][0], deferred[i][1], deferred[i][2])
    }
    globalThis.dm = DM
    globalThis.dmJsos = dmJsos
    globalThis.wireNode = wireNode
    globalThis.dmScan = dmScan

    // - data-m-it@posts
    // - data-m-it+#tpl-post@posts
    const dmIt = (el, dKey) => {
      const it = parseCached(dKey), trigs = it[TRIG], adds = it[ADD], globMods = it[MOD]
      if (!trigs.length) return logErr('Error: dmIt requires a signal trigger in:', dKey)
      const tr = trigs[0]
      if (!tr.isSi) return logErr('Error: dmIt trigger must be a signal in:', dKey)
      let tpl = null
      if (adds.length && adds[0].isEv && adds[0].root) tpl = getElById(adds[0].root, dKey)
      if (!tpl) tpl = el.querySelector('template')
      if (tpl && tpl.parentNode === el) tpl.parentNode.removeChild(tpl)
      if (!tpl) return logErr('Error: dmIt template not found for:', dKey)
      const tplFirst = tpl.content && tpl.content.firstElementChild
      if (!tplFirst) return logErr('Error: dmIt template root not found for:', dKey)
      let itState = IT_STATES.get(el)
      if (!itState) IT_STATES.set(el, itState = { nodes: [], count: 0 })
      const itemRefBase = buildItRefBase(tr.root, tr.path)
      const itemExprBase = buildItExprBase(tr.root, tr.path)
      addTrSub(el, tr, compileTrMods(tr, globMods), () => renderItState(el, tr, itState, tplFirst, itemRefBase, itemExprBase), upsert(_cleanupBoundSubs, el))
      if (tr.isImmediate ?? true) renderItState(el, tr, itState, tplFirst, itemRefBase, itemExprBase)
    }
    // - data-m-get:result@.click="'/api/items'"
    // - data-m-post^json:result@.click+title="'/api/posts'"
    // - data-m-get^html^outer@.click="'/fragment'"
    const dmAct = (el, dKey, dVal) => {
      const afterData = dKey.slice(DM_KEY.length), methodEnd = indexFirst(afterData, ALL, 0)
      const method = ACT_METHODS[methodEnd >= 0 ? afterData.slice(0, methodEnd) : afterData]
      if (!method) return logErr('Error: dmAct: unrecognised method prefix in:', dKey)
      const it = parseCached(dKey), tars = it[TARG], trigs = it[TRIG], adds = it[ADD], globMods = it[MOD]
      const urlFn = dVal ? compileFn(dVal, dKey) : null
      if (dVal && !urlFn) return
      const resultTa = findFirstKind(tars, SI)
      let statMod = null
      let isJson = false, isText = false, isHtml = false, isForm = false, isSse = false, noCache = false
      let encBr = false, encGzip = false, encDeflate = false, encCompress = false
      let hdrsMod = null, authMod = null
      let hsNoKebab = false
      let sendAll = false, patchAll = false
      let resultMode = M_REPLACE, htmlDomMod = null
      let retryMod = null
      const urlMods = [], bodyMods = [], hdrMods = []
      for (const m of globMods) {
        const mr = m.root
        if (mr === M_JSON) isJson = true
        else if (mr === M_TEXT) isText = true
        else if (mr === M_HTML) isHtml = true
        else if (mr === M_FORM) isForm = true
        else if (mr === M_SSE) noCache = isSse = true
        else if (mr === M_NO_CACHE) noCache = true
        else if (mr === M_BROTLI || mr === M_BR) encBr = true
        else if (mr === M_GZIP) encGzip = true
        else if (mr === M_DEFLATE) encDeflate = true
        else if (mr === M_COMPRESS) encCompress = true
        else if (mr === M_HS && !hdrsMod) hdrsMod = m
        else if (mr === M_HS_NO_KEBAB) hsNoKebab = true
        else if (mr === M_AUTH && !authMod) authMod = m
        else if (mr === M_REPLACE || mr === M_MERGE || mr === M_APPEND || mr === M_PREPEND || mr === M_BEFORE || mr === M_AFTER || mr === M_INNER || mr === M_REMOVE) {
          resultMode = mr
          if (mr !== M_MERGE) htmlDomMod = m
        } else if (mr === M_STAT && !statMod) statMod = m
        else if (mr === M_RETRY && !retryMod) retryMod = m
        else if (mr === M_URL) urlMods.push(m)
        else if (mr === M_BODY) bodyMods.push(m)
        else if (mr === M_HDR) hdrMods.push(m)
        else if (mr === M_SYNC_ALL) sendAll = patchAll = true
        else if (!sendAll && mr === M_SEND_ALL) sendAll = true
        else if (!patchAll && mr === M_PATCH_ALL) patchAll = true
      }
      if (resultTa && resultTa.mods) resultMode = getWriteMode(resultTa.mods)
      const actStats = mkActStats(statMod)
      const hdrsPath = hdrsMod?.path, authPath = authMod?.path
      const retryDelay = retryMod ? (+(resolveMPathVal(retryMod.path) ?? M_RETRY_MS) || M_RETRY_MS) : 0
      let enc = ''
      if (encBr) enc = 'br'
      if (encGzip) enc += (enc ? ', ' : '') + 'gzip'
      if (encDeflate) enc += (enc ? ', ' : '') + 'deflate'
      if (encCompress) enc += (enc ? ', ' : '') + 'compress'
      const baseHs = buildActBaseHs(isJson, isText, isHtml, isForm, isSse, noCache, enc)
      const isGetOrDelete = method === 'GET' || method === 'DELETE'
      let activeAbort = null
      for (const add of adds) {
        const ap = add.path
        add.key = (ap ? ap.at(-1) : add.root) || 'value'
        if (add.isEv && add.root) add.taEl = getElById(add.root, dKey)
        for (let i = 0; i < add.mods.length; ++i) if (add.mods[i].root === M_SPREAD) { add.spread = true; break }
      }
      const actRouteMods = []
      for (const ms of [urlMods, bodyMods]) for (const m of ms) { const p = m.path, b = ms === bodyMods
        if (typeof p === 'string') actRouteMods.push([b, p, p, null])
        else if (p && p.isSi) actRouteMods.push([b, p.path ? p.path.at(-1) : p.root, null, p])
      }
      const actHdrMods = []
      for (const m of hdrMods) { const p = m.path
        if (typeof p === 'string') actHdrMods.push([camelToKebab(p), p, null])
        else if (p && p.isSi) actHdrMods.push([camelToKebab(p.path ? p.path.at(-1) : p.root), null, p])
      }
      const ss = (k, v) => actStats && setSiAndNotifySubsNDeep(dKey, actStats[k], v)
      const doRequest = async () => {
        const url = urlFn ? urlFn(DM, el, null, null, null) : ''
        if (!url) return logErr('Error: dmAct: URL is empty in:', dKey)
        ss(M_BUSY, true), ss(M_COMPLETE, false), ss(M_ERR, null), ss(M_CODE, null)
        try {
          const queryParams = noProto(), bodyFields = noProto(), addDst = isGetOrDelete ? queryParams : bodyFields
          if (sendAll) for (const [siName, siVal] of _dm.entries()) bodyFields[siName] = siVal
          for (const add of adds) {
            const val = add.isEv ? getElPrVal(add.taEl || el, add.path) : getSiValOrIt(add)
            if (add.spread) {
              if (val && typeof val === 'object') for (const k in val) if (hasOwn(val, k)) addDst[k] = val[k]
              else addDst.value = val
            } else addDst[add.key] = val
          }
          for (const [isBody, key, path, ref] of actRouteMods) (isBody ? bodyFields : queryParams)[key] = ref ? getSiValOrIt(ref) : _dm.get(path)
          let finalUrl = url, hasQ = finalUrl.includes('?')
          for (const k in queryParams) finalUrl += (hasQ ? '&' : '?') + encodeURIComponent(k) + '=' + encodeURIComponent('' + (queryParams[k] ?? '')), hasQ = true
          let hs = ACT_HS_EMPTY, sharedHs = 1
          if (hdrsPath) {
            const hdrObj = resolveMPathVal(hdrsPath)
            if (isPlainObj(hdrObj)) {
              hs = noProto()
              sharedHs = 0
              for (const hk in hdrObj) if (hasOwn(hdrObj, hk)) hs[hsNoKebab ? hk : camelToKebab(hk)] = '' + hdrObj[hk]
            }
          }
          if (baseHs !== ACT_HS_EMPTY) {
            if (hs === ACT_HS_EMPTY) hs = baseHs
            else for (const hk in baseHs) if (hasOwn(baseHs, hk)) hs[hk] = baseHs[hk]
          }
          if (authPath != null) {
            const authVal = resolveMPathVal(authPath)
            if (authVal != null) {
              if (sharedHs) hs = cloneOwnProps(hs), sharedHs = 0
              hs[H_AUTHORIZATION] = '' + authVal
            }
          }
          for (const [kebabKey, path, ref] of actHdrMods) {
            if (sharedHs) hs = cloneOwnProps(hs), sharedHs = 0
            const v = ref ? getSiValOrIt(ref) : _dm.get(path)
            hs[kebabKey] = v != null ? '' + v : ''
          }
          let bodyCount = 0, firstBodyKey = null
          for (const bk in bodyFields) if (hasOwn(bodyFields, bk)) { if (!bodyCount) firstBodyKey = bk; bodyCount++ }
          let body = null
          if (bodyCount) {
            const raw = bodyCount === 1 ? bodyFields[firstBodyKey] : bodyFields
            if (isForm && (isPlainObj(raw) || Array.isArray(raw))) {
              const params = new URLSearchParams()
              if (Array.isArray(raw)) for (let i = 0; i < raw.length; i++) params.append('' + i, '' + (raw[i] ?? ''))
              else for (const k in raw) if (hasOwn(raw, k)) params.append(k, '' + (raw[k] ?? ''))
              body = params.toString()
            } else if (isJson || isPlainObj(raw) || Array.isArray(raw)) body = JSON.stringify(raw)
            else body = '' + raw
          }
          const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
          activeAbort = ac ? () => ac.abort() : null
          ss(M_ABORT, activeAbort)
          const init = { method, headers: hs }
          if (body != null) init.body = body
          if (ac) init.signal = ac.signal
          const res = await window.fetch(finalUrl, init)
          const ct = res.headers?.get('content-type') || '', isSseCt = ct.includes('text/event-stream')
          let payload
          if (isSseCt) {
            if (res.body && typeof res.body.getReader === 'function') payload = await consumeSseStream(res.body, dKey, actStats)
            else {
              ss(M_SSE_OPEN, true)
              payload = applySse(await res.text(), dKey)
              ss(M_SSE_OPEN, false), ss(M_SSE_CLOSE, true)
            }
          } else if (isHtml && ct.includes('text/html')) {
            payload = await res.text()
            const mode = htmlDomMod?.root || M_OUTER
            const hp = htmlDomMod && htmlDomMod.path, elTaRoot = hp ? '' : (findFirstKind(tars, EP)?.root ?? '')
            const selector = hp ? resolveHtmlSelector(hp) : (mode === M_BEFORE || mode === M_AFTER) ? (el.id ? '#' + el.id : '') : (mode === M_APPEND || mode === M_PREPEND) ? (elTaRoot ? '#' + elTaRoot : '') : ''
            applyPatchEls({ [SSE_ELS]: payload, selector, mode })
          } else {
            payload = isJsonContentType(ct) ? await res.json() : await res.text()
            applyActPayload(dKey, resultTa, payload, resultMode)
            if (patchAll) patchMatchingSis(dKey, payload, resultMode)
          }
          ss(M_BUSY, false), ss(M_COMPLETE, true), ss(M_ERR, null), ss(M_CODE, Number.isFinite(res.status) ? res.status : null), ss(M_ABORT, null)
          activeAbort = null
          if (retryDelay > 0 && isSseCt && !(ac && ac.signal.aborted)) setTimeout(doRequest, retryDelay)
        } catch (err) {
          activeAbort = null
          const isAbort = err && err.name === 'AbortError'
          ss(M_ABORT, null), ss(M_SSE_OPEN, false), ss(M_BUSY, false), ss(M_COMPLETE, true)
          if (!isAbort) {
            ss(M_ERR, err && err.message ? err.message : '' + err)
            ss(M_CODE, Number.isFinite(err && err.status) ? err.status : null)
            logErr('dmAct fail:', err)
            if (retryDelay > 0) setTimeout(doRequest, retryDelay)
          }
        }
      }
      if (!trigs.length) { doRequest(); return }
      const elSubs = upsert(_cleanupBoundSubs, el)
      let ran = false
      for (const tr of trigs) {
        if (!tr.isSi && !tr.isEv && !tr.isSp) return logErr('dmAct bad trigger:', tr.kind, dKey)
        if (tr.isSp) {
          if (!tr.sp?.act) return logErr('Error: dmAct unsupported SP trigger', tr.root, 'in', dKey)
          if (!ran) ran = true, doRequest()
          continue
        }
        const mod = compileTrMods(tr, globMods)
        if (tr.isSi) {
          addTrSub(el, tr, mod, doRequest, elSubs)
          if (!ran && tr.isImmediate) ran = true, doRequest()
          continue
        }
        const evTaEl = tr.root ? getElById(tr.root, dKey) : el
        if (!evTaEl) return logErr('Error: dmAct element not found in trigger:', tr, 'in:', dKey)
        const ev = tr.path?.[0] ?? getDefaultEv(evTaEl)
        if (!ev) return logErr('Error: dmAct event not found in trigger:', tr, 'in:', dKey)
        const moddedHandler = addTrSub(el, tr, mod, doRequest, elSubs, evTaEl, ev, null, null, evTaEl)
        if (!ran && tr.isImmediate) ran = true, invokeSub(moddedHandler, null, getElPrVal(evTaEl, null), el, tr)
      }
    }
    const WC_TMPLS = new WeakSet(), WC_INITS = new WeakSet()
    const defWc = (tpl, name) => {
      if (!name || name.indexOf('-') < 0) return logErr('dmWc template expects custom-element name value:', name)
      if (customElements.get(name) || WC_TMPLS.has(tpl)) return
      WC_TMPLS.add(tpl)
      const props = (tpl.getAttribute(DM_KEY + 'wc-props') || '').match(/[^,\s]+/g) || NIL
      const WC = class extends HTMLElement { connectedCallback() { if (WC_INITS.has(this)) return; WC_INITS.add(this); if (!this.firstElementChild && tpl.content) this.appendChild(tpl.content.cloneNode(true)), wireItClone(this); for (const p of props) { let v = this['$' + p]; if (hasOwn(this, p)) v = this[p], delete this[p]; v !== undefined && (this[p] = v) } } }
      for (const p of props) Object.defineProperty(WC.prototype, p, { get() { return this['$' + p] }, set(v) { this['$' + p] = v, this.dispatchEvent(new CustomEvent(p, { detail: v })), this.firstElementChild && this.firstElementChild.dispatchEvent(new CustomEvent(p, { detail: v })) } })
      customElements.define(name, WC)
    }
    // - <template data-m-wc="my-card"><article>...</article></template>
    const dmWc = (el, dKey, dVal) => el.tagName === 'TEMPLATE' ? defWc(el, dVal && dVal.trim()) : logErr('Error: dmWc is template-only; use data-m-ex for WC host props in:', dKey)
    const dmNo = () => {}
    dataM.si = dmSi; dataM.ex = dmEx; dataM.it = dmIt; dataM.wc = dmWc; dataM.cl = dmCl; dataM.sh = dmSh; dataM.dbg = dmDbg; dataM.no = dmNo
    dataM.get = dataM.post = dataM.put = dataM.patch = dataM.delete = dmAct
    const sameKind = (a, b) => a.nodeType !== b.nodeType ? false : a.nodeType !== ELEMENT_NODE ? true : a.id && b.id ? a.id === b.id : a.tagName === b.tagName
    const sameSlot = (a, b) => a.nodeType !== b.nodeType ? false : a.nodeType !== ELEMENT_NODE ? true : a.id || b.id ? a.id === b.id : a.tagName === b.tagName

    const _HTML_PARSE_TEMPLATE = document.createElement('template')
    const TEXT_NODE = 3
    const _siSelCache = new Map()
    const SI_BAD_SYMS = ' \t\r\n#>+~:.[],|'
    const getSimpleIdSelector = (sel) => {
      if (!sel || sel[0] !== '#') return null
      const cached = _siSelCache.get(sel)
      if (cached !== undefined) return cached
      for (let i = 1; i < sel.length; ++i)
        if (SI_BAD_SYMS.includes(sel[i])) return null
      const r = sel.length > 1 ? sel.slice(1) : null
      return _siSelCache.set(sel, r), r
    }

    const getPatchTars = (selector, simpleId = selector && getSimpleIdSelector(selector), el = simpleId && document.getElementById(simpleId)) => !selector ? NIL : simpleId ? el ? [el] : NIL : document.querySelectorAll(selector)

    const sameAttrs = (from, to) => {
      const fromAttrs = from.attributes, toAttrs = to.attributes, len = toAttrs.length
      if (fromAttrs.length !== len) return false
      for (let i = 0; i < len; i++) {
        const fromAttr = fromAttrs[i], toAttr = toAttrs[i]
        if (fromAttr.name !== toAttr.name || fromAttr.value !== toAttr.value) return false
      }
      return true
    }

    // Sync attributes from to onto from.
    const updateAttrs = (from, to) => {
      const toAttrs = to.attributes, fromAttrs = from.attributes, tl = toAttrs.length, fl = fromAttrs.length
      if (!fl && !tl) return
      if (fl === tl) {
        let same = true, re = false
        for (let i = 0; i < tl; i++) {
          const fa = fromAttrs[i], ta = toAttrs[i]
          if (fa.name !== ta.name) { same = false; re = true; break }
          if (fa.value !== ta.value) { same = false; break }
        }
        if (same) return
        if (re) {
          let same = true
          for (let i = 0; i < tl; i++) {
            const ta = toAttrs[i], fa = fromAttrs.getNamedItem(ta.name)
            if (!fa || fa.value !== ta.value) { same = false; break }
          }
          if (same) return
        }
      }
      if (!tl) {
        for (let i = fl - 1; i >= 0; i--) from.removeAttribute(fromAttrs[i].name)
        return
      }
      for (let i = 0; i < tl; i++) {
        const ta = toAttrs[i], fa = fromAttrs.getNamedItem(ta.name)
        if (!fa || fa.value !== ta.value) from.setAttribute(ta.name, ta.value)
      }
      for (let i = fl - 1; i >= 0; i--) if (!to.hasAttribute(fromAttrs[i].name)) from.removeAttribute(fromAttrs[i].name)
    }

    // Reconcile from children to match to children with one forward pass.
    const morphChildren = (from, to) => {
      let cur = from.firstChild, toChild = to.firstChild

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

      let ids = null, keyed = 0
      for (let n = cur; n; n = n.nextSibling)
        if (n.nodeType === ELEMENT_NODE && n.id) ((ids ??= noProto())[n.id] = n, keyed = 1)

      for (; toChild; toChild = toChild.nextSibling) {
        let match = null, toId = toChild.nodeType === ELEMENT_NODE ? toChild.id : ''
        if (toId && ids && (match = ids[toId])) delete ids[toId]
        else {
          while (keyed && cur && cur.nodeType === ELEMENT_NODE && cur.id && ids[cur.id]) cur = cur.nextSibling
          if (cur && sameKind(cur, toChild)) match = cur
        }
        if (match) {
          if (match !== cur) from.insertBefore(match, cur || null)
          else cur = cur.nextSibling
          morph(match, toChild)
        } else from.insertBefore(toChild.cloneNode(true), cur || null)
      }

      while (cur) {
        const next = cur.nextSibling
        from.removeChild(cur)
        cur = next
      }
      if (ids) for (const id in ids) {
        const n = ids[id]
        if (n.parentNode === from) from.removeChild(n)
      }
    }

    let _morphActiveEl = null
    const doneMorph = (root) => root && (_morphActiveEl = null)
    // Update from in place without disturbing matched-node listeners or cleanup state.
    // Preserve caret, selection, and scroll across streamed updates.
    const morph = (from, to) => {
      const root = _morphActiveEl === null
      if (root) _morphActiveEl = document.activeElement
      if (from.nodeType === 3 && to.nodeType === 3) {
        if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue
        return doneMorph(root)
      }
      if (from.nodeType !== ELEMENT_NODE || to.nodeType !== ELEMENT_NODE || noMorph(from) || noMorph(to)) return doneMorph(root)
      if (from.tagName !== to.tagName) {
        if (from.parentNode) from.parentNode.replaceChild(to.cloneNode(true), from)
        return doneMorph(root)
      }
      const fromFirst = from.firstChild, toFirst = to.firstChild, textOnly = fromFirst && toFirst && !fromFirst.nextSibling && !toFirst.nextSibling && fromFirst.nodeType === TEXT_NODE && toFirst.nodeType === TEXT_NODE
      if (sameAttrs(from, to) && (!fromFirst && !toFirst || textOnly && fromFirst.nodeValue === toFirst.nodeValue)) return doneMorph(root)
      const tag = from.tagName, isFocused = from === _morphActiveEl
      let selStart = -1, selEnd = -1, selDir = 'none', selVal = null, selIdx = -1
      if (isFocused && (tag === 'INPUT' || tag === 'TEXTAREA')) {
        try { selStart = from.selectionStart; selEnd = from.selectionEnd; selDir = from.selectionDirection || 'none' } catch (_) {}
      } else if (isFocused && tag === 'SELECT') selVal = from.value, selIdx = from.selectedIndex
      const scrollTop = from.scrollTop, scrollLeft = from.scrollLeft, keepScroll = scrollTop || scrollLeft
      updateAttrs(from, to)
      if (textOnly) {
        if (fromFirst.nodeValue !== toFirst.nodeValue) fromFirst.nodeValue = toFirst.nodeValue
      } else if (fromFirst || toFirst) morphChildren(from, to)
      if (keepScroll) {
        if (from.scrollTop !== scrollTop) from.scrollTop = scrollTop
        if (from.scrollLeft !== scrollLeft) from.scrollLeft = scrollLeft
      }
      if (isFocused && selStart >= 0) {
        try { from.setSelectionRange(selStart, selEnd, selDir) } catch (_) {}
      } else if (isFocused && tag === 'SELECT') {
        from.value = selVal
        if (from.value !== selVal && selIdx >= 0 && selIdx < from.options.length) from.selectedIndex = selIdx
      }
      doneMorph(root)
    }

    const JSON_MERGE_DELETE = Symbol('json_merge_delete')
    const SSE_EV_PATCH_ELS = 'dm-elements', SSE_EV_PATCH_SIS = 'dm-signals'
    const SSE_ELS = 'dmElements', SSE_SIS = 'dmSignals'

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

    const insertFragRelative = (taEl, srcEls, mode) => {
      if (!taEl || !srcEls || !srcEls.length) return
      const frag = document.createDocumentFragment(), before = mode === M_PREPEND ? taEl.firstChild || null : mode === M_BEFORE ? taEl : taEl.nextSibling
      for (const src of srcEls) frag.appendChild(src.cloneNode(true))
      if (mode === M_APPEND) taEl.appendChild(frag)
      else (mode === M_PREPEND ? taEl : taEl.parentNode)?.insertBefore(frag, before)
    }
    const applyPatchPair = (taEl, srcEl, mode, reuse = false) => {
      if (!taEl || !srcEl) return
      if (mode === M_REPLACE) taEl.replaceWith(reuse ? srcEl : srcEl.cloneNode(true))
      else if (mode === M_INNER) {
        const to = taEl.cloneNode(false)
        for (let ch = srcEl.firstChild; ch; ch = ch.nextSibling) to.appendChild(ch.cloneNode(true))
        morphChildren(taEl, to)
      } else morph(taEl, srcEl)
    }
    const applyPatchEls = (args) => {
      const mode = (args.mode || M_OUTER).toLowerCase()
      const sel = args.selector ? '' + args.selector : ''
      const ns = args.namespace ? '' + args.namespace : 'html'
      const rawEls = args[SSE_ELS] || ''
      if (mode === M_REPLACE && ns === 'html' && rawEls) {
        const tars = sel && getPatchTars(sel), m = !sel && /^\s*<[^>]*\sid\s*=\s*(?:"([^"]+)"|'([^']+)')/i.exec(rawEls), tar = sel ? tars.length === 1 && tars[0] : document.getElementById(m && (m[1] || m[2] || ''))
        if (tar) return void (tar.outerHTML = '' + rawEls)
      }
      const srcEls = parseSseEls(rawEls, ns)
      if (mode === M_REMOVE) {
        if (sel) for (const t of document.querySelectorAll(sel)) t.remove()
        else for (const src of srcEls) src.id ? document.getElementById(src.id)?.remove() : warn('patch-elements remove needs ids without selector')
        return
      }
      if (mode === M_APPEND || mode === M_PREPEND || mode === M_BEFORE || mode === M_AFTER) {
        if (!sel || !srcEls.length) return
        for (const t of document.querySelectorAll(sel)) insertFragRelative(t, srcEls, mode)
        return
      }

      if (sel) {
        if (!srcEls.length) return
        const tars = getPatchTars(sel)
        if (tars.length === 1 && srcEls.length === 1) {
          applyPatchPair(tars[0], srcEls[0], mode, true)
          return
        }
        const defaultSrc = srcEls[0]
        for (let i = 0; i < tars.length; i++) applyPatchPair(tars[i], srcEls[i] || defaultSrc, mode)
        return
      }

      if (!srcEls.length) return
      for (const src of srcEls) {
        if (src.id) applyPatchPair(document.getElementById(src.id), src, mode, true)
        else warn('patch-elements needs ids without selector')
      }
    }

    const applyJsonMergePatch = (prev, patch) => {
      if (patch === null) return JSON_MERGE_DELETE
      if (!isPlainObj(patch)) return patch
      const out = isPlainObj(prev) ? cloneOwnProps(prev) : noProto()
      for (const k in patch) if (hasOwn(patch, k)) {
        const next = applyJsonMergePatch(out[k], patch[k])
        if (next === JSON_MERGE_DELETE) delete out[k]
        else out[k] = next
      }
      return out
    }

    const applyPatchSigs = (dKey, args) => {
      const raw = args[SSE_SIS]
      if (!raw) return
      let patchObj = null
      try { patchObj = JSON.parse(raw) } catch (_) { return logErr('Error: patch sigs in', dKey, 'expect JSON but found invalid format') }
      if (!isPlainObj(patchObj)) return
      const onlyIfMissing = (args.onlyIfMissing || '').toLowerCase() === 'true'
      for (const root in patchObj) if (hasOwn(patchObj, root)) {
        if (onlyIfMissing && _dm.has(root)) continue
        const next = applyJsonMergePatch(_dm.get(root), patchObj[root]), it = mkIt(SI, null, root, null)
        if (next !== JSON_MERGE_DELETE) setSiAndNotifySubsNDeep(dKey, it, next)
        else if (_dm.has(root)) {
          setSiAndNotifySubsNDeep(dKey, it, undefined)
          _dm.delete(root)
          updateDebug()
        }
      }
    }

    const flushSse = (applied, st, dKey) => {
      const args = st[1], ev = st[0]
      if (st[2] && args) {
        if (ev === SSE_EV_PATCH_ELS) applyPatchEls(args), applied.push({ event: ev, args })
        else if (ev === SSE_EV_PATCH_SIS) applyPatchSigs(dKey, args), applied.push({ event: ev, args })
      }
      st[0] = 'message', st[1] = null, st[2] = false
    }
    const consumeSseLine = (raw, st, applied, dKey) => {
      const line = raw[raw.length - 1] === '\r' ? raw.slice(0, -1) : raw
      if (!line) return flushSse(applied, st, dKey)
      if (line[0] === SSE_COMMENT) return
      const ci = line.indexOf(':'), field = ci < 0 ? line : line.slice(0, ci)
      let val = ci < 0 ? '' : line.slice(ci + 1)
      if (val[0] === ' ') val = val.slice(1)
      if (field === 'event') st[0] = val || 'message'
      else if (field === 'data') {
        const si = val.indexOf(' ')
        if (si < 0) return
        const key = val.slice(0, si), value = val.slice(si + 1), args = st[1] || (st[1] = noProto())
        st[2] = true
        if (!args[key]) args[key] = value
        else args[key] += '\n' + value
      }
    }
    const applySse = (raw, dKey = 'dmax-sse') => {
      if (!raw) return NIL
      const applied = [], text = '' + raw, st = ['message', null, false]
      let start = 0, nl
      while ((nl = text.indexOf('\n', start)) >= 0) {
        consumeSseLine(text.slice(start, nl), st, applied, dKey)
        start = nl + 1
      }
      if (start < text.length) consumeSseLine(text.slice(start), st, applied, dKey)
      flushSse(applied, st, dKey)
      return applied
    }

    // Consume a text/event-stream response body incrementally using the Streams API.
    // Applies dm-elements and dm-signals events as each SSE ev
    // arrives rather than after the full response is buffered, lowering first-update
    // latency and peak memory for large or long-lived streams.
    // Falls back gracefully when the browser/environment does not expose a ReadableStream body.
    // onOpen() is called once when the first chunk arrives; onClose(err) when the stream ends.
    const consumeSseStream = async (body, dKey, actStats) => {
      if (!body || typeof body.getReader !== 'function') return NIL
      const ss = (k, v) => actStats && setSiAndNotifySubsNDeep(dKey, actStats[k], v)
      const applied = [], reader = body.getReader(), decoder = new TextDecoder(), st = ['message', null, false]
      let buf = '', opened = false
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          if (!opened) opened = true, ss(M_SSE_OPEN, true), ss(M_SSE_CLOSE, false)
          buf += decoder.decode(value, { stream: true })
          let nl
          while ((nl = buf.indexOf('\n')) >= 0) consumeSseLine(buf.slice(0, nl), st, applied, dKey), buf = buf.slice(nl + 1)
        }
        const trailing = decoder.decode()
        if (trailing) buf += trailing
        if (buf) consumeSseLine(buf, st, applied, dKey)
        flushSse(applied, st, dKey)
      } catch (e) {
        ss(M_SSE_OPEN, false)
        ss(M_ERR, e.message || '' + e)
        logErr('SSE stream error:', e)
        return applied
      }
      ss(M_SSE_OPEN, false)
      ss(M_SSE_CLOSE, true)
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
