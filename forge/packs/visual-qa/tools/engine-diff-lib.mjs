/*
 * Pure comparison of two UI probe reports taken in two browser engines at the same width and state.
 * Used by run-engine-diff.mjs; kept apart so it can be tested without any browser.
 *
 * Only differences are returned: what one engine shows and the reference does not.
 */

// Rules that depend on how an engine paints focus or reports it: compared only when both judged focus.
const FOCUS_RULES = new Set(['focus-not-visible', 'state-hidden-by-focus']);
// Geometry may differ by a few pixels between engines (font metrics, form controls): not a difference.
const TOLERANCE = 6;

const key = (f) => `${f.rule}|${f.target}`;

export function diffReports(reference, other, { tolerance = TOLERANCE } = {}) {
  const focusComparable = reference.checks?.focusJudged && other.checks?.focusJudged;
  const usable = (f) => focusComparable || !FOCUS_RULES.has(f.rule);
  const inRef = new Set((reference.findings ?? []).filter(usable).map(key));
  const inOther = new Set((other.findings ?? []).filter(usable).map(key));

  const onlyHere = (other.findings ?? []).filter((f) => usable(f) && !inRef.has(key(f)));
  const onlyReference = (reference.findings ?? []).filter((f) => usable(f) && !inOther.has(key(f)));

  // Same component, different place or size: a layout that renders differently without breaking a rule.
  const byName = (list) => {
    const seen = new Map(); const out = new Map();
    for (const c of list ?? []) {
      const base = `${c.type}|${c.name}`;
      const n = seen.get(base) ?? 0; seen.set(base, n + 1);
      out.set(`${base}|${n}`, c);
    }
    return out;
  };
  const refComponents = byName(reference.components);
  const otherComponents = byName(other.components);
  const moved = [];
  const missing = [];
  for (const [id, c] of refComponents) {
    const o = otherComponents.get(id);
    if (!o) { missing.push({ type: c.type, name: c.name, in: 'reference only' }); continue; }
    const d = { x: o.box.x - c.box.x, y: o.box.y - c.box.y, w: o.box.w - c.box.w, h: o.box.h - c.box.h };
    const worst = Math.max(Math.abs(d.x), Math.abs(d.w), Math.abs(d.h));
    // A vertical shift alone usually comes from an element above: report width, height and horizontal position.
    if (worst > tolerance) moved.push({ type: c.type, name: c.name, reference: c.box, here: o.box, delta: d, worst });
  }
  for (const [id, c] of otherComponents) if (!refComponents.has(id)) missing.push({ type: c.type, name: c.name, in: 'this engine only' });
  moved.sort((a, b) => b.worst - a.worst);

  const pageErrors = (other.pageErrors ?? []).filter((e) => !(reference.pageErrors ?? []).includes(e));
  const overflow = !other.checks?.pageOverflow?.ok && reference.checks?.pageOverflow?.ok
    ? { scrollWidth: other.checks.pageOverflow.scrollWidth, viewport: other.checks.pageOverflow.viewport } : null;

  const count = onlyHere.length + moved.length + missing.length + pageErrors.length + (overflow ? 1 : 0);
  return {
    same: count === 0,
    count,
    overflow,                 // sideways scroll in this engine only
    pageErrors,               // errors thrown in this engine only
    onlyHere,                 // probe findings in this engine only
    onlyReference,            // findings the reference has and this engine does not (informative)
    moved: moved.slice(0, 12),
    missing: missing.slice(0, 12),
    focusCompared: Boolean(focusComparable),
  };
}
