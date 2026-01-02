const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');

const file = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

const vcon = new VirtualConsole();
vcon.on('log', msg => console.log('[page]', msg));
vcon.on('error', msg => console.error('[page error]', msg));

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', virtualConsole: vcon });
  const { window } = dom;
  await new Promise((res) => {
    window.addEventListener('load', () => res(), { once: true });
    setTimeout(res, 1000);
  });
  const doc = window.document;
  const demoAdd = doc.getElementById('demoAddKey');
  const demoRemove = doc.getElementById('demoRemoveKey');
  const demoChange = doc.getElementById('demoChangeChild');
  const demoState = doc.getElementById('demoState');
  const demoContent = doc.getElementById('demoContent');
  const demoShape = doc.getElementById('demoShape');
  const demoShapeFull = doc.getElementById('demoShapeFull');
  const addedPre = Array.from(doc.querySelectorAll('pre')).find(p => p.hasAttribute('data-sub') && p.getAttribute('data-sub').includes('values-added'));
  const removedPre = Array.from(doc.querySelectorAll('pre')).find(p => p.hasAttribute('data-sub') && p.getAttribute('data-sub').includes('values-removed'));
  // values-changed view was removed from demo; skip searching for it

  console.log('elements:', {demoAdd: !!demoAdd, demoRemove: !!demoRemove, demoChange: !!demoChange});

  // Initial state
  console.log('initial demoState:', demoState.textContent.trim());

  // Click add key
  demoAdd.dispatchEvent(new window.Event('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  console.log('state after add:', JSON.stringify(window.__getState(), null, 2));
  console.log('after add demoState:', demoState.textContent.trim());
  console.log('demoContent:', demoContent.textContent.trim());
  console.log('demoShape:', demoShape.textContent.trim());
  console.log('demoShapeFull:', demoShapeFull.textContent.trim());
  console.log('addedPre:', addedPre ? addedPre.textContent.trim() : 'missing');

  // Click change child
  demoChange.dispatchEvent(new window.Event('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  console.log('state after change:', JSON.stringify(window.__getState(), null, 2));
  console.log('after change demoState:', demoState.textContent.trim());
  console.log('demoContent:', demoContent.textContent.trim());
  console.log('demoShape:', demoShape.textContent.trim());
  console.log('demoShapeFull:', demoShapeFull.textContent.trim());
  // changedPre output removed in demo

  // Click remove key
  demoRemove.dispatchEvent(new window.Event('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  console.log('state after remove:', JSON.stringify(window.__getState(), null, 2));
  console.log('after remove demoState:', demoState.textContent.trim());
  console.log('demoShape:', demoShape.textContent.trim());
  console.log('demoShapeFull:', demoShapeFull.textContent.trim());
  console.log('removedPre:', removedPre ? removedPre.textContent.trim() : 'missing');

})();
