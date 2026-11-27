#!/usr/bin/env node
/*
 * Forge sweep report — renders one /forge-sweep run from its data file.
 * No dependency: Node built-ins only.
 *
 *   node forge/packs/core/tools/sweep-report.mjs epics/sweeps/<date>/report.json
 *
 * Writes, from that one file:
 *   epics/sweeps/<date>/index.html   the illustrated report (before/after captures) — NOT committed
 *   epics/sweeps/<date>.md           the text report — committed, searchable, read by the next sweep
 *   (with "kind": "ux" — a /forge-ux-sweep run — the folder is epics/sweeps/ux-<date>/ and the text ux-<date>.md)
 * The data format is documented by example in forge/packs/core/templates/sweep-report.json.
 * Exit code: 0 = written (warnings may be printed), 2 = the data file is invalid (nothing written).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const input = process.argv[2];
const fail = (message) => { console.error(`sweep-report: ${message}`); process.exit(2); };
if (!input) fail('usage: sweep-report.mjs <path to report.json>');

let data;
try { data = JSON.parse(readFileSync(input, 'utf8')); } catch (error) { fail(`cannot read ${input}: ${error.message}`); }

const dir = dirname(resolve(input));
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['fixed', 'reverted', 'open', 'needs-you'];
const SINCE = ['new', 'still-open', 'regression', 'reopened', 'new-rule'];
const KINDS = ['sweep', 'ux'];
const MODES = ['fix', 'light', 'report-only'];

const L = {
  en: {
    eyebrow: 'Weekly sweep', title: 'Quality sweep', found: 'defects found', fixedN: 'fixed and re-tested',
    openN: 'left open', needsN: 'decisions for you', severeOpen: 'serious still open', regressions: 'regressions',
    tests: 'tests after the fixes', byFeature: 'By feature', feature: 'Feature', core: 'Core', flows: 'Flows walked',
    uiReview: 'UI review', foundCol: 'Found', fixedCol: 'Fixed', openCol: 'Open', severeCol: 'Serious',
    findings: 'Every defect', all: 'All', fixed: 'Fixed', open: 'Open', needs: 'Needs you', severe: 'Serious', regression: 'Regressions',
    shown: 'shown', before: 'Before', after: 'After', now: 'Now', why: 'Why open', reproduce: 'Reproduce', noShot: 'No capture',
    sev: { Critical: 'Critical', High: 'High', Medium: 'Medium', Low: 'Low' },
    st: { fixed: 'Fixed', reverted: 'Fix reverted', open: 'Open', 'needs-you': 'Needs you' },
    since: { new: 'New', 'still-open': 'Still open', regression: 'Regression', reopened: 'Reopened', 'new-rule': 'New check' },
    ux: { eyebrow: 'UX sweep', title: 'UX and UI audit' },
    stability: 'Stability from one run to the next', guards: 'guards replayed', guardsLine: 'Guards replayed (fixed defects re-checked first)',
    flaky: 'Seen once, not reproduced — not counted, not fixed', silenced: 'Silenced by the ledger (already settled, no trigger)',
    touchedAgain: 'Touched again although settled in an earlier run', waiting: 'Questions still waiting for you',
    stableNote: 'A quiet run on unchanged code finds nothing to fix: what was settled stays settled.',
    needsYou: 'Your decisions', needsIntro: 'None of these was decided for you.', wholeApp: 'The app as a whole',
    notTested: 'What was not tested', next: 'Suggested next steps', fixedSince: 'Fixed since the last sweep',
    run: 'About this run', branch: 'Fixes on branch', sweptAt: 'Swept at commit', mode: 'Mode', testsLine: 'Tests',
    beforeFix: 'before', afterFix: 'after the fixes', healthy: 'healthy — nothing found', close: 'Close',
    zoom: (id, which) => `Enlarge the ${which.toLowerCase()} capture of ${id}`, gallery: 'Illustrated report (not in git)',
    modes: { fix: 'find and fix', light: 'light', 'report-only': 'find only' }, yes: 'yes', no: 'no',
    sevCol: 'Severity', sinceCol: 'Since', whatCol: 'What happens', statusCol: 'Status',
  },
  fr: {
    eyebrow: 'Balayage hebdomadaire', title: 'Contrôle qualité', found: 'défauts trouvés', fixedN: 'corrigés et re-testés',
    openN: 'laissés ouverts', needsN: 'décisions pour vous', severeOpen: 'graves encore ouverts', regressions: 'régressions',
    tests: 'tests après correction', byFeature: 'Par fonctionnalité', feature: 'Fonctionnalité', core: 'Essentielle',
    flows: 'Parcours testés', uiReview: 'Revue UI', foundCol: 'Trouvés', fixedCol: 'Corrigés', openCol: 'Ouverts', severeCol: 'Graves',
    findings: 'Tous les défauts', all: 'Tous', fixed: 'Corrigés', open: 'Ouverts', needs: 'À décider', severe: 'Graves', regression: 'Régressions',
    shown: 'affichés', before: 'Avant', after: 'Après', now: 'Maintenant', why: 'Pourquoi ouvert', reproduce: 'Reproduire', noShot: 'Pas de capture',
    sev: { Critical: 'Critique', High: 'Grave', Medium: 'Moyen', Low: 'Mineur' },
    st: { fixed: 'Corrigé', reverted: 'Correction annulée', open: 'Ouvert', 'needs-you': 'À décider' },
    since: { new: 'Nouveau', 'still-open': 'Toujours ouvert', regression: 'Régression', reopened: 'Rouvert', 'new-rule': 'Nouveau contrôle' },
    ux: { eyebrow: 'Balayage UX', title: 'Audit UX et UI' },
    stability: 'Stabilité d’un passage à l’autre', guards: 'gardes rejouées', guardsLine: 'Gardes rejouées (défauts déjà corrigés, revérifiés en premier)',
    flaky: 'Vu une fois, pas reproduit — ni compté, ni corrigé', silenced: 'Mis en sourdine par le registre (déjà réglé, rien ne le rouvre)',
    touchedAgain: 'Retouché alors que réglé lors d’un passage précédent', waiting: 'Questions qui vous attendent encore',
    stableNote: 'Un passage calme sur du code inchangé ne trouve rien à corriger : ce qui est réglé le reste.',
    needsYou: 'Vos décisions', needsIntro: 'Aucune de ces questions n’a été tranchée à votre place.', wholeApp: 'L’application dans son ensemble',
    notTested: 'Ce qui n’a pas été testé', next: 'Suites proposées', fixedSince: 'Corrigés depuis le balayage précédent',
    run: 'À propos de ce passage', branch: 'Corrections sur la branche', sweptAt: 'Balayé au commit', mode: 'Mode', testsLine: 'Tests',
    beforeFix: 'avant', afterFix: 'après correction', healthy: 'rien trouvé', close: 'Fermer',
    zoom: (id, which) => `Agrandir la capture ${which.toLowerCase()} de ${id}`, gallery: 'Rapport illustré (hors git)',
    modes: { fix: 'trouver et corriger', light: 'allégé', 'report-only': 'trouver seulement' }, yes: 'oui', no: 'non',
    sevCol: 'Gravité', sinceCol: 'Depuis', whatCol: 'Ce qui se passe', statusCol: 'Statut',
  },
};

// ---------- validation ----------
const errors = [];
const warnings = [];
const need = (cond, message) => { if (!cond) errors.push(message); };
need(typeof data === 'object' && data, 'the file must hold one JSON object');
need(/^\d{4}-\d{2}-\d{2}$/.test(data.date ?? ''), '`date` must be YYYY-MM-DD');
need(typeof data.project === 'string' && data.project, '`project` is required');
need(Array.isArray(data.features), '`features` must be a list');
need(Array.isArray(data.findings), '`findings` must be a list');
if (data.mode !== undefined) need(MODES.includes(data.mode), `\`mode\` must be one of ${MODES.join(', ')}`);
if (data.kind !== undefined) need(KINDS.includes(data.kind), `\`kind\` must be one of ${KINDS.join(', ')}`);
const t = { ...(L[data.lang] ?? L.en) };
if (data.kind === 'ux') Object.assign(t, t.ux);
const st = data.stability ?? null;
if (st) {
  for (const key of ['flaky', 'silenced', 'touchedAgain', 'waiting']) need(st[key] === undefined || Array.isArray(st[key]), `\`stability.${key}\` must be a list`);
  if (st.touchedAgain?.length) warnings.push(`${st.touchedAgain.length} settled element(s) touched again — each needs a reason in the list`);
}
if (data.lang && !L[data.lang]) warnings.push(`no labels for lang "${data.lang}" — English labels used, your text unchanged`);

const featureIds = new Set((data.features ?? []).map((f) => f.id));
for (const f of data.features ?? []) need(f.id && f.name, `every feature needs an \`id\` and a \`name\` (got ${JSON.stringify(f).slice(0, 80)})`);
const seen = new Set();
for (const f of data.findings ?? []) {
  const id = f.id ?? '?';
  need(typeof f.id === 'string' && f.id, `a finding has no \`id\` (${JSON.stringify(f).slice(0, 80)})`);
  need(!seen.has(id), `finding ${id} appears twice`); seen.add(id);
  need(SEVERITIES.includes(f.severity), `${id}: \`severity\` must be one of ${SEVERITIES.join(', ')}`);
  need(STATUSES.includes(f.status), `${id}: \`status\` must be one of ${STATUSES.join(', ')}`);
  need(typeof f.what === 'string' && f.what, `${id}: \`what\` (what the user sees) is required`);
  if (f.since !== undefined) need(SINCE.includes(f.since), `${id}: \`since\` must be one of ${SINCE.join(', ')}`);
  const features = f.features ?? (f.feature ? [f.feature] : []);
  need(features.length > 0, `${id}: \`features\` (ids from \`features\`) is required`);
  for (const ref of features) need(featureIds.has(ref), `${id}: unknown feature "${ref}"`);
  if (f.status === 'fixed') {
    if (!f.now) warnings.push(`${id}: fixed but no \`now\` — say what the user sees now`);
    if (!f.commit) warnings.push(`${id}: fixed but no \`commit\``);
  }
  if (f.status !== 'fixed' && !f.why) warnings.push(`${id}: ${f.status} but no \`why\``);
  for (const which of ['before', 'after']) {
    if (f[which] && !existsSync(join(dir, f[which]))) {
      warnings.push(`${id}: ${which} capture ${f[which]} not found — shown as "${t.noShot}"`);
      f[which] = null;
    }
  }
}
if (errors.length) fail(`${input} is invalid:\n  - ${errors.join('\n  - ')}`);

// ---------- numbers ----------
const findings = data.findings;
const featuresOf = (f) => f.features ?? [f.feature];
const isSevere = (f) => f.severity === 'Critical' || f.severity === 'High';
const count = (pred) => findings.filter(pred).length;
const n = {
  found: findings.length,
  fixed: count((f) => f.status === 'fixed'),
  open: count((f) => f.status === 'open' || f.status === 'reverted'),
  needs: count((f) => f.status === 'needs-you') + (data.needsYou ?? []).reduce((a, g) => a + (typeof g === 'string' ? 1 : (g.items ?? []).length), 0),
  severe: count(isSevere),
  severeOpen: count((f) => isSevere(f) && f.status !== 'fixed'),
  regressions: count((f) => f.since === 'regression'),
};
const perFeature = (id) => {
  const mine = findings.filter((f) => featuresOf(f)[0] === id);
  return { found: mine.length, fixed: mine.filter((f) => f.status === 'fixed').length,
    open: mine.filter((f) => f.status !== 'fixed').length, severe: mine.filter(isSevere).length, mine };
};
const sevRank = (f) => SEVERITIES.indexOf(f.severity);
const verdict = n.found === 0 ? t.healthy
  : (data.lang === 'fr'
    ? `${n.found} défauts${n.regressions ? ` (dont ${n.regressions} régressions)` : ''} — ${n.fixed} corrigés, ${n.open} ouverts, ${count((f) => f.status === 'needs-you')} à décider`
    : `${n.found} defects${n.regressions ? ` (${n.regressions} regressions)` : ''} — ${n.fixed} fixed, ${n.open} open, ${count((f) => f.status === 'needs-you')} need you`);

// ---------- HTML ----------
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const list = (items, tag = 'ul') => (items?.length ? `<${tag}>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</${tag}>` : '');
const table = (columns, rows) => `<div class="scroll"><table><thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const statusClass = (s) => (s === 'fixed' ? 'ok' : s === 'needs-you' ? 'warn' : 'bad');

const shot = (f, which) => {
  const label = which === 'before' ? t.before : t.after;
  if (!f[which]) return `<figure class="none"><figcaption>${label}</figcaption><p>${esc(t.noShot)}</p></figure>`;
  return `<figure><figcaption>${label}</figcaption><button class="zoom" type="button" data-src="${esc(f[which])}" aria-label="${esc(t.zoom(f.id, label))}"><img src="${esc(f[which])}" alt="${esc(`${f.id} — ${label}`)}"></button></figure>`;
};

const bug = (f) => `<article class="bug" data-st="${f.status}" data-sev="${f.severity}" data-since="${f.since ?? 'new'}">
<header><code>${esc(f.id)}</code><span class="pill sev-${f.severity}">${esc(t.sev[f.severity])}</span><span class="pill st-${statusClass(f.status)}">${esc(t.st[f.status])}</span>${f.since && f.since !== 'new' ? `<span class="pill since-${f.since}">${esc(t.since[f.since])}</span>` : ''}${f.where ? `<span class="where">${esc(f.where)}</span>` : ''}</header>
<p class="what">${esc(f.what)}</p>
${f.now ? `<p class="note"><span>${esc(t.now)}</span>${esc(f.now)}${f.commit ? ` <code>${esc(f.commit)}</code>` : ''}</p>` : ''}
${f.why && f.status !== 'fixed' ? `<p class="note"><span>${esc(t.why)}</span>${esc(f.why)}</p>` : ''}
${f.reproduce?.length || f.capture ? `<details><summary>${esc(t.reproduce)}</summary>${list(f.reproduce, 'ol')}${f.capture ? `<pre><code>${esc(f.capture)}</code></pre>` : ''}</details>` : ''}
${f.before || f.after ? `<div class="shots">${shot(f, 'before')}${f.status === 'fixed' || f.after ? shot(f, 'after') : ''}</div>` : ''}
</article>`;

const tiles = [
  [n.found, t.found], [n.fixed, t.fixedN], [n.open, t.openN], [n.needs, t.needsN],
  [`${n.severeOpen} / ${n.severe}`, t.severeOpen],
  ...(n.regressions ? [[n.regressions, t.regressions]] : []),
  ...(data.tests?.after ? [[data.tests.after, t.tests]] : []),
  ...(st?.guards ? [[st.guards, t.guards]] : []),
  ...(data.figures ?? []).map((x) => [x.value, x.label]),
];

const featureRows = data.features.map((f) => {
  const c = perFeature(f.id);
  return [`<a href="#f-${esc(f.id)}">${esc(f.name)}</a>`, f.core ? t.yes : t.no, esc(f.flows ?? ''), c.found, c.fixed, c.open, c.severe, esc(f.ui ?? '')];
});

const needsGroups = (data.needsYou ?? []).map((g) => (typeof g === 'string' ? { items: [g] } : g));
const needsHtml = needsGroups.length || count((f) => f.status === 'needs-you')
  ? `<h2 id="needs">${esc(t.needsYou)}</h2><p>${esc(t.needsIntro)}</p>${needsGroups.map((g) => `${g.group ? `<h4>${esc(g.group)}</h4>` : ''}${list(g.items, 'ol')}`).join('')}${findings.filter((f) => f.status === 'needs-you').length ? `<ul>${findings.filter((f) => f.status === 'needs-you').map((f) => `<li><a href="#${esc(f.id)}"><code>${esc(f.id)}</code></a> ${esc(f.why ?? f.what)}</li>`).join('')}</ul>` : ''}`
  : '';

const stabilityHtml = st ? `<h2 id="stability">${esc(t.stability)}</h2><p>${esc(t.stableNote)}</p>${st.guards ? `<p><b>${esc(t.guardsLine)}:</b> ${esc(st.guards)}</p>` : ''}${
  ['touchedAgain', 'waiting', 'silenced', 'flaky'].map((k) => (st[k]?.length ? `<h4>${esc(t[k])} (${st[k].length})</h4>${list(st[k])}` : '')).join('')}` : '';

const sections = (data.sections ?? []).map((s) => `<h2>${esc(s.title)}</h2>${s.intro ? `<p>${esc(s.intro)}</p>` : ''}${s.table ? table(s.table.columns, s.table.rows.map((r) => r.map(esc))) : ''}${list(s.bullets)}`).join('\n');

const zones = data.features.map((f) => {
  const c = perFeature(f.id);
  if (!c.found) return '';
  const sorted = [...c.mine].sort((a, b) => sevRank(a) - sevRank(b));
  return `<section class="zone" id="f-${esc(f.id)}"><h3>${esc(f.name)} <small>${c.found} · ${c.fixed} ${esc(t.fixed.toLowerCase())}</small></h3>${sorted.map((f2) => bug(f2).replace('<article ', `<article id="${esc(f2.id)}" `)).join('')}</section>`;
}).join('\n');

const lead = data.summary ?? '';
const html = `<!doctype html>
<html lang="${esc(data.lang ?? 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.project)} — ${esc(t.title)} ${esc(data.date)}</title>
<style>
/* Night band with the verdict and the key figures, then one reading column; every defect is a card with its before/after pair. */
:root{--bg:#f5f4ef;--card:#fff;--fg:#17201c;--muted:#59645e;--line:#e3e0d6;--night:#111a17;--on-night:#f1efe8;--on-night-muted:#a3b2aa;--accent:#1f7a52;--gold:#d99a00;
--ok-bg:#e2f1e8;--ok-fg:#0f5a34;--bad-bg:#fbe5e2;--bad-fg:#972620;--warn-bg:#fff0c4;--warn-fg:#714f00;--flat-bg:#ebe8de;--flat-fg:#47524c;--crit-bg:#972620;--crit-fg:#fff}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0d1412;--card:#15201c;--fg:#eeebe3;--muted:#a1afa8;--line:#25352e;--night:#070c0b;--accent:#4cc28a;
--ok-bg:#133829;--ok-fg:#92e0b6;--bad-bg:#44201c;--bad-fg:#ffb4ad;--warn-bg:#3f320d;--warn-fg:#ffd86b;--flat-bg:#1d2c26;--flat-fg:#bac7c0;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0d1412;--card:#15201c;--fg:#eeebe3;--muted:#a1afa8;--line:#25352e;--night:#070c0b;--accent:#4cc28a;
--ok-bg:#133829;--ok-fg:#92e0b6;--bad-bg:#44201c;--bad-fg:#ffb4ad;--warn-bg:#3f320d;--warn-fg:#ffd86b;--flat-bg:#1d2c26;--flat-fg:#bac7c0;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:980px;margin:0 auto;padding:0 16px}
.band{background:var(--night);color:var(--on-night)}
.band .wrap{padding-block:32px 28px}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin:0 0 8px}
h1{font-size:clamp(28px,5vw,40px);line-height:1.1;margin:0 0 12px}
.lead{max-width:70ch;margin:0 0 8px}
.verdict{font-weight:600;margin:0 0 20px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.tile{border:1px solid #2a3a33;padding:14px 16px;display:flex;flex-direction:column;gap:2px}
.tile b{font-size:26px;line-height:1.1;font-variant-numeric:tabular-nums}
.tile span{font-size:12.5px;color:var(--on-night-muted)}
main.wrap{padding-block:8px 64px}
h2{font-size:21px;line-height:1.2;margin:44px 0 10px;padding-top:14px;border-top:2px solid var(--fg)}
h3{font-size:17px;margin:32px 0 4px}
h3 small{font-size:12.5px;font-weight:500;color:var(--muted);margin-left:6px}
h4{font-size:14px;margin:20px 0 4px}
p,li{max-width:72ch}
ul,ol{padding-left:22px;margin:8px 0}
li{margin:4px 0}
a{color:var(--accent)}
code{font:600 12.5px ui-monospace,Menlo,Consolas,monospace}
.scroll{overflow-x:auto;margin:12px 0}
table{border-collapse:collapse;width:100%;font-size:14px;font-variant-numeric:tabular-nums}
th{text-align:left;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:6px 12px 6px 0;border-bottom:1px solid var(--fg);white-space:nowrap}
td{padding:8px 12px 8px 0;border-bottom:1px solid var(--line);vertical-align:top}
td a,li a{display:inline-block;padding:4px 0}
.filters{position:sticky;top:0;z-index:5;background:var(--bg);display:flex;flex-wrap:wrap;gap:8px;padding-block:10px;border-bottom:1px solid var(--line)}
.filters button{font-size:13px;font-weight:500;font-family:inherit;color:var(--fg);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:8px 14px;min-height:40px;cursor:pointer}
.filters button[aria-pressed="true"]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.count{color:var(--muted);font-size:13px;align-self:center;margin-left:auto}
button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.zone{scroll-margin-top:72px}
.bug{padding:16px 0;border-bottom:1px solid var(--line);scroll-margin-top:72px}
.bug header{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px}
.where{color:var(--muted);font-size:13px}
.pill{font-size:11.5px;font-weight:600;border-radius:4px;padding:2px 7px}
.sev-Critical{background:var(--crit-bg);color:var(--crit-fg)}.sev-High{background:var(--bad-bg);color:var(--bad-fg)}.sev-Medium{background:var(--warn-bg);color:var(--warn-fg)}.sev-Low{background:var(--flat-bg);color:var(--flat-fg)}
.st-ok{background:var(--ok-bg);color:var(--ok-fg)}.st-warn{background:var(--warn-bg);color:var(--warn-fg)}.st-bad{background:var(--bad-bg);color:var(--bad-fg)}
.since-regression{background:var(--crit-bg);color:var(--crit-fg)}.since-still-open{background:var(--flat-bg);color:var(--flat-fg)}
.what{margin:0 0 4px;font-weight:500}
.note{margin:0 0 4px;color:var(--muted)}
.note span{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fg);margin-right:6px}
details{margin:6px 0;color:var(--muted);font-size:14px}
pre{white-space:pre-wrap;word-break:break-all;background:var(--card);border:1px solid var(--line);padding:8px;margin:6px 0}
summary{cursor:pointer;min-height:32px;display:flex;align-items:center}
.shots{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}
figure{margin:0;flex:1 1 150px;max-width:320px;min-width:0}
figcaption{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.zoom{display:block;padding:0;border:1px solid var(--line);background:var(--card);cursor:zoom-in;width:100%}
.zoom img{display:block;width:100%;max-height:300px;object-fit:cover;object-position:top}
figure.none p{font-size:13px;color:var(--muted);border:1px dashed var(--line);padding:12px;margin:0}
dialog{border:0;padding:0;background:var(--card);max-width:min(96vw,1100px);max-height:94vh}
dialog::backdrop{background:rgba(5,10,8,.82)}
dialog img{display:block;max-width:100%;height:auto}
dialog form{position:sticky;top:0;display:flex;justify-content:flex-end;background:var(--card);padding:6px}
dialog button{font-size:13px;font-weight:600;font-family:inherit;padding:8px 14px;min-height:40px;background:var(--fg);color:var(--bg);border:0;cursor:pointer}
.meta{color:var(--muted);font-size:14px}
</style>
</head>
<body>
<div class="band"><div class="wrap">
<p class="eyebrow">${esc(data.project)} · ${esc(t.eyebrow)} · ${esc(data.date)}</p>
<h1>${esc(data.title ?? t.title)}</h1>
${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
<p class="verdict">${esc(verdict)}</p>
<div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
</div></div>
<main class="wrap">
${needsHtml}
${stabilityHtml}
<h2>${esc(t.byFeature)}</h2>
${table([t.feature, t.core, t.flows, t.foundCol, t.fixedCol, t.openCol, t.severeCol, t.uiReview], featureRows)}
${data.notSwept?.length ? list(data.notSwept) : ''}
${data.wholeApp ? `<h2>${esc(t.wholeApp)}</h2>${(Array.isArray(data.wholeApp) ? data.wholeApp : [data.wholeApp]).map((p) => `<p>${esc(p)}</p>`).join('')}` : ''}
${sections}
<h2>${esc(t.findings)}</h2>
<div class="filters" role="group" aria-label="${esc(t.findings)}">
<button type="button" data-f="all" aria-pressed="true">${esc(t.all)}</button>
<button type="button" data-f="fixed" aria-pressed="false">${esc(t.fixed)}</button>
<button type="button" data-f="open" aria-pressed="false">${esc(t.open)}</button>
<button type="button" data-f="needs" aria-pressed="false">${esc(t.needs)}</button>
<button type="button" data-f="severe" aria-pressed="false">${esc(t.severe)}</button>
${n.regressions ? `<button type="button" data-f="regression" aria-pressed="false">${esc(t.regression)}</button>` : ''}
<span class="count" id="count" aria-live="polite"></span>
</div>
${zones}
${data.fixedSince?.length ? `<h2>${esc(t.fixedSince)}</h2>${list(data.fixedSince)}` : ''}
${data.notTested?.length ? `<h2>${esc(t.notTested)}</h2>${list(data.notTested)}` : ''}
${data.next?.length ? `<h2>${esc(t.next)}</h2>${list(data.next)}` : ''}
<h2>${esc(t.run)}</h2>
<p class="meta">${data.branch ? `${esc(t.branch)} <code>${esc(data.branch)}</code> · ` : ''}${data.sweptAt ? `${esc(t.sweptAt)} <code>${esc(data.sweptAt)}</code> · ` : ''}${esc(t.mode)} : ${esc(t.modes[data.mode ?? 'fix'])}${data.tests ? ` · ${esc(t.testsLine)} : ${esc(t.beforeFix)} ${esc(data.tests.before ?? '—')}, ${esc(t.afterFix)} ${esc(data.tests.after ?? '—')}` : ''}</p>
${list(data.runNotes)}
</main>
<dialog id="dlg"><form method="dialog"><button>${esc(t.close)}</button></form><img id="dlgimg" alt=""></dialog>
<script>
const dlg=document.getElementById('dlg'),di=document.getElementById('dlgimg');
document.addEventListener('click',e=>{const b=e.target.closest('.zoom');if(b){di.src=b.dataset.src;di.alt=b.getAttribute('aria-label');dlg.showModal();}else if(e.target===dlg)dlg.close();});
const bugs=[...document.querySelectorAll('.bug')],cnt=document.getElementById('count');
const keep={all:()=>true,fixed:b=>b.dataset.st==='fixed',open:b=>b.dataset.st==='open'||b.dataset.st==='reverted',needs:b=>b.dataset.st==='needs-you',severe:b=>b.dataset.sev==='Critical'||b.dataset.sev==='High',regression:b=>b.dataset.since==='regression'};
function apply(f){let n=0;bugs.forEach(b=>{const ok=keep[f](b);b.hidden=!ok;if(ok)n++;});document.querySelectorAll('.zone').forEach(z=>z.hidden=!z.querySelector('.bug:not([hidden])'));cnt.textContent=n+' ${esc(t.shown)}';}
document.querySelectorAll('.filters button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));apply(b.dataset.f);}));
apply('all');
</script>
</body>
</html>
`;

// ---------- Markdown (committed, searchable, read by the next sweep) ----------
const cell = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const md = [];
md.push(`# ${t.title} — ${data.project} — ${data.date}`, '');
md.push(`**Verdict:** ${verdict}  `);
if (data.branch) md.push(`**${t.branch}:** \`${data.branch}\` · **${t.sweptAt}:** \`${data.sweptAt ?? '—'}\`  `);
if (data.tests) md.push(`**${t.testsLine}:** ${t.beforeFix} ${data.tests.before ?? '—'} · ${t.afterFix} ${data.tests.after ?? '—'}  `);
md.push(`**${t.mode}:** ${t.modes[data.mode ?? 'fix']}  `);
md.push(`**${t.gallery}:** \`${basename(dir)}/index.html\``, '');
if (data.summary) md.push(data.summary, '');
if (needsGroups.length || count((f) => f.status === 'needs-you')) {
  md.push(`## ${t.needsYou}`, '');
  for (const g of needsGroups) {
    if (g.group) md.push(`**${g.group}**`, '');
    (g.items ?? []).forEach((item, i) => md.push(`${i + 1}. ${item}`));
    md.push('');
  }
  for (const f of findings.filter((x) => x.status === 'needs-you')) md.push(`- ${f.id} — ${f.why ?? f.what}`);
  md.push('');
}
md.push(`## ${t.byFeature}`, '');
md.push(`| ${t.feature} | ${t.core} | ${t.flows} | ${t.foundCol} | ${t.fixedCol} | ${t.openCol} | ${t.severeCol} | ${t.uiReview} |`, '|---|---|---|---|---|---|---|---|');
for (const f of data.features) {
  const c = perFeature(f.id);
  md.push(`| ${cell(f.name)} (\`${f.id}\`) | ${f.core ? t.yes : t.no} | ${cell(f.flows)} | ${c.found} | ${c.fixed} | ${c.open} | ${c.severe} | ${cell(f.ui)} |`);
}
md.push('');
if (data.notSwept?.length) { data.notSwept.forEach((x) => md.push(`- ${x}`)); md.push(''); }
if (st) {
  md.push(`## ${t.stability}`, '', t.stableNote, '');
  if (st.guards) md.push(`**${t.guardsLine}:** ${st.guards}`, '');
  for (const k of ['touchedAgain', 'waiting', 'silenced', 'flaky']) {
    if (st[k]?.length) { md.push(`**${t[k]}** (${st[k].length})`, '', ...st[k].map((x) => `- ${x}`), ''); }
  }
}
if (data.wholeApp) { md.push(`## ${t.wholeApp}`, '', ...(Array.isArray(data.wholeApp) ? data.wholeApp : [data.wholeApp]).flatMap((p) => [p, '']));}
for (const s of data.sections ?? []) {
  md.push(`## ${s.title}`, '');
  if (s.intro) md.push(s.intro, '');
  if (s.table) { md.push(`| ${s.table.columns.map(cell).join(' | ')} |`, `|${s.table.columns.map(() => '---').join('|')}|`, ...s.table.rows.map((r) => `| ${r.map(cell).join(' | ')} |`), ''); }
  (s.bullets ?? []).forEach((b) => md.push(`- ${b}`));
  if (s.bullets?.length) md.push('');
}
md.push(`## ${t.findings}`, '');
md.push(`| # | ${t.sevCol} | ${t.feature} | ${t.sinceCol} | ${t.whatCol} | ${t.now} / ${t.why} | ${t.reproduce} | ${t.statusCol} |`, '|---|---|---|---|---|---|---|---|');
for (const f of [...findings].sort((a, b) => sevRank(a) - sevRank(b))) {
  const outcome = f.status === 'fixed' ? `${f.now ?? ''}${f.commit ? ` \`${f.commit}\`` : ''}` : (f.why ?? '');
  md.push(`| ${f.id} | ${t.sev[f.severity]} | ${featuresOf(f).join(', ')}${f.where ? ` — ${cell(f.where)}` : ''} | ${t.since[f.since ?? 'new']} | ${cell(f.what)} | ${cell(outcome)} | ${cell((f.reproduce ?? []).map((s, i) => `${i + 1}. ${s}`).join(' '))} | ${t.st[f.status]} |`);
}
md.push('');
if (data.fixedSince?.length) { md.push(`## ${t.fixedSince}`, ''); data.fixedSince.forEach((x) => md.push(`- ${x}`)); md.push(''); }
if (data.notTested?.length) { md.push(`## ${t.notTested}`, ''); data.notTested.forEach((x) => md.push(`- ${x}`)); md.push(''); }
if (data.next?.length) { md.push(`## ${t.next}`, ''); data.next.forEach((x) => md.push(`- ${x}`)); md.push(''); }
if (data.runNotes?.length) { md.push(`## ${t.run}`, ''); data.runNotes.forEach((x) => md.push(`- ${x}`)); md.push(''); }

const htmlPath = join(dir, 'index.html');
const mdPath = join(dirname(dir), `${data.kind === 'ux' ? 'ux-' : ''}${data.date}.md`);
writeFileSync(htmlPath, html);
writeFileSync(mdPath, `${md.join('\n').trim()}\n`);
for (const w of warnings) console.log(`  warning: ${w}`);
const shots = findings.reduce((a, f) => a + (f.before ? 1 : 0) + (f.after ? 1 : 0), 0);
console.log(`sweep-report: ${n.found} findings (${n.fixed} fixed, ${n.open} open, ${count((f) => f.status === 'needs-you')} need you), ${shots} captures, ${warnings.length} warning(s) → ${htmlPath} + ${mdPath}`);
