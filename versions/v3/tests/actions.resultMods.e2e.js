const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function waitFor(conditionFn, timeout = 5000, interval = 30) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll(){
      try { if (conditionFn()) return resolve(); } catch(e){ return reject(e); }
      if (Date.now() - start > timeout) return reject(new Error('timeout')); setTimeout(poll, interval);
    })();
  });
}

(async ()=>{
  const html = fs.readFileSync(path.join(process.cwd(),'index.html'),'utf8');
  // inject test buttons before </body>
  const snippet = `
    <div id="__test_area">
      <button id="appendBtn" data-post:testArr__append?busy__busy@.click="https://example.test/append">Append</button>
      <button id="prependBtn" data-post:testArr__prepend?busy__busy@.click="https://example.test/prepend">Prepend</button>
      <pre id="arrOut" data-sub:.@testArr="JSON.stringify(dm.testArr)"></pre>
    </div>
  `;
  const injected = html.replace('</body>', snippet + '\n</body>');

  const { VirtualConsole } = require('jsdom');
  const vconsole = new VirtualConsole();
  vconsole.on('log', (...a)=>console.log(...a));
  vconsole.on('info', (...a)=>console.info(...a));
  vconsole.on('warn', (...a)=>console.warn(...a));
  vconsole.on('error', (...a)=>console.error('JSDOM error:',...a));
  const dom = new JSDOM(injected, { runScripts: 'dangerously', resources: 'usable', url: 'http://localhost/', virtualConsole: vconsole });
  const { window } = dom; const { document } = window;

  // stub fetch to return deterministic payloads
  window.fetch = async function(url, init){
    const makeRes = body => ({ ok:true, status:200, headers:{ get: k => k.toLowerCase()==='content-type' ? 'application/json' : null }, json: async ()=> body, text: async ()=> JSON.stringify(body), clone(){ return this; } });
    if(String(url).includes('/append')){
      return makeRes({type:'append', ts: Date.now()});
    }
    if(String(url).includes('/prepend')){
      // return an array to test array payload merging
      return makeRes([{type:'p1', ts:Date.now()}]);
    }
    return makeRes({});
  };

  // wait for runtime init
  await new Promise(r=>setTimeout(r, 800));

  const append = document.getElementById('appendBtn');
  const prepend = document.getElementById('prependBtn');
  assert(append && prepend, 'test buttons present');

  function getSignal(state, name){
    if(!state) return undefined;
    if(typeof state[name] !== 'undefined') return state[name];
    const lower = name.toLowerCase();
    const key = Object.keys(state).find(k=>k.toLowerCase()===lower);
    return key ? state[key] : undefined;
  }

  // debug: list attribute names present on append button
  console.log('append attrs:', Array.from(append.attributes).map(a=>a.name));

  // click append twice
  append.click();
  console.log('clicked append');
  setTimeout(()=>{ try{ console.log('state after click 200ms:', window.__getState && window.__getState()); }catch(e){} }, 200);
  setTimeout(()=>{ try{ console.log('state after click 800ms:', window.__getState && window.__getState()); }catch(e){} }, 800);
  await waitFor(()=>{ const s = window.__getState && window.__getState(); const v = getSignal(s,'testArr'); return v && Array.isArray(v) && v.length === 1; }, 5000);
  append.click();
  console.log('clicked append 2');
  setTimeout(()=>{ try{ console.log('state after click2 200ms:', window.__getState && window.__getState()); }catch(e){} }, 200);
  await waitFor(()=>{ const s = window.__getState && window.__getState(); const v = getSignal(s,'testArr'); return v && Array.isArray(v) && v.length === 2; }, 5000);
  const stateA = window.__getState();
  assert(Array.isArray(getSignal(stateA,'testArr')), 'testArr is array after appends');

  // test prepend: click once, should add to front
  prepend.click();
  console.log('clicked prepend');
  setTimeout(()=>{ try{ console.log('state after prepend 300ms:', window.__getState && window.__getState()); }catch(e){} }, 300);
  await waitFor(()=>{ const s = window.__getState && window.__getState(); const v = getSignal(s,'testArr'); return v && Array.isArray(v) && v.length === 3; }, 5000);
  const stateB = window.__getState();
  const arr = getSignal(stateB,'testArr');
  // last action was prepend which returned an array payload; that array's elements should appear at front
  assert(arr.length === 3, 'three items present');
  // ensure prepended item is at index 0 and has type 'p1'
  assert(arr[0] && arr[0].type === 'p1', 'prepended item at front');

  console.log('Result modifiers smoke test passed');
  process.exit(0);
})();

