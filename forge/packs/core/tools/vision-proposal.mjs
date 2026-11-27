#!/usr/bin/env node
/*
 * Forge vision proposal — shows a human exactly what an agent proposes to change in the project's vision (docs/vision.md),
 * before any question is asked: the text today beside the text proposed, what is removed, why, what follows
 * either way, and what does not change. It writes nothing into the vision. No dependency: Node built-ins only.
 *
 *   node forge/packs/core/tools/vision-proposal.mjs <proposal.json> [--out proposal.html]
 *
 * proposal.json:
 *   { "project": "Clubhouse", "date": "2026-11-18", "by": "forge-ux-sweep", "lang": "en" | "fr",   (the page's own words; the text is yours)
 *     "summary": "one or two sentences: what was noticed",
 *     "changes": [
 *       { "section": "3. The features, in broad lines",
 *         "kind": "change" | "add" | "remove",
 *         "way": "vision-moved" | "code-drifted" | "cannot-tell",
 *         "before": "the text today, quoted (change, remove)",
 *         "after": "the text proposed, in full (change, add)",
 *         "why": "what was seen",
 *         "evidence": ["src/app/payments/… (new module since 2026-10-02)", "epics/decisions.md 2026-10-02: …"],
 *         "ifAccepted": "what follows: the map gains a workflow, …",
 *         "ifRefused": "what follows: the payments module is the thing to remove or hide" } ],
 *     "unchanged": ["1. The product", "2. The vision", "4. Architecture and technologies"] }
 *
 * Every change needs its section, kind, way, why, at least one piece of evidence, and what follows either way:
 * a proposal that cannot say these is refused (exit 2) with the list of what is missing.
 * Output: the HTML page (next to the JSON unless --out), and on stdout a text summary, short enough to read in a chat.
 * Exit code: 0 = written, 2 = the proposal is incomplete or unreadable.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const fail = (m) => { console.error(`vision-proposal: ${m}`); process.exit(2); };
const input = args.find((a) => !a.startsWith('--') && a !== opt('out'));
if (!input) fail('give the proposal JSON file');
let data;
try { data = JSON.parse(readFileSync(resolve(input), 'utf8')); } catch (e) { fail(`cannot read ${input}: ${e.message}`); }

const KINDS = ['change', 'add', 'remove'];
// The page's own words, in the human's language ("lang": "fr"). The proposal's text is written by the agent in that language.
const WORDS = {
  en: { title: 'Proposal to change the vision', nothing: 'nothing has been changed yet', by: 'proposed by', today: 'Today', proposed: 'Proposed', isNew: 'Nothing: this is new.', gone: 'Removed: nothing takes its place.',
    why: 'Why', evidence: 'Evidence', yes: 'If you accept', no: 'If you refuse', same: 'What does not change', unstated: 'Not stated.', removal: 'removal', removals: 'removals',
    warn: 'Something written in the vision would disappear. Each one is asked separately.', change: 'Change', add: 'Add', remove: 'Remove',
    'vision-moved': 'The vision moved: the document is behind', 'code-drifted': 'The code drifted: the document is still right', 'cannot-tell': 'Cannot tell: your call' },
  fr: { title: 'Proposition de modification de la vision', nothing: "rien n'a encore été modifié", by: 'proposé par', today: "Aujourd'hui", proposed: 'Proposé', isNew: "Rien : c'est nouveau.", gone: 'Supprimé : rien ne le remplace.',
    why: 'Pourquoi', evidence: 'Preuves', yes: 'Si vous acceptez', no: 'Si vous refusez', same: 'Ce qui ne change pas', unstated: 'Non précisé.', removal: 'suppression', removals: 'suppressions',
    warn: 'Un passage de la vision disparaîtrait. Chaque suppression fait l\'objet d\'une question séparée.', change: 'Modifier', add: 'Ajouter', remove: 'Supprimer',
    'vision-moved': 'La vision a changé : le document est en retard', 'code-drifted': "Le code s'est écarté : le document reste juste", 'cannot-tell': 'Impossible à dire : à vous de trancher' },
};
const W = WORDS[String(data.lang ?? 'en').slice(0, 2)] ?? WORDS.en;
const WAYS = { 'vision-moved': 'The vision moved: the document is behind', 'code-drifted': 'The code drifted: the document is still right', 'cannot-tell': 'Cannot tell: your call' };
const problems = [];
if (!Array.isArray(data.changes) || !data.changes.length) problems.push('"changes" must hold at least one change');
(data.changes ?? []).forEach((c, i) => {
  const at = `change ${i + 1}${c.section ? ` (${c.section})` : ''}`;
  if (!c.section) problems.push(`${at}: no "section"`);
  if (!KINDS.includes(c.kind)) problems.push(`${at}: "kind" must be one of ${KINDS.join(', ')}`);
  if (!WAYS[c.way]) problems.push(`${at}: "way" must be one of ${Object.keys(WAYS).join(', ')} — say which of the code or the vision moved`);
  if ((c.kind === 'change' || c.kind === 'remove') && !c.before) problems.push(`${at}: no "before" — quote the text as it is today`);
  if ((c.kind === 'change' || c.kind === 'add') && !c.after) problems.push(`${at}: no "after" — give the proposed text in full`);
  if (c.kind === 'remove' && c.after) problems.push(`${at}: a removal has no "after"`);
  if (!c.why) problems.push(`${at}: no "why"`);
  if (!Array.isArray(c.evidence) || !c.evidence.length) problems.push(`${at}: no "evidence" — a file, a screen or a dated decision`);
  if (!c.ifAccepted) problems.push(`${at}: no "ifAccepted" — what follows`);
  if (!c.ifRefused) problems.push(`${at}: no "ifRefused" — what follows`);
});
if (problems.length) { console.error('vision-proposal: the proposal is incomplete:'); for (const p of problems) console.error(`  - ${p}`); process.exit(2); }

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const para = (s) => esc(s).replace(/\n/g, '<br>');
const label = { change: W.change, add: W.add, remove: W.remove };
const removals = data.changes.filter((c) => c.kind === 'remove').length;
const out = resolve(opt('out', join(dirname(resolve(input)), 'vision-proposal.html')));

const cards = data.changes.map((c, i) => `
<section class="card ${c.kind}">
  <header><span class="n">${i + 1}</span><h2>${esc(c.section)}</h2><span class="kind">${label[c.kind]}</span></header>
  <p class="way">${esc(W[c.way])}</p>
  <div class="diff">
    <div class="col"><h3>${W.today}</h3>${c.before ? `<blockquote class="${c.kind === 'remove' ? 'gone' : ''}">${para(c.before)}</blockquote>` : `<p class="none">${W.isNew}</p>`}</div>
    <div class="col"><h3>${W.proposed}</h3>${c.after ? `<blockquote class="new">${para(c.after)}</blockquote>` : `<p class="none">${W.gone}</p>`}</div>
  </div>
  <dl>
    <dt>${W.why}</dt><dd>${para(c.why)}</dd>
    <dt>${W.evidence}</dt><dd><ul>${c.evidence.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></dd>
    <dt>${W.yes}</dt><dd>${para(c.ifAccepted)}</dd>
    <dt>${W.no}</dt><dd>${para(c.ifRefused)}</dd>
  </dl>
</section>`).join('\n');

const html = `<!doctype html>
<html lang="${esc(data.lang ?? 'en')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${W.title} — ${esc(data.project ?? 'project')}</title>
<style>
:root{--bg:#f6f7f9;--fg:#1b2430;--muted:#566070;--card:#fff;--line:#d5dae1;--add:#0f6b3a;--addbg:#e7f5ec;--rm:#a3261b;--rmbg:#fbeae8;--chg:#1d5fc4}
@media (prefers-color-scheme: dark){:root{--bg:#14181e;--fg:#e8ecf1;--muted:#a3adba;--card:#1c222b;--line:#333c48;--add:#6fd39a;--addbg:#16301f;--rm:#f19a90;--rmbg:#3a1c19;--chg:#8db8ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
main{max-width:1000px;margin:0 auto;padding:24px 16px 48px}
h1{font-size:24px;margin:0 0 4px}.meta{color:var(--muted);margin:0 0 16px}
.lead{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin:0 0 16px}
.warn{border-left:4px solid var(--rm);padding:8px 12px;background:var(--rmbg);border-radius:4px;margin:0 0 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin:0 0 16px}
.card header{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.card h2{font-size:18px;margin:0;flex:1}
.n{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--fg);color:var(--bg);font-weight:600}
.kind{font-size:13px;font-weight:600;padding:2px 8px;border-radius:999px;border:1px solid currentColor}
.change .kind{color:var(--chg)}.add .kind{color:var(--add)}.remove .kind{color:var(--rm)}
.way{color:var(--muted);margin:8px 0 12px}
.diff{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media (max-width:700px){.diff{grid-template-columns:1fr}}
h3{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:0 0 4px}
blockquote{margin:0;padding:12px;border-radius:6px;border:1px solid var(--line);overflow-wrap:anywhere}
blockquote.new{background:var(--addbg);border-color:var(--add)}blockquote.gone{background:var(--rmbg);border-color:var(--rm);text-decoration:line-through}
.none{color:var(--muted);font-style:italic;margin:0;padding:12px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:8px 16px;margin:16px 0 0}dt{font-weight:600}dd{margin:0}ul{margin:0;padding-left:18px}
@media (max-width:700px){dl{grid-template-columns:1fr}}
.same li{color:var(--muted)}
</style></head><body><main>
<h1>${W.title}</h1>
<p class="meta">${esc(data.project ?? '')}${data.date ? ` · ${esc(data.date)}` : ''}${data.by ? ` · ${W.by} ${esc(data.by)}` : ''} · ${W.nothing}</p>
${data.summary ? `<p class="lead">${para(data.summary)}</p>` : ''}
${removals ? `<p class="warn"><strong>${removals} ${removals > 1 ? W.removals : W.removal}.</strong> ${W.warn}</p>` : ''}
${cards}
<section class="card same"><h2>${W.same}</h2>${Array.isArray(data.unchanged) && data.unchanged.length ? `<ul>${data.unchanged.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : `<p class="none">${W.unstated}</p>`}</section>
</main></body></html>
`;
writeFileSync(out, html);

const line = (s, n = 110) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
console.log(`Vision proposal — ${data.changes.length} change(s)${removals ? `, ${removals} removal(s)` : ''} — nothing changed yet`);
data.changes.forEach((c, i) => {
  console.log(`  ${i + 1}. ${label[c.kind].toUpperCase()} · ${c.section} · ${WAYS[c.way].split(':')[0]}`);
  if (c.before) console.log(`     today:    ${line(c.before)}`);
  if (c.after) console.log(`     proposed: ${line(c.after)}`);
  console.log(`     why:      ${line(c.why)}`);
});
if (Array.isArray(data.unchanged) && data.unchanged.length) console.log(`  unchanged: ${data.unchanged.join(' · ')}`);
console.log(`page: ${opt('out') ?? join(dirname(input), 'vision-proposal.html')}`);
