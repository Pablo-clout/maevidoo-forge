#!/usr/bin/env node
/*
 * Forge chaos bookkeeping — deals the charters of a /forge-chaos-sweep run (a workflow and a temperament per free tester,
 * or an area and an angle per blind walk), collects the signals of the walks, merges them, and keeps the score. The formats never depend on the model that runs a worker.
 * No dependency: Node built-ins only.
 *
 *   chaos.mjs deal    --dir <scratch> --areas "items=http://localhost:4200/items,loans=http://localhost:4200/loans" --workers 12
 *                     [--run 3] [--angles wander,impatient,… | ux,design,workflow] [--temperaments impatient,clumsy,…] [--actions 40]
 *        One charter per worker: an area, an angle, a random seed and a width. No two charters share an area and an angle.
 *        Every area gets the same number of angles; --run shifts the deal, so over as many runs as there are angles
 *        every area meets every angle. Writes <dir>/charters.json.
 *   chaos.mjs note    --dir <scratch> --charter C03 --run <run.json>          records every signal of a run-chaos.mjs run (none → "ok")
 *   chaos.mjs note    --dir <scratch> --charter C03 --ok                      nothing found
 *   chaos.mjs note    --dir <scratch> --charter C03 --kind data-lost --where "/loans · form \"New loan\"" --what "<one line>" --steps "<how to see it again>" [--evidence "<raw proof>"]
 *        A finding the worker saw itself. --kind is a closed list (see KINDS): an opinion has no kind and is refused.
 *   chaos.mjs triage  --dir <scratch> [--json]      merges the notes by fingerprint: one line per distinct problem, with how many charters saw it
 *   chaos.mjs verdict --dir <scratch> --id K2 --replayed yes|no [--judged real|false|unclear] [--severity Critical|High|Medium|Low]
 *   chaos.mjs summary --dir <scratch> [--json]      raised → replayed → judged real, per angle: what the cheap workers were worth
 *   chaos.mjs plan-waves --dir <scratch> [--pilot 3] [--at-once 5] [--json]
 *        Splits <dir>/charters.json into Wave 1 (pilot) + subsequent waves from waves.contract.json. Writes <dir>/waves.json.
 *   chaos.mjs validate-report (--file <report.json> | --stdin) [--json]
 *        Validates a worker report JSON (specialist, code-reader, or journey) against finding.schema.json.
 *
 * Exit code: 0 = done, 2 = bad arguments or invalid report.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [command, ...args] = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i === -1 ? fallback : args[i + 1]; };
const flag = (name) => args.includes(`--${name}`);
const fail = (m) => { console.error(`chaos: ${m}`); process.exit(2); };

// The angles run-chaos.mjs walks by itself. For the free testers, --angles takes their temperaments instead (angles.md).
const MECHANICAL = ['wander', 'impatient', 'dirty-input', 'keyboard', 'flaky-network', 'small-screen'];
const KINDS = {
  hard: ['uncaught', 'server-error', 'blank-page', 'injected-script-ran', 'data-lost', 'data-duplicated', 'access-granted'],
  suspect: ['console-error', 'duplicate-request', 'silent-failure', 'sideways-scroll', 'dead-end', 'stuck-busy', 'no-feedback', 'state-not-kept'],
};
const levelOf = (kind) => (KINDS.hard.includes(kind) ? 'hard' : KINDS.suspect.includes(kind) ? 'suspect' : null);
const WIDTHS = [1280, 390, 768];
const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));
const CONTRACT_FILE = resolve(TOOLS_DIR, '..', 'skills', 'forge-chaos-sweep', 'waves.contract.json');

const dirArg = opt('dir');
if (command !== 'validate-report' && !dirArg) fail('--dir <scratch folder of this run> is required');
const dir = dirArg ? resolve(dirArg) : null;
const chartersFile = dir ? join(dir, 'charters.json') : null;
const notesFile = dir ? join(dir, 'notes.jsonl') : null;
const triageFile = dir ? join(dir, 'triage.json') : null;
const wavesFile = dir ? join(dir, 'waves.json') : null;
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const hash = (text) => { let h = 2166136261; for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 100000; };
const norm = (text) => String(text).toLowerCase().replace(/\d+/g, 'N').replace(/\s+/g, ' ').trim().slice(0, 120);

if (command === 'deal') {
  const areas = String(opt('areas', '')).split(',').map((a) => a.trim()).filter(Boolean).map((a) => { const i = a.indexOf('='); return i === -1 ? null : { id: a.slice(0, i).trim(), url: a.slice(i + 1).trim() }; });
  if (!areas.length || areas.includes(null)) fail('--areas needs "name=url,name=url"');
  const angles = String(opt('angles', MECHANICAL.join(','))).split(',').map((a) => a.trim()).filter(Boolean);
  const wanted = Number(opt('workers'));
  if (!(wanted >= 1)) fail('--workers <n> is required');
  const run = Math.max(1, Number(opt('run', 1)));
  const actions = Number(opt('actions', 40));
  const temperaments = String(opt('temperaments', '')).split(',').map((a) => a.trim()).filter(Boolean);
  const most = areas.length * angles.length;
  const total = Math.min(wanted, most);
  const charters = [];
  // Pass after pass over the areas, each pass with the next angle: coverage first, repeats of an area always under a new angle.
  for (let pass = 0; charters.length < total && pass < angles.length; pass += 1) {
    for (let i = 0; i < areas.length && charters.length < total; i += 1) {
      const angle = angles[(i + pass + run - 1) % angles.length];
      const area = areas[i]; // areas keep their order; only the angles turn
      charters.push({
        id: `C${String(charters.length + 1).padStart(2, '0')}`, area: area.id, url: area.url, angle, mechanical: MECHANICAL.includes(angle),
        rng: hash(`${run}|${area.id}|${angle}`), width: angle === 'small-screen' ? 320 : WIDTHS[(i + pass + run) % WIDTHS.length], actions,
        ...(temperaments.length ? { temperament: temperaments[(i * 2 + pass * 3 + run - 1) % temperaments.length] } : {}),
      });
    }
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(chartersFile, `${JSON.stringify({ tool: 'forge-chaos-deal/1', run, areas, angles, asked: wanted, charters }, null, 2)}\n`);
  for (const c of charters) console.log(`  ${c.id}  ${c.area.padEnd(18)} ${c.angle.padEnd(14)} rng ${String(c.rng).padEnd(6)} ${c.width}px${c.temperament ? `  ${c.temperament}` : ''}`);
  const per = Math.floor(total / areas.length);
  console.log(`chaos deal run ${run}: ${total} charters over ${areas.length} areas × ${angles.length} angles — ${per ? `every area under ${per}${total % areas.length ? `–${per + 1}` : ''} angle(s)` : `${total} of ${areas.length} areas covered`}`
    + `${wanted > most ? ` (asked ${wanted}: only ${most} distinct area × angle pairs exist — add areas or angles, never the same pair twice)` : ''} → ${join(dirArg, 'charters.json')}`);
} else if (command === 'note') {
  if (!existsSync(chartersFile)) fail(`no charters in ${dirArg}: run "deal" first`);
  const id = opt('charter');
  const charter = read(chartersFile).charters.find((c) => c.id === id);
  if (!charter) fail(`unknown charter "${id}"`);
  const base = { charter: id, area: charter.area, angle: charter.angle };
  const lines = [];
  if (opt('run')) {
    const runFile = opt('run');
    const already = existsSync(notesFile) && readFileSync(notesFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).some((n) => n.charter === id && n.replay === runFile);
    if (already) { console.log(`chaos note ${id}: ${runFile} is already recorded — nothing added`); process.exit(0); } // a worker that records a walk twice must not count it twice
    const result = read(resolve(runFile));
    for (const s of result.signals ?? []) lines.push({ ...base, kind: s.kind, level: s.level, where: s.route, what: s.message, during: s.during, fingerprint: s.fingerprint, replay: runFile, step: s.step, shot: s.shot, by: 'tool' });
    if (!lines.length) lines.push({ ...base, ok: true, actions: result.stats?.done, replay: runFile });
  } else if (flag('ok')) {
    lines.push({ ...base, ok: true });
  } else {
    const kind = opt('kind'); const where = opt('where'); const what = opt('what'); const steps = opt('steps');
    if (!levelOf(kind)) fail(`--kind must be one of: ${[...KINDS.hard, ...KINDS.suspect].join(', ')}. Anything else (looks odd, could be clearer, slow) is not a chaos finding: leave it out.`);
    if (!where || !what || !steps) fail('a finding needs --where "<route · element>", --what "<one line>" and --steps "<how to see it again>"');
    lines.push({ ...base, kind, level: levelOf(kind), where, what: String(what).slice(0, 300), steps: String(steps).slice(0, 1200), evidence: String(opt('evidence', '')).slice(0, 600), fingerprint: `${kind} · ${norm(where)} · ${norm(what)}`, by: 'worker' });
  }
  appendFileSync(notesFile, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  console.log(`chaos note ${id} (${charter.area} · ${charter.angle}): ${lines[0].ok ? 'ok, nothing found' : `${lines.length} finding(s) recorded`}`);
} else if (command === 'triage') {
  if (!existsSync(chartersFile)) fail(`no charters in ${dirArg}`);
  const { charters } = read(chartersFile);
  const notes = existsSync(notesFile) ? readFileSync(notesFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const groups = new Map();
  for (const n of notes.filter((x) => !x.ok)) {
    const g = groups.get(n.fingerprint) ?? { fingerprint: n.fingerprint, kind: n.kind, level: n.level, where: n.where, what: n.what, charters: [], angles: [], areas: [], sightings: [] };
    if (!g.charters.includes(n.charter)) g.charters.push(n.charter);
    if (!g.angles.includes(n.angle)) g.angles.push(n.angle);
    if (!g.areas.includes(n.area)) g.areas.push(n.area);
    g.sightings.push(n.by === 'tool' ? { charter: n.charter, replay: n.replay, step: n.step, during: n.during, shot: n.shot } : { charter: n.charter, steps: n.steps, evidence: n.evidence });
    groups.set(n.fingerprint, g);
  }
  const clusters = [...groups.values()].sort((a, b) => (a.level === b.level ? b.charters.length - a.charters.length : a.level === 'hard' ? -1 : 1))
    .map((g, i) => ({ id: `K${i + 1}`, ...g, seenBy: g.charters.length, sightings: g.sightings.slice(0, 3) }));
  const reported = new Set(notes.map((n) => n.charter));
  const silent = charters.filter((c) => !reported.has(c.id)).map((c) => c.id);
  const previous = existsSync(triageFile) ? read(triageFile).clusters : [];
  for (const c of clusters) { const old = previous.find((p) => p.fingerprint === c.fingerprint); if (old) Object.assign(c, { replayed: old.replayed, judged: old.judged, severity: old.severity }); }
  const result = { tool: 'forge-chaos-triage/1', charters: charters.length, returned: reported.size, ok: new Set(notes.filter((n) => n.ok).map((n) => n.charter)).size, silent, raised: notes.filter((n) => !n.ok).length, clusters };
  writeFileSync(triageFile, `${JSON.stringify(result, null, 2)}\n`);
  if (flag('json')) console.log(JSON.stringify(result, null, 2));
  else {
    for (const c of clusters) console.log(`  ${c.id.padEnd(4)}${c.level.padEnd(8)}${c.kind} — ${c.where}: ${c.what}  [seen by ${c.seenBy}: ${c.charters.join(', ')}]`);
    if (silent.length) console.log(`  note: ${silent.length} charter(s) returned nothing at all (not even "ok"): ${silent.join(', ')} — their area was not tested`);
    console.log(`chaos triage: ${result.raised} finding(s) from ${result.returned}/${result.charters} charters → ${clusters.length} distinct, ${clusters.filter((c) => c.level === 'hard').length} hard → ${join(dirArg, 'triage.json')}`);
  }
} else if (command === 'verdict') {
  if (!existsSync(triageFile)) fail(`no triage in ${dirArg}: run "triage" first`);
  const result = read(triageFile);
  const cluster = result.clusters.find((c) => c.id === opt('id'));
  if (!cluster) fail(`unknown cluster "${opt('id')}"`);
  const replayed = opt('replayed'); const judged = opt('judged'); const severity = opt('severity');
  if (replayed !== undefined) { if (!['yes', 'no'].includes(replayed)) fail('--replayed yes|no'); cluster.replayed = replayed; }
  if (judged !== undefined) { if (!['real', 'false', 'unclear'].includes(judged)) fail('--judged real|false|unclear'); if (cluster.replayed !== 'yes') fail('judge only what was replayed: a finding that did not come back is set aside, not judged'); cluster.judged = judged; }
  if (severity !== undefined) { if (!['Critical', 'High', 'Medium', 'Low'].includes(severity)) fail('--severity Critical|High|Medium|Low'); cluster.severity = severity; }
  writeFileSync(triageFile, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`chaos verdict ${cluster.id}: replayed ${cluster.replayed ?? '—'}, judged ${cluster.judged ?? '—'}${cluster.severity ? `, ${cluster.severity}` : ''}`);
} else if (command === 'summary') {
  if (!existsSync(triageFile)) fail(`no triage in ${dirArg}`);
  const result = read(triageFile);
  const { charters } = read(chartersFile);
  const c = result.clusters;
  const perAngle = {};
  for (const ch of charters) (perAngle[ch.angle] ??= { charters: 0, distinct: 0, real: 0 }).charters += 1;
  for (const k of c) for (const a of k.angles) { if (!perAngle[a]) continue; perAngle[a].distinct += 1; if (k.judged === 'real') perAngle[a].real += 1; }
  const summary = { charters: result.charters, returned: result.returned, silent: result.silent.length, raised: result.raised, distinct: c.length,
    replayed: c.filter((k) => k.replayed === 'yes').length, notReplayed: c.filter((k) => k.replayed === 'no').length, waiting: c.filter((k) => !k.replayed).length,
    real: c.filter((k) => k.judged === 'real').length, falseAlarm: c.filter((k) => k.judged === 'false').length, unclear: c.filter((k) => k.judged === 'unclear').length, perAngle };
  if (flag('json')) console.log(JSON.stringify(summary, null, 2));
  else {
    for (const [a, v] of Object.entries(perAngle)) console.log(`  ${a.padEnd(14)} ${v.charters} charter(s) · ${v.distinct} distinct · ${v.real} real`);
    console.log(`chaos summary: ${summary.raised} raised → ${summary.distinct} distinct → ${summary.replayed} replayed (${summary.notReplayed} did not come back, ${summary.waiting} not replayed yet) → ${summary.real} real, ${summary.falseAlarm} false, ${summary.unclear} unclear`);
  }
} else if (command === 'plan-waves') {
  if (!existsSync(chartersFile)) fail(`no charters in ${dirArg}: run "deal" first`);
  const contract = existsSync(CONTRACT_FILE) ? read(CONTRACT_FILE) : { waves: { pilot_size: 3, default_wave_size: 5 } };
  const pilot = Number(opt('pilot', contract.waves?.pilot_size ?? 3));
  const atOnce = Number(opt('at-once', contract.waves?.default_wave_size ?? 5));
  if (!Number.isInteger(pilot) || pilot < 1) fail('--pilot must be a positive integer');
  if (!Number.isInteger(atOnce) || atOnce < 1) fail('--at-once must be a positive integer');
  const { run, charters } = read(chartersFile);
  const waves = [];
  if (charters.length) {
    waves.push({ wave: 1, kind: 'pilot', charters: charters.slice(0, pilot).map((c) => c.id), size: Math.min(pilot, charters.length) });
    for (let i = pilot; i < charters.length; i += atOnce) {
      const slice = charters.slice(i, i + atOnce).map((c) => c.id);
      waves.push({ wave: waves.length + 1, kind: 'wave', charters: slice, size: slice.length });
    }
  }
  const plan = {
    tool: 'forge-chaos-waves-plan/1',
    contract: contract.contract ?? 'forge-chaos-waves/1',
    run,
    total_charters: charters.length,
    pilot_size: pilot,
    wave_size: atOnce,
    invariants: contract.invariants ?? { blind_isolation: true, shared_board: false },
    rules: {
      cost_recheck_multiplier: contract.waves?.cost_recheck_multiplier ?? 2.0,
      on_limit_error: contract.waves?.on_limit_error ?? { action: 'halve_wave_size', max_consecutive_errors: 2, retry_in_loop: false },
      early_stop: contract.waves?.early_stop ?? { condition: 'zero_new_findings_in_wave' },
    },
    waves,
  };
  writeFileSync(wavesFile, `${JSON.stringify(plan, null, 2)}\n`);
  if (flag('json')) console.log(JSON.stringify(plan, null, 2));
  else {
    for (const w of waves) console.log(`  wave ${w.wave} (${w.kind.padEnd(5)}): ${w.size} charter(s) — ${w.charters.join(', ')}`);
    console.log(`chaos plan-waves: ${charters.length} charters → ${waves.length} wave(s) (pilot ${pilot}, then ${atOnce} at once) → ${join(dirArg, 'waves.json')}`);
  }
} else if (command === 'validate-report') {
  const fileArg = opt('file');
  const useStdin = flag('stdin');
  if (!fileArg && !useStdin) fail('validate-report needs --file <report.json> or --stdin');
  let raw;
  try {
    raw = useStdin ? readFileSync(0, 'utf8') : readFileSync(resolve(fileArg), 'utf8');
  } catch (err) {
    fail(`could not read report: ${err.message}`);
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    fail(`invalid JSON: ${err.message}`);
  }
  const errors = [];
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
  const isIntRange = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  const checkKeys = (obj, allowed, path) => {
    for (const k of Object.keys(obj)) if (!allowed.includes(k)) errors.push(`${path}: unexpected key "${k}"`);
  };
  const checkStrArray = (v, path, maxItems = null) => {
    if (!Array.isArray(v)) { errors.push(`${path}: must be an array of strings`); return; }
    if (maxItems !== null && v.length > maxItems) errors.push(`${path}: at most ${maxItems} items (got ${v.length})`);
    v.forEach((item, idx) => { if (!isNonEmpty(item)) errors.push(`${path}[${idx}]: must be a non-empty string`); });
  };
  const checkTelemetry = (t) => {
    if (t === undefined) return;
    if (!isObj(t)) { errors.push('telemetry: must be an object'); return; }
    checkKeys(t, ['duration_ms', 'input_tokens', 'output_tokens', 'total_tokens', 'model'], 'telemetry');
    for (const k of ['duration_ms', 'input_tokens', 'output_tokens', 'total_tokens']) {
      if (t[k] !== undefined && (!Number.isInteger(t[k]) || t[k] < 0)) errors.push(`telemetry.${k}: must be an integer >= 0`);
    }
    if (t.model !== undefined && typeof t.model !== 'string') errors.push('telemetry.model: must be a string');
  };

  if (!isObj(doc)) {
    errors.push('root: report must be a JSON object');
  } else if (doc.role === 'specialist') {
    checkKeys(doc, ['role', 'charter_id', 'workflow', 'specialty', 'temperament', 'widths_looked_at', 'actions', 'feeling', 'feeling_summary', 'findings', 'outside_my_specialty', 'tried_and_fine', 'not_tried', 'telemetry'], 'root');
    if (doc.charter_id !== undefined && (typeof doc.charter_id !== 'string' || !/^C[0-9]{2,}$/.test(doc.charter_id))) errors.push('charter_id: must match ^C[0-9]{2,}$');
    if (!isNonEmpty(doc.workflow)) errors.push('workflow: required non-empty string');
    if (!['ux', 'design', 'workflow'].includes(doc.specialty)) errors.push('specialty: must be ux, design, or workflow');
    if (!isNonEmpty(doc.temperament)) errors.push('temperament: required non-empty string');
    if (!Array.isArray(doc.widths_looked_at) || doc.widths_looked_at.length < 1 || doc.widths_looked_at.some((w) => !isIntRange(w, 200, 4096))) errors.push('widths_looked_at: non-empty array of integers 200..4096');
    if (!Number.isInteger(doc.actions) || doc.actions < 0) errors.push('actions: integer >= 0 required');
    if (!['works', 'shaky', 'broken'].includes(doc.feeling)) errors.push('feeling: must be works, shaky, or broken');
    if (!isNonEmpty(doc.feeling_summary)) errors.push('feeling_summary: required non-empty string');
    checkStrArray(doc.outside_my_specialty, 'outside_my_specialty');
    checkStrArray(doc.tried_and_fine, 'tried_and_fine');
    checkStrArray(doc.not_tried, 'not_tried');
    checkTelemetry(doc.telemetry);
    if (!Array.isArray(doc.findings)) {
      errors.push('findings: must be an array');
    } else {
      doc.findings.forEach((f, idx) => {
        const p = `findings[${idx}]`;
        if (!isObj(f)) { errors.push(`${p}: must be an object`); return; }
        checkKeys(f, ['id', 'sev', 'sure', 'page', 'did', 'saw', 'breaks', 'costs_the_user', 'good_would_be', 'again', 'evidence'], p);
        if (typeof f.id !== 'string' || !/^F[1-9][0-9]*$/.test(f.id)) errors.push(`${p}.id: must match ^F[1-9][0-9]*$`);
        if (!isIntRange(f.sev, 1, 3)) errors.push(`${p}.sev: integer 1..3 required`);
        if (!isIntRange(f.sure, 1, 3)) errors.push(`${p}.sure: integer 1..3 required`);
        for (const k of ['page', 'did', 'saw', 'breaks', 'costs_the_user', 'good_would_be', 'again', 'evidence']) {
          if (!isNonEmpty(f[k])) errors.push(`${p}.${k}: required non-empty string`);
        }
      });
    }
  } else if (doc.role === 'code-reader') {
    checkKeys(doc, ['role', 'part', 'kind', 'files_read', 'files_total', 'lines_approx', 'findings', 'dropped_after_rereading', 'readability', 'telemetry'], 'root');
    if (!isNonEmpty(doc.part)) errors.push('part: required non-empty string');
    if (!['server', 'browser', 'other'].includes(doc.kind)) errors.push('kind: must be server, browser, or other');
    if (!Number.isInteger(doc.files_read) || doc.files_read < 0) errors.push('files_read: integer >= 0 required');
    if (!Number.isInteger(doc.files_total) || doc.files_total < 1) errors.push('files_total: integer >= 1 required');
    if (Number.isInteger(doc.files_read) && Number.isInteger(doc.files_total) && doc.files_read > doc.files_total) errors.push('files_read: cannot exceed files_total');
    if (!Number.isInteger(doc.lines_approx) || doc.lines_approx < 0) errors.push('lines_approx: integer >= 0 required');
    checkStrArray(doc.dropped_after_rereading, 'dropped_after_rereading');
    checkTelemetry(doc.telemetry);
    if (!isObj(doc.readability)) {
      errors.push('readability: required object');
    } else {
      checkKeys(doc.readability, ['easy_to_follow', 'comments_and_docs', 'where_i_got_lost', 'comments_that_would_have_saved_me'], 'readability');
      if (!isIntRange(doc.readability.easy_to_follow, 1, 5)) errors.push('readability.easy_to_follow: integer 1..5 required');
      if (!isIntRange(doc.readability.comments_and_docs, 1, 5)) errors.push('readability.comments_and_docs: integer 1..5 required');
      checkStrArray(doc.readability.where_i_got_lost, 'readability.where_i_got_lost', 5);
      checkStrArray(doc.readability.comments_that_would_have_saved_me, 'readability.comments_that_would_have_saved_me', 5);
    }
    if (!Array.isArray(doc.findings)) {
      errors.push('findings: must be an array');
    } else {
      if (doc.findings.length > 8) errors.push(`findings: at most 8 items (got ${doc.findings.length})`);
      doc.findings.forEach((f, idx) => {
        const p = `findings[${idx}]`;
        if (!isObj(f)) { errors.push(`${p}: must be an object`); return; }
        checkKeys(f, ['id', 'sev', 'sure', 'location', 'what', 'path', 'who_is_hurt', 'why_still_believed'], p);
        if (typeof f.id !== 'string' || !/^F[1-9][0-9]*$/.test(f.id)) errors.push(`${p}.id: must match ^F[1-9][0-9]*$`);
        if (!isIntRange(f.sev, 1, 3)) errors.push(`${p}.sev: integer 1..3 required`);
        if (!isIntRange(f.sure, 1, 3)) errors.push(`${p}.sure: integer 1..3 required`);
        for (const k of ['location', 'what', 'path', 'who_is_hurt', 'why_still_believed']) {
          if (!isNonEmpty(f[k])) errors.push(`${p}.${k}: required non-empty string`);
        }
      });
    }
  } else if (doc.role === 'journey') {
    const PERSONS = [
      'the hurried one',
      'the anxious one',
      'the interrupted one',
      'the one who gets it wrong',
      'the one who cannot hold everything in their head',
    ];
    const COST_KINDS = ['clicks', 'retyped', 'remembered', 'dead end', 'lost', 'doubt', 'words'];
    checkKeys(doc, ['role', 'person', 'errand', 'completed', 'stopped_at', 'effort', 'findings', 'what_went_well', 'dropped', 'telemetry'], 'root');
    if (!PERSONS.includes(doc.person)) errors.push(`person: must be one of ${PERSONS.join(' | ')}`);
    if (!isNonEmpty(doc.errand)) errors.push('errand: required non-empty string');
    if (!['yes', 'partly'].includes(doc.completed)) errors.push('completed: must be yes or partly');
    if (doc.completed === 'partly' && !isNonEmpty(doc.stopped_at)) errors.push('stopped_at: required non-empty string when completed is "partly"');
    if (doc.stopped_at !== undefined && typeof doc.stopped_at !== 'string') errors.push('stopped_at: must be a string');
    if (!isObj(doc.effort)) {
      errors.push('effort: required object');
    } else {
      checkKeys(doc.effort, ['screens', 'clicks', 'fields_typed'], 'effort');
      for (const k of ['screens', 'clicks', 'fields_typed']) {
        if (!Number.isInteger(doc.effort[k]) || doc.effort[k] < 0) errors.push(`effort.${k}: integer >= 0 required`);
      }
    }
    checkStrArray(doc.what_went_well, 'what_went_well', 5);
    checkStrArray(doc.dropped, 'dropped');
    checkTelemetry(doc.telemetry);
    if (!Array.isArray(doc.findings)) {
      errors.push('findings: must be an array');
    } else {
      if (doc.findings.length > 8) errors.push(`findings: at most 8 items (got ${doc.findings.length})`);
      doc.findings.forEach((f, idx) => {
        const p = `findings[${idx}]`;
        if (!isObj(f)) { errors.push(`${p}: must be an object`); return; }
        checkKeys(f, ['id', 'sev', 'sure', 'screens', 'moment', 'cost_kind', 'cost', 'needed_instead', 'docs', 'docs_ref', 'again'], p);
        if (typeof f.id !== 'string' || !/^F[1-9][0-9]*$/.test(f.id)) errors.push(`${p}.id: must match ^F[1-9][0-9]*$`);
        if (!isIntRange(f.sev, 1, 3)) errors.push(`${p}.sev: integer 1..3 required`);
        if (!isIntRange(f.sure, 1, 3)) errors.push(`${p}.sure: integer 1..3 required`);
        if (!COST_KINDS.includes(f.cost_kind)) errors.push(`${p}.cost_kind: must be one of ${COST_KINDS.join(', ')}`);
        if (!['silent', 'documented_but_screen_silent'].includes(f.docs)) errors.push(`${p}.docs: must be silent or documented_but_screen_silent`);
        if (f.docs === 'documented_but_screen_silent' && !isNonEmpty(f.docs_ref)) errors.push(`${p}.docs_ref: required when docs is documented_but_screen_silent`);
        if (f.docs_ref !== undefined && typeof f.docs_ref !== 'string') errors.push(`${p}.docs_ref: must be a string`);
        for (const k of ['screens', 'moment', 'cost', 'needed_instead', 'again']) {
          if (!isNonEmpty(f[k])) errors.push(`${p}.${k}: required non-empty string`);
        }
      });
    }
  } else {
    errors.push(`role: must be "specialist", "code-reader", or "journey" (got ${JSON.stringify(doc.role)})`);
  }

  const out = { valid: errors.length === 0, role: isObj(doc) ? doc.role ?? null : null, findings: isObj(doc) && Array.isArray(doc.findings) ? doc.findings.length : 0, errors };
  if (flag('json')) console.log(JSON.stringify(out, null, 2));
  else if (out.valid) console.log(`chaos validate-report: OK (${out.role}, ${out.findings} finding(s))`);
  else {
    console.error(`chaos validate-report: INVALID (${errors.length} error(s))`);
    for (const e of errors) console.error(`  - ${e}`);
  }
  process.exit(out.valid ? 0 : 2);
} else {
  fail('usage: chaos.mjs deal | note | triage | verdict | summary | plan-waves | validate-report  (see the top of the file)');
}
