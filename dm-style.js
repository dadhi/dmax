// @js-check
(() => {
  if (!globalThis.dmWc) return
  const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const pathJs = (s) => 'dm.' + String(s || '').split('.').map(camel).join('.')
  const rgbLin = (x) => (x /= 255) <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4
  const styleProbe = () => globalThis.dmStyleProbe || (globalThis.dmStyleProbe = document.body.appendChild(Object.assign(document.createElement('span'), { hidden: true })))
  const defs = [
    { type: 'range', key: 'space1', css: '--space-1', label: 'Space 1', min: '.125', max: '1', step: '.125', val: .25, unit: 'rem' },
    { type: 'range', key: 'space2', css: '--space-2', label: 'Space 2', min: '.25', max: '1.5', step: '.125', val: .5, unit: 'rem' },
    { type: 'range', key: 'space3', css: '--space-3', label: 'Space 3', min: '.375', max: '2', step: '.125', val: .75, unit: 'rem' },
    { type: 'range', key: 'space4', css: '--space-4', label: 'Space 4', min: '.5', max: '2.5', step: '.125', val: 1, unit: 'rem' },
    { type: 'range', key: 'space5', css: '--space-5', label: 'Space 5', min: '.75', max: '3', step: '.125', val: 1.5, unit: 'rem' },
    { type: 'range', key: 'space6', css: '--space-6', label: 'Space 6', min: '1', max: '4', step: '.125', val: 2, unit: 'rem' },
    { type: 'range', key: 'radius1', css: '--radius-1', label: 'Radius 1', min: '0', max: '1.5', step: '.125', val: .5, unit: 'rem' },
    { type: 'range', key: 'radius2', css: '--radius-2', label: 'Radius 2', min: '0', max: '2', step: '.125', val: .875, unit: 'rem' },
    { type: 'range', key: 'radius3', css: '--radius-3', label: 'Radius 3', min: '0', max: '2.5', step: '.125', val: 1.25, unit: 'rem' },
    { type: 'range', key: 'line1', css: '--line-1', label: 'Line 1', min: '1', max: '3', step: '1', val: 1, unit: 'px' },
    { type: 'range', key: 'line2', css: '--line-2', label: 'Line 2', min: '1', max: '4', step: '1', val: 2, unit: 'px' },
    { type: 'range', key: 'sizeCell', css: '--size-cell', label: 'Cell size', min: '3', max: '7', step: '.125', val: 4.5, unit: 'rem' },
    { type: 'range', key: 'sizeWrap', css: '--size-wrap', label: 'Wrap size', min: '48', max: '96', step: '1', val: 72, unit: 'rem' },
    { type: 'tone', key: 'toneBg', css: '--tone-bg', label: 'Tone bg', val: 'oklch(98% .008 250)' },
    { type: 'tone', key: 'toneInk', css: '--tone-ink', label: 'Tone ink', val: 'oklch(28% .03 255)' },
    { type: 'tone', key: 'toneAccent', css: '--tone-accent', label: 'Tone accent', val: 'oklch(62% .18 257)' },
    { type: 'tone', key: 'toneGood', css: '--tone-good', label: 'Tone good', val: 'oklch(68% .17 148)' },
    { type: 'tone', key: 'toneBad', css: '--tone-bad', label: 'Tone bad', val: 'oklch(62% .19 25)' },
  ]
  const panelCss = (name) => `${name}{position:fixed;top:12px;right:12px;z-index:9;font:12px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}${name} details{position:relative;display:block}${name} button{all:unset;box-sizing:border-box}${name} summary{display:grid;list-style:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}${name} summary::-webkit-details-marker{display:none}${name} .fab{display:grid;place-items:center;inline-size:34px;block-size:34px;border-radius:999px;background:#0f172acc;color:#fff;box-shadow:0 8px 24px #0003;backdrop-filter:blur(10px)}${name} details[open] .fab{background:#2563ebd9}${name} .panel{position:absolute;top:42px;right:0;inline-size:min(22rem,calc(100vw - 24px));max-block-size:min(78vh,48rem);overflow:auto;padding:10px;border:1px solid #cbd5e1;border-radius:14px;background:#fffc;color:#0f172a;box-shadow:0 16px 40px #00000026;backdrop-filter:blur(14px)}${name} h2,${name} h3,${name} p{margin:0}${name} h2,${name} h3{font-size:12px}${name} p{margin-top:4px;color:#475569}${name} .tools{display:flex;gap:6px;margin-top:8px}${name} .tools button{padding:5px 7px;border-radius:8px;background:#e2e8f0;color:#0f172a;cursor:pointer}${name} .group{margin-top:10px;padding-top:2px}${name} .group h3{color:#475569;text-transform:uppercase;letter-spacing:.04em}${name} .defs{display:grid;gap:6px;margin:6px 0 0}${name} div.r{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 8px;align-items:center;padding-top:6px;border-top:1px solid #e2e8f0}${name} dt,${name} dd{min-inline-size:0;margin:0}${name} code{color:#475569}${name} .tone{display:grid;gap:6px}${name} .tone-row{display:grid;grid-template-columns:2.25rem minmax(0,1fr);gap:6px;align-items:center}${name} input{inline-size:100%;font:inherit}${name} input[type='color']{inline-size:2.25rem;block-size:2rem;padding:0;border:1px solid #cbd5e1;border-radius:8px;background:#fff}${name} input[type='text']{padding:6px 7px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}${name} input[type='range']{accent-color:#2563eb}${name} input:focus-visible,${name} .tools button:focus-visible,${name} summary:focus-visible{outline:2px solid #2563eb;outline-offset:2px}@media(max-width:40rem){${name}{top:auto;right:8px;bottom:8px;left:8px}${name} details{display:grid;justify-items:end}${name} .panel{position:fixed;right:8px;bottom:50px;left:8px;top:auto;inline-size:auto;max-block-size:min(70dvh,32rem)}}`
  const byCss = (defs) => defs._css || (defs._css = (() => {
    const out = {}
    for (const d of defs) out[d.css] = d
    return out
  })())
  const partitionDefs = (defs) => defs._parts || (defs._parts = (() => {
    const range = [], tone = []
    for (const d of defs) (d.type === 'tone' ? tone : range).push(d)
    return { range, tone }
  })())
  const initVals = (defs = dmStyle.defs) => {
    const out = {}
    for (const d of defs) out[d.key] = d.val
    return out
  }
  const valsToVars = (vals, defs = dmStyle.defs) => {
    const out = {}
    for (const d of defs) out[d.css] = '' + (vals && vals[d.key] != null ? vals[d.key] : d.val) + (d.unit || '')
    return out
  }
  const applyVars = (root, vars) => {
    const s = root && root.style
    if (!s || !vars) return vars
    let prev = root._dmStyleApplied
    if (!prev) root._dmStyleApplied = prev = {}
    for (const k in vars) {
      const v = vars[k]
      if (prev[k] !== v) s.setProperty(k, prev[k] = v)
    }
    for (const k in prev) if (!(k in vars)) {
      s.removeProperty(k)
      delete prev[k]
    }
    return vars
  }
  const reconcileVars = (root, vals, defs = dmStyle.defs) => {
    const next = valsToVars(vals, defs)
    const prev = root && root._dmStyleVars
    if (prev) {
      let changed = false
      for (const k in next) if (prev[k] !== next[k]) { changed = true; break }
      if (!changed) return prev
    }
    if (root) root._dmStyleVars = next
    return next
  }
  const exportCss = (vals, defs = dmStyle.defs) => ':root {\n' + defs.map((d) => `  ${d.css}: ${(vals && vals[d.key] != null ? vals[d.key] : d.val)}${d.unit || ''};`).join('\n') + '\n}'
  const asFiniteNum = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(n) ? n : null
  }
  const applyImported = (next, d, raw) => {
    if (!d) return
    if (d.type === 'tone') {
      const txt = String(raw == null ? '' : raw).trim()
      if (txt) next[d.key] = txt
      return
    }
    const n = asFiniteNum(raw)
    if (n != null) next[d.key] = n
  }
  const importVals = (prev, txt, defs = dmStyle.defs) => {
    const next = { ...(prev || {}) }
    try {
      const obj = JSON.parse(txt)
      for (const d of defs) if (obj && obj[d.key] != null) applyImported(next, d, obj[d.key])
      return next
    } catch (_) {}
    const css = byCss(defs)
    for (const m of String(txt || '').matchAll(/(--[\w-]+)\s*:\s*([^;}{]+)\s*;?/g)) applyImported(next, css[m[1]], m[2])
    return next
  }
  const copy = (vals, defs = dmStyle.defs) => {
    const css = exportCss(vals, defs)
    const writeText = navigator.clipboard && navigator.clipboard.writeText
    if (typeof writeText === 'function') {
      try {
        const p = writeText.call(navigator.clipboard, css)
        if (p && typeof p.catch === 'function') p.catch(() => {})
      } catch (_) {}
    }
    return css
  }
  const promptImport = (prev, defs = dmStyle.defs, promptFn = globalThis.prompt) => {
    const txt = promptFn ? promptFn('Paste JSON or :root { --vars }', '') : ''
    return txt ? importVals(prev, txt, defs) : prev
  }
  const oklchToHex = (oklch) => {
    const probe = styleProbe()
    probe.style.color = ''
    probe.style.color = oklch || ''
    const m = (getComputedStyle(probe).color || '').match(/\d+/g)
    return m && m.length >= 3 ? '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('') : ''
  }
  const hexToOklch = (hex) => {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex
    const r = rgbLin(parseInt(hex.slice(1, 3), 16)), g = rgbLin(parseInt(hex.slice(3, 5), 16)), b = rgbLin(parseInt(hex.slice(5, 7), 16))
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b, m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b, s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    const L = .2104542553 * Math.cbrt(l) + .793617785 * Math.cbrt(m) - .0040720468 * Math.cbrt(s), a = 1.9779984951 * Math.cbrt(l) - 2.428592205 * Math.cbrt(m) + .4505937099 * Math.cbrt(s), bb = .0259040371 * Math.cbrt(l) + .7827717662 * Math.cbrt(m) - .808675766 * Math.cbrt(s)
    return `oklch(${(L * 100).toFixed(1)}% ${Math.hypot(a, bb).toFixed(3)} ${((Math.atan2(bb, a) * 180 / Math.PI + 360) % 360) | 0})`
  }
  const defaults = Object.freeze({ signal: 'style', open: 'style-panel.open', help: 'oklch-help', panelName: 'dm-style-panel' })
  const resolveOpts = (opts = {}) => ({
    signal: opts.signal || defaults.signal,
    open: opts.open || defaults.open,
    help: opts.help || defaults.help,
    panelName: opts.panelName || opts.panel || defaults.panelName,
    defs: opts.defs || dmStyle.defs,
    title: opts.title,
    note: opts.note,
  })
  // Shadow-mode panel CSS — selectors are naturally scoped to the shadow root,
  // so the legacy `${name}` interpolations are no longer needed. ~600 chars saved.
  const panelShadowCss = () => `details{position:relative;display:block}button{all:unset;box-sizing:border-box}summary{display:grid;list-style:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}summary::-webkit-details-marker{display:none}.fab{display:grid;place-items:center;inline-size:34px;block-size:34px;border-radius:999px;background:#0f172acc;color:#fff;box-shadow:0 8px 24px #0003;backdrop-filter:blur(10px)}details[open] .fab{background:#2563ebd9}.panel{position:absolute;top:42px;right:0;inline-size:min(22rem,calc(100vw - 24px));max-block-size:min(78vh,48rem);overflow:auto;padding:10px;border:1px solid #cbd5e1;border-radius:14px;background:#fffc;color:#0f172a;box-shadow:0 16px 40px #00000026;backdrop-filter:blur(14px)}h2,h3,p{margin:0}h2,h3{font-size:12px}p{margin-top:4px;color:#475569}.tools{display:flex;gap:6px;margin-top:8px}.tools button{padding:5px 7px;border-radius:8px;background:#e2e8f0;color:#0f172a;cursor:pointer}.group{margin-top:10px;padding-top:2px}.group h3{color:#475569;text-transform:uppercase;letter-spacing:.04em}.defs{display:grid;gap:6px;margin:6px 0 0}div.r{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 8px;align-items:center;padding-top:6px;border-top:1px solid #e2e8f0}dt,dd{min-inline-size:0;margin:0}code{color:#475569}.tone{display:grid;gap:6px}.tone-row{display:grid;grid-template-columns:2.25rem minmax(0,1fr);gap:6px;align-items:center}input{inline-size:100%;font:inherit}input[type='color']{inline-size:2.25rem;block-size:2rem;padding:0;border:1px solid #cbd5e1;border-radius:8px;background:#fff}input[type='text']{padding:6px 7px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}input[type='range']{accent-color:#2563eb}input:focus-visible,.tools button:focus-visible,summary:focus-visible{outline:2px solid #2563eb;outline-offset:2px}@media(max-width:40rem){details{display:grid;justify-items:end}.panel{position:fixed;right:8px;bottom:50px;left:8px;top:auto;inline-size:auto;max-block-size:min(70dvh,32rem)}}`
  const panel = (name = defaults.panelName, defs = dmStyle.defs, opts = {}) => {
    const signal = opts.signal || defaults.signal, open = opts.open || defaults.open, help = opts.help || defaults.help, sigJs = pathJs(signal), helpAttr = help ? ` data-m-ex:.title@${help}` : '', parts = partitionDefs(defs)
    dmStyle.panels[name] = defs
    const range = (d, path = signal + '.' + kebab(d.key)) => `<div class="r"><dt><code title="${d.label}">${d.css}</code></dt><dd><input type="range" min="${d.min}" max="${d.max}" step="${d.step}" aria-label="${d.label}" data-m-ex:.value@${path} data-m-ex:${path}@.input^num data-m-ex:.title@${path}="'${d.label}: ' + val"></dd></div>`
    const tone = (d, path = signal + '.' + kebab(d.key), colorLabel = d.label + ' color') => `<div class="r"><dt><code title="${d.label}">${d.css}</code></dt><dd><div class="tone"><div class="tone-row"><input type="color" aria-label="${colorLabel}" data-m-ex:.value@${path}="dmStyle.oklchToHex(val) || '#ffffff'" data-m-ex:${path}@.input="dmStyle.hexToOklch(val)" data-m-ex:.style.background-color@${path}="dmStyle.oklchToHex(val) || '#ffffff'" data-m-ex:.style.border-color@${path}="dmStyle.oklchToHex(val) || '#cbd5e1'"${helpAttr}><input type="text" aria-label="${d.label}" data-m-ex:.value@${path} data-m-ex:${path}@.input${helpAttr}></div></div></dd></div>`
    // ^dom.open isolates the panel's CSS via shadow root, and :_wc keeps the
    // open state on the host instead of polluting the page-level signal store.
    return dmWc(name, `<style>${panelShadowCss()}</style><details data-m-ex@.^rw@${open}><summary class="fab" aria-controls="${name}-panel">◐</summary><section class="panel" id="${name}-panel"><h2>${opts.title || 'Style props'}</h2><p>${opts.note || 'Compact live tokens for this page. Copy styles writes the current values as a :root block.'}</p><div class="tools"><button type="button" data-m-ex:${signal}@.click="(dmStyle.copy(${sigJs}, dmStyle.panels['${name}']), ${sigJs})">copy styles</button><button type="button" data-m-ex:${signal}@.click="dmStyle.promptImport(${sigJs}, dmStyle.panels['${name}'])">import</button><button type="button" data-m-ex:${signal}@.click="dmStyle.initVals(dmStyle.panels['${name}'])">reset</button></div><section class="group"><h3>Layout</h3><div class="defs">${parts.range.map((d) => range(d)).join('')}</div></section><section class="group"><h3>Tones</h3><div class="defs">${parts.tone.map((d) => tone(d)).join('')}</div></section></section></details>`, undefined, [{ root: 'dom', path: ['open'] }])
  }
  const findPanelEl = (root, name) => root && root.querySelector(name)
  const pinExpr = (panelName) => `dmStyle.applyVars(el._dmStyleRoot,dmStyle.reconcileVars(el._dmStyleRoot,val,dmStyle.panels['${panelName}']))`
  const pinMarkup = (signal, panelName) => `<i hidden data-dm-style-bind=\"1\" data-m-ex:.text-content@${signal}=\"${pinExpr(panelName)}\"></i>`
  const ensurePinBinding = (root, signal, panelName) => {
    let bindEl = root.querySelector('[data-dm-style-bind]')
    if (bindEl && bindEl._dmStyleSignal === signal && bindEl._dmStylePanelName === panelName) return { bindEl, changed: false }
    if (bindEl) bindEl.remove()
    const box = document.createElement('div')
    box.innerHTML = pinMarkup(signal, panelName)
    bindEl = box.firstElementChild
    if (!bindEl) return { bindEl: null, changed: false }
    bindEl._dmStyleRoot = root
    bindEl._dmStyleSignal = signal
    bindEl._dmStylePanelName = panelName
    root.appendChild(bindEl)
    return { bindEl, changed: true }
  }
  const pin = (root, opts = {}) => {
    if (!root) return
    const conf = resolveOpts(opts)
    const { signal, open, help, panelName, defs } = conf
    if (!dmStyle.panels[panelName]) panel(panelName, defs, conf)
    let panelEl = findPanelEl(root, panelName)
    const created = !panelEl
    if (!panelEl) {
      panelEl = document.createElement(panelName)
      root.appendChild(panelEl)
    }
    const { bindEl, changed: bindingChanged } = ensurePinBinding(root, signal, panelName)
    const scan = typeof globalThis.dmScan === 'function'
    if (scan) {
      if (!root._dmScanned) {
        if (created) globalThis.dmScan(root)
        else {
          if (!panelEl._dmScanned) globalThis.dmScan(panelEl)
          if (bindingChanged && bindEl && !bindEl._dmScanned) globalThis.dmScan(bindEl)
        }
      } else {
        if ((created || !panelEl._dmScanned)) globalThis.dmScan(panelEl)
        if (bindingChanged && bindEl && !bindEl._dmScanned) globalThis.dmScan(bindEl)
      }
    }
    return { root, panel: panelEl, signal, open, help, panelName, defs }
  }
  const dmStyle = globalThis.dmStyle = { defs, panels: {}, initVals, valsToVars, applyVars, reconcileVars, exportCss, importVals, copy, promptImport, oklchToHex, hexToOklch, panel, pin }
})()
