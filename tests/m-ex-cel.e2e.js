const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { JSDOM, VirtualConsole } = require('jsdom')

function waitFor(conditionFn, timeout = 5000, interval = 50) {
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
  const p = path.join(process.cwd(), 'examples', 'm-ex-cel.html')
  const html = fs.readFileSync(p, 'utf8')
  const errors = []
  const vc = new VirtualConsole()
  vc.on('error', (...a) => errors.push(a.join(' ')))
  vc.on('warn', (...a) => errors.push(a.join(' ')))
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    url: pathToFileURL(p).href,
    virtualConsole: vc,
  })
  const { window } = dom
  const { document } = window
  await waitFor(() => window.dm && document.getElementById('m-ex-cel'))
  await new Promise((r) => setTimeout(r, 100))

  const root = document.getElementById('m-ex-cel')
  assert(root, 'm-ex-cel root exists')
  assert.strictEqual(typeof window.dmWc, 'function', 'public dmWc exists')
  assert(window.customElements.get('mx-style-panel'), 'mx-style-panel custom element is registered from separate file')
  await waitFor(() => document.querySelectorAll('mx-style-panel input[type=range]').length >= 10)
  await waitFor(() => document.querySelectorAll('mx-style-panel input[type=color]').length >= 5)
  assert.strictEqual(document.querySelectorAll('input[type=color]').length, 6, 'accent control plus five tone pickers render')
  assert.strictEqual(document.querySelectorAll('.sw').length, 0, 'color swatches removed')
  assert(document.querySelectorAll('mx-style-panel input[type=range]').length >= 10, 'style panel layout controls render as range inputs')
  assert.strictEqual([...document.querySelectorAll('input[type=text]')].some((i) => i.getAttribute('aria-label') === 'dm.mxToneDefs[0].label'), false, 'template placeholders are not left in aria-labels')

  const accentTxt = [...document.querySelectorAll('input[type=text]')].find((i) => i.getAttribute('aria-label') === 'Accent OKLCH')
  const accentColor = document.querySelector('input[type=color][aria-label="Accent color"]')
  const toneBgTxt = document.querySelector('mx-style-panel input[type=text][aria-label="Tone bg"]')
  const toneBgColor = document.querySelector('mx-style-panel input[type=color][aria-label="Tone bg color"]')
  const toneHelp = window.dm.mx.oklchHelp
  assert(accentTxt, 'accent OKLCH input exists')
  assert(accentColor, 'single accent color input exists')
  assert(toneBgTxt, 'tone bg text input exists in style panel')
  assert(toneBgColor, 'tone bg color input exists in style panel')
  assert.strictEqual(toneBgTxt.title, toneHelp, 'tone text input uses shared OKLCH help tooltip')
  assert.strictEqual(toneBgColor.title, toneHelp, 'tone color input uses shared OKLCH help tooltip')
  accentColor.value = '#3366ff'
  accentColor.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => /^oklch\(/.test(window.dm.mx.style.toneAccent))
  accentTxt.value = 'oklch(40% .2 20)'
  accentTxt.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.mx.style.toneAccent === 'oklch(40% .2 20)')
  assert.strictEqual(root.style.getPropertyValue('--tone-accent'), 'oklch(40% .2 20)', 'accent token updates root custom property inline')
  await waitFor(() => /^#[0-9a-f]{6}$/i.test(accentColor.value))

  toneBgColor.value = '#112233'
  toneBgColor.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.mx.style.toneBg === window.mExCelHexToOklch('#112233'))
  assert.strictEqual(root.style.getPropertyValue('--tone-bg'), window.dm.mx.style.toneBg, 'tone bg picker updates root custom property inline')
  toneBgTxt.value = 'oklch(96% .01 240)'
  toneBgTxt.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.mx.style.toneBg === 'oklch(96% .01 240)')
  await waitFor(() => /^#[0-9a-f]{6}$/i.test(toneBgColor.value))

  const sizeRange = [...document.querySelectorAll('input[type=range]')].find((i) => i.getAttribute('min') === '3' && i.getAttribute('max') === '7')
  const radiusRange = [...document.querySelectorAll('mx-style-panel input[type=range]')].find((i) => i.getAttribute('aria-label') === 'Radius 3')
  const speedRange = [...document.querySelectorAll('input[type=range]')].find((i) => i.getAttribute('min') === '250' && i.getAttribute('max') === '1600')
  assert(sizeRange, 'cell size range exists')
  assert(radiusRange, 'radius range exists')
  assert(speedRange, 'speed range exists')
  speedRange.value = '700'
  speedRange.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.mx.speedMs === 700)
  sizeRange.value = '6'
  sizeRange.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.mx.style.sizeCell === 6)
  assert.strictEqual(root.style.getPropertyValue('--size-cell'), '6rem', 'cell size range updates root custom property inline')
  radiusRange.value = '0'
  radiusRange.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(() => window.dm.mx.style.radius3 === 0)
  assert.strictEqual(root.style.getPropertyValue('--radius-3'), '0rem', 'radius range updates root custom property inline down to zero')

  const dmaxErrs = errors.filter((s) => s.includes('[dmax]'))
  assert.deepStrictEqual(dmaxErrs, [], `expected no dmax console errors, got: ${dmaxErrs.join(' | ')}`)
  console.log('m-ex-cel smoke test passed')
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
