#!/usr/bin/env node
/*
 * Forge UI probe runner — screenshot + ui-probe.js in one command, with the system Chrome.
 * No dependency: Node built-ins and the DevTools protocol only. Nothing is installed in the project.
 *
 *   node forge/packs/visual-qa/tools/run-ui-probe.mjs --url http://localhost:4200/ \
 *        [--width 1280] [--height 800] [--mobile] \
 *        [--seed "<JavaScript run before the page's own scripts, on every load>"] \
 *        [--before "<JavaScript run in the loaded page to reach the state to judge>"] [--reload] \
 *        [--block "<part of a URL>[=<status>]"] [--hover "<css selector>"] \
 *        [--stable] [--screenshot path/to/shot.png|.jpg] [--clip "<css selector>"] [--json path/to/report.json]
 *
 * Every run starts a fresh browser with an empty profile: nothing carries over between runs.
 *   --before-file <path>  the same as --before, read from a file (a recorded scenario). A script that throws
 *             makes the run exit 2: that is how a regression scenario says it failed.
 *   --seed    prepares storage before the app starts, e.g. "localStorage.setItem('k', '[…]')".
 *   --before  may be async (it is awaited): click, fill, submit. Do NOT navigate or reload in it —
 *             use --reload, which reloads after --before and waits (to check that state persists).
 *             A value it returns (`return document.querySelectorAll('li').length`) is reported.
 *   --block   from the moment the page has loaded, requests whose URL contains that text fail as if
 *             the server were unreachable — or answer that HTTP status with "=500", "=404"…
 *             (what does the user see when a save cannot reach the server?).
 *             Add --block-at-load to fail them from the very first request instead
 *             (what does the user see when the server is down when the app opens?).
 *   --screenshot  a .jpg / .jpeg path is saved as JPEG (smaller, for reports); anything else as PNG.
 *             Without --clip the whole page is captured. A bare filename (no directory, e.g. `shot.png`)
 *             is written under `<os.tmpdir()>/forge-ui-probe/` so scratch captures never dirty the repo;
 *             pass an explicit directory (e.g. `evidence/desktop.png` or `/tmp/shot.png`) to place it there.
 *   --clip    captures only the element matching the selector, with 24px of context around it —
 *             the before/after pair of a defect in a report.
 *   --color-scheme light|dark  emulates the system theme (judge both when the app has two).
 *   --hover   moves the mouse over an element before the screenshot (hover styles).
 *   --findable "Lend|New item"  checks that each named action can be found: a visible button, link or
 *             menu item whose text or accessible name contains it, on the first screen. Reported as
 *             `findable` (visible · below the fold · hidden (exists but not visible, e.g. in a closed menu) ·
 *             absent) and as a `not-findable` finding when it is not on the first screen.
 *   --scale "4,8,12,16,24,32,48"  the project's spacing scale (from docs/ui-canon.md or its design document):
 *             spacing values off that scale (±1px) are reported as `off-scale-spacing`. Without it nothing is
 *             imposed: no grid is assumed.
 *   --stable  makes two runs comparable: reduced motion, light colour scheme unless --color-scheme says otherwise, en-US, UTC, and a longer
 *             settle time; the report records the browser version. Use it for sweeps that compare runs.
 * The probe then runs in a page that has focus (focus emulation), so focus rules are judged for real.
 * Besides the measurements, the report says what the page did: `pageErrors` (uncaught exceptions,
 * unhandled rejections, console.error) and `focus` (the element holding the focus at the end).
 * With --json the full report goes to that file (bare filenames also go under `<os.tmpdir()>/forge-ui-probe/`)
 * and stdout gets a short summary; without it, stdout is the full JSON.
 * Chrome is found automatically; set CHROME_PATH to override.
 * Exit code: 0 = ran (read the findings), 2 = could not run (nothing is written).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPage } from './chrome.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);
const fail = (message) => { console.error(`run-ui-probe: ${message}`); process.exit(2); };
// Bare filenames (e.g. "probe.png") go to the OS temp folder so scratch runs never leave files in a repo root.
const resolveOut = (raw) => {
  if (!raw) return undefined;
  return /[\\/]/.test(raw) ? raw : join(tmpdir(), 'forge-ui-probe', raw);
};

const url = opt('url');
if (!url) fail('--url is required');
const width = Number(opt('width', flag('mobile') ? 375 : 1280));
const height = Number(opt('height', flag('mobile') ? 812 : 800));
const beforeFile = opt('before-file', '');
if (beforeFile && !existsSync(resolve(beforeFile))) fail(`--before-file: ${beforeFile} not found`);
const before = beforeFile ? readFileSync(resolve(beforeFile), 'utf8') : opt('before', '');
const seed = opt('seed', '');
const hover = opt('hover', '');
const findable = opt('findable', '');
const clip = opt('clip', '');
const block = opt('block', '');
const blockStatus = Number(block.match(/=(\d{3})$/)?.[1] ?? 0);
const blockPart = block.replace(/=\d{3}$/, '');
const screenshot = resolveOut(opt('screenshot'));
const jsonOut = resolveOut(opt('json'));

const probeSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ui-probe.js'), 'utf8');

let documentStatus = null;
const pageErrors = [];
let blockedRequests = 0;
const remoteText = (o) => (o.value !== undefined ? String(o.value) : (o.description ?? o.type)).split('\n')[0];
let tab;
const onEvent = (message) => {
  if (message.method === 'Network.responseReceived' && message.params.type === 'Document') {
    documentStatus = message.params.response.status;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    const d = message.params.exceptionDetails;
    pageErrors.push(`uncaught: ${(d.exception?.description ?? d.text).split('\n')[0]}`);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    pageErrors.push(`console.error: ${message.params.args.map(remoteText).join(' ')}`.slice(0, 300));
  }
  if (message.method === 'Fetch.requestPaused') {
    blockedRequests += 1;
    const { requestId } = message.params;
    if (blockStatus) {
      tab.send('Fetch.fulfillRequest', {
        requestId, responseCode: blockStatus,
        responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }],
        body: Buffer.from('{}').toString('base64'),
      }).catch(() => {});
    } else {
      tab.send('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' }).catch(() => {});
    }
  }
};
tab = await openPage({ onEvent }).catch((error) => fail(error.message));
const { send, once, evaluate } = tab;
const socket = { close: tab.close };

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const scheme = opt('color-scheme', flag('stable') ? 'light' : '');
  const media = [];
  if (scheme) media.push({ name: 'prefers-color-scheme', value: scheme });
  if (flag('stable')) media.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  if (media.length) await send('Emulation.setEmulatedMedia', { features: media });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: flag('mobile') });
  if (flag('stable')) {
    await send('Emulation.setTimezoneOverride', { timezoneId: 'UTC' });
    await send('Emulation.setLocaleOverride', { locale: 'en-US' });
  }
  if (seed) await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { ${seed} } catch (e) { console.error(e); }` });
  const blockAtLoad = blockPart && flag('block-at-load');
  if (blockAtLoad) await send('Fetch.enable', { patterns: [{ urlPattern: `*${blockPart}*` }] });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await new Promise((r) => setTimeout(r, flag('stable') ? 800 : 300));

  if (blockPart && !blockAtLoad) await send('Fetch.enable', { patterns: [{ urlPattern: `*${blockPart}*` }] });

  let beforeResult;
  if (before) {
    try {
      beforeResult = await evaluate(`(async () => { ${before} })()`);
    } catch (error) {
      if (/navigated or closed|context was destroyed/i.test(error.message)) {
        throw new Error('--before navigated or reloaded the page. Keep --before to clicks and typing; use --reload to reload after it, or --seed to prepare storage before the app starts.');
      }
      throw error;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  // The errors up to here belong to the scripted flow; the probe's own evaluation comes later.

  if (flag('reload')) {
    const reloaded = once('Page.loadEventFired');
    await send('Page.reload');
    await reloaded;
    await new Promise((r) => setTimeout(r, 300));
  }

  if (hover) {
    const box = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(hover)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (!box) throw new Error(`--hover: no element matches ${hover}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
    await new Promise((r) => setTimeout(r, 200));
  }

  if (screenshot) {
    const jpeg = /\.jpe?g$/i.test(screenshot);
    const params = jpeg ? { format: 'jpeg', quality: 72 } : { format: 'png' };
    if (clip) {
      const box = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(clip)}); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); const pad = 24; const x = Math.max(0, r.left + scrollX - pad), y = Math.max(0, r.top + scrollY - pad); return { x, y, width: Math.min(document.documentElement.scrollWidth - x, r.width + 2 * pad), height: Math.min(document.documentElement.scrollHeight - y, r.height + 2 * pad), scale: 1 }; })()`);
      if (!box) throw new Error(`--clip: no element matches ${clip}`);
      Object.assign(params, { clip: box, captureBeyondViewport: true });
    } else {
      params.captureBeyondViewport = true;
    }
    const shot = await send('Page.captureScreenshot', params);
    mkdirSync(dirname(resolve(screenshot)), { recursive: true });
    writeFileSync(resolve(screenshot), Buffer.from(shot.data, 'base64'));
  }

  const focus = await evaluate(`(() => { const el = document.activeElement; if (!el || el === document.body || el === document.documentElement) return 'nothing (the page body)'; const name = el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].textContent) || el.textContent || el.getAttribute('name') || ''; return (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (name.trim() ? ' "' + name.trim().replace(/\\s+/g, ' ').slice(0, 40) + '"' : '')); })()`);
  const scale = opt('scale', '');
  if (scale) await evaluate(`window.__forgeScale = ${JSON.stringify(scale.split(/[\s,·]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0))}`);
  const report = await evaluate(probeSource);
  report.focus = focus;
  if (findable) {
    const names = findable.split('|').map((x) => x.trim()).filter(Boolean);
    report.findable = await evaluate(`(() => {
      const names = ${JSON.stringify(names)};
      const vh = document.documentElement.clientHeight;
      const seen = (el) => { if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0; };
      const nameOf = (el) => (el.getAttribute('aria-label') || el.innerText || el.textContent || el.value || el.getAttribute('title') || '').trim().toLowerCase();
      const all = [...document.querySelectorAll('a, button, [role=button], [role=menuitem], input[type=submit], summary')];
      return names.map((n) => {
        const hits = all.filter((el) => nameOf(el).includes(n.toLowerCase()));
        const shown = hits.filter(seen);
        if (!hits.length) return { name: n, status: 'absent' };
        if (!shown.length) return { name: n, status: 'hidden' };
        const top = Math.min(...shown.map((el) => el.getBoundingClientRect().top + scrollY));
        return { name: n, status: top < vh ? 'visible' : 'below the fold', top: Math.round(top) };
      });
    })()`);
    for (const f of report.findable) {
      if (f.status === 'visible') continue;
      report.findings.push({ rule: 'not-findable', principle: 'findability', severity: f.status === 'below the fold' ? 'Low' : 'Medium', target: `action "${f.name}"`,
        detail: f.status === 'absent' ? 'no visible button, link or menu item names it on this screen' : f.status === 'hidden' ? 'it exists but is hidden (in a closed menu or collapsed): the user has to know where to look' : `first visible ${f.top}px down, below the first screen` });
    }
  }
  if (flag('stable')) report.stable = { browser: (await send('Browser.getVersion').catch(() => ({ product: 'unknown' }))).product, motion: 'reduce', scheme, locale: 'en-US', timezone: 'UTC' };
  report.pageErrors = pageErrors.slice(0, 20);
  if (blockPart) {
    report.blocked = { urlContains: blockPart, as: blockStatus ? `HTTP ${blockStatus}` : 'unreachable', requests: blockedRequests };
    if (!blockedRequests) report.notes.push(`--block "${blockPart}" matched no request: the flow never called it, so the failure was not exercised`);
  }
  if (screenshot) report.screenshot = screenshot;
  // A value returned by --before (e.g. `return document.querySelectorAll('li').length`) is kept as a measurement.
  if (beforeResult !== undefined && beforeResult !== null) report.beforeResult = beforeResult;
  if (documentStatus !== null && documentStatus >= 400) {
    report.notes.unshift(`the page answered HTTP ${documentStatus}: this is an error page, not the screen you meant to judge`);
  }
  const text = JSON.stringify(report, null, 2);
  if (jsonOut) {
    mkdirSync(dirname(resolve(jsonOut)), { recursive: true });
    writeFileSync(resolve(jsonOut), `${text}\n`);
    const count = (s) => report.findings.filter((f) => f.severity === s).length;
    // Details first, the one-line summary LAST — so `tail -1` gives the line to keep.
    for (const f of report.findings) console.log(`  ${f.severity} ${f.rule} — ${f.target}: ${f.detail}`);
    for (const n of report.notes) console.log(`  note: ${n}`);
    for (const e of report.pageErrors) console.log(`  PAGE ERROR ${e}`);
    if (report.blocked) console.log(`  blocked: ${report.blocked.requests} request(s) containing "${report.blocked.urlContains}" answered as ${report.blocked.as}`);
    if (report.beforeResult !== undefined) console.log(`  --before returned: ${JSON.stringify(report.beforeResult)}`);
    console.log(`ui-probe ${report.viewport.width}x${report.viewport.height}: ${count('High')} High, ${count('Medium')} Medium, ${count('Low')} Low`
      + ` — overflow ${report.checks.pageOverflow.ok ? 'none' : 'YES'} (${report.checks.pageOverflow.scrollWidth}px in ${report.checks.pageOverflow.viewport}px),`
      + ` ${report.checks.controls} controls, focus ${report.checks.focusJudged ? 'judged' : 'NOT judged'}, focus on ${report.focus},`
      + ` ${report.pageErrors.length} page error(s)${report.notes.length ? `, ${report.notes.length} note(s)` : ''} → ${jsonOut}`);
  } else {
    console.log(text);
  }
  socket.close();
  process.exit(0);
} catch (error) {
  fail(error.message);
}
