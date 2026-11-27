# Skill: /forge-smoke

**Purpose:** End-to-end dogfood of Forge — harness, safety hook, sandbox artefacts, and **live** agent spawn checks when the host supports them.  
**Not** a product feature workflow. Does not push. Cleans or keeps a **gitignored** dated run under `test-session/dogfood/`.

## Inputs

- Optional mode: **`keep`** (default) | **`clean`**
- Read: this skill, `tests/e2e/DOGFOOD.md`, `forge/project.md` if present

## Hard rules

- Write **only** under `test-session/dogfood/<timestamp>/` (already gitignored via `test-session/`)
- Do **not** modify `forge/packs/**` product SSOT except if the user asked to fix a failure
- Do **not** push
- Announce spawns: `Spawning agent: …`

## Procedure

### 0. Mode

`keep` unless user said `clean`. Record in report.

### 1. Deterministic suite

Run on main (no spawn needed):

```bash
python3 tests/e2e/dogfood_runner.py --keep
# or --clean at the very end instead — if clean, prefer running live checks first in the same folder
```

If you need a shared folder for live checks: run with `--keep`, note the `test-session/dogfood/<stamp>/` path, then continue below using that path as `RUN`.

The suite includes the **brief-fidelity contracts** (feature/task templates + `brief-fidelity.md` needles): a FAIL there means `/forge` artefact density regressed.

### 2. Live spawn checks (host-dependent)

If **Task / agent** tool exists:

1. Announce `Spawning agent: Orient (dogfood)…`
2. Spawn a short Orient-style Task: “Write ≤10 lines to `RUN/epics/.../handoffs/orient-live.md` confirming you are a fresh worker; no product code.”
3. Verify the file exists and is non-empty → PASS `live-orient-spawn`
4. Optional: spawn a tiny read-only “Review” Task that writes `RUN/reviews/review-dogfood.md` with verdict PASS and one finding line → PASS `live-review-spawn`

If Task/agent tool **missing** (common on some Copilot/IntelliJ setups):

- Mark `live-orient-spawn` / `live-review-spawn` as **SKIP** with reason `no Task/agent tool`
- Do **not** fake spawns on main

### 3. Safety soft + hard signals

- Confirm `forge/packs/safety/rules/agent-safety.md` exists
- Re-run one deny sample via the hook script (or trust runner results)
- Note host hard-deny: Claude settings hook installed? Cursor/Copilot/IntelliJ = soft unless documented otherwise (`forge/packs/safety/adapters/COMPATIBILITY.md`)

### 4. Report

Update or write `RUN/REPORT.md` (merge live rows into the runner table).  
Chat reply ≤15 lines:

- stamp + keep/clean
- PASS/FAIL/SKIP counts
- path to `REPORT.md`
- top failures if any

### 5. Cleanup

- **`clean`:** delete `RUN/` after chat summary (and after REPORT was shown)
- **`keep`:** leave dated folder for traceability

## Anti-goals

- No Meta rewrite
- No enabling safety hard deny silently in user global settings
- No claiming multi-host hard deny when SKIP/soft
- No leftover files outside `test-session/dogfood/`
