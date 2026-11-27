# Skill: /forge-light

**Purpose:** The fast path. Same exercise as `/forge` — understand, plan, build, check, close — at the lowest cost that still gives an independent look. **Main does the work itself** (plan, code, close) in one context, and **one light tester** checks the result. It is for work where speed and token use matter: a small feature, a fix, a refactor on a known area, a prototype.

Why this shape (measured 2026-11-18, same feature built six times with a fast model):
- a separate agent per step cost about three times the tokens of a single one and bought no quality: each agent start has a fixed cost, so **the steps run on main**;
- loading the Code persona and running its gates did pay: the only serious layout defect came from the run that had neither;
- nearly every build, whatever the method, shipped the same few misses (no visible confirmation, a keyboard double submit, bad stored data). An author does not see these in their own work, so **one short, independent tester** looks for exactly them.

What it keeps:
- **acceptance criteria**, written before the code;
- **a loadout made for the task** (`forge/packs/core/rules/pack-loading.md`): at most four files chosen from the project (its packs, canon and house rules), the code touched and the kind of work (the anatomy cards of the components it changes), written in `task.md` § Load;
- **the Code persona** (`forge/packs/core/personas/code.md`): reuse before rewrite, the plan before the code, the Self-check, the project's tests, the UI probe;
- **one independent check**: the light tester (`forge/packs/core/personas/lenses/light-tester.md`);
- **the clean close**: journal, sweep queue, no working file left.

What it drops: the Orient agent, the Go gate, the separate Code agent, the full flow tester and UI reviewer, the Review, the lenses. Two contexts in all: main, and the tester.

## Inputs

- The request, with optional `@` files. Optional word: `no-test` (skip the light tester; the report and the sweep queue then say `judged: no`).
- Read now: `forge/project.md` (`commands`, `packs.enabled`, `profiles`). Missing → `/forge-init`, stop.

## When it refuses to stay light

Main says so in one line and goes on as `/forge` would (`forge/packs/core/skills/forge/SKILL.md`), or stops if the human wrote `light only`:

- **risky areas**: authentication or permissions, money, personal data, a migration or another irreversible data operation, a public API contract;
- **visual references in scope** (`visual_refs`, a mockup, `visual_fidelity` ≠ `none`): the constitution forbids `lite` there;
- **more than one task**, an area main cannot map in about ten file reads, or a change that would take main's context past what it can hold (many files, long logs): that is what separate agents are for.

## Procedure

### 1. Plan — on main, in minutes
1. **Orient**: `docs/vision.md` first when it exists (a request against it is asked about, not built: `forge/packs/core/rules/product-docs.md` § 1), then at most about ten file reads; where the work lives, what to reuse, the neighbouring flows. A path-scoped fix → skip.
2. **Look it up; ask only when blocked.** `forge/project.md`, the repository, the request and the journal answer most things (`forge/packs/core/rules/asking.md`). Decide the rest and write each decision as `assumption: …`. When two readings of the request would produce different software, ask through the host's question tool, never as text in a reply.
3. **Name the area** when `forge/project.md` has `areas` (`forge/packs/core/rules/areas.md` § 3): the one this task works in goes in `task.md` Meta → `areas`. A task that needs two areas or shared code is rarely a light one — say so.
3b. **Choose the loadout** (`forge/packs/core/rules/pack-loading.md`): the files that match this project, the code touched and the kind of work, **at most 4**, by section. In a light run this is where most of the quality comes from: a UI task without its anatomy cards, or a stack task without its pack rule, is built blind.
4. **Write the task**: `task.md` with the Goal (the human's words, quoted), 2 to 6 acceptance criteria, § Load, `ceremony: lite`, `ceremony_reason: /forge-light`, `gate: Go — /forge-light, <ISO date>`; `notes.md` with § Orient and the assumptions. One task, under `epics/` like any other. No `feature.md`, no delta-spec.
5. Announce: `⚡ light: <goal> — <n> criteria · one light tester · say "full" for /forge`, then `🧩 Loaded: <files> — left out: <files>`.

### 2. Build — on main
Read `forge/packs/core/personas/code.md` and follow it yourself, as the Code agent would: every file of `task.md` § Load first, the short plan in `notes.md` before the first edit, the code, then its gates. End with § Self-check filled: each acceptance criterion with its evidence (a test, a command output, a probe result), `commands.test` green, the UI probe clean of High and Medium on what changed.

Red after one honest attempt to fix → stop: report what fails and offer `/forge-pilot` on the task (fresh agents, full judges).

Commit locally. Never push.

### 3. Test — one light tester
Spawn **one** fresh agent, on the session's own model (`forge/packs/core/rules/execution-contract.md` § Model inheritance: Forge never picks a model, the human does), with: the path of `task.md`, the commit, the URL when there is a screen, and `forge/packs/core/personas/lenses/light-tester.md` to read and follow. Main starts the app first when the project needs it (`commands.dev`) and stops it afterwards. Nothing else goes in the prompt: not the notes, not the diff.

- **pass, nothing above Low** → step 4.
- **findings** → main fixes every High and Medium addressed to the code, re-runs the Self-check gates on what it touched, and commits. **The tester does not run again**: the report says `fixed after the tester, not re-tested`, and the sweep queue carries those points.
- **fail on something main cannot fix in one pass** → stop; offer `/forge-pilot`.

`no-test` → skip this step.

### 4. Close — on main, always
Run the Scrum checklist (`forge/packs/core/skills/forge-pilot/scrum-worker.md`), whatever happened in step 3:
- the dated entry in `epics/decisions.md`: what was done, why, the decisions, the assumptions, the tester's open findings as follow-ups;
- the line in `epics/to-sweep.md`, with `judged: light` (or `no` with `no-test`) and, under *Check in particular*, what the tester did not check and what was fixed after it;
- `_next-task-prompt.md`; **the task folder deleted**; the "nothing left behind" check: no `task.md`, `notes.md`, script or screenshot left in the repository. Commit the journal files.

A light run is fast because the **deep** check is deferred to the next `/forge-sweep`, which reads that line first. It is not dropped.

### 5. Report
Six lines at most: what shipped and the commits · the author's checks with their result · the tester's verdict and what it found · what was fixed after it · the assumptions · **Next:** the sweep will re-test it; `/forge-flow-test` or `/forge-review` now if it cannot wait.

## Anti-goals

- No second agent besides the light tester: no Orient, no separate Code agent, no reviewer, no lens. That is `/forge`
- No tester that grows into a full flow test, and no second tester round
- No claim that the work was reviewed or tested beyond what the author and the light tester ran
- No staying light on risky areas, with visual references, or when the change outgrows one context
- No skipping the Code persona, the acceptance criteria or the Self-check: they are the quality
- No note, script or screenshot left behind. The one exception: a run that stops early and hands over to `/forge-pilot` keeps its task folder, because that is now an open task, and the report names its path
