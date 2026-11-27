#!/usr/bin/env node
/*
 * Forge engine diff — the same UI probe in Chromium, WebKit and Firefox, and only what differs.
 * An addition beside the usual tools: run-ui-probe.mjs, run-ui-sweep.mjs and run-ui-detail.mjs are untouched
 * and keep using the system Chrome with no dependency. This one needs Playwright with the engines installed
 * (`npx playwright install webkit firefox`); without it, it says so and skips — it never fails a run.
 *
 *   node forge/packs/visual-qa/tools/run-engine-diff.mjs --url http://localhost:4200/items \
 *        [--engines webkit,firefox] [--widths 390,768,1280] [--before "<JavaScript to reach a state>"] \
 *        [--seed "<JavaScript run before the page's scripts>"] [--scale "4,8,16"] [--shots dir/] [--json report.json]
 *
 * For each width, the probe runs in Chromium (the reference, through Playwright too, so the comparison is fair)
 * and in each other engine. Reported per engine and width, only when it differs from Chromium:
 *   - sideways scroll in that engine only · errors thrown in that engine only
 *   - probe findings in that engine only
 *   - components that render at a different place or size (more than 6px), or exist in one engine only
 * With --shots, a full-page screenshot of both engines is kept for each width that differs.
 * Note: Playwright's WebKit is not Safari on an iPhone. It catches WebKit layout and CSS differences, not what
 * belongs to iOS itself (the keyboard, the address bar, zoom, sharing). A real phone is still needed for those.
 * Exit code: 0 = ran (read the differences), 2 = bad arguments or the page failed, 3 = skipped (no Playwright or no engine).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffReports } from './engine-diff-lib.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const fail = (m) => { console.error(`run-engine-diff: ${m}`); process.exit(2); };
const skip = (m) => { console.log(`engine-diff: skipped — ${m}`); process.exit(3); };

const url = opt('url');
if (!url) fail('--url is required');
const engines = opt('engines', 'webkit,firefox').split(',').map((e) => e.trim()).filter(Boolean);
const widths = opt('widths', '390,768,1280').split(',').map(Number).filter((w) => w >= 240);
const before = opt('before', '');
const seed = opt('seed', '');
const scale = opt('scale', '');
const shots = opt('shots');
const jsonOut = opt('json');
for (const e of engines) if (!['webkit', 'firefox', 'chromium'].includes(e)) fail(`unknown engine "${e}" (webkit, firefox, chromium)`);

// Playwright is looked for in the project (cwd) first, then next to this file, then on NODE_PATH.
let playwright = null;
for (const from of [join(process.cwd(), 'package.json'), import.meta.url]) {
  try { playwright = createRequire(from)('playwright'); break; } catch { /* try the next place */ }
}
if (!playwright) skip('Playwright is not installed in this project (npm i -D playwright && npx playwright install webkit firefox)');

const here = dirname(fileURLToPath(import.meta.url));
const probe = readFileSync(join(here, 'ui-probe.js'), 'utf8');
const height = (w) => (w < 600 ? 844 : w < 1024 ? 1024 : 800);
if (shots) mkdirSync(resolve(shots), { recursive: true });

async function measure(engine, width) {
  const browser = await playwright[engine].launch();
  try {
    const phone = width < 600;
    const context = await browser.newContext({
      viewport: { width, height: height(width) }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC',
      ...(phone && engine !== 'firefox' ? { isMobile: true, hasTouch: true } : {}), // Firefox has no mobile emulation
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(`uncaught: ${String(e.message).split('\n')[0]}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon/i.test(m.text())) pageErrors.push(`console.error: ${m.text().slice(0, 200)}`); });
    if (seed) await page.addInitScript(`try { ${seed} } catch (e) {}`);
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    if (before) { await page.evaluate(`(async () => { ${before} })()`); await page.waitForTimeout(400); }
    if (scale) await page.evaluate(`window.__forgeScale = ${JSON.stringify(scale.split(/[\s,·]+/).map(Number).filter((n) => n > 0))}`);
    const report = await page.evaluate(probe);
    report.pageErrors = pageErrors;
    const shot = shots ? await page.screenshot({ fullPage: true, type: 'jpeg', quality: 70 }) : null;
    return { report, shot, version: browser.version() };
  } finally {
    await browser.close();
  }
}

const result = { tool: 'forge-engine-diff/1', url, reference: 'chromium', widths, engines: {}, skipped: [], versions: {} };
const available = [];
for (const engine of engines) {
  if (engine === 'chromium') { available.push(engine); continue; }
  try { const b = await playwright[engine].launch(); result.versions[engine] = b.version(); await b.close(); available.push(engine); }
  catch (e) { result.skipped.push(`${engine}: not installed (npx playwright install ${engine})`); }
}
if (!available.length) skip(result.skipped.join('; '));

let total = 0;
for (const width of widths) {
  let ref;
  try { ref = await measure('chromium', width); } catch (e) { fail(`chromium at ${width}px: ${String(e.message).split('\n')[0]}`); }
  result.versions.chromium = ref.version;
  for (const engine of available) {
    let other;
    try { other = await measure(engine, width); } catch (e) { fail(`${engine} at ${width}px: ${String(e.message).split('\n')[0]}`); }
    const diff = diffReports(ref.report, other.report);
    (result.engines[engine] ??= {})[width] = diff;
    total += diff.count;
    if (!diff.same && shots) {
      writeFileSync(join(resolve(shots), `${width}-chromium.jpg`), ref.shot);
      writeFileSync(join(resolve(shots), `${width}-${engine}.jpg`), other.shot);
    }
    if (diff.same) continue;
    console.log(`  ${engine} @ ${width}px — ${diff.count} difference(s) from chromium`);
    if (diff.overflow) console.log(`    High  scrolls sideways here only: page ${diff.overflow.scrollWidth}px in a ${diff.overflow.viewport}px viewport`);
    for (const e of diff.pageErrors) console.log(`    High  error here only: ${e}`);
    for (const f of diff.onlyHere) console.log(`    ${f.severity.padEnd(6)}${f.rule} — ${f.target}: ${f.detail}`);
    for (const m of diff.moved) console.log(`    Low   renders differently — ${m.type} ${m.name}: ${m.reference.w}×${m.reference.h} at x ${m.reference.x} in chromium, ${m.here.w}×${m.here.h} at x ${m.here.x} here`);
    for (const m of diff.missing) console.log(`    Low   ${m.in} — ${m.type} ${m.name}`);
  }
}
if (jsonOut) { mkdirSync(dirname(resolve(jsonOut)), { recursive: true }); writeFileSync(resolve(jsonOut), `${JSON.stringify(result, null, 2)}\n`); }
for (const s of result.skipped) console.log(`  note: ${s}`);
console.log(`engine-diff ${available.join(', ')} vs chromium at ${widths.join(', ')}px: ${total} difference(s)${shots && total ? ` — screenshots in ${shots}` : ''}${jsonOut ? ` → ${jsonOut}` : ''}`);
process.exit(0);
