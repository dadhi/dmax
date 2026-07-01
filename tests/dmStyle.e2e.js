const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')

function waitFor(conditionFn, timeout = 5000, interval = 20) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function poll() {
      try {
        const value = conditionFn()
        if (value) return resolve(value)
      } catch (err) { return reject(err) }
      if (Date.now() - start > timeout) return reject(new Error('timeout'))
      setTimeout(poll, interval)
    })()
  })
}

;(async () => {
  const dmax = fs.readFileSync(path.join(process.cwd(), 'dmax.js'), 'utf8')
  const dmStyle = fs.readFileSync(path.join(process.cwd(), 'dm-style.js'), 'utf8')
  const html = `<!doctype html><body><div id="app" data-m-si='{"stylePanel":{"open":true},"oklchHelp":"oklch help text","style":{"space1":.25,"space2":.5,"space3":.75,"space4":1,"space5":1.5,"space6":2,"radius1":.5,"radius2":.875,"radius3":1.25,"line1":1,"line2":2,"sizeCell":4.5,"sizeWrap":72,"toneBg":"oklch(98% .008 250)","toneInk":"oklch(28% .03 255)","toneAccent":"oklch(62% .18 257)","toneGood":"oklch(68% .17 148)","toneBad":"oklch(62% .19 25)"}}' data-m-ex:.style@style="dmStyle.reconcileVars(this, val, dmStyle.defs)"><dm-style-panel></dm-style-panel></div><script>${dmax}</script><script>${dmStyle}</script><script>dmStyle.panel('dm-style-panel', dmStyle.defs, { signal: 'style', open: 'style-panel.open', help: 'oklch-help' }); navigator.clipboard = { last: '', writeText(v) { this.last = v } }; prompt = () => '{"radius3":0,"toneBg":"oklch(96% .01 240)"}'</script></body>`
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  const { window } = dom
  const { document } = window

  window.dispatchEvent(new window.Event('load'))
  const findInPanel = (sel) => {
    const p = document.querySelector('dm-style-panel')
    if (!p) return null
    return p.shadowRoot ? p.shadowRoot.querySelector(sel) : p.querySelector(sel)
  }
  const findAllInPanel = (sel) => {
    const p = document.querySelector('dm-style-panel')
    if (!p) return []
    return Array.from(p.shadowRoot ? p.shadowRoot.querySelectorAll(sel) : p.querySelectorAll(sel))
  }
  await waitFor(() => window.dmStyle && findInPanel('input[type=color]'))
  assert.strictEqual(typeof window.dmStyle.exportCss, 'function', 'dmStyle export helper exists')
  assert.strictEqual(typeof window.dmStyle.importVals, 'function', 'dmStyle import helper exists')
  assert.strictEqual(findAllInPanel('input[type=color]').length >= 5, true, 'style panel renders tone color pickers')
  assert.notStrictEqual(window.dmStyle.initVals(), window.dmStyle.initVals(), 'initVals returns a fresh object each time')

  const cssImport = window.dmStyle.importVals({ keep: 1, radius3: 1 }, ':root { --radius-3: 0rem; --tone-bg: oklch(96% .01 240); }')
  assert.strictEqual(cssImport.keep, 1, 'importVals preserves unrelated keys')
  assert.strictEqual(cssImport.radius3, 0, 'importVals parses numeric CSS vars')
  assert.strictEqual(cssImport.toneBg, 'oklch(96% .01 240)', 'importVals parses tone CSS vars')
  const badCssImport = window.dmStyle.importVals({ radius3: 1 }, ':root { --radius-3: nope; }')
  assert.strictEqual(badCssImport.radius3, 1, 'importVals ignores malformed numeric CSS values')
  const badJsonImport = window.dmStyle.importVals({ radius3: 1 }, '{"radius3":"nope"}')
  assert.strictEqual(badJsonImport.radius3, 1, 'importVals ignores malformed numeric JSON values')

  const root = document.getElementById('app')
  assert.strictEqual(root.style.getPropertyValue('--tone-accent'), 'oklch(62% .18 257)', 'root custom props applied from style signal')
  const sameVars = window.dmStyle.reconcileVars(root, window.dm.style, window.dmStyle.defs)
  assert.strictEqual(sameVars, root._dmStyleVars, 'reconcileVars reuses cached vars when unchanged')

  const radius = [...findAllInPanel('input[type=range]')].find((i) => i.getAttribute('aria-label') === 'Radius 3')
  radius.value = '0'
  radius.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.style.radius3 === 0)
  assert.strictEqual(root.style.getPropertyValue('--radius-3'), '0rem', 'range writes mapped css vars')

  const toneTxt = findInPanel('input[type=text][aria-label="Tone bg"]')
  const toneColor = findInPanel('input[type=color][aria-label="Tone bg color"]')
  const prevToneBg = window.dm.style.toneBg
  toneColor.value = '#112233'
  toneColor.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.style.toneBg !== prevToneBg)
  assert.strictEqual(root.style.getPropertyValue('--tone-bg'), window.dm.style.toneBg, 'color picker updates signal and root var')
  toneTxt.value = 'oklch(95% .02 200)'
  toneTxt.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.style.toneBg === 'oklch(95% .02 200)')
  assert.strictEqual(toneColor.title, 'oklch help text', 'shared help tooltip bound to panel inputs')

  const copyBtn = [...findAllInPanel('button')].find((b) => b.textContent === 'copy styles')
  copyBtn.click()
  await waitFor(() => window.navigator.clipboard.last.includes('--tone-bg'))
  assert(window.navigator.clipboard.last.includes(':root {'), 'copy exports css block')
  window.navigator.clipboard.writeText = () => Promise.reject(new Error('denied'))
  const rejectedCopy = window.dmStyle.copy(window.dm.style, window.dmStyle.defs)
  assert(rejectedCopy.includes('--tone-bg'), 'copy still returns css when clipboard write rejects')

  const importBtn = [...findAllInPanel('button')].find((b) => b.textContent === 'import')
  importBtn.click()
  await waitFor(() => window.dm.style.radius3 === 0 && window.dm.style.toneBg === 'oklch(96% .01 240)')

  const customDefs = [
    { type: 'range', key: 'gap1', css: '--gap-1', label: 'Gap 1', min: '0', max: '4', step: '.5', val: 1, unit: 'rem' },
    { type: 'tone', key: 'toneAlt', css: '--tone-alt', label: 'Tone alt', val: 'oklch(90% .02 200)' },
  ]
  window.dmStyle.panel('dm-style-mini', customDefs, { signal: 'mini', open: 'mini-panel.open', help: 'mini-help', title: 'Mini props' })
  const wrap = document.createElement('div')
  wrap.innerHTML = `<div id="mini" data-m-si='{"miniPanel":{"open":true},"miniHelp":"mini help","mini":{"gap1":1,"toneAlt":"oklch(90% .02 200)"}}' data-m-ex:.style@mini="dmStyle.reconcileVars(this, val, dmStyle.panels['dm-style-mini'])"><dm-style-mini></dm-style-mini></div>`
  const host = wrap.firstElementChild
  document.body.appendChild(host)
  window.dmScan(host)
  await waitFor(() => {
    const m = host.querySelector('dm-style-mini')
    if (!m) return null
    const root = m.shadowRoot || m
    return root.querySelector('input[type=range]')
  })
  const findInMini = (sel) => {
    const m = host.querySelector('dm-style-mini')
    if (!m) return null
    return m.shadowRoot ? m.shadowRoot.querySelector(sel) : m.querySelector(sel)
  }
  const miniRange = findInMini('input[type=range][aria-label="Gap 1"]')
  const miniTone = findInMini('input[type=text][aria-label="Tone alt"]')
  miniRange.value = '2'
  miniRange.dispatchEvent(new window.Event('input', { bubbles: true }))
  miniTone.value = 'oklch(88% .03 180)'
  miniTone.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.mini.gap1 === 2 && window.dm.mini.toneAlt === 'oklch(88% .03 180)')
  assert.strictEqual(host.style.getPropertyValue('--gap-1'), '2rem', 'custom panel range updates root vars through custom defs')
  assert.strictEqual(host.style.getPropertyValue('--tone-alt'), 'oklch(88% .03 180)', 'custom panel tone updates root vars through custom defs')
  assert.strictEqual((function () { const m = host.querySelector('dm-style-mini'); const root = m.shadowRoot || m; return root.querySelector('.panel h2'); })().textContent, 'Mini props', 'custom panel title renders')

  const pinHost = document.createElement('div')
  pinHost.id = 'pin'
  pinHost.setAttribute('data-m-si', '{"stylePanel":{"open":true},"oklchHelp":"pin help","style":{"toneAccent":"oklch(60% .2 200)"}}')
  document.body.appendChild(pinHost)
  const pinInfo = window.dmStyle.pin(pinHost)
  const findInPinPanel = (sel) => { const p = pinHost.querySelector('dm-style-panel'); return p && (p.shadowRoot ? p.shadowRoot.querySelector(sel) : p.querySelector(sel)); }
  await waitFor(() => findInPinPanel('input[type=color]'))
  assert.strictEqual(pinInfo.open, 'style-panel.open', 'pin uses kebab-case html path defaults')
  assert.strictEqual(pinInfo.help, 'oklch-help', 'pin uses kebab-case html path defaults for help')
  const pinBind = pinHost.querySelector('[data-dm-style-bind]')
  assert(pinBind, 'pin adds declarative style binding element')
  assert.strictEqual(pinBind.getAttribute('data-m-ex:.text-content@style').includes('dmStyle.reconcileVars'), true, 'pin binding uses reconciled style mapping')
  assert.strictEqual(pinHost.style.getPropertyValue('--tone-accent'), 'oklch(60% .2 200)', 'pin wires root style binding from signal')
  assert(findInPinPanel('input'), 'pin finds or creates panel element')
  window.dmSet('style.toneAccent', 'oklch(70% .15 120)')
  await waitFor(() => pinHost.style.getPropertyValue('--tone-accent') === 'oklch(70% .15 120)')

  const repinHost = document.createElement('div')
  repinHost.setAttribute('data-m-si', '{"style":{"toneAccent":"oklch(60% .2 200)"},"altStyle":{"toneAccent":"oklch(50% .12 170)"}}')
  document.body.appendChild(repinHost)
  window.dmStyle.pin(repinHost, { signal: 'style' })
  window.dmStyle.pin(repinHost, { signal: 'alt-style' })
  const repinBind = repinHost.querySelector('[data-dm-style-bind]')
  const bindNames = repinBind ? repinBind.getAttributeNames() : []
  assert.strictEqual(bindNames.includes('data-m-ex:.text-content@style'), false, 're-pin removes previous declarative binding')
  assert.strictEqual(bindNames.includes('data-m-ex:.text-content@alt-style'), true, 're-pin applies updated declarative binding')
  await waitFor(() => repinHost.style.getPropertyValue('--tone-accent') === 'oklch(50% .12 170)')
  window.dmSet('altStyle.toneAccent', 'oklch(72% .19 240)')
  await waitFor(() => repinHost.style.getPropertyValue('--tone-accent') === 'oklch(72% .19 240)')

  const docHit = window.dmEl('app')
  assert.strictEqual(docHit, root, 'dmEl resolves ids in document roots')
  const elRoot = document.createElement('div')
  elRoot.innerHTML = '<input id="root-local" value="x">'
  const localHit = window.dmEl('root-local', elRoot)
  assert.strictEqual(localHit.id, 'root-local', 'dmEl resolves ids under element roots')
  const shadowHost = document.createElement('section')
  const shadow = shadowHost.attachShadow({ mode: 'open' })
  shadow.innerHTML = '<input id="shadow-local" value="x">'
  document.body.appendChild(shadowHost)
  const shadowHit = window.dmEl('shadow-local', shadow)
  assert.strictEqual(shadowHit.id, 'shadow-local', 'dmEl resolves ids under shadow roots')

  console.log('dmStyle smoke test passed')
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
