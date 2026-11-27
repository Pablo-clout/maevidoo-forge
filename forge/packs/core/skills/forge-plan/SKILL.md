# Skill: /forge-plan

**Purpose:** Gated task **plan** only — no implementation. Use it on its own when you want to read and approve the plan before any code is written (`/forge-pilot` executes it later). `/forge` runs this same planning and then executes without stopping; `/forge-light` runs a shortened form of it.

## Orient — on main when the area is small, in its own agent when it is not

Before planning, someone must know where the work lives and what can be reused (`forge/packs/core/personas/orient.md`).

- **Small or known area — main does it, no spawn.** The request names the files or the screen, about ten file reads are enough, and any brief fits on a page. Read them, fill `notes.md` § Orient briefly, go on. A separate agent here costs more than it saves.
- **Large or unknown area — its own agent.** A repo you do not know, several modules, long briefs or design references to compare with the code: spawn Orient (`Spawning agent: Orient…`) so file contents stay out of the planning context and only the map comes back. Started on main and passed ten reads without a clear picture? Stop and spawn it.
- **Nothing to orient:** a typo or a one-file fix at a given path — record `orient: skipped (path-scoped)`.

**Model:** inherit parent chat — omit Task `model` unless `forge/project.md` `profiles.subagent_model` or the human overrides (`execution-contract.md` § Model inheritance). `/forge-init` stays on main.

## Inputs

- Request + optional Jira/`@` files  
- Attached/`@` brief `.md` files = **briefs** → `forge/packs/core/rules/brief-fidelity.md` applies (read them fully; artefacts must not thin them)  
- Ceremony override: `min` | `normal` | `strict` — `forge/packs/core/rules/execution-contract.md`  
- Read: `forge/constitution.md`, `forge/project.md`, `execution-contract.md`, `forge/packs/core/rules/artefacts.md`, `epics/memory.md` + `_next-task-prompt.md` if present; the file of `docs/code-ledger/` for each area the task touches, when present (never the others): say in the plan whether the task fixes a known weakness or goes around it; `epics/decisions.md` for context only — dated entries, verify against code (`artefacts.md` § Reading the journal)  
Missing `project.md` → `/forge-init`, stop.

## Ceremony

Main chooses the level per `execution-contract.md` § Ceremony — by default **auto**: risk of the task × `profiles.worker_tier`. Announce `🧩 Ceremony (auto): <level> — <why>` once, with what is skipped; write `ceremony` + `ceremony_reason` in `task.md`. Planning effort follows the level:

| Canon | Orient | Clarify | delta-spec |
|-------|--------|---------|------------|
| lite | on main, or skipped | 0–1 | no |
| standard | on main; agent when the area is large | 1–2 | no |
| governed | agent | ≤2 (3 if blocked) | when multi-module |

Visual references ⇒ never `lite` (`execution-contract.md` § Downgrade guard). The level chosen here is a starting point: `/forge-pilot` raises it when the run shows a problem.

**Meta rewrite (forbidden):** replacing the human's ask with a generated "improved" prompt and planning from that summary. Quote the ask in `task.md` Goal; resolve gaps via Align questions — never by rewriting.

## Procedure

### 0. Classify
One line: `type` + `ceremony`. Check `epics/memory.md` for duplicate features. If ceremony changes later (e.g. refs appear at Align), re-announce `🧩 Ceremony:` — the value written in `task.md` meta is the binding one.

### 1. Orient
Read `docs/vision.md` first, when it exists. A request that goes against it (a feature it rules out, an architectural rule it would break, a direction it contradicts) is not planned in silence: say what conflicts and ask, through the question tool, whether the vision should change or the request (`forge/packs/core/rules/product-docs.md` § 1).  
Pick the feature/task ids, create the task folder and `notes.md` from `templates/notes.md` (title filled). On main: fill § Orient yourself (locations, what to reuse, **the existing flows on the screen or module the task touches**, open questions). With an agent: give it the request **verbatim**, the `notes.md` path and every brief / visual-ref path; it fills § Orient and returns the path + a ≤15-line digest. The open questions feed step 3.  
First plan in a repo: choose the layout style (`artefacts.md` § Epics layout) and record it in `epics/memory.md` Conventions.  
Briefs provided → Orient **reads the briefs** (not only the code repo) and lists them under Locations; note the app `code_root` if the target is a subfolder.

### 2. Ground
Optional second Task → `notes.md` § Ground, **only when Orient reports types, APIs or tests it could not verify** (large or unfamiliar code). On a small or well-mapped area Orient's section is enough — do not spawn Ground by habit.

### 3. Align
2–5 questions through the host's question tool (`forge/packs/core/rules/asking.md` — recommendation first, one decision each; chat A/B/C only as fallback). Wait. Max 2 rounds (3 governed). UI + mockup → set `visual_fidelity` (`forge/packs/visual-qa/rules/visual-qa.md`); auto-upgrade ceremony when refs.  
Multi-proposal pick → **SSOT lock** (`visual-qa.md` § SSOT lock): split `ssot/` vs `dna/`, README links each accepted file, `visual_refs` = those file paths. Non-picks are closed, not open alternatives.

### 3b. Product lenses
`forge/packs/core/rules/product-lenses.md` — never ask. Record class + load-trace in task `notes.md` § Product lenses.

### 3c. Size the work
`forge/packs/core/rules/task-sizing.md` — **default one task**. A task is one slice a single Code agent implements in one pass and a reviewer judges from one diff, with its own AC. Never split by activity (code / tests / QA / docs) or by layer for its own sake. Run the **merge test** before the gate; more than 5 tasks → ask the human whether it is two features.

### 4. Plan artefacts
Templates under `forge/packs/core/templates/`; roles in `artefacts.md`. No code. **Goal** keeps user ask — **No Meta-style rewrite**.

| Artefact | Write when | Template |
|----------|------------|----------|
| `task.md` (meta + Goal + AC + DoD + **§ Load** + `visual_*` if UI) | **always** | `task.md` |
| task `notes.md` (Orient, lenses trace — the **Plan** section is written later by Code, not here) | **always** | `notes.md` |
| `feature.md` (task table + depends_on) | feature with ≥2 tasks — a single task has none, `task.md` is the hub | `feature.md` |
| `epic.md` | new `E-*/` theme grouping ≥2 features (optional) | `epic.md` |
| `delta-spec.md` | governed **and** multi-module | `delta-spec.md` |
| `HOW_AGENTS_USE_THIS.md` (feature root) | governed + UI refs | `how-agents-use-this.md` |
| `_next-task-prompt.md` refresh | **always** | `next-task-prompt.md` |

Nothing else at planning time — no extra handoff, memory or task-list files (`artefacts.md` § Epics layout). `review.md` appears at the first Review.

**The areas** — when `forge/project.md` has `areas`: name in `task.md` Meta → `areas` the area or areas the task works in (`forge/packs/core/rules/areas.md` § 3). More than one, or shared code, is a wider task: say why, and size it as such.  
**The loadout** (`forge/packs/core/rules/pack-loading.md`) — for every task: answer its three questions (which project, which code, which kind of work) from `forge/project.md`, the paths Orient listed and the request, and write the result in `task.md` § Load, within the ceremony's budget. Announce `🧩 Loaded: … — left out: …`. This is what the Code agent will read; a task with a careless loadout gets generic code.

**Brief fidelity** (`rules/brief-fidelity.md`) — when briefs exist:
- `brief_source:` path(s) **mandatory** in feature meta + task meta
- Preserve: objective (faithful quote/paraphrase), detailed scope bullets, out of scope, skills, "done when" → AC/DoD, product refs (UX docs → `visual_refs`)
- Density floor: brief > ~15 useful lines ⇒ `feature.md` ≥ ~30 useful lines — a skeleton loses the Go gate
- Set `code_root` in feature meta when the app is a subfolder
- Dropped content → task `notes.md`: `omitted: <section> — <reason>`

**Link density** (`rules/link-density.md`) — governed UI or any `visual_refs`:
- `feature.md` = **hub**: linked SSOT files, brief(s), cold-start doc, each `tasks/<id>/task.md` in the table
- More than one task (per `task-sizing.md`, or a human-stated split) → write **complete** `task.md` per task (Goal quote, AC table, per-task `visual_refs` file list, depends_on, Gate) — no stub rows, no "Orient may adjust"
- Human pre-authored task files → confirm + gate only; **do not reinvent the split**
- Folder-only refs when SSOT files exist = density fail

### 5. Gate
The planning files stay uncommitted: `/forge-pilot` commits them with its first commit.  
Ask **`Go`** through the host's question tool (`forge/packs/core/rules/asking.md`): `Go` / `Revise`, with task count + ceremony in the question. On Go: check the gate box + ISO date. Stop. Next: `/forge-pilot`.  
Called from `/forge`: that skill decides whether this question is asked (`forge/packs/core/skills/forge/SKILL.md` § Gate) — the rest of this step still applies.  
Before asking: run the link-density **review test** — from `feature.md`, brief/SSOT/tasks/next-pointer must be reachable by click alone.

## Anti-goals
- No coding / commits / push  
- No planning without knowing where the work lives; no Orient agent on an area ten reads cover  
- No full pack dumps into chat; no omitted notes / next-task refresh  
- No Meta-style rewrite; no product-persona slash commands  
- No plan ignoring visual refs; no `lite`/`min` with visual refs  
- No skeletal artefacts from a rich brief (`brief-fidelity.md`)  
- No splitting by activity or layer; default one task (`task-sizing.md`)  
- No folder-only refs when SSOT files exist; no reinventing a human-stated task split (`link-density.md`)
