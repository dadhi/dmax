(() => {
  if (!globalThis.dmWc) return
  const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
  const ranges = [
    ['space1', '--space-1', 'Space 1', '.125', '1', '.125', .25],
    ['space2', '--space-2', 'Space 2', '.25', '1.5', '.125', .5],
    ['space3', '--space-3', 'Space 3', '.375', '2', '.125', .75],
    ['space4', '--space-4', 'Space 4', '.5', '2.5', '.125', 1],
    ['space5', '--space-5', 'Space 5', '.75', '3', '.125', 1.5],
    ['space6', '--space-6', 'Space 6', '1', '4', '.125', 2],
    ['radius1', '--radius-1', 'Radius 1', '.125', '1.5', '.125', .5],
    ['radius2', '--radius-2', 'Radius 2', '.25', '2', '.125', .875],
    ['radius3', '--radius-3', 'Radius 3', '.375', '2.5', '.125', 1.25],
    ['line1', '--line-1', 'Line 1', '1', '3', '1', 1],
    ['line2', '--line-2', 'Line 2', '1', '4', '1', 2],
    ['sizeCell', '--size-cell', 'Cell size', '3', '7', '.125', 4.5],
    ['sizeWrap', '--size-wrap', 'Wrap size', '48', '96', '1', 72],
  ]
  const tones = [
    ['toneBg', '--tone-bg', 'Tone bg', 'oklch(98% .008 250)'],
    ['toneInk', '--tone-ink', 'Tone ink', 'oklch(28% .03 255)'],
    ['toneAccent', '--tone-accent', 'Tone accent', 'oklch(62% .18 257)'],
    ['toneGood', '--tone-good', 'Tone good', 'oklch(68% .17 148)'],
    ['toneBad', '--tone-bad', 'Tone bad', 'oklch(62% .19 25)'],
  ]
  const styleDefs = window.mExCelStyleDefs = ranges.map(([key, css, label, min, max, step, val]) => ({ key, css, label, min, max, step, val }))
  const toneDefs = window.mExCelToneDefs = tones.map(([key, css, label, val]) => ({ key, css, label, val }))
  const resetDefs = [...styleDefs, ...toneDefs]
  window.mExCelStyleReset = () => Object.fromEntries(resetDefs.map((d) => [d.key, d.val]))
  const range = ([key, css, label, min, max, step], path = 'mx.style.' + kebab(key)) => `<div class="r"><dt><code title="${label}">${css}</code></dt><dd><input type="range" min="${min}" max="${max}" step="${step}" aria-label="${label}" data-m-ex:.value@${path} data-m-ex:${path}@.input^num data-m-ex:.title@${path}="'${label}: ' + val"></dd></div>`
  const tone = ([key, css, label], path = 'mx.style.' + kebab(key)) => `<div class="r"><dt><code title="${label}">${css}</code></dt><dd><div class="tone"><input type="text" aria-label="${label}" data-m-ex:.value@${path} data-m-ex:${path}@.input data-m-ex:.title@${path}="'${label}: ' + val"></div></dd></div>`
  dmWc('mx-style-panel', `<details data-m-ex@.^rw@mx.style-panel.open>
    <summary class="fab" aria-controls="mx-style-panel">◐</summary>
    <section class="panel" id="mx-style-panel">
      <h2>Style props</h2>
      <p>Compact live tokens for this page. Copy styles writes the current values as a <code>:root { ... }</code> block.</p>
      <div class="tools"><button type="button" data-m-ex:mx@.click="window.mExCelCopyStyles(dm.mx)">copy styles</button><button type="button" data-m-ex:mx.style@.click="window.mExCelStyleReset()">reset</button></div>
      <section class="group"><h3>Layout</h3><div class="defs">${ranges.map((d) => range(d)).join('')}</div></section>
      <section class="group"><h3>Tones</h3><div class="defs">${tones.map((d) => tone(d)).join('')}</div></section>
    </section>
  </details>`)
})()
