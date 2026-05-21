#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { minify } = require('terser')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'dmax.js')
const OUT = path.join(ROOT, 'dist', 'dmax.min.js')
const OUT_GZ = path.join(ROOT, 'dist', 'dmax.min.js.gz')
const OUT_BR = path.join(ROOT, 'dist', 'dmax.min.js.br')

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
  const minCode = out.code + '\n'
  const minBuf = Buffer.from(minCode)
  const gzBuf = zlib.gzipSync(minBuf, { level: 9 })
  const brBuf = zlib.brotliCompressSync(minBuf)
  fs.writeFileSync(OUT, minBuf)
  fs.writeFileSync(OUT_GZ, gzBuf)
  fs.writeFileSync(OUT_BR, brBuf)
  const srcBytes = Buffer.byteLength(src)
  const minBytes = minBuf.length
  console.log(`dmax.js: ${srcBytes} bytes`)
  console.log(`dist/dmax.min.js: ${minBytes} bytes`)
  console.log(`dist/dmax.min.js.gz: ${gzBuf.length} bytes`)
  console.log(`dist/dmax.min.js.br: ${brBuf.length} bytes`)
})().catch(err => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
