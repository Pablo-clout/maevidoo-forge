# Skill: /forge-explore

**Purpose:** **Deep analysis** of the repo (and/or the web) with a written synthesis. **Does not** implement code, plan gated tasks, or run pilot.

Use this instead of a blank chat when you want **evidence + structure**: map a directory, explain how a subsystem works, compare approaches with sources, or research a library/API in depth.

**Harness note:** isolation comes from spawning the Explorer **Task** below — adapters stay plain pointers (no `context: fork`: a pointer body forked away from the conversation loses the question, and Claude's read-only Explore agent cannot write the mandatory report). Orient remains a Task spawn from `/forge`, not a separate slash skill.

## vs other commands

| Need | Use |
|------|-----|
| Bounded “where does X live?” inside `/forge` | Orient Task (narrow scope — same parent model) |
| **Deep** synthesis / multi-dir map / web research | **`/forge-explore`** |
| Gated feature plan | `/forge` |
| Bugfix | `/forge-debug` |
| Implement | `/forge-pilot` |

## Hard rules

- **No product code** edits, no commits, no push.
- Prefer a **Task** with `forge/packs/core/personas/explorer.md` for heavy repo sweeps (keeps main thin; Copilot-safe).
- Main may stay for tiny questions (≤1 directory, ≤5 files) — otherwise spawn.
- Announce: `Spawning agent: Explorer…` when using a Task.  
- **Model:** inherit parent — omit Task `model` unless opted in (`execution-contract.md` § Model inheritance).

## Inputs

- User question + optional paths/`@` files / URLs  
- Read: `forge/constitution.md`, `forge/project.md` if present — when it has `areas`, start from the map (`areas.map`): it says where each part of the product lives  
- Persona: `forge/packs/core/personas/explorer.md`  
- Template: `forge/packs/core/templates/explore-report.md`

## Mode (auto — do not ask)

Classify from the prompt; record in the report.

| Mode | When | Work |
|------|------|------|
| **codebase** | “how does…”, “map…”, “what exists in…” | Deep repo/dir analysis + synthesis |
| **web** | “research…”, “best practice…”, “compare vendors…”, library docs | Multi-query web research + citations |
| **mixed** | needs both repo truth and external context | Codebase first, then web to fill gaps |

## Procedure

### 1. Scope
One line: mode + directories/topics. If the question is empty/vague → **one** clarifying question, then stop. Do not invent a research agenda.

### 2. Evidence gathering

**Codebase**
- Prefer `rg` / glob with directory + type filters.
- Open files at hit lines; **never** dump whole large files into chat.
- Build a map: entry points → modules → key types → data flow (short).
- If >20 hits: summarize patterns + counts, cite best 5–8 `path:line`.

**Web** (when mode is web or mixed)
- Run **≥3 distinct** searches (or fetch canonical docs URLs the user gave).
- Synthesize — no SERP dumps.
- Cite: title + URL + one takeaway each. Label gaps `web not verified` if search fails.
- Prefer primary docs / RFCs / official blogs over random SEO posts.

### 3. Synthesis (mandatory artefact)

Write a report (create folders as needed):

- Prefer: `epics/explore/<YYYY-MM-DD>-<slug>.md`
- Fallback if no `epics/`: `docs/analysis/EXPLORE-<slug>.md`

Use `forge/packs/core/templates/explore-report.md`. Include: question, mode, findings, map/synthesis, citations, **open questions**, **suggested next Forge step** (`/forge` / `/forge-debug` / none).

### 4. Chat reply
≤10 lines: verdict + path to report + 3–5 key bullets. Detail stays in the file.

## Optional continuity

If the synthesis clearly leads to implementation, refresh `epics/_next-task-prompt.md` to point at the report and suggest `/forge`. Do **not** create a full task unless the user asked.

## Anti-goals

- No coding / refactors “while we’re here”  
- No Meta-style lossy rewrite of the user question as the only memory  
- No loading all product lenses (explore ≠ product shaping)  
- No eager-loading every pack — load ≤2 pack rules only if needed to **interpret** architecture
