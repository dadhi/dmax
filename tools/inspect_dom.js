const fs = require('fs'); const path = require('path'); const { JSDOM, VirtualConsole } = require('jsdom');const fs = require('fs'); const path = require('path'); const { JSDOM, VirtualConsole } = require('jsdom');
















})();  editInputs.forEach((inp,i)=> console.log('edit input', i, inp.outerHTML));  console.log('editInputs count', editInputs.length);  const editInputs = Array.from(doc.querySelectorAll('input.edit-item'));  });    console.log('OUTER', ul.outerHTML.slice(0,500));    console.log('UL', i, 'attrs', Array.from(ul.getAttributeNames()));  lists.forEach((ul,i)=>{  const lists = Array.from(doc.getElementsByTagName('ul'));  const doc = window.document;  const { window } = dom; await new Promise(res=>{ window.addEventListener('load', ()=>res(), {once:true}); setTimeout(res,1000); });  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', virtualConsole: vcon });(async ()=>{const vcon = new VirtualConsole(); vcon.on('log', msg => console.log('[page]', msg)); vcon.on('error', msg => console.error('[page error]', msg));const html = fs.readFileSync(file, 'utf8');const file = path.resolve(__dirname, '..', 'index.html');const file = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const vcon = new VirtualConsole(); vcon.on('log', msg => console.log('[page]', msg)); vcon.on('error', msg => console.error('[page error]', msg));
(async ()=>{
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', virtualConsole: vcon });
  const { window } = dom; await new Promise(res=>{ window.addEventListener('load', ()=>res(), {once:true}); setTimeout(res,1000); });
  const doc = window.document;
  const lists = Array.from(doc.getElementsByTagName('ul'));
  lists.forEach((ul,i)=>{
    console.log('UL', i, 'attrs', Array.from(ul.getAttributeNames()));
    console.log('OUTER', ul.outerHTML.slice(0,500));
  });
  const editInputs = Array.from(doc.querySelectorAll('input.edit-item'));
  console.log('editInputs count', editInputs.length);
  editInputs.forEach((inp,i)=> console.log('edit input', i, inp.outerHTML));
})();