#!/usr/bin/env node
/*
 * Forge chaos run — one hostile, seeded walk over a running screen, and what broke.
 * The hands of a /forge-chaos-sweep worker: the worker picks where and how, this tool acts and watches,
 * so a cheap model never has to write browser code and every walk can be replayed exactly.
 * No dependency: Node built-ins and the DevTools protocol, with the system Chrome (CHROME_PATH to override).
 *
 *   node forge/packs/visual-qa/tools/run-chaos.mjs --url http://localhost:4200/items --angle impatient --rng 7 \
 *        [--actions 40] [--width 1280] [--seed "<JavaScript before the page's scripts>"] [--before "<JavaScript to reach a state>"] \
 *        [--avoid "log ?out|sign ?out|delete account"] [--roam] [--shots dir/] [--json run.json] [--timeout 120]
 *   node forge/packs/visual-qa/tools/run-chaos.mjs --replay run.json [--upto 12] [--json replay.json]
 *
 * Angles (what the walk does; the same --rng gives the same walk on the same app):
 *   wander         clicks links and buttons at random, scrolls, goes back
 *   impatient      triple clicks, reloads right after a click, back and forward in the middle of things
 *   dirty-input    fills every field with hostile values (empty, 500 characters, emoji, markup, quotes, absurd numbers and dates) and submits
 *   keyboard       Tab, Shift+Tab, Enter, Space, Escape and arrows only — no mouse
 *   flaky-network  the same as a user would do, while the network goes slow, drops and comes back
 *   small-screen   a 320px phone that rotates and changes size while being used
 *
 * Signals (what counts, measured, never an opinion). `hard` ones are broken on sight; `suspect` ones need a judge:
 *   hard     uncaught · server-error (HTTP 5xx) · blank-page · injected-script-ran (a typed value was executed)
 *   suspect  console-error · duplicate-request (one action sent the same write twice) · silent-failure (a write failed and the
 *            screen did not change) · sideways-scroll · dead-end (nothing left to act on) · stuck-busy (still loading 5s after the end)
 * Each signal carries the step that triggered it and a fingerprint (kind · route · message), so runs can be merged.
 * --replay runs the recorded actions again and says which signals came back: a signal counts only when it does.
 * The walk stays on the starting origin and in its own area: it prefers the controls of the screen over links to other pages
 * (one action in ten may take one), may follow a flow elsewhere for 3 actions, then comes back to --url and runs --before
 * again (--roam lets it go anywhere). It skips controls matching --avoid, and accepts native dialogs.
 * Exit code: 0 = ran (read the signals), 2 = bad arguments or the page could not be opened.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { openPage } from './chrome.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const fail = (m) => { console.error(`run-chaos: ${m}`); process.exit(2); };

const ANGLES = {
  wander: { click: 70, scroll: 10, key: 10, back: 10 },
  impatient: { multiclick: 40, click: 20, 'click-reload': 15, back: 10, forward: 5, reload: 10 },
  'dirty-input': { fill: 45, 'fill-enter': 20, click: 25, key: 10 },
  keyboard: { key: 100 },
  'flaky-network': { click: 40, fill: 20, offline: 10, slow: 10, online: 20 }, // no reload: offline, the browser's own error page is not the app's fault
  'small-screen': { click: 55, scroll: 15, fill: 10, resize: 20 },
};
const HARD = new Set(['uncaught', 'server-error', 'blank-page', 'injected-script-ran']);
const MARK = 'forge-chaos-ran';
const HOSTILE = {
  text: ['', '   ', 'A'.repeat(500), '😀🔥👨‍👩‍👧‍👦', `<img src=x onerror=alert('${MARK}')>`, `"><script>alert('${MARK}')</script>`, "O'Brien \"quoted\" \\ back", 'line one\nline two',
    'שלום עולם', 'a​b', '-1', '0', '99999999999999999999', '2020-13-45', "' OR '1'='1", '../../etc/passwd', '%00%0a', 'null', 'undefined'],
  number: ['-1', '0', '99999999999999999999', '1e309', '0.0000001', ''],
  date: ['0001-01-01', '9999-12-31', '2024-02-30', ''],
  email: ['a@b', 'not-an-email', `${'a'.repeat(250)}@example.test`, 'a@b.c ', ''],
};
const SIZES = [[320, 568], [568, 320], [360, 740], [768, 1024], [1024, 768], [320, 480]];
const KEYS = [['Tab', 9, 50], ['Enter', 13, 20], ['Escape', 27, 10], ['Shift+Tab', 9, 10], [' ', 32, 5], ['ArrowDown', 40, 5]];

const replayFile = opt('replay');
const recorded = replayFile ? JSON.parse(readFileSync(resolve(replayFile), 'utf8')) : null;
const url = opt('url', recorded?.url);
if (!url) fail('--url is required (or --replay <run.json>)');
const angle = opt('angle', recorded?.angle ?? 'wander');
if (!ANGLES[angle]) fail(`unknown angle "${angle}" (${Object.keys(ANGLES).join(', ')})`);
const rngSeed = Number(opt('rng', recorded?.rng ?? 1));
const budget = Number(opt('actions', 40));
let width = Number(opt('width', recorded?.width ?? (angle === 'small-screen' ? 320 : 1280)));
let height = width < 600 ? 844 : 800;
const seedScript = opt('seed', recorded?.seed ?? '');
const before = opt('before', recorded?.before ?? '');
const avoid = new RegExp(opt('avoid', recorded?.avoid ?? 'log ?out|sign ?out|déconnexion|delete (my )?account'), 'i');
const shots = opt('shots');
const jsonOut = opt('json');
const upto = Number(opt('upto', Infinity));
const timeout = Number(opt('timeout', 120)) * 1000;
const roam = args.includes('--roam') || recorded?.roam === true;

// Seeded random numbers: the same --rng gives the same walk.
let state = (rngSeed >>> 0) || 1;
const rand = () => { state = (state + 0x6D2B79F5) >>> 0; let t = state; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (list) => list[Math.floor(rand() * list.length)];
const weighted = (table) => { const total = Object.values(table).reduce((a, b) => a + b, 0); let r = rand() * total; for (const [k, w] of Object.entries(table)) { r -= w; if (r < 0) return k; } return Object.keys(table)[0]; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// In the page: the controls a user can act on, each named by role, visible name and rank — never by a CSS class.
const PAGE = `
const seen = (el) => { if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
const nameOf = (el) => (el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].textContent) || (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) ? '' : el.innerText) || el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('name') || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 60);
const roleOf = (el) => { const t = el.tagName, y = (el.getAttribute('type') || '').toLowerCase(), r = el.getAttribute('role');
  if (t === 'SELECT') return 'select'; if (t === 'TEXTAREA' || el.isContentEditable) return 'field';
  if (t === 'INPUT') return /^(checkbox|radio)$/.test(y) ? 'choice' : /^(submit|button|reset|image|file|range|color)$/.test(y) ? 'button' : 'field';
  if (r === 'checkbox' || r === 'switch') return 'choice'; if (t === 'A' || r === 'link') return 'link'; return 'button'; };
const controls = () => { const count = new Map();
  return [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=switch], [contenteditable=true]')]
    .filter((el) => seen(el) && !el.disabled && el.getAttribute('aria-disabled') !== 'true')
    .map((el) => { const role = roleOf(el), name = nameOf(el), key = role + '|' + name, n = count.get(key) || 0; count.set(key, n + 1);
      return { el, role, name, n, type: (el.getAttribute('type') || '').toLowerCase(), external: el.tagName === 'A' && el.origin !== location.origin,
        exit: el.tagName === 'A' && el.origin === location.origin && el.pathname !== location.pathname }; }); };
`;
const LIST = `(() => { ${PAGE} return controls().map(({ el, ...c }) => c); })()`;
const find = (t) => `(() => { ${PAGE} const c = controls().find((c) => c.role === ${JSON.stringify(t.role)} && c.name === ${JSON.stringify(t.name)} && c.n === ${t.n}); if (!c) return null;
  c.el.scrollIntoView({ block: 'center', inline: 'center' }); const r = c.el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`;
const setValue = (t, value) => `(() => { ${PAGE} const c = controls().find((c) => c.role === ${JSON.stringify(t.role)} && c.name === ${JSON.stringify(t.name)} && c.n === ${t.n}); if (!c) return false; const el = c.el; el.focus();
  if (el.tagName === 'SELECT') { el.selectedIndex = Math.floor(${JSON.stringify(value)}.length % Math.max(1, el.options.length)); }
  else if (el.isContentEditable) { el.textContent = ${JSON.stringify(value)}; }
  else { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)}); }
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`;
const SNAPSHOT = `(() => { const d = document.documentElement, b = document.body; const text = b ? b.innerText.trim() : '';
  return { origin: location.origin, route: location.pathname + location.hash, text: text.length + ':' + text.slice(0, 4000), blank: !text && !document.querySelector('img, svg, canvas, video, input, button, a[href]'),
    overflow: d.scrollWidth > d.clientWidth + 1 ? d.scrollWidth : 0, busy: !!document.querySelector('[aria-busy=true], [role=progressbar]'), alert: [...document.querySelectorAll('[role=alert], [role=status], [aria-live], output')].map((e) => e.textContent.trim()).join(' ').slice(0, 80) }; })()`; // a message already on screen counts as feedback

const out = { tool: 'forge-chaos/1', url, angle, rng: rngSeed, width, seed: seedScript, before, avoid: avoid.source, actions: [], signals: [], stats: { done: 0, skipped: 0, dialogs: 0, leftOrigin: 0, backToArea: 0 } };
out.roam = roam;
if (recorded) out.replayOf = replayFile;
const fingerprint = (kind, route, message) => `${kind} · ${route.replace(/\d+/g, 'N')} · ${String(message).toLowerCase().replace(/https?:\/\/[^\s)'"]+/g, (u) => { try { return new URL(u).pathname; } catch { return u; } }).replace(/\d+/g, 'N').replace(/\s+/g, ' ').slice(0, 120)}`;
let fills = 0; let justFilled = false; let presses = 0; let step = -1; let route = '/'; let fault = 'none'; let tab; let shotCount = 0;
const pendingShots = [];
function signal(kind, message) {
  const fp = fingerprint(kind, route, message);
  const known = out.signals.find((s) => s.fingerprint === fp);
  if (known) { known.times += 1; return; }
  const s = { kind, level: HARD.has(kind) ? 'hard' : 'suspect', step, route, message: String(message).slice(0, 300), during: fault, fingerprint: fp, times: 1 };
  out.signals.push(s);
  if (shots && shotCount < 5) { shotCount += 1; pendingShots.push(s); }
}

const writes = new Map(); const methods = new Map(); let failedWrite = null;
const remoteText = (o) => (o.value !== undefined ? String(o.value) : (o.description ?? o.type)).split('\n')[0];
const onEvent = (m) => {
  const p = m.params;
  if (m.method === 'Runtime.exceptionThrown') signal('uncaught', (p.exceptionDetails.exception?.description ?? p.exceptionDetails.text).split('\n')[0]);
  else if (m.method === 'Runtime.consoleAPICalled' && p.type === 'error') signal('console-error', p.args.map(remoteText).join(' '));
  else if (m.method === 'Page.javascriptDialogOpening') {
    out.stats.dialogs += 1;
    if (String(p.message).includes(MARK)) signal('injected-script-ran', 'a value typed into a field was executed as script');
    tab.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
  } else if (m.method === 'Network.requestWillBeSent') {
    const r = p.request; methods.set(p.requestId, r.method);
    if (r.method !== 'GET' && r.method !== 'HEAD' && r.method !== 'OPTIONS') {
      const key = `${r.method} ${r.url} ${r.postData ?? ''}`; const now = Date.now(); const last = writes.get(key);
      if (last && last.step === step && now - last.at < 1500) signal('duplicate-request', `${r.method} ${new URL(r.url).pathname} sent twice by one action, ${now - last.at}ms apart, with the same body`);
      writes.set(key, { at: now, step });
    }
  } else if (m.method === 'Network.responseReceived') {
    const { status, url: u } = p.response; const method = methods.get(p.requestId) ?? 'GET';
    if (status >= 500) signal('server-error', `HTTP ${status} on ${method} ${new URL(u).pathname}`);
    if (status >= 400 && method !== 'GET') failedWrite = `${method} ${new URL(u).pathname} answered HTTP ${status}`;
  } else if (m.method === 'Network.loadingFailed' && !p.canceled) {
    const method = methods.get(p.requestId) ?? 'GET';
    if (method !== 'GET' || p.type === 'XHR' || p.type === 'Fetch') failedWrite = `${method} request failed (${p.errorText})`;
  }
};

tab = await openPage({ onEvent }).catch((e) => fail(e.message));
const { send, once } = tab;
const evaluate = async (expression) => { // a navigation in the middle of a call is normal here: try again on the new page
  for (let i = 0; i < 4; i += 1) { try { return await tab.evaluate(expression); } catch (e) { if (i === 3) return null; await sleep(300); } }
  return null;
};
const finish = (code = 0) => {
  if (recorded) {
    const now = new Set(out.signals.map((s) => s.fingerprint));
    const then = recorded.signals.filter((s) => s.step <= upto);
    out.reproduced = then.filter((s) => now.has(s.fingerprint)).map((s) => s.fingerprint);
    out.notReproduced = then.filter((s) => !now.has(s.fingerprint)).map((s) => s.fingerprint);
  }
  if (jsonOut) { mkdirSync(dirname(resolve(jsonOut)), { recursive: true }); writeFileSync(resolve(jsonOut), `${JSON.stringify(out, null, 2)}\n`); }
  for (const s of out.signals) console.log(`  ${s.level.padEnd(8)}${s.kind} @ step ${s.step} (${s.route}${s.during !== 'none' ? `, network ${s.during}` : ''}): ${s.message}${s.times > 1 ? ` ×${s.times}` : ''}`);
  if (recorded) console.log(`  replay: ${out.reproduced.length} reproduced, ${out.notReproduced.length} not reproduced${out.notReproduced.length ? ` (${out.notReproduced.join(' ; ')})` : ''}`);
  const hard = out.signals.filter((s) => s.level === 'hard').length;
  console.log(`chaos ${angle} rng ${rngSeed} @ ${out.width}px on ${url}: ${out.stats.done} actions, ${hard} hard, ${out.signals.length - hard} suspect${jsonOut ? ` → ${jsonOut}` : ''}`);
  try { tab.close(); } catch { /* closed */ }
  process.exit(code);
};
setTimeout(() => { out.stats.timedOut = true; finish(0); }, timeout);

const network = (mode) => send('Network.emulateNetworkConditions', mode === 'offline' ? { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }
  : mode === 'slow' ? { offline: false, latency: 900, downloadThroughput: 6000, uploadThroughput: 3000 } : { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
const click = async (point, times = 1) => {
  for (let i = 0; i < times; i += 1) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    if (times > 1) await sleep(40);
  }
};
const press = async (name, code) => {
  const shift = name === 'Shift+Tab'; const key = shift ? 'Tab' : name;
  const base = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers: shift ? 8 : 0, ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) };
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
};
const reload = async () => { const loaded = once('Page.loadEventFired', 8000); await send('Page.reload').catch(() => {}); await loaded; };

// Decide the next action from the page as it is now. Returns a record that --replay can run again.
async function decide() {
  let kind = weighted(ANGLES[angle]);
  let all = ((await evaluate(LIST)) ?? []).filter((c) => !c.external && !avoid.test(c.name));
  // Links to other pages are the way out of the area, and a menu repeats them on every screen: without this, a walk
  // spends its time in the navigation. One action in ten may take one; the rest stay on what this screen does.
  const inside = all.filter((c) => !c.exit);
  if (!roam && inside.length && rand() > 0.1) all = inside;
  // dirty-input: a hostile value that no button ever sends tests nothing. After each fill, a button is pressed, each in its turn.
  if (angle === 'dirty-input' && justFilled) {
    justFilled = false;
    const buttons = all.filter((c) => c.role === 'button');
    if (buttons.length) { const b = buttons[presses % buttons.length]; presses += 1; return { type: 'click', target: { role: b.role, name: b.name, n: b.n, type: b.type } }; }
  }
  const target = (roles) => { const list = all.filter((c) => roles.includes(c.role)); return list.length ? (({ role, name, n, type }) => ({ role, name, n, type }))(pick(list)) : null; };
  if (kind === 'key') { const table = Object.fromEntries(KEYS.map(([k, , w]) => [k, w])); const k = weighted(table); return { type: 'key', key: k, code: KEYS.find((x) => x[0] === k)[1] }; }
  if (kind === 'fill' || kind === 'fill-enter') {
    const t = target(['field', 'select']); if (!t) return { type: 'click', target: target(['button', 'link', 'choice']) };
    const set = HOSTILE[t.type] ?? (t.type === 'tel' || t.type === 'range' ? HOSTILE.number : /date|time|month|week/.test(t.type) ? HOSTILE.date : HOSTILE.text);
    fills += 1; justFilled = kind === 'fill'; return { type: kind, target: t, value: set[(fills + rngSeed) % set.length] }; // every hostile value in turn, not the luck of the draw
  }
  if (kind === 'click' || kind === 'multiclick' || kind === 'click-reload') return { type: kind, target: target(angle === 'dirty-input' ? ['button'] : ['button', 'link', 'choice', 'select']) ?? target(['button', 'link', 'choice', 'field', 'select']) };
  if (kind === 'resize') { const [w, h] = pick(SIZES); return { type: 'resize', width: w, height: h }; }
  if (kind === 'scroll') return { type: 'scroll', by: Math.round((rand() - 0.3) * 1200) };
  return { type: kind }; // back, forward, reload, offline, slow, online
}

async function run(action) {
  const t = action.target;
  if (['click', 'multiclick', 'click-reload', 'fill', 'fill-enter'].includes(action.type)) {
    if (!t) return false;
    if (action.type.startsWith('fill')) {
      if (!(await evaluate(setValue(t, action.value)))) return false;
      if (action.type === 'fill-enter') await press('Enter', 13);
      return true;
    }
    const point = await evaluate(find(t)); if (!point) return false;
    await click(point, action.type === 'multiclick' ? 3 : 1);
    if (action.type === 'click-reload') { await sleep(60); await reload(); }
    return true;
  }
  if (action.type === 'key') await press(action.key, action.code);
  else if (action.type === 'scroll') await evaluate(`window.scrollBy(0, ${action.by})`);
  else if (action.type === 'back') await evaluate('history.back()');
  else if (action.type === 'forward') await evaluate('history.forward()');
  else if (action.type === 'reload') await reload();
  else if (action.type === 'resize') { width = action.width; height = action.height; await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); }
  else if (['offline', 'slow', 'online'].includes(action.type)) { fault = action.type === 'online' ? 'none' : action.type; await network(action.type); }
  return true;
}

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  if (seedScript) await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { ${seedScript} } catch (e) { console.error(e); }` });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url }); await loaded; await sleep(500);
  if (before) { await evaluate(`(async () => { ${before} })()`); await sleep(400); }
  const start = await evaluate(SNAPSHOT);
  if (!start) fail(`could not read the page at ${url}`);
  const origin = start.origin; route = start.route;
  const overflowSeen = new Set(); const home = start.route.split('#')[0]; let outside = 0;

  const plan = recorded ? recorded.actions.filter((a) => a.i <= upto) : null;
  const total = plan ? plan.length : budget;
  for (let i = 0; i < total; i += 1) {
    step = i;
    const beforeAction = await evaluate(SNAPSHOT);
    if (beforeAction) route = beforeAction.route;
    const action = plan ? plan[i] : { i, ...(await decide()) };
    failedWrite = null;
    const done = await run(action).catch(() => false);
    out.actions.push(action);
    if (done) out.stats.done += 1; else out.stats.skipped += 1;
    await sleep(action.type === 'slow' || fault === 'slow' ? 1100 : ['back', 'forward', 'reload', 'click-reload'].includes(action.type) ? 600 : 300);

    let after = await evaluate(SNAPSHOT);
    if (!after || after.origin !== origin) { // left the app (an external link, an error page): come back and go on
      out.stats.leftOrigin += 1;
      if (fault !== 'none') { fault = 'none'; await network('online'); } // offline, a navigation lands on the browser's error page: restore the network to come back
      const back = once('Page.loadEventFired', 8000); await send('Page.navigate', { url }).catch(() => {}); await back; await sleep(400);
      after = await evaluate(SNAPSHOT);
      if (!after) continue;
    }
    outside = after.route.split('#')[0] === home ? 0 : outside + 1;
    if (!roam && outside > 3) { // the walk drifted into another area: other workers have it, come back to this one
      out.stats.backToArea += 1; outside = 0;
      const back = once('Page.loadEventFired', 8000); await send('Page.navigate', { url }).catch(() => {}); await back; await sleep(400);
      if (before) { await evaluate(`(async () => { ${before} })()`); await sleep(300); }
      after = (await evaluate(SNAPSHOT)) ?? after;
    }
    route = after.route;
    if (after.blank && fault === 'none') signal('blank-page', 'the page shows nothing after this action');
    if (after.overflow && !overflowSeen.has(`${route}|${width}`)) { overflowSeen.add(`${route}|${width}`); signal('sideways-scroll', `the page is ${after.overflow}px wide in a ${width}px viewport`); }
    if (failedWrite && beforeAction && after.text === beforeAction.text && !after.alert) signal('silent-failure', `${failedWrite} and the screen did not change: the user is told nothing`);
    if (!after.blank && !['key', 'scroll', 'resize', 'offline', 'slow', 'online'].includes(action.type)) {
      const left = ((await evaluate(LIST)) ?? []).length;
      if (left === 0) signal('dead-end', 'no link, button or field is left on the screen');
    }
    for (const s of pendingShots.splice(0)) {
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }).catch(() => null);
      if (shot) { mkdirSync(resolve(shots), { recursive: true }); s.shot = join(shots, `${angle}-${rngSeed}-step${s.step}-${s.kind}.jpg`); writeFileSync(resolve(s.shot), Buffer.from(shot.data, 'base64')); }
    }
  }
  if (fault !== 'none') { fault = 'none'; await network('online'); }
  step = total; await sleep(400);
  const end = await evaluate(SNAPSHOT);
  if (end?.busy) { await sleep(5000); if ((await evaluate(SNAPSHOT))?.busy) signal('stuck-busy', 'something is still marked as loading 5 seconds after the last action'); }
  finish(0);
} catch (error) {
  console.error(`run-chaos: ${error.message}`);
  try { tab.close(); } catch { /* closed */ }
  process.exit(2);
}
