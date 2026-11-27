# Skill: /forge-debug

**Purpose:** Reproduce → root-cause → **minimal** fix → verify. Not a feature factory.  
Also used by `/forge-pilot` as **auto-debug** after 2 Review/Quality rejects (`execution-contract.md`).  
**As auto-debug:** inherit the task's `ceremony` + `visual_*` (never default `lite`); write into the task's `notes.md` § Debug.

## Inputs

- Bug description, logs, failing test, screenshot notes
- Optional: suspected paths
- Optional ceremony override: `strict` when the bug is UI-visual and needs qa-ux rigor
- Read: `forge/constitution.md`, `forge/project.md`, `forge/packs/core/rules/execution-contract.md`, `forge/packs/core/rules/shell-commands.md`, `epics/_next-task-prompt.md` if present  
- Create/update a short bug `task.md` + `notes.md` when opening a bug folder

## Ceremony

Default **lite** unless the bug spans many modules → **standard**.  
UI-visual bug (screenshot mismatch, layout) → at least **standard**; honor human `strict`.  
**The fix touches authentication or permissions, money, personal data, a migration or another operation that cannot be undone, or a public API contract → `governed`**, exactly as for any task (`forge/packs/core/rules/execution-contract.md`): stop and ask **Go** through the host's question tool before the fix is written, then the Review and the lenses its signals match (security, architecture) judge it. That it is "only a bug fix" changes nothing: a fix to an access rule is a change to an access rule. An earlier "yes" from the human about something else is not this Go.  
The level can only be known once the cause is known: decide it again after § 2, and raise it then if the fix turned out to reach one of these.  
**Announce it before the first edit**, as `/forge-pilot` does: `🧩 Ceremony: <level> — <why>`, who will judge the fix (nobody · testers · Review · which lenses), and what is skipped. The human corrects a wrong level in one word; a level nobody saw cannot be corrected.  
Auto-debug hop from `/forge-pilot` → **inherit the task's ceremony** (see Purpose).  
Clarify: at most **one** round of 2–5 questions if repro is unclear — via the host's question tool (`forge/packs/core/rules/asking.md`).

**Product lenses:** always **skip** (`product_class: micro`) for pure debug — unless fixing user-facing copy/AC (then follow `forge/packs/core/rules/product-lenses.md`).

## Procedure

**This file is the procedure — read it at the start of every bug**, and again when the conversation was summarised since you last read it. A procedure followed from memory keeps its gestures and loses its gates. Never write that a fix was done with `/forge-debug` when this file was not followed: say what was done instead.

### 1. Reproduce

- Capture failing command / test / steps in `epics/…/tasks/<bug-id>/notes.md` § Debug  
  (create a short bug task folder if none exists)
- If cannot reproduce, stop and ask for missing evidence
- **A defect someone read in the code is a hypothesis until it has been seen.** A judge's finding, a reviewer's remark, a code sweep entry: reproduce it like any other report before fixing it

### 2. Root cause (before patching)

Write the hypothesis in `notes.md` § Debug (root cause).  
Prefer subagent for search. **Forbidden:** random multi-file “try fixes” without a written cause.

### 3. Minimal fix

- Change only what the root cause requires. A remark a judge makes on the way ("this should also reload for the other roles", "a lock would be safer") is a **follow-up**, written in the journal — not more work for this fix
- Prefer a failing test first when feasible (pack/testing norms)
- If UI+refs: follow visual loop in `forge/packs/core/personas/code.md` / `forge/packs/visual-qa/rules/visual-qa.md`
- Local commit **only if** user asked to commit; otherwise leave changes unstaged and summarize

### 4. Verify

- Re-run the failing check; record the result in `notes.md` § Debug (verify)
- While looking for the cause and trying a fix: only the tests that cover the code in question (`areas.test` of its area when `forge/project.md` has `areas`). **The project's full checks run once, at the end**, when the failing check passes — in the background, while you write the notes. As auto-debug, main runs them, not you
- If still failing: new hypothesis (do not repeat the same patch). Max **3** fix rounds, then stop for human. **Stop means stop**: taking back what round 3 added, however safe it looks, is a fourth move — it is the human's to order

### 5. Optional self-check

Short checklist in `notes.md` § Self-check (DoD of the bug).  
Do **not** claim full `/forge-review` unless user asks — suggest `/forge-review` after non-trivial fixes.

### 6. Close — always
Run the Scrum checklist (`forge/packs/core/skills/forge-pilot/scrum-worker.md`) on the bug task folder: the dated entry in `epics/decisions.md` (root cause, the fix, why this fix), one line in `epics/to-sweep.md` with `judged:` saying **who really judged it** — `no` when only its author checked it (the usual case at `lite`: the next sweep re-walks the flow and its neighbours), `testers`, `review` or `full` when those ran. A line left at `no` after a Review sends the sweep to re-test it first, for nothing. To correct a line: `sweep-queue.mjs edit`, never by hand, then the bug task folder is deleted. Fix left uncommitted at the human's request → write both entries with `commit: uncommitted` and still delete the folder.

## Anti-goals

- No bug task folder, notes or scratch file left behind after the fix — one kept on purpose (a measurement, captures, questions for the human) is named in the final message with its reason
- No fix to rights, money, personal data or a migration without the human's Go
- No drive-by features
- No push
- No unbounded retry loops
- No `min` to skip visual evidence on UI-visual bugs
