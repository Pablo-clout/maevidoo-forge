#!/usr/bin/env node
/*
 * Forge scenario player — plays one recorded scenario in the system Chrome, the way a person would:
 * open a page, click what is called "Lend", fill the field labelled "Member", check what is on screen.
 * It follows the app across pages (a sign-in, then the screens behind it) in one browser, so a session holds.
 * No dependency: Node built-ins and the DevTools protocol only. Nothing is installed in the project.
 *
 *   node forge/packs/visual-qa/tools/run-scenario.mjs --url http://localhost:3000 --script tests/regression/R-3.mjs
 *        [--width 1280] [--height 800] [--mobile] [--timeout 5000] [--screenshot-on-fail <file.png>]
 *
 * The script is a module with one default function. It receives `user`:
 *
 *   export default async (user) => {
 *     user.step('1. Open Loans and choose "Lend" → the form opens');
 *     await user.open('/staff/loans.html');
 *     await user.click('Lend');
 *     await user.see('New loan');
 *     user.step('2. Pick the item and the member, choose "Confirm" → the loan is in the list');
 *     await user.choose('Item', 'Tent 4 places');
 *     await user.fill('Member', 'Ada Lovelace');
 *     await user.click('Confirm');
 *     await user.see('Ada Lovelace');
 *     user.step('in the end: the item shows "on loan" in Gear');
 *     const item = await user.request('GET', '/api/items/12');
 *     user.expect(item.body.status === 'on loan', `the item is "${item.body.status}", not "on loan"`);
 *   };
 *
 *   user.open(path or url)            go to a page and wait for it; fails when the app does not answer
 *   user.click(name, { within, role, nth })   a button, link, tab, menu item, checkbox or radio, by the name a person
 *                                     reads on it or its accessible name. role: 'button' | 'link' when both exist.
 *                                     Two things with the same name and nothing to tell them apart → it fails and asks.
 *   user.fill(label, value, { within })   a text field, by its label, placeholder or accessible name
 *   user.choose(label, option, { within })   an option of a list, by the texts a person reads
 *   user.see(text, { within, exact }) / user.dontSee(text, { within })   visible text, waited for up to --timeout.
 *                                     exact: the whole text of one element, not a part of a sentence — use it for a
 *                                     status or a title ("Confirmed" is also inside "Reservation confirmed.").
 *   user.text(within)                 the text of the line, card or dialog that contains `within`
 *   user.read(/R-\d{5}/, { within })  the first match on screen (a number just created, to look for it elsewhere)
 *   user.count(text, { within })      how many visible elements carry that text
 *   user.request(method, path, body)  a call made from the page, with its session: { status, body }
 *   user.page(js)                     run JavaScript in the page and get its value (last resort)
 *   user.expect(condition, sentence)  fail with that sentence when the condition is false
 *   user.step(text)                   names the step under way: a failure says where it stopped
 *   user.wait(ms)
 *
 * Things are found by what a person reads (exact text first, then text that contains it), never by a class or an
 * id: a restyled screen does not break a scenario, a renamed button does. `within` narrows to the smallest line,
 * card, form or dialog that contains that text. While a dialog is open, everything is looked for inside it, as a
 * person would; a control hidden behind something else is not clicked. Typographic quotes and apostrophes read as
 * plain ones. Each run starts from an empty browser. Scripts are modules: shared steps (a sign-in) can live in a
 * helper file next to them and be imported.
 *
 * To write a scenario, look at a page first:
 *   node …/run-scenario.mjs --url <base> --describe /staff/loans.html [--script sign-in.mjs]
 * prints its headings, what can be clicked, its fields and its lines (after playing --script, to get past a sign-in).
 *
 * Exit code: 0 = the scenario passed · 1 = it failed (the step and what was expected are printed) · 2 = bad
 * arguments, no browser, or a script that cannot be loaded · 3 = the app does not answer (not a failed scenario).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openPage } from './chrome.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const flag = (name) => args.includes(`--${name}`);
const bad = (m) => { console.error(`run-scenario: ${m}`); process.exit(2); };

const base = opt('url');
const scriptFile = opt('script');
const describe = opt('describe');
if (!base || (!scriptFile && !describe)) bad('--url and --script are required (or --url and --describe <path>)');
if (scriptFile && !existsSync(resolve(scriptFile))) bad(`${scriptFile} not found`);
const timeout = Number(opt('timeout', 5000));
const width = Number(opt('width', flag('mobile') ? 375 : 1280));
const height = Number(opt('height', flag('mobile') ? 812 : 800));

let play = async () => {};
if (scriptFile) {
  try { play = (await import(pathToFileURL(resolve(scriptFile)).href)).default; } catch (error) { bad(`cannot load ${scriptFile}: ${error.message}`); }
  if (typeof play !== 'function') bad(`${scriptFile} must export one default function: export default async (user) => { … }`);
}

// Runs in the page. Finds what a person would call `name`.
const FINDERS = `
const __vis = (el) => { if (!el || !el.getClientRects().length) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) !== 0; };
const __norm = (t) => String(t ?? '').replace(/[\\u2018\\u2019\\u02BC]/g, "'").replace(/[\\u201C\\u201D]/g, '"').replace(/\\s+/g, ' ').trim().toLowerCase();
const __names = (el) => [...new Set([el.getAttribute('aria-label'), el.tagName === 'INPUT' && /^(submit|button|reset)$/.test(el.type) ? el.value : '', el.innerText || el.textContent, el.getAttribute('title'), el.getAttribute('alt')].map(__norm).filter(Boolean))];
const __dialog = () => [...document.querySelectorAll('dialog[open], [role=dialog], [role=alertdialog], [aria-modal=true]')].filter(__vis).pop() ?? null;
// every box that contains the "within" text, smallest first, then the whole page (or the open dialog): an action takes the first box where its target is
const __scopes = (within) => { const base = __dialog() ?? document.body; if (!within) return [base]; const w = __norm(within); const boxes = [...base.querySelectorAll('tr, li, article, section, form, fieldset, dialog, [role=row], [role=listitem], [role=dialog], [role=group], .card, dl')].filter((el) => __vis(el) && __norm(el.innerText).includes(w)).sort((a, b) => a.innerText.length - b.innerText.length); return __norm(base.innerText).includes(w) ? [...boxes, base] : boxes; };
const __first = (within, find) => { const roots = __scopes(within); for (const root of roots) { const r = find(root); if (r && (r.length === undefined || r.length)) return { root, hit: r }; } return { root: roots[0] ?? null, hit: null }; };
const __scope = (within) => __scopes(within)[0] ?? null;
const __pick = (list, name) => { const n = __norm(name); const exact = list.filter((x) => x.names.includes(n)); return exact.length ? exact : list.filter((x) => x.names.some((y) => y.includes(n))); };
const __roleOf = (el) => (el.getAttribute('role') || (el.tagName === 'A' ? 'link' : /^(BUTTON|SUMMARY)$/.test(el.tagName) || (el.tagName === 'INPUT' && /^(submit|button|reset)$/.test(el.type)) ? 'button' : el.tagName === 'INPUT' ? el.type : el.tagName.toLowerCase()));
const __clickables = (root) => [...root.querySelectorAll('button, a[href], [role=button], [role=link], [role=tab], [role=menuitem], [role=option], [role=checkbox], [role=radio], [role=switch], input[type=submit], input[type=button], input[type=reset], input[type=checkbox], input[type=radio], summary, label')].filter(__vis).map((el) => ({ el, role: __roleOf(el), names: el.matches('input[type=checkbox], input[type=radio]') ? [__norm(el.getAttribute('aria-label') || el.labels?.[0]?.innerText || el.value)] : __names(el) })).map((x) => ({ ...x, name: x.names[0] ?? '' }));
const __covered = (el) => { const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!top && top !== el && !el.contains(top) && !top.contains(el) && !(el.labels && [...el.labels].some((l) => l.contains(top))); };
const __fields = (root) => [...root.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable=true], [role=textbox], [role=combobox]')].filter(__vis).map((el) => { const all = [el.getAttribute('aria-label'), ...[...(el.labels ?? [])].map((l) => l.innerText), el.getAttribute('aria-labelledby')?.split(' ').map((id) => document.getElementById(id)?.innerText).join(' '), el.getAttribute('placeholder'), el.getAttribute('name'), el.id].map(__norm).filter(Boolean); return { el, names: all, name: all[0] ?? '' }; });
const __field = (root, label) => __pick(__fields(root), label);
const __texts = (root, text, exact) => { const n = __norm(text); const out = []; const walk = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT); for (let el = walk.currentNode; el; el = walk.nextNode()) { if (!__vis(el) || /^(OPTION|OPTGROUP|SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName)) continue; const own = el.tagName === 'SELECT' ? '' : __norm([...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join(' ')); const val = el.matches('input, textarea') ? __norm(el.value) : el.tagName === 'SELECT' ? __norm(el.selectedOptions[0]?.textContent) : ''; const whole = __norm(el.innerText); if (exact ? (own === n || val === n || (whole === n && !own)) : ((own && own.includes(n)) || (val && val.includes(n)) || (!el.children.length && el.tagName !== 'SELECT' && whole.includes(n)))) out.push(el); } if (!exact && !out.length) { const hit = [...root.querySelectorAll('p, li, td, th, dd, dt, h1, h2, h3, h4, label, a, button, span, div, [role=status], [role=alert]')].filter((el) => __vis(el) && !el.querySelector('select') && __norm(el.innerText).includes(n)).sort((a, b) => a.innerText.length - b.innerText.length)[0]; if (hit) out.push(hit); } return out; };
`;

let currentStep = '(before the first step)';
const fail = (message) => { const e = new Error(message); e.scenario = true; throw e; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tab = await openPage().catch((error) => bad(error.message));
const { send, evaluate } = tab;

// A page that is navigating has no context for a moment: try again until it has one.
async function inPage(body, { tries = 40 } = {}) {
  for (let i = 0; ; i += 1) {
    try { return await evaluate(`(async () => { ${FINDERS}\n${body} })()`); } catch (error) {
      if (i < tries && /context|navigat|Cannot find|destroyed|closed|Target/i.test(error.message)) { await sleep(150); continue; }
      throw error;
    }
  }
}
async function settle() {
  await sleep(120);
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { if (await inPage(`return document.readyState === 'complete';`).catch(() => false)) break; await sleep(100); }
  await sleep(180);
}
async function until(body, what) {
  const deadline = Date.now() + timeout;
  for (;;) { const r = await inPage(body); if (r?.ok) return r; if (Date.now() > deadline) fail(r?.why ?? what); await sleep(150); }
}
const q = (v) => JSON.stringify(v);

const noScope = (within) => q(`nothing on screen contains "${within}"`);
const user = {
  step(text) { currentStep = String(text); },
  wait: sleep,
  expect(condition, sentence) { if (!condition) fail(sentence ?? 'an expected condition is false'); },
  async open(path) {
    const url = new URL(path, base).href;
    const r = await send('Page.navigate', { url });
    if (r?.errorText) { const e = new Error(`the app does not answer at ${url} (${r.errorText})`); e.unreachable = true; throw e; }
    await settle();
  },
  async click(name, { nth, within, role } = {}) {
    await until(`const find = (r) => __pick(__clickables(r).filter((x) => !${q(role ?? null)} || x.role === ${q(role ?? null)}), ${q(name)}).filter((x, i, a) => !a.some((y) => y !== x && x.el.contains(y.el)));
      const found = __first(${q(within ?? null)}, find); const root = found.root; if (!root) return { why: ${noScope(within)} };
      const all = __clickables(root); let hit = found.hit ?? [];
      const seen = all.map((x) => x.name).filter(Boolean).slice(0, 14).join(' · ');
      if (!hit.length) return { why: ${q(`nothing to click called "${name}"${within ? ` in "${within}"` : ''}${role ? ` (${role})` : ''}`)} + ' — on screen: ' + seen };
      const want = ${nth ?? 0};
      if (!want && hit.length > 1) { const free = hit.filter((x) => !__covered(x.el)); if (free.length === 1) hit = free; else return { why: hit.length + ${q(` things are called "${name}" (`)} + hit.map((x) => x.role).join(', ') + '): say which with { within }, { role } or { nth }' }; }
      if (want > hit.length) return { why: 'only ' + hit.length + ${q(` thing(s) called "${name}", wanted number ${nth}`)} };
      const el = hit[(want || 1) - 1].el; if (el.disabled || el.getAttribute('aria-disabled') === 'true') return { why: ${q(`"${name}" is there but disabled`)} };
      el.scrollIntoView({ block: 'center' }); if (__covered(el)) return { why: ${q(`"${name}" is covered by something else on screen (a dialog, an overlay): a person could not click it`)} };
      el.click(); return { ok: true };`, `nothing to click called "${name}"`);
    await settle();
  },
  async fill(label, value, { within } = {}) {
    await until(`const found = __first(${q(within ?? null)}, (r) => __field(r, ${q(label)})); const root = found.root; if (!root) return { why: ${noScope(within)} };
      const hit = found.hit ?? []; if (!hit.length) return { why: ${q(`no field called "${label}"`)} + ' — fields on screen: ' + __fields(root).map((x) => x.name).filter(Boolean).slice(0, 14).join(' · ') };
      const el = hit[0].el; if (el.disabled || el.readOnly) return { why: ${q(`the field "${label}" cannot be typed in`)} };
      el.scrollIntoView({ block: 'center' }); el.focus();
      if (el.isContentEditable) { el.textContent = ${q(String(value))}; }
      else { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${q(String(value))}); }
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return { ok: true };`, `no field called "${label}"`);
    await sleep(80);
  },
  async choose(label, option, { within } = {}) {
    await until(`const found = __first(${q(within ?? null)}, (r) => __field(r, ${q(label)}).filter((x) => x.el.tagName === 'SELECT')); const root = found.root; if (!root) return { why: ${noScope(within)} };
      const hit = found.hit ?? []; if (!hit.length) return { why: ${q(`no list called "${label}"`)} };
      const el = hit[0].el; const opts = [...el.options].map((o) => ({ el: o, names: [__norm(o.textContent)] })); const o = __pick(opts, ${q(option)});
      if (!o.length) return { why: ${q(`the list "${label}" has no option "${option}"`)} + ' — it offers: ' + opts.map((x) => x.names[0]).slice(0, 14).join(' · ') };
      el.value = o[0].el.value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return { ok: true };`, `no list called "${label}"`);
    await sleep(80);
  },
  async see(text, { within, exact = false } = {}) {
    await until(`const root = __scope(${q(within ?? null)}); if (!root) return { why: ${noScope(within)} };
      return __texts(root, ${q(text)}, ${exact}).length ? { ok: true } : { why: ${q(`expected to see "${text}"${exact ? ' (as a whole text)' : ''}${within ? ` in "${within}"` : ''} — it is not on screen`)} };`, '');
  },
  async dontSee(text, { within, exact = false } = {}) {
    await sleep(300);
    const n = await inPage(`const root = __scope(${q(within ?? null)}); return root ? __texts(root, ${q(text)}, ${exact}).length : 0;`);
    if (n) fail(`"${text}" is on screen${within ? ` in "${within}"` : ''} and should not be`);
  },
  async count(text, { within, exact = false } = {}) { return inPage(`const root = __scope(${q(within ?? null)}); return root ? __texts(root, ${q(text)}, ${exact}).length : 0;`); },
  async text(within) { const r = await until(`const root = __scope(${q(within ?? null)}); return root ? { ok: true, text: root.innerText.replace(/\\s+/g, ' ').trim() } : { why: ${noScope(within)} };`, ''); return r.text; },
  async read(pattern, { within } = {}) {
    if (!(pattern instanceof RegExp)) fail('user.read takes a regular expression, e.g. /R-\\d{5}/');
    const r = await until(`const root = __scope(${q(within ?? null)}); if (!root) return { why: ${noScope(within)} };
      const m = root.innerText.match(new RegExp(${q(pattern.source)}, ${q(pattern.flags.replace('g', ''))})); return m ? { ok: true, value: m[1] ?? m[0] } : { why: ${q(`nothing on screen${within ? ` in "${within}"` : ''} looks like ${pattern}`)} };`, '');
    return r.value;
  },
  async page(js) { return inPage(js); },
  async request(method, path, body) {
    return inPage(`const r = await fetch(${q(new URL(path, base).href)}, { method: ${q(method)}, credentials: 'include', headers: ${body === undefined ? '{}' : `{ 'content-type': 'application/json' }`}, body: ${body === undefined ? 'undefined' : q(JSON.stringify(body))} });
      const t = await r.text(); let b = t; try { b = JSON.parse(t); } catch { /* not JSON */ } return { status: r.status, body: b };`);
  },
};

async function describePage() {
  const d = await inPage(`const root = __dialog() ?? document.body; const line = (t) => t.replace(/\\s+/g, ' ').trim().slice(0, 140);
    return { where: location.pathname + location.search, title: document.title, dialog: !!__dialog(),
      headings: [...root.querySelectorAll('h1, h2, h3, [role=heading]')].filter(__vis).map((h) => h.tagName.toLowerCase() + ': ' + line(h.innerText)),
      click: __clickables(root).filter((x) => x.el.tagName !== 'LABEL').map((x) => x.role + ': ' + (x.el.innerText ? line(x.el.innerText) : x.name) + (x.names.length > 1 && x.el.getAttribute('aria-label') ? '  (also: ' + x.el.getAttribute('aria-label') + ')' : '') + (x.el.disabled ? '  [disabled]' : '')),
      fields: __fields(root).map((x) => x.el.tagName.toLowerCase() + (x.el.type && x.el.tagName === 'INPUT' ? '[' + x.el.type + ']' : '') + ': ' + (x.names[0] ?? '(no name)') + (x.el.tagName === 'SELECT' ? '  {' + [...x.el.options].map((o) => line(o.textContent)).slice(0, 8).join(' | ') + '}' : '')),
      lines: [...root.querySelectorAll('tr, li, [role=row], [role=listitem], .card, p, dd, [role=status], [role=alert]')].filter((el) => __vis(el) && el.innerText.trim()).map((el) => line(el.innerText)).filter((t, i, a) => a.indexOf(t) === i).slice(0, 40) };`);
  console.log(`page: ${d.where} — "${d.title}"${d.dialog ? ' — a dialog is open: only its content is listed' : ''}`);
  for (const [label, list] of [['headings', d.headings], ['can be clicked', d.click], ['fields', d.fields], ['lines', d.lines]]) { console.log(`${label}:`); for (const x of list) console.log(`  ${x}`); if (!list.length) console.log('  (none)'); }
}

let code = 0;
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: flag('mobile') });
  const started = Date.now();
  await play(user);
  if (describe) { if (describe !== '.') await user.open(describe); await describePage(); }
  else console.log(`scenario passed (${Math.round((Date.now() - started) / 100) / 10} s) — ${scriptFile}`);
} catch (error) {
  code = error.unreachable ? 3 : 1;
  const shot = opt('screenshot-on-fail');
  if (shot) {
    try { const { data } = await send('Page.captureScreenshot', { format: 'png' }); mkdirSync(dirname(resolve(shot)), { recursive: true }); writeFileSync(resolve(shot), Buffer.from(data, 'base64')); } catch { /* no capture */ }
  }
  const where = await inPage('return location.pathname + location.search;').catch(() => '?');
  console.log(error.unreachable ? `scenario NOT PLAYED — ${error.message}` : `scenario FAILED — ${scriptFile ?? describe}`);
  console.log(`  at: ${currentStep}`);
  console.log(`  ${error.scenario ? error.message : `the script itself broke: ${String(error.message).split('\n')[0]}`}`);
  console.log(`  page: ${where}${shot ? ` · capture: ${shot}` : ''}`);
}
tab.close();
process.exit(code);
