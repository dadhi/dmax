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
  if (!input || !textarea || !checkbox || !select) throw new Error('Benchmark controls not mounted')
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
  const diffs = []
  for (const key of Object.keys(expected)) if (actual[key] !== expected[key]) diffs.push(key)
  return diffs
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
    `<td id="cell-${row}-${col}" data-oob="morph" data-row="${row}" data-col="${col}">${val == null ? '' : escapeHtml(val)}</td>`,
    `<th id="sum-row-${row}" data-oob="morph">${rowSums[row]}</th>`,
    `<th id="sum-col-${col}" data-oob="morph">${colSums[col]}</th>`,
    `<th id="sum-total" data-oob="morph">${total}</th>`
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

  const baseHtml = renderGridHtml(baseCells, CONTROL_VARIANTS.base)
  const smallHtml = renderGridHtml(smallDiffCells, CONTROL_VARIANTS.small)
  const largeHtml = renderGridHtml(largeDiffCells, CONTROL_VARIANTS.large)
  const basePointed = renderPointedPatch(baseCells, focusRow, focusCol)
  const smallPointed = renderPointedPatch(smallDiffCells, focusRow, focusCol)
  const baseOob = renderOobPatch(baseCells, focusRow, focusCol)
  const smallOob = renderOobPatch(smallDiffCells, focusRow, focusCol)
  const baseOobFragments = renderOobFragments(baseCells, focusRow, focusCol)
  const smallOobFragments = renderOobFragments(smallDiffCells, focusRow, focusCol)

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
    baseOobFragments,
    smallOobFragments,
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
    smallSse: makeSseOuter(smallPointed)
  }
}

function stripOobAttrs(html) {
  return html.replace(/ data-oob="morph"/g, '')
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

function runDmaxScenarios(window, payloads) {
  const { document, applyDmaxPatchElements, applyDmaxSse, applyOobHtml } = window
  if (typeof applyDmaxPatchElements !== 'function' || typeof applyDmaxSse !== 'function' || typeof applyOobHtml !== 'function')
    throw new Error('dmax benchmark helpers are not available on window')

  const host = document.createElement('div')
  host.id = 'bench-host'
  document.body.appendChild(host)

  const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
  const v = makeValidators(host, () => document.activeElement, payloads, 'dmax')
  const validateBase = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseMorph, 'base')
  const validateSmallStaticControls = () => v.assertState(payloads.expectedSmall, payloads.expectedFormBaseMorph, 'small-static-controls')
  const validateSmallMorph = () => v.assertState(payloads.expectedSmall, payloads.expectedFormSmallMorph, 'small-morph')
  const validateBaseReplace = () => v.assertState(payloads.expectedBase, payloads.expectedFormBaseReplace, 'base-replace')
  const validateSmallReplace = () => v.assertState(payloads.expectedSmall, payloads.expectedFormSmallReplace, 'small-replace')
  const validateLargeMorph = () => v.assertState(payloads.expectedLarge, payloads.expectedFormLargeMorph, 'large-morph')
  const validateLargeReplace = () => v.assertState(payloads.expectedLarge, payloads.expectedFormLargeReplace, 'large-replace')

  return [
    runScenario(
      'pointed-sse-small-diff',
      500,
      mountBase,
      () => applyDmaxSse(payloads.smallSse, 'bench'),
      () => applyDmaxSse(payloads.baseSse, 'bench'),
      v.cellText,
      validateSmallStaticControls,
      validateBase
    ),
    runScenario(
      'oob-morph-small-diff',
      500,
      mountBase,
      () => { for (const html of payloads.smallOobFragments) applyOobHtml(html) },
      () => { for (const html of payloads.baseOobFragments) applyOobHtml(html) },
      v.cellText,
      validateSmallStaticControls,
      validateBase
    ),
    runScenario(
      'full-page-small-diff-morph',
      120,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.smallHtml }),
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }),
      v.cellText,
      validateSmallMorph,
      validateBase
    ),
    runScenario(
      'full-page-small-diff-replace',
      120,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.smallHtml }),
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.baseHtml }),
      v.cellText,
      validateSmallReplace,
      validateBaseReplace
    ),
    runScenario(
      'full-page-large-diff-morph',
      30,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.largeHtml }),
      () => applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }),
      v.cellText,
      validateLargeMorph,
      validateBase
    ),
    runScenario(
      'full-page-large-diff-replace',
      30,
      mountBase,
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.largeHtml }),
      () => applyDmaxPatchElements({ mode: 'replace', dmaxElements: payloads.baseHtml }),
      v.cellText,
      validateLargeReplace,
      validateBaseReplace
    )
  ].map(r => ({ framework: 'dmax', ...r }))
}

function runDatastarScenarios(window, payloads) {
  const { document } = window
  const host = document.createElement('div')
  host.id = 'bench-host'
  document.body.appendChild(host)

  const mountBase = () => { host.innerHTML = payloads.baseHtml; seedUserFormState(host) }
  const mergeFragments = (fragments, mergeMode, selector = '') => applyDatastarFragments(window, fragments, mergeMode, selector)
  const v = makeValidators(host, () => document.activeElement, payloads, 'datastar')
  const validateBase = () => v.assertGrid(payloads.expectedBase, 'base')
  const validateSmall = () => v.assertGrid(payloads.expectedSmall, 'small')
  const validateLarge = () => v.assertGrid(payloads.expectedLarge, 'large')

  return [
    runScenario(
      'pointed-fragments-small-diff',
      500,
      mountBase,
      () => mergeFragments(payloads.smallPointed, 'morph'),
      () => mergeFragments(payloads.basePointed, 'morph'),
      v.cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'oob-fragments-small-diff',
      500,
      mountBase,
      () => mergeFragments(stripOobAttrs(payloads.smallOob), 'morph'),
      () => mergeFragments(stripOobAttrs(payloads.baseOob), 'morph'),
      v.cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'full-page-small-diff-morph',
      120,
      mountBase,
      () => mergeFragments(payloads.smallHtml, 'morph', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'morph', '#bench-app'),
      v.cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'full-page-small-diff-replace',
      120,
      mountBase,
      () => mergeFragments(payloads.smallHtml, 'outer', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'outer', '#bench-app'),
      v.cellText,
      validateSmall,
      validateBase
    ),
    runScenario(
      'full-page-large-diff-morph',
      30,
      mountBase,
      () => mergeFragments(payloads.largeHtml, 'morph', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'morph', '#bench-app'),
      v.cellText,
      validateLarge,
      validateBase
    ),
    runScenario(
      'full-page-large-diff-replace',
      30,
      mountBase,
      () => mergeFragments(payloads.largeHtml, 'outer', '#bench-app'),
      () => mergeFragments(payloads.baseHtml, 'outer', '#bench-app'),
      v.cellText,
      validateLarge,
      validateBase
    )
  ].map(r => ({ framework: 'datastar', ...r }))
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

;(async () => {
  const payloads = makePayloads()
  const dmaxWindow = await loadDmaxWindow()
  const datastarWindow = await loadDatastarWindow()
  const results = [
    ...runDmaxScenarios(dmaxWindow, payloads),
    ...runDatastarScenarios(datastarWindow, payloads)
  ]
  const dmaxProbeWindow = await loadDmaxWindow()
  const datastarProbeWindow = await loadDatastarWindow()
  const parityProbes = [
    probeMorphParity(
      dmaxProbeWindow,
      payloads,
      'dmax',
      () => dmaxProbeWindow.applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.smallHtml }),
      () => dmaxProbeWindow.applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.baseHtml }),
      () => dmaxProbeWindow.applyDmaxPatchElements({ mode: 'outer', dmaxElements: payloads.largeHtml })
    ),
    probeMorphParity(
      datastarProbeWindow,
      payloads,
      'datastar',
      () => applyDatastarFragments(datastarProbeWindow, payloads.smallHtml, 'morph', '#bench-app'),
      () => applyDatastarFragments(datastarProbeWindow, payloads.baseHtml, 'morph', '#bench-app'),
      () => applyDatastarFragments(datastarProbeWindow, payloads.largeHtml, 'morph', '#bench-app')
    )
  ]

  console.log('dmax vs Datastar semi-realistic SSE/morph benchmark')
  console.log('grid: 32x32, ~66% populated, reactive row/column/total cells plus input/textarea/checkbox/select controls')
  console.log('datastar: vendored tools/vendor/datastar.js, merge-fragments CustomEvent path')
  console.log('validation: sums are asserted for pointed/OOB/full-page paths; morph form-state parity is reported separately')
  for (const probe of parityProbes) console.log(`parity:${probe.framework.padEnd(9)} ${formatParityProbe(probe)}`)
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
  dmaxProbeWindow.close()
  datastarProbeWindow.close()
})().catch(err => {
  console.error(err && err.stack ? err.stack : err)
  process.exitCode = 1
})
