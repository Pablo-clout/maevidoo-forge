# Chaos sweep — {{YYYY-MM-DD}}

> Template → `epics/sweeps/chaos-<date>.md`, written by `/forge-chaos-sweep`. For the person who owns the product: plain words, no tool jargon.

**Verdict:** <!-- one line: n workflows hold up, n are shaky, n are broken; n real problems (n High) -->

| | |
|---|---|
| Run | <!-- run number · commit --> |
| Workflows × testers | <!-- 12 workflows × 2 testers = 24, 22 returned --> |
| Testers | <!-- the model the human chose · 5 at once · what they cost (tokens, time) when the host reports it --> |
| Score | <!-- raised → merged → checked by hand → real / false / unclear --> |

## The feeling, workflow by workflow

| Workflow | Testers said | After the check |
|----------|--------------|-----------------|
| <!-- create a tournament --> | <!-- impatient: shaky · hostile: broken --> | <!-- broken: a second click creates a second tournament --> |

## Real problems

<!-- most severe first; one block each -->
### C-1 · {{severity}} · {{workflow}} — {{what, in one line}}
- **What happens:** <!-- what a user would see or lose -->
- **Seen by:** <!-- n testers (specialty, temperament) with their sev and sure · or the tool (angle) -->
- **See it again:** <!-- the steps from a fresh page · or `node forge/packs/visual-qa/tools/run-chaos.mjs --replay epics/sweeps/chaos-{{date}}/C-1.json --upto {{step}}` -->
- **Proof:** <!-- the text on screen, the error, the capture -->

## How far to trust the testers

| Tester said | Findings | Checked | Right |
|---|---|---|---|
| sure 3 | | | |
| sure 2 | | | |
| sure 1 | | | |

<!-- name any sure 3 that proved false, with the reason -->

## The journeys

| Person | Errand | Finished | Effort | Findings |
|---|---|---|---|---|
| {{person}} | {{errand, one line}} | {{yes / partly: where}} | {{n}} screens · {{n}} clicks · {{n}} fields | {{n}} |

## The code as a newcomer reads it

| Part | Easy to follow | Comments and docs | Real findings |
|---|---|---|---|
| {{part}} | {{n}}/5 | {{n}}/5 | {{n}} |

**Documentation for the next reader** — what a comment or a line in the documents would have prevented:
- {{file:line or document}} — {{the line to add}} — {{the mistaken finding or the wrong drop it would have avoided}}

## Needs you
<!-- judged unclear: the question, and what each answer would mean -->

## Checked and found false
<!-- what a tester reported and the check contradicted, one line each with the reason — so it is not raised again -->

## Seen once
<!-- what a tester met and could not make happen again: not counted. One line each, with its steps -->

## Already known
<!-- silenced by the ledger, or still open since an earlier chaos report -->

## Not tested
<!-- testers that did not run or returned nothing; workflows left out, and why; what the testers listed as not tried -->
