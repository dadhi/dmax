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
  const src = fs.readFileSync(path.join(process.cwd(), 'dmax.js'), 'utf8')
  const dom = new JSDOM(`<!doctype html><body><script>${src}</script></body>`, { runScripts: 'dangerously', pretendToBeVisual: true })
  const { window } = dom
  const { document } = window

  await waitFor(() => typeof window.dmWc === 'function')

  // === Test 1: Shadow mode ^dom.open ===
  window.dmWc('x-shadow-open', '<p>shadow-open</p>', null, new Set(['dom.open']))
  const shadowOpen = document.createElement('x-shadow-open')
  document.body.append(shadowOpen)
  await waitFor(() => shadowOpen.shadowRoot)
  assert(shadowOpen.shadowRoot, 'open shadow root exists')
  assert(shadowOpen.shadowRoot.querySelector('p').textContent === 'shadow-open', 'shadow content rendered')
  console.log('PASS: ^dom.open creates open shadow root')

  // === Test 2: Shadow mode ^dom.closed ===
  window.dmWc('x-shadow-closed', '<p>shadow-closed</p>', null, new Set(['dom.closed']))
  const shadowClosed = document.createElement('x-shadow-closed')
  document.body.append(shadowClosed)
  // closed shadow root means shadowRoot is null from outside
  await waitFor(() => !shadowClosed.shadowRoot && !shadowClosed.querySelector('p'))
  assert(shadowClosed.shadowRoot === null, 'closed shadow root is null from outside')
  console.log('PASS: ^dom.closed creates closed shadow root (null from outside)')

  // === Test 3: Default is light DOM (no shadow root) ===
  window.dmWc('x-light', '<p>light-content</p>')
  const lightEl = document.createElement('x-light')
  document.body.append(lightEl)
  await waitFor(() => lightEl.querySelector('p'))
  assert(lightEl.shadowRoot === null, 'no shadow root for light DOM')
  assert(lightEl.querySelector('p').textContent === 'light-content', 'light DOM content rendered')
  console.log('PASS: default is light DOM (no shadow root)')

  // === Test 4: Slots (implicit, light DOM) ===
  window.dmWc('x-slot', '<div class="wrapper"><slot></slot></div>')
  const slotEl = document.createElement('x-slot')
  slotEl.innerHTML = '<span>projected</span>'
  document.body.append(slotEl)
  await waitFor(() => slotEl.querySelector('.wrapper span'))
  assert(slotEl.querySelector('.wrapper span').textContent === 'projected', 'default slot projects children')
  console.log('PASS: implicit slot projection (light DOM)')

  // === Test 5: Named slots ===
  window.dmWc('x-named-slot', '<header><slot name="title">fallback</slot></header><main><slot></slot></main>')
  const namedSlotEl = document.createElement('x-named-slot')
  namedSlotEl.innerHTML = '<span slot="title">My Title</span><p>Body content</p>'
  document.body.append(namedSlotEl)
  await waitFor(() => namedSlotEl.querySelector('header span'))
  assert(namedSlotEl.querySelector('header span').textContent === 'My Title', 'named slot projects matching child')
  assert(namedSlotEl.querySelector('main p').textContent === 'Body content', 'default slot projects unslotted child')
  console.log('PASS: named slot projection')

  // === Test 6: Slot fallback content preserved when no matching child ===
  window.dmWc('x-fallback-slot', '<div><slot name="missing">fallback-text</slot></div>')
  const fallbackEl = document.createElement('x-fallback-slot')
  document.body.append(fallbackEl)
  await waitFor(() => fallbackEl.querySelector('div'))
  assert(fallbackEl.querySelector('div slot[name="missing"]').textContent === 'fallback-text', 'fallback content preserved when no matching child')
  console.log('PASS: slot fallback content preserved')

  // === Test 7: :_wc per-host state initialization ===
  window.dmWc('x-counter', '<span data-m-ex:.@_wc.count></span>')
  document.body.insertAdjacentHTML('beforeend', '<x-counter id="c1" data-m-si:_wc=\'{"count":10}\'></x-counter>')
  document.body.insertAdjacentHTML('beforeend', '<x-counter id="c2" data-m-si:_wc=\'{"count":20}\'></x-counter>')
  window.dmScan()
  const c1 = document.getElementById('c1')
  const c2 = document.getElementById('c2')
  await waitFor(() => c1._wc && c2._wc)
  assert(c1._wc.count === 10, 'c1 _wc initialized')
  assert(c2._wc.count === 20, 'c2 _wc initialized')
  console.log('PASS: :_wc per-host state initialization')

  // === Test 8: :_wc state is independent between instances ===
  await waitFor(() => c1.querySelector('span') && c1.querySelector('span').textContent === '10')
  await waitFor(() => c2.querySelector('span') && c2.querySelector('span').textContent === '20')
  assert(c1.querySelector('span').textContent === '10', 'c1 reads own _wc.count')
  assert(c2.querySelector('span').textContent === '20', 'c2 reads own _wc.count')
  console.log('PASS: :_wc state independent between instances')

  // === Test 9: dmGetHost / dmSetHost helpers ===
  assert(window.dmGetHost(c1, 'count') === 10, 'dmGetHost reads c1.count')
  assert(window.dmGetHost(c2, 'count') === 20, 'dmGetHost reads c2.count')
  window.dmSetHost(c1, 'count', 42)
  assert(c1._wc.count === 42, 'dmSetHost updates c1._wc.count')
  assert(c2._wc.count === 20, 'dmSetHost does not affect c2')
  console.log('PASS: dmGetHost / dmSetHost public helpers')

  // === Test 10: dmSetHost triggers re-render ===
  await waitFor(() => c1.querySelector('span') && c1.querySelector('span').textContent === '42')
  assert(c1.querySelector('span').textContent === '42', 'dmSetHost triggers re-render of bound elements')
  console.log('PASS: dmSetHost triggers re-render')

  // === Test 11: :_wc on regular element (non-WC) ===
  document.body.insertAdjacentHTML('beforeend', '<div id="regular" data-m-si:_wc=\'{"x":1}\'><span data-m-ex:.@_wc.x></span></div>')
  window.dmScan()
  const regular = document.getElementById('regular')
  await waitFor(() => regular._wc && regular._wc.x === 1)
  assert(regular._wc.x === 1, ':_wc works on regular element')
  await waitFor(() => regular.querySelector('span') && regular.querySelector('span').textContent === '1')
  console.log('PASS: :_wc on regular element')

  // === Test 12: data-m-wc^dom.open via attribute (dmWcAttr path) ===
  document.body.insertAdjacentHTML('beforeend', '<template data-m-wc^dom.open="x-attr-shadow"><p>attr-shadow</p></template><x-attr-shadow></x-attr-shadow>')
  window.dmScan()
  const attrShadow = document.querySelector('x-attr-shadow')
  await waitFor(() => attrShadow && attrShadow.shadowRoot)
  assert(attrShadow.shadowRoot, 'dmWcAttr with ^dom.open creates shadow root')
  assert(attrShadow.shadowRoot.querySelector('p').textContent === 'attr-shadow', 'shadow content from attribute')
  console.log('PASS: data-m-wc^dom.open via attribute')

  // === Test 13: WC prop dispatch into shadow root ===
  window.dmWc('x-shadow-prop', '<div data-m-ex:.@.msg^ev.detail></div>', 'msg', new Set(['dom.open']))
  const shadowProp = document.createElement('x-shadow-prop')
  shadowProp.msg = 'hello-shadow'
  document.body.append(shadowProp)
  await waitFor(() => shadowProp.shadowRoot && shadowProp.shadowRoot.querySelector('div') && shadowProp.shadowRoot.querySelector('div').textContent === 'hello-shadow')
  assert(shadowProp.shadowRoot.querySelector('div').textContent === 'hello-shadow', 'prop dispatch works into shadow root')
  console.log('PASS: WC prop dispatch into shadow root')

  console.log('\n=== All dmWc v2 tests passed ===')
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
