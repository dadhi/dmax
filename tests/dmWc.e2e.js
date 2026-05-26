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

  const tpl1 = window.dmWc('x-card', '<p data-m-ex:.@msg></p>')
  assert(tpl1 && tpl1.tagName === 'TEMPLATE', 'dmWc(name, html) returns template')
  const card = document.createElement('x-card')
  document.body.append(card)
  window.dmSet('msg', 'hi')
  await waitFor(() => card.querySelector('p') && card.querySelector('p').textContent === 'hi')

  const tpl2 = document.createElement('template')
  tpl2.innerHTML = '<span data-m-ex:.@note></span>'
  assert.strictEqual(window.dmWc(tpl2, 'x-note'), tpl2, 'dmWc(template, name) returns same template')
  const note = document.createElement('x-note')
  document.body.append(note)
  window.dmSet('note', 'ok')
  await waitFor(() => note.querySelector('span') && note.querySelector('span').textContent === 'ok')

  window.dmWc('x-props', '<div data-m-ex:.@.msg^ev.detail></div>', 'msg')
  const props = document.createElement('x-props')
  props.msg = 'pre'
  document.body.append(props)
  await waitFor(() => props.querySelector('div') && props.querySelector('div').textContent === 'pre')
  props.msg = 'hello'
  await waitFor(() => props.querySelector('div') && props.querySelector('div').textContent === 'hello')

  window.dmWc('x-pair', '<i data-m-ex:.@.a^ev.detail></i><b data-m-ex:.@.b^ev.detail></b>', ['a', 'b'])
  const pair = document.createElement('x-pair')
  pair.a = 'A'
  pair.b = 'B'
  document.body.append(pair)
  await waitFor(() => pair.querySelector('i') && pair.querySelector('i').textContent === 'A' && pair.querySelector('b') && pair.querySelector('b').textContent === 'B')

  document.body.insertAdjacentHTML('beforeend', '<template data-m-wc="x-attr"><b data-m-ex:.@kind></b></template><x-attr></x-attr>')
  window.dmScan()
  window.dmSet('kind', 'attr-ok')
  await waitFor(() => document.querySelector('x-attr b') && document.querySelector('x-attr b').textContent === 'attr-ok')

  console.log('dmWc smoke test passed')
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
