const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });

dom.window.addEventListener('error', e => {
  console.error('Window error:', e.error ? e.error.stack : e.message);
});

dom.window.addEventListener('load', () => {
  console.log('Load event fired');
  // Try to introspect any console errors captured
  const logs = dom.window.__capturedLogs || [];
  if(logs.length) console.log('Captured logs:', logs.join('\n'));
  // Print a few DOM elements to ensure script executed
  const body = dom.window.document.body.innerHTML.slice(0,400);
  console.log('Body starts with:', body.replace(/\n/g,' '));
  // Inspect some data-sub bindings
  const subs = [];
  dom.window.document.querySelectorAll('*').forEach(el=>{
    for(const a of el.attributes){
      if(a.name.indexOf('data-sub')===0) subs.push({name:a.name, value:a.value, text: el.textContent && el.textContent.trim().slice(0,80)});
    }
  });
  console.log('Found data-sub bindings:', subs.slice(0,8));
});

// Patch console to capture logs
const oldConsole = dom.window.console;
dom.window.console = new Proxy(oldConsole, {
  apply(target, thisArg, args) { return target.apply(thisArg, args); }
});

// Also capture errors via onerror
dom.window.onerror = function(msg, url, lineNo, colNo, error) {
  console.error('onerror:', msg, error && error.stack);
};

// Wait a bit for scripts to run
setTimeout(() => process.exit(0), 1000);
