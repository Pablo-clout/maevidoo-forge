# UX rubric — what a UI reviewer checks, and how sure it can be

`rubric: 8` — the version is written in every report. A check added or changed in a later version produces findings marked `new rule`, never `regression`: the app did not get worse, the ruler changed.

Used by `/forge-ux-sweep` (every check) and `/forge-sweep` (the checks marked **L**, on every screen it reviews). Each check has an id (the third part of a finding's fingerprint, `forge/packs/core/rules/sweep-ledger.md`) and a **kind**:

- **defect**: measured, or plainly broken. Evidence is a number against a threshold or the canon, or a reproduction. Never silenced by the ledger.
- **usability**: hard to use, **measured by a task**. A first-time user persona runs the canon's tasks (§ Tasks) and counts steps, hesitations, dead ends and errors against each task's target. A task over its target is a finding with a number: as objective as a defect.
- **judgement**: a reader's assessment of clarity (hierarchy, grouping, wording, order). Evidence is the screenshot and a sentence on what the user would miss. It counts only when **two independent reviewers** name the same fingerprint, in the same direction.
- **polish**: it looks unfinished, crude or ugly. It is judged against the **direction** written in the canon (§ Direction), never against the reviewer's own taste, through the § P checks. Like judgement, it counts only when two independent reviewers agree. A fix is kept only if a blind before/after comparison prefers it.
- **preference**: a style choice that neither the canon's direction nor a user problem supports ("I'd use another font"). **Never a finding**; at most a suggestion.

**Why this makes beauty deterministic.** A reviewer's taste changes from run to run; three things do not:
- the **direction**, chosen once and written in the canon;
- **two reviewers agreeing** without seeing each other's work;
- a **blind A/B judge** that has to prefer the result.

Once a screen has been polished and the A/B judge preferred it, the screen is `polished` in the ledger. It is not restyled again until its code changes, the direction changes, or a human reopens it. That is what keeps ten runs from restyling the same screen ten times.

How a finding is written, whatever its kind: *where* (screen · element by role and name · viewport · state) · *what the user hits* · *evidence* (measured vs threshold or canon value, screenshot) · *acceptance* (the check that will say it is fixed: "gap between label and field 8px like the other fields", "one filled button in the view"). A finding without an acceptance line cannot be fixed or verified — rewrite it or drop it. The same defect at several viewports is **one** finding listing them.

Thresholds below are working defaults. Where `docs/ui-canon.md` sets a value, the canon wins. Where the app has no token file, consistency is judged against **the page's own dominant pattern** (what at least two thirds of look-alike elements do), never against a grid imposed from outside.

## H — Purpose and hierarchy

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| H1-job | L | judgement | Before judging, write the screen's job in one line (who comes here, to do what). Every other answer is relative to it. A screen whose job you cannot state from the screen itself is a finding. | read the screen |
| H2-primary-action | L | judgement | The thing to do first is the most visible thing, found in a glance (≈ 3 s). At most one filled primary action per view (the canon may say otherwise). | screenshot; count of primary-styled buttons |
| H3-heading-scale | | defect | Heading levels are clearly apart: main heading ≥ 1.5 × body text or clearly bolder; adjacent levels ≈ 1.2× or more apart. | probe `flat-hierarchy`, `typography.sizes` |
| H4-reading-order | | judgement | The eye goes in the order of the job: title → context → content → action. Nothing important sits after the fold on desktop without a cue. | screenshot |
| H6-load | L | defect | The first screen asks no more of the eye than it needs: controls, framed boxes and filled buttons within the canon's budget for the screen, and never more than at the last run without a reason (a new feature). | probe `load`, `crowded-view`; canon § Screens `budget` |
| H5-grouping | | judgement | Related things are closer together than unrelated ones; a group has one boundary (space, or a border, not both plus a card plus a shadow). | screenshot; spacing values |

## D — Detail: components and layout, at every width

This section does not list special cases. It applies `/forge-ui-detail` (`forge/packs/core/skills/forge-ui-detail/SKILL.md`):
- its seven **principles** (`forge/packs/core/skills/forge-ui-detail/principles.md`);
- one **anatomy card** per component type (`forge/packs/core/skills/forge-ui-detail/anatomy.md`: parts, clearance, states, layout per band, typical failures);
- close-ups of every component, side by side, at the canon's widths (default 360 · 768 · 1280 · 1920);
- the width sweep in between (`run-ui-sweep.mjs --between 80`).

A detail finding cites its principle and its component card. A new kind of defect needs a principle, not a new row here.

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| D1-fit | L | defect | **Fit**, at every width and between widths: nothing overflows, is clipped or overlaps; no label wraps or squeezes to one word per line; nothing is stretched beyond use. | sweep signals of principle `fit`; close-ups |
| D2-clearance | L | defect | **Clearance**: inside every framed component, text and icons keep the card's distances from the border and from the rounded corner; the screen keeps its gutter. | signals of principle `clearance`; close-ups compared within each type |
| D3-alignment | L | defect | **Alignment**: the page title, content and footer share the content column's left line in each band; form edges and row heights agree; content sits beside its navigation; the footer sits at the bottom of a short page. | signals of principle `alignment`; layout sheet guide lines |
| D4-rhythm | L | defect | **Rhythm**: spacing comes from the canon scale (±1px); the same relation gets the same gap; a group is tighter inside than between groups. | `spacingValues`, `near-duplicate-spacing`; layout sheet |
| D5-consistency | L | defect | **Consistency**: every instance of a component type agrees on radius, padding, height, border and icon placement, unless the canon names a variant. | detail sheets: the outlier among its siblings; `style-drift` |
| D6-anatomy | L | defect | **Anatomy per band**: each component has its card's parts and states, and the card's layout in each band. A desktop layout squeezed onto a phone, or the phone stretched onto a tablet, fails here. | anatomy cards; detail sheets across widths |
| D7-same-content | | defect | Every width offers the same actions and information. Hidden is allowed only inside a reachable menu. | `--findable` at each width |

## T — Type and reading

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| T1-real-text | L | defect | With the **longest valid input** and real names, text stays readable (D1 covers the geometry: here, that the meaning survives — no truncation of what tells two items apart). | long-input run |
| T2-size | L | defect | Body text ≥ 14px (16 preferred), nothing under 12px, line height ≥ 1.4 for paragraphs. | probe `tiny-text`, `typography` |
| T3-line-length | | defect | Paragraphs read at 45–80 characters per line. | probe `long-lines` |
| T5-line-height | L | defect | Running text has a line height of 1.4 to 1.6, headings 1.1 to 1.3. | probe `tight-line-height` |
| T4-type-set | | defect | At most the canon's families (default: 2) and a small set of sizes (default: ≤ 6 on a screen) and weights (≤ 4). Each extra one is an off-canon value. | probe `typography` vs canon |

## C — Colour and contrast

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| C1-contrast | L | defect | Text 4.5:1, large text and control borders 3:1 — in every state, hover and disabled included, and in dark mode when the app has one. | probe `low-contrast`; `--hover` run |
| C2-colour-alone | L | defect | No state is told by colour alone (error, selected, required): an icon, a word or a shape says it too. | screenshot in error and selected states |
| C5-field-border | | defect | A field's border, or its fill, stands out 3:1 from the page, so the user sees where to type (WCAG 1.4.11). "Subtle borders" in the direction applies to dividers, not to fields. | probe `low-contrast-border` |
| C3-off-canon-colour | | defect | Text and surface colours are canon tokens; two colours that are almost the same are one token written twice. | probe `colours` vs canon |
| C4-accent-budget | | judgement | The accent colour marks what matters (primary action, current place, selection) and little else; when everything is highlighted nothing is. | screenshot |

## F — States and feedback

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| F1-states-exist | L | defect | Every state of the canon's matrix for this screen exists and is designed: empty, loading, error, success, disabled, long input — plus permission-denied and offline where they apply. A missing one is a finding, not a skipped cell. | state matrix |
| F2-feedback | L | defect | Every action gets a visible answer near where the user looks — saved, refused (with why), in progress. | walk each action once |
| F3-error-recovery | L | judgement | An error says what happened and what to do next, keeps what the user typed, and puts focus on it. | after a rejected submit, `--block` run |
| F4-empty-state | | judgement | An empty state says what goes here and offers the action that fills it. | empty state |
| F5-state-under-focus | L | defect | A state stays visible while the control is focused. | probe `state-hidden-by-focus` |

## A — Keyboard and assistive tech

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| A1-focus-visible | L | defect | Every control shows focus. | probe `focus-not-visible` |
| A2-names | L | defect | Every control has a name; links and buttons say what they do ("Delete invoice", not "Click here"). | probe `unlabelled-control`; read link texts |
| A3-targets | L | defect | Targets ≥ 24 × 24px, ≥ 44px for buttons on a phone. | probe `small-target` |
| A4-focus-after | | defect | After open / save / cancel / error, focus lands somewhere sensible, never the page body. | runner `focus` |
| A5-zoom | | defect | Zoom is not blocked; the screen still works at 200 %. | probe `zoom-disabled`; 640px run |
| A6-dead-control | | defect | Nothing looks clickable and does nothing. | probe `dead-control`; click it |
| A7-motion | | defect | Motion respects reduced-motion; nothing important happens only in an animation. | run with and without `--stable` |

## N — Navigation and wayfinding

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| N1-where-am-i | | judgement | The user can tell where they are (title, current item in the nav) and how to go back. | screenshot |
| N2-same-place | | defect | The same action is in the same place on every screen; shared navigation looks and reads the same everywhere. | screenshots across screens |
| N3-findable | | judgement | A first-time user finds each core feature from the home screen without guessing. | whole-app pass |

## W — Words

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| W1-one-word | | defect | One word per thing, the canon's word (§ Words): not "Delete" here and "Remove" there for the same act. | read all labels |
| W2-specific | | judgement | Labels and messages are specific ("Invoice sent to ada@…", not "Success"). | read |
| W3-raw-text | L | defect | No raw keys, `undefined`, `[object Object]`, untranslated strings, placeholder lorem. | read every state |

## U — Usability, measured by tasks

The canon lists, per feature, its **tasks**: what a user comes to do, with a target in steps (clicks, taps and key presses) and a start point. A fresh reviewer plays a **first-time user**. It has no knowledge of the code and only the task's sentence ("lend the tent to Ada"). It walks every task at desktop and phone width, counting steps, then writes down every place where it hesitated (more than one plausible next step, or none) and every error it made.

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| U1-steps | L | usability | Each core task is done in at most its target of steps. Default target when the canon has none: the shortest path the reviewer finds, plus 2. Record it as the target the first time. | count |
| U2-findable | L | usability | The start of each core task is visible from where the user lands: no scrolling on desktop, at most one on the phone, never only inside a closed menu, and named in the user's words. | probe `--findable "<start action>"` on the task's start screen (canon § Tasks), then the first-time persona |
| U3-dead-end | L | usability | No screen leaves the user with no clear next step, and none forces a back-and-forth to finish a task. | first-time persona |
| U4-hesitation | | usability | No more than one hesitation per task. Each hesitation names the element that caused it. | first-time persona |
| U5-error-cost | | usability | An error made while doing a task costs at most one step to recover, and nothing typed is lost. | first-time persona |
| U6-frequent-first | | usability | The most frequent action of a screen (canon § Tasks, `frequent: yes`) takes the fewest steps of any action there. | count |

## P — Polish: does it look finished?

Judged against the canon's **§ Direction** (for example "sober and dense, hierarchy by spacing, subtle borders, one accent"). With no direction written yet, the default is: lean, quiet, one accent, hierarchy by size and spacing. A polish finding names the check, the element, what in the direction it breaks, and an acceptance line that a person could check on the after capture ("one elevation level for cards", "icons all 20px outline").

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| P1-focal-point | | polish | One clear focal point per view; the eye does not bounce between several equally loud blocks. | screenshot, squint test (blurred capture) |
| P2-surface-system | | polish | Cards, panels, inputs and menus use one small system of border, radius and shadow, the canon's. No one-off surfaces. | screenshot; probe `style-drift` |
| P3-grid | | polish | Blocks sit on a visible grid: shared left edges, equal gutters, widths from a few columns. Nothing floats. | screenshot with the edges marked |
| P4-type-rhythm | | polish | Sizes follow one scale (one ratio), weights are used for meaning, and line heights match from block to block. | probe `typography` vs canon |
| P5-density | | polish | The density matches the direction. A sober, dense app is not airy on one screen and crammed on the next. | screenshots side by side |
| P6-colour-harmony | | polish | Neutrals come from one family; accent, success and danger are used for their meaning only; no stray hue. | probe `colours` vs canon |
| P7-details | | polish | Icons come from one set, size and stroke; images are cropped consistently; hover, active and selected styles are consistent; no default browser control left unstyled next to styled ones. | screenshot, `--hover` |
| P8-craft | | polish | Nothing looks unfinished: no misaligned icon in a button, no text touching an edge, no widowed single word in a heading, no placeholder art, no double ring (an error border and a focus ring stacked). | close crops, invalid + focus state |

## X — Lean: every element earns its place

The anti-noise pass. Each item is a **question about this screen's job**, not a ban: a pattern that serves the job is fine, a default nobody chose is the finding.

| Id | L | Kind | Check | How |
|----|---|------|-------|-----|
| X1-nested-boxes | | judgement | No card inside a card inside a panel; one container per group. | screenshot; DOM |
| X2-decoration | | judgement | Shadows, gradients, borders and badges each say something (elevation, state, grouping); stacked together on one element they are noise. | screenshot |
| X3-competing | | judgement | Nothing competes with the primary action: no second set of loud buttons, no banner louder than the content. | screenshot |
| X4-dead-weight | | judgement | No element the job does not need: duplicated titles, explanatory text that repeats the label, decorative stats. | read the screen against H1 |
| X5-preference | | **preference** | A style choice neither the direction nor a user problem supports: another font, another hue, "more modern". | suggestion only, at most 3 per report. To act on it, change the canon's direction: then it becomes polish. |

## Grade (per screen, then for the app)

Same findings → same grade, whoever computes it. `100 − 15 × High − 6 × Medium − 2 × Low`, counting the **defect, usability, judgement and polish** findings that are open. Silenced and deferred findings are not counted; preferences never are. The report also gives two sub-grades with the same formula, so an ugly-but-correct screen is visible as such: **Looks**: what the screen shows, so every finding of the families H, S, T, C, P and X, whatever its kind. A measured off-canon radius on a tile is ugly, and it counts here. **Works**: what the screen does, so every finding of F, A, U, N, W and R, and every behaviour bug. A ≥ 90 · B ≥ 80 · C ≥ 70 · D ≥ 60 · F below. A screen whose state matrix was not fully walked is graded `insufficient — <what was not walked>`, never guessed. The app grade is the mean of its screens, with every screen named whose grade is `insufficient`.
