#!/usr/bin/env node
/*
 * Forge detail sheets — every component of a screen, cropped close-up, grouped by type, at several widths.
 * The eye for detail is comparison: the select whose chevron touches its corner is obvious next to the
 * other selects; a card with 6px of padding is obvious next to the cards with 16px. This tool makes
 * those comparisons possible for an agent that looks at images. No dependency beyond chrome.mjs.
 *
 *   node forge/packs/visual-qa/tools/run-ui-detail.mjs --url http://localhost:4200/items --out evidence/detail/items \
 *        [--widths 360,768,1280,1920] [--before "<JavaScript to reach a state>"] [--seed "<JavaScript>"] [--per-type 8]
 *
 * Writes into --out:
 *   sheets/<type>.png    one contact sheet per component type (select, dropdown, field, button, icon-button, card,
 *                        badge, table, navigation, header, footer, dialog, message, choice), every instance at
 *                        every width, 2x, each labelled with width, name and measured box (radius, padding)
 *   sheets/_layout.png   the whole page at each width side by side, with guide lines: the content column's edges,
 *                        header / navigation / footer frames, the bottom of the first screen
 *   page-<width>.png     the whole page at that width, full resolution
 *   detail.json          the inventory: per width, each component with its box, radius, padding, font
 * Read the sheets one by one against forge/packs/core/skills/forge-ui-detail/anatomy.md.
 * Exit code: 0 = written, 2 = could not run.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPage } from './chrome.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const fail = (m) => { console.error(`run-ui-detail: ${m}`); process.exit(2); };
const url = opt('url');
const out = opt('out');
if (!url || !out) fail('--url and --out are required');
const widths = opt('widths', '360,768,1280,1920').split(',').map(Number).filter((w) => w >= 240);
const perType = Number(opt('per-type', 8));
const before = opt('before', '');
const seed = opt('seed', '');
const dir = resolve(out);
mkdirSync(join(dir, 'sheets'), { recursive: true });
const here = dirname(fileURLToPath(import.meta.url));
const probe = readFileSync(join(here, 'ui-probe.js'), 'utf8');
const height = (w) => (w < 600 ? 812 : w < 1024 ? 1024 : w < 1440 ? 800 : 1080);

let tab;
try { tab = await openPage(); } catch (e) { fail(e.message); }
const { send, once, evaluate } = tab;
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
if (seed) await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { ${seed} } catch (e) {}` });

const crops = []; // { type, width, name, info, data }
const layouts = []; // { width, data }
const inventory = {};
for (const w of widths) {
  const mobile = w < 1024;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: height(w), deviceScaleFactor: 2, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await new Promise((r) => setTimeout(r, 600));
  if (before) { await evaluate(`(async () => { ${before} })()`); await new Promise((r) => setTimeout(r, 400)); }
  const report = await evaluate(probe);
  inventory[w] = report.components;
  const page = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(dir, `page-${w}.png`), Buffer.from(page.data, 'base64'));
  // Layout view: the same page with guide lines — the content column's edges (magenta), the frame of
  // header, navigation and footer (cyan), the bottom of the first screen (orange). Misalignment,
  // a floating footer, content stranded away from the navigation: visible at a glance.
  await evaluate(`(() => {
    const vh = document.documentElement.clientHeight, H = document.documentElement.scrollHeight;
    const g = document.createElement('div'); g.id = '__forge_guides';
    g.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:' + H + 'px;pointer-events:none;z-index:2147483647';
    const line = (css) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;' + css; g.append(d); };
    const main = document.querySelector('main, [role=main]');
    if (main) {
      const kids = [...main.children].map((k) => k.getBoundingClientRect()).filter((r) => r.width > 0);
      const l = Math.min(...kids.map((r) => r.left)) + scrollX, r = Math.max(...kids.map((r) => r.right)) + scrollX;
      line('left:' + l + 'px;top:0;width:0;height:100%;border-left:2px solid #e0f');
      line('left:' + r + 'px;top:0;width:0;height:100%;border-left:2px solid #e0f');
    }
    for (const el of document.querySelectorAll('header, nav, footer, [role=banner], [role=navigation], [role=contentinfo]')) {
      const b = el.getBoundingClientRect(); if (!b.width) continue;
      line('left:' + (b.left + scrollX) + 'px;top:' + (b.top + scrollY) + 'px;width:' + b.width + 'px;height:' + b.height + 'px;outline:2px solid #0bd;outline-offset:-2px');
    }
    line('left:0;top:' + vh + 'px;width:100%;height:0;border-top:3px dashed #f80');
    document.body.append(g);
  })()`);
  const guided = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  layouts.push({ width: w, data: guided.data });
  await evaluate("document.getElementById('__forge_guides')?.remove()");
  const count = {};
  for (const c of report.components) {
    count[c.type] = (count[c.type] ?? 0) + 1;
    if (count[c.type] > perType) continue;
    const m = 12; // context around the component: its relation to neighbours is part of the detail
    const info = `${c.box.w}×${c.box.h} · radius ${c.radius} · padding ${c.padding.join('/')} · ${c.font}`;
    const h = Math.min(c.box.h + 2 * m, 700);
    const y = Math.max(0, c.box.y - m);
    // Detail lives at the edges: a wide component (footer, header, table) is shown as its two ends at 2x
    // rather than shrunk until nothing can be judged.
    const parts = c.box.w + 2 * m <= 440
      ? [{ x: Math.max(0, c.box.x - m), width: c.box.w + 2 * m, label: '' }]
      : [{ x: Math.max(0, c.box.x - m), width: 420, label: 'left end · ' }, { x: c.box.x + c.box.w + m - 420, width: 420, label: 'right end · ' }];
    for (const part of parts) {
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: part.x, y, width: part.width, height: h, scale: 1 }, captureBeyondViewport: true });
      crops.push({ type: c.type, width: w, name: `${part.label}${c.name}`, info, data: shot.data });
    }
  }
}

// One contact sheet per type: rendered as a page in the same browser, then captured.
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const types = [...new Set(crops.map((c) => c.type))];
const sheet = async (file, html) => {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await loaded;
  await new Promise((r) => setTimeout(r, 200));
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(join(dir, 'sheets', file), Buffer.from(shot.data, 'base64'));
};
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
for (const type of types) {
  const mine = crops.filter((c) => c.type === type);
  const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#e9e9e6;font:12px/1.4 system-ui,sans-serif;color:#222}
h1{font-size:16px;margin:0 0 12px}.w{margin:0 0 16px}.w>b{display:block;margin:0 0 6px;font-size:13px}
.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}
figure{margin:0;background:#fff;border:1px solid #c9c9c4;padding:6px;max-width:880px}
figure img{display:block;max-width:866px;height:auto;outline:1px dashed #f0a}
figcaption{margin-top:4px;color:#555;max-width:866px}</style>
<h1>${esc(type)} — ${mine.length} instance(s), close-up, dashed line = crop edge (12px of context around the component)</h1>
${widths.map((w) => {
    const at = mine.filter((c) => c.width === w);
    return at.length ? `<div class="w"><b>${w}px</b><div class="row">${at.map((c) => `<figure><img src="data:image/png;base64,${c.data}"><figcaption>${esc(c.name)}<br>${esc(c.info)}</figcaption></figure>`).join('')}</div></div>` : '';
  }).join('')}`;
  await sheet(`${type}.png`, html);
}
await sheet('_layout.png', `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#e9e9e6;font:12px/1.4 system-ui,sans-serif;color:#222}
h1{font-size:16px;margin:0 0 4px}p{margin:0 0 12px;color:#555}.row{display:flex;gap:16px;align-items:flex-start}
figure{margin:0;background:#fff;border:1px solid #c9c9c4;padding:6px}figcaption{font-weight:600;margin-bottom:4px}img{display:block;height:auto}</style>
<h1>Layout at each width</h1><p>magenta: edges of the content column · cyan: header, navigation, footer · orange dashes: bottom of the first screen</p>
<div class="row">${layouts.map((l) => `<figure><figcaption>${l.width}px</figcaption><img src="data:image/png;base64,${l.data}" style="width:${Math.round(l.width < 600 ? 300 : l.width < 1024 ? 330 : 380)}px"></figure>`).join('')}</div>`);
writeFileSync(join(dir, 'detail.json'), `${JSON.stringify({ url, widths, inventory }, null, 2)}\n`);
tab.close();
const summary = types.map((t) => `${t} ${crops.filter((c) => c.type === t).length}`).join(' · ');
console.log(`ui-detail ${widths.join(', ')}px: ${crops.length} close-ups — ${summary} → ${out}/sheets/`);
process.exit(0);
