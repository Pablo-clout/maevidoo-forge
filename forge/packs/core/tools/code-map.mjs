#!/usr/bin/env node
/*
 * Forge code map — the facts a deep code review starts from, measured and not judged: how big each part of the
 * code is, its largest files, the files that change most, and the files that are both large and often changed.
 * No dependency: Node built-ins and git. It reads; it writes nothing but the file given to --json.
 *
 *   node forge/packs/core/tools/code-map.mjs [--parts "loans=src/loans,gear=src/gear,shared=src/shared"]
 *        [--since "90 days ago"] [--top 5] [--json <file>]
 *
 * Without --parts, the parts are the folders one level under the source root (src/, app/, lib/ or server/ when
 * one holds most of the code; otherwise the top-level folders). Only files git tracks are counted: no
 * dependencies, no build output. Binary files, lock files, minified files and Forge's own tools (forge/packs/)
 * are left out.
 *
 * Per part: files, lines, test files, the largest files, the most changed files since --since, and the
 * **hotspots** (lines × changes): where a defect is most likely and most costly. A file over 600 lines is
 * `large`; a part with no test file is `no test`. These are facts for a reader to start from, not findings.
 *
 * Exit code: 0 = done, 2 = bad arguments or not a git repository.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const fail = (m) => { console.error(`code-map: ${m}`); process.exit(2); };
const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }); } catch { return null; } };

const top = Number(opt('top', 5));
const since = opt('since', '90 days ago');
if (!Number.isInteger(top) || top < 1) fail('--top is a whole number');
const listed = git('ls-files', '-z');
if (listed === null) fail('not a git repository');

const SKIP = /(^|\/)(node_modules|dist|build|out|coverage|vendor|target|\.next|\.venv|__pycache__)\/|\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|gz|woff2?|ttf|eot|mp[34]|mov|lock|map|snap)$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|poetry\.lock|go\.sum)$|\.min\.(js|css)$/i;
const CODE = /\.(m?[jt]sx?|cjs|vue|svelte|py|rb|go|rs|java|kt|kts|cs|php|swift|scala|c|h|cc|cpp|hpp|sql|html?|s?css|less|sh)$/i;
const TEST = /(^|\/)(tests?|__tests__|spec|e2e|cypress|playwright)\/|[._-](test|spec)\.[a-z]+$|(^|\/)test_[^/]+\.py$|Tests?\.(java|kt|cs)$/i;

const files = [];
// Forge's own files, installed in the project, are not the project's code — unless a part names them
const ownForge = (path) => /^forge\/packs\//.test(path) && !(opt('parts') ?? '').includes('forge/');
for (const path of listed.split('\0').filter(Boolean)) {
  if (SKIP.test(path) || !CODE.test(path) || ownForge(path)) continue;
  let text;
  try { if (statSync(path).size > 2_000_000) continue; text = readFileSync(path, 'utf8'); } catch { continue; }
  if (text.includes('\u0000')) continue;
  files.push({ path, lines: text.split('\n').length, test: TEST.test(path), changes: 0 });
}
if (!files.length) fail('no source file tracked by git here');

// how often each file changed
const log = git('log', `--since=${since}`, '--name-only', '--pretty=format:', '--no-renames') ?? '';
const byPath = new Map(files.map((f) => [f.path, f]));
for (const line of log.split('\n')) { const f = byPath.get(line.trim()); if (f) f.changes += 1; }

// the parts
let parts;
const given = opt('parts');
if (given) {
  parts = given.split(',').map((p) => { const [name, ...rest] = p.split('='); const path = rest.join('=').replace(/\/+$/, ''); if (!name || !path) fail(`--parts: "${p}" is not name=path`); return { name: name.trim(), paths: path.split('+').map((x) => x.trim()) }; });
} else {
  const total = files.reduce((n, f) => n + f.lines, 0);
  const under = (root) => files.filter((f) => f.path.startsWith(`${root}/`)).reduce((n, f) => n + f.lines, 0);
  const root = ['src', 'app', 'lib', 'server'].map((r) => ({ r, n: under(r) })).sort((a, b) => b.n - a.n).find((x) => x.n > total * 0.5)?.r;
  const depth = root ? 2 : 1;
  const names = new Set();
  for (const f of files) { const seg = f.path.split('/'); names.add(seg.length > depth ? seg.slice(0, depth).join('/') : (root && f.path.startsWith(`${root}/`) ? root : '(root files)')); }
  parts = [...names].sort().map((name) => ({ name, paths: [name] }));
}
const belongs = (f, part) => part.paths.some((p) => (p === '(root files)' ? !f.path.includes('/') : f.path === p || f.path.startsWith(`${p}/`)));

const claimed = new Set();
const out = { since, parts: [], unassigned: [] };
// the most specific part wins: a file under src/loans belongs to "src/loans", not to "src"
const order = [...parts].sort((a, b) => Math.max(...b.paths.map((p) => p.length)) - Math.max(...a.paths.map((p) => p.length)));
const owned = new Map(parts.map((p) => [p, []]));
for (const f of files) { const part = order.find((p) => belongs(f, p)); if (part) { owned.get(part).push(f); claimed.add(f.path); } }
for (const part of parts) {
  const mine = owned.get(part);
  if (!mine.length) { out.parts.push({ name: part.name, paths: part.paths, files: 0, lines: 0, note: 'no source file' }); continue; }
  const code = mine.filter((f) => !f.test);
  const pick = (list, key) => [...list].sort((a, b) => key(b) - key(a)).slice(0, top);
  out.parts.push({
    name: part.name,
    paths: part.paths,
    files: mine.length,
    lines: mine.reduce((n, f) => n + f.lines, 0),
    testFiles: mine.length - code.length,
    note: [mine.length === code.length ? 'no test' : null, code.some((f) => f.lines > 600) ? 'large file' : null].filter(Boolean).join(', ') || undefined,
    largest: pick(code, (f) => f.lines).map((f) => ({ path: f.path, lines: f.lines })),
    mostChanged: pick(code.filter((f) => f.changes), (f) => f.changes).map((f) => ({ path: f.path, changes: f.changes })),
    hotspots: pick(code.filter((f) => f.changes > 1 && f.lines > 150), (f) => f.lines * f.changes).map((f) => ({ path: f.path, lines: f.lines, changes: f.changes })),
  });
}
out.unassigned = files.filter((f) => !claimed.has(f.path)).map((f) => f.path);
out.total = { files: files.length, lines: files.reduce((n, f) => n + f.lines, 0), testFiles: files.filter((f) => f.test).length };

const jsonOut = opt('json');
if (jsonOut) { mkdirSync(dirname(resolve(jsonOut)), { recursive: true }); writeFileSync(resolve(jsonOut), `${JSON.stringify(out, null, 2)}\n`); }
for (const p of out.parts) {
  console.log(`${p.name}: ${p.files} file(s), ${p.lines} lines, ${p.testFiles ?? 0} test file(s)${p.note ? ` — ${p.note}` : ''}`);
  for (const f of p.largest ?? []) if (f.lines > 600) console.log(`  large    ${f.path} (${f.lines} lines)`);
  for (const f of p.hotspots ?? []) console.log(`  hotspot  ${f.path} (${f.lines} lines × ${f.changes} changes)`);
}
if (out.unassigned.length) console.log(`in no part: ${out.unassigned.length} file(s) — ${out.unassigned.slice(0, 5).join(', ')}${out.unassigned.length > 5 ? ', …' : ''}`);
console.log(`code-map: ${out.parts.length} part(s), ${out.total.files} file(s), ${out.total.lines} lines, changes since ${since}${jsonOut ? ` → ${jsonOut}` : ''}`);
