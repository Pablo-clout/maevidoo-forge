# Skill: /forge-review

**Purpose:** **Review only** — Jira/context + code/diff. No implementation.

## Inputs

- Ticket text / Jira paste / URL note
- And one of: branch name, PR description, `git diff`, `@` files, or “review working tree”
- Optional: `strict` for fuller pack-arch + visual scrutiny
- Read: `forge/constitution.md`, `forge/project.md`, `forge/packs/core/rules/execution-contract.md`, task/feature docs if paths given

## Procedure

### 1. Scope

State what will be reviewed (paths/diff range). If unclear, ask **one** clarifying question, then continue.

### 2. Fresh context

Spawn a **new subagent** for the heavy read (**MUST** when the harness has a Task/agent tool; announce `Spawning agent: Review…`): give it only the diff/paths + acceptance criteria / ticket + persona `forge/packs/core/personas/review.md` + `forge/packs/core/personas/review-checklist.md`.  
**Model:** inherit parent — omit Task `model` unless `profiles.subagent_model` or the human overrides (`execution-contract.md` § Model inheritance).  
No spawn tool available → do the read on main but state `Review on main (no Task tool)` in the report header.  
Main chat keeps verdict + summary.

### 3. Review axes (be strict)

Follow `forge/packs/core/personas/review-checklist.md`. Check at least:

- Correctness vs stated intent / AC
- Boundary violations (scope creep)
- DRY / duplication risk
- Security basics (secrets, injection, authz)
- Tests / evidence missing
- Silent error swallowing (empty `catch`)
- Architecture fit (if packs enabled, **load only** the relevant pack rule files — do not load all packs)

### 4. Write report

- A task path was given → append `## Review round N` to that task's `review.md`.
- No task context → reply in chat. Write `reviews/review-<YYYYMMDD-HHMM>.md` at repo root only for a FAIL that someone else will fix; that file is deleted once its findings are fixed or carried into `epics/decisions.md` Follow-ups (`forge/packs/core/rules/artefacts.md` § Close-out).

Use `forge/packs/core/templates/review.md`.

**Verdict must be exactly `PASS` or `FAIL`.**  
Findings: ≤7, each with `blocks merge? yes|no`.  
FAIL requires actionable findings (file/line or hunk when possible).

### 5. Stop

Do not fix code in this skill. Suggest `/forge-debug` or `/forge-pilot` remediation if FAIL.

## Anti-goals

- No drive-by refactors
- No “LGTM” without evidence
- No push
