# Rule: execution contract

Single SSOT for ceremony, pilot budget, quality fan-out, multi-agent orchestration, and severity.

## Ceremony

**Ceremony is chosen per task by the orchestrator, from the risk of the work and the strength of the worker model — and raised during the run when the evidence calls for it.** The human can always force a level or say “more” / “less”.

**Why this shape** (measured 2026-11-10 on two small UI features, blind-judged, same fast worker model): acceptance criteria always pay. The probe gate costs seconds and removes the commonest UI defects. What still shipped broken was never badly written code — it was **flows nobody walked** (the button beside the new one, a save on an item deleted elsewhere, the keyboard) and **looks nobody measured**. Two testers that use the running app find those; a second reader of the diff mostly does not, and every extra agent costs 70–90k tokens. So the default spends its judges where the defects are.

### The three levels

| Human says | Stored in `task.md` | What runs |
|------------|---------------------|-----------|
| **`min`** | `lite` | Plan (acceptance criteria) → **Code** → Scrum. No judge. |
| **`normal`** | `standard` | Plan → Code → **judged once**: a screen created or changed → **the two testers in parallel** (flow test + UI review, both in the running app); no screen → **one Review** (reads the diff, runs the tests) → fix round if a judge fails → Scrum. Nothing else. |
| **`strict`** | `governed` | `standard` **plus the Review on screen tasks too, plus the lenses the task's signals match** (security, architecture, second correctness judge) → Scrum. |

Three levels, two spellings each: the short word the human types and the word stored in files. A human may also type the stored word. No other aliases.

### Choosing the starting level (`auto`, the default)

Pick the **lowest** row that fits, then apply the worker rule.

| The task is… | Start at |
|--------------|----------|
| A typo, rename, comment, doc or config tweak — no behaviour change | `lite` |
| A behaviour change, a UI change, data stored or exchanged, an API change | `standard` |
| Authentication or permissions, money, personal-data handling, a migration or other irreversible data operation, `visual_fidelity: pixel`, a public API contract, a structural change under a stack pack (new domain, new library) | `governed` — with the matching lenses only |

**Worker rule** — `forge/project.md` → `profiles.worker_tier`:

- `strong` (a top-tier model writes the code): a *small* behaviour change (one module, tests green, no UI) may start at `lite`.
- `fast` (a cheaper or faster model writes the code) **or not set**: never below `standard` for a behaviour change.

Visual references in scope (`visual_refs`) ⇒ at least `standard` (see Downgrade guard).

### Screen rule — the probe always, the two testers whenever a screen changes

| What the task does to the UI | What runs |
|------------------------------|-----------|
| Anything visible at all (even a label or a colour) | **Probe gate** — Code runs `forge/packs/visual-qa/tools/run-ui-probe.mjs` at each viewport: default state, after a rejected submit when there is a form, and with the longest valid input. High and Medium findings are fixed or justified in the handoff. Costs seconds, no extra agent. |
| Creates or changes a screen: layout, a component, a form, a state, a flow | Probe gate **+ the two testers**, spawned by main **in parallel**: the **flow tester** (`flow` lens → `forge/packs/core/skills/forge-flow-test/SKILL.md`) walks every flow of the screen — the new ones and their neighbours, each field, failures, keyboard — and runs the project's tests; the **UI reviewer** (`qa-ux` lens → `forge/packs/core/skills/forge-ui-review/SKILL.md`) judges what the screen looks like. What it does / how it looks: neither repeats the other. |
| A cosmetic retouch (wording, a colour, an icon — no layout or behaviour change) | Probe gate only. |

Main records the replies as `## Flow test round N` and `## UI review round N` in `review.md`. A High or Critical in either fails the round: **one** fix round covers the findings of both, then only the tester that failed runs again. At `governed` the UI reviewer also compares zone by zone with the references and enforces `pixel` baselines.

**No diff Review on a screen task at `standard`** — the testers judge the result, not the code. When something needs a reader (a tester replies `needs a code review: <what>`, or the diff is large or touches shared code), main spawns the Review once: that is a raise, not the default.

### Raising it during the run (evidence, not habit)

| What happened | What main does |
|---------------|----------------|
| Code returns with red tests, a failed Self-check, or blocking questions | at least `standard` from here |
| A judge **FAILs** | fix round by the author, **resumed** (fresh only when it cannot be — `forge/packs/core/skills/forge-pilot/SKILL.md` § C), main runs the full checks once, then that judge again — fresh |
| Every judge passes but **Medium** findings for `code` are open | one fix round for them, automatically — **not judged again** (Code's Self-check and probe gate stand); Lows become follow-ups |
| A tester says `needs a code review`, or a judge **could not verify** something (app would not run, a security or structural doubt) | spawn the Review or the lens for that area once; stop for the human if the app cannot be run at all |
| A judge finds a High or Critical in an area a lens owns (security, architecture) | after the fix, spawn that lens once |
| A second FAIL on the same task | `governed` for the rest of the task (then the auto-debug rules below) |

Ceremony only goes up within a task. Main never lowers it to save tokens after a problem appeared.

### Saying what was decided

Announce once, with the reason and what is deliberately skipped — the human should be able to disagree in one word:

```text
🧩 Ceremony (auto): standard — screen change, fast worker → flow test + UI review in the running app
   skipped: diff review, security lens (nothing sensitive stored)
   say “more” for the review and lenses, “less” for no judge
```

Persist in `task.md`: `ceremony: lite|standard|governed` and `ceremony_reason:` (one line). Record `ceremony_override: min|normal|strict` when the human forced it. A raise during the run is appended to `ceremony_reason` (`→ review: tester asked for a code review`).

**Resolution (first match):** (1) explicit word in the human's message → (2) task meta → (3) `profiles.ceremony_default` when it names a level → (4) auto, as above.

### Downgrade guard

`visual_refs` non-empty, or UI files with fidelity ≠ `none` → never `lite`. A human `min` on such a task is refused with one line: `UI refs ⇒ normal minimum (min ignored)`. Raising is always allowed.

Accepted on `/forge`, `/forge-plan`, `/forge-pilot`, `/forge-debug` (default lite), `/forge-review`. `/forge-light` forces `lite` and adds one light tester, within the downgrade guard. No fourth level.

## Pilot budget

| Constraint | Limit |
|------------|-------|
| Parallel Tasks at once | **≤ 3** (lenses included) |
| Judge ↔ Code rounds | **3** per task |
| Unattended queue length | **≤ 5** tasks (`depends-on.md`) |

- **`lite`:** Code → Scrum on main. **No** judge, **No** Quality coordinator. Code's Self-check (tests run, evidence per AC) is the only gate — which is why it is reserved for no-behaviour changes, or small ones by a strong worker.
- **`standard`:** Code → the two testers (screen) **or** the Review (no screen) → Scrum on main.
- **`governed` (`strict`):** Code → testers (screen) + Review → lenses by signal (≤3 per wave) → Scrum on main. Delta-spec when on the feature.

Announce: `🧩 Pilot budget: ceremony=standard judges=flow,qa-ux parallel=2`.

## Judges and lenses

Author ≠ judge. Code checks its own work (`notes.md` § Self-check); every judge is a **fresh Task spawned by main** that returns its findings; main records them in `review.md` and never judges in a judge's place nor softens a finding. Critical or High = FAIL.

### What every judge returns

One reply to main, no file in the repo (the UI reviewer also saves its screenshots; the Review appends its own round to `review.md`):

1. **Verdict** `pass | fail` — fail if any finding is Critical or High.
2. **Findings**, ≤7 (flow tester ≤10), in the columns of `forge/packs/core/templates/review.md` (Severity, Blocks merge?, For = `code` or `human`, Finding, Evidence).
3. **Checked and found correct** — a few lines (the flow tester: its flow table), so a pass is more than an empty table.

A judge works on the tree at the commit main names. It may run tests and throwaway commands to prove a point and leaves nothing in the repo. Checklist items that do not apply to this diff are skipped silently.

- **Already in the journal:** an open follow-up recorded in `epics/decisions.md` is not re-reported — mention it under *Checked* as `still open (journal <date>)`. If this diff makes it worse, it is a finding again: say what changed.
- **Already in the code ledger:** an `open`, `accepted` or `deferred` entry of the area's file in `docs/code-ledger/` on a file you read is not re-reported — `still open (code ledger C-<n>)` under *Checked*. If this diff makes it worse, or walks through it without saying so, it is a finding.
- **Backlog picked up** (listed in the Code handoff, `forge/packs/core/personas/code.md` § 3): judged like the rest of the diff. One that changes what a user sees, widens the task, or is more than a small fix → a finding; the remedy is to take it out, not to grow the task.
- **Two ACs that contradict each other** on the point you judge: a `human` finding naming both, not a `code` defect.

### Catalogue (`forge/packs/core/personas/lenses/`, Review: `forge/packs/core/personas/review.md`)

| Judge | Spawn when |
|-------|------------|
| **flow** (flow tester) | `standard` and up, a screen is created or changed (§ Screen rule) |
| **qa-ux** (UI reviewer) | same — in parallel with the flow tester; at `governed` adds the zone-by-zone comparison with references |
| **Review** (reads the diff) | `standard` when no screen is involved; `governed` always; or when raised. It applies the correctness checklist itself — **do not** spawn a separate correctness lens below `governed` |
| **security** | `governed`, or raised: auth, permissions, secrets, PII, money, uploads; a new dependency; a new network call or external URL |
| **architecture** | `governed`: angular/java pack + structural or API change |
| **correctness** | `governed` only — a second, independent correctness judge for high-risk work |
| **dry** | `governed`: new helpers/utils across several files — first to be deferred when slots are short |

**Never** spawn them all “just in case”. At `governed` with visual references the UI reviewer is not optional, and missing visual evidence is Critical.

## Multi-agent

**Main = orchestrator.** Workers = Task subagents with fresh context.

**No nested spawns:** every worker is spawned by main. A worker never spawns another worker — whether a host allows it depends on its version and settings (often off by default), and where it is off the inner agents silently do not run. Roles that only coordinate (picking lenses, Scrum) are checklists main runs itself.

| Command | Must spawn |
|---------|------------|
| `/forge` | Nothing by default: Orient is done **on main** when the area is small or already mapped. Orient Task when it is large or unknown; Ground only when Orient could not verify types/APIs; product panel when `complex`. |
| `/forge-pilot` | Code → the judges of the level (§ Ceremony) → **Scrum on main** (`forge/packs/core/skills/forge-pilot/scrum-worker.md` checklist — **do not** spawn a Scrum Task). FAIL → fresh Code → the judge that failed (max 3). After **2** FAILs → **auto-debug** (below) before round 3. Feature queue: `depends-on.md` § Unattended. |
| `/forge-explore` | Explorer Task for heavy sweeps (recommended). |
| `/forge-debug` | Fresh reproduce → root-cause → minimal fix (also used as auto-debug hop). |

### Auto-debug after 2 rejects

One FAIL counter per task, whichever judge failed (`lite` has no judge — a failed Self-check raises it to `standard`):

```text
FAIL 1 → Code fix (author resumed) → judge again (fresh)
FAIL 2 → Debug Task (auto) → a fresh Code agent applies the patch → round 3 judge
FAIL 3 → human (never a 4th round, never a 2nd auto-debug on the same task)
```

The Debug hop (once per task):

1. Spawn a **fresh** Debug Task following the `/forge-debug` procedure. It **inherits the task's `ceremony` and `visual_*`** — a UI+refs task keeps the visual evidence bar; never `lite` by default.
2. Announce: `Spawning agent: Debug (auto after 2 rejects)…`
3. Debug writes `notes.md` § Debug (repro, root cause, verify) + minimal patch. Round-3 Code must address that written root cause (with or without the patch).
4. Human may say `skip auto-debug` (then round 3 is a plain Code hop).

Before each Task: `Spawning agent: <Role or lens>…`.

### Model inheritance (subagents)

**Default: inherit the parent chat's model.** Do not pass a different `model` when spawning a Task/subagent unless the human or `forge/project.md` opted in.

Why: on some hosts (notably Cursor), the model you picked for the session (e.g. Grok 4.5 / Composer 2.5) sits on a plan with a large token pool. Silently routing Orient/Code/Review/Quality to another (often "fast"/cheap) model burns a different quota and usually yields worse workers — false economy.

| Source | Behaviour |
|--------|-----------|
| Default / `profiles.subagent_model: inherit` (or key absent) | **Omit** the Task `model` parameter (or pass `'inherit'` where the host exposes an explicit inherit option, e.g. Antigravity `invoke_subagent`) so the host keeps the parent model |
| `profiles.subagent_model: <host-slug>` | Pass that slug on every Forge spawn (host-specific id — never invent) |
| Human says "use X for workers" this turn | That overrides `project.md` for this invocation only |

Announce when non-inherit: `🧩 Model: <slug>`. Inherit → no model line needed.

**Forbidden:** picking a cheaper/faster model "to save tokens", "for Orient only", or because the role looks light. Token economy is the human's plan choice, not the agent's.

If the host still runs a different model despite omit (harness auto-route), note it once in the spawn announce — do not "fix" it by guessing another slug.

### Subagent return contract (context firewall)

Every worker returns **≤15 lines** + **artefact path** to main. Detail lives in the written file — never paste pack architecture into chat.

### Reply shapes

Main chat stays thin; artefacts hold detail.

- **Orchestrator chat:** ≤5 lines + one **Next:** line (command or human gate).
- **Workers:** ≤15 lines + artefact path (above). Per-role one-liners in chat are OK (`Orient done → notes.md § Orient`).
- **Never** paste full pack architecture, long diffs, or full test logs into chat — cite paths.

## Severity & loops

| Level | Examples | Action |
|-------|----------|--------|
| **Critical** | Leaked secret, broken authentication/authz, injection path, unrecoverable data loss, **duplicate domain logic**, **ignored visual reference when fidelity required**, broken AC | **FAIL** |
| **High** | Major arch/security wrong, missing required tests, **major visual deviation**, broken output chain | **FAIL** |
| **Medium** | Missing unhappy-path test, incomplete i18n, minor DRY, a wrong result in an uncommon flow | Does not fail the round, but **is fixed before close** (one fix round, not re-judged) unless the fix widens the task |
| **Low** | Naming nit | Tech-debt note — not a full round alone |

**Weigh reach as well as impact.** The examples give the impact; the level also depends on how the defect is reached. On a normal path, or usable by anyone → the level shown. Same impact but only under unusual conditions (two tabs, a manually edited store, a rare race, a slip such as a double click in a narrow zone, a viewport or input outside what the task lists) → one level lower, and say why in the finding. Each further independent unusual condition lowers it one more level; data loss never goes below Medium.  
**“Blocker”** anywhere in Forge = a finding with `blocks merge? yes`, i.e. Critical or High.

Cross-lens agreement → promote one level (cap Critical). FAIL 2 → auto-debug hop (state machine above); round 3 still FAIL → human. Judges document; Code fixes; main records.

## Never

- Classify UI+refs as `lite`, or pass UI with mockup refs and no evidence
- Lower the ceremony after a problem appeared, or skip a raise the evidence called for
- Skip the two testers on a task that creates or changes a screen (from `standard` up)
- One main agent implementing and judging alone, or main judging in place of a judge
- Run every task at `governed` by habit, or spawn every lens without signals
- Spawn a worker from inside a worker (nested spawn)
- Accept a tester's verdict built on the author's screenshots or notes alone
- Loop past the caps
- Spawn workers on a cheaper/faster model without human or `project.md` opt-in
