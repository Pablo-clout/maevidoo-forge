#!/usr/bin/env node
/*
 * Forge responsive sweep — the UI probe at every width that matters, merged into one report.
 * No dependency: it runs run-ui-probe.mjs (next to this file) once per width.
 *
 *   node forge/packs/visual-qa/tools/run-ui-sweep.mjs --url http://localhost:4200/items \
 *        [--widths 360,390,768,1024,1280,1440,1920] [--between 80] \
 *        [--shots dir/] [--json report.json] [any run-ui-probe option: --before, --seed, --stable, --findable, --block …]
 *
 * --widths   the width matrix (the canon's breakpoints when it has them). Each width gets a full probe run and,
 *            with --shots, a full-page screenshot `<dir>/<width>.jpg`. Widths under 1024 run with mobile emulation
 *            (touch, viewport meta); heights follow the device class (812 phone · 1024 tablet · 800/900/1080 desktop).
 * --between  also probes widths in between, every <step> px, without screenshots: layouts often break just before
 *            a breakpoint (a 700px tablet nobody looked at). Those runs only keep findings of layout rules.
 * The merged report lists each finding once (same rule and same element) with the widths where it shows,
 * so "overflows from 600 to 767px" reads as one defect, not eight.
 * Exit code: 0 = ran, 2 = could not run.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const fail = (m) => { console.error(`run-ui-sweep: ${m}`); process.exit(2); };
if (!opt('url')) fail('--url is required');

const widths = opt('widths', '360,390,768,1024,1280,1440,1920').split(',').map(Number).filter((w) => w >= 240 && w <= 3840).sort((a, b) => a - b);
const step = Number(opt('between', 0));
const shots = opt('shots');
const jsonOut = opt('json');
const own = new Set(['--widths', '--between', '--shots', '--json', '--width', '--height', '--screenshot', '--mobile']);
const pass = [];
for (let i = 0; i < args.length; i += 1) {
  if (own.has(args[i])) { if (args[i] !== '--mobile') i += 1; continue; }
  pass.push(args[i]);
}
const LAYOUT = new Set(['page-overflow', 'element-overflow', 'text-clipped', 'squeezed-text', 'wrapped-label', 'nav-wraps',
  'table-on-phone', 'edge-hugging', 'stretched-field', 'stretched-control', 'long-lines', 'uneven-row', 'small-target']);

const between = [];
if (step > 0) {
  for (let i = 1; i < widths.length; i += 1) {
    for (let w = widths[i - 1] + step; w < widths[i]; w += step) between.push(w);
  }
}
const height = (w) => (w < 600 ? 812 : w < 1024 ? 1024 : w < 1440 ? 800 : w < 1920 ? 900 : 1080);
const runner = join(dirname(fileURLToPath(import.meta.url)), 'run-ui-probe.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'forge-sweep-'));
if (shots) mkdirSync(resolve(shots), { recursive: true });

const runs = [];
for (const w of [...widths, ...between].sort((a, b) => a - b)) {
  const main = widths.includes(w);
  const out = join(tmp, `${w}.json`);
  const cmd = [runner, ...pass, '--width', String(w), '--height', String(height(w)), '--json', out];
  if (w < 1024) cmd.push('--mobile');
  if (main && shots) cmd.push('--screenshot', join(resolve(shots), `${w}.jpg`));
  const proc = spawnSync(process.execPath, cmd, { encoding: 'utf8' });
  if (proc.status === 2) { rmSync(tmp, { recursive: true, force: true }); fail(`width ${w}: ${proc.stderr.trim().slice(0, 300)}`); }
  const report = JSON.parse(readFileSync(out, 'utf8'));
  runs.push({ width: w, main, report });
}
rmSync(tmp, { recursive: true, force: true });

const order = { High: 0, Medium: 1, Low: 2 };
const merged = new Map();
for (const { width, main, report } of runs) {
  for (const f of report.findings) {
    if (!main && !LAYOUT.has(f.rule)) continue;
    const key = `${f.rule}|${f.target}`;
    const m = merged.get(key) ?? { rule: f.rule, severity: f.severity, target: f.target, detail: f.detail, widths: [] };
    if (order[f.severity] < order[m.severity]) { m.severity = f.severity; m.detail = f.detail; }
    m.widths.push(width);
    merged.set(key, m);
  }
}
const range = (ws) => {
  const parts = []; let start = ws[0]; let prev = ws[0];
  const all = runs.map((r) => r.width);
  for (const w of ws.slice(1)) {
    if (all.indexOf(w) === all.indexOf(prev) + 1) { prev = w; continue; }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`); start = w; prev = w;
  }
  parts.push(start === prev ? `${start}` : `${start}–${prev}`);
  return parts.join(', ');
};
const findings = [...merged.values()].map((m) => ({ ...m, at: range(m.widths) }))
  .sort((a, b) => order[a.severity] - order[b.severity] || a.widths[0] - b.widths[0]);
const result = {
  sweep: 'forge-ui-sweep/1',
  url: opt('url'),
  widths: runs.map((r) => ({ width: r.width, full: r.main, overflow: !r.report.checks.pageOverflow.ok, findings: r.report.findings.length, load: r.report.load })),
  findings,
};
if (jsonOut) { mkdirSync(dirname(resolve(jsonOut)), { recursive: true }); writeFileSync(resolve(jsonOut), `${JSON.stringify(result, null, 2)}\n`); }
for (const f of findings) console.log(`  ${f.severity} ${f.rule} @ ${f.at} — ${f.target}: ${f.detail}`);
const count = (s) => findings.filter((f) => f.severity === s).length;
console.log(`ui-sweep ${runs.length} widths (${widths.join(', ')}${between.length ? ` + ${between.length} in between` : ''}): ${count('High')} High, ${count('Medium')} Medium, ${count('Low')} Low`
  + `${shots ? ` — screenshots in ${shots}` : ''}${jsonOut ? ` → ${jsonOut}` : ''}`);
