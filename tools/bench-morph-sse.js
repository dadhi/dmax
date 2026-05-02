// @ts-nocheck
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const HTML_FILE = path.join(ROOT, 'index.html')
const DMAX_FILE = path.join(ROOT, 'dmax.js')
const DATASTAR_FILE = path.join(ROOT, 'tools', 'vendor', 'datastar.js')
const VENDORED_JSDOM_DIR = path.join(ROOT, 'tools', 'vendor', 'jsdom')
const GRID_FILL_RATIO = 0.66
const MAX_CELL_VALUE = 100
const CELL_CLEAR_RATIO = 0.12
const LCG_MULTIPLIER = 1664525
const LCG_INCREMENT = 1013904223
const DATASTAR_SSE_EVENT = 'datastar-sse'
const DATASTAR_MERGE_FRAGMENTS = 'datastar-merge-fragments'

function loadJsdom() {
  try {
    return require('jsdom')
  } catch (err) {
    if (!err || err.code !== 'MODULE_NOT_FOUND') throw err
    try {
      return require(VENDORED_JSDOM_DIR)
    } catch (vendorErr) {
      const msg = [
        'Unable to load jsdom for the benchmark.',
        '',
        'Install project dependencies with:',
        '  npm install',
        '',
        'Or vendor the complete jsdom package tree at:',
        `  ${path.relative(ROOT, VENDORED_JSDOM_DIR)}`,
        '',
        'Note: unlike tools/vendor/datastar.js, jsdom is not a single browser bundle;',
        'it is a Node package with transitive dependencies, so the whole package tree must be vendored.'
      ].join('\n')
      const e = new Error(msg)
      e.cause = vendorErr
      throw e
    }
  }
}

const { JSDOM, VirtualConsole } = loadJsdom()

function makeRng(seed) {
  // Tiny deterministic LCG using the classic Numerical Recipes constants.
  let state = seed >>> 0
  return () => ((state = (state * LCG_MULTIPLIER + LCG_INCREMENT) >>> 0) / 0x100000000)
}

function cloneCells(cells) {
  return cells.map(row => row.slice())
}

function escapeHtml(val) {
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildGrid(rows, cols, seed) {
  const rand = makeRng(seed)
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null))
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    cells[r][c] = rand() < GRID_FILL_RATIO ? Math.floor(rand() * MAX_CELL_VALUE) : null
  return cells
}

function mutateGrid(cells, seed, changeCount) {
  const rand = makeRng(seed)
  const next = cloneCells(cells)
  for (let i = 0; i < changeCount; i++) {
    const r = Math.floor(rand() * next.length)
    const c = Math.floor(rand() * next[0].length)
    next[r][c] = rand() < CELL_CLEAR_RATIO ? null : Math.floor(rand() * MAX_CELL_VALUE)
  }
  return next
}

function summarizeGrid(cells) {
  const rows = cells.length, cols = cells[0].length
  const rowSums = Array(rows).fill(0)
  const colSums = Array(cols).fill(0)
  let total = 0
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const val = cells[r][c]
    if (val == null) continue
    rowSums[r] += val
    colSums[c] += val
    total += val
  }
  return { rowSums, colSums, total }
}

function renderGridHtml(cells) {
  const { rowSums, colSums, total } = summarizeGrid(cells)
  const rows = cells.length, cols = cells[0].length
  let out = '<div id="bench-app"><table id="bench-grid"><tbody>'
  for (let r = 0; r < rows; r++) {
    out += `<tr id="row-${r}">`
    for (let c = 0; c < cols; c++) {
      const val = cells[r][c]
      out += `<td id="cell-${r}-${c}" data-row="${r}" data-col="${c}">${val == null ? '' : escapeHtml(val)}</td>`
    }
    out += `<th id="sum-row-${r}">${rowSums[r]}</th></tr>`
  }
  out += '<tr id="totals-row">'
  for (let c = 0; c < cols; c++) out += `<th id="sum-col-${c}">${colSums[c]}</th>`
  out += `<th id="sum-total">${total}</th></tr></tbody></table></div>`
  return out
}

function expectedCellAndTotals(cells, row, col) {
  const { rowSums, colSums, total } = summarizeGrid(cells)
  return {
    cell: cells[row][col] == null ? '' : String(cells[row][col]),
    row: String(rowSums[row]),
    col: String(colSums[col]),
    total: String(total)
  }
}

function readCellAndTotals(host, row, col) {
  return {
    cell: host.querySelector(`#cell-${row}-${col}`)?.textContent || '',
    row: host.querySelector(`#sum-row-${row}`)?.textContent || '',
    col: host.querySelector(`#sum-col-${col}`)?.textContent || '',
    total: host.querySelector('#sum-total')?.textContent || ''
  }
}

function assertSnapshot(actual, expected, label) {
  if (actual.cell !== expected.cell || actual.row !== expected.row || actual.col !== expected.col || actual.total !== expected.total)
    throw new Error(`Snapshot mismatch (${label}) expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`)
}

function renderPointedPatch(cells, row, col) {
  const { rowSums, colSums, total } = summarizeGrid(cells)
  const val = cells[row][col]
  return [
    `<td id="cell-${row}-${col}" data-row="${row}" data-col="${col}">${val == null ? '' : escapeHtml(val)}</td>`,
    `<th id="sum-row-${row}">${rowSums[row]}</th>`,
    `<th id="sum-col-${col}">${colSums[col]}</th>`,
    `<th id="sum-total">${total}</th>`
  ].join('')
}

function renderOobPatch(cells, row, col) {
  const val = cells[row][col]
  return `<td id="cell-${row}-${col}" data-oob="morph" data-row="${row}" data-col="${col}">${val == null ? '' : escapeHtml(val)}</td>`
}

function makeSseOuter(html, selector = '') {
  const safeHtml = String(html).replace(/\r/g, '')
  const lines = [
    'event: dmax-patch-elements',
    'data: mode outer'
  ]
  if (selector) lines.push(`data: selector ${selector}`)
  for (const line of safeHtml.split('\n')) lines.push(`data: dmaxElements ${line}`)
  lines.push('')
  return lines.join('\n')
}

function loadDatastarScript() {
  return fs.readFileSync(DATASTAR_FILE, 'utf8')
    // The vendored Datastar bundle is ESM. In jsdom we run it as an inline
    // classic script so the benchmark can dispatch Datastar's internal SSE
    // CustomEvents without adding a package/build dependency.
    .replace(/export\{[^}]+\};?/, '')
}

async function loadDmaxWindow() {
  const html = fs.readFileSync(HTML_FILE, 'utf8')
    .replace('<script src="dmax.js"></script>', `<script>${fs.readFileSync(DMAX_FILE, 'utf8')}</script>`)
  const vcon = new VirtualConsole()
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vcon
  })
  const { window } = dom
  await new Promise(resolve => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setTimeout(resolve, 30)
    }
    window.addEventListener('load', finish, { once: true })
    window.addEventListener('dmax:tests:done', finish, { once: true })
    setTimeout(finish, 2000)
  })
  return window
}

async function loadDatastarWindow() {
  const vcon = new VirtualConsole()
  const dom = new JSDOM(`<!doctype html><html><head></head><body><script>${loadDatastarScript()}</script></body></html>`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vcon
  })
  const { window } = dom
  await new Promise(resolve => setTimeout(resolve, 30))
  return window
}

function formatNum(n, digits = 2) {
  return Number(n).toFixed(digits)
}

function runScenario(name, iters, setup, applyA, applyB, check, validateA = null, validateB = null) {
  setup()
  for (let i = 0; i < 10; i++) {
    if (i % 2) {
      applyA()
      if (validateA) validateA()
    } else {
      applyB()
      if (validateB) validateB()
    }
  }
  if (global.gc) global.gc()
  const startMem = process.memoryUsage().heapUsed
  const t0 = process.hrtime.bigint()
  for (let i = 0; i < iters; i++) (i % 2 ? applyA : applyB)()
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  if (validateA) { applyA(); validateA() }
  if (validateB) { applyB(); validateB() }
  if (global.gc) global.gc()
  const endMem = process.memoryUsage().heapUsed
  const result = check()
  return {
    name,
    iters,
    ms,
    avgMs: ms / iters,
    opsPerSec: iters / ms * 1000,
    memDelta: endMem - startMem,
    result
  }
}

function applyDatastarFragments(window, fragments, mergeMode, selector = '') {
  window.document.dispatchEvent(new window.CustomEvent(DATASTAR_SSE_EVENT, {
    detail: {
      type: DATASTAR_MERGE_FRAGMENTS,
      argsRaw: {
        fragments,
        mergeMode,
        selector,
        useViewTransition: 'false'
      }
    }
  }))
}

function makePayloads() {
  const baseCells = buildGrid(32, 32, 7)
  const smallDiffCells = mutateGrid(baseCells, 17, 1)
  const largeDiffCells = mutateGrid(baseCells, 29, 220)
  const focusRow = 11, focusCol = 17

  const baseHtml = renderGridHtml(baseCells)
  const smallHtml = renderGridHtml(smallDiffCells)
  const largeHtml = renderGridHtml(largeDiffCells)
  const basePointed = renderPointedPatch(baseCells, focusRow, focusCol)
  const smallPointed = renderPointedPatch(smallDiffCells, focusRow, focusCol)
  const baseOob = renderOobPatch(baseCells, focusRow, focusCol)
  const smallOob = renderOobPatch(smallDiffCells, focusRow, focusCol)

  return {
    focusRow,
    focusCol,
    baseHtml,
    smallHtml,
    largeHtml,
    basePointed,
    smallPointed,
    baseOob,
    smallOob,
    expectedBase: expectedCellAndTotals(baseCells, focusRow, focusCol),
    expectedSmall: expectedCellAndTotals(smallDiffCells, focusRow, focusCol),
    expectedLarge: expectedCellAndTotals(largeDiffCells, focusRow, focusCol),
    baseSse: makeSseOuter(basePointed),
    smallSse: makeSseOuter(smallPointed)
  }
}

function runDmaxScenarios(window, payloads) {
  const { document, applyDmaxPatchElements, applyDmaxSse, applyOobHtml } = window
  if (typeof applyDmaxPatchElements !== 'function' || typeof applyDmaxSse !== 'function' || typeof applyOobHtml !== 'function')
    throw new Error('dmax benchmark helpers are not available on window')

  const host = document.createElement('div')
  host.id = 'bench-host'
  document.body.appendChild(host)

  const mountBase = () => { host.innerHTML = payloads.baseHtml }
  const cellText = () => (host.querySelector(`#cell-${payloads.focusRow}-${payloads.focusCol}`)?.textContent || '')
  const snapshot = () => readCellAndTotals(host, payloads.focusRow, payloads.focusCol)
  const validateBase = () => assertSnapshot(snapshot(), payloads.expectedBase, 'dmax/base')
  const validateSmall = () => assertSnapshot(snapshot(), payloads.expectedSmall, 'dmax/small-diff')
  const validateLarge = () => assertSnapshot(snapshot(), payloads.expectedLarge, 'dmax/large-diff')
  const validateBaseCell = () => {
    if (cellText() !== payloads.expectedBase.cell) throw new Error(`Cell mismatch (dmax/base-cell) expected=${payloads.expectedBase.cell} actual=${cellText()}`)
  }
  const validateSmallCell = () => {
    if (cellText() !== payloads.expectedSmall.cell) throw new Error(`Cell mismatch (dmax/small-cell) expected=${payloads.expectedSmall.cell} actual=${cellText()}`)
  }

  return [
    runScenario(
      'pointed-sse-small-diff',
      500,
      mountBase,
      () => applyDmaxSse(payloads.smallSse, 'bench'),
      () => applyDmaxSse(payloads.baseSse, 'bench'),
      cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'oob-morph-small-diff',
      500,
      mountBase,
      () => applyOobHtml(payloads.smallOob),
      () => applyOobHtml(payloads.baseOob),
      cellText,
      validateSmallCell,
      validateBaseCell
    ),
    runScenario(
      'full-page-small-diff-morph',
      120,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.smallHtml }),
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }),
      cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'full-page-small-diff-replace',
      120,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.smallHtml }),
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.baseHtml }),
      cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'full-page-large-diff-morph',
      30,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.largeHtml }),
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }),
      cellText,
      validateLarge,
      validateBase
    ),
    runScenario(
      'full-page-large-diff-replace',
      30,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.largeHtml }),
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.baseHtml }),
      cellText,
      validateLarge,
      validateBase
    )
  ].map(r => ({ framework: 'dmax', ...r }))
}

function runDatastarScenarios(window, payloads) {
  const { document } = window
  const host = document.createElement('div')
  host.id = 'bench-host'
  document.body.appendChild(host)

  const mountBase = () => { host.innerHTML = payloads.baseHtml }
  const cellText = () => (host.querySelector(`#cell-${payloads.focusRow}-${payloads.focusCol}`)?.textContent || '')
  const mergeFragments = (fragments, mergeMode, selector = '') => applyDatastarFragments(window, fragments, mergeMode, selector)
  const snapshot = () => readCellAndTotals(host, payloads.focusRow, payloads.focusCol)
  const validateBase = () => assertSnapshot(snapshot(), payloads.expectedBase, 'datastar/base')
  const validateSmall = () => assertSnapshot(snapshot(), payloads.expectedSmall, 'datastar/small-diff')
  const validateLarge = () => assertSnapshot(snapshot(), payloads.expectedLarge, 'datastar/large-diff')
  const validateBaseCell = () => {
    if (cellText() !== payloads.expectedBase.cell) throw new Error(`Cell mismatch (datastar/base-cell) expected=${payloads.expectedBase.cell} actual=${cellText()}`)
  }
  const validateSmallCell = () => {
    if (cellText() !== payloads.expectedSmall.cell) throw new Error(`Cell mismatch (datastar/small-cell) expected=${payloads.expectedSmall.cell} actual=${cellText()}`)
  }

  return [
    runScenario(
      'pointed-fragments-small-diff',
      500,
      mountBase,
      () => mergeFragments(payloads.smallPointed, 'morph'),
      () => mergeFragments(payloads.basePointed, 'morph'),
      cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'single-fragment-small-diff',
      500,
      mountBase,
      () => mergeFragments(payloads.smallOob.replace(' data-oob="morph"', ''), 'morph'),
      () => mergeFragments(payloads.baseOob.replace(' data-oob="morph"', ''), 'morph'),
      cellText,
      validateSmallCell,
      validateBaseCell
    ),
    runScenario(
      'full-page-small-diff-morph',
      120,
      mountBase,
      () => mergeFragments(payloads.smallHtml, 'morph', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'morph', '#bench-app'),
      cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'full-page-small-diff-replace',
      120,
      mountBase,
      () => mergeFragments(payloads.smallHtml, 'outer', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'outer', '#bench-app'),
      cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'full-page-large-diff-morph',
      30,
      mountBase,
      () => mergeFragments(payloads.largeHtml, 'morph', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'morph', '#bench-app'),
      cellText,
      validateLarge,
      validateBase
    ),
    runScenario(
      'full-page-large-diff-replace',
      30,
      mountBase,
      () => mergeFragments(payloads.largeHtml, 'outer', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'outer', '#bench-app'),
      cellText,
      validateLarge,
      validateBase
    )
  ].map(r => ({ framework: 'datastar', ...r }))
}

;(async () => {
  const payloads = makePayloads()
  const dmaxWindow = await loadDmaxWindow()
  const datastarWindow = await loadDatastarWindow()
  const results = [
    ...runDmaxScenarios(dmaxWindow, payloads),
    ...runDatastarScenarios(datastarWindow, payloads)
  ]

  console.log('dmax vs Datastar semi-realistic SSE/morph benchmark')
  console.log('grid: 32x32, ~66% populated, reactive row/column/total cells included in the HTML payload')
  console.log('datastar: vendored tools/vendor/datastar.js, merge-fragments CustomEvent path')
  console.log(global.gc
    ? 'memory: heap delta measured with explicit GC before/after each scenario'
    : 'memory: heap delta measured without explicit GC (run with `node --expose-gc` for cleaner numbers)')
  console.log('')
  console.log('framework   scenario                         iters   total-ms   avg-ms   ops/s     mem-delta   final-cell')
  console.log('----------------------------------------------------------------------------------------------------------')
  for (const r of results) {
    const line = [
      r.framework.padEnd(9),
      r.name.padEnd(32),
      String(r.iters).padStart(5),
      formatNum(r.ms).padStart(10),
      formatNum(r.avgMs, 3).padStart(8),
      formatNum(r.opsPerSec, 1).padStart(8),
      String(r.memDelta).padStart(11),
      String(r.result).padStart(11)
    ].join('   ')
    console.log(line)
  }
  dmaxWindow.close()
  datastarWindow.close()
})().catch(err => {
  console.error(err && err.stack ? err.stack : err)
  process.exitCode = 1
})
