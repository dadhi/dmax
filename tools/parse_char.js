// Char-scanning prototype parser (standalone, adapted from index.html)
function parseModsFast(s, i, n) {
  const mods = {};
  while (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) {
    i += 2;
    const start = i;
    while (i < n) {
      const cc = s.charCodeAt(i);
      if (cc === 46 || cc === 58 || cc === 64 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
      i++;
    }
    const name = s.slice(start, i);
    if (!name) return [null, i];
    let val = 1;
    if (i < n && s.charCodeAt(i) === 46) {
      i++;
      const vs = i;
      while (i < n) {
        const cc = s.charCodeAt(i);
        if (cc === 58 || cc === 64 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
        i++;
      }
      const raw = s.slice(vs, i) || '';
      if (raw !== '' && !Number.isNaN(Number(raw))) val = +raw; else val = raw;
    }
    mods[name] = val;
  }
  return [mods, i];
}

function normalizePath(path) {
  if (!path) return null;
  const parts = path.split('.');
  for (let seg of parts) if (/[A-Z]/.test(seg)) return null;
  return parts.join('.');
}

function parseDataAttrFast(attr, prefixLen) {
  const s = attr;
  const n = s.length;
  let i = prefixLen;
  let globalMods = {};
  if (i + 1 < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) {
    const gm = parseModsFast(s, i, n);
    if (gm[0] === null) return null;
    globalMods = gm[0];
    i = gm[1];
  }
  const targets = [];
  const triggers = [];

  while (i < n) {
    const ch = s.charCodeAt(i);
    if (ch === 58) { // ':'
      i++;
      if (i >= n) return null;
      const c = s.charCodeAt(i);
      if (c === 35) { // '#'
        i++;
        const startId = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 46 || cc === 58 || cc === 64) break;
          i++;
        }
        const id = s.slice(startId, i);
        let prop = null;
        if (i < n && s.charCodeAt(i) === 46) {
          i++;
          const startP = i;
          while (i < n && s.charCodeAt(i) !== 58 && s.charCodeAt(i) !== 64) i++;
          let raw = s.slice(startP, i) || null;
          if (raw) {
            const mi = raw.indexOf('__');
            if (mi !== -1) {
              const namePart = raw.slice(0, mi);
              const modsStart = startP + namePart.length;
              raw = namePart;
              i = modsStart;
            }
          }
          prop = raw ? normalizePath(raw) : null;
          if (prop === null && raw !== null) return null;
        }
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseModsFast(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        const mergedTargetMods = Object.assign({}, globalMods, modsRes[0]);
        targets.push({type: 'prop', elemId: id, propPath: prop, isCurr: false, mods: mergedTargetMods});
      } else if (c === 46) { // '.'
        i++;
        const startP = i;
        while (i < n && s.charCodeAt(i) !== 58 && s.charCodeAt(i) !== 64) i++;
        let raw = s.slice(startP, i) || null;
        if (raw) {
          const mi = raw.indexOf('__');
          if (mi !== -1) {
            const namePart = raw.slice(0, mi);
            const modsStart = startP + namePart.length;
            raw = namePart;
            i = modsStart;
          }
        }
        const prop = raw ? normalizePath(raw) : null;
        if (prop === null && raw !== null) return null;
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseModsFast(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        const mergedTargetMods = Object.assign({}, globalMods, modsRes[0]);
        targets.push({type: 'prop', elemId: '', propPath: prop, isCurr: true, mods: mergedTargetMods});
      } else {
        const start = i;
        while (i < n && s.charCodeAt(i) !== 58 && s.charCodeAt(i) !== 64) i++;
        let raw = s.slice(start, i);
        if (!raw) return null;
        const mi = raw.indexOf('__');
        if (mi !== -1) {
          const namePart = raw.slice(0, mi);
          raw = namePart;
          i = start + namePart.length;
        }
        const name = normalizePath(raw);
        if (name === null) return null;
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseModsFast(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        const mergedTargetMods = Object.assign({}, globalMods, modsRes[0]);
        targets.push({type: 'signal', name, mods: mergedTargetMods});
      }
    } else if (ch === 64) { // '@'
      i++;
      if (i >= n) return null;
      const c = s.charCodeAt(i);
      if (c === 95) { // '_'
        i++;
        const startTok = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 46 || cc === 58 || cc === 64 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
          i++;
        }
        const tok = s.slice(startTok, i);
        if (!tok) return null;
        let arg = null;
        if (i < n && s.charCodeAt(i) === 46) {
          i++;
          const startA = i;
          while (i < n) {
            const cc = s.charCodeAt(i);
            if (cc === 58 || cc === 64 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
            i++;
          }
          arg = s.slice(startA, i) || null;
        }
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseModsFast(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        const merged = Object.assign({}, globalMods, modsRes[0]);
        triggers.push({type: 'special', name: tok, arg, mods: merged});
        continue;
      }
      if (c === 35) { // '#'
        i++;
        const startId = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 46 || cc === 58 || cc === 64 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
          i++;
        }
        const id = s.slice(startId, i);
        let eventName = null;
        if (i < n && s.charCodeAt(i) === 46) {
          i++;
          const startE = i;
          while (i < n) {
            const cc = s.charCodeAt(i);
            if (cc === 58 || cc === 64 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
            i++;
          }
          const raw = s.slice(startE, i) || null;
          eventName = raw ? normalizePath(raw) : null;
          if (eventName === null && raw !== null) return null;
        }
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseModsFast(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        const merged = Object.assign({}, globalMods, modsRes[0]);
        triggers.push({type: 'event', elemId: id, eventName, isCurr: false, mods: merged});
      } else if (c === 46) { // '.'
        i++;
        const startE = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 58 || cc === 64 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
          i++;
        }
        const raw = s.slice(startE, i) || null;
        const eventName = raw ? normalizePath(raw) : null;
        if (eventName === null && raw !== null) return null;
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseModsFast(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        const merged = Object.assign({}, globalMods, modsRes[0]);
        triggers.push({type: 'event', elemId: '', eventName, isCurr: true, mods: merged});
      } else {
        const start = i;
        while (i < n) {
          const cc = s.charCodeAt(i);
          if (cc === 64 || cc === 58 || (cc === 95 && s.charCodeAt(i+1) === 95)) break;
          i++;
        }
        const raw = s.slice(start, i);
        if (!raw) return null;
        const name = normalizePath(raw);
        if (name === null) return null;
        let modsRes = [ {}, i ];
        if (i < n && s.charCodeAt(i) === 95 && s.charCodeAt(i+1) === 95) modsRes = parseModsFast(s, i, n);
        if (modsRes[0] === null) return null;
        i = modsRes[1];
        const merged = Object.assign({}, globalMods, modsRes[0]);
        triggers.push({type: 'signal', name, mods: merged});
      }
    } else {
      return null;
    }
    if (i < n && s.charCodeAt(i) !== 58 && s.charCodeAt(i) !== 64) return null;
  }
  if (!targets.length && !triggers.length) return null;
  return {targets, triggers};
}

module.exports = { parseDataAttrFast };
