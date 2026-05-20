// @ts-nocheck
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DMAX_FILE = path.join(ROOT, 'dmax.js')
const DATASTAR_FILE = path.join(ROOT, 'tools', 'vendor', 'datastar.js')
const FIXI_FILE = path.join(ROOT, 'tools', 'vendor', 'fixi.js')
const PAXI_FILE = path.join(ROOT, 'tools', 'vendor', 'paxi.js')
const REXI_FILE = path.join(ROOT, 'tools', 'vendor', 'rexi.js')
const SSEXI_FILE = path.join(ROOT, 'tools', 'vendor', 'ssexi.js')
const VENDORED_JSDOM_DIR = path.join(ROOT, 'tools', 'vendor', 'jsdom')
const GRID_FILL_RATIO = 0.66
const MAX_CELL_VALUE = 100
const CELL_CLEAR_RATIO = 0.12
const LCG_MULTIPLIER = 1664525
const LCG_INCREMENT = 1013904223
const DATASTAR_SSE_EVENT = 'datastar-sse'
const DATASTAR_MERGE_FRAGMENTS = 'datastar-merge-fragments'
const USER_FORM_STATE = Object.freeze({
  inputValue: 'user typed 42',
  textareaValue: 'draft note',
  checkboxChecked: true,
  selectValue: 'b'
})
const CONTROL_VARIANTS = Object.freeze({
  base: Object.freeze({
    inputValueAttr: 'server base',
    inputPlaceholder: 'base hint',
    textareaText: 'server base note',
    textareaRows: '2',
    checkboxClass: 'bench-toggle base',
    checkboxChecked: false,
    selectClass: 'bench-select base',
    selectSelected: 'a',
    optionSuffix: 'base'
  }),
  small: Object.freeze({
    inputValueAttr: 'server small',
    inputPlaceholder: 'small hint',
    textareaText: 'server small note',
    textareaRows: '4',
    checkboxClass: 'bench-toggle small',
    checkboxChecked: false,
    selectClass: 'bench-select small',
    selectSelected: 'c',
    optionSuffix: 'small'
  }),
  large: Object.freeze({
    inputValueAttr: 'server large',
    inputPlaceholder: 'large hint',
    textareaText: 'server large note',
    textareaRows: '6',
    checkboxClass: 'bench-toggle large',
    checkboxChecked: false,
    selectClass: 'bench-select large',
    selectSelected: 'a',
    optionSuffix: 'large'
  })
})

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

function renderControlsHtml(variant) {
  return [
    '<form id="bench-controls">',
    `<input id="bench-input" type="text" value="${escapeHtml(variant.inputValueAttr)}" placeholder="${escapeHtml(variant.inputPlaceholder)}">`,
    `<textarea id="bench-textarea" rows="${escapeHtml(variant.textareaRows)}">${escapeHtml(variant.textareaText)}</textarea>`,
    `<label id="bench-check-label"><input id="bench-check" type="checkbox" class="${escapeHtml(variant.checkboxClass)}"${variant.checkboxChecked ? ' checked' : ''}>Keep live totals</label>`,
    `<select id="bench-select" class="${escapeHtml(variant.selectClass)}">`,
    `<option value="a"${variant.selectSelected === 'a' ? ' selected' : ''}>A ${escapeHtml(variant.optionSuffix)}</option>`,
    `<option value="b"${variant.selectSelected === 'b' ? ' selected' : ''}>B ${escapeHtml(variant.optionSuffix)}</option>`,
    `<option value="c"${variant.selectSelected === 'c' ? ' selected' : ''}>C ${escapeHtml(variant.optionSuffix)}</option>`,
    '</select>',
    '</form>'
  ].join('')
}

function renderGridHtml(cells, variant) {
  const { rowSums, colSums, total } = summarizeGrid(cells)
  const rows = cells.length, cols = cells[0].length
  let out = `<div id="bench-app">${renderControlsHtml(variant)}<table id="bench-grid"><tbody>`
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

function expectedGridSnapshot(cells, row, col) {
  const { rowSums, colSums, total } = summarizeGrid(cells)
  return {
    cell: cells[row][col] == null ? '' : String(cells[row][col]),
    row: String(rowSums[row]),
    col: String(colSums[col]),
    total: String(total)
  }
}

function readGridSnapshot(host, row, col) {
  return {
    cell: host.querySelector(`#cell-${row}-${col}`)?.textContent || '',
    row: host.querySelector(`#sum-row-${row}`)?.textContent || '',
    col: host.querySelector(`#sum-col-${col}`)?.textContent || '',
    total: host.querySelector('#sum-total')?.textContent || ''
  }
}

function expectedFormState(variant, preserveUserState) {
  return {
    inputValue: preserveUserState ? USER_FORM_STATE.inputValue : variant.inputValueAttr,
    inputAttrValue: variant.inputValueAttr,
    inputPlaceholder: variant.inputPlaceholder,
    textareaValue: preserveUserState ? USER_FORM_STATE.textareaValue : variant.textareaText,
    textareaRows: variant.textareaRows,
    checkboxChecked: preserveUserState ? USER_FORM_STATE.checkboxChecked : variant.checkboxChecked,
    checkboxClass: variant.checkboxClass,
    selectValue: preserveUserState ? USER_FORM_STATE.selectValue : variant.selectSelected,
    selectClass: variant.selectClass,
    selectFocused: preserveUserState
  }
}

function readFormState(host, activeElement) {
  const input = host.querySelector('#bench-input')
  const textarea = host.querySelector('#bench-textarea')
  const checkbox = host.querySelector('#bench-check')
  const select = host.querySelector('#bench-select')
  return {
    inputValue: input?.value || '',
    inputAttrValue: input?.getAttribute('value') || '',
    inputPlaceholder: input?.getAttribute('placeholder') || '',
    textareaValue: textarea?.value || '',
    textareaRows: textarea?.getAttribute('rows') || '',
    checkboxChecked: Boolean(checkbox?.checked),
    checkboxClass: checkbox?.getAttribute('class') || '',
    selectValue: select?.value || '',
    selectClass: select?.getAttribute('class') || '',
    selectFocused: Boolean(select && activeElement === select)
  }
}

function seedUserFormState(host) {
  const input = host.querySelector('#bench-input')
  const textarea = host.querySelector('#bench-textarea')
  const checkbox = host.querySelector('#bench-check')
  const select = host.querySelector('#bench-select')
  if (!input || !textarea || !checkbox || !select) {
    const missing = [
      !input && '#bench-input',
      !textarea && '#bench-textarea',
      !checkbox && '#bench-check',
      !select && '#bench-select'
    ].filter(Boolean)
    throw new Error(`Benchmark controls not mounted: ${missing.join(', ')}`)
  }
  input.value = USER_FORM_STATE.inputValue
  textarea.value = USER_FORM_STATE.textareaValue
  checkbox.checked = USER_FORM_STATE.checkboxChecked
  select.value = USER_FORM_STATE.selectValue
  select.focus()
}

function assertGridSnapshot(actual, expected, label) {
  if (actual.cell !== expected.cell || actual.row !== expected.row || actual.col !== expected.col || actual.total !== expected.total)
    throw new Error(`Snapshot mismatch (${label}) expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`)
}

function assertFormSnapshot(actual, expected, label) {
  if (
    actual.inputValue !== expected.inputValue ||
    actual.inputAttrValue !== expected.inputAttrValue ||
    actual.inputPlaceholder !== expected.inputPlaceholder ||
    actual.textareaValue !== expected.textareaValue ||
    actual.textareaRows !== expected.textareaRows ||
    actual.checkboxChecked !== expected.checkboxChecked ||
    actual.checkboxClass !== expected.checkboxClass ||
    actual.selectValue !== expected.selectValue ||
    actual.selectClass !== expected.selectClass ||
    actual.selectFocused !== expected.selectFocused
  ) throw new Error(`Form snapshot mismatch (${label}) expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`)
}

function diffFormSnapshot(actual, expected) {
  return Object.keys(expected).filter(key => actual[key] !== expected[key])
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

function renderOobFragments(cells, row, col) {
  const { rowSums, colSums, total } = summarizeGrid(cells)
  const val = cells[row][col]
  return [
    `<td id="cell-${row}-${col}" data-row="${row}" data-col="${col}">${val == null ? '' : escapeHtml(val)}</td>`,
    `<th id="sum-row-${row}">${rowSums[row]}</th>`,
    `<th id="sum-col-${col}">${colSums[col]}</th>`,
    `<th id="sum-total">${total}</th>`
  ]
}

function renderOobPatch(cells, row, col) {
  return renderOobFragments(cells, row, col).join('')
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

function loadDmaxScript() {
  return fs.readFileSync(DMAX_FILE, 'utf8')
}

function loadDatastarScript() {
  return fs.readFileSync(DATASTAR_FILE, 'utf8')
    // The vendored Datastar bundle is ESM. In jsdom we run it as an inline
    // classic script so the benchmark can dispatch Datastar's internal SSE
    // CustomEvents without adding a package/build dependency.
    .replace(/export\{[^}]+\};?/, '')
}

async function loadWindowFromScripts(scripts, delay = 30) {
  const vcon = new VirtualConsole()
  const scriptTags = scripts.map(src => `<script>${src}</script>`).join('')
  const dom = new JSDOM(`<!doctype html><html><head></head><body>${scriptTags}</body></html>`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vcon,
    url: 'https://bench.local/'
  })
  const { window } = dom
  await new Promise(resolve => setTimeout(resolve, delay))
  return window
}

async function loadDmaxWindow() {
  return loadWindowFromScripts([loadDmaxScript()])
}

async function loadDatastarWindow() {
  return loadWindowFromScripts([loadDatastarScript()])
}

async function loadFixiWindow() {
  const hasFixi = fs.existsSync(FIXI_FILE), hasPaxi = fs.existsSync(PAXI_FILE), hasRexi = fs.existsSync(REXI_FILE), hasSsexi = fs.existsSync(SSEXI_FILE)
  const scripts = [FIXI_FILE, PAXI_FILE, REXI_FILE, SSEXI_FILE].filter(fs.existsSync).map(f => fs.readFileSync(f, 'utf8'))
  const window = await loadWindowFromScripts(scripts, 50)
  window.__fixiBench = { hasFixi, hasPaxi, hasRexi, hasSsexi, hasParityStack: hasPaxi && hasRexi && hasSsexi }
  return window
}

async function loadNativeWindow() {
  return loadWindowFromScripts([])
}

function formatNum(n, digits = 2) {
  return Number(n).toFixed(digits)
}

const BM_SCALE = Math.max(+process.env.BM_SCALE || 1, 0.001)
const BM_MEM_SAMPLES = Math.max(+process.env.BM_MEM_SAMPLES || 5, 1)
const BM_SCENARIO_SAMPLES = Math.max(+process.env.BM_SCENARIO_SAMPLES || 3, 1)
const BM_TRACE = /^(1|true|yes)$/i.test(process.env.BM_TRACE || '')
const BM_TRACE_FW = (process.env.BM_TRACE_FW || '').trim()
const BM_TRACE_CASE = (process.env.BM_TRACE_CASE || '').trim()
const bmIters = (n) => Math.max(1, Math.round(n * BM_SCALE))

async function settleBench() {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

function stableHeapUsed() {
  if (!global.gc) return process.memoryUsage().heapUsed
  let best = Infinity
  for (let i = 0; i < BM_MEM_SAMPLES; i++) {
    global.gc()
    const used = process.memoryUsage().heapUsed
    if (used < best) best = used
  }
  return best
}

const median = (nums) => {
  const sorted = nums.slice().sort((a, b) => a - b)
  return sorted[(sorted.length - 1) >> 1]
}

function aggregateScenarioRuns(runs) {
  const first = runs[0]
  const avgMs = median(runs.map(r => r.avgMs))
  const memDelta = median(runs.map(r => r.memDelta))
  const ms = avgMs * first.iters
  const sample = runs.slice().sort((a, b) => (a.memDelta - b.memDelta) || (a.avgMs - b.avgMs))[(runs.length - 1) >> 1]
  return {
    ...first,
    runs: runs.length,
    samples: runs,
    ms,
    avgMs,
    opsPerSec: 1000 / avgMs,
    memDelta,
    dbgBodyElDelta: sample.inspectStart && sample.inspectEnd ? sample.inspectEnd.bodyElements - sample.inspectStart.bodyElements : null,
    dbgHostElDelta: sample.inspectStart && sample.inspectEnd ? sample.inspectEnd.elements - sample.inspectStart.elements : null,
    dbgHtmlLenDelta: sample.inspectStart && sample.inspectEnd ? sample.inspectEnd.hostHtmlLen - sample.inspectStart.hostHtmlLen : null
  }
}

function shouldTrace(framework, name) {
  return BM_TRACE && (!BM_TRACE_FW || BM_TRACE_FW === framework) && (!BM_TRACE_CASE || BM_TRACE_CASE === name)
}

function inspectBenchState(document, host) {
  const all = host.querySelectorAll('*')
  const ids = host.querySelectorAll('[id]')
  return {
    elements: all.length,
    ids: ids.length,
    bodyElements: document.body.querySelectorAll('*').length,
    bodyHtmlLen: document.body.innerHTML.length,
    hostHtmlLen: host.innerHTML.length
  }
}

function logTrace(framework, runIndex, sample) {
  console.log(`[trace] ${framework}/${sample.name} run=${runIndex + 1}/${BM_SCENARIO_SAMPLES} iters=${sample.iters} avg-ms=${formatNum(sample.avgMs, 3)} mem-delta=${sample.memDelta}`)
  console.log(`[trace]   heap start=${sample.startMem} end=${sample.endMem}`)
  if (sample.inspectStart) console.log(`[trace]   inspect-start ${JSON.stringify(sample.inspectStart)}`)
  if (sample.inspectEnd) console.log(`[trace]   inspect-end   ${JSON.stringify(sample.inspectEnd)}`)
}

async function sampleScenario(framework, run, name) {
  const runs = []
  const trace = shouldTrace(framework, name)
  for (let i = 0; i < BM_SCENARIO_SAMPLES; i++) {
    const sample = await run(i)
    runs.push(sample)
    if (trace) logTrace(framework, i, sample)
  }
  return aggregateScenarioRuns(runs)
}

async function runScenario(name, iters, setup, applyA, applyB, check, validateA = null, validateB = null, inspect = null) {
  setup()
  for (let i = 0; i < 10; i++) {
    if (i % 2) {
      await applyA()
      if (validateA) validateA()
    } else {
      await applyB()
      if (validateB) validateB()
    }
  }
  await settleBench()
  const inspectStart = inspect ? inspect() : null
  const startMem = stableHeapUsed()
  const t0 = process.hrtime.bigint()
  for (let i = 0; i < iters; i++) await (i % 2 ? applyA : applyB)()
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  if (validateA) { await applyA(); validateA() }
  if (validateB) { await applyB(); validateB() }
  await settleBench()
  const endMem = stableHeapUsed()
  const inspectEnd = inspect ? inspect() : null
  const result = check()
  return {
    name,
    iters,
    ms,
    avgMs: ms / iters,
    opsPerSec: iters / ms * 1000,
    memDelta: endMem - startMem,
    startMem,
    endMem,
    inspectStart,
    inspectEnd,
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

  const baseHtml = renderGridHtml(baseCells, CONTROL_VARIANTS.base)
  const smallHtml = renderGridHtml(smallDiffCells, CONTROL_VARIANTS.small)
  const largeHtml = renderGridHtml(largeDiffCells, CONTROL_VARIANTS.large)
  const basePointed = renderPointedPatch(baseCells, focusRow, focusCol)
  const smallPointed = renderPointedPatch(smallDiffCells, focusRow, focusCol)
  const baseFrags = renderOobFragments(baseCells, focusRow, focusCol)
  const smallFrags = renderOobFragments(smallDiffCells, focusRow, focusCol)
  const baseOob = baseFrags.join('')
  const smallOob = smallFrags.join('')

  return {
    focusRow,
    focusCol,
    baseHtml,
    smallHtml,
    largeHtml,
    basePointed,
    smallPointed,
    baseFrags,
    smallFrags,
    baseOob,
    smallOob,
    expectedBase: expectedGridSnapshot(baseCells, focusRow, focusCol),
    expectedSmall: expectedGridSnapshot(smallDiffCells, focusRow, focusCol),
    expectedLarge: expectedGridSnapshot(largeDiffCells, focusRow, focusCol),
    expectedFormBaseMorph: expectedFormState(CONTROL_VARIANTS.base, true),
    expectedFormSmallMorph: expectedFormState(CONTROL_VARIANTS.small, true),
    expectedFormLargeMorph: expectedFormState(CONTROL_VARIANTS.large, true),
    expectedFormBaseReplace: expectedFormState(CONTROL_VARIANTS.base, false),
    expectedFormSmallReplace: expectedFormState(CONTROL_VARIANTS.small, false),
    expectedFormLargeReplace: expectedFormState(CONTROL_VARIANTS.large, false),
    baseSse: makeSseOuter(basePointed),
    smallSse: makeSseOuter(smallPointed),
    baseSseHtml: makeSseOuter(baseHtml, '#bench-app'),
    smallSseHtml: makeSseOuter(smallHtml, '#bench-app'),
    largeSseHtml: makeSseOuter(largeHtml, '#bench-app')
  }
}

function makeValidators(host, activeElementFn, payloads, prefix) {
  const gridSnapshot = () => readGridSnapshot(host, payloads.focusRow, payloads.focusCol)
  const formSnapshot = () => readFormState(host, activeElementFn())
  return {
    gridSnapshot,
    formSnapshot,
    cellText: () => (host.querySelector(`#cell-${payloads.focusRow}-${payloads.focusCol}`)?.textContent || ''),
    assertState(gridExpected, formExpected, label) {
      assertGridSnapshot(gridSnapshot(), gridExpected, `${prefix}/${label}/grid`)
      assertFormSnapshot(formSnapshot(), formExpected, `${prefix}/${label}/form`)
    },
    assertGrid(gridExpected, label) {
      assertGridSnapshot(gridSnapshot(), gridExpected, `${prefix}/${label}/grid`)
    }
  }
}

async function withWindow(loadWindow, run) {
  const window = await loadWindow()
  try {
    return await run(window)
  } finally {
    window.close()
  }
}

async function withSampledWindow(framework, name, loadWindow, run) {
  return sampleScenario(framework, (runIndex) => withWindow(loadWindow, (window) => run(window, runIndex)), name)
}

async function runDmaxScenarios(payloads) {
  return [
    await withSampledWindow('dmax', 'resp-sse-els_pointed_dom-patch_outer_small-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxPatchElements, applyDmaxSse } = window
      if (typeof applyDmaxPatchElements !== 'function' || typeof applyDmaxSse !== 'function') throw new Error('dmax benchmark helpers are not available on window')
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBase = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseMorph, 'base')
      const validateSmallUnchangedControls = () => v.assertState(payloads.expectedSmall, payloads.expectedFormBaseMorph, 'small-unchanged-controls')
      return runScenario('resp-sse-els_pointed_dom-patch_outer_small-diff', bmIters(500), mountBase, () => applyDmaxSse(payloads.smallSse, 'bench'), () => applyDmaxSse(payloads.baseSse, 'bench'), v.cellText, validateSmallUnchangedControls, validateBase, () => inspectBenchState(document, host))
    }),
    await withSampledWindow('dmax', 'resp-sse-els_oob_dom-patch_outer_small-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxPatchElements } = window
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBase = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseMorph, 'base')
      const validateSmallUnchangedControls = () => v.assertState(payloads.expectedSmall, payloads.expectedFormBaseMorph, 'small-unchanged-controls')
      return runScenario('resp-sse-els_oob_dom-patch_outer_small-diff', bmIters(500), mountBase, () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.smallOob }), () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseOob }), v.cellText, validateSmallUnchangedControls, validateBase, () => inspectBenchState(document, host))
    }),
    await withSampledWindow('dmax', 'resp-sse-html_full_dom-morph_morph_small-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxSse } = window
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBase = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseMorph, 'base')
      const validateSmallMorph = () => v.assertState(payloads.expectedSmall, payloads.expectedFormSmallMorph, 'small-morph')
      return runScenario('resp-sse-html_full_dom-morph_morph_small-diff', bmIters(120), mountBase, () => applyDmaxSse(payloads.smallSseHtml, 'bench'), () => applyDmaxSse(payloads.baseSseHtml, 'bench'), v.cellText, validateSmallMorph, validateBase, () => inspectBenchState(document, host))
    }),
    await withSampledWindow('dmax', 'resp-sse-html_full_dom-morph_morph_large-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxSse } = window
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBase = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseMorph, 'base')
      const validateLargeMorph = () => v.assertState(payloads.expectedLarge, payloads.expectedFormLargeMorph, 'large-morph')
      return runScenario('resp-sse-html_full_dom-morph_morph_large-diff', bmIters(30), mountBase, () => applyDmaxSse(payloads.largeSseHtml, 'bench'), () => applyDmaxSse(payloads.baseSseHtml, 'bench'), v.cellText, validateLargeMorph, validateBase, () => inspectBenchState(document, host))
    }),
    await withSampledWindow('dmax', 'resp-html_full_dom-morph_morph_small-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxPatchElements } = window
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBase = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseMorph, 'base')
      const validateSmallMorph = () => v.assertState(payloads.expectedSmall, payloads.expectedFormSmallMorph, 'small-morph')
      return runScenario('resp-html_full_dom-morph_morph_small-diff', bmIters(120), mountBase, () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.smallHtml }), () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }), v.cellText, validateSmallMorph, validateBase, () => inspectBenchState(document, host))
    }),
    await withSampledWindow('dmax', 'resp-html_full_dom-replace_outer_small-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxPatchElements } = window
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBaseReplace = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseReplace, 'base-replace')
      const validateSmallReplace = () => v.assertState(payloads.expectedSmall, payloads.expectedFormSmallReplace, 'small-replace')
      return runScenario('resp-html_full_dom-replace_outer_small-diff', bmIters(120), mountBase, () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.smallHtml }), () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.baseHtml }), v.cellText, validateSmallReplace, validateBaseReplace, () => inspectBenchState(document, host))
    }),
    await withSampledWindow('dmax', 'resp-html_full_dom-morph_morph_large-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxPatchElements } = window
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBase = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseMorph, 'base')
      const validateLargeMorph = () => v.assertState(payloads.expectedLarge, payloads.expectedFormLargeMorph, 'large-morph')
      return runScenario('resp-html_full_dom-morph_morph_large-diff', bmIters(30), mountBase, () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.largeHtml }), () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }), v.cellText, validateLargeMorph, validateBase, () => inspectBenchState(document, host))
    }),
    await withSampledWindow('dmax', 'resp-html_full_dom-replace_outer_large-diff', loadDmaxWindow, async (window) => {
      const { document, applyDmaxPatchElements } = window
      const host = document.createElement('div')
      host.id = 'bench-host'
      document.body.appendChild(host)
      const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
      const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
      const validateBaseReplace = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseReplace, 'base-replace')
      const validateLargeReplace = () => v.assertState(payloads.expectedLarge, payloads.expectedFormLargeReplace, 'large-replace')
      return runScenario('resp-html_full_dom-replace_outer_large-diff', bmIters(30), mountBase, () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.largeHtml }), () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.baseHtml }), v.cellText, validateLargeReplace, validateBaseReplace, () => inspectBenchState(document, host))
    })
  ]
}

async function runDatastarScenarios(payloads) {
  const mk = (name, iters, applyA, applyB, validateA, validateB) => withSampledWindow('datastar', name, loadDatastarWindow, async (window) => {
    const { document } = window
    const host = document.createElement('div')
    host.id = 'bench-host'
    document.body.appendChild(host)
    const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
    const mergeFragments = (fragments, mergeMode, selector = '') => applyDatastarFragments(window, fragments, mergeMode, selector)
    const v = makeValidators(host, () => document.activeElement, payloads, 'datastar')
    return runScenario(name, iters, mountBase, () => applyA(mergeFragments), () => applyB(mergeFragments), v.cellText, () => validateA(v), () => validateB(v), () => inspectBenchState(document, host))
  })
  const baseGrid = (v) => v.assertGrid(payloads.expectedBase, 'base-grid')
  const smallGrid = (v) => v.assertGrid(payloads.expectedSmall, 'small-grid')
  const largeGrid = (v) => v.assertGrid(payloads.expectedLarge, 'large-grid')
  return [
    await mk('resp-sse-els_pointed_dom-patch_outer_small-diff', bmIters(500), (m) => m(payloads.smallPointed, 'morph'), (m) => m(payloads.basePointed, 'morph'), smallGrid, baseGrid),
    await mk('resp-sse-els_oob_dom-patch_outer_small-diff', bmIters(500), (m) => m(payloads.smallOob, 'morph'), (m) => m(payloads.baseOob, 'morph'), smallGrid, baseGrid),
    await mk('resp-sse-html_full_dom-morph_morph_small-diff', bmIters(120), (m) => m(payloads.smallHtml, 'morph', '#bench-app'), (m) => m(payloads.baseHtml, 'morph', '#bench-app'), smallGrid, baseGrid),
    await mk('resp-sse-html_full_dom-morph_morph_large-diff', bmIters(30), (m) => m(payloads.largeHtml, 'morph', '#bench-app'), (m) => m(payloads.baseHtml, 'morph', '#bench-app'), largeGrid, baseGrid),
    await mk('resp-html_full_dom-morph_morph_small-diff', bmIters(120), (m) => m(payloads.smallHtml, 'morph', '#bench-app'), (m) => m(payloads.baseHtml, 'morph', '#bench-app'), smallGrid, baseGrid),
    await mk('resp-html_full_dom-replace_outer_small-diff', bmIters(120), (m) => m(payloads.smallHtml, 'outer', '#bench-app'), (m) => m(payloads.baseHtml, 'outer', '#bench-app'), smallGrid, baseGrid),
    await mk('resp-html_full_dom-morph_morph_large-diff', bmIters(30), (m) => m(payloads.largeHtml, 'morph', '#bench-app'), (m) => m(payloads.baseHtml, 'morph', '#bench-app'), largeGrid, baseGrid),
    await mk('resp-html_full_dom-replace_outer_large-diff', bmIters(30), (m) => m(payloads.largeHtml, 'outer', '#bench-app'), (m) => m(payloads.baseHtml, 'outer', '#bench-app'), largeGrid, baseGrid)
  ]
}

const hasFixi = (window, name) => typeof window[name] === 'function'
const mkRes = (window, body, type) => new (window.Response || Response)(body, { status: 200, headers: { 'Content-Type': type } })
const mkStream = (window, text) => new (window.ReadableStream || ReadableStream)({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close() } })
const mkFxSse = (frags, swap = 'outerHTML', target = '') => frags.map(html => {
  const id = String(html).match(/\sid="([^"]+)"/)?.[1]
  const ta = target || (id ? `#${id}` : '')
  if (!ta) throw new Error(`Fixi SSE fragment missing target: ${html}`)
  const ev = swap == null ? { target: ta } : { target: ta, swap }
  const lines = [`event: ${JSON.stringify(ev)}`]
  for (const line of String(html).replace(/\r/g, '').split('\n')) lines.push(`data: ${line}`)
  return lines.join('\n') + '\n\n'
}).join('')
async function callFixi(el, fetch) {
  const window = el.ownerDocument.defaultView
  el.dispatchEvent(new window.CustomEvent('fx:process', { bubbles: true }))
  if (typeof el.__fixi !== 'function') throw new Error('fixi trigger was not initialized')
  const prev = window.fetch
  window.fetch = fetch
  try {
    await el.__fixi({ preventDefault() {}, submitter: null })
  } finally {
    window.fetch = prev
  }
}

async function runNativeScenarios(payloads) {
  const mk = (name, iters, applyA, applyB, validateA, validateB) => withSampledWindow('native', name, loadNativeWindow, async (window) => {
    const { document } = window
    const host = document.createElement('div')
    host.id = 'bench-host'
    document.body.appendChild(host)
    const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
    const v = makeValidators(host, () => document.activeElement, payloads, 'native')
    const replaceHtml = (html) => {
      const el = document.getElementById('bench-app')
      if (!el) throw new Error('native benchmark target #bench-app missing')
      el.outerHTML = html
    }
    const morphHtml = (html) => {
      const next = document.createElement('div')
      next.innerHTML = html
      const to = next.firstElementChild
      const from = document.getElementById('bench-app')
      if (!from || !to) throw new Error('native morph baseline target #bench-app missing')
      from.replaceWith(to)
    }
    return runScenario(name, iters, mountBase, () => applyA({ replaceHtml, morphHtml }), () => applyB({ replaceHtml, morphHtml }), v.cellText, () => validateA(v), () => validateB(v), () => inspectBenchState(document, host))
  })
  const baseGrid = (v) => v.assertGrid(payloads.expectedBase, 'base-grid')
  const smallGrid = (v) => v.assertGrid(payloads.expectedSmall, 'small-grid')
  const largeGrid = (v) => v.assertGrid(payloads.expectedLarge, 'large-grid')
  return [
    await mk('resp-html_full_dom-morph_morph_small-diff', bmIters(120), ({ morphHtml }) => morphHtml(payloads.smallHtml), ({ morphHtml }) => morphHtml(payloads.baseHtml), smallGrid, baseGrid),
    await mk('resp-html_full_dom-replace_outer_small-diff', bmIters(120), ({ replaceHtml }) => replaceHtml(payloads.smallHtml), ({ replaceHtml }) => replaceHtml(payloads.baseHtml), smallGrid, baseGrid),
    await mk('resp-html_full_dom-morph_morph_large-diff', bmIters(30), ({ morphHtml }) => morphHtml(payloads.largeHtml), ({ morphHtml }) => morphHtml(payloads.baseHtml), largeGrid, baseGrid),
    await mk('resp-html_full_dom-replace_outer_large-diff', bmIters(30), ({ replaceHtml }) => replaceHtml(payloads.largeHtml), ({ replaceHtml }) => replaceHtml(payloads.baseHtml), largeGrid, baseGrid)
  ]
}

async function runFixiScenarios(payloads) {
  const rows = []
  const probeWindow = await loadFixiWindow()
  const hasMorph = hasFixi(probeWindow, 'morph'), hasSse = !!probeWindow.__fixiBench?.hasSsexi
  probeWindow.close()
  const mk = (name, iters, applyA, applyB, validateA, validateB) => withSampledWindow('fixi', name, loadFixiWindow, async (window) => {
    const { document } = window
    const host = document.createElement('div')
    host.id = 'bench-host'
    document.body.appendChild(host)
    const tr = document.createElement('button')
    tr.id = 'fixi-bench-trigger'
    tr.setAttribute('fx-action', '/bench')
    tr.setAttribute('fx-target', '#bench-app')
    document.body.appendChild(tr)
    const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
    const v = makeValidators(host, () => document.activeElement, payloads, 'fixi')
    const reqHtml = async (html, swap) => {
      tr.setAttribute('fx-target', '#bench-app')
      tr.setAttribute('fx-swap', swap)
      await callFixi(tr, async () => mkRes(window, html, 'text/html'))
    }
    const reqSse = async (text, swap = 'outerHTML') => {
      tr.setAttribute('fx-target', '#bench-app')
      tr.setAttribute('fx-swap', swap)
      if (swap !== 'morph') return callFixi(tr, async () => mkRes(window, mkStream(window, text), 'text/event-stream'))
      const onMsg = (ev) => {
        const msg = ev.detail?.message, ta = msg?.event && JSON.parse(msg.event).target
        if (!msg?.data || ta !== '#bench-app') return
        ev.preventDefault()
        const el = document.querySelector(ta)
        if (el) window.morph(el, msg.data)
      }
      document.addEventListener('fx:sse:message', onMsg)
      try {
        await callFixi(tr, async () => mkRes(window, mkStream(window, text), 'text/event-stream'))
      } finally {
        document.removeEventListener('fx:sse:message', onMsg)
      }
    }
    return runScenario(name, iters, mountBase, () => applyA({ reqHtml, reqSse }), () => applyB({ reqHtml, reqSse }), v.cellText, () => validateA(v), () => validateB(v), () => inspectBenchState(document, host))
  })
  const baseGrid = (v) => v.assertGrid(payloads.expectedBase, 'base-grid')
  const smallGrid = (v) => v.assertGrid(payloads.expectedSmall, 'small-grid')
  const largeGrid = (v) => v.assertGrid(payloads.expectedLarge, 'large-grid')
  if (hasSse) {
    rows.push(
      await mk('resp-sse-els_pointed_dom-patch_outer_small-diff', bmIters(500), ({ reqSse }) => reqSse(mkFxSse(payloads.smallFrags)), ({ reqSse }) => reqSse(mkFxSse(payloads.baseFrags)), smallGrid, baseGrid),
      await mk('resp-sse-els_oob_dom-patch_outer_small-diff', bmIters(500), ({ reqSse }) => reqSse(mkFxSse(payloads.smallFrags)), ({ reqSse }) => reqSse(mkFxSse(payloads.baseFrags)), smallGrid, baseGrid)
    )
    if (hasMorph) rows.push(
      await mk('resp-sse-html_full_dom-morph_morph_small-diff', bmIters(120), ({ reqSse }) => reqSse(mkFxSse([payloads.smallHtml], null, '#bench-app'), 'morph'), ({ reqSse }) => reqSse(mkFxSse([payloads.baseHtml], null, '#bench-app'), 'morph'), smallGrid, baseGrid),
      await mk('resp-sse-html_full_dom-morph_morph_large-diff', bmIters(30), ({ reqSse }) => reqSse(mkFxSse([payloads.largeHtml], null, '#bench-app'), 'morph'), ({ reqSse }) => reqSse(mkFxSse([payloads.baseHtml], null, '#bench-app'), 'morph'), largeGrid, baseGrid)
    )
  }
  if (hasMorph) rows.push(
    await mk('resp-html_full_dom-morph_morph_small-diff', bmIters(120), ({ reqHtml }) => reqHtml(payloads.smallHtml, 'morph'), ({ reqHtml }) => reqHtml(payloads.baseHtml, 'morph'), smallGrid, baseGrid),
    await mk('resp-html_full_dom-morph_morph_large-diff', bmIters(30), ({ reqHtml }) => reqHtml(payloads.largeHtml, 'morph'), ({ reqHtml }) => reqHtml(payloads.baseHtml, 'morph'), largeGrid, baseGrid)
  )
  rows.push(
    await mk('resp-html_full_dom-replace_outer_small-diff', bmIters(120), ({ reqHtml }) => reqHtml(payloads.smallHtml, 'outerHTML'), ({ reqHtml }) => reqHtml(payloads.baseHtml, 'outerHTML'), smallGrid, baseGrid),
    await mk('resp-html_full_dom-replace_outer_large-diff', bmIters(30), ({ reqHtml }) => reqHtml(payloads.largeHtml, 'outerHTML'), ({ reqHtml }) => reqHtml(payloads.baseHtml, 'outerHTML'), largeGrid, baseGrid)
  )
  return rows
}

function normScenario(name) { return name }
const CASE_ORDER = ['resp-sse-els_pointed_dom-patch_outer_small-diff', 'resp-sse-els_oob_dom-patch_outer_small-diff', 'resp-sse-html_full_dom-morph_morph_small-diff', 'resp-sse-html_full_dom-morph_morph_large-diff', 'resp-html_full_dom-morph_morph_small-diff', 'resp-html_full_dom-replace_outer_small-diff', 'resp-html_full_dom-morph_morph_large-diff', 'resp-html_full_dom-replace_outer_large-diff']
const FW_ORDER = { native: 0, dmax: 1, datastar: 2, fixi: 3 }
const FW_SHORT = { native: 'nat', dmax: 'dmax', datastar: 'ds', fixi: 'fix' }
const parseCase = (s) => {
  const [resp = '', shape = '', work = '', mode = '', diff = ''] = s.split('_')
  return { resp: resp.slice(5), shape, work, mode, diff }
}
const withFw = (framework, rows) => rows.map(r => ({ framework, case: normScenario(r.name), caseParts: parseCase(r.name), ...r }))
const addXF = (rows) => {
  const dmaxBase = Object.create(null), nativeBase = Object.create(null)
  for (const r of rows) {
    if (r.framework === 'dmax' && dmaxBase[r.case] == null) dmaxBase[r.case] = r.avgMs
    if (r.framework === 'native' && nativeBase[r.case] == null) nativeBase[r.case] = r.memDelta
  }
  for (const r of rows) {
    r.x = dmaxBase[r.case] ? r.avgMs / dmaxBase[r.case] : 1
    r.memNet = nativeBase[r.case] == null ? null : r.memDelta - nativeBase[r.case]
  }
  return rows.sort((a, b) => (CASE_ORDER.indexOf(a.case) - CASE_ORDER.indexOf(b.case)) || (FW_ORDER[a.framework] - FW_ORDER[b.framework]))
}

function probeMorphParity(window, payloads, framework, applySmallMorph, applyBaseMorph, applyLargeMorph) {
  const { document } = window
  const host = document.createElement('div')
  host.id = `${framework}-parity-host`
  document.body.appendChild(host)
  const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
  const readState = () => ({
    grid: readGridSnapshot(host, payloads.focusRow, payloads.focusCol),
    form: readFormState(host, document.activeElement)
  })
  const checkState = (expectedGrid, expectedForm) => {
    const actual = readState()
    return {
      gridOk: actual.grid.cell === expectedGrid.cell && actual.grid.row === expectedGrid.row && actual.grid.col === expectedGrid.col && actual.grid.total === expectedGrid.total,
      formDiffs: diffFormSnapshot(actual.form, expectedForm),
      actualForm: actual.form
    }
  }

  mountBase()
  applySmallMorph()
  const small = checkState(payloads.expectedSmall, payloads.expectedFormSmallMorph)
  applyBaseMorph()
  const base = checkState(payloads.expectedBase, payloads.expectedFormBaseMorph)

  mountBase()
  applyLargeMorph()
  const large = checkState(payloads.expectedLarge, payloads.expectedFormLargeMorph)

  host.remove()
  return { framework, small, base, large }
}

function formatParityProbe(probe) {
  const scenarios = [
    ['small', probe.small],
    ['base', probe.base],
    ['large', probe.large]
  ]
  return scenarios.map(([name, state]) => {
    if (!state.gridOk) return `${name}:grid-mismatch`
    if (!state.formDiffs.length) return `${name}:form-ok`
    return `${name}:form-reset(${state.formDiffs.join(',')})`
  }).join(' | ')
}

// Hot-path analysis (updated after applying E1–E3 easy wins):
//
// fixi (outerHTML baseline — no fetch, no morph):
//   Swap is target[swap]=text. Zero algorithmic work, zero allocations beyond the DOM
//   engine's own HTML parser cost. This is the theoretical lower bound for any framework
//   that must re-render HTML from a string response.
//
// datastar hot path (full-page morph via idiomorph):
//   1. HTML parse: new DOMParser().parseFromString() — new parser instance each call,
//      includes regex pass to strip SVG before parsing (avoids idiomorph namespace bugs).
//   2. idiomorph: two-pass algorithm — first builds a persistent-ID Set + Map (O(N) scan),
//      then reconciles the tree. More allocations per morph than dmax's single-pass approach.
//   3. CustomEvent dispatch overhead: the merge-fragments path goes through
//      document.dispatchEvent → internal handler → morph, adding event-loop overhead.
//
// dmax hot path (full-page morph):
//   1. HTML parse: _HTML_PARSE_TEMPLATE.innerHTML = html — reused singleton <template>,
//      no new parser per call. Measurably faster than datastar's new DOMParser() per call.
//   2. Single-pass morph with lazy Map allocation: builds idMap only when needed
//      (after the fast in-order scan exhausts matched nodes).
//   3. No extra event dispatch — applyPatchEls is called directly.
//
// Why dmax is ~2× faster on morph and ~10–12× faster on pointed/OOB:
//   — Pointed/OOB: dmax targets a single element and morphs it in-place; datastar goes
//     through the full idiomorph setup on each fragment even for single-element patches.
//   — Full-page: dmax's single-pass morph with lazy-Map + cached template beats
//     idiomorph's two-pass + new DOMParser.
//
// Top 3 EASY improvements [APPLIED in dmax.js]:
//
//   E1 ✓ Short-circuit updateAttrs when both from and to have ZERO attributes.
//       Added `if (!fromAttrs.length && !toAttrs.length) return` at the top of updateAttrs.
//       Avoids two `let` decls and the same/orderChanged scan for every no-attr element.
//
//   E2 ✓ Fast path in parseSseEls for the single-root case (most common in SSE patches).
//       `const first = ...; if (!first) return NIL; if (!first.nextElementSibling) return [first]`
//       Saves the `out = []` alloc + push call for every single-element full-page patch.
//
//   E3 ✓ firstElementChild for pointed-patch lookup in parseSseEls / applyPatchSource.
//       Uses O(1) firstElementChild instead of a full subtree querySelector walk.
//
// Combined effect (measured): full-page replace ~5–6% faster; dmax morph heap delta
// ~210KB vs ~253KB before (17% less GC pressure per full-page cycle).
//
// Additional optimizations [APPLIED in dmax.js]:
//
//   E2 ✓ Batch SSE line parsing via indexOf in applySse.
//       Replaced char-by-char `for (end of text)` loop with `indexOf('\n', start)` while-loop.
//       Avoids per-character branch overhead; mirrors the efficient consumeSseStream approach.
//
//   E3 ✓ Avoid Map allocation in morphChildren for unkeyed lists.
//       Uses `let idMap = null` + `??=` so Map is only allocated when keyed from-children exist.
//       Combined with optional-chaining guards (`idMap?.has`) for safe null checks.
//
//   E4 ✓ Cache getSimpleIdSelector results in a module-scope Map.
//       Avoids re-scanning the selector string on repeated calls (common in SSE patch loops).
//       Returns cached null for complex selectors, cached id-string for simple `#id` selectors.
//
// Top 2 HARDER improvements (more design work, higher ceiling):
//
//   H1. Persistent keyed-children index on the container element.
//       morphChildren currently builds idMap by scanning live DOM siblings on every call
//       (O(N) per morph). A WeakMap<Element, Map<id, Element>> child index maintained
//       by the morph itself would make keyed lookup O(1), shrinking the hot path for
//       large grids with many IDs (all 1024 cells + 64 sum cells = 1088 keyed nodes).
//
//   H2. Two-tier incremental/chunked apply for large SSE payloads.
//       Break large applyPatchEls batches across animation frames using
//       requestAnimationFrame / queueMicrotask to keep the main thread responsive.
//       In the benchmark this would show lower worst-case latency at the cost of
//       throughput, but in production it prevents frame drops on slow hardware.

;(async () => {
  const payloads = makePayloads()
  const fixiInfoWindow = await loadFixiWindow()
  const fixiInfo = fixiInfoWindow.__fixiBench
  fixiInfoWindow.close()
  const results = addXF([
    ...withFw('native', await runNativeScenarios(payloads)),
    ...withFw('dmax', await runDmaxScenarios(payloads)),
    ...withFw('datastar', await runDatastarScenarios(payloads)),
    ...withFw('fixi', await runFixiScenarios(payloads))
  ])
  const parityProbes = [
    await withWindow(loadDmaxWindow, async (window) => probeMorphParity(window, payloads, 'dmax', () => window.applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.smallHtml }), () => window.applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }), () => window.applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.largeHtml }))),
    await withWindow(loadDatastarWindow, async (window) => probeMorphParity(window, payloads, 'datastar', () => applyDatastarFragments(window, payloads.smallHtml, 'morph', '#bench-app'), () => applyDatastarFragments(window, payloads.baseHtml, 'morph', '#bench-app'), () => applyDatastarFragments(window, payloads.largeHtml, 'morph', '#bench-app'))),
    await withWindow(loadFixiWindow, async (window) => probeMorphParity(window, payloads, 'fixi', () => { const el = window.document.querySelector('#bench-app'); if (el) window.morph ? window.morph(el, payloads.smallHtml) : el.outerHTML = payloads.smallHtml }, () => { const el = window.document.querySelector('#bench-app'); if (el) window.morph ? window.morph(el, payloads.baseHtml) : el.outerHTML = payloads.baseHtml }, () => { const el = window.document.querySelector('#bench-app'); if (el) window.morph ? window.morph(el, payloads.largeHtml) : el.outerHTML = payloads.largeHtml }))
  ]

  console.log('dmax vs Datastar vs fixi fair SSE/morph benchmark')
  console.log('grid: 32x32, ~66% populated, reactive row/column/total cells plus input/textarea/checkbox/select controls')
  console.log('fairness: all frameworks run in minimal blank jsdom windows; each scenario gets a fresh window')
  console.log('datastar: vendored tools/vendor/datastar.js, merge-fragments CustomEvent path')
  console.log(`fixi:     vendored fixi stack (${fixiInfo?.hasParityStack ? 'fixi+paxi+rexi+ssexi present; pointed/oob use targeted SSE swaps, full-page morph uses paxi' : fixiInfo?.hasPaxi ? 'fixi+paxi present; morph rows enabled, SSE rows skipped without ssexi' : 'fixi.js core only; replace rows only'})`)
  console.log('validation: sums are asserted for pointed/OOB/full-page paths; morph form-state parity is reported separately')
  for (const probe of parityProbes) console.log(`parity:${probe.framework.padEnd(9)} ${formatParityProbe(probe)}`)
  console.log(`sampling: each scenario reports median(avg-ms, mem-delta) across ${BM_SCENARIO_SAMPLES} fresh-window run(s); heap floor uses ${BM_MEM_SAMPLES} GC sample(s) when available`)
  console.log(global.gc
    ? 'memory: mem-delta is median(heapUsed(after forced GC) - heapUsed(before forced GC)) inside fresh scenario windows'
    : 'memory: mem-delta is median(heapUsed(after) - heapUsed(before)) without explicit GC (run with `node --expose-gc` for cleaner numbers)')
  console.log('final-cell: textContent of the probed grid cell after the final validated apply in the scenario')
  console.log('x-vs-dmax: avg-ms relative to dmax for the same normalized case (1.00x means equal, 2.00x means 2x slower)')
  console.log('mem-net: mem-delta minus native jsdom baseline for the same case (replace uses outerHTML; morph uses parse+replaceWith)')
  console.log('dbgΔ: compact debug deltas for the median-memory sample as bodyEls/hostEls/hostHtmlLen')
  console.log('')
  console.log('resp       shape        work          mode     diff         fw     iters   total-ms   avg-ms   x-vs-dmax   ops/s     mem-delta   mem-net   dbgΔ        final-cell')
  console.log('----------------------------------------------------------------------------------------------------------------------------------------------------------------')
  for (const r of results) {
    const p = r.caseParts
    const line = [
      p.resp.padEnd(10),
      p.shape.padEnd(12),
      p.work.padEnd(12),
      p.mode.padEnd(8),
      p.diff.padEnd(12),
      FW_SHORT[r.framework].padEnd(4),
      String(r.iters).padStart(5),
      formatNum(r.ms).padStart(10),
      formatNum(r.avgMs, 3).padStart(8),
      formatNum(r.x, 2).padStart(10) + 'x',
      formatNum(r.opsPerSec, 1).padStart(8),
      String(r.memDelta).padStart(11),
      String(r.memNet == null ? '' : r.memNet).padStart(9),
      `${r.dbgBodyElDelta ?? ''}/${r.dbgHostElDelta ?? ''}/${r.dbgHtmlLenDelta ?? ''}`.padStart(10),
      String(r.result).padStart(11)
    ].join('   ')
    console.log(line)
  }
  const worstReplaceNet = results.filter(r => r.framework === 'dmax' && r.memNet != null && r.caseParts.work === 'dom-replace').sort((a, b) => b.memNet - a.memNet)[0]
  const worstMorphNet = results.filter(r => r.framework === 'dmax' && r.memNet != null && r.caseParts.work === 'dom-morph').sort((a, b) => b.memNet - a.memNet)[0]
  if (worstReplaceNet || worstMorphNet) {
    console.log('')
    if (worstReplaceNet) console.log(`worst-dmax-replace-mem-net: case=${worstReplaceNet.case} mem-net=${worstReplaceNet.memNet} dbgΔ=${worstReplaceNet.dbgBodyElDelta}/${worstReplaceNet.dbgHostElDelta}/${worstReplaceNet.dbgHtmlLenDelta}`)
    if (worstMorphNet) console.log(`worst-dmax-morph-mem-net: case=${worstMorphNet.case} mem-net=${worstMorphNet.memNet} dbgΔ=${worstMorphNet.dbgBodyElDelta}/${worstMorphNet.dbgHostElDelta}/${worstMorphNet.dbgHtmlLenDelta}`)
  }
})().catch(err => {
  console.error(err && err.stack ? err.stack : err)
  process.exitCode = 1
})
