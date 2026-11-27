# Rule: the sweep ledger — sweeps that converge instead of starting over

Read by `/forge-sweep` and `/forge-ux-sweep`, which keep one ledger together. Every tester, reviewer and fixer they spawn gets the entries of its feature or screen in its prompt.

**The problem.** A sweep run every night on the same code must look at everything, because exhaustive testing is what finds real bugs. But an agent with fresh eyes contradicts itself:

- it asks for a margin to grow, then to shrink;
- it re-raises a choice the human already settled;
- it re-asks yesterday's question in new words;
- it "improves" a screen that was already right.

Ten runs then rewrite the same UI ten times. The opposite failure is worse: a tool that learns to keep quiet ends up ignoring a real bug for good.

**The goal: test everything every run, change something only when there is a defect that holds still.** On unchanged code, once its defects are fixed, a run should find nothing to fix and say so in a few lines.

| File | What it holds | Who changes it |
|------|---------------|----------------|
| `docs/sweep-ledger.md` (template `forge/packs/core/templates/sweep-ledger.md`) | What was already looked at and settled: every fix with its reproduction (a **guard**), every decision, every judgement kept, every question asked. Each entry records the measurement at that moment and what would reopen it. | The sweeps, at close. The human edits any entry, and their edit wins. |
| `docs/ui-canon.md` (template `forge/packs/core/templates/ui-canon.md`) | What "consistent" means for this app: its scales, patterns and words, and its screens with their code paths and **fixed state matrix**. UI consistency is judged against the canon, not against the reviewer's taste. | The sweeps add to it. Changing an existing rule is a *Needs you* proposal. |
| `docs/features.md` | The feature map: which flows are walked, the same ones every run | `/forge-sweep` (drift), the human |

All three are committed.

## 1. The five mechanisms of convergence

1. **Fixed inputs.** The same run on the same code walks the same thing:
   - `commands.reset` before starting;
   - the map's flows and the canon's state matrix in their written order, at the canon's viewports;
   - the probe always with `--stable`;
   - records prefixed per tester.
   Exploration beyond that is welcome. It comes **after** the fixed part, and its findings meet the same bar.
2. **Guards replayed first.** Every `fixed` entry keeps its reproduction steps and its capture command. Before exploring, each run replays every guard of the features and screens it covers.
   - A guard that fails is a **regression**, one severity level higher.
   - A guard that passes costs one line in the report (`guards: 38 / 38`).
   This is the deterministic backbone: what was fixed is checked the same way every night.
3. **Reproduced twice, or it does not exist.** A finding counts only if a **second, independent run** shows it again: the verifier re-runs the steps, or the probe from a fresh browser, after `commands.reset` when the data matters.
   - Seen once and then not reproduced → listed under *flaky*: not counted, not fixed, and named with its steps.
   - A flaky finding seen again on a later night (3 sightings in total) becomes a finding: an intermittent bug is still a bug.
4. **Every fix aims at a fixed target.** A fix is automatic only when its **acceptance line** names an objective target:
   - a threshold ("contrast ≥ 4.5:1 in every state");
   - a canon value ("gap 16px like the other fields");
   - a behaviour that can be checked ("a second click does not create a second loan").
   A fix that reaches its target cannot be wanted again: the next run measures, finds the target met, and does nothing. A finding whose target is an opinion ("feels cramped", "would look better") **is never fixed automatically**. It goes under *Needs you* or becomes a suggestion. Either way it is recorded, so it is not proposed again.
5. **Never undo an earlier sweep.** Before committing a batch, the fixer checks `git blame` on the lines it changes.
   - It changes a line that an earlier `fix(sweep)` or `fix(ux-sweep)` commit wrote, in the opposite direction (a value going back, a rule removed) → the change is dropped. The finding goes under *Needs you*: `would undo S-n of <date> — which one is right?`.
   - It touches an element a `validated`, `decided` or `polished` entry covers → the same.
   - A real defect on a settled element is **not** blocked by this. It goes through the reopen triggers (§ 3), and its fix must keep the earlier entry's acceptance true.

## 2. Kinds of finding — not handled the same way

Ugly and hard to use are findings too. What changes from kind to kind is the evidence a finding needs before it counts, and what a fix needs before it is kept. Every finding has a kind: UI checks get theirs from the rubric (`forge/packs/core/skills/forge-ux-sweep/rubric.md`); a behaviour bug is a defect.

| Kind | Examples | Counts when | Fixed automatically when | Can the ledger silence it? |
|------|----------|-------------|--------------------------|----------------------------|
| **defect**: measured or plainly broken | data lost or duplicated, a failing flow, a crash, sideways scroll, clipped text, contrast under the threshold, no visible focus, an invisible state, no feedback, an off-canon value | reproduced twice | always, toward its threshold or canon value | **Never by an agent.** Fixed, or `deferred` by a human with a date. Once fixed, it is a **guard**. |
| **usability**: hard to use, measured by a task | a core task takes 9 steps for a target of 4; its start is below the fold; a dead end; an error that loses what was typed | the first-time persona's count is over target, twice | when the fix stays within the screen's existing layout and patterns (moving an action, a default, a shortcut, a clearer label); a new flow or a layout change goes to *Needs you* | Like a defect: never by an agent. Once fixed, the task count is the guard. |
| **judgement**: unclear | hierarchy, grouping, order, wording that misleads | **two independent reviewers** name the same fingerprint, in the same direction | when its acceptance line is objective ("one filled button in the view"); otherwise *Needs you* | Yes, once settled: `validated` or `decided`. Reopens only on the triggers below. |
| **polish**: looks unfinished or ugly, measured against the canon's **direction** | one-off shadows and radii, no focal point, a floating block, mixed icon sets, crude details | two independent reviewers agree, each naming the § P check and what in the direction it breaks | in `/forge-ux-sweep` only, at most one polish batch per screen per run, **kept only if a blind A/B judge prefers the after capture** | Yes: `polished` after a kept fix, `validated` when judged fine. Reopens only on the triggers below. |
| **preference**: style with no basis in the direction or in a user problem | another accent colour, another font, "more modern" | never; at most three suggestions | never (to act on one, change the direction) | Suggestion not taken up → `declined`, not proposed again. |

A finding cannot change kind to escape a rule. A measured failure filed as polish or preference is a defect, and main reclassifies it. A polish finding with no basis in the direction is a preference.

**Why beauty can be deterministic.** A single reviewer's taste moves from run to run. Three things in this table do not:
- the **direction**, written once in `docs/ui-canon.md` and changed only by the human;
- the **agreement of two reviewers** who did not see each other's work;
- the **blind A/B judge**: a fresh agent shown the before and after captures in random order, with only the direction and the check. It must prefer the after, or the batch is reverted.

A screen polished and preferred is recorded `polished` and left alone until a trigger reopens it. Ten runs do not restyle it ten times, and an ugly screen does not stay ugly.

## 3. Fingerprints, and what an entry does to a new finding

**Fingerprint:** `<feature or screen> · <element> · <check>`.

- The *element* is named by its role and visible name: `button "Pay now"`, `field "Email"`, `flow "return a loan"`, `page`. Never a CSS class or an index: a renamed class must neither reopen nor silence anything.
- The *check* is the rubric id or probe rule for UI, or a short name of the broken behaviour for a bug (`double-submit`, `stale-overwrite`).
- Viewport and state are recorded in the entry, but are not part of the fingerprint.

**Main applies the entries** after the testers return and before the report. The testers see the entries too, so they do not spend their budget re-arguing them. But main decides, so the mood of one reviewer does not.

1. **No entry** → `new`, or `still open` if the last report had it.
2. **`fixed`** (or **`polished`**) and the finding is back → **`regression`**, one level higher (cap Critical). A guard never silences.
3. **`validated`, `decided` or `polished`** → **silenced**. It is named under *Stability › silenced*, never dropped without a trace, **unless a trigger reopens it**:
   - **the code changed**: a file of that feature or screen (the canon's `code` / `uses`, or the map's entry point), or a shared style, token or component it uses, changed since the entry's commit, **and** the evidence shows that the element itself changed. A change elsewhere in the file reopens nothing;
   - **it got worse**: the measurement recorded in the entry is now worse;
   - **new evidence**: a viewport, state or real input the entry did not cover shows a problem it did not describe;
   - **severity**: the finding is now High or Critical. A validated Low never hides a High;
   - **expiry**: a `deferred` entry past its date, or a `validated` entry past its review date (12 months by default);
   - **direction changed**: for `polished` and polish `validated` entries, the canon's § Direction changed since the entry.
   A reopened finding has `since: reopened` and cites the entry and the trigger: `reopens L-12 — contrast 4.6 → 3.9`.
4. **`deferred`** (by a human, with a date) and not expired → still open, listed as deferred, and left out of the verdict.
5. **`declined`** (a suggestion) → not proposed again while the entry exists.
6. **`asked`** (a *Needs you* question) → **not asked again in new words**. It is listed under *Stability › waiting*, with its id and the date it was first asked. The human answers by editing the entry (`decided: …`) or by deleting it. A new question on the same thing cites the old id.

A check added in a new rubric version gives `since: new-rule`, not `regression`: the app did not get worse, the check is new.

## 4. What gets written at close

- **every finding fixed and verified** → `fixed`, with `reproduce`, `capture` and `acceptance`. This is its guard;
- **every polish batch the A/B judge preferred** → `polished`, with the after capture command and the direction it followed. A batch it did not prefer is reverted and recorded `validated` (looked at, kept as it was), so the same proposal is not made again on unchanged code;
- **every judgement finding the run looked at and kept** → `validated`, with the evidence that settled it;
- **every new *Needs you* question** → `asked`;
- **every human answer found since the last run** → turned into `decided` (or `deferred until <date>` when that is what they wrote);
- **every suggestion still not taken up at the next run** → `declined`.

An agent never writes `deferred`, and never writes `validated` for a defect.

## 5. Guards against a ledger that hides things

1. **Everything silenced is counted and named** in the report. A run that silenced more than it reported says so in its verdict line.
2. **Spot check every `/forge-ux-sweep`**: one reviewer works on 2 or 3 screens (the ones whose entries are the oldest, in rotation) with **no ledger and no previous report**.
   - It finds a defect under a `validated` entry → that entry was wrong. Remove it, and the finding stands.
   - Two such misses in one run → the report says the ledger needs the human's review.
3. **Defects are never silenced, the probe least of all**: a probe High or Medium is a finding, whatever a judgement entry on the same element says.
4. **Touched again**: every fix on an element the ledger had settled is listed under *Stability › touched again*, each with its reason (a trigger, a regression). The trend should go to zero. A list that keeps growing means the canon or the acceptance lines are wrong, and the report says so.
5. **Size**: past about 200 entries, prune the `fixed` entries whose feature or screen has not changed in 6 months (git keeps them). `decided`, `declined` and `asked` entries are kept.
