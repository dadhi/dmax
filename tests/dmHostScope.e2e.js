// tests/dmHostScope.e2e.js
// E2E tests for shadow modes, implicit slots, and per-host :_wc signal scope.
// Mirrors the test plan from https://github.com/dadhi/dmax/issues/142

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')

function waitFor(conditionFn, timeout = 5000, interval = 20, label = '') {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function poll() {
      try {
        const value = conditionFn()
        if (value) return resolve(value)
      } catch (err) { return reject(new Error('waitFor[' + label + '] threw: ' + (err.message || err))) }
      if (Date.now() - start > timeout) {
        try { conditionFn() } catch (e) { return reject(new Error('waitFor[' + label + '] threw at timeout: ' + (e.message || e))) }
        return reject(new Error('waitFor[' + label + '] timed out'))
      }
      setTimeout(poll, interval)
    })()
  })
}

async function tick() {
  await new Promise(r => setTimeout(r, 0))
}

;(async () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'dmax.js'), 'utf8')
  const dom = new JSDOM(`<!doctype html><body><script>${src}</script></body>`, {
    runScripts: 'dangerously',
    pretendToBeVisual: true
  })
  const { window } = dom
  const { document } = window
  window.addEventListener('error', e => console.error('[window error]', e.message, e.error && e.error.stack))
  window.addEventListener('unhandledrejection', e => console.error('[unhandled rejection]', e.reason && e.reason.stack || e.reason))

  await waitFor(() => typeof window.dmWc === 'function' && typeof window.dmSetHost === 'function', 5000, 20, 'init')

  // ===========================================================================
  // 01. ^dom.open — host.shadowRoot exists, content is in shadow, input event works
  // ===========================================================================
  window.dmWc('hs-open', '<style>p{color:red}</style><p data-m-ex:.@note></p><input data-m-ex:note@.input>')
  const hsOpenTpl = window.dmWc('hs-open-mods', '<style>p{color:red}</style><p data-m-ex:.@note></p><input data-m-ex:note@.input>', undefined, [{ root: 'dom', path: ['open'] }])
  assert(hsOpenTpl, 'dmWc returns template')
  const hsOpen = document.createElement('hs-open-mods')
  document.body.append(hsOpen)
  await waitFor(() => hsOpen.shadowRoot && hsOpen.shadowRoot.querySelector('p'), 5000, 20, 'hsOpen shadow p')
  assert.strictEqual(hsOpen.shadowRoot.mode, 'open', 'shadow mode is open')
  assert(hsOpen.shadowRoot.querySelector('p'), 'cloned content is in shadow root')
  window.dmSet('note', 'shadow-hi')
  await waitFor(() => hsOpen.shadowRoot.querySelector('p').textContent === 'shadow-hi', 5000, 20, 'note set in shadow')
  // Input event inside shadow should propagate (composed: true) and update dm
  const input = hsOpen.shadowRoot.querySelector('input')
  input.value = 'typed-in-shadow'
  input.dispatchEvent(new window.Event('input', { bubbles: true, composed: true }))
  await waitFor(() => hsOpen.shadowRoot.querySelector('p').textContent === 'typed-in-shadow', 5000, 20, 'typed in shadow')
  document.body.removeChild(hsOpen)

  // ===========================================================================
  // 02. ^dom.closed — host.shadowRoot is null from outside, bindings still work
  // ===========================================================================
  window.dmWc('hs-closed', '<p data-m-ex:.@note></p>', undefined, [{ root: 'dom', path: ['closed'] }])
  const hsClosed = document.createElement('hs-closed')
  document.body.append(hsClosed)
  await waitFor(() => hsClosed.outerHTML.indexOf('hs-closed') >= 0, 5000, 20, 'hsClosed in DOM')
  assert.strictEqual(hsClosed.shadowRoot, null, 'shadowRoot is null from outside for closed shadow')

  // ===========================================================================
  // 03. Default is light DOM — <hs-light> (no mod) has no shadow root
  // ===========================================================================
  window.dmWc('hs-light', '<p data-m-ex:.@note></p>')
  const hsLight = document.createElement('hs-light')
  document.body.append(hsLight)
  await waitFor(() => hsLight.querySelector('p'), 5000, 20, 'hsLight p')
  assert.strictEqual(hsLight.shadowRoot, null, 'no shadow root for default light DOM')
  assert(hsLight.querySelector('p'), 'content is in light DOM')
  window.dmSet('note', 'light-hi')
  await waitFor(() => hsLight.querySelector('p').textContent === 'light-hi', 5000, 20, 'light-hi')
  document.body.removeChild(hsLight)

  // ===========================================================================
  // 04. Slots (implicit) — projected children land in slot position, fallback preserved
  // ===========================================================================
  window.dmWc('hs-slot', '<article><h1>Card</h1><slot name="title">fallback-title</slot><slot>fallback-default</slot></article>')

  // Default slot only — span without slot attr goes into default slot
  const hsSlot1 = document.createElement('hs-slot')
  hsSlot1.innerHTML = '<span class="d">d-content</span>'
  document.body.appendChild(hsSlot1)
  await waitFor(() => hsSlot1.querySelector('article'), 5000, 20, 'hsSlot1 article')
  assert.strictEqual(hsSlot1.querySelector('h1').textContent, 'Card', 'static part rendered')
  assert.strictEqual(hsSlot1.querySelector('span.d').textContent, 'd-content', 'default slot projected')
  // Named slot (title) keeps fallback because no child has slot="title"
  assert.strictEqual(hsSlot1.querySelectorAll('slot').length, 1, 'named slot keeps fallback when no match')
  const fbTitleEl = hsSlot1.querySelector('article > slot')
  assert.strictEqual(fbTitleEl.textContent, 'fallback-title', 'named slot fallback preserved when no match')

  // Named slot matching — both named and default slot are filled
  const hsSlot2 = document.createElement('hs-slot')
  hsSlot2.innerHTML = '<span slot="title">T</span><span class="d">d</span>'
  document.body.appendChild(hsSlot2)
  await waitFor(() => hsSlot2.querySelector('article'), 5000, 20, 'hsSlot2 article')
  assert.strictEqual(hsSlot2.querySelectorAll('slot').length, 0, 'no slot elements remain when all are projected')
  const children = hsSlot2.querySelectorAll('article > *')
  assert.strictEqual(children[1].textContent, 'T', 'named slot projected')
  assert.strictEqual(children[2].textContent, 'd', 'default slot projected alongside named')
  document.body.removeChild(hsSlot1)
  document.body.removeChild(hsSlot2)

  // Recursive slots: nested WC inside outer WC with slots
  window.dmWc('hs-inner', '<section><slot name="body">inner-fallback</slot></section>')
  const hsOuterTpl = document.createElement('template')
  hsOuterTpl.setAttribute('data-m-wc', 'hs-outer')
  hsOuterTpl.innerHTML = '<div><hs-inner><span slot="body">inner-content</span></hs-inner></div>'
  window.dmWc(hsOuterTpl, 'hs-outer')
  const hsOuter = document.createElement('hs-outer')
  document.body.appendChild(hsOuter)
  await waitFor(() => hsOuter.querySelector('hs-inner'), 5000, 20, 'hsOuter hs-inner')
  await waitFor(() => hsOuter.querySelector('hs-inner').querySelector('span'), 5000, 20, 'recursive slot')
  assert.strictEqual(hsOuter.querySelector('hs-inner').querySelector('span').textContent, 'inner-content', 'recursive slot projection')
  document.body.removeChild(hsOuter)

  // ===========================================================================
  // 05. :_wc on a WC — each instance has its own _wc
  // ===========================================================================
  window.dmWc('hs-counter', '<button data-m-ex:_wc.count^inc@.click>+1</button><span data-m-ex:.@_wc.count></span>')
  const c1 = document.createElement('hs-counter')
  c1.setAttribute('data-m-si:_wc.count', '0')
  const c2 = document.createElement('hs-counter')
  c2.setAttribute('data-m-si:_wc.count', '10')
  document.body.append(c1)
  document.body.append(c2)
  await waitFor(() => c1.querySelector('span') && c2.querySelector('span'), 5000, 20, 'c1 c2 spans')
  assert.strictEqual(c1.querySelector('span').textContent, '0', 'c1 starts at 0')
  assert.strictEqual(c2.querySelector('span').textContent, '10', 'c2 starts at 10')
  // Click c1 twice
  c1.querySelector('button').click()
  c1.querySelector('button').click()
  await waitFor(() => c1.querySelector('span').textContent === '2', 5000, 20, 'c1 incremented')
  assert.strictEqual(c1.querySelector('span').textContent, '2', 'c1 incremented')
  assert.strictEqual(c2.querySelector('span').textContent, '10', 'c2 unaffected by c1 click')
  assert.strictEqual(window.dmGetHost(c1, 'count'), 2, 'dmGetHost reads c1._wc.count')
  assert.strictEqual(window.dmGetHost(c2, 'count'), 10, 'dmGetHost reads c2._wc.count')
  assert.notStrictEqual(c1._wc, c2._wc, 'c1 and c2 have distinct _wc objects')
  document.body.removeChild(c1)
  document.body.removeChild(c2)

  // ===========================================================================
  // 06. :_wc on a regular element — host resolution via ancestor lookup
  // ===========================================================================
  // The first div initializes its _wc via data-m-si.
  // The second div reads/writes the FIRST div's _wc via ancestor walk-up.
  const reg1 = document.createElement('div')
  reg1.innerHTML = '<button data-m-ex:_wc.x^inc@.click>inc</button><span data-m-ex:.@_wc.x></span>'
  reg1.setAttribute('data-m-si:_wc', JSON.stringify({ x: 1 }))
  document.body.append(reg1)
  window.dmScan(reg1)
  await waitFor(() => reg1.querySelector('span').textContent === '1', 5000, 20, 'reg1 initial')
  const reg1Btn = reg1.querySelector('button')
  reg1Btn.click()
  reg1Btn.click()
  reg1Btn.click()
  await waitFor(() => reg1.querySelector('span').textContent === '4', 5000, 20, 'reg1 incremented')
  assert.strictEqual(reg1.querySelector('span').textContent, '4', 'reg1._wc.x incremented 3 times')
  assert.strictEqual(window.dm.x, undefined, 'dm.x is not set')
  assert.strictEqual(window.dmGetHost(reg1, 'x'), 4, 'dmGetHost reads reg1._wc.x')
  document.body.removeChild(reg1)

  // ===========================================================================
  // 07. :_wc on a list item — each li has its own _wc
  // ===========================================================================
  window.dmSet('items', [{ id: 'a' }, { id: 'b' }, { id: 'c' }])
  // Build the ul via innerHTML so we can include @ in the attribute name
  const ulContainer = document.createElement('div')
  ulContainer.innerHTML = '<ul data-m-it@items><template><li data-m-ex:_wc.hovered^bool@.mouseenter="true"></li></template></ul>'
  const ul = ulContainer.querySelector('ul')
  document.body.appendChild(ul)
  window.dmScan(ul)
  await waitFor(() => ul.querySelectorAll('li').length === 3, 5000, 20, '3 li')
  const lis = ul.querySelectorAll('li')
  assert.strictEqual(lis.length, 3, 'three li rendered')
  lis[1].dispatchEvent(new window.Event('mouseenter'))
  await waitFor(() => lis[1]._wc && lis[1]._wc.hovered === true, 5000, 20, 'li[1] hovered')
  assert.strictEqual(lis[1]._wc.hovered, true, 'second li._wc.hovered is true')
  assert.strictEqual(lis[0]._wc, undefined, 'first li._wc not touched')
  assert.strictEqual(lis[2]._wc, undefined, 'third li._wc not touched')
  document.body.removeChild(ul)
  window.dmSet('items', null)

  // ===========================================================================
  // 08. Composition with ^merge — host._wc.todos, not dm.todos
  // ===========================================================================
  const comp = document.createElement('div')
  comp.setAttribute('data-m-si:_wc', JSON.stringify({ todos: [{ id: 1, done: false }] }))
  comp.innerHTML = '<button data-m-ex:_wc.todos^merge@.click="[{id:2, done:true}]">merge</button><span data-m-ex:.@_wc.todos></span>'
  document.body.appendChild(comp)
  window.dmScan(comp)
  await tick()
  const compBtn = comp.querySelector('button')
  compBtn.click()
  await waitFor(() => {
    const arr = window.dmGetHost(comp, 'todos')
    return arr && arr.length === 2 && arr[1].id === 2 && arr[1].done === true
  }, 5000, 20, '_wc.todos merged')
  assert.strictEqual(window.dm.todos, undefined, 'dm.todos is not set')
  assert.strictEqual(window.dmGetHost(comp, 'todos').length, 2, '_wc.todos merged')

  // ===========================================================================
  // 09. Composition with ^rw — two-way bind on host._wc.draft
  // ===========================================================================
  const rwEl = document.createElement('div')
  rwEl.setAttribute('data-m-si:_wc.draft', '"hello"')
  rwEl.innerHTML = '<input data-m-ex@.^rw@_wc.draft><span data-m-ex:.@_wc.draft></span>'
  document.body.appendChild(rwEl)
  window.dmScan(rwEl)
  await tick()
  const rwRead = rwEl.querySelector('span')
  const rwInput = rwEl.querySelector('input')
  assert.strictEqual(rwRead.textContent, 'hello', 'initial draft rendered')
  rwInput.value = 'world'
  rwInput.dispatchEvent(new window.Event('change', { bubbles: true }))
  await waitFor(() => rwRead.textContent === 'world', 5000, 20, '^rw draft world')
  assert.strictEqual(window.dmGetHost(rwEl, 'draft'), 'world', '_wc.draft is updated via ^rw')
  assert.strictEqual(window.dm.draft, undefined, 'dm.draft is not set')

  // ===========================================================================
  // 10. Cleanup — host.remove() tears down _wc subs
  // ===========================================================================
  const c10 = document.createElement('div')
  c10.setAttribute('data-m-si:_wc.x', '0')
  c10.innerHTML = '<button data-m-ex:_wc.x^inc@.click>inc</button>'
  document.body.appendChild(c10)
  window.dmScan(c10)
  await tick()
  const c10Btn = c10.querySelector('button')
  c10Btn.click()
  c10Btn.click()
  await waitFor(() => window.dmGetHost(c10, 'x') === 2, 5000, 20, 'c10 _wc.x === 2')
  const subsBefore = window.dmGetHost(c10, 'x')
  assert.strictEqual(subsBefore, 2, 'before cleanup _wc.x is 2')
  document.body.removeChild(c10)
  await tick()

  // ===========================================================================
  // 11. Public helpers — dmGetHost / dmSetHost trigger re-render
  // ===========================================================================
  const c11 = document.createElement('div')
  c11.innerHTML = '<span data-m-ex:.@_wc.label></span>'
  document.body.appendChild(c11)
  window.dmScan(c11)
  await tick()
  const c11Read = c11.querySelector('span')
  assert.strictEqual(c11Read.textContent, '', 'empty initial')
  window.dmSetHost(c11, 'label', 'hello-host')
  await waitFor(() => c11Read.textContent === 'hello-host', 5000, 20, 'c11 label set')
  assert.strictEqual(window.dmGetHost(c11, 'label'), 'hello-host', 'round-trip via dmGetHost/dmSetHost')
  window.dmSetHost(c11, 'obj.deep', 42)
  await waitFor(() => window.dmGetHost(c11, 'obj.deep') === 42, 5000, 20, 'nested path')
  assert.strictEqual(window.dmGetHost(c11, 'obj.deep'), 42, 'nested path')

  document.body.removeChild(comp)
  document.body.removeChild(rwEl)
  document.body.removeChild(c11)

  // ===========================================================================
  // 12. CSS custom properties — :style.--name (explicit) sets the --custom prop
  // ===========================================================================
  const c12 = document.createElement('div')
  c12.setAttribute('data-m-si', '{"gap":1,"accent":"red"}')
  c12.innerHTML = '<div data-m-ex:.style.--gap@gap><div data-m-ex:.style.--gap-2@gap="val*2"><div data-m-ex:.style.--accent-color@accent="String(val)"></div></div></div>'
  document.body.appendChild(c12)
  window.dmScan(c12)
  await tick()
  const cssDivs = c12.querySelectorAll('div')
  assert.strictEqual(cssDivs[0].style.getPropertyValue('--gap'), '1', ':style.--gap writes the explicit --gap custom property')
  assert.strictEqual(cssDivs[1].style.getPropertyValue('--gap-2'), '2', ':style.--gap-2 writes a custom property with an internal dash')
  assert.strictEqual(cssDivs[2].style.getPropertyValue('--accent-color'), 'red', ':style.--accent-color preserves internal dashes')
  // The explicit -- syntax must NOT have leaked into a '---gap' typo
  assert.strictEqual(cssDivs[0].style.getPropertyValue('---gap'), '', 'no ---gap triple-dash typo')
  document.body.removeChild(c12)

  console.log('dmHostScope tests passed (shadow modes, slots, :_wc, css custom props)')
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
