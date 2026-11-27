# Visual QA & fidelity protocol

Load when any of:

- `visual_qa` is `optional` or `required` in `forge/project.md`
- Task has UI in scope (routes/components/templates)
- Task lists mockup / screenshot / HTML / Figma export / `visual_refs`

**Frontend output quality is a first-class gate.** Weak visuals break automation and burn human time — treat fidelity as strictly as unit tests when a reference exists.

Also: `forge/packs/core/rules/execution-contract.md` (the probe gate on every UI change; a UI review on every screen created or changed — § UI rule).

## Task fields (set by `/forge` when UI)

```yaml
visual_fidelity: none | interpretive | pixel
visual_refs: []          # explicit accepted files (images/HTML/PDF) — never a bare folder; see § SSOT lock
viewports: []            # only list what DoD requires — no silent 3-viewport mandate
interaction_states: []   # default / empty / loading / error / …
```

### Choosing fidelity (auto — do not ask unless ambiguous)

| Situation | Mode | Ceremony floor |
|-----------|------|----------------|
| No UI / no reference | `none` | may `lite` if micro |
| User attached mockup/HTML/screenshot (“look like this”) | at least **`interpretive`** | ≥ **`standard`** |
| Says pixel-perfect / visual regression / Playwright screenshot | **`pixel`** | prefer **`governed` / `strict`** |
| `visual_qa: required` + UI | at least **`interpretive`** | ≥ **`standard`** |
| Multi-viewport or multi-state workflow in DoD | interpretive or pixel | **`standard`** (governed only for pixel) |
| Pure logic API, no UI | `none` | — |

## SSOT lock (Align produced multiple proposals)

When Align generated several design proposals (HTML/PNG/PDF) and the human picked one, close the pick **in the file tree** — cold agents never see the Align chat:

1. **Split on pick** — accepted file(s) → an `ssot/` folder (or equivalent clearly named); non-picked → `dna/` or `align-archive/`. Never leave winners and losers mixed in one flat folder.
2. **README at the proposals root** — states `pick locked: <option> (<date>)`, **links each SSOT file**, and says explicitly: *dna is history / style DNA — not an open choice*.
3. **`visual_refs` = the explicit SSOT file list** — one path per accepted file. A bare folder ref while SSOT files exist = procedure fail (Quality blocks).
4. **DNA is secondary** — rejected options may be cited only as labeled inspiration (`dna:` prefix in Notes), never as a primary target.
5. Reopening a rejected option requires a **human** Align decision — never agent judgment.

## Modes

### `none`
No visual gate. Still fix obvious broken layout if you touch UI incidentally.

### `interpretive` (structure fidelity)
Implementation must match reference on:

- Hierarchy / sections / primary controls present
- Layout direction and spacing **spirit** (not casual rearrangement)
- Empty / loading / error if shown in reference, AC, or `interaction_states`
- Light/dark if project supports and reference implies it

**Evidence:** screenshots in `evidence/` for each **listed** viewport/state + short diff notes vs reference.  
**Major deviation** = **High/Critical** → FAIL.

### `pixel` (regression fidelity)
- Playwright `toHaveScreenshot()` (or equivalent) **required** for in-scope surfaces when the project has (or task adds) that harness.
- Compare against committed baselines **or** against provided reference images with documented tolerance.
- Missing screenshot test when `pixel` is set = **Critical blocker** (no soft skip — write `UNVERIFIED PIXEL` only as FAIL note).
- Update baselines only with explicit task/human approval.

## Viewports & states

Capture **every viewport** listed on the task — if the list is empty and fidelity ≠ none, default to the project’s primary viewport only (document it); do **not** invent mobile+tablet+desktop unless DoD says so.  
Interactive states in AC / `interaction_states` → capture each applicable state.

## Code obligations (visual loop)

Before self-check PASS on UI tasks with refs:

1. Implement against the reference (open the files — not from memory).
2. Capture each listed viewport × state into `evidence/` with `forge/packs/visual-qa/tools/run-ui-probe.mjs` (the same runs as the UI probe gate).
3. **Open** every required shot and compare it with the reference zone by zone; fix the gaps.
4. Write `evidence/visual.md` (template below): one entry per viewport × state, and every intentional deviation with its reason.
5. `pixel` mode: a screenshot assertion or baseline is required — otherwise stop and say so.
6. Do not regenerate endlessly: after serious attempts, hand over with the remaining gaps listed.

## Capturing screenshots

Tool order, first that works:

0. **`forge/packs/visual-qa/tools/run-ui-probe.mjs`** — ships with this pack: system Chrome, no dependency, one command for a screenshot **and** the UI measurements of `forge/packs/visual-qa/tools/ui-probe.js`, in any state you can reach with a line of JavaScript. Use this unless it cannot run.
1. The host's browser tool — only if it can save an image file to disk
2. The project's own Playwright (or equivalent), when it already has one
3. A throwaway headless-browser script in any scratch directory **outside the repo** (e.g. system Chrome `--headless --screenshot`, or driven over the DevTools protocol for clicks and typing) — never add a dependency to the project just to take pictures, and do not commit the script
4. Manual capture by the human — only when 1–3 are impossible; say so

Start the app in the background with `forge/project.md` → `commands.dev`, stop it when done (`forge/packs/core/rules/shell-commands.md`).

A viewport named by width only is captured full-page at a common height (desktop 1280×800, mobile 375×812) unless the task says otherwise; use a taller window when a real click needs its target in view. For layout across all widths, `forge/packs/visual-qa/tools/run-ui-sweep.mjs` probes a whole width matrix (and the widths in between) in one command.

## When the reference is imperfect

- **A reference that renders differently from its evident intent** (a stretched badge, a misaligned field caused by the mockup's own CSS): follow the intent, and list the difference under `deviations` with the reason. An unlisted deviation is a finding; a listed, reasoned one is judged on its merits.
- **A viewport or state the reference does not draw**: build it consistent with the drawn ones, mark `vs_ref: no-ref`. The tester judges consistency, not fidelity — do not render the reference at a viewport it was not drawn for.

## Quality / qa-ux lens obligations

The tester does not trust the author's screenshots — it produces its own (`forge/packs/core/personas/lenses/qa-ux.md`).

1. Open `visual_refs`; run the app (`forge/project.md` → `commands.dev` / `commands.url`).
2. Capture each listed viewport/state → `evidence/qa/`; zone-by-zone verdict of **those** shots vs refs, then vs the author's `evidence/visual.md`.
3. If fidelity ≠ `none` or refs set and evidence missing → **FAIL**. App could not be run → `evidence: author-only` recorded in the Quality round: FAIL for `pixel`, High otherwise unless the human accepted it.
4. If `pixel` and no screenshot assertion/baseline flow → **FAIL**.

## Evidence template (`evidence/visual.md`)

```markdown
# Visual evidence
- fidelity: interpretive | pixel
- refs: …
- tool: playwright | harness-browser | headless-chrome | manual
- viewports:
  - name: desktop          # one entry per viewport × state; state names = the task's `interaction_states`
    state: empty
    shot: evidence/…
    vs_ref: pass | fail | no-ref   # no-ref = the reference does not draw this viewport/state; judged on consistency with the drawn ones
    notes: …
- deviations:              # every intentional difference from the reference, with the reason
```

## Never

- Claim UI done because “it compiles”
- Ignore an attached mockup
- Pass Quality without evidence when a reference exists
- Classify UI+refs as `lite` / `min`
- Let a UI change go out without the probe gate, or a new or changed screen without its two testers (flow test + UI review)
- Infinite regenerate-screenshot loops — max 3 Quality rounds still applies
- Mandate three viewports when the task lists one
