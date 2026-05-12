const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const { pathToFileURL } = require('url');

const file = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

const vcon = new VirtualConsole();
const pageLogs = [];
vcon.on('log', (...args) => { pageLogs.push(args.map(String).join(' ')); console.log('[page]', ...args); });
vcon.on('error', (...args) => { pageLogs.push(args.map(String).join(' ')); console.error('[page error]', ...args); });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitFor(conditionFn, timeout = 15000, interval = 50) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      try {
        if (conditionFn()) return resolve();
      } catch (err) {
        return reject(err);
      }
      if (Date.now() - start > timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}

const INLINE_LIST_PREFIX_RE = /^\d+\s+/;
const FETCH_FAILURE_RE = /dAction fetch failed/;

(async () => {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: pathToFileURL(file).href,
    pretendToBeVisual: true,
    virtualConsole: vcon,
    beforeParse(win) {
      const observers = [];
      win.__intersectionObservers = observers;
      win.IntersectionObserver = function (cb) {
        const obs = {
          cb,
          els: [],
          observe(el) { this.els.push(el); },
          unobserve(el) { this.els = this.els.filter(e => e !== el); },
          disconnect() { this.els = []; }
        };
        observers.push(obs);
        return obs;
      };
    }
  });
  const { window } = dom;

  await new Promise((res) => {
    window.addEventListener('load', () => res(), { once: true });
    setTimeout(res, 1000);
  });

  const doc = window.document;
  const debug = doc.querySelector('[data-debug]');
  let passCount = 0, failCount = 0;
  const fail = (m) => { console.error('FAIL:', m); failCount++; process.exitCode = 2; };
  const pass = (m) => { console.log('PASS:', m); passCount++; };

  const findByAttr = (tag, attrFull) => {
    const nodes = Array.from(doc.getElementsByTagName(tag));
    return nodes.find(el => Array.from(el.getAttributeNames()).includes(attrFull));
  };
  const readState = () => {
    try {
      return JSON.parse((debug && debug.textContent) || '{}');
    } catch (_) {
      return {};
    }
  };
  const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

  try {
    await waitFor(() => /Tests \d+: Passed \d+, Failed 0/.test(doc.getElementById('summary')?.textContent || ''));
    await sleep(100);

    const exampleLabels = Array.from(doc.querySelectorAll('#ported-examples .page'));
    const labelCodes = Array.from(doc.querySelectorAll('#ported-examples code[data-attr-name]'));
    const resolveLabelTarget = (node) => {
      const id = node.getAttribute('data-attr-for');
      if (id) return doc.getElementById(id);
      const templateId = node.getAttribute('data-attr-template');
      const selector = node.getAttribute('data-attr-selector') || '*';
      const template = templateId ? doc.getElementById(templateId) : null;
      return template?.content?.querySelector(selector) || null;
    };
    const expectedLabelText = (node) => {
      const attrName = node.getAttribute('data-attr-name');
      const target = resolveLabelTarget(node);
      if (!attrName || !target) return '';
      const value = target.getAttribute(attrName);
      return value == null || value === '' ? attrName : `${attrName}="${value}"`;
    };
    if (exampleLabels.length >= 14) pass('Ported examples show visible attribute labels'); else fail('Ported examples missing visible attribute labels');
    if (labelCodes.length >= 40) pass('Ported examples render dmax-driven code labels'); else fail('Ported examples missing dmax-driven code labels');
    if (labelCodes.every((node) => (node.textContent || '').trim() === (expectedLabelText(node) || '').trim())) pass('Ported example labels sync from source attributes'); else fail('Ported example labels do not match source attributes');
    if (labelCodes.some((node) => /data-sub:\.@count@#btn1@#btn2/.test(node.textContent || ''))) pass('Section4 label shows explicit multi-button triggers'); else fail('Section4 label missing explicit multi-button triggers');

    // Section 1: data-sub sync
    const nameInput = doc.getElementById('exUserNameInput');
    const nameOut = findByAttr('strong', 'data-sub:.@user.name');
    const sigToProp = doc.getElementById('sigToProp');
    if (!nameInput || !nameOut || !sigToProp) fail('Section1 elements missing');
    if (nameOut.textContent.trim() === 'Alice' && sigToProp.value === 'Alice') pass('Section1 initial sync render'); else fail('Section1 did not render initial sync state');

    if (sigToProp) {
      if (sigToProp.value === nameOut.textContent.trim()) pass('data-sub signal->element initial populate'); else fail('data-sub signal->element did not populate');
      const prev = nameOut.textContent.trim();
      sigToProp.value = 'SigToPropTest';
      fire(sigToProp, 'change');
      await sleep(60);
      if (nameOut.textContent.trim() === prev) pass('data-sub signal->element is one-way'); else fail('data-sub signal->element incorrectly wrote back');
    }

    const elToSig = doc.getElementById('elToSig');
    if (elToSig) {
      elToSig.value = 'ElToSigTest';
      fire(elToSig, 'input');
      await sleep(60);
      if (readState().user?.name === 'ElToSigTest') pass('data-sub element->signal updates signal'); else fail('data-sub element->signal did not update');
      const orig = elToSig.value;
      nameInput.value = 'FromSignal';
      fire(nameInput, 'input');
      await sleep(60);
      if (elToSig.value === orig) pass('data-sub element->signal is one-way (signal changes do not affect element)'); else fail('data-sub element->signal unexpectedly updated from signal');
    }

    const twoWay = doc.getElementById('twoWay');
    if (twoWay) {
      twoWay.value = 'TwoWayTest';
      fire(twoWay, 'change');
      await sleep(60);
      if (readState().user?.name === 'TwoWayTest') pass('data-sub ^rw two-way writes to signal'); else fail('data-sub ^rw two-way did not write to signal');
      const signalWriter = elToSig || nameInput;
      signalWriter.value = 'TwoWayFromSignal';
      fire(signalWriter, signalWriter === nameInput ? 'change' : 'input');
      await sleep(60);
      if (twoWay.value === 'TwoWayFromSignal') pass('data-sub ^rw two-way reflects signal -> element'); else fail('data-sub ^rw two-way did not reflect signal->element');
    }

    // Section 2: style + boolean deep sync
    const colorInput = findByAttr('input', 'data-sub@.^rw@user.ui.theme-color');
    const preview = findByAttr('div', 'data-sub:.style.color@user.ui.theme-color');
    if (!colorInput || !preview) fail('Section2 color elements missing');
    colorInput.value = '#ff0000';
    fire(colorInput, 'change');
    await sleep(80);
    const styleVal = preview.style.color || preview.getAttribute('style') || '';
    if (/ff0000/i.test(styleVal) || /rgb\(255,\s*0,\s*0\)/i.test(styleVal)) pass('Section2 color sync'); else fail('Section2 color not applied');

    const range = findByAttr('input', 'data-sub@.^rw@user.ui.font-size');
    const pfont = findByAttr('p', 'data-sub:.style.font-size@user.ui.font-size');
    if (!range || !pfont) fail('Section2 font elements missing');
    range.value = '24';
    fire(range, 'change');
    await sleep(60);
    if (/24px/.test(pfont.style.fontSize || pfont.getAttribute('style') || '')) pass('Section2 font-size sync'); else fail('Section2 font-size not applied');

    const checkbox = findByAttr('input', 'data-sub@.^rw@user.ui.is-active');
    const status = findByAttr('strong', 'data-sub:.@user.ui.is-active');
    if (!checkbox || !status) fail('Section2 checkbox elements missing');
    checkbox.checked = false;
    fire(checkbox, 'change');
    await sleep(60);
    checkbox.checked = true;
    fire(checkbox, 'change');
    await sleep(60);
    if (status.textContent.includes('ONLINE')) pass('Section2 checkbox->status'); else fail('Section2 checkbox did not update');

    // Section 3: multiple triggers + targets
    const btnPlus = Array.from(doc.getElementsByTagName('button')).find(b => b.textContent.trim() === '+1');
    const btnMinus = Array.from(doc.getElementsByTagName('button')).find(b => b.textContent.trim() === '-1');
    const btnReset = Array.from(doc.getElementsByTagName('button')).find(b => b.textContent.trim() === 'Reset');
    const countDisplay = findByAttr('strong', 'data-sub:.@count');
    if (!btnPlus || !btnMinus || !btnReset || !countDisplay) fail('Section3 elements missing');
    const before = Number(readState().count);
    fire(btnPlus, 'click');
    await sleep(60);
    if (Number(readState().count) === before + 1) pass('Section3 +1 works'); else fail('Section3 +1 failed');

    const probeBtn = doc.getElementById('probeBtn');
    const probeOut = doc.getElementById('probeOut');
    if (!probeBtn || !probeOut) fail('Probe elements missing');
    fire(btnPlus, 'click');
    await sleep(60);
    if ((probeOut.textContent || '').trim() === 'count') pass('Probe trig shows signal name on signal trigger'); else fail('Probe trig did not show signal name');
    fire(probeBtn, 'click');
    await sleep(60);
    if (probeBtn.textContent && /probeBtn\s+click/.test(probeBtn.textContent)) pass('Probe el/detail available on event'); else fail('Probe el/detail not available');

    const gOnceBtn = doc.getElementById('gOnceBtn');
    const gAlwaysBtn = doc.getElementById('gAlwaysBtn');
    const gOnceDisplay = findByAttr('span', 'data-sub:.@once-test');
    const gAlwaysDisplay = findByAttr('span', 'data-sub:.@always-test');
    if (!gOnceBtn || !gAlwaysBtn || !gOnceDisplay || !gAlwaysDisplay) fail('Global-mod elements missing');
    fire(gOnceBtn, 'click');
    await sleep(80);
    fire(gOnceBtn, 'click');
    await sleep(80);
    if (Number(gOnceDisplay.textContent.trim() || 0) === 1) pass('Global ^once works'); else fail('Global ^once failed');
    fire(gAlwaysBtn, 'click');
    fire(gAlwaysBtn, 'click');
    await sleep(80);
    if (Number(gAlwaysDisplay.textContent.trim() || 0) >= 2) pass('Global ^once overridden by ^always works'); else fail('Global ^once overridden by ^always failed');

    const incGuard = doc.getElementById('incGuard');
    const gtOut = findByAttr('span', 'data-sub:.@guard-val^gt.5');
    const eqOut = findByAttr('span', 'data-sub:.@guard-val^eq.3');
    if (!incGuard || !gtOut || !eqOut) fail('Guard elements missing');
    fire(incGuard, 'click');
    await sleep(50);
    fire(incGuard, 'click');
    await sleep(80);
    if (gtOut.textContent.trim() === '') pass('Guard gt withheld at 5'); else fail('Guard gt incorrectly allowed at 5');
    fire(incGuard, 'click');
    await sleep(80);
    if (gtOut.textContent.trim().length) pass('Guard gt allows when >5'); else fail('Guard gt did not allow when >5');

    // Section 4: side effects + multi triggers
    const btn1 = doc.getElementById('btn1');
    const btn2 = doc.getElementById('btn2');
    const multiDisplay = findByAttr('strong', 'data-sub:.@count@#btn1@#btn2');
    if (!btn1 || !btn2 || !multiDisplay) fail('Section4 elements missing');
    pageLogs.length = 0;
    fire(btn1, 'click');
    await sleep(120);
    const btn1Logged = pageLogs.some((l) => /Triggered!/.test(l));
    const btn1Visible = /Button 1/.test(multiDisplay.textContent);
    if (btn1Logged && btn1Visible) pass('Section4 btn1 visibly updates and triggers side-effect'); else fail('Section4 btn1 did not visibly trigger');
    pageLogs.length = 0;
    fire(btn2, 'click');
    await sleep(120);
    const btn2Logged = pageLogs.some((l) => /Triggered!/.test(l));
    const btn2Visible = /Button 2/.test(multiDisplay.textContent);
    if (btn2Logged && btn2Visible) pass('Section4 btn2 visibly updates and triggers side-effect'); else fail('Section4 btn2 did not visibly trigger');

    // Section 5: cross-element property sync
    const src = doc.getElementById('src');
    const previewSrc = findByAttr('p', 'data-sub:.@#src.input');
    const mirror = doc.getElementById('mirror');
    if (!src || !previewSrc || !mirror) fail('Section5 elements missing');
    src.value = 'hello world';
    fire(src, 'input');
    await sleep(60);
    if (previewSrc.textContent.includes('hello') && mirror.value.includes('hello')) pass('Section5 cross-element sync'); else fail('Section5 did not sync');

    // Section 6: window events + intervals
    const winSpan = findByAttr('span', 'data-sub:.@_window.resize');
    const intSpan = findByAttr('span', 'data-sub:.@_interval.1000');
    const timeoutSpan = findByAttr('span', 'data-sub:.@_timeout.1500');
    if (!winSpan || !intSpan || !timeoutSpan) fail('Section6 elements missing');
    window.dispatchEvent(new window.Event('resize'));
    await sleep(60);
    if (winSpan.textContent.length) pass('Section6 window resize'); else fail('Section6 window resize not applied');
    await sleep(1100);
    if (intSpan.textContent.length) pass('Section6 interval update'); else fail('Section6 interval did not update');
    await sleep(500);
    if (timeoutSpan.textContent.length) pass('Section6 timeout update'); else fail('Section6 timeout did not update');

    // Section 6.a: _viewed trigger
    const viewedSpan = doc.getElementById('viewedOut');
    if (!viewedSpan) { fail('Section6a viewedOut element missing'); } else {
      const observers = window.__intersectionObservers || [];
      const viewedObs = observers.find(o => o.els.includes(viewedSpan));
      if (!viewedObs) { fail('Section6a IntersectionObserver not registered for viewedOut'); } else {
        viewedObs.cb([{ isIntersecting: true, intersectionRatio: 1.0, target: viewedSpan }]);
        await sleep(60);
        if (viewedSpan.textContent.includes('Viewed')) pass('Section6a _viewed trigger fired'); else fail('Section6a _viewed did not update viewedOut');
      }
    }

    // Section 7: default props + events
    const inp1 = doc.getElementById('inp1');
    const inp1Preview = findByAttr('span', 'data-sub:.@#inp1.input');
    const btn3 = doc.getElementById('btn3');
    const btn3Preview = findByAttr('span', 'data-sub:.@#btn3');
    if (!inp1 || !inp1Preview || !btn3 || !btn3Preview) fail('Section7 elements missing');
    inp1.value = 'abc';
    fire(inp1, 'input');
    await sleep(60);
    if (inp1Preview.textContent.includes('abc')) pass('Section7 inp1 sync'); else fail('Section7 inp1 failed');
    fire(btn3, 'click');
    await sleep(60);
    if (btn3Preview.textContent.includes('Clicked')) pass('Section7 btn3 click'); else fail('Section7 btn3 click failed');

    const valPickInput = doc.getElementById('valpickinput');
    const valPickTyped = doc.getElementById('valPickTyped');
    const valPropPicked = doc.getElementById('valPropPicked');
    const valSignalStep = doc.getElementById('valSignalStep');
    const valSignalPicked = doc.getElementById('valSignalPicked');
    const valSignalPlusOne = doc.getElementById('valSignalPlusOne');
    const missingValEls = [
      ['valpickinput', valPickInput],
      ['valPickTyped', valPickTyped],
      ['valPropPicked', valPropPicked],
      ['valSignalStep', valSignalStep],
      ['valSignalPicked', valSignalPicked],
      ['valSignalPlusOne', valSignalPlusOne]
    ].filter(([, el]) => !el).map(([id]) => id);
    if (missingValEls.length) fail('Section7.a ^val elements missing: ' + missingValEls.join(', '));
    if (valSignalPicked.textContent.trim() === '7' && valSignalPlusOne.textContent.trim() === '8') pass('Section7.a signal ^val renders initial nested values'); else fail('Section7.a signal ^val initial render wrong');
    valPickInput.value = 'typed text';
    fire(valPickInput, 'input');
    await sleep(60);
    if (valPickTyped.textContent.includes('typed text')) pass('Section7.a typed preview follows the input event'); else fail('Section7.a typed preview did not update');
    if (valPropPicked.textContent.trim() === '33') pass('Section7.a event ^val picks data-foo-bar instead of the typed value'); else fail('Section7.a event ^val did not pick data-foo-bar');
    fire(valSignalStep, 'click');
    await sleep(60);
    if (valSignalPicked.textContent.trim() === '8') pass('Section7.a signal ^val tracks the nested child value'); else fail('Section7.a signal ^val did not track nested child value');
    if (valSignalPlusOne.textContent.trim() === '9') pass('Section7.a signal ^val expression receives the picked child value'); else fail('Section7.a signal ^val expression did not use the picked child value');

    // Section 8: classes + display
    const classBox = doc.getElementById('classBox');
    const displayBox = doc.getElementById('displayBox');
    const displayNeg = doc.getElementById('displayNeg');
    const chkActive = doc.getElementById('classToggle');
    if (!classBox || !displayBox || !displayNeg || !chkActive) fail('Section8 class/disp elements missing');
    chkActive.checked = false;
    fire(chkActive, 'change');
    await sleep(80);
    if (!classBox.classList.contains('active') || window.getComputedStyle(displayBox).display === 'none') pass('Section8 class/disp toggled off'); else fail('Section8 class/disp did not toggle off');
    chkActive.checked = true;
    fire(chkActive, 'change');
    await sleep(80);
    if (classBox.classList.contains('active') && window.getComputedStyle(displayBox).display !== 'none') pass('Section8 class/disp toggled on'); else fail('Section8 class/disp did not toggle on');
    chkActive.checked = false;
    fire(chkActive, 'change');
    await sleep(80);
    if (window.getComputedStyle(displayNeg).display !== 'none') pass('Negated display shows when inactive'); else fail('Negated display did not show when inactive');
    chkActive.checked = true;
    fire(chkActive, 'change');
    await sleep(80);
    if (window.getComputedStyle(displayNeg).display === 'none') pass('Negated display hides when active'); else fail('Negated display did not hide when active');

    // Section 9: data-dump
    const iterUl = findByAttr('ul', 'data-dump+#tpl-post@posts');
    const inlineUl = doc.getElementById('inline-posts');
    if (!iterUl || !inlineUl) fail('Section9 data-dump elements missing');
    const hasZebraClasses = (nodes) => nodes.length > 0 && nodes.every((node, idx) =>
      node.classList.contains(idx % 2 === 0 ? 'zebra-even' : 'zebra-odd')
    );
    await sleep(80);
    const initialDumpCount = Array.from(iterUl.children).length;
    const initialInlineCount = Array.from(inlineUl.children).length;
    if (initialDumpCount === 3) pass('Section9 data-dump renders existing items immediately by default'); else fail('Section9 data-dump rendered wrong number');
    if (initialInlineCount === initialDumpCount) pass('Section9 inline data-dump matches primary list'); else fail('Section9 inline data-dump wrong');
    if (!pageLogs.some((l) => /dClass requires at least one trigger in: data-class\+zebra-even\+!zebra-odd/.test(l))) pass('Section9 zebra classes wire without dClass errors'); else fail('Section9 zebra classes still log missing-trigger errors');
    if (hasZebraClasses(Array.from(iterUl.children)) && hasZebraClasses(Array.from(inlineUl.children))) pass('Section9 zebra classes render immediately'); else fail('Section9 zebra classes missing on initial render');
    fire(doc.getElementById('addPost'), 'click');
    await sleep(80);
    if (Array.from(iterUl.children).length > initialDumpCount && Array.from(inlineUl.children).length > initialInlineCount) pass('Section9 data-dump updates on append'); else fail('Section9 data-dump did not update on append');
    if (hasZebraClasses(Array.from(iterUl.children)) && hasZebraClasses(Array.from(inlineUl.children))) pass('Section9 zebra classes stay correct after append'); else fail('Section9 zebra classes wrong after append');
    const updateSecondPost = doc.getElementById('updateSecondPost');
    if (!updateSecondPost) fail('Section9 update-second action missing');
    const dumpNodesBeforeUpdate = Array.from(iterUl.children);
    const inlineNodesBeforeUpdate = Array.from(inlineUl.children);
    fire(updateSecondPost, 'click');
    await sleep(80);
    const dumpNodesAfterUpdate = Array.from(iterUl.children);
    const inlineNodesAfterUpdate = Array.from(inlineUl.children);
    const extractDataDumpItemText = (node) => (node.querySelector('.item')?.textContent || '').trim();
    const extractInlineItemText = (node) => (node.textContent || '').trim().replace(INLINE_LIST_PREFIX_RE, '');
    const dumpItemTexts = dumpNodesAfterUpdate.map(extractDataDumpItemText);
    const inlineItemTexts = inlineNodesAfterUpdate.map(extractInlineItemText);
    const expectedUpdatedPosts = ['First post', 'Updated second post', 'Third post'];
    if (dumpNodesAfterUpdate.length === dumpNodesBeforeUpdate.length
      && dumpNodesAfterUpdate.every((node, idx) => node === dumpNodesBeforeUpdate[idx])) pass('Section9 data-dump updates item content in place');
    else fail('Section9 data-dump recreated rows for content update');
    if (inlineNodesAfterUpdate.length === inlineNodesBeforeUpdate.length
      && inlineNodesAfterUpdate.every((node, idx) => node === inlineNodesBeforeUpdate[idx])) pass('Section9 inline data-dump updates item content in place');
    else fail('Section9 inline data-dump recreated rows for content update');
    if (expectedUpdatedPosts.every((text, idx) => dumpItemTexts[idx] === text)) pass('Section9 data-dump updates only the changed item content');
    else fail('Section9 data-dump item content update wrong');
    if (expectedUpdatedPosts.every((text, idx) => inlineItemTexts[idx] === text)) pass('Section9 inline data-dump updates only the changed item content');
    else fail('Section9 inline data-dump item content update wrong');
    fire(doc.getElementById('removeFirst'), 'click');
    await sleep(80);
    if (hasZebraClasses(Array.from(iterUl.children)) && hasZebraClasses(Array.from(inlineUl.children))) pass('Section9 zebra classes stay correct after removing first item'); else fail('Section9 zebra classes wrong after removing first item');
    fire(doc.getElementById('removePost'), 'click');
    await sleep(80);
    if (hasZebraClasses(Array.from(iterUl.children)) && hasZebraClasses(Array.from(inlineUl.children))) pass('Section9 zebra classes stay correct after removing last item'); else fail('Section9 zebra classes wrong after removing last item');
    const threadUl = doc.getElementById('thread-posts');
    const inlineThreads = doc.getElementById('inline-threads');
    const refreshThreads = doc.getElementById('refreshThreads');
    if (!threadUl || !inlineThreads || !refreshThreads) fail('Section9 nested data-dump elements missing');
    fire(refreshThreads, 'click');
    await sleep(80);
    const threadItems = Array.from(threadUl.children);
    const inlineThreadItems = Array.from(inlineThreads.children);
    if (threadItems.length === 4) pass('Section9 nested data-dump rendered 4 threads after shape change'); else fail('Section9 nested data-dump thread count wrong');
    if (inlineThreadItems.length === 4) pass('Section9 nested inline data-dump rendered 4 threads after shape change'); else fail('Section9 nested inline data-dump thread count wrong');
    const firstThreadReplyCount = threadItems[0]?.querySelectorAll('.thread-replies > li').length || 0;
    const firstInlineThreadReplyCount = inlineThreadItems[0]?.querySelectorAll('.thread-replies > li').length || 0;
    if (firstThreadReplyCount === 2) pass('Section9 nested data-dump rendered nested replies'); else fail('Section9 nested data-dump replies wrong');
    if (firstInlineThreadReplyCount === 2) pass('Section9 nested inline data-dump rendered nested replies'); else fail('Section9 nested inline data-dump replies wrong');

    // Section 10: modifiers
    const onceBtn = doc.getElementById('onceBtn');
    const debBtn = doc.getElementById('debBtn');
    const thrBtn = doc.getElementById('thrBtn');
    const gate = doc.getElementById('gate');
    const andBtn = doc.getElementById('andBtn');
    const onceVal = findByAttr('span', 'data-sub:.@mod-once');
    const debVal = findByAttr('span', 'data-sub:.@mod-deb');
    const thrVal = findByAttr('span', 'data-sub:.@mod-thr');
    const andVal = findByAttr('span', 'data-sub:.@mod-and');
    if (!onceBtn || !debBtn || !thrBtn || !gate || !andBtn || !onceVal || !debVal || !thrVal || !andVal) fail('Modifiers elements missing');

    fire(onceBtn, 'click');
    await sleep(50);
    fire(onceBtn, 'click');
    await sleep(80);
    if (Number(onceVal.textContent.trim() || 0) === 1) pass('Modifiers once works'); else fail('Modifiers once failed');

    fire(debBtn, 'click');
    fire(debBtn, 'click');
    fire(debBtn, 'click');
    await sleep(220);
    if (Number(debVal.textContent.trim() || 0) === 1) pass('Modifiers debounce works'); else fail('Modifiers debounce failed');

    fire(thrBtn, 'click');
    fire(thrBtn, 'click');
    fire(thrBtn, 'click');
    await sleep(350);
    if (Number(thrVal.textContent.trim() || 0) >= 1) pass('Modifiers throttle works (>=1)'); else fail('Modifiers throttle failed');

    gate.checked = false;
    fire(gate, 'change');
    fire(andBtn, 'click');
    await sleep(120);
    if (Number(andVal.textContent.trim() || 0) === 0) pass('Modifiers ^and prevents when gate false'); else fail('Modifiers ^and failed when gate false');
    gate.checked = true;
    fire(gate, 'change');
    fire(andBtn, 'click');
    await sleep(120);
    if (Number(andVal.textContent.trim() || 0) === 1) pass('Modifiers ^and allows when gate true'); else fail('Modifiers ^and failed when gate true');

    // Section 10.a: content vs shape
    const contentSub = doc.getElementById('contentSub');
    const shapeSub = doc.getElementById('shapeSub');
    const chgChild = doc.getElementById('chgChild');
    const addKey = doc.getElementById('addKey');
    const removeKey = doc.getElementById('removeKey');
    const demoState = doc.getElementById('demoState');
    const demoContent = doc.getElementById('demoContent');
    const demoShape = doc.getElementById('demoShape');
    const demoChangeChild = doc.getElementById('demoChangeChild');
    const demoAddKey = doc.getElementById('demoAddKey');
    const demoRemoveKey = doc.getElementById('demoRemoveKey');
    const missingShapeEls = [
      ['contentSub', contentSub],
      ['shapeSub', shapeSub],
      ['chgChild', chgChild],
      ['addKey', addKey],
      ['removeKey', removeKey],
      ['demoState', demoState],
      ['demoContent', demoContent],
      ['demoShape', demoShape],
      ['demoChangeChild', demoChangeChild],
      ['demoAddKey', demoAddKey],
      ['demoRemoveKey', demoRemoveKey]
    ].filter(([, el]) => !el).map(([name]) => name);
    if (missingShapeEls.length) fail('Section10.a content/shape elements missing: ' + missingShapeEls.join(', '));

    window.__contentCount = 0;
    window.__shapeCount = 0;
    fire(chgChild, 'click');
    await sleep(80);
    if (window.__contentCount === 1) pass('Section10.a content change notifies default subscriber'); else fail('Section10.a content subscriber did not run on content change');
    if (window.__shapeCount === 0) pass('Section10.a content change skips shape-only subscriber'); else fail('Section10.a shape-only subscriber ran on content change');

    fire(addKey, 'click');
    await sleep(80);
    if (window.__contentCount >= 2) pass('Section10.a shape add keeps default subscriber active'); else fail('Section10.a default subscriber missed shape add');
    if (window.__shapeCount === 1) pass('Section10.a shape add notifies shape-only subscriber'); else fail('Section10.a shape-only subscriber missed shape add');

    fire(removeKey, 'click');
    await sleep(80);
    if (window.__shapeCount === 2) pass('Section10.a shape removal notifies shape-only subscriber'); else fail('Section10.a shape-only subscriber missed shape removal');
    if (readState().parent?.child === 2 && !('added' in (readState().parent || {}))) pass('Section10.a remove key preserves remaining parent content'); else fail('Section10.a remove key cleared more than the removed property');

    fire(demoChangeChild, 'click');
    await sleep(80);
    if (demoContent.textContent.trim() === '2') pass('Section10.a demo content subscriber shows content changes'); else fail('Section10.a demo content subscriber wrong');
    if (demoShape.textContent.trim() === '') pass('Section10.a demo shape subscriber stays quiet on content change'); else fail('Section10.a demo shape subscriber changed on content update');

    fire(demoAddKey, 'click');
    await sleep(80);
    if (/added:\s*addedAt/.test(demoShape.textContent)) pass('Section10.a demo shape subscriber shows shape add detail'); else fail('Section10.a demo shape subscriber missing add detail');
    fire(demoRemoveKey, 'click');
    await sleep(80);
    if (/removed:[^\n]*addedAt/.test(demoShape.textContent)) pass('Section10.a demo shape subscriber shows shape removal detail'); else fail('Section10.a demo shape subscriber missing remove detail');
    if (demoContent.textContent.trim() === '2') pass('Section10.a demo remove key preserves remaining content'); else fail('Section10.a demo remove key cleared remaining content');
    const demoStateKeepsChild = /"child": 2/.test(demoState.textContent) && !/addedAt/.test(demoState.textContent);
    if (demoStateKeepsChild) pass('Section10.a demo remove key only removes the requested property');
    else fail('Section10.a demo remove key removed too much state');

    // Section 10.b: constant bracket indices
    const post0Title = doc.getElementById('post0Title');
    const post1Title = doc.getElementById('post1Title');
    const setPost0Title = doc.getElementById('setPost0Title');
    const setPost1Title = doc.getElementById('setPost1Title');
    if (!post0Title || !post1Title || !setPost0Title || !setPost1Title) fail('Section10.b constant-index elements missing');
    if (post0Title.textContent.trim() === 'Post A' && post1Title.textContent.trim() === 'Post B') pass('Section10.b constant-index subscriptions render initial values'); else fail('Section10.b constant-index initial render wrong');

    fire(setPost0Title, 'click');
    await sleep(80);
    if (post0Title.textContent.trim() === 'NewP0Title') pass('Section10.b constant-index update works for first item'); else fail('Section10.b first constant-index update failed');
    if (post1Title.textContent.trim() === 'Post B') pass('Section10.b constant-index update stays scoped to first item'); else fail('Section10.b first constant-index update leaked');

    fire(setPost1Title, 'click');
    await sleep(80);
    if (post1Title.textContent.trim() === 'NewP1Title') pass('Section10.b constant-index update works for second item'); else fail('Section10.b second constant-index update failed');

    // Section 10.c: removed nodes clean up signal subscriptions
    doc.body.insertAdjacentHTML('beforeend', '<span data-sub:.@count="dm.count"></span>');
    const dynamicSub = doc.body.lastElementChild;
    if (typeof window.wireNode !== 'function') fail('Section10.c wireNode unavailable');
    else {
      const attrName = dynamicSub.getAttributeNames().find((name) => name.startsWith('data-sub'));
      const beforeSubs = window.eval('(_subs.get("count") || []).length');
      window.wireNode(dynamicSub, attrName, dynamicSub.getAttribute(attrName));
      const afterWireSubs = window.eval('(_subs.get("count") || []).length');
      if (afterWireSubs === beforeSubs + 1) pass('Section10.c dynamic signal subscription registers once'); else fail('Section10.c dynamic signal subscription did not register');
      dynamicSub.remove();
      await sleep(80);
      const afterRemoveSubs = window.eval('(_subs.get("count") || []).length');
      if (afterRemoveSubs === beforeSubs) pass('Section10.c removed signal subscription is cleaned up'); else fail('Section10.c removed signal subscription still registered after removal');
    }

    // Section 11: actions demo keeps fetch shim after in-page asserts and updates outputs
    const loadPost = doc.getElementById('loadPost');
    const createPost = doc.getElementById('create-post');
    const oobLoad = doc.getElementById('oobLoad');
    const sseLoad = doc.getElementById('sseLoad');
    const oobTarget = doc.getElementById('oobTarget');
    const sseTarget = doc.getElementById('sseTarget');
    const missingActionDemoEls = [
      ['loadPost', loadPost],
      ['create-post', createPost],
      ['oobLoad', oobLoad],
      ['sseLoad', sseLoad],
      ['oobTarget', oobTarget],
      ['sseTarget', sseTarget]
    ].filter(([, el]) => !el).map(([name]) => name);
    if (missingActionDemoEls.length) fail('Section11 action demo elements missing: ' + missingActionDemoEls.join(', '));

    if (typeof window.fetch === 'function') pass('Section11 demo fetch shim remains installed after in-page asserts'); else fail('Section11 demo fetch shim missing after in-page asserts');

    pageLogs.length = 0;
    fire(loadPost, 'click');
    await waitFor(() => readState().postResult && readState().code === 200, 2000);
    if (readState().postResult?.title === 'His mother had always taught him') pass('Section11 GET action populates DummyJSON post'); else fail('Section11 GET action did not populate post result');
    if (!pageLogs.some((l) => FETCH_FAILURE_RE.test(l))) pass('Section11 GET action does not log fetch failure'); else fail('Section11 GET action logged fetch failure');

    pageLogs.length = 0;
    fire(createPost, 'click');
    await waitFor(() => readState().createdPost && readState().code === 201, 2000);
    if (readState().createdPost?.title === 'I am in love with someone.') pass('Section11 POST action populates created post'); else fail('Section11 POST action did not populate created post');
    if (!pageLogs.some((l) => FETCH_FAILURE_RE.test(l))) pass('Section11 POST action does not log fetch failure'); else fail('Section11 POST action logged fetch failure');

    pageLogs.length = 0;
    fire(oobLoad, 'click');
    await waitFor(() => /OOB morphed content/.test(oobTarget.textContent || ''), 2000);
    if (/OOB morphed content/.test(oobTarget.textContent || '')) pass('Section11 OOB action morphs target HTML'); else fail('Section11 OOB action did not morph target HTML');
    if (!pageLogs.some((l) => FETCH_FAILURE_RE.test(l))) pass('Section11 OOB action does not log fetch failure'); else fail('Section11 OOB action logged fetch failure');

    pageLogs.length = 0;
    fire(sseLoad, 'click');
    await waitFor(() => readState().sseMessage === 'hello from dmax' && readState().sseCount === 1, 2000);
    if (/SSE morphed target/.test(sseTarget.textContent || '')) pass('Section11 SSE action updates state and morph target'); else fail('Section11 SSE action did not update target');
    if (!pageLogs.some((l) => FETCH_FAILURE_RE.test(l))) pass('Section11 SSE action does not log fetch failure'); else fail('Section11 SSE action logged fetch failure');

    console.log('All tests completed.');
    console.log('SUMMARY:', passCount + ' passed,', failCount + ' failed');
  } catch (e) {
    console.error('Error during headless tests:', e && e.stack || e);
    process.exitCode = 3;
  }

  setTimeout(() => process.exit(process.exitCode || 0), 200);
})();
