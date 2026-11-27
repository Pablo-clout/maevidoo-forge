# Rule: artefacts

Durable state for work tracking: truth hierarchy, epics layout, handoff-first, and close-out cleanup.

## Truth hierarchy (SSOT)

1. **Code that runs, with its passing tests** — behaviour ground truth  
2. **Task DoD / AC** (`task.md`) — the agreed contract for this task  
3. **README / architecture notes** — brought in line with (1) and (2)  
4. **`epics/` memory and `epics/decisions.md`** — dated notes; when they disagree with running code, the code wins and the note gets corrected or marked `superseded`

Markdown vs code mismatch → **sync pause**. Resolving a conflict by trusting whichever document happens to be easiest is forbidden.

## Epics layout

```text
epics/
  memory.md                 # global index (required once work starts)
  _next-task-prompt.md      # what the next session starts from
  decisions.md              # dated journal — the only thing that outlives a closed task
  explore/                  # /forge-explore reports (optional)
    <YYYY-MM-DD>-<slug>.md
  E-<theme>/                # or flat feature-* — one style per repo
    epic.md                 # optional
    features/<feature>/
      feature.md            # hub: goal, scope, decisions, linked SSOT/briefs/tasks (link-density.md)
      HOW_AGENTS_USE_THIS.md  # governed UI cold-start only (template how-agents-use-this.md)
      tasks/<id>/
        task.md             # the contract, written for humans: goal, AC, DoD, gate, status
        notes.md            # agent working file: orient, plan, reuse, decisions, code handoff, self-check
        review.md           # judges only: review rounds + quality verdicts
        evidence/           # UI tasks only (cited as `evidence/…`, relative to the task folder): visual.md + author screenshots; qa/ = the tester's own captures
```

**Three files per task** (plus `evidence/` for UI). No other handoff, memory, sketch or task-list file — a new kind of note becomes a section of `notes.md`. How many tasks: `forge/packs/core/rules/task-sizing.md` (default one).  
**Single task:** it still gets a feature folder (`…/<feature>/tasks/<id>/`) so a second task can join later, but **no `feature.md`** — `task.md` is the hub and `epics/memory.md` links it directly. `feature.md` appears with the second task.  
**Status lives in one place:** `task.md` Meta, mirrored only in the `feature.md` table.

`tasks/` and `features/` hold **open work only** — Scrum deletes a task folder at close (§ Close-out).

| Style | When |
|-------|------|
| `E-*/features/*` | Multi-epic programs |
| `feature-*` flat | Small products |

Document style in `epics/memory.md` once. Do not mix casually.  
Explore → `epics/explore/` when present; else `docs/analysis/EXPLORE-*.md` (informational).

## Memory files

| File | Role | Cap |
|------|------|-----|
| `epics/memory.md` | Global index | ≤100 lines — prune |
| `epics/_next-task-prompt.md` | Next chat / agent pointer | ≤80 lines |
| `epics/sweeps/<date>.md` | Text report of one `/forge-sweep` run, rendered by `forge/packs/core/tools/sweep-report.mjs`; the feature map it walks is `docs/features.md` | keep the last few; older ones are in git history |
| `epics/sweeps/<date>/` | The same run illustrated: `index.html`, `img/` captures before and after, the data file `epics/sweeps/<date>/report.json` — **git-ignored**, stays on the machine | delete when no longer useful |
| `epics/sweeps/ux-<date>.md` · `epics/sweeps/ux-<date>/` | One `/forge-ux-sweep` run: the text report (committed) and the illustrated one (git-ignored), rendered by the same tool from `epics/sweeps/ux-<date>/report.json` with `"kind": "ux"` | as above |
| `epics/sweeps/chaos-<date>.md` · `epics/sweeps/chaos-<date>/` | One `/forge-chaos-sweep` run: the report of confirmed problems (committed, template `forge/packs/core/templates/chaos-report.md`) and the replay file of each one (git-ignored). The workers' charters, notes and runs live in a scratch folder deleted at close | as above |
| `docs/regression.md` · `tests/regression/` | The regression pack: the scenarios that must always work, in plain words (the human's file, template `forge/packs/core/templates/regression.md`), and one recorded script per scenario with `tests/regression/manifest.json` (`forge/packs/core/tools/regression.mjs`) — committed | 10 to 25 scenarios |
| `epics/sweeps/regression-<date>.md` | One `/forge-regression` run: what passes, what is broken, what needs the human — committed | keep the last few |
| `docs/code-ledger/<area>.md` | One file per area (plus `docs/code-ledger/shared.md`, `docs/code-ledger/whole.md`): what `/forge-code-sweep` found there, what the human decided, and the backlog of minor findings that the tasks working in that area clean up (template `forge/packs/core/templates/code-ledger.md`) — committed | closed entries older than a year may go |
| `epics/sweeps/code-<date>.md` | One `/forge-code-sweep` run: the report (template `forge/packs/core/templates/code-report.md`) — committed | keep the last few |
| `docs/vision.md` | What the product is, for whom, where it is going, its big features, architecture and UI direction (template `forge/packs/core/templates/vision.md`). Written with the human by `/forge-init`; changed only by a proposal the human accepts (`forge/packs/core/rules/product-docs.md`) — committed | about 120 lines |
| `docs/features.md` | The map: the app as it is, cut into features and workflows; the sweeps propose changes, the human accepts — committed | 5 to 20 features |
| `docs/sweep-ledger.md` · `docs/ui-canon.md` | What both sweeps already fixed (guards), decided, validated or asked, and the app's UI canon — so nightly runs converge (`forge/packs/core/rules/sweep-ledger.md`) — committed | ledger ≈ 200 entries, then prune old `fixed` ones |
| `epics/to-sweep.md` | The queue of what shipped since the last sweep (template `forge/packs/core/templates/to-sweep.md`): one line per closed task, with who judged it. Read first by `/forge-sweep` and `/forge-ux-sweep`, which remove the lines they covered | lines live until swept |
| `epics/decisions.md` | Dated journal of closed work (template `forge/packs/core/templates/decisions.md`) | ≤15 lines per task entry; prune superseded entries |
| task `notes.md` | Agent working file (template `forge/packs/core/templates/notes.md`) — deleted at close | concise |
| task `review.md` | Judges' rounds (template `forge/packs/core/templates/review.md`) — deleted at close | ≤7 findings per round |

Other templates: `forge/packs/core/templates/memory-epics.md`, `next-task-prompt.md`.

**Sync pause:** pause → re-read task + docs + code → decide → act once → verify DoD. A fix that failed twice gets logged and replaced by a different angle.  
**Triggers:** `/forge` creates `task.md` + `notes.md` and refreshes next-task; Code appends to `notes.md`; judges append to `review.md`; Scrum on main writes the dated journal entry, deletes the task's working files and **always** rewrites `_next-task-prompt.md`. Never trust memory over code.

**Optional external memory:** Markdown remains the SSOT. Pack `memory-bridge` (opt-in, yellow) documents claude-mem / mem0 adapters — never required for daily Forge.

## Briefs

User-authored brief `.md` in scope ⇒ `forge/packs/core/rules/brief-fidelity.md`: `brief_source:` in feature + task meta; objective, detailed scope, out-of-scope, skills, "done when" (→ AC/DoD) and refs preserved; any drop logged `omitted: …` in task notes. AC come from brief **+** Align, never Align alone.

## Links

Artefacts are **human-reviewable first** ⇒ `forge/packs/core/rules/link-density.md`: every SSOT asset, brief, task file and continuity pointer is a clickable repo-relative reference. `feature.md` is the hub; folder-only refs fail density when files exist (governed UI / any `visual_refs`).

## Handoff-first

Worker writes its section → main gets **file + section + ≤15-line digest** (`execution-contract.md` § Subagent return). Never paste pack architecture into chat.  
Builders (Orient, Code, Debug) write `notes.md`; judges (Review, Quality) write `review.md`; lenses return findings to main, which coordinates Quality. Personas load by role from `forge/packs/core/personas/`.

## Non-negotiables

1. Active work from `epics/memory.md` alone.  
2. Close task ⇒ refresh `_next-task-prompt.md`.  
3. AC in `task.md`; plans in task `notes.md`.  
4. Layout is user-repo state (not framework publish tree).  
5. Brief in scope ⇒ no dropped section without an `omitted:` log (brief fidelity).  
6. Governed UI ⇒ artefacts pass the link-density click-through (link-density.md).

## Close-out (Scrum cleanup)

**Working files are disposable; decisions are dated.** Handoffs, reviews, design sketches, pseudocode and evidence help agents while a task is open. After the code is committed they describe a plan, not the product — and an agent that reads them later mistakes them for current truth. So Scrum distils, then deletes.

- **Every command closes the same way.** `/forge`, `/forge-light`, `/forge-pilot` and `/forge-debug` all end with the Scrum checklist (`forge/packs/core/skills/forge-pilot/scrum-worker.md`). No mode leaves handoffs, notes, reviews, evidence or scratch files behind. Two files remain, and they are the memory of the work:
  - `epics/decisions.md`: **what was done, why, and what was decided**;
  - `epics/to-sweep.md`: **what the next sweep must test in depth**, unjudged work first.
- **Task close** → Scrum prepends one entry to `epics/decisions.md` (date, commit, the run, what shipped, decisions + why, rejected approaches, follow-ups), adds one line to `epics/to-sweep.md`, then **deletes** `tasks/<id>/`. The `feature.md` row stays as plain text: `done <date>`.
- **Feature close** (all tasks done) → the feature's task entries merge into one, then `features/<feature>/` is deleted; `epic.md` and `epics/memory.md` updated.
- **Order matters:** code committed → journal entry written (open findings carried into Follow-ups) → sweep-queue line written → delete. Never the other way round.
- **Only Forge-generated files are deleted.** Human-authored briefs, mockups and SSOT refs stay where they are.
- **Standalone judges leave nothing either.** `/forge-review`, `/forge-ui-review`, `/forge-flow-test` and `/forge-ui-detail` run outside a task reply in chat; their screenshots and scripts live in a scratch folder outside the repository. A `reviews/review-*.md` written for a FAIL is deleted by whoever fixes it, once its findings are in the journal's Follow-ups.
- **Human opt-out:** `keep` on the run leaves the folder in place; the entry is still written.
- If `epics/` is tracked by git, history is the archive. If it is gitignored, deletion is final — that is the intended trade-off; the journal is what remains.

### Reading the journal

Every entry is a snapshot **as of its date**. Any agent that reads `epics/decisions.md` checks the code the entry names before acting on it. Entry and code disagree → code wins; mark the entry `superseded <date>` rather than following it. `/forge` planning and Orient read the journal for context, never as a spec.
