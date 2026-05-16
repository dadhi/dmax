#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { minify } = require('terser')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'dmax.js')
const OUT = path.join(ROOT, 'dist', 'dmax.min.js')

;(async () => {
  const src = fs.readFileSync(SRC, 'utf8')
  const out = await minify(src, {
    compress: {
      passes: 2,
      unsafe: true,
      unsafe_math: true,
      pure_getters: true
    },
    mangle: true,
    format: { comments: false }
  })
  if (!out.code) throw new Error('Minifier returned empty output')
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, out.code + '\n')
  const srcBytes = Buffer.byteLength(src)
  const minBytes = Buffer.byteLength(out.code + '\n')
  console.log(`dmax.js: ${srcBytes} bytes`)
  console.log(`dist/dmax.min.js: ${minBytes} bytes`)
})().catch(err => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
