#!/usr/bin/env node
/**
 * Review package: what a judge needs to read a change, in one file.
 *
 *   node forge/packs/core/tools/review-package.mjs --base <commit> [--head <commit>] --out <file>
 *
 * Writes the commits of base..head, the files changed and the diff with 10 lines of context
 * to --out, and prints that path. --head defaults to HEAD. Zero dependencies (git on PATH).
 *
 * Why a file: the judge reads it once instead of working the range out with several git calls,
 * and the diff never passes through the orchestrator's context.
 * Use the commit recorded before the work started as --base, never HEAD~1: a task of several
 * commits would lose all but the last.
 *
 * Exit code: 0 = written · 2 = bad arguments or range (nothing written).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const fail = (message) => { console.error(`review-package: ${message}`); process.exit(2); };
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const base = opt('base');
const head = opt('head', 'HEAD');
const out = opt('out');
if (!base || !out) fail('usage: --base <commit> [--head <commit>] --out <file>');

let baseSha; let headSha;
try { baseSha = git('rev-parse', '--verify', '--quiet', `${base}^{commit}`).trim(); } catch { fail(`unknown --base: ${base}`); }
try { headSha = git('rev-parse', '--verify', '--quiet', `${head}^{commit}`).trim(); } catch { fail(`unknown --head: ${head}`); }
try { git('merge-base', '--is-ancestor', baseSha, headSha); } catch { fail(`--head is not a descendant of --base (${base}..${head})`); }
const range = `${baseSha}..${headSha}`;
if (Number(git('rev-list', '--count', range).trim()) === 0) fail(`no commit in ${base}..${head}`);

const text = [
  `# Review package ${baseSha.slice(0, 7)}..${headSha.slice(0, 7)}`,
  '',
  '## Commits',
  git('log', '--oneline', '--no-decorate', range).trimEnd(),
  '',
  '## Files changed',
  git('diff', '--stat', range).trimEnd(),
  '',
  '## Diff (10 lines of context)',
  git('diff', '-U10', '--no-color', range).trimEnd(),
  '',
].join('\n');

const file = resolve(out);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, text);
console.log(file);
