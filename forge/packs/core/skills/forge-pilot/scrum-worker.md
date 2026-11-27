# Skill: scrum cleanup checklist (run on main at the close of every task)

Used by `/forge`, `/forge-pilot`, `/forge-light` and `/forge-debug`: **whatever the command, a task ends the same way** — the journal says what was done and why, the sweep queue says what to test, and no working file is left behind. Main orchestrator runs this checklist after the last gate of the run passed (judges, or the author's Self-check when there is no judge). **Do not spawn** a Scrum Task.  
Load `forge/packs/core/personas/scrum.md`. You do not write product code.

**Why cleanup, not archive:** handoffs, reviews, sketches and pseudocode are working notes agents write for themselves. Once the code is committed they go stale, and a later agent reading them takes old plans for current truth. Scrum keeps the few lines worth keeping — dated — and deletes the rest.

## Inputs
- Path to completed task folder under `epics/.../tasks/<id>/`
- Confirm the last gate of the run passed (judges' PASS; the light tester at `/forge-light`; Self-check at `lite` and `/forge-debug`; or a human override noted) **and** the code is committed locally
- Read `forge/packs/core/rules/artefacts.md` § Close-out

## Do
1. **Write the journal entry first.** Prepend one entry to `epics/decisions.md` (create it from `forge/packs/core/templates/decisions.md` if missing): today's ISO date, commit sha, what shipped, decisions with their why, rejected/failed approaches, open follow-ups, main code paths, and the **Run** line (command, ceremony, who judged it, the loadout, assumptions made without asking). Findings tagged `loading gap: <file>` go under Follow-ups (human), as they are how the loading tables improve (`forge/packs/core/rules/pack-loading.md`). ≤15 lines, Follow-ups not counted. Sources: task `notes.md` (Decisions, Failed approaches), `review.md`, `feature.md` § Decisions.
2. **Carry over open ends.** Every unresolved Medium/Low finding goes under the entry's Follow-ups, split by who must act (`code` / `human`, from the *For* column of `review.md`) — nothing is lost by the deletion in step 4.
3. **Queue it for the sweeps — with the tool, never by hand:**
   ```bash
   node forge/packs/core/tools/sweep-queue.mjs add --commit <sha> --what "<what shipped · screens or endpoints>" \
        --mode forge|forge-light|pilot|debug --judged no|light|testers|review|full --check "<what to check in particular>"
   ```
   A row to correct later (the commit was amended, a judge ran after all, the text was wrong): `node forge/packs/core/tools/sweep-queue.mjs edit --commit <sha> [--new-commit <sha>] [--judged …] [--what …] [--check …]` — never by hand.
   It creates `epics/to-sweep.md` when missing and inserts the row in the table, so the format is the same whatever model closes the task. `--check` holds the acceptance criteria in a few words, the assumptions, and what the author or a judge could not verify. `/forge-sweep` and `/forge-ux-sweep` test these first and deepest, unjudged work before the rest. Run it **before** deleting: the acceptance criteria disappear with the task folder.
   The task changed a flow that a scenario of `docs/regression.md` walks (a step, a label it names, what must be true at the end) → say so in `--check`: `regression: R-<n> to re-record`. Never edit the scenario's words here: the pack is the human's, and `/forge-regression` handles it.
4. **Delete the task folder** `tasks/<id>/` entirely (`task.md`, `notes.md`, `review.md`, `evidence/`). Delete only what Forge agents generated: a human-authored file found inside (brief, mockup, SSOT ref) stays in place and is named in the entry.
5. Update the `feature.md` task table (when the feature has one — a single task has no `feature.md`): row stays, status `done`, the link becomes plain text plus the entry date (`T01 — done 2026-11-10`).
6. **Feature close (all tasks done — including a feature that only ever had this one task):** merge that feature's task entries in `epics/decisions.md` into one feature entry (≤25 lines), then delete `features/<feature>/` (same human-authored exception). Update `epic.md` if any.
7. Update `epics/memory.md` (create it from `forge/packs/core/templates/memory-epics.md` if missing): move the feature/task to *Recently done* with its close date; active entries carry a **clickable path**; nothing points into deleted folders.
8. **Rewrite** `epics/_next-task-prompt.md` from template `forge/packs/core/templates/next-task-prompt.md`
   - If another task remains: point at it **by path** (task.md link — `link-density.md`)
   - If feature complete: say so and link the next feature/first task, or “none”
   - Open follow-ups: say how many (code / human) and link the journal entry — they are the natural input of the next `/forge`
9. **Stale check on the journal:** if this task changed or reversed something an older entry states, mark that entry `superseded <today>` with a pointer to the new one. Follow-ups of older entries that this task resolved are **removed** from those entries — a Follow-ups line lists open ends only.
10. **Vision and map:** closing never deletes or prunes anything under `docs/` (the vision, the map, the UI canon, the sweep ledger): a feature that is finished stays on the map and goes on being swept. Did this task change what `docs/vision.md` says (a big feature added or dropped, a technology, an architectural rule, the UI direction), or add, change or remove a workflow of `docs/features.md`? A feature this task finished and that is not on the map yet is one of those: it must get there, or no sweep will ever test it. If so, do not edit either file here: return the disagreement to main with its evidence. Main shows the proposal and asks the human (`forge/packs/core/rules/product-docs.md` § 2 and § 3), as the last thing of the task. Nothing to report → one line in the journal entry: `vision: unchanged`.
11. **Nothing left behind:** `git status` shows no Forge working file outside `epics/decisions.md`, `epics/to-sweep.md`, `epics/memory.md`, `epics/_next-task-prompt.md` and a still-open feature's files: no stray `notes.md`, `review.md`, `evidence/`, `reviews/`, scratch script or screenshot in the repository.
12. Do not push. Do not edit `forge/packs/` unless the task *is* a Forge framework change and DoD says so.

## Keep instead of delete
Skip step 4 / the folder deletion in step 6 only when the human said `keep` (this run) — note it in the journal entry. The entry is still written.

## Announce
End with: `Scrum done for <task-id> — journal entry <date>, queued in epics/to-sweep.md, task folder deleted. Next: see epics/_next-task-prompt.md`
