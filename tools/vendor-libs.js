#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const https = require('https')
const cp = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const VENDOR_DIR = path.join(ROOT, 'tools', 'vendor')
const MANIFEST_FILE = path.join(VENDOR_DIR, 'manifest.json')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dmax-vendor-'))

const LIBS = {
  datastar: {
    pkg: '@starfederation/datastar',
    out: 'datastar.js',
    pick: ['dist/datastar.js', 'bundle/datastar.js', 'datastar.js', 'index.js'],
    stable: true
  },
  fixi: {
    pkg: 'fixi-js',
    out: 'fixi.js',
    pick: ['fixi.js', 'dist/fixi.js', 'dist/cjs/index.js', 'dist/esm/index.js', 'src/fixi.js', 'index.js']
  },
  paxi: {
    pkg: '@bigskysoftware/paxi-js',
    out: 'paxi.js',
    pick: ['paxi.js', 'dist/paxi.js', 'dist/cjs/index.js', 'dist/esm/index.js', 'src/paxi.js', 'index.js']
  },
  rexi: {
    pkg: '@bigskysoftware/rexi-js',
    out: 'rexi.js',
    pick: ['rexi.js', 'dist/rexi.js', 'dist/cjs/index.js', 'dist/esm/index.js', 'src/rexi.js', 'index.js']
  },
  ssexi: {
    pkg: '@bigskysoftware/ssexi-js',
    out: 'ssexi.js',
    pick: ['ssexi.js', 'dist/ssexi.js', 'dist/cjs/index.js', 'dist/esm/index.js', 'src/ssexi.js', 'index.js']
  },
  moxi: {
    pkg: '@bigskysoftware/moxi-js',
    out: 'moxi.js',
    pick: ['moxi.js', 'dist/moxi.js', 'dist/cjs/index.js', 'dist/esm/index.js', 'src/moxi.js', 'index.js']
  }
}

const args = new Set(process.argv.slice(2))
if (args.has('-h') || args.has('--help')) {
  console.log(`usage: node tools/vendor-libs.js [--all] [--fixi] [--datastar] [--with-moxi]\n\n` +
    `defaults: datastar + fixi + paxi + rexi + ssexi\n` +
    `examples:\n` +
    `  node tools/vendor-libs.js\n` +
    `  node tools/vendor-libs.js --all\n` +
    `  node tools/vendor-libs.js --datastar\n` +
    `  node tools/vendor-libs.js --fixi\n` +
    `  node tools/vendor-libs.js --fixi --with-moxi`)
  process.exit(0)
}

const hasNamed = [...args].some(a => /^--(?:datastar|fixi|paxi|rexi|ssexi|moxi)$/.test(a))
const selected = hasNamed
  ? [...args].map(a => a.slice(2)).filter(a => LIBS[a])
  : args.has('--all')
    ? ['datastar', 'fixi', 'paxi', 'rexi', 'ssexi', 'moxi']
    : ['datastar', 'fixi', 'paxi', 'rexi', 'ssexi']
if (args.has('--with-moxi') && !selected.includes('moxi')) selected.push('moxi')

const get = (url, isJson = false) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'user-agent': 'dmax-vendor-script' } }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
      return resolve(get(res.headers.location, isJson))
    if (res.statusCode !== 200) return reject(new Error(`${url} -> HTTP ${res.statusCode}`))
    const chunks = []
    res.on('data', c => chunks.push(c))
    res.on('end', () => {
      const buf = Buffer.concat(chunks)
      resolve(isJson ? JSON.parse(buf.toString('utf8')) : buf)
    })
  }).on('error', reject)
})

const sh = (cmd, cwd = ROOT) => cp.execFileSync('bash', ['-lc', cmd], { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8')
const esc = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`
const readJson = (p, dflt) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : dflt
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true })
const rm = (p) => fs.rmSync(p, { recursive: true, force: true })
const isPre = (v) => /-(?:alpha|beta|rc|pre)\b/i.test(v)
const verParts = (v) => v.split('-')[0].split('.').map(n => +n || 0)
const cmpVer = (a, b) => {
  const ap = verParts(a), bp = verParts(b)
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const d = (ap[i] || 0) - (bp[i] || 0)
    if (d) return d
  }
  if (isPre(a) === isPre(b)) return 0
  return isPre(a) ? -1 : 1
}
const pickVersion = (meta, stableOnly = false) => {
  const versions = Object.keys(meta.versions || {})
  const pool = stableOnly ? versions.filter(v => !isPre(v)) : versions
  if (!pool.length) throw new Error(`No ${stableOnly ? 'stable ' : ''}versions for ${meta.name}`)
  return pool.sort(cmpVer).at(-1)
}

function pickFile(dir, picks) {
  const pkgFile = path.join(dir, 'package.json')
  const pkg = readJson(pkgFile, null)
  const add = (out, v) => {
    if (!v || typeof v !== 'string') return
    if (!out.includes(v)) out.push(v)
  }
  const addExp = (out, v) => {
    if (!v) return
    if (typeof v === 'string') return add(out, v)
    if (typeof v !== 'object') return
    add(out, v.browser)
    add(out, v.default)
    add(out, v.import)
    add(out, v.require)
    add(out, v.node)
    add(out, v.module)
    for (const k in v) addExp(out, v[k])
  }
  const cands = []
  for (const rel of picks) add(cands, rel)
  if (pkg) {
    add(cands, pkg.unpkg)
    add(cands, pkg.jsdelivr)
    add(cands, pkg.browser)
    add(cands, pkg.main)
    add(cands, pkg.module)
    addExp(cands, pkg.exports)
  }
  for (const rel of cands) {
    const file = path.join(dir, rel)
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file
  }
  const files = sh(`find ${esc(dir)} -type f \\( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \\) | sort`).trim().split('\n').filter(Boolean)
  if (!files.length) throw new Error(`No JS files found in ${dir}`)
  throw new Error(`Could not pick bundle in ${dir}. Tried:\n${cands.map(f => `- ${f}`).join('\n')}\nFound:\n${files.map(f => `- ${path.relative(dir, f)}`).join('\n')}`)
}

async function vendorOne(name) {
  const cfg = LIBS[name]
  const meta = await get(`https://registry.npmjs.org/${encodeURIComponent(cfg.pkg)}`, true)
  const version = pickVersion(meta, cfg.stable)
  const info = meta.versions?.[version]
  const tarball = info?.dist?.tarball
  if (!tarball) throw new Error(`No tarball for ${cfg.pkg}@${version}`)
  const tgz = path.join(TMP, `${name}-${version}.tgz`)
  const outDir = path.join(TMP, `${name}-${version}`)
  fs.writeFileSync(tgz, await get(tarball))
  ensureDir(outDir)
  sh(`tar -xzf ${esc(tgz)} -C ${esc(outDir)}`)
  const pkgDir = path.join(outDir, 'package')
  const src = pickFile(pkgDir, cfg.pick)
  const out = path.join(VENDOR_DIR, cfg.out)
  fs.copyFileSync(src, out)
  return {
    name,
    pkg: cfg.pkg,
    version,
    tarball,
    file: path.relative(ROOT, out),
    source: path.relative(pkgDir, src)
  }
}

;(async () => {
  try {
    ensureDir(VENDOR_DIR)
    const manifest = readJson(MANIFEST_FILE, {})
    const next = { ...manifest }
    for (const name of selected) {
      const info = await vendorOne(name)
      next[name] = info
      console.log(`${name}: ${info.pkg}@${info.version} -> ${info.file} (${info.source})`)
    }
    next.updatedAt = new Date().toISOString()
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(next, null, 2) + '\n')
    console.log(`wrote ${path.relative(ROOT, MANIFEST_FILE)}`)
  } finally {
    rm(TMP)
  }
})().catch(err => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
