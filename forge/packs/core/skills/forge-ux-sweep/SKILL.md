# Skill: /forge-ux-sweep

**Purpose:** The deep UX/UI audit of the **whole running app**. Every screen, every state of its matrix and every viewport is judged against one rubric (`rubric.md`, next to this file) and against the app's own canon. The defects it finds are fixed on a branch. The human gets one illustrated report, with every defect's capture before and after.

`/forge-sweep` walks what the app **does** and reviews each screen with the probe and the rubric's light checks. This skill applies the **whole** rubric to every screen: hierarchy, rhythm, type, colour, states, keyboard, navigation, words, small screens, and the *lean* pass. Like the sweep, it is exhaustive on every run.

**It converges.** It can run every night on the same code without redesigning the same screen every night. It shares the ledger of `/forge-sweep` (`forge/packs/core/rules/sweep-ledger.md`):

- fixed defects are replayed first, as guards;
- a finding counts only if it is reproduced twice;
- every fix aims at an objective target (a threshold or a canon value), so a fixed screen has nothing left to fix;
- no fix undoes an earlier sweep;
- what the human settled stays settled until a trigger reopens it, and a defect is never silenced by an agent.

**Ugly and hard to use are findings too, and they are made deterministic**:
- *Hard to use* is measured by tasks. A first-time-user persona walks the canon's tasks and counts steps, hesitations and dead ends against targets.
- *Ugly* is judged against the **direction** written in the canon, not against a reviewer's taste.
- A clarity or polish finding counts only when **two independent reviewers** agree on it.
- A polish fix is kept only if a **blind A/B judge** prefers the after capture. The screen is then `polished` and is left alone until its code or the direction changes.

## Inputs

- Nothing (the whole app), or screen ids or **area names** to limit the run. A project with areas, nothing said and a human present → main asks which area first (`forge/packs/core/rules/areas.md` § 3b); a scheduled run takes the whole app. A shared component is still verified on every screen in its `uses`, whatever the area. Optional words:
  - `report-only`: find, do not fix;
  - `light`: only the checks marked **L**, on the screens changed since the last UX sweep, with no spot check;
  - `max-screens <n>`.
- Read:
  - `forge/project.md` (`commands.dev`, `commands.url`, `commands.test`, optional `commands.reset`);
  - `docs/features.md` when present;
  - `docs/ui-canon.md` and `docs/sweep-ledger.md`;
  - the latest `epics/sweeps/ux-*.md`;
  - `epics/to-sweep.md`, the queue of what shipped since the last sweep;
  - `forge/packs/core/rules/shell-commands.md` — main and every agent it spawns: never wait in a loop, read while a command runs.
- **The report's language** is the one the human writes in, as in `/forge-sweep`.

**It never waits for a human**, the area question of an interactive run aside. Every decision it cannot take goes under *Needs you*, and it carries on.

## Who does what

Main orchestrates, applies the ledger and writes the report. It reviews nothing and fixes nothing itself. Every reviewer and every fixer is a fresh agent spawned by main (no nested spawns):

- at most 3 at once, on the parent's model unless `forge/project.md` says otherwise;
- each with a scratch folder of its own;
- reviewers create only records prefixed `ux-<screen>-` and touch nothing else.

## Procedure

### 0. Before anything
Do what `forge/packs/core/skills/forge-sweep/SKILL.md` § 0 says:

- clean tree;
- the gallery ignored in git;
- disposable data only;
- `commands.test` first (a red result is finding 1);
- `commands.reset`, then the app started once by main.

The branch is **`forge/ux-sweep-<YYYY-MM-DD>`**. **Never push, never merge.**

### 1. Canon and screens — `docs/ui-canon.md`
- **Missing** → build it (template `forge/packs/core/templates/ui-canon.md`):
  - Scales: read them from the source of truth (tokens, theme, CSS variables, Tailwind config). With none, run the probe once per screen and keep what most of the app uses.
  - Patterns, one line each.
  - Words: the terms in use, and every pair of words used for the same thing.
  - **Direction**: proposed from what the app already does best. Its most finished screen becomes the reference, plus an external system if the human named one. Each line is one sentence (tone, density, hierarchy, surfaces, accent use, icons).
  - **Tasks**: the core tasks of each feature, with a start screen, the **start action** (the name of the control that begins it), and a target in steps equal to the shortest path the persona finds plus 2.
  - **Priorities**: empty until the human writes them. The default applies: readability, margins and spacing, not overloaded, main features easy to find.
  - **Budget** per screen: the first run records the probe's `load` (controls, framed boxes, filled buttons on the first screen) at each viewport.
  Direction and Tasks drive the polish and usability findings. Until a human confirms them, polish fixes are proposals only (*Needs you*), never automatic.
  - Screens, one block each, with `code`, `uses` and a **fixed state matrix** (rubric § F1), from `docs/features.md` or the routes.
  Mark it `status: draft — unconfirmed`. A scheduled run uses it as it is and says so in the report.
- **Present** → check for drift:
  - a screen with no block → `new — unconfirmed`;
  - a block whose route is gone → reported, not silently dropped;
  - a new value in the source of truth → added to the scale;
  - a canon value no longer used → *Needs you*.
- **An older layout** (a UI canon or a sweep ledger still beside `forge/project.md`): move them first (`forge/packs/core/rules/product-docs.md` § 0.1).
- **Vision, map and off the map**: read `docs/vision.md` § 5 (the UI and UX direction) before the canon's own Direction; when the two disagree, or when the screens have left them both, that is a vision proposal for the end of the run (`forge/packs/core/rules/product-docs.md` § 2). A screen the app shows and no document mentions is reviewed like the others and proposed for the map (§ 3 and § 4).
- **The canon's matrix is the fixed part of every run.** A state a reviewer adds while exploring is proposed for the matrix, rather than improvised again next time.

**The sweep queue — `epics/to-sweep.md`.** Each line is a task closed since the last sweep, with the screens it touched and who judged it. Order: the **queued screens first**, `judged: no` before the others, then `judged: light` (work from `/forge-light`, `lite` or `/forge-debug` never had a UI reviewer). Then screens of `core` features, then the screens changed since the last UX sweep (through `code` and `uses`), then the rest. `max-screens` never cuts a queued screen. A queued screen's reviewer also gets the matching entry of `epics/decisions.md`, and checks each point of *Check in particular*. A queued screen missing from the canon gets its block now.

### 2. Replay the guards
Before any review, one fresh agent replays every `fixed` UI entry of the screens in scope, in `--stable` mode: its capture command, and its steps when it has steps.
- Passes → it counts in `stability.guards`.
- Fails → a `regression` finding, one severity level higher.

### 3. Review — one reviewer per screen
Each reviewer follows `forge/packs/core/skills/forge-ui-review/SKILL.md` (state matrix, probe on every cell, the questions of its step 4). For every state of the matrix, it runs `/forge-ui-detail` (`forge/packs/core/skills/forge-ui-detail/SKILL.md`): close-ups of every component at every width, against the principles and the anatomy cards. It also applies **the whole rubric**, whose § D is that detail review.

- **Give it**: the screen's canon block, and the canon's § Scales, Patterns and Words; the screen's ledger entries; the open findings on that screen from the last UX report.
- **Fixed part first**: the canon's state matrix in its order, at the canon's widths, with the probe in `--stable` mode. Then, for each state, one `run-ui-sweep.mjs --between 80` across the width matrix, which catches what breaks between two captured widths. Then exploring.
- **Settled entries are context, not a gag.** A `validated`, `decided` or `asked` entry is not re-argued. New evidence against one is reported, with the entry's id and the trigger.
- **It returns findings** in the shape of `forge/packs/core/rules/execution-contract.md` § What every judge returns. Each finding carries:
  - its fingerprint (`screen · element by role and name · check id`);
  - its kind;
  - the measurement;
  - the **acceptance line** (an objective target);
  - the reproduction;
  - like `/forge-sweep` § 3: a capture of what the user sees and the exact capture command.
  Then *Checked and found correct*, check by check, so that a quiet screen can be told from a screen nobody looked at. Then at most 3 preference suggestions.

**A second reviewer per screen, for clarity and polish only.** It works from the first reviewer's captures (no browser needed) and gets the direction and the rubric's § H, § X and § P. It does **not** see the first reviewer's findings. A judgement or polish finding counts only when both name the same fingerprint, in the same direction. A finding only one of them raised goes to `stability.flaky`, under the heading *raised by one reviewer only*. This is what makes "it looks bad" as reproducible as a bug.

**Other browser engines.** After the screen reviews, main runs `forge/packs/visual-qa/tools/run-engine-diff.mjs` on each screen, exactly as `/forge-sweep` § 3 describes (*Other browser engines*): only the differences from Chromium, confirmed by one reviewer on the screens that differ, skipped with a line under `notTested` when the engines are not installed. The Chrome review above is unchanged by it.

**Plus, once per run:**
- **The first-time user**: one fresh agent with no knowledge of the code walks every task of the canon (rubric § U) at desktop and phone width, from its start point and its sentence only. Per task it reports the steps taken, the hesitations (with the element that caused each), dead ends and errors. It then walks the same tasks a second time from a clean start: only counts that agree across both walks are kept.
- **The app as a whole**: rubric § N, § W, and the cross-screen half of § S and § C. It works from the screen reviewers' captures and walks the app itself only where those are not enough.
- **A reviewer with no ledger** on the 2 or 3 screens whose entries are the oldest, in rotation. It gets no ledger and no previous report. This is the guard against a ledger that hides things (rule § 5). Not with `light`.

### 4. Consolidate — main, with the ledger
Main merges; it does not re-judge.

1. **Reproduced twice.** A fresh agent re-runs every finding's capture command and steps from a fresh browser. Not reproduced → `stability.flaky`: not counted, not fixed.
2. **One defect, one line.** The same root cause on several screens or viewports is one finding with its sightings. When severities differ, keep the higher one.
3. **Kind and agreement.**
   - A measured failure filed as polish or preference is a defect.
   - A polish finding with no basis in the direction is a preference, and a preference becomes a suggestion.
   - A judgement or polish finding that the second reviewer did not also name is set aside (rule § 2).
4. **Ledger** (rule § 3), finding by finding. The outcome is one of:
   - `new`, `still-open`, `regression`, `reopened` or `new-rule`;
   - silenced, under `stability.silenced`;
   - waiting, under `stability.waiting`;
   - deferred.
5. **Spot check.** A defect the no-ledger reviewer found under a `validated` entry → remove that entry; the finding stands.
6. **Priorities and grade.** A finding in one of the canon's priority families goes up one severity level (to High at most) and is listed first. Then grade each screen and the app (rubric § Grade): overall, **Works** and **Looks**. Compare with the last UX report.
7. **The report data**: `epics/sweeps/ux-<date>/report.json`, in the format of `forge/packs/core/templates/sweep-report.json`, with:
   - `"kind": "ux"`;
   - one entry per screen in `features`, with the cells walked in `flows` and the grade with its trend in `ui` (`B 84 ← C 72`);
   - findings `U-1`, `U-2`, …, each `where` naming the viewport and state;
   - captures in `img/U-<n>-before.jpg`;
   - `stability`;
   - suggestions and the spot-check result as `sections`.
   Write the text **for the person who owns the product**. Render it with `node forge/packs/core/tools/sweep-report.mjs epics/sweeps/ux-<date>/report.json`, fix every warning, and commit `epics/sweeps/ux-<date>.md` now, before any fix.

### 5. Fix (skipped with `report-only`)
**Fixed automatically:**
- every **defect** addressed to `code` whose acceptance line names an objective target: a threshold, a canon value, or a state built in the canon's pattern;
- a judgement finding **only** when its acceptance line makes it just as objective ("one filled button in the view", "error under the field like the other forms").

- every **usability** finding whose fix stays within the screen's existing layout and patterns: move an action into view, a better default, fewer steps through an existing pattern, a clearer label from the canon's words;
- **polish**, once the canon's direction is confirmed: **one polish batch per screen per run**, at most 4 screens per run. It covers that screen's agreed polish findings and brings the screen onto the direction and the canon's surfaces, scales and icons. It never touches what the screen does or its layout of features. Screens with the lowest **Looks** sub-grade go first.

**Never fixed automatically — it goes under *Needs you*, as a proposal with its acceptance line:**
- any other judgement finding (hierarchy, grouping, wording and density are product calls);
- any change to the canon itself;
- a preference;
- a usability fix that needs a new flow or a new layout;
- polish while the direction is still `draft — unconfirmed`;
- what the sweep rule excludes (auth, permissions, payments, personal data, schema);
- a fix that redesigns more than the element in question;
- **anything that adds behaviour**: wiring a control that does nothing (a search that does not filter, an export that exports nothing), a new button, a new flow, a confirmation step. The finding is a real defect, but what the control should do is a product decision. The only exception is restoring behaviour that a guard or the canon already describes; **Not** adding behaviour: a link or button that only navigates to a screen that already exists (an empty state's "Go to Gear", a visible start action that opens the place where the task already begins). That is presentation and is fixed automatically; it is how a hidden main action becomes findable (rubric U2).
- removing a control, even a dead one;
- a layout change **other than** the per-band layouts of the anatomy cards. Making a screen work at every width is fixed automatically. It follows the canon's patterns for each band, or the *Per band* lines of `forge/packs/core/skills/forge-ui-detail/anatomy.md` when the canon says nothing. Its acceptance is the detail review passing: no finding under the principles fit, clearance or alignment at any width of `run-ui-sweep.mjs --between 80`, and the layout sheet clean. Its captures in the four bands go to the blind A/B judge like a polish batch. A desktop layout squeezed onto a phone, or stretched across 1920px, is a broken screen, not a design decision. Any other change of layout (moving blocks, a new navigation model) stays a decision;
- product copy beyond the canon's Words: renaming a verb, rewriting help text, legal links;
- any change on a screen the canon names as the reference, unless the finding is a measured defect.

Batches, fixers, commits, the probe gate, regression tests and the **never-undo check** follow `forge/packs/core/skills/forge-sweep/SKILL.md` § 5. One difference: a batch is one screen or one shared component. A shared-component fix is verified on every screen in its `uses`. Commits are `fix(ux-sweep): <what> [U-<n>, …]`.

### 6. Verify
Main restarts the app on the fixed code. A fresh reviewer re-runs **only** the cells of the fixed findings: the same capture command into `img/U-<n>-after.jpg`, the acceptance line checked, and the element's neighbours looked at.
- Acceptance met and neighbours fine → `fixed`, with its commit.
- Otherwise → main reverts that batch, as in `/forge-sweep` § 6.
- **A polish batch also needs the blind A/B judge.** This fresh agent is shown, for each screen and viewport, the before and after captures in random order, labelled only A and B. It gets the canon's direction and the § P checks the batch claims to fix, and picks the one that follows the direction better, or "no difference".
  - The after picked on every viewport → `fixed`, and the screen is recorded `polished`.
  - Otherwise → the batch is reverted, and its findings are recorded `validated` with the A/B result, so the same restyle is not proposed again on unchanged code.
- **A usability fix** is checked by the first-time user walking the task again: the step count must reach the target.
- A new defect met while re-checking → `open`, `why: found while checking the fixes`, for the next run.

### 7. Close
1. **Sweep queue**: for each queued commit whose screens this run reviewed, `node forge/packs/core/tools/sweep-queue.mjs swept --commit <sha> --by ux --result "ok"` (or `"n findings"`); add `--done` once `/forge-sweep` has covered it too.
2. **Ledger** (rule § 4):
   - `fixed` for every verified fix, with its `capture`, `acceptance` and `measured`: these are its guards. For a usability fix, the task's new step count is the guard;
   - `polished` for every screen whose polish batch the A/B judge preferred;
   - `validated` for the judgements kept;
   - `asked` for the new questions;
   - `decided` for the human answers;
   - `declined` for the suggestions not taken up.
   **Canon**: add the non-controversial drift and `last reviewed`. Anything else goes under *Needs you*.
3. Complete the report data, render it again (no warning left), and add one dated line to `epics/decisions.md`. Commit on the UX branch: `epics/sweeps/ux-<date>.md`, the sweep queue, the ledger, the canon and the journal.
4. Go back to the starting branch and **commit the same files there, as one commit with no code**. Leave the tree clean. If nothing was fixed, delete the UX branch.
5. **Final message**, 15 lines or fewer:
   - screens reviewed;
   - the grade, then and now, with **Works** and **Looks**;
   - guards replayed and failed;
   - findings by kind and severity, regressions included;
   - how many were fixed, reverted, silenced, flaky, touched again and waiting;
   - the spot-check result;
   - what needs the human;
   - **the path of `epics/sweeps/ux-<date>/index.html`**, and the branch.

## Anti-goals

- No finding from preference, and no suggestion re-made after it was declined. Ugliness is judged against the direction, not against a mood.
- No polish finding raised by one reviewer only. No polish fix kept without the blind A/B judge preferring it. No restyling of a `polished` screen without a trigger.
- No fix that undoes an earlier sweep or a settled decision.
- No finding seen only once. No question re-asked in new words. Nothing silenced without being named in the report.
- No `validated` for a defect, and no `deferred` written by an agent.
- No consistency verdict against a value that is neither in the canon nor in the page's own dominant pattern.
- No grade for a screen whose matrix was not walked.
- No redesign in the name of a finding. No code change on the starting branch. No push, no merge, no captures in git.
