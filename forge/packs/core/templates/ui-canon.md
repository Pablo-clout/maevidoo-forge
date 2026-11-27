# UI canon — {{project}}

> What "consistent" means for this app. UI reviewers judge consistency **against this file, not against their taste** (`forge/packs/core/rules/sweep-ledger.md`).
> Built from the code (theme, tokens, CSS variables, Tailwind config, component library) and from what the probe measured on the running app. Kept by `/forge-ux-sweep` and `/forge-sweep`; an agent never changes an existing rule on its own — it proposes under *Needs you*.
> status: draft — unconfirmed <!-- remove once a human has read it -->

## Direction
<!-- What "looks good" means for THIS app — the target every polish finding and every polish fix aims at. Chosen once: proposed by the first UX sweep from what the app already does best (and, if the human named one, a reference system such as shadcn/ui or Radix), confirmed by the human. A polish fix that does not move a screen toward this is not made. Changing it is the only way to restyle the app on purpose. -->
- tone: <!-- e.g. sober, calm, professional | playful | editorial -->
- density: <!-- e.g. dense lists for power users, airy forms -->
- hierarchy by: <!-- e.g. size and spacing first, colour for the primary action only -->
- surfaces: <!-- e.g. flat, 1px subtle borders, one shadow level for overlays, radius 8 -->
- accent use: <!-- e.g. one accent, primary action + current place + selection only -->
- iconography / imagery: <!-- e.g. one outline set, 20px, no illustrations in the app shell -->
- references: <!-- screens of this app that are the model ("Invoices list is the reference for lists"), or an external system -->

## Priorities
<!-- What matters most to the human for this app, in their words, mapped to rubric families. Findings in these families are raised one severity level (up to High) and listed first; the grade weighs them the same way. Set once by the human; default when empty: readability (T, C1), margins and spacing (S), not overloaded (H6, X), main features easy to find (U2, N3). -->
- <!-- e.g. readability — T, C1 -->
- <!-- e.g. margins and spacing — S6, S7, S3, S5 -->
- <!-- e.g. not overloaded — H6, X -->
- <!-- e.g. main features easy to reach and to find — U2, U1, N3 -->

## Tasks
<!-- What users come to do, with a target in steps (clicks + taps + key presses), from a start point. Walked by a first-time-user persona every UX sweep (rubric § U). A target is set once; lowering it is a product decision. -->
| Task | Feature | Start screen | Start action | Target steps | Frequent |
|------|---------|--------------|--------------|--------------|----------|
| <!-- lend the tent to Ada --> | | <!-- home --> | <!-- "Lend" — the name of the control that begins it, checked with the probe's --findable --> | <!-- 4 --> | yes \| no |

## Scales
<!-- The values actually in use, read from the source of truth when there is one (tokens file, theme, tailwind.config). Anything else measured on screen is off-canon. -->
- source of truth: <!-- path of the tokens / theme file, or "none — measured" -->
- spacing: <!-- e.g. 4 · 8 · 12 · 16 · 24 · 32 · 48 (base 4) -->
- type sizes: <!-- e.g. 12 · 14 · 16 · 20 · 24 · 32 — body 16, line height 1.5 -->
- font families: <!-- one for text, at most one more for headings or code -->
- radii: <!-- e.g. 4 · 8 · full -->
- colours: <!-- text, muted text, surface, border, primary, danger, success — as tokens, not every hex in the CSS -->
- shadows / elevation: <!-- e.g. none · card · overlay -->
- widths: <!-- the width matrix every screen is reviewed at, default 360 · 390 · 768 · 1024 · 1280 · 1440 · 1920 (plus every 80px in between with run-ui-sweep.mjs) -->
- breakpoints: <!-- where the layout changes, e.g. 600 · 1024 · 1440 -->

## Patterns
<!-- How the app does a recurring thing. One line each. -->
- primary action: <!-- look (filled, primary colour), at most one per view, where it sits (end of the form, top right of a page header) -->
- secondary / danger action: <!-- -->
- form field: <!-- label above, help under, error under in danger colour + icon + aria-describedby -->
- feedback after an action: <!-- toast top right 4 s | inline message next to the control -->
- empty state: <!-- what it says and the action it offers -->
- loading: <!-- skeleton | spinner, after how long -->
- destructive confirmation: <!-- dialog with the item's name | undo toast -->
- navigation: <!-- where it is, how the current place is shown -->
- per band: <!-- only where the app departs from the anatomy cards' Per band lines (forge/packs/core/skills/forge-ui-detail/anatomy.md) — phone < 600 · tablet 600–1023 · desktop 1024–1439 · wide ≥ 1440 -->

## Words
<!-- One word per thing, everywhere. Add a line whenever two words were found for the same thing. -->
| Thing | Word used | Not |
|-------|-----------|-----|
| | | |

## Screens
<!-- One block per screen. `code` decides which screens a diff touches; `states` is the state matrix every review of the screen walks — keeping it fixed is what makes two runs comparable. -->

### {{screen-id}}
- url: <!-- route -->
- features: <!-- names from docs/features.md -->
- code: <!-- files or globs that render this screen -->
- uses: <!-- shared components / styles whose change puts this screen back in scope -->
- states: <!-- empty · filled · loading · error · success · long input · after a rejected submit · … -->
- budget: <!-- first screen, from the probe's `load`: e.g. desktop ≤ 20 controls · 12 boxes · 1 filled button; phone ≤ 10 · 8 · 1 — set from the first run, raised only with a reason -->
- last reviewed: <!-- date · grade · ux-sweep | sweep -->
