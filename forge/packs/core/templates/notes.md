# Task notes: {{task_id}}

> **Agent working file.** Orient, Code and Debug append their section here — one writer at a time; parallel workers return their text to main, which appends it.
> Humans read `task.md`. This file is disposable: Scrum distils it into `epics/decisions.md` and deletes it at close.
> Leave a section empty when the task does not use it.

## Orient
<!-- Written by main, or by the Orient agent on a large area (forge/packs/core/personas/orient.md). One fact per line; sub-bullets under a field are fine. -->
- Request (one line):
- code_root:
- Briefs / visual refs read:
- Locations: <!-- path — why relevant -->
- Already exists? / reuse candidates:
- Existing flows on the screen or module touched: <!-- what a user can already do there — author and testers check they still work -->
- Recommended location for new work:
- Journal entries checked: <!-- epics/decisions.md items this request relies on — still true in the code? (path:line) -->
- Navigation gaps: <!-- what could not be found in the repo -->
- Questions for Align: <!-- product decisions left open — main asks the human -->

## Ground
<!-- Optional. Facts checked in the repo: types, APIs, tests that lock behaviour (path:line). -->
-

## Product lenses
<!-- Filled by /forge (main) at planning — workers leave it alone. Load-trace (product-lenses.md) and any `omitted: <brief section> — <reason>` lines (brief-fidelity.md). -->
- class: micro | standard | complex
- loaded:

## Plan
<!-- Code writes this BEFORE the first product-code edit. A few lines; one line for a one-line fix. A fix round appends `### Round N`. -->
- Approach:
- Files to touch:
- Reuse: <!-- what already exists that you use or extend; "nothing found — searched <where>" otherwise -->

## Decisions
<!-- Only real ones — a choice a future reader could not guess from the code. Scrum keeps these. -->
- [date] decision — why

## Failed approaches
<!-- Only when something was tried and dropped. -->
- [date] tried — failed because

## Code handoff
<!-- One block per Code round. Leave out the lines that do not apply. -->
### Round 1 — {{date}}
- Summary:
- Assumptions: <!-- assumption: <what was decided where the task was silent> — <why> -->
- Left as follow-up:
- Blocking questions: <!-- only if you stopped; main asks the human -->

## Self-check
<!-- One block per Code round. PASS = the author's claim that the work is ready to be judged — not a verdict. -->
### Round 1 — PASS | FAIL
- Plan written before the first code edit: yes | no
- Commands run: <!-- command → result (npm test → 21 pass, 0 fail); `not run — <why>` otherwise -->
- AC evidence: <!-- AC-1: test name, command, or manual steps → what was observed -->
- Neighbour flows used in the running app: <!-- each existing action on the screen or module touched: before → after (ok | already broken: what | fixed); “none” when nothing runs -->
- UI probe: <!-- one summary line per run (viewport · state); `n/a — no UI touched` otherwise -->

## Debug
<!-- Only when /forge-debug or the auto-debug hop ran. -->
- Repro:
- Root cause:
- Verify:
