# Skill: /forge-ui-review

**Purpose:** A pure UI/UX review of a running screen — does it *make sense* to a person using it? Spacing, alignment, visibility of every state, readability, feedback. Findings only; no implementation.

Use it on its own (`/forge-ui-review <url or task path>`). `/forge-pilot` runs it automatically, through the `qa-ux` lens, on every task that creates or changes a screen, next to the flow test (`/forge-flow-test`): that one judges what the screen does, this one how it looks.

**Why a dedicated skill:** UI defects hide in *combinations* a normal screenshot never shows — a field that is invalid **and** focused, the longest valid text on the narrowest screen, an empty list next to an error. A reviewer who looks at one happy-path capture approves them. This skill forces the combinations and **measures** what the eye misjudges.

## Inputs

- A URL, or a task path (then: `forge/project.md` → `commands.dev` / `commands.url`, and the task's `viewports`, `interaction_states`, `visual_refs`)
- Optional: references (mockup, design tokens) — without them, judge internal consistency
- When they exist: `docs/ui-canon.md` (the app's scales, patterns, words and the screen's state matrix: judge consistency **against it**, not against taste) and the screen's entries in `docs/sweep-ledger.md`. A validated entry is not re-argued without new evidence (`forge/packs/core/rules/sweep-ledger.md`). Deeper checks with ids: `forge/packs/core/skills/forge-ux-sweep/rubric.md`
- Read: `forge/project.md`, `forge/packs/visual-qa/rules/visual-qa.md` § Capturing screenshots

## Procedure

### 1. Run it
Start the app in the background, stop it when done (`forge/packs/core/rules/shell-commands.md`). No app, no review — say so instead of judging from code.

### 2. Build the state matrix
List the screens' **states** and **viewports** before looking at anything:

- widths: the task's list, else the canon's width matrix, else 360 · 768 · 1280 · 1920. The other widths are covered by `node forge/packs/visual-qa/tools/run-ui-sweep.mjs --url <url> --between 80 [--before …]`: one command probes the whole matrix plus every 80px in between, and lists each defect with the widths where it shows
- states: empty · filled · loading · error (after a rejected action) · success · disabled — plus the task's own
- **the screen's existing main flows**, each used once (create, delete, navigate…) — a change is not done if the action next to it is broken, whether it broke now or before
- **failure that is not a field error:** the item was deleted elsewhere, the server does not answer
- for each interactive control: default · hover · **focus** · disabled · **invalid** · **invalid + focus** · selected

### 3. Capture and measure each cell
For every viewport × state, one command gives the screenshot and the measurements:

```bash
node forge/packs/visual-qa/tools/run-ui-probe.mjs --url <url> [--mobile | --width N --height N] \
  --before "<JavaScript that puts the page in the state>" --screenshot <file.png> --json <file.json>
```

Each run is a fresh browser with an empty profile — nothing carries over. `--before` clicks, fills and submits (never navigate or reload in it); `--seed` prepares storage before the app starts; `--reload` reloads after `--before` to check that a state persists; `--hover <selector>` shows a hover style. With `--json` the terminal gets a short summary that also says what was checked (overflow, number of controls, whether focus was judged). Always include one run with **the longest valid input in every field** and one **after a rejected submit**. The probe (`forge/packs/visual-qa/tools/ui-probe.js`) reports: page or element overflow, clipped text, low contrast, small touch targets, focus that is not visible, **a state hidden by the focus ring**, unlabelled controls, uneven control heights in a row, near-duplicate spacing values, tiny text. It needs a system Chrome/Chromium/Edge and nothing installed in the project.

A probe finding is evidence, not a verdict: open the screenshot and confirm it is a real problem for a user before reporting it.

**The probe sees geometry and colour, not meaning.** It will not tell you that a confirmation appears off-screen, that two pieces of text run together, that the wording is unclear or that the order of things is illogical. Those come from step 4 — in the first run of this skill, two of the five real findings were ones the probe could not see.

### 3b. Detail, component by component
Run `/forge-ui-detail` (`forge/packs/core/skills/forge-ui-detail/SKILL.md`) on each state worth it: at least the filled state and the state after a rejected submit. It produces close-ups of every component, side by side, at every width, plus a layout sheet with the content column's lines. Each is checked against seven principles and an anatomy card per component type. The questions below are for the page as a whole; the components are judged there.

### 4. Look, with these questions
Open every screenshot. For each, answer — a "no" is a finding:

- **Hierarchy:** is it obvious what the screen is for and what to do first? Is the primary action the most visible thing?
- **Spacing rhythm:** do related things sit closer than unrelated ones? Is the same gap used for the same relationship everywhere (probe: spacing values)?
- **Alignment:** do edges and baselines line up — labels with fields, fields with each other, buttons with the form?
- **State visibility:** can you tell, at a glance and without colour alone, which field is in error, which is focused, which is disabled, what is selected?
- **Feedback:** after each action, does something visibly confirm it (or explain the refusal) next to where the user is looking?
- **Keyboard and focus:** can everything be done without a mouse, and after each open / Save / Cancel / error is focus somewhere sensible (never on the page body)? Is each error tied to its field for a screen reader?
- **Readability:** line length, text size, contrast, truncation — can a real name, a real address, a long word be read?
- **Every width:** does each band (phone, tablet, desktop, wide) have a layout made for it? Is anything squeezed, stretched across a wide screen, scrolled sideways, or missing at some width? Are targets reachable with a thumb?
- **Consistency:** does this screen look like the others (tokens, components, wording)? With references: zone by zone.

### 5. Report
Reply with a verdict (`pass | fail` — fail on any Critical or High) and at most 10 findings:

| Severity | Where (viewport · state · element) | What is wrong | Evidence (screenshot, probe rule, measurement) | What correct looks like |

Then *Checked and found correct* (so a pass is more than an empty table) and how the captures were taken. Severity: `forge/packs/core/rules/execution-contract.md` § Severity — a layout broken by valid input or an unusable control is High; a state a user cannot see at all is Medium — Low when something else still says it (an error border hidden by the focus ring, but a visible message under the field); rhythm and alignment issues are Low unless they mislead.

Standalone run on a task: you are a judge — append the findings to the task's `review.md` as a `## UI review — <date>` section, and keep captures under the task's `evidence/ui-review/`. No task: reply only. Leave no failed-run files behind.

## Anti-goals

- No code edits; no redesign proposals beyond "what correct looks like"
- No verdict from the code or from the author's screenshots alone
- No "looks fine" without the state matrix and the measurements
- No reporting a probe line you did not confirm on the screenshot
- No new dependency in the project to take pictures
