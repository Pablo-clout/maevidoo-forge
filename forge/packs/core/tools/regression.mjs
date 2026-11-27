#!/usr/bin/env node
/*
 * Forge regression pack — reads docs/regression.md (the scenarios, written for a human) and runs the script
 * recorded for each one. The scenario text is the truth; a script is only its recording.
 * No dependency: Node built-ins only.
 *
 *   node forge/packs/core/tools/regression.mjs status [--json]
 *        every scenario and the state of its script: recorded · not recorded · changed since recorded · by hand
 *        (and the scripts whose scenario is gone)
 *   node forge/packs/core/tools/regression.mjs record --id R-3 --run "<command that exits 0 when the scenario passes>" [--verify]
 *        stores the command with the scenario's text as it is now. --verify plays it first and refuses a command
 *        that does not pass. Write `{url}` where the app's address goes: it is filled in at run time, so the
 *        recording is not tied to one machine.
 *   node forge/packs/core/tools/regression.mjs run [--only R-1,R-3] [--area <name>] [--timeout 300] [--json <file>]
 *        [--url <address>] [--reset "<command>" | --no-reset] [--reset-each]
 *        puts the data back, then runs every recorded scenario, one after the other, and prints one line each.
 *        The address and the reset command come from forge/project.md (commands.url, commands.reset) unless given.
 *        --reset-each puts the data back before every scenario: slower, and no scenario can disturb the next.
 *   node forge/packs/core/tools/regression.mjs forget --id R-3      removes a recording
 *
 * Options for all: [--file docs/regression.md] [--dir tests/regression]
 *
 * A scenario is a `## R-<n> · <title>` section. Its numbered steps and its `start:` and `in the end:` lines are
 * what is recorded (field names in English or French: why/pourquoi, status/statut, area/zone, start/départ,
 * in the end/à la fin, how/comment): change one word of them and the script is `changed since recorded` — it is not run, because
 * nobody knows any more whether it tests what the text says. `how: by hand` marks a scenario no script can play.
 *
 * Exit code of `run`: 0 = every scenario ran and passed · 1 = at least one failed ·
 * 3 = none failed, but some were not run (not recorded, changed, by hand) · 2 = bad arguments.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const [command, ...args] = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const flag = (name) => args.includes(`--${name}`);
const fail = (m) => { console.error(`regression: ${m}`); process.exit(2); };

const file = resolve(opt('file', 'docs/regression.md'));
const dir = resolve(opt('dir', 'tests/regression'));
const manifestFile = join(dir, 'manifest.json');

// the field names, in English or French; everything else in the file is in the human's language
const FIELDS = { why: 'why', pourquoi: 'why', status: 'status', statut: 'status', area: 'area', zone: 'area', how: 'how', comment: 'how',
  start: 'start', 'départ': 'start', depart: 'start', 'in the end': 'in the end', 'à la fin': 'in the end', 'a la fin': 'in the end' };

// commands.url / commands.reset of forge/project.md, read without a YAML parser: `  url: …` under `commands:`
function projectCommand(key) {
  const f = resolve('forge/project.md');
  if (!existsSync(f)) return undefined;
  let inCommands = false;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (/^commands:\s*$/.test(line)) { inCommands = true; continue; }
    if (inCommands && /^\S/.test(line)) inCommands = false;
    const m = inCommands && line.match(/^\s+([a-z_]+):\s*(.+?)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '').replace(/\s+#.*$/, '');
  }
  return undefined;
}

function scenarios() {
  if (!existsSync(file)) fail(`${opt('file', 'docs/regression.md')} not found — /forge-regression writes it`);
  const out = [];
  let current = null;
  let leftOut = false;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const head = line.match(/^##\s+(R-\d+)\s*[·:—-]\s*(.+?)\s*$/);
    if (head) { current = { id: head[1], title: head[2], lines: [], meta: {} }; out.push(current); leftOut = false; continue; }
    if (/^##\s/.test(line)) { current = null; leftOut = true; continue; } // "Left out", or any other section: not a scenario
    if (!current || leftOut) continue;
    const meta = line.match(/^-\s*([^:]{2,14}?)\s*:\s*(.*)$/);
    const key = meta && FIELDS[meta[1].toLowerCase()];
    if (key) current.meta[key] = meta[2].replace(/<!--.*?-->/g, '').trim();
    // what a script plays: where it starts, the numbered steps, what must be true at the end
    const isStep = /^\s*\d+\.\s+\S/.test(line);
    // a step may run over several lines or carry sub-points: indented lines under it belong to it
    const continues = current.inStep && /^\s{2,}\S/.test(line) && !isStep;
    if (isStep || continues || key === 'start' || key === 'in the end') current.lines.push(line.replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim());
    if (line.trim()) current.inStep = isStep || continues;
  }
  const ids = out.map((s) => s.id);
  const twice = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twice) fail(`${twice} appears twice in ${opt('file', 'docs/regression.md')} — every scenario needs its own number`);
  for (const s of out) {
    s.hash = createHash('sha256').update(s.lines.join('\n')).digest('hex').slice(0, 12);
    s.byHand = /by hand|[àa] la main/i.test(s.meta.how ?? '');
    s.steps = s.lines.filter((l) => /^\d+\./.test(l)).length;
  }
  return out;
}
const loadManifest = () => (existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {});
function saveManifest(m) {
  mkdirSync(dir, { recursive: true });
  const sorted = Object.fromEntries(Object.entries(m).sort(([a], [b]) => Number(a.slice(2)) - Number(b.slice(2))));
  writeFileSync(manifestFile, `${JSON.stringify(sorted, null, 2)}\n`);
}
function stateOf(s, manifest) {
  if (s.byHand) return 'by hand';
  if (!s.steps) return 'no steps';
  const m = manifest[s.id];
  if (!m) return 'not recorded';
  return m.hash === s.hash ? 'recorded' : 'changed since recorded';
}

if (command === 'status') {
  const list = scenarios(); const manifest = loadManifest();
  const rows = list.map((s) => ({ id: s.id, title: s.title, area: s.meta.area ?? '', status: s.meta.status ?? '', state: stateOf(s, manifest), run: manifest[s.id]?.run }));
  const orphans = Object.keys(manifest).filter((id) => !list.some((s) => s.id === id));
  if (flag('json')) { console.log(JSON.stringify({ scenarios: rows, orphans }, null, 2)); process.exit(0); }
  for (const r of rows) console.log(`${r.id.padEnd(6)} ${r.state.padEnd(23)} ${r.title}${r.area ? `  [${r.area}]` : ''}`);
  for (const id of orphans) console.log(`${id.padEnd(6)} ${'scenario gone'.padEnd(23)} its recording is still in ${opt('dir', 'tests/regression')}/manifest.json — forget it`);
  const count = (state) => rows.filter((r) => r.state === state).length;
  console.log(`regression: ${rows.length} scenario(s) — ${count('recorded')} recorded, ${count('not recorded')} not recorded, ${count('changed since recorded')} changed, ${count('by hand')} by hand`);
  process.exit(0);
}

if (command === 'record') {
  const id = opt('id'); const run = opt('run');
  if (!id || !run) fail('record needs --id R-<n> and --run "<command>"');
  const s = scenarios().find((x) => x.id === id);
  if (!s) fail(`${id} is not in ${opt('file', 'docs/regression.md')}`);
  if (s.byHand) fail(`${id} is marked "how: by hand" — remove that line before recording a script for it`);
  if (!s.steps) fail(`${id} has no numbered step — nothing to record`);
  const manifest = loadManifest();
  if (flag('verify')) {
    const url = opt('url', projectCommand('url') ?? '');
    const r = spawnSync(run.replaceAll('{url}', url.replace(/\/$/, '')), { shell: true, encoding: 'utf8', timeout: Number(opt('timeout', 300)) * 1000 });
    if (r.status !== 0) { console.error(`${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-6).join('\n')); fail(`${id} is not recorded: its command does not pass (exit ${r.status})`); }
  }
  manifest[id] = { title: s.title, hash: s.hash, run, recorded: new Date().toISOString().slice(0, 10) };
  saveManifest(manifest);
  console.log(`regression: ${id} recorded (${s.steps} step(s)) → ${run}`);
  process.exit(0);
}

if (command === 'forget') {
  const id = opt('id'); if (!id) fail('forget needs --id R-<n>');
  const manifest = loadManifest();
  if (!manifest[id]) fail(`${id} has no recording`);
  delete manifest[id]; saveManifest(manifest);
  console.log(`regression: ${id} forgotten`);
  process.exit(0);
}

if (command === 'run') {
  const only = opt('only') ? opt('only').split(',').map((x) => x.trim()) : null;
  const area = opt('area');
  const timeout = Number(opt('timeout', 300));
  if (!Number.isFinite(timeout) || timeout <= 0) fail('--timeout is a number of seconds');
  const manifest = loadManifest();
  let list = scenarios();
  if (only) { const missing = only.filter((id) => !list.some((s) => s.id === id)); if (missing.length) fail(`not in the pack: ${missing.join(', ')}`); list = list.filter((s) => only.includes(s.id)); }
  if (area) list = list.filter((s) => (s.meta.area ?? '').split(',').map((x) => x.trim().toLowerCase()).includes(area.trim().toLowerCase()));
  if (!list.length) fail('no scenario to run');
  const url = (opt('url', projectCommand('url') ?? '')).replace(/\/$/, '');
  const resetCommand = flag('no-reset') ? null : opt('reset', projectCommand('reset') ?? null);
  const putBack = () => {
    if (!resetCommand) return;
    const r = spawnSync(resetCommand, { shell: true, encoding: 'utf8', timeout: 300000 });
    if (r.status !== 0) fail(`the reset command failed (exit ${r.status}): ${resetCommand}`);
  };
  if (resetCommand && !flag('reset-each')) putBack();
  if (!resetCommand && !flag('no-reset')) console.log('regression: no reset command (forge/project.md → commands.reset, or --reset): the data is as the last run left it');
  const results = [];
  for (const s of list) {
    const state = stateOf(s, manifest);
    if (state !== 'recorded') { results.push({ id: s.id, title: s.title, result: 'not run', why: state }); console.log(`${s.id.padEnd(6)} NOT RUN  ${s.title} — ${state}`); continue; }
    if (!url && manifest[s.id].run.includes('{url}')) fail(`${s.id} needs the app's address: pass --url, or set commands.url in forge/project.md`);
    if (flag('reset-each')) putBack();
    const started = Date.now();
    const r = spawnSync(manifest[s.id].run.replaceAll('{url}', url), { shell: true, encoding: 'utf8', timeout: timeout * 1000, maxBuffer: 32 * 1024 * 1024 });
    const seconds = Math.round((Date.now() - started) / 100) / 10;
    const timedOut = r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGTERM';
    const passed = r.status === 0 && !timedOut;
    if (r.status === 3 && /does not answer/.test(r.stdout ?? '')) { console.log(`${s.id.padEnd(6)} STOPPED  the app does not answer at ${url} — nothing more was played`); results.push({ id: s.id, title: s.title, result: 'not run', why: 'the app does not answer' }); break; }
    const tail = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.split('\n').map((l) => l.trimEnd()).filter(Boolean).slice(-12);
    results.push({ id: s.id, title: s.title, result: passed ? 'pass' : 'fail', seconds, exit: r.status, why: timedOut ? `no answer after ${timeout} s` : undefined, output: passed ? undefined : tail, run: manifest[s.id].run });
    console.log(`${s.id.padEnd(6)} ${passed ? 'PASS    ' : 'FAIL    '} ${s.title} (${seconds} s)${timedOut ? ` — no answer after ${timeout} s` : ''}`);
    if (!passed) for (const l of tail.slice(-4)) console.log(`         ${l}`);
  }
  const n = (x) => results.filter((r) => r.result === x).length;
  const summary = { date: new Date().toISOString().slice(0, 10), pass: n('pass'), fail: n('fail'), notRun: n('not run'), results };
  const jsonOut = opt('json');
  if (jsonOut) { mkdirSync(dirname(resolve(jsonOut)), { recursive: true }); writeFileSync(resolve(jsonOut), `${JSON.stringify(summary, null, 2)}\n`); }
  console.log(`regression: ${summary.pass} passed, ${summary.fail} failed, ${summary.notRun} not run`);
  process.exit(summary.fail ? 1 : summary.notRun ? 3 : 0);
}

fail('usage: regression.mjs status | record --id R-<n> --run "<command>" | run [--only …] [--area …] | forget --id R-<n>');
