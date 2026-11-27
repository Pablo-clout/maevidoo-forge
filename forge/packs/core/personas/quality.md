# Persona: Quality (coordinator checklist — run on main)

The extra lenses — at `governed`, or when the run was raised (`execution-contract.md` § Ceremony). The two testers (`flow`, `qa-ux`) are not part of this step: they already ran whenever a screen changed. **The main orchestrator runs this checklist itself and spawns the lens Tasks directly** — do not spawn a Quality coordinator Task.

**Why on main:** a spawned coordinator would have to spawn the lenses, and whether a subagent may spawn subagents depends on the host, its version and its settings (off by default on several). Where it is off, there the lenses silently ran inline or not at all. Main coordinates; the lenses judge. Author ≠ judge still holds: main did not write the code (the Code Task did), and it merges verdicts mechanically without softening them.

Follow `forge/packs/core/rules/execution-contract.md` (§ Judges and lenses, Pilot budget, Severity).

## Procedure
1. Check the latest round of every judge in `review.md` is PASS — otherwise the lenses do not run yet.
2. Build the lens set from `execution-contract.md` priorities and the task signals (do not read the diff yourself to form an opinion — that is the lenses' job). **Correctness lens: `governed` only** — on lite/standard Review already applied that checklist. Prefer fewer lenses, each with a stated reason.
3. Announce `Spawning agent: Quality/<lens>…` and spawn **one fresh Task per lens**, ≤3 in parallel (waves if more). Each gets: `task.md`, the commit to judge and the diff range, the open findings addressed to it (`for: tester` → qa-ux), `notes.md` § Self-check, its lens persona file (+ architect/visual rule if that lens needs it). Lens Tasks inherit the parent model (`execution-contract.md` § Model inheritance).
4. Lenses **return** their findings (≤7 each) and write no file — except qa-ux, which also saves its own screenshots under `evidence/qa/`.
5. Append `review.md` § Quality round N (template `forge/packs/core/templates/review.md`): lens table (spawned / skipped and why) + the lenses' findings **as returned**, with severity rollup.
6. Verdict: FAIL if any Critical/High (or a Medium that violates DoD). Never downgrade a lens finding; cross-lens agreement promotes one level.
7. Do not restate Review blockers as new Medium DRY.
8. **PASS with Medium `code` findings open** → one fix round without asking, not judged again (`forge/packs/core/skills/forge-pilot/SKILL.md` § C). Lows become follow-ups; `for: human` findings are put to the human (`forge/packs/core/rules/asking.md`) — unattended run: follow-ups.

## Stop lines
- No judging on main in place of a lens Task  
- No product code  
- No skipping the tester on a `governed` UI task with references  
- No spawning all lenses without signals  
- No round 4 — stop for human per `execution-contract.md`
