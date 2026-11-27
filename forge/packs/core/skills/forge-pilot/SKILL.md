# Skill: /forge-pilot

**Purpose:** Execute a **human-gated** task or feature. Main is a thin orchestrator: it spawns a fresh agent to write the code and fresh agents to judge it, and does the bookkeeping itself. The author is one agent for the whole task — it is **resumed** for the fix rounds; the judges are always fresh.

## Who does what

A judge that shares the author's context inherits its blind spots, so author and judges are always **separate Tasks, all spawned by main — no nested spawns** (a worker never spawns a worker), and **a judge is always a fresh Task**. The author keeps its context across fix rounds: it knows the code and its own choices, and a fresh fixer would spend a whole build's worth of work finding them again. Main never codes and never judges. Picking judges and **Scrum** are checklists main runs itself — do not spawn a Scrum Task.

| Phase | Who | Fresh Task? | Follows | Writes |
|-------|-----|-------------|---------|--------|
| **A Code** | implementer | **Yes** | `forge/packs/core/personas/code.md` (it names what else to load, and when) | code + `notes.md` (Plan, Code handoff, Self-check) |
| **B Commit** | main | No | — | local commit. **Never push** |
| **C Judges** — screen created or changed | flow tester ∥ UI reviewer | **Yes, one each, in parallel** | `forge/packs/core/personas/lenses/flow.md` · `forge/packs/core/personas/lenses/qa-ux.md` | reply → main appends `## Flow test round N` / `## UI review round N` to `review.md` |
| **C Judges** — no screen, or `governed`, or raised | Review | **Yes** | `forge/packs/core/personas/review.md` | `review.md` § Review round N |
| **D Lenses** — `governed`, or raised | one Task per matched lens | **Yes** | `forge/packs/core/personas/quality.md` (checklist on main) + `forge/packs/core/personas/lenses/*` | reply → main appends § Quality round N |
| **Fix round** — a judge failed | **the Code agent of phase A, resumed** (a fresh Code agent only in the cases of § C), then the judge that failed | author: No · judge: **Yes** | `forge/packs/core/personas/code-fix-round.md` | max **3** rounds; after 2 FAILs a Debug Task first (`execution-contract.md` § Auto-debug) |
| **E Scrum** | main | No | `forge/packs/core/skills/forge-pilot/scrum-worker.md` | dated entry in `epics/decisions.md`, line in `epics/to-sweep.md`, `_next-task-prompt.md`; deletes the task folder |

Announce each spawn in one line: `Spawning agent: <Code|Flow test|UI review|Review|<lens>|Debug> for <task-id>…`  
**Model:** inherit parent chat — omit Task `model` unless `profiles.subagent_model` ≠ inherit or the human overrides (`execution-contract.md` § Model inheritance).

## Inputs

- Path to `task.md` or a feature folder, and the gate **Go** — an explicit human message (invoking `/forge-pilot` on a planned task **is** that message). Agents never grant themselves Go; unattended queues need `gate: pre-approved` written by the human (`forge/packs/core/rules/depends-on.md`).
- Optional ceremony word: `min` | `normal` | `strict`.
- Read now: `forge/project.md`, the task's `task.md`, `forge/packs/core/rules/execution-contract.md` § Ceremony. Read later, only when you reach them: the Scrum checklist at close, `depends-on.md` for a queue, `forge/packs/core/rules/asking.md` before a question. Main does not read the product code — the workers do.

Stop if `forge/project.md` is missing, `task.md` has no Goal + acceptance criteria, or there is no Go.

## Ceremony — how heavy this run is

Rule: `execution-contract.md` § Ceremony. Shape:

| Level | What runs |
|-------|-----------|
| `lite` | Code → Commit → Scrum → Report |
| `standard` | Code → Commit → **judged once**: screen → flow test ∥ UI review; no screen → Review → fix round if a judge fails **or leaves a Medium** → Scrum → Report |
| `governed` | `standard` + the Review on screen tasks too + lenses by signal |

1. Resolve: human word → task meta → `profiles.ceremony_default` if it names a level → **auto** (risk of the task × `profiles.worker_tier`).
2. Announce `🧩 Ceremony (auto): <level> — <why>`, what is skipped, and how to change it (“more” / “less”). Write `ceremony` + `ceremony_reason` in `task.md`, set `status: in_progress` (workers never edit `task.md`).
3. **Raise it when the evidence says so** — red tests or a failed Self-check; a FAIL; a tester replying `needs a code review`; something a judge could not verify (`execution-contract.md` § Raising it during the run). One line to the human, appended to `ceremony_reason`. Never lower it after a problem. Visual references ⇒ never `lite`.

## The run

### A. Code
Give the agent three things and nothing more: the path of `task.md`, the path of the task's `notes.md`, and `forge/packs/core/personas/code.md` to read and follow. Do not paste rules into the prompt.  
**Keep the agent's identity** (the id or name the host returns for it): the fix rounds resume it.  
It returns with `notes.md` § Self-check filled — no Self-check, phase not done. Blocking questions in `notes.md`? **Main** asks the human through the host's question tool (`forge/packs/core/rules/asking.md`), records the answer, spawns Code again.

### B. Commit
Commit locally. Never push. *Backlog picked up* in the handoff → those changes go in a commit of their own after the task's (`chore(backlog): C-12, C-15`), so one can be dropped without the other; when they share lines with the task's change, one commit, and its message names them. Note the commit the task started from (`BASE`) and each commit you make: the review packages are cut from them.

**Review package — for every judge that reads code.** Run `node forge/packs/core/tools/review-package.mjs --base <sha> --head <sha> --out <task folder>/evidence/review-rN.diff` and give the judge that path: the commits, the files changed and the diff with context, in one file it reads once. Round 1: from `BASE`. Later rounds: the fix alone (from the commit the previous round judged), with the whole-task package beside it. Never paste a diff into a prompt.

### C. Judges
**A screen was created or changed** → spawn the **flow tester** and the **UI reviewer** together. Give each: the task folder path (the UI reviewer saves its screenshots under that folder's `evidence/qa/`, nowhere else), the commit, its lens file, the URL. **One app, one owner:** main starts the app once (`commands.dev`) before spawning them, tells both it is running at `commands.url`, that they share it — each creates its own records and touches no one else's — and that they must not start or stop it; main stops it when both have returned.  
**No screen** → spawn the **Review** (it starts what it needs itself).  
`governed` → the Review runs as well, then step D.

Main appends each reply to `review.md` as its own round section and commits it.

- **A judge failed** → **resume the Code agent** of phase A with the findings of **all** judges of the round (tell it the round number, where the latest rounds are in `review.md`, and `forge/packs/core/personas/code-fix-round.md`; pass the findings as written, never softened). Commit. **Main then runs the project's full checks once** (`commands.test`, `commands.lint`, and the browser suite when the project has one and the fix touched a screen), **in the background**, with the output going to `evidence/checks-rN.txt` — and **spawns the judge at the same moment**, without waiting: **only the judge that failed** runs again — a **fresh** Task — with the fix package, the whole-task package and the path the checks will be written to. The judge reads while the checks run. Checks red → back to the same agent **whatever the judge said**; checks still running when the judge returns → main waits for them before closing the round. Never report a round passed on a judge's verdict alone.
  - **A fresh Code agent instead of the resumed one** only when: the host cannot resume an agent; the agent says its memory of the task was summarised or lost; the judge says the approach itself is wrong, not a defect in it; the same finding came back after a resumed round; or it is round 3. Say which in the report.
  - **Who runs what, so nothing is run three times:** the author runs the tests that cover what it changed; main runs the full checks once per fix round; a judge of round 2 or later reads the checks file and runs only what a specific doubt calls for. Round 1 is unchanged: the judge verifies for itself.
- **All passed, Medium `code` findings open** → **fix them without asking**: the Code agent resumed (same brief as a fix round; fresh only in the cases above), told to fix every Medium addressed to `code` and any Low that is quick and inside the task. Main runs the full checks once after it. **Not judged again** — its Self-check and probe gate are the gate, and the report says `fixed after the judges, not re-judged`. A tester's finding nobody acts on is tokens spent for nothing. Exceptions: a fix that would add behaviour the task does not ask for, or change a decision the human took, stays a follow-up; `for: human` findings are put to the human (`forge/packs/core/rules/asking.md`), or kept as follow-ups in an unattended run.
- **All passed, only Low findings open** → follow-ups in the journal; no extra round.
- A finding marked `pre-existing` (broken before the task): Code fixes it in the same round when it is small and on the screen the task touches; otherwise it goes to the human as a follow-up.
- A tester wrote `needs a code review: <what>` → spawn the Review once, pointed at that.

### D. Lenses (`governed`, or raised)
Run `forge/packs/core/personas/quality.md` on main: pick the lenses whose signal matches (`execution-contract.md` § Catalogue), spawn one Task per lens (≤3 in parallel), append their findings as § Quality round N. With visual references the UI reviewer also compares zone by zone, on its **own** screenshots (`evidence/qa/`). FAIL → fix round as in C.

### E. Scrum on main
Only after the last gate of the level passed (Self-check at `lite`, the judges otherwise) or a human override noted in `notes.md`. Run the `scrum-worker.md` checklist. **Clean up by default:** dated entry in `epics/decisions.md` first, then the task folder is deleted; feature complete → entries merged, feature folder deleted (`forge/packs/core/rules/artefacts.md` § Close-out).

### F. Report to the human
Short, no file dump: what shipped and the commit · judges and rounds · checks actually run with their result · what was skipped, and anything a judge could not verify · open follow-ups · **Next:** one line.  
Never report PASS on something that was not run or not judged.

## Feature or unattended run

Follow `forge/packs/core/rules/depends-on.md` (dependency order, unattended loop). Stop on a FAIL past the caps. Re-read `_next-task-prompt.md` between tasks.

### Whole-change review — once, when a feature of two tasks or more is complete
Each task's judges saw one task. Nobody has seen the whole: the function task 4 wrote again although task 2 had it, the change in task 3 that something outside the feature depends on.

1. Main runs the full checks once on the final state (`commands.test`, `commands.lint`, the browser suite when there is one). Red → the normal fix round on what failed, nothing else.
2. Main cuts one review package over the whole feature (from the commit the feature started from) and spawns **one fresh agent** with `forge/packs/core/personas/lenses/whole-change.md`, the package path, and the follow-ups the tasks left in the journal.
3. Findings → **one** fix agent for the whole list (a fresh Code agent with `forge/packs/core/personas/code-fix-round.md`: several authors wrote this code), main runs the full checks once, then **one** fresh re-check limited to those findings and that fix. No second wave: what is still open goes to the human with the evidence.

Skip it for a single task: that task's judge has already seen everything.

## Anti-goals

- One agent doing everything; main coding, judging, or softening a finding
- Skipping the two testers on a screen task, or adding judges the level does not call for
- A Scrum Task, or a coordinator Task that spawns lenses (nested spawn)
- Running everything at `governed` by habit, lowering the level after a problem, `lite` with visual references
- Pasting rules, diffs or test logs into prompts or chat — pass paths
- A fresh agent for a fix round when the author can be resumed; a judge that is not fresh
- The full test suite run by the author, then main, then the judge, for the same commit
- Main idle while its checks run, when a judge could be reading; a loop that waits for a background job (`forge/packs/core/rules/shell-commands.md`)
- Workers on a different or cheaper model without human or `project.md` opt-in
