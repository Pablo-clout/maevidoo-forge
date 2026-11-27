#!/usr/bin/env node
/*
 * Forge sweep queue — writes and reads epics/to-sweep.md so its format never depends on the model.
 * No dependency: Node built-ins only.
 *
 *   node forge/packs/core/tools/sweep-queue.mjs add --commit <sha> --what "<feature · screens or endpoints>" \
 *        --mode forge|forge-light|pilot|debug --judged no|light|testers|review|full --check "<what to check in particular>" \
 *        [--date YYYY-MM-DD] [--file epics/to-sweep.md]
 *   node forge/packs/core/tools/sweep-queue.mjs list [--json]          the queue, deepest first: no → light → review → testers → full
 *   node forge/packs/core/tools/sweep-queue.mjs edit --commit <sha> [--new-commit <sha>] [--what …] [--mode …] [--judged …] [--check …]
 *                                                                      corrects a row in place (a commit amended, who judged it, the text)
 *   node forge/packs/core/tools/sweep-queue.mjs swept --commit <sha> --by sweep|ux --result "ok" | "2 findings" [--done]
 *                                                                      marks a row; --done removes it
 *
 * `add` creates the file from forge/packs/core/templates/to-sweep.md when it is missing, repairs a file that has
 * no table, and inserts the row at the top of the table. Exit code: 0 = done, 2 = bad arguments.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [command, ...args] = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const flag = (name) => args.includes(`--${name}`);
const fail = (m) => { console.error(`sweep-queue: ${m}`); process.exit(2); };

const MODES = ['forge', 'forge-light', 'pilot', 'debug'];
const JUDGED = ['no', 'light', 'review', 'testers', 'full']; // deepest need first
const HEADER = '| Date | Commit | What shipped (feature · screens or endpoints) | Mode | Judged | Check in particular | Swept |';
const RULE = '|------|--------|-----------------------------------------------|------|--------|---------------------|-------|';
const file = resolve(opt('file', 'epics/to-sweep.md'));
const cell = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\s*\n+\s*/g, ' ').trim();

function load() {
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const template = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'to-sweep.md');
  const text = existsSync(template) ? readFileSync(template, 'utf8') : `# To sweep — what shipped since the last sweep\n\n${HEADER}\n${RULE}\n`;
  // the template's example row is not a real entry
  return text.split('\n').filter((l) => !/^\|\s*\{\{/.test(l)).join('\n').replace('> Template → copy to `epics/to-sweep.md`. ', '> ');
}
function rows(text) {
  return text.split('\n').filter((l) => /^\|/.test(l) && l !== HEADER && !/^\|[-\s|]+\|$/.test(l) && !/^\|\s*Date\s*\|/.test(l))
    .map((l) => { const c = l.split(/(?<!\\)\|/).slice(1, -1).map((x) => x.trim()); return { date: c[0], commit: c[1]?.replace(/`/g, ''), what: c[2], mode: c[3], judged: c[4], check: c[5], swept: c[6] ?? '—', line: l }; });
}
function save(text) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, `${text.replace(/\n+$/, '')}\n`); }

if (command === 'add') {
  const commit = opt('commit'); const what = opt('what'); const mode = opt('mode'); const judged = opt('judged'); const check = opt('check', '');
  if (!commit || !what) fail('add needs --commit and --what');
  if (!MODES.includes(mode)) fail(`--mode must be one of ${MODES.join(', ')}`);
  if (!JUDGED.includes(judged)) fail(`--judged must be one of ${JUDGED.join(', ')}`);
  const date = opt('date', new Date().toISOString().slice(0, 10));
  let text = load();
  if (!text.includes(HEADER)) text = `${text.replace(/\n+$/, '')}\n\n${HEADER}\n${RULE}\n`; // a file written by hand without the table
  const row = `| ${date} | \`${cell(commit)}\` | ${cell(what)} | ${mode} | ${judged} | ${cell(check)} | — |`;
  text = text.replace(`${HEADER}\n${RULE}`, `${HEADER}\n${RULE}\n${row}`);
  save(text);
  console.log(`sweep-queue: added ${commit} (${mode}, judged: ${judged}) → ${opt('file', 'epics/to-sweep.md')} — ${rows(text).length} in the queue`);
} else if (command === 'list') {
  const list = existsSync(file) ? rows(readFileSync(file, 'utf8')) : [];
  list.sort((a, b) => JUDGED.indexOf(a.judged) - JUDGED.indexOf(b.judged));
  if (flag('json')) console.log(JSON.stringify(list.map(({ line, ...r }) => r), null, 2));
  else {
    for (const r of list) console.log(`  ${r.judged.padEnd(7)} ${r.date} ${r.commit} ${r.mode} — ${r.what} — check: ${r.check}${r.swept && r.swept !== '—' ? ` — swept: ${r.swept}` : ''}`);
    console.log(`sweep-queue: ${list.length} to sweep (${list.filter((r) => r.judged === 'no').length} not judged, ${list.filter((r) => r.judged === 'light').length} light)`);
  }
} else if (command === 'edit') {
  const commit = opt('commit');
  if (!commit) fail('edit needs --commit <sha of the row to correct>');
  if (!existsSync(file)) fail(`${file} does not exist`);
  let text = readFileSync(file, 'utf8');
  const row = rows(text).find((r) => r.commit === commit);
  if (!row) fail(`no row for commit ${commit}`);
  const mode = opt('mode', row.mode); const judged = opt('judged', row.judged);
  if (!MODES.includes(mode)) fail(`--mode must be one of ${MODES.join(', ')}`);
  if (!JUDGED.includes(judged)) fail(`--judged must be one of ${JUDGED.join(', ')}`);
  const changed = ['new-commit', 'what', 'mode', 'judged', 'check'].filter((k) => opt(k) !== undefined);
  if (!changed.length) fail('edit: nothing to change — give --new-commit, --what, --mode, --judged or --check');
  const next = `| ${row.date} | \`${cell(opt('new-commit', row.commit))}\` | ${cell(opt('what', row.what))} | ${mode} | ${judged} | ${cell(opt('check', row.check))} | ${row.swept} |`;
  text = text.replace(row.line, next);
  save(text);
  console.log(`sweep-queue: ${commit} corrected (${changed.join(', ')})`);
} else if (command === 'swept') {
  const commit = opt('commit'); const by = opt('by'); const result = opt('result', 'ok');
  if (!commit || !['sweep', 'ux'].includes(by)) fail('swept needs --commit and --by sweep|ux');
  if (!existsSync(file)) fail(`${file} does not exist`);
  let text = readFileSync(file, 'utf8');
  const row = rows(text).find((r) => r.commit === commit);
  if (!row) fail(`no row for commit ${commit}`);
  if (flag('done')) text = text.replace(`${row.line}\n`, '').replace(row.line, '');
  else {
    const mark = `${by} ${new Date().toISOString().slice(0, 10)} ${cell(result)}`;
    const swept = row.swept && row.swept !== '—' ? `${row.swept}; ${mark}` : mark;
    text = text.replace(row.line, row.line.replace(/\|[^|]*\|\s*$/, `| ${swept} |`));
  }
  save(text);
  console.log(`sweep-queue: ${commit} ${flag('done') ? 'removed' : `marked (${by})`}`);
} else {
  fail('usage: sweep-queue.mjs add|list|edit|swept …');
}
