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
  const html = `<!doctype html><html><head><script>${src}</script></head><body><div data-m-si='{"foo":"ok"}'></div><strong id="out" data-m-ex:.@foo></strong></body></html>`
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true })
  const { window } = dom
  await waitFor(() => window.document.getElementById('out') && window.document.getElementById('out').textContent === 'ok')
  assert.strictEqual(window.dm.foo, 'ok', 'auto-scan seeds signals')
  assert.strictEqual(window.document.getElementById('out').textContent, 'ok', 'auto-scan wires body bindings')
  console.log('dmax auto-scan smoke test passed')
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
