# Rule: code discipline

Reference for the hard cases — a large or unfamiliar codebase, a `governed` task, or doubt about how to look for reuse. The everyday procedure is `forge/packs/core/personas/code.md`; this file is loaded on top of it only when one of those applies.

## The sequence in detail

### 1. Understand the task

- Read `task.md` (Goal, Boundary, DoD, AC, visual refs) end-to-end.
- Read task `notes.md` (Orient, Ground, Plan).
- **Blocking** ambiguity — a wrong guess would change whether an AC passes, the shape of stored/exchanged data, or be costly to undo → **stop**, write the questions under `notes.md` § Code handoff → *Blocking questions*, return. Main asks the human (`forge/packs/core/rules/asking.md`).
- **Non-blocking** gap — wording, a default value, a limit the task did not give → decide the way the surrounding code and the refs suggest, and log it under `notes.md` § Code handoff → *Assumptions* (`assumption: <what> — <why>`). Review judges them and main reports them to the human; a silent guess is the failure, not the guess.

### 2. Locate before searching everywhere

- Prefer paths from Orient/Ground / task Notes / user `@` files.
- If you do not know **which modules** to open → ask (or spawn Explorer with a **narrow** question). Do not ripgrep the whole monorepo “just in case.”

### 3. Gather facts (no hallucination)

Load only what the change needs:

- Types / POJOs / DTOs / entities actually used
- Facades, stores, APIs, routes touched
- Existing tests that lock behaviour
- Diagrams / sequence notes if present in repo or task
- External API: verify from **installed** docs/`node_modules`/Javadoc — never invent symbols
- After verify, write an evidence note in task notes, e.g. `Lib API: <symbol> from <path or URL>`. Optional `LIBRARY_SPECS` section for `governed` work.

Cite `path:line` in `notes.md` § Ground.

### 4. Reuse search (non-negotiable)

Before any new helper, component, service, or dependency:

1. Search for an existing implementation (same behaviour or 80% overlap).
2. Prefer **extend** the canonical owner over a parallel copy.
3. Write in `notes.md`:

```markdown
### Reuse decision
- Searched: <queries>
- Found: <path> | none
- Decision: reuse <path> | extend <path> | create new because <reason>
```

**Duplicate logic in a large codebase is a Critical process failure** — treat near-duplicates as blockers in self-check.

### 5. Pseudocode / design sketch

For anything beyond a one-line fix:

- Update `notes.md` § Plan with step-level pseudocode (data flow, states, edge cases).
- Name files/symbols you will touch; match **repo naming** conventions (read siblings).
- **Greenfield:** you may run a generator or scaffold in a scratch directory outside the repo to learn what it produces before writing the Plan — that is fact-finding, not product code.
- Load the stack pack's **architect** + architecture rules **before** sketching structure — when a stack pack is enabled; none enabled → follow the repo's existing structure and its README conventions.

### 6. Implement

- Minimal diff; match local style (names, folders, test patterns).
- TDD for behaviour change: red → green → refactor. On brand-new modules the first red is only a compile failure: also break the finished code once (remove a line, invert a condition), see the test fail, and restore — record that proof. Where the changed file has no test harness and the task forbids adding one, say `no red step possible — <why>` in Self-check and prove the behaviour another way (scripted run, manual steps).
- **Ceremony `governed` (optional split-pass):** RED (stop with a failing test recorded) → GREEN → REFACTOR; note each pass in task notes.
- Comment **why** at non-obvious seams — not narration of obvious code.
- No drive-by refactors; no new deps without DoD/human approval (`library-first`).
- Shell hygiene: `forge/packs/core/rules/shell-commands.md`.

### 7. Self-check (before Review)

- Run DoD commands **and** those of `forge/project.md` → `commands.test` / `commands.lint` that are set (a missing key = `not run — none defined`); paste the real output summary in `notes.md` § Self-check. A command you did not run is written `not run — <why>`, never implied.
- Security pass on your own diff: no secret or personal data committed; user-controlled data validated on entry and encoded on output; no new dependency without a line in `notes.md` (`forge/packs/core/personas/review-checklist.md` § Security basics).
- Apply `forge/packs/core/personas/review-checklist.md` (template: `forge/packs/core/templates/notes.md`).
- Re-run reuse search on anything you added.
- If UI + visual refs: follow `forge/packs/visual-qa/rules/visual-qa.md` **before** claiming self-check PASS.

## `/forge` plan obligations

Orient must answer **already exists?**  
Ground/plan must name candidate reuse paths.  
`notes.md` § Plan (pseudocode) is written by **Code**, before implementing, for `standard`/`governed` non-trivial work — `/forge` plans the *what* (AC), Code plans the *how*.  
If user supplied mockup/HTML/screenshot → set `visual_fidelity` on `task.md` (see `forge/packs/visual-qa/rules/visual-qa.md`).

## Never

- Code from vibes without reading types in-repo
- “I’ll clean duplication later”
- Silent scope expansion past Boundary
- Endless explore without asking where to look
