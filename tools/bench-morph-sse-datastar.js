const fs = require('fs')
const path = require('path')
const https = require('https')
const { JSDOM, VirtualConsole } = require('jsdom')

const LOCAL_BUNDLE_PATH = path.join(__dirname, 'vendor', 'datastar.js')
const DATASTAR_URLS = [
  'https://cdn.jsdelivr.net/npm/@starfederation/datastar@latest/dist/datastar.js',
  'https://unpkg.com/@starfederation/datastar@latest/dist/datastar.js'
]

const GRID_FILL_RATIO = 0.66
const MAX_CELL_VALUE = 100
const CELL_CLEAR_RATIO = 0.12
const LCG_MULTIPLIER = 1664525
const LCG_INCREMENT = 1013904223

function makeRng(seed) { let s = seed >>> 0; return () => ((s = (s * LCG_MULTIPLIER + LCG_INCREMENT) >>> 0) / 0x100000000) }
function cloneCells(cells) { return cells.map(row => row.slice()) }
function escapeHtml(val) { return String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;') }
function buildGrid(rows, cols, seed) {
  const rand = makeRng(seed)
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null))
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells[r][c] = rand() < GRID_FILL_RATIO ? Math.floor(rand() * MAX_CELL_VALUE) : null
  return cells
}
function mutateGrid(cells, seed, changeCount) {
  const rand = makeRng(seed), next = cloneCells(cells)
  for (let i = 0; i < changeCount; i++) {
    const r = Math.floor(rand() * next.length), c = Math.floor(rand() * next[0].length)
    next[r][c] = rand() < CELL_CLEAR_RATIO ? null : Math.floor(rand() * MAX_CELL_VALUE)
  }
  return next
}
function summarizeGrid(cells) {
  const rows = cells.length, cols = cells[0].length, rowSums = Array(rows).fill(0), colSums = Array(cols).fill(0)
  let total = 0
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const v = cells[r][c]; if (v == null) continue; rowSums[r] += v; colSums[c] += v; total += v }
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
  if (actual.cell !== expected.cell || actual.row !== expected.row || actual.col !== expected.col || actual.total !== expected.total) {
    throw new Error(`Snapshot mismatch (${label}) expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`)
  }
}

function fetchText(url) { return new Promise((resolve, reject) => { https.get(url, res => { if (res.statusCode !== 200) { reject(new Error(`CDN fetch failed (${res.statusCode}): ${url}`)); res.resume(); return } let body = ''; res.setEncoding('utf8'); res.on('data', c => { body += c }); res.on('end', () => resolve(body)) }).on('error', reject) }) }
async function loadDatastarSource() {
  if (fs.existsSync(LOCAL_BUNDLE_PATH)) return { source: fs.readFileSync(LOCAL_BUNDLE_PATH, 'utf8'), sourceLabel: `local file (${LOCAL_BUNDLE_PATH})` }
  const errs = []
  for (const url of DATASTAR_URLS) try { return { source: await fetchText(url), sourceLabel: url } } catch (e) { errs.push(`${url} -> ${(e && (e.message || e.code || e.toString())) || 'unknown network error'}`) }
  throw new Error(`No local Datastar bundle found at ${LOCAL_BUNDLE_PATH}.\nCDN fetch attempts failed:\n${errs.join('\n')}\n\nTo run offline, place Datastar at tools/vendor/datastar.js (see README instructions).`)
}


function normalizeDatastarSource(source) {
  return String(source)
    .replace(/export\s*\{[^}]*\};?\s*$/m, '')
    .replace(/\n\/\/\# sourceMappingURL=.*$/m, '\n')
}

function loadWindow(datastarSource) {
  const html = `<!doctype html><html><head></head><body><div id="bench-host"></div><script>${normalizeDatastarSource(datastarSource)}</script></body></html>`
  const vc = new VirtualConsole(); vc.on('jsdomError', e => console.error(e)); vc.on('error', e => console.error(e)); const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc })
  return dom.window
}
function formatNum(n, d = 2) { return Number(n).toFixed(d) }
async function runScenario(name, iters, setup, applyA, applyB, check, validateA, validateB) {
  setup(); for (let i = 0; i < 10; i++) { if (i % 2) { await applyA(); if (validateA) validateA() } else { await applyB(); if (validateB) validateB() } } if (global.gc) global.gc()
  const startMem = process.memoryUsage().heapUsed, t0 = process.hrtime.bigint()
  for (let i = 0; i < iters; i++) { if (i % 2) { await applyA(); if (validateA) validateA() } else { await applyB(); if (validateB) validateB() } }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6; if (global.gc) global.gc(); const endMem = process.memoryUsage().heapUsed
  return { name, iters, ms, avgMs: ms / iters, opsPerSec: iters / ms * 1000, memDelta: endMem - startMem, result: check() }
}

async function dispatchPatch(window, html, mode = 'outer') {
  const modeMap = { outer: 'morph', replace: 'outer' }
  window.document.dispatchEvent(new window.CustomEvent('datastar-sse', { detail: { type: 'datastar-merge-fragments', argsRaw: { fragments: html, mergeMode: modeMap[mode] || 'morph' } } }))
  await new Promise(resolve => window.setTimeout(resolve, 0))
}

;(async () => {
  const payload = await loadDatastarSource()
  const window = loadWindow(payload.source)
  const host = window.document.getElementById('bench-host')

  const baseCells = buildGrid(32, 32, 7)
  const smallDiffCells = mutateGrid(baseCells, 17, 1)
  const largeDiffCells = mutateGrid(baseCells, 29, 220)
  const focusRow = 11, focusCol = 17
  const baseHtml = renderGridHtml(baseCells), smallHtml = renderGridHtml(smallDiffCells), largeHtml = renderGridHtml(largeDiffCells)

  const mountBase = () => { host.innerHTML = baseHtml }
  const cellText = () => host.querySelector(`#cell-${focusRow}-${focusCol}`)?.textContent || ''
  const expectedBase = expectedCellAndTotals(baseCells, focusRow, focusCol)
  const expectedSmall = expectedCellAndTotals(smallDiffCells, focusRow, focusCol)
  const expectedLarge = expectedCellAndTotals(largeDiffCells, focusRow, focusCol)

  const verifyBase = () => assertSnapshot(readCellAndTotals(host, focusRow, focusCol), expectedBase, 'base')
  const verifySmall = () => assertSnapshot(readCellAndTotals(host, focusRow, focusCol), expectedSmall, 'small-diff')
  const verifyLarge = () => assertSnapshot(readCellAndTotals(host, focusRow, focusCol), expectedLarge, 'large-diff')

  const results = [
    await runScenario('datastar-full-page-small-diff-morph', 120, mountBase, () => dispatchPatch(window, smallHtml, 'outer'), () => dispatchPatch(window, baseHtml, 'outer'), cellText, verifySmall, verifyBase),
    await runScenario('datastar-full-page-small-diff-replace', 120, mountBase, () => dispatchPatch(window, smallHtml, 'replace'), () => dispatchPatch(window, baseHtml, 'replace'), cellText, verifySmall, verifyBase),
    await runScenario('datastar-full-page-large-diff-morph', 30, mountBase, () => dispatchPatch(window, largeHtml, 'outer'), () => dispatchPatch(window, baseHtml, 'outer'), cellText, verifyLarge, verifyBase),
    await runScenario('datastar-full-page-large-diff-replace', 30, mountBase, () => dispatchPatch(window, largeHtml, 'replace'), () => dispatchPatch(window, baseHtml, 'replace'), cellText, verifyLarge, verifyBase)
  ]

  console.log('datastar matched SSE/morph benchmark (32x32 workload parity)')
  console.log(`datastar-source: ${payload.sourceLabel}`)
  console.log('grid: 32x32, ~66% populated, reactive row/column/total cells included in the HTML payload')
  console.log('scenario                                iters   total-ms   avg-ms   ops/s     mem-delta   final-cell')
  console.log('---------------------------------------------------------------------------------------------------------')
  for (const r of results) console.log([r.name.padEnd(38), String(r.iters).padStart(5), formatNum(r.ms).padStart(10), formatNum(r.avgMs, 3).padStart(8), formatNum(r.opsPerSec, 1).padStart(8), String(r.memDelta).padStart(11), String(r.result).padStart(11)].join('   '))
})().catch(err => { console.error(err.message || err); process.exit(1) })
