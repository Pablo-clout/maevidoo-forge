# Code sweep — {{YYYY-MM-DD}}

> Template → `epics/sweeps/code-<date>.md`, written by `/forge-code-sweep`. For the person who decides what gets fixed: plain words, every claim checkable. Nothing in the code was changed.

**Verdict:** <!-- one line: n parts read (n lines) · n Critical, n High, n Medium · the one thing to do first -->

| | |
|---|---|
| Scope | <!-- the whole project · or the areas named · commit --> |
| Read | <!-- n parts, n files, n lines · n readers · what they cost (tokens, time) when the host reports it --> |
| Checked | <!-- n findings raised → n confirmed, n refuted, n unverified --> |

## Part by part

<!-- sound · watch · act — the readers' impression after the check, one word per cell, the reason in the last column -->
| Part | Lines | Security | Data | Correctness | Performance | Architecture | Dead / duplicated | Tests | Maintainability | In one line |
|------|------:|----------|------|-------------|-------------|--------------|-------------------|-------|-----------------|-------------|
| <!-- loans --> | | | | | | | | | | |
| *the whole* | | | | | | | | | | <!-- the system and data readers --> |

## Fix batches

<!-- the important findings, grouped so that one task fixes several. One area per batch, at most 5 findings, in the order to do them. -->
| Batch | Area | Findings | Why together | To act |
|-------|------|----------|--------------|--------|
| B-1 | <!-- loans --> | <!-- C-1, C-4, C-7 --> | <!-- same two files: the access checks of the loan routes --> | `/forge fix batch B-1 of epics/sweeps/code-{{date}}.md` |

<!-- findings in no batch: those that wait for your decision, named here with their question -->

## Findings

<!-- the important ones only: most severe first; one block each; Critical and High all, Medium at most 5 per part -->
### C-1 · {{severity}} · {{part}} · {{axis}} — {{what, in one line}}
- **What the code does:** <!-- the fact, with path:line -->
- **Who pays, and when:** <!-- a user, the owner, the next developer — under which conditions, how often -->
- **Check it yourself:** <!-- the command, the search, the request, the sequence to follow -->
- **Checked by:** <!-- confirmed — what the checker ran or read · or unverified -->
- **Smallest fix:** <!-- what, and its size: S · M · L -->
- **Batch:** B-1 <!-- or: alone — `/forge-debug <one line>` · or: waits for your decision — the question -->

## Refactoring proposals

<!-- at most 3. A proposal is a decision for a human: Forge starts none unasked. -->
### P-1 · {{what would change}}
- **What it costs today:** <!-- with numbers: the hotspot, the five files per change, the 9-minute suite -->
- **What it would cost to do:** <!-- size, risk, what must be true first (tests, a freeze) -->
- **What it would stop costing:**
- **If not now:** <!-- what would make it urgent — the line that goes in the ledger as "reopens when" -->

## Backlog — nothing to read

<!-- the minor findings went to the ledger, one file per area: docs/code-ledger/<area>.md. Each task that works in an area cleans up its share. -->
| Area | Added to the backlog | Already there |
|------|---------------------:|--------------:|
| | | |

## Still open from earlier runs

<!-- ledger entries accepted or deferred and still there: C-n — one line — since when -->

## Measured

| What | Result | Command |
|------|--------|---------|
| <!-- tests --> | <!-- 412 pass · 7 min 10 s · slowest: … --> | |

## Not measured, not read

<!-- a tool the project does not have, and what it would have shown · files in no part · files a reader did not finish -->

## Raised and refuted

<!-- one line each: what a reader claimed, and the line that refutes it. n of n. -->
