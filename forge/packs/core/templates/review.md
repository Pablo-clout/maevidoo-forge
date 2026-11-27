# Review: {{task_id}}

> **Judges only** — the Code agent never edits this file (author ≠ judge).
> One section per round, appended in order. The number of sections is the round count.
> Only the sections of the judges that ran: a screen task has *Flow test* + *UI review*; a task without a screen has *Review*; `governed` adds the others.
> Testers and lenses return their findings to the main orchestrator, which writes their sections (the UI reviewer saves only its own screenshots under `evidence/qa/`).

## Review round 1 — PASS | FAIL — {{date}}

**Scope:** <!-- diff range / paths -->

**Gates run by the judge:** <!-- command → result; `not defined` when project.md has no such command -->

**Behaviour exercised in the running app:** <!-- yes | no — read only: why -->

| # | Severity | Blocks merge? | For | Finding | Evidence |
|---|----------|---------------|-----|---------|----------|
| 1 | | yes \| no | code \| tester \| human | | |

<!-- ≤7 findings. -->

**Checked and found correct:** <!-- what was verified and holds — so the next round does not redo it -->

**Visual:** <!-- UI tasks: refs confronted yes|no; evidence present for each viewport/state yes|no -->

**To pass the next round:** <!-- only on FAIL -->

## Flow test round 1 — PASS | FAIL — {{date}}
<!-- Written by main from the flow tester's reply, whenever a screen was created or changed. -->

**Tests run by the tester:** <!-- command → result -->

| Flow | Variation | Result |
|------|-----------|--------|
| | happy path \| twice \| abandoned \| stale data \| server fails \| keyboard only | ok \| defect #n \| not walked: why |

| # | Severity | Blocks merge? | For | Flow and step | What happened / what should happen | Evidence |
|---|----------|---------------|-----|---------------|-------------------------------------|----------|
| 1 | | yes \| no | code \| human | | | |

## UI review round 1 — PASS | FAIL — {{date}}
<!-- Written by main from the UI reviewer's reply, whenever a screen was created or changed. Evidence: tester | author-only (why). -->

| # | Severity | Blocks merge? | For | Where (viewport · state · element) | Finding | Evidence |
|---|----------|---------------|-----|------------------------------------|---------|----------|
| 1 | | yes \| no | code \| human | | | |

## Quality round 1 — PASS | FAIL — {{date}}
<!-- `governed` only, or when the run was raised. -->

| Lens | Verdict | Why spawned / skipped |
|------|---------|-----------------------|
| qa-ux | | <!-- evidence: tester | author-only (why) --> |
| correctness | | |

| # | Lens | Severity | Blocks merge? | For | Finding | Evidence |
|---|------|----------|---------------|-----|---------|----------|
| 1 | | | yes \| no | code \| human | | |

<!-- Next round: append "## <Judge> round 2 — …" below. Do not rewrite earlier rounds.
     Round 2+ opens with the status of earlier findings, then the table of new findings:

| Earlier finding | Status |
|-----------------|--------|
| R1-1 | fixed \| open \| handed to tester |
-->
