const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');

const file = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

const vcon = new VirtualConsole();
const pageLogs = [];
vcon.on('log', msg => { pageLogs.push(String(msg)); console.log('[page]', msg); });
vcon.on('error', msg => { pageLogs.push(String(msg)); console.error('[page error]', msg); });

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', virtualConsole: vcon });
  const { window } = dom;
  // wait for load event
  await new Promise((res) => {
    window.addEventListener('load', () => res(), { once: true });
    // timeout fallback
    setTimeout(res, 1000);
  });

  const doc = window.document;
  const debug = doc.querySelector('[data-debug]');
  const fail = (m) => { console.error('FAIL:', m); process.exitCode = 2; };
  const pass = (m) => { console.log('PASS:', m); };

  try {
    // Helper to find element by attribute full name (attributes may contain colons/dots)
    const findByAttr = (tag, attrFull) => {
        const nodes = Array.from(doc.getElementsByTagName(tag));
        return nodes.find(el => Array.from(el.getAttributeNames()).some(a => a === attrFull));
      };
    // Section 1: data-sync:user.name two-way
    const nameInput = findByAttr('input', 'data-sync:user.name');
    const nameOut = findByAttr('strong', 'data-sync:user.name');
    if(!nameInput || !nameOut) fail('Section1 elements missing');
    nameInput.value = 'Bob';
    nameInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    if(nameOut.textContent.trim() === 'Bob' && debug.textContent.includes('Bob')) pass('Section1 two-way sync'); else fail('Section1 did not sync to signal');

    // Section 2: color input -> preview style color
    const colorInput = findByAttr('input', 'data-sync:user.ui.theme-color');
    // preview element has class preview and a data-sub attribute for style.color
    const preview = Array.from(doc.getElementsByClassName('preview')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('data-sub') === 0)) || doc.querySelector('.preview');
    if(!colorInput || !preview) fail('Section2 color elements missing');
    console.log('Preview attr names:', Array.from(preview.getAttributeNames()));
    console.log('Preview style before:', preview.getAttribute('style') || preview.style.cssText || '');
    colorInput.value = '#ff0000';
    colorInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
    console.log('Preview style after:', preview.getAttribute('style') || preview.style.cssText || '');
    const styleVal = (preview.style && preview.style.color) || preview.getAttribute('style') || '';
    if(/ff0000/i.test(styleVal) || /rgb\(255,\s*0,\s*0\)/i.test(styleVal)) pass('Section2 color sync'); else fail('Section2 color not applied');

    // Section 2: font-size range -> style.fontSize
    const range = findByAttr('input', 'data-sync:user.ui.font-size');
    const pfont = Array.from(doc.getElementsByTagName('p')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('data-sub') === 0 && a.indexOf('font-size') !== -1));
    if(!range || !pfont) fail('Section2 font elements missing');
    range.value = '24';
    range.dispatchEvent(new window.Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    const fontVal = (pfont.style && pfont.style.fontSize) || pfont.getAttribute('style') || '';
    if(/24px/.test(fontVal)) pass('Section2 font-size sync'); else fail('Section2 font-size not applied');

    // Section 2: checkbox -> online/offline text
    const checkbox = findByAttr('input', 'data-sync:user.ui.is-active');
    const status = Array.from(doc.getElementsByTagName('strong')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('data-sub') === 0 && a.indexOf('user.ui.is-active') !== -1));
    if(!checkbox || !status) fail('Section2 checkbox elements missing');
    checkbox.checked = true;
    checkbox.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    if(status.textContent.includes('ONLINE')) pass('Section2 checkbox->status'); else fail('Section2 checkbox did not update');

    // Section 3: count buttons and targets
    const btnPlus = Array.from(doc.getElementsByTagName('button')).find(b => b.textContent.trim() === '+1');
    const btnMinus = Array.from(doc.getElementsByTagName('button')).find(b => b.textContent.trim() === '-1');
    const btnReset = Array.from(doc.getElementsByTagName('button')).find(b => b.textContent.trim() === 'Reset');
    const countDisplay = Array.from(doc.getElementsByTagName('*')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('@count') !== -1));
    if(!btnPlus || !btnMinus || !btnReset || !countDisplay) fail('Section3 elements missing');
    const before = countDisplay.textContent.trim();
    btnPlus.dispatchEvent(new window.Event('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    if(Number(countDisplay.textContent.trim()) === Number(before) + 1) pass('Section3 +1 works'); else fail('Section3 +1 failed');

    // Section 4: btn1/btn2 side-effect and multi-trigger display
    const btn1 = doc.getElementById('btn1');
    const btn2 = doc.getElementById('btn2');
    const multiDisplay = Array.from(doc.getElementsByTagName('*')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('#btn1') !== -1 && a.indexOf('#btn2') !== -1));
    if(!btn1 || !btn2 || !multiDisplay) fail('Section4 elements missing');
    const prev = multiDisplay.textContent;
    pageLogs.length = 0;
    btn1.dispatchEvent(new window.Event('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const triggeredLog = pageLogs.some(l => /Triggered!/.test(l));
    if(triggeredLog) pass('Section4 btn1 triggers side-effect (log)');
    else if(multiDisplay.textContent !== prev) pass('Section4 btn1 triggers multi-display');
    else fail('Section4 btn1 did not trigger');

    // Section 5: cross-element src input -> preview and mirror
    const src = doc.getElementById('src');
    const previewSrc = Array.from(doc.getElementsByTagName('*')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('src.input') !== -1));
    const mirror = doc.getElementById('mirror');
    if(!src || !previewSrc || !mirror) fail('Section5 elements missing');
    src.value = 'hello world';
    src.dispatchEvent(new window.Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    if(previewSrc.textContent.includes('hello') && mirror.value && mirror.value.length) pass('Section5 cross-element sync'); else fail('Section5 did not sync');

    // Section 6: window resize and interval
    const winSpan = Array.from(doc.getElementsByTagName('*')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('window.resize') !== -1));
    const intSpan = Array.from(doc.getElementsByTagName('*')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('interval.1000') !== -1));
    if(!winSpan || !intSpan) fail('Section6 elements missing');
    window.dispatchEvent(new window.Event('resize'));
    await new Promise(r => setTimeout(r, 50));
    if(winSpan.textContent && winSpan.textContent.length) pass('Section6 window resize'); else fail('Section6 window resize not applied');
    await new Promise(r => setTimeout(r, 1200));
    if(intSpan.textContent && intSpan.textContent.length) pass('Section6 interval update'); else fail('Section6 interval did not update');

    // Section 7: default prop/event for inp1 and btn3
    const inp1 = doc.getElementById('inp1');
    const inp1Preview = Array.from(doc.getElementsByTagName('*')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('inp1') !== -1));
    const btn3 = doc.getElementById('btn3');
    const btn3Preview = Array.from(doc.getElementsByTagName('*')).find(el => Array.from(el.getAttributeNames()).some(a => a.indexOf('btn3') !== -1));
    if(!inp1 || !inp1Preview || !btn3 || !btn3Preview) fail('Section7 elements missing');
    inp1.value = 'abc'; inp1.dispatchEvent(new window.Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    if(inp1Preview.textContent.includes('abc')) pass('Section7 inp1 sync'); else fail('Section7 inp1 failed');
    btn3.dispatchEvent(new window.Event('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    if(btn3Preview.textContent.includes('Clicked')) pass('Section7 btn3 click'); else fail('Section7 btn3 click failed');

    console.log('All tests completed.');
  } catch (e) {
    console.error('Error during headless tests:', e && e.stack || e);
    process.exitCode = 3;
  }

  // allow any pending timers to run briefly then exit
  setTimeout(() => process.exit(process.exitCode || 0), 200);
})();
